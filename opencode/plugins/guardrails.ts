import { verificarChamada, redigirSaida } from "./lib/verificar.mjs"

// Guardrails da esteira.
//
// `tool.execute.before` intercepta TODA chamada antes de executar e bloqueia.
// `tool.execute.after` varre o que VOLTA e redige segredo — porque um CLI pode
// ser mandado ler um segredo com um prompt limpo, que a varredura de entrada
// nao tem como barrar.
//
// A decisao mora em lib/verificar.mjs (JS puro, testavel sem subir o OpenCode —
// ver lib/padroes.test.mjs); aqui so ligamos os fios.
//
// Desligar: ESTEIRA_GUARDRAILS=off opencode

export const Guardrails = async () => {
  if (process.env.ESTEIRA_GUARDRAILS === "off") {
    console.error("[esteira] guardrails DESLIGADOS (ESTEIRA_GUARDRAILS=off)")
    return {}
  }

  return {
    "tool.execute.before": async (
      input: { tool: string; sessionID?: string; callID?: string },
      output: { args: Record<string, unknown> },
    ) => {
      const motivo = verificarChamada(input.tool, output.args ?? {})
      if (motivo) throw new Error(motivo)
    },

    "tool.execute.after": async (
      input: { tool: string; sessionID?: string; callID?: string },
      output: { title?: string; output?: string; metadata?: unknown },
    ) => {
      if (typeof output?.output !== "string") return
      const redigido = redigirSaida(input.tool, output.output)
      if (redigido) output.output = redigido
    },
  }
}
