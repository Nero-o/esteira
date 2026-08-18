// Decisao dos guardrails, separada do plugin para ser testavel sem subir o
// OpenCode. O plugin so traduz o retorno em `throw`.

import {
  caminhoSensivel,
  segredoEmTexto,
  bashPerigoso,
  bashExfiltra,
  textoCitaSegredo,
  redigirSegredos,
} from "./padroes.mjs"

// Ferramentas cujo argumento deixa o processo do opencode.
export const SAI_DO_PROCESSO = new Set(["claude", "codex", "webfetch"])

// `task` fica no processo, mas um segredo no prompt de um subagente so espera
// a proxima ferramenta para vazar. Varre igual.
const VARRE_SEGREDO = new Set([...SAI_DO_PROCESSO, "task"])

// Chaves de argumento que carregam caminho de arquivo.
const CHAVE_CAMINHO =
  /^(file|files|file_?path|file_?paths|path|paths|filename|dir|directory|include|glob|pattern|target|source|src|dest|destination)$/i

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

  // -- Camada A2: caminho embutido em texto grande ---------------------------
  // `apply_patch` (a ferramenta de escrita dos modelos OpenAI) carrega o caminho
  // dentro do corpo do patch, nao num argumento de caminho — passava batido.
  if (tool === "apply_patch" || tool === "patch") {
    for (const t of valores(args)) {
      const achado = textoCitaSegredo(t)
      if (achado) {
        return (
          `[guardrail] bloqueado: patch mexendo em ${achado}.\n` +
          `Agente nao escreve em arquivo de segredo.\n${ESCAPE}`
        )
      }
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

    // Sem isto, `cat .env` contorna a Camada A inteira: la a checagem olha
    // argumento de caminho, e o argumento do bash e uma string de comando.
    const toca = textoCitaSegredo(cmd)
    if (toca) {
      return (
        `[guardrail] bloqueado: ${toca} citado em comando de shell.\n` +
        `Ler segredo por bash contorna a protecao de caminho. Use o arquivo de ` +
        `exemplo, ou referencie o NOME da variavel.\n${ESCAPE}`
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
  if (VARRE_SEGREDO.has(tool)) {
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

/**
 * Camada D — varredura da SAIDA.
 *
 * As camadas anteriores olham o que entra. Esta olha o que volta: um CLI pode
 * ser mandado ler um segredo com um prompt perfeitamente limpo, e o valor
 * voltaria direto para o contexto do agente.
 *
 * Redige em vez de bloquear: a resposta costuma ser util, o valor e que nao pode
 * entrar.
 *
 * @param {string} tool
 * @param {string} saida
 * @returns {string | null} saida redigida, ou null se nada mudou
 */
export function redigirSaida(tool, saida) {
  const { texto, achados } = redigirSegredos(saida)
  if (!achados.length) return null
  return (
    texto +
    `\n\n[guardrail] ${achados.length} segredo(s) redigido(s) na saida de "${tool}": ` +
    `${achados.join(", ")}. O valor nao entra no contexto — use o nome da variavel.`
  )
}
