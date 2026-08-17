// Decisao dos guardrails, separada do plugin para ser testavel sem subir o
// OpenCode. O plugin so traduz o retorno em `throw`.

import { caminhoSensivel, segredoEmTexto, bashPerigoso, bashExfiltra } from "./padroes.mjs"

// Ferramentas cujo argumento deixa o processo do opencode.
export const SAI_DO_PROCESSO = new Set(["claude", "codex", "webfetch"])

// Chaves de argumento que carregam caminho de arquivo.
const CHAVE_CAMINHO = /^(file_?path|path|filename|dir|directory|include|glob|pattern)$/i

const ESCAPE = "Falso positivo? Rode com ESTEIRA_GUARDRAILS=off opencode"

const REDE = /\b(curl|wget|nc|ncat|scp|rsync|ftp|ssh)\b/

/** @param {Record<string, unknown>} args */
function valores(args, filtro) {
  const out = []
  for (const [k, v] of Object.entries(args ?? {})) {
    if (filtro && !filtro.test(k)) continue
    if (typeof v === "string") out.push(v)
    else if (Array.isArray(v)) for (const i of v) if (typeof i === "string") out.push(i)
  }
  return out
}

/**
 * @param {string} tool
 * @param {Record<string, unknown>} args
 * @returns {string | null} motivo do bloqueio, ou null se liberado
 */
export function verificarChamada(tool, args = {}) {
  // -- Camada A: segredo em disco --------------------------------------------
  for (const c of valores(args, CHAVE_CAMINHO)) {
    const achado = caminhoSensivel(c)
    if (achado) {
      return (
        `[guardrail] bloqueado: ${achado} em "${c}".\n` +
        `Segredo nao entra no contexto de um agente. Use o arquivo de exemplo ` +
        `(.env.example) ou referencie o NOME da variavel.\n${ESCAPE}`
      )
    }
  }

  // -- Camada C: shell destrutivo ou exfiltrante -----------------------------
  if (tool === "bash") {
    const cmd = String(args.command ?? "")

    const perigo = bashPerigoso(cmd)
    if (perigo) return `[guardrail] bloqueado: ${perigo}.\n${ESCAPE}`

    const exfil = bashExfiltra(cmd)
    if (exfil) {
      return (
        `[guardrail] bloqueado: ${exfil}.\n` +
        `O comando fala com a rede e cita um arquivo de segredo.\n${ESCAPE}`
      )
    }

    // Segredo literal so importa quando o comando sai para a rede — senao um
    // `export API_KEY=...` local viraria bloqueio inutil.
    if (REDE.test(cmd)) {
      const seg = segredoEmTexto(cmd)
      if (seg) {
        return (
          `[guardrail] bloqueado: ${seg} em comando de rede.\n` +
          `Passe o segredo por variavel de ambiente, nunca literal.\n${ESCAPE}`
        )
      }
    }
  }

  // -- Camada B: segredo saindo do processo ----------------------------------
  // A razao de existir do resto: `claude` e `codex` sobem outro processo e
  // `webfetch` fala com a internet. O que passa aqui saiu do seu controle.
  if (SAI_DO_PROCESSO.has(tool)) {
    for (const t of valores(args)) {
      const seg = segredoEmTexto(t)
      if (seg) {
        return (
          `[guardrail] bloqueado: ${seg} indo para "${tool}".\n` +
          `Isso sairia deste processo. Refaca a chamada citando o NOME da ` +
          `variavel ou o caminho do arquivo — o CLI le por conta propria.\n${ESCAPE}`
        )
      }
    }
  }

  return null
}
