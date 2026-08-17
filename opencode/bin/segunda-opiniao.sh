#!/usr/bin/env bash
# Pergunta a mesma coisa para o Codex CLI e o Claude Code CLI, em paralelo,
# em modo somente-leitura, e imprime as duas respostas lado a lado.
#
# Uso: segunda-opiniao.sh "pergunta" [diretorio] [timeout_segundos]
#
# Usa as assinaturas que voce ja paga (ChatGPT / Claude), nao API avulsa,
# e cada CLI entra com as proprias skills, regras e MCPs.

set -uo pipefail

PERGUNTA="${1:-}"
DIR="${2:-$PWD}"
TIMEOUT="${3:-420}"

if [[ -z "$PERGUNTA" ]]; then
  echo "uso: segunda-opiniao.sh \"pergunta\" [diretorio] [timeout_segundos]" >&2
  exit 2
fi

OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT

MOLDURA="Responda de forma direta e fundamentada. Cite arquivo:linha para cada
afirmacao sobre o codigo. Se nao tiver certeza, diga o que falta verificar.
Nao altere nenhum arquivo. Maximo 400 palavras.

PERGUNTA:
$PERGUNTA"

# --- Codex (GPT) -------------------------------------------------------------
if command -v codex >/dev/null 2>&1; then
  (
    cd "$DIR" || exit 1
    timeout "$TIMEOUT" codex exec \
      --sandbox read-only \
      --skip-git-repo-check \
      --ephemeral \
      --color never \
      -o "$OUT/codex.md" </dev/null \
      "$MOLDURA" >"$OUT/codex.log" 2>&1
    echo $? > "$OUT/codex.rc"
  ) &
  PID_CODEX=$!
else
  PID_CODEX=""
  echo "codex CLI nao encontrado no PATH" > "$OUT/codex.md"
fi

# --- Claude Code -------------------------------------------------------------
if command -v claude >/dev/null 2>&1; then
  (
    cd "$DIR" || exit 1
    timeout "$TIMEOUT" claude -p "$MOLDURA" \
      --permission-mode plan </dev/null >"$OUT/claude.md" 2>"$OUT/claude.log"
    echo $? > "$OUT/claude.rc"
  ) &
  PID_CLAUDE=$!
else
  PID_CLAUDE=""
  echo "claude CLI nao encontrado no PATH" > "$OUT/claude.md"
fi

[[ -n "$PID_CODEX"  ]] && wait "$PID_CODEX"
[[ -n "$PID_CLAUDE" ]] && wait "$PID_CLAUDE"

mostrar() {
  local nome="$1" arq="$2" rc_arq="$3" log="$4"
  local rc; rc="$(cat "$rc_arq" 2>/dev/null || echo "?")"
  echo "## $nome"
  echo
  if [[ -s "$arq" ]]; then
    cat "$arq"
  elif [[ "$rc" == "124" ]]; then
    echo "_(estourou o timeout de ${TIMEOUT}s)_"
  else
    echo "_(sem resposta — exit $rc)_"
    [[ -s "$log" ]] && { echo; echo '```'; tail -15 "$log"; echo '```'; }
  fi
  echo
}

echo "# Segunda opiniao — \"$PERGUNTA\""
echo
echo "_dir: ${DIR}_"
echo
mostrar "Codex CLI (GPT)"       "$OUT/codex.md"  "$OUT/codex.rc"  "$OUT/codex.log"
echo "---"
echo
mostrar "Claude Code CLI"       "$OUT/claude.md" "$OUT/claude.rc" "$OUT/claude.log"
