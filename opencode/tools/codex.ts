import { tool } from "@opencode-ai/plugin"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { readFile, unlink } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const run = promisify(execFile)
const TIMEOUT_MS = 420_000

export default tool({
  description: [
    "Consulta o Codex CLI (assinatura ChatGPT, cliente oficial) em sandbox somente-leitura.",
    "",
    "Use para criticar um plano, revisar um diff, ou confirmar um detalhe tecnico com um",
    "modelo de familia diferente da sua. E o contraponto do Claude: quando os dois",
    "divergem, ali esta a decisao que importa.",
    "",
    "O Codex entra com as proprias skills, regras e AGENTS.md do projeto, e le arquivos",
    "por conta propria — aponte caminhos, nao cole codigo.",
    "",
    "Ele nao altera nenhum arquivo. Cada chamada leva de 30s a alguns minutos: mande UMA",
    "pergunta grande e autocontida em vez de varias pequenas.",
  ].join("\n"),

  args: {
    prompt: tool.schema
      .string()
      .describe(
        "Pergunta ou tarefa completa e autocontida. Inclua o objetivo, os caminhos de arquivo " +
          "relevantes e o formato de resposta que voce espera. O Codex nao ve esta conversa.",
      ),
  },

  async execute(args, context) {
    const cwd = context.worktree ?? context.directory ?? process.cwd()
    const out = join(tmpdir(), `esteira-codex-${context.sessionID ?? "x"}-${process.pid}.md`)

    try {
      const proc = run(
        "codex",
        [
          "exec",
          "--sandbox", "read-only",
          "--skip-git-repo-check",
          "--ephemeral",
          "--color", "never",
          "-o", out,
          args.prompt,
        ],
        { cwd, timeout: TIMEOUT_MS, maxBuffer: 32 * 1024 * 1024 },
      )
      // `codex exec` anexa o stdin ao prompt: sem fechar, ele espera para sempre.
      proc.child.stdin?.end()
      await proc
      const texto = (await readFile(out, "utf8")).trim()
      return texto || "(codex nao retornou texto)"
    } catch (err: any) {
      if (err?.killed) return `(codex estourou o timeout de ${TIMEOUT_MS / 1000}s — reduza o escopo da pergunta)`
      if (err?.code === "ENOENT") return "(codex CLI nao encontrado no PATH — rode: esteira doctor)"
      return `(codex falhou: ${String(err?.stderr || err?.message || err).trim().slice(0, 500)})`
    } finally {
      await unlink(out).catch(() => {})
    }
  },
})
