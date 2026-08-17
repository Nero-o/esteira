# esteira

Esteira multi-IA sobre o **OpenCode** como maestro.

Claude planeja, GPT ataca o plano, um modelo barato mapeia o codigo, e a revisao
e sempre cruzada: **quem revisa nunca e o modelo que escreveu**.

Este repo e a config inteira. Uma maquina nova entra na esteira com um comando.

---

## Maquina nova

```bash
curl -fsSL https://raw.githubusercontent.com/<voce>/esteira/main/install.sh \
  | bash -s -- --repo https://github.com/<voce>/esteira
```

Ou, se preferir clonar primeiro:

```bash
git clone https://github.com/<voce>/esteira ~/.esteira && bash ~/.esteira/install.sh
```

O script instala o `opencode` (e o `claude` e o `codex`, se faltarem), aponta
`~/.config/opencode` para este repo e valida tudo. E idempotente: rodar de novo
nao quebra nada.

Falta so o login — a **unica** coisa que nao viaja no git:

```bash
opencode providers login -p anthropic   # opcao "Claude Pro/Max": usa sua assinatura
opencode providers login -p openai      # opcao ChatGPT Plus/Pro: usa sua assinatura
opencode providers login -p zhipuai     # opcional, GLM
opencode providers login -p moonshotai  # opcional, Kimi
```

---

## Dia a dia

```bash
esteira sync            # ao sentar em qualquer maquina: puxa e reinstala
esteira save "msg"      # depois de mexer na config: commita e envia
esteira status          # o que esta instalado, logado e carregado aqui
esteira doctor          # quando algo nao funciona
```

Trabalhando:

```bash
cd <projeto> && opencode

/plano   adicionar exportacao de extrato em CSV
/duelo   vale mais criar tabela nova ou desnormalizar a existente?
/revisar
```

Fora do TUI:

```bash
opencode run --command plano "adicionar exportacao de extrato em CSV"
opencode run --agent revisor "revise o diff de HEAD"
```

---

## Papeis

| Agente      | Modelo padrao               | Papel                                |
|-------------|-----------------------------|--------------------------------------|
| `arquiteto` | `anthropic/claude-opus-5`   | maestro; planeja, nao implementa     |
| `mapeador`  | `zhipuai/glm-5`             | le o codebase, devolve mapa factual  |
| `cetico`    | `openai/gpt-5.3-codex`      | ataca o plano, veredito GO/NO-GO     |
| `executor`  | `anthropic/claude-sonnet-5` | implementa um passo por vez          |
| `revisor`   | `openai/gpt-5.3-codex`      | revisa o diff                        |

Trocar de modelo = uma linha `model:` em `opencode/agents/<nome>.md`, depois
`esteira save`. `esteira doctor` avisa se algum modelo nao existe no seu login.

Sem credencial do Z.AI, aponte o `mapeador` para `anthropic/claude-haiku-4-5`
ou `moonshotai/kimi-k3`. Se ele falhar, o `arquiteto` cai no `@explore` nativo
e a esteira continua.

---

## Ponte com os CLIs

`opencode/bin/segunda-opiniao.sh "pergunta"` roda `codex exec` e `claude -p` em
paralelo, somente-leitura, e devolve as duas respostas. Cada CLI entra com as
proprias skills, regras e MCPs, usando as assinaturas — nao API avulsa.
E o que o `/duelo` consome.

---

## Estrutura

```
install.sh                    bootstrap idempotente
bin/esteira                   sync / save / status / doctor
opencode/
  opencode.jsonc              modelos, permissoes, MCP, skills
  agents/*.md                 os cinco papeis
  commands/*.md               /plano /duelo /revisar
  bin/segunda-opiniao.sh      ponte codex + claude
```

## O que NAO esta aqui

Credenciais. Ficam em `~/.local/share/opencode/auth.json`, por maquina, fora do
git de proposito. Sessoes e historico tambem sao locais.
