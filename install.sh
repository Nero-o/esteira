#!/usr/bin/env bash
#
# Bootstrap da esteira multi-IA no OpenCode.
#
#   Maquina nova:   curl -fsSL <RAW_URL>/install.sh | bash -s -- --repo <URL_DO_REPO>
#   Ja clonado:     bash ~/.esteira/install.sh
#   Atualizar:      esteira sync
#
# Idempotente: rode quantas vezes quiser, em Linux, WSL ou macOS.

set -euo pipefail

# Preencha uma vez com o seu repo e nunca mais pense nisso.
ESTEIRA_REPO_DEFAULT=""

ESTEIRA_REPO="${ESTEIRA_REPO:-$ESTEIRA_REPO_DEFAULT}"
ESTEIRA_HOME="${ESTEIRA_HOME:-$HOME/.esteira}"
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
BIN_DIR="$HOME/.local/bin"
SKIP_CLIS=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)       ESTEIRA_REPO="$2"; shift 2 ;;
    --skip-clis)  SKIP_CLIS=1; shift ;;
    -h|--help)    sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)            echo "flag desconhecida: $1" >&2; exit 2 ;;
  esac
done

if [[ -t 1 ]]; then
  B=$'\033[1m'; G=$'\033[32m'; Y=$'\033[33m'; R=$'\033[31m'; D=$'\033[2m'; Z=$'\033[0m'
else
  B=""; G=""; Y=""; R=""; D=""; Z=""
fi
ok()   { echo "${G}  ok${Z}  $*"; }
info() { echo "${D}   ·${Z}  $*"; }
warn() { echo "${Y}  ->${Z}  $*"; }
die()  { echo "${R}erro${Z}  $*" >&2; exit 1; }
step() { echo; echo "${B}$*${Z}"; }

has() { command -v "$1" >/dev/null 2>&1; }

# ---------------------------------------------------------------- 1. repo ----
step "1/6  repositorio"

if [[ -d "$ESTEIRA_HOME/.git" ]]; then
  if [[ -z "$(git -C "$ESTEIRA_HOME" remote 2>/dev/null)" ]]; then
    warn "repo local sem remote — 'git -C $ESTEIRA_HOME remote add origin <url>' para sincronizar entre maquinas"
  elif git -C "$ESTEIRA_HOME" pull --ff-only --quiet 2>/dev/null; then
    ok "atualizado  $ESTEIRA_HOME"
  else
    warn "pull falhou (offline ou mudancas locais) — seguindo com o que tem em disco"
  fi
elif [[ -d "$ESTEIRA_HOME" && -f "$ESTEIRA_HOME/opencode/opencode.jsonc" ]]; then
  ok "usando copia local em $ESTEIRA_HOME (ainda sem remote)"
else
  has git || die "git nao encontrado"
  [[ -n "$ESTEIRA_REPO" ]] || die "informe o repo:  --repo https://github.com/Nero-o/esteira.git"
  git clone --quiet "$ESTEIRA_REPO" "$ESTEIRA_HOME" || die "falha ao clonar $ESTEIRA_REPO"
  ok "clonado em $ESTEIRA_HOME"
fi

[[ -f "$ESTEIRA_HOME/opencode/opencode.jsonc" ]] \
  || die "$ESTEIRA_HOME nao parece a esteira (falta opencode/opencode.jsonc)"

# ------------------------------------------------------------ 2. opencode ----
step "2/6  opencode (o maestro)"

if has opencode; then
  ok "ja instalado  $(opencode --version 2>/dev/null)"
elif has npm; then
  npm install -g opencode-ai >/dev/null 2>&1 && ok "instalado via npm  $(opencode --version 2>/dev/null)"
else
  curl -fsSL https://opencode.ai/install | bash >/dev/null 2>&1
  export PATH="$HOME/.opencode/bin:$PATH"
  has opencode && ok "instalado via installer oficial" || die "falhou instalar o opencode"
fi

# ---------------------------------------------------------------- 3. clis ----
step "3/6  CLIs da ponte (codex + claude)"

if [[ "$SKIP_CLIS" == "1" ]]; then
  info "pulado (--skip-clis)"
else
  if has claude; then
    ok "claude  $(claude --version 2>/dev/null | head -1)"
  else
    warn "instalando claude code..."
    curl -fsSL https://claude.ai/install.sh | bash >/dev/null 2>&1 || true
    has claude && ok "claude instalado" || warn "instale manualmente: curl -fsSL https://claude.ai/install.sh | bash"
  fi

  if has codex; then
    ok "codex   $(codex --version 2>/dev/null | head -1)"
  elif has npm; then
    warn "instalando codex..."
    npm install -g @openai/codex >/dev/null 2>&1 || true
    has codex && ok "codex instalado" || warn "instale manualmente: npm i -g @openai/codex"
  else
    warn "sem npm — instale o codex manualmente: npm i -g @openai/codex"
  fi
fi

# --------------------------------------------------------------- 4. link -----
step "4/6  ligando a config"

mkdir -p "$(dirname "$CONFIG_DIR")"

if [[ -L "$CONFIG_DIR" ]]; then
  alvo="$(readlink -f "$CONFIG_DIR")"
  if [[ "$alvo" == "$(readlink -f "$ESTEIRA_HOME/opencode")" ]]; then
    ok "symlink ja aponta para a esteira"
  else
    ln -sfn "$ESTEIRA_HOME/opencode" "$CONFIG_DIR"
    ok "symlink reapontado (era $alvo)"
  fi
elif [[ -e "$CONFIG_DIR" ]]; then
  # Config gerada pelo proprio opencode no primeiro run nao tem agentes nem
  # comandos — nao vale um backup, so vira lixo em toda maquina nova.
  if [[ ! -d "$CONFIG_DIR/agents" && ! -d "$CONFIG_DIR/commands" && ! -d "$CONFIG_DIR/agent" ]]; then
    rm -rf "$CONFIG_DIR"
    ln -sfn "$ESTEIRA_HOME/opencode" "$CONFIG_DIR"
    ok "config default do opencode substituida pela esteira"
  else
    backup="$CONFIG_DIR.bak-$(date +%Y%m%d%H%M%S)"
    mv "$CONFIG_DIR" "$backup"
    ln -sfn "$ESTEIRA_HOME/opencode" "$CONFIG_DIR"
    ok "config antiga salva em $backup"
  fi
else
  ln -sfn "$ESTEIRA_HOME/opencode" "$CONFIG_DIR"
  ok "symlink criado"
fi

chmod +x "$ESTEIRA_HOME/opencode/bin/"*.sh 2>/dev/null || true

mkdir -p "$BIN_DIR"
ln -sfn "$ESTEIRA_HOME/bin/esteira" "$BIN_DIR/esteira"
chmod +x "$ESTEIRA_HOME/bin/esteira" 2>/dev/null || true
ok "comando 'esteira' em $BIN_DIR"

case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *) warn "adicione ao seu shell rc:  export PATH=\"\$HOME/.local/bin:\$PATH\"" ;;
esac

# ------------------------------------------------------------ 5. validar -----
step "5/6  validando"

if out="$(opencode agent list 2>&1)"; then
  n="$(printf '%s\n' "$out" | grep -cE '^[a-z-]+ \((primary|subagent|all)\)' || true)"
  ok "config valida — $n agentes carregados"
  printf '%s\n' "$out" | grep -E '^(arquiteto|mapeador|cetico|executor|revisor) \(' | sed 's/^/       /'
else
  echo "$out" | head -5
  die "config invalida"
fi

# --------------------------------------------------------------- 6. auth -----
step "6/6  credenciais (unica coisa que nao viaja no git)"

AUTH="$HOME/.local/share/opencode/auth.json"
logados=""
[[ -f "$AUTH" ]] && logados="$(grep -oE '"[a-z0-9_-]+"[[:space:]]*:[[:space:]]*\{' "$AUTH" | tr -d '":{ ' | tr '\n' ' ')"

falta=0

# O maestro do opencode. O Claude NAO entra aqui como provider: a assinatura
# Pro/Max so vale no Claude Code, entao ele entra pela ferramenta 'claude'.
if [[ " $logados " == *" openai "* ]]; then
  ok "openai logado (maestro)"
else
  warn "opencode providers login -p openai"
  info "sem assinatura ChatGPT? aponte os agentes para opencode/glm-5-free (Zen)"
  falta=1
fi

# Os CLIs carregam o peso do raciocinio — cada um com o proprio login.
for c in claude codex; do
  has "$c" && info "rode '$c' uma vez para logar, se ainda nao fez" || true
done

echo
if [[ "$falta" == "1" ]]; then
  echo "${B}Falta so o login acima.${Z} Depois: ${B}cd <projeto> && opencode${Z} e rode ${B}/plano${Z}."
else
  echo "${B}Tudo pronto.${Z}  cd <projeto> && opencode  ->  /plano  /duelo  /revisar"
fi
