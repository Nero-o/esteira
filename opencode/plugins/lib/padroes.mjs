// Padroes dos guardrails da esteira.
//
// JavaScript puro de proposito: assim `node` importa direto e a matriz de testes
// roda sem subir o OpenCode. Falso positivo aqui e o pior defeito possivel — e o
// que faz alguem desligar o guardrail inteiro — entao cada padrao exige forma
// especifica e comprimento minimo, nunca so o prefixo.

// ---------------------------------------------------------------- caminhos ---

// Arquivos de exemplo sao publicos por definicao e precisam continuar legiveis.
const EXEMPLO = /\.(example|examples|sample|template|dist|tpl)$|(^|[./])example[s]?\./i

/** @type {{nome: string, re: RegExp}[]} */
export const CAMINHOS_SEGREDO = [
  { nome: "arquivo .env", re: /(^|\/)\.env(\.|$)/i },
  { nome: "chave privada", re: /\.(pem|p12|pfx|jks|keystore)$/i },
  { nome: "chave SSH", re: /(^|\/)id_(rsa|dsa|ecdsa|ed25519)$/ },
  { nome: "diretorio .ssh", re: /(^|\/)\.ssh\// },
  { nome: "credencial AWS", re: /(^|\/)\.aws\/(credentials|config)$/ },
  { nome: "netrc/npmrc/pypirc", re: /(^|\/)\.(netrc|npmrc|pypirc)$/ },
  { nome: "service account", re: /(^|\/)(service[-_]account|gcp[-_]key)[^/]*\.json$/i },
  { nome: "arquivo de segredos", re: /(^|\/)secrets?\.(ya?ml|json|toml|env)$/i },
  { nome: "keychain/cofre", re: /(^|\/)(\.vault-token|\.gnupg\/)/ },
]

/**
 * @param {string} caminho
 * @returns {string | null} nome do padrao, ou null se liberado
 */
export function caminhoSensivel(caminho) {
  if (typeof caminho !== "string" || !caminho) return null
  const p = caminho.replace(/\\/g, "/")
  const base = p.split("/").pop() || ""

  // `.env.example`, `secrets.sample.yml` e afins passam.
  if (EXEMPLO.test(base)) return null
  // Chave publica nao e segredo.
  if (/\.pub$/.test(base)) return null

  for (const { nome, re } of CAMINHOS_SEGREDO) if (re.test(p)) return nome
  return null
}

// ---------------------------------------------------------------- segredos ---

// Placeholders de documentacao que NAO sao vazamento.
const PLACEHOLDER =
  /^(pass(word)?|senha|secret|token|xxx+|\*+|changeme|your[-_]?\w*|<[^>]*>|\$\{[^}]*\}|\$[A-Z_]+)$/i

/** @type {{nome: string, re: RegExp}[]} */
export const PADROES_SEGREDO = [
  { nome: "chave Anthropic", re: /\bsk-ant-[A-Za-z0-9_-]{20,}/ },
  { nome: "chave OpenAI", re: /\bsk-(proj-)?[A-Za-z0-9_-]{32,}/ },
  { nome: "token GitHub", re: /\bgh[pousr]_[A-Za-z0-9]{36,}/ },
  { nome: "PAT GitHub", re: /\bgithub_pat_[A-Za-z0-9_]{50,}/ },
  { nome: "access key AWS", re: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { nome: "chave Google", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { nome: "token Slack", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/ },
  { nome: "chave Stripe", re: /\b[sr]k_live_[0-9a-zA-Z]{20,}/ },
  { nome: "bloco de chave privada", re: /-----BEGIN[A-Z ]*PRIVATE KEY-----/ },
  {
    nome: "JWT",
    re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  },
  { nome: "Bearer token", re: /\bBearer\s+[A-Za-z0-9_\-.=]{30,}/ },
]

/**
 * Connection string com senha real embutida. Tratada a parte porque o placeholder
 * (`postgres://user:password@host`) e comum em README e nao pode bloquear.
 * @param {string} texto
 */
function connectionStringComSenha(texto) {
  const re = /\b[a-z][a-z0-9+.-]*:\/\/([^\s:/@]+):([^\s:/@]{3,})@[^\s/]+/gi
  let m
  while ((m = re.exec(texto)) !== null) {
    const senha = m[2]
    if (!PLACEHOLDER.test(senha)) return "connection string com senha"
  }
  return null
}

/**
 * @param {string} texto
 * @returns {string | null} nome do padrao, ou null se limpo
 */
export function segredoEmTexto(texto) {
  if (typeof texto !== "string" || !texto) return null
  for (const { nome, re } of PADROES_SEGREDO) if (re.test(texto)) return nome
  return connectionStringComSenha(texto)
}

// -------------------------------------------------------------------- bash ---

/** @type {{nome: string, re: RegExp}[]} */
export const PADROES_BASH = [
  { nome: "rm recursivo na raiz ou no home", re: /\brm\s+(-\w+\s+)*-\w*[rR]\w*f?\w*\s+(\/|~|\$HOME)(\s|$|\*)/ },
  { nome: "download executado direto", re: /\b(curl|wget)\b[^|;]*\|\s*(sudo\s+)?(ba|z|k)?sh\b/ },
  { nome: "chmod 777", re: /\bchmod\s+(-\w+\s+)*777\b/ },
  { nome: "push forcado", re: /\bgit\s+push\b[^;|]*\s(--force(?!-with-lease)|-f)\b/ },
  { nome: "historico do git reescrito", re: /\bgit\s+(filter-branch|filter-repo)\b/ },
]

/**
 * @param {string} comando
 * @returns {string | null}
 */
export function bashPerigoso(comando) {
  if (typeof comando !== "string" || !comando) return null
  for (const { nome, re } of PADROES_BASH) if (re.test(comando)) return nome
  return null
}

/**
 * Exfiltracao: o comando fala com a rede E cita um arquivo de segredo.
 * Nenhum dos dois isolado bloqueia — juntos, bloqueiam.
 * @param {string} comando
 */
export function bashExfiltra(comando) {
  if (typeof comando !== "string" || !comando) return null
  const rede = /\b(curl|wget|nc|ncat|scp|rsync|ftp)\b/.test(comando)
  if (!rede) return null
  for (const bruto of comando.split(/[\s'"=,]+/)) {
    // `-d @.env`, `<.env`, `(cat .env)` — o caminho vem colado em pontuacao.
    const token = bruto.replace(/^[@<>(){}[\]|&;$]+/, "").replace(/[)>;,|&]+$/, "")
    if (caminhoSensivel(token)) return "arquivo de segredo indo para a rede"
  }
  return null
}
