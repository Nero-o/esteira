import { tool } from "@opencode-ai/plugin"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const run = promisify(execFile)
const TIMEOUT_MS = 420_000

export default tool({
  description: [
    "Consulta o Claude Code CLI (assinatura Claude Max, cliente oficial) em modo somente-leitura.",
    "",
    "Use quando precisar de raciocinio longo: desenhar um plano, decidir arquitetura,",
    "entender um fluxo complicado, ou pedir uma segunda opiniao que NAO venha do mesmo",
    "modelo que voce esta rodando agora.",
    "",
    "O Claude entra com as proprias skills, regras e CLAUDE.md do projeto. Ele le arquivos",
    "por conta propria — nao cole codigo no prompt, aponte o caminho.",
    "",
    "Ele nao altera nenhum arquivo. Cada chamada leva de 30s a alguns minutos: mande UMA",
    "pergunta grande e autocontida em vez de varias pequenas.",
  ].join("\n"),

  args: {
    prompt: tool.schema
      .string()
      .describe(
        "Pergunta ou tarefa completa e autocontida. Inclua o objetivo, os caminhos de arquivo " +
          "relevantes e o formato de resposta que voce espera. O Claude nao ve esta conversa.",
      ),
  },

  async execute(args, context) {
    const cwd = context.worktree ?? context.directory ?? process.cwd()

    try {
      const proc = run(
        "claude",
        ["-p", args.prompt, "--permission-mode", "plan"],
        { cwd, timeout: TIMEOUT_MS, maxBuffer: 32 * 1024 * 1024 },
      )
      // Sem fechar o stdin o CLI pode ficar esperando entrada e so morrer no timeout.
      proc.child.stdin?.end()
      const { stdout, stderr } = await proc
      const out = stdout.trim()
      if (out) return out
      return `(claude nao retornou texto)\n${stderr.trim().slice(0, 500)}`
    } catch (err: any) {
      if (err?.killed) return `(claude estourou o timeout de ${TIMEOUT_MS / 1000}s — reduza o escopo da pergunta)`
      if (err?.code === "ENOENT") return "(claude CLI nao encontrado no PATH — rode: esteira doctor)"
      return `(claude falhou: ${String(err?.stderr || err?.message || err).trim().slice(0, 500)})`
    }
  },
})
