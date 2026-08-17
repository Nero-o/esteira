import { verificarChamada } from "./lib/verificar.mjs"

// Guardrails da esteira.
//
// Um unico `tool.execute.before` intercepta TODA chamada de ferramenta antes de
// executar. A decisao mora em lib/verificar.mjs (JS puro, testavel sem subir o
// OpenCode — ver lib/padroes.test.mjs); aqui so viramos o motivo em `throw`.
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
  }
}
