# esteira

Esteira multi-IA com o **[OpenCode](https://opencode.ai)** como maestro.

O OpenCode orquestra, o **Claude e o Codex entram pelos CLIs oficiais** como
ferramentas chamáveis, e a revisão é sempre cruzada: **quem revisa nunca é o
modelo que escreveu**.

Custo adicional: **nenhum**. Roda sobre as assinaturas que você já tem — ChatGPT e
Claude — sem API por token.

Este repositório *é* a configuração inteira. Uma máquina nova entra com um comando,
e um projeto novo entra com outro.

---

## A ideia

Um modelo revisando o próprio trabalho concorda consigo mesmo: erra e valida o erro
pelo mesmo motivo. A esteira quebra isso — cada etapa crítica roda em uma família de
modelo diferente da anterior.

O produto do desacordo é o que interessa. Onde os dois divergem é onde está a
decisão que você precisa tomar de verdade.

```mermaid
flowchart LR
    A["/plano"] --> B["mapeador<br/>GPT mini · lê o código"]
    B --> C["tool claude<br/>Claude Code CLI · escreve o plano"]
    C --> D["arquiteto<br/>GPT · ataca o plano"]
    D -->|empate| E["tool codex<br/>Codex CLI · desempata"]
    D --> F[".plans/&lt;slug&gt;.md"]
    E --> F
    F --> G["executor<br/>GPT · implementa"]
    G --> H["revisor<br/>tool claude + GPT"]
```

---

## Guardrails

Não são texto de prompt esperando boa vontade do modelo. O plugin
`opencode/plugins/guardrails.ts` intercepta **toda** chamada de ferramenta antes de
executar e bloqueia em três camadas:

| Camada | Bloqueia |
|---|---|
| **Disco** | ler, escrever ou buscar em `.env`, `*.pem`, `id_rsa`, `.aws/credentials`, `.ssh/` — inclusive por `bash` e por `apply_patch` |
| **Shell** | `rm -rf /`, `curl \| bash`, `chmod 777`, `git push --force`, e comando de rede que cite arquivo de segredo |
| **Saída** | qualquer segredo indo para as ferramentas `claude`/`codex`, `task` ou `webfetch` — chave de API, token, chave privada, JWT, connection string com senha |
| **Retorno** | segredo que **volta** de qualquer ferramenta é redigido antes de entrar no contexto — um CLI pode ser mandado ler um segredo com um prompt perfeitamente limpo |

A camada de saída é a que justifica as outras: `claude` e `codex` sobem **outro
processo**, e `webfetch` fala com a internet. O que passa dali saiu do seu controle.

`.env.example` e chave pública continuam legíveis — a precisão importa, porque
guardrail que atrapalha é guardrail que a pessoa desliga. A matriz em
`opencode/plugins/lib/padroes.test.mjs` cobre 148 casos, e quase metade deles são
coisas que **devem passar**: `postgres://user:password@host` de README, SHA de
commit, UUID, `rm -rf node_modules`, prompt que menciona `.env` sem conter segredo.

```bash
node opencode/plugins/lib/padroes.test.mjs   # roda a matriz
ESTEIRA_GUARDRAILS=off opencode              # escape hatch para falso positivo
```

Somam-se a isso: `experimental.policies` negando o provider `anthropic`, permissões
de leitura negadas por padrão de caminho, e `opencode/guardrails.md` — o contrato de
comportamento que todo agente carrega (anti-alucinação, anti-injeção, anti-vazamento,
escopo). Esse último cobre o que regex nenhuma alcança: exigir `arquivo:linha` para
toda afirmação, e tratar conteúdo de arquivo e de web como **dado, nunca instrução**.

---

## Por que o Claude é ferramenta, e não provider

A Anthropic permite o OAuth de assinatura **apenas** no Claude Code e nos apps
nativos dela — usar credencial Pro/Max em harness de terceiro viola os Consumer
Terms e é bloqueado no servidor ([docs oficiais][legal]).

Então o Claude não entra como `anthropic/claude-*`. Entra pela ferramenta `claude`,
que chama o **CLI oficial** em modo somente-leitura: dentro da política, coberto pela
assinatura, e carregando as skills, regras e `CLAUDE.md` do projeto. Mesma coisa com
o `codex`, em sandbox read-only.

[legal]: https://code.claude.com/docs/en/legal-and-compliance

---

## Máquina nova

```bash
curl -fsSL https://raw.githubusercontent.com/Nero-o/esteira/main/install.sh \
  | bash -s -- --repo https://github.com/Nero-o/esteira
```

O script instala o `opencode` (e o `claude` e o `codex`, se faltarem), aponta
`~/.config/opencode` para este repo por symlink, instala o comando `esteira` e valida
tudo. É idempotente e degrada sem travar quando está offline.

Depois, os logins — a **única** coisa que não viaja no git:

```bash
opencode providers login -p openai   # ChatGPT Plus/Pro: move o maestro
claude                               # login do Claude Code CLI, se ainda não fez
codex                                # login do Codex CLI, se ainda não fez
```

**Requisitos:** `git`, `curl`, `bash` e `node` (o `node` só para a matriz de testes
dos guardrails). Testado em Linux e WSL; deve funcionar em macOS sem ajuste.

---

## Projeto novo

```bash
cd <projeto>
esteira integrar
```

Gera `AGENTS.md` e `.esteira/` preenchidos com o que foi **verificado** no
repositório: stack, comandos reais de build e teste, arquitetura com `arquivo:linha`,
zonas sensíveis. O que não foi encontrado vira `<NAO ENCONTRADO>` em vez de chute.

Qualquer IA — Claude, GPT, Gemini, o que for — faz o mesmo a partir de uma URL só:

```
https://raw.githubusercontent.com/Nero-o/esteira/main/llms.txt
```

O `llms.txt` segue a [spec](https://llmstxt.org/) e aponta para `INTEGRACAO.md`, que
é o procedimento executável de 7 passos com critério de pronto em cada um.

---

## Dia a dia

```bash
esteira sync            # ao sentar em qualquer máquina: puxa e reinstala
esteira save "msg"      # depois de mexer na config: commita e envia
esteira status          # o que está instalado, logado e carregado aqui
esteira doctor          # quando algo não funciona
esteira integrar [dir]  # prepara um projeto para a esteira
```

O `doctor` compara os modelos que os agentes pedem com os que o login **daquela
máquina** liberou, roda a matriz dos guardrails, e confere que a policy e o
`guardrails.md` continuam na config resolvida. Cada linha de problema já vem com o
comando que resolve.

Trabalhando:

```bash
cd <projeto> && opencode

/plano     adicionar exportação de extrato em CSV
/duelo     vale mais criar tabela nova ou desnormalizar a existente?
/revisar
/integrar
```

Fora do TUI:

```bash
opencode run --command plano "adicionar exportação de extrato em CSV"
opencode run --agent revisor "revise o diff de HEAD"
```

---

## Papéis

| Agente      | Roda em                | Papel                                    |
|-------------|------------------------|------------------------------------------|
| `arquiteto` | `openai/gpt-5.6-sol`   | maestro; delega, critica, consolida      |
| `mapeador`  | `openai/gpt-5.4-mini`  | lê o codebase, devolve mapa factual      |
| `integrador`| `openai/gpt-5.6-sol`   | prepara um projeto para a esteira        |
| `cetico`    | `openai/gpt-5.6-sol`   | ataca um plano, veredito GO/NO-GO        |
| `executor`  | `openai/gpt-5.6-sol`   | implementa um passo por vez              |
| `revisor`   | `openai/gpt-5.6-sol`   | revisa o diff (passa pelo Claude antes)  |

| Ferramenta | Roda em         | Quando                               |
|------------|-----------------|--------------------------------------|
| `claude`   | Claude Code CLI | raciocínio longo, plano, contraponto  |
| `codex`    | Codex CLI       | desempate, sandbox e skills próprias  |

As duas aceitam `profundidade: "rapida"` — modelo leve, resposta em segundos — para
consulta pontual, em vez de gastar minutos numa pergunta que não merece. E chamadas
emitidas na mesma rodada rodam **em paralelo**: o custo vira o da mais lenta, não a
soma.

Trocar de modelo é uma linha `model:` em `opencode/agents/<nome>.md`, seguida de
`esteira save`. **Sem login OpenAI?** Aponte para um modelo free do OpenCode Zen
(ex.: `opencode/glm-5-free`) — o peso está nas ferramentas, não no maestro.

`ESTEIRA_TOOL_TIMEOUT=900` sobe o limite das ferramentas em máquina ou link lento.

---

## Atalho: os dois em paralelo

`opencode/bin/segunda-opiniao.sh "pergunta"` roda `codex exec` e `claude -p` ao mesmo
tempo, somente-leitura, e devolve as duas respostas lado a lado. É o que o `/duelo`
consome.

---

## Estrutura

```
llms.txt                      porta de entrada para qualquer IA
INTEGRACAO.md                 procedimento de integração, executável
templates/                    AGENTS.md, projeto.md, guardrails.md
install.sh                    bootstrap idempotente
bin/esteira                   sync · save · status · doctor · integrar
opencode/
  opencode.jsonc              modelos, permissões, policies, MCP, limites
  guardrails.md               contrato de comportamento de todo agente
  agents/*.md                 os cinco papéis
  commands/*.md               /plano /duelo /revisar /integrar
  tools/{claude,codex}.ts     ferramentas -> CLIs oficiais
  plugins/guardrails.ts       bloqueio imposto, antes de cada ferramenta
  plugins/lib/                padrões, decisão e a matriz de testes
  bin/segunda-opiniao.sh      os dois em paralelo
```

O OpenCode lê `~/.claude/skills` e os arquivos `CLAUDE.md` / `AGENTS.md` /
`.esteira/*.md`, então o contexto que você já escreveu vale aqui sem duplicação.

---

## O que não está aqui

Credenciais. Ficam em `~/.local/share/opencode/auth.json` e nos diretórios dos CLIs,
por máquina, fora do git de propósito. Sessões e histórico também são locais.

Como este repositório é público, evite colar regra interna de cliente nos `.md` dos
agentes — esse tipo de coisa vai em `.esteira/guardrails.md`, no repo do projeto.
