import { tool } from "@opencode-ai/plugin"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { readFile, unlink } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const run = promisify(execFile)

// ESTEIRA_TOOL_TIMEOUT em segundos.
const TIMEOUT_MS = Math.max(30, Number(process.env.ESTEIRA_TOOL_TIMEOUT) || 420) * 1000

export default tool({
  description: [
    "Consulta o Codex CLI (assinatura ChatGPT, cliente oficial) em sandbox somente-leitura.",
    "",
    "Use para desempatar uma divergencia, confirmar um detalhe tecnico, ou quando quiser",
    "o sandbox e as skills proprias do Codex — que sao diferentes das suas.",
    "",
    "O Codex entra com as proprias regras e AGENTS.md do projeto, e le arquivos por conta",
    "propria — aponte caminhos, nao cole codigo no prompt.",
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
          "relevantes e o formato de resposta que voce espera. O Codex nao ve esta conversa.",
      ),
    profundidade: tool.schema
      .enum(["rapida", "profunda"])
      .optional()
      .describe(
        "rapida = raciocinio baixo, responde em segundos. Use para consulta pontual e " +
          "verificavel. profunda = raciocinio alto, leva minutos. Use para critica de plano " +
          "e revisao de diff. Default: profunda.",
      ),
  },

  async execute(args, context) {
    // `directory` e o diretorio da sessao; `worktree` vem como "/" quando o
    // projeto nao e um repo git, e "/" faria os CLIs varrerem a raiz do sistema.
    const alvo = context.directory ?? context.worktree ?? process.cwd()
    const cwd = alvo && alvo !== "/" ? alvo : process.cwd()
    const out = join(tmpdir(), `esteira-codex-${context.sessionID ?? "x"}-${process.pid}.md`)

    const argv = [
      "exec",
      "--sandbox", "read-only",
      "--skip-git-repo-check",
      "--ephemeral",
      "--color", "never",
      // Fixa a raiz de trabalho. Sem isto o codex resolve o workspace por conta
      // propria e pode nao enxergar os arquivos do projeto — ele responde
      // "nao encontrei o arquivo" em vez de falhar, o que engana.
      "-C", cwd,
    ]
    // Mexe no esforco de raciocinio, nao no modelo: nao depende de qual modelo
    // a conta tem liberado.
    if (args.profundidade === "rapida") argv.push("-c", 'model_reasoning_effort="low"')
    argv.push("-o", out, args.prompt)

    try {
      const proc = run("codex", argv, {
        cwd,
        timeout: TIMEOUT_MS,
        maxBuffer: 32 * 1024 * 1024,
      })
      // `codex exec` anexa o stdin ao prompt: sem fechar, ele espera para sempre.
      proc.child.stdin?.end()
      await proc
      const texto = (await readFile(out, "utf8")).trim()
      return texto || "(codex nao retornou texto)"
    } catch (err: any) {
      if (err?.killed)
        return `(codex estourou o timeout de ${TIMEOUT_MS / 1000}s — reduza o escopo, use profundidade "rapida", ou suba ESTEIRA_TOOL_TIMEOUT)`
      if (err?.code === "ENOENT") return "(codex CLI nao encontrado no PATH — rode: esteira doctor)"
      return `(codex falhou: ${String(err?.stderr || err?.message || err).trim().slice(0, 500)})`
    } finally {
      await unlink(out).catch(() => {})
    }
  },
})
