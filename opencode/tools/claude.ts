import { tool } from "@opencode-ai/plugin"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const run = promisify(execFile)

// ESTEIRA_TOOL_TIMEOUT em segundos. Maquina lenta ou link ruim nao deveria
// exigir editar codigo.
const TIMEOUT_MS = Math.max(30, Number(process.env.ESTEIRA_TOOL_TIMEOUT) || 420) * 1000

export default tool({
  description: [
    "Consulta o Claude Code CLI (assinatura Claude Max, cliente oficial) em modo somente-leitura.",
    "",
    "Use quando precisar de raciocinio de outra familia de modelo: desenhar um plano,",
    "decidir arquitetura, revisar um diff, ou pedir contraponto ao que voce mesmo concluiu.",
    "",
    "O Claude entra com as proprias skills, regras e CLAUDE.md do projeto, e le arquivos",
    "por conta propria — aponte caminhos, nao cole codigo no prompt.",
    "",
    "Nao altera arquivo nenhum. Sobe um processo e leva de 30s a alguns minutos: mande",
    "UMA pergunta grande e autocontida em vez de varias pequenas.",
    "",
    "Quer as duas opinioes? Chame `claude` e `codex` NA MESMA RODADA — elas rodam em",
    "paralelo e o custo vira o da mais lenta, nao a soma das duas.",
  ].join("\n"),

  args: {
    prompt: tool.schema
      .string()
      .describe(
        "Pergunta ou tarefa completa e autocontida. Inclua o objetivo, os caminhos de arquivo " +
          "relevantes e o formato de resposta que voce espera. O Claude nao ve esta conversa.",
      ),
    profundidade: tool.schema
      .enum(["rapida", "profunda"])
      .optional()
      .describe(
        "rapida = modelo leve, responde em segundos. Use para consulta pontual e verificavel " +
          "(essa funcao existe? qual a assinatura dela?). " +
          "profunda = modelo forte, leva minutos. Use para plano, arquitetura e revisao de diff. " +
          "Default: profunda.",
      ),
  },

  async execute(args, context) {
    // `directory` e o diretorio da sessao; `worktree` vem como "/" quando o
    // projeto nao e um repo git, e "/" faria os CLIs varrerem a raiz do sistema.
    const alvo = context.directory ?? context.worktree ?? process.cwd()
    const cwd = alvo && alvo !== "/" ? alvo : process.cwd()
    const argv = ["-p", args.prompt, "--permission-mode", "plan"]
    if (args.profundidade === "rapida") argv.push("--model", "haiku")

    try {
      const proc = run("claude", argv, {
        cwd,
        timeout: TIMEOUT_MS,
        maxBuffer: 32 * 1024 * 1024,
      })
      // Sem fechar o stdin o CLI pode ficar esperando entrada e so morrer no timeout.
      proc.child.stdin?.end()
      const { stdout, stderr } = await proc
      const out = stdout.trim()
      if (out) return out
      return `(claude nao retornou texto)\n${stderr.trim().slice(0, 500)}`
    } catch (err: any) {
      if (err?.killed)
        return `(claude estourou o timeout de ${TIMEOUT_MS / 1000}s — reduza o escopo, use profundidade "rapida", ou suba ESTEIRA_TOOL_TIMEOUT)`
      if (err?.code === "ENOENT") return "(claude CLI nao encontrado no PATH — rode: esteira doctor)"
      return `(claude falhou: ${String(err?.stderr || err?.message || err).trim().slice(0, 500)})`
    }
  },
})
