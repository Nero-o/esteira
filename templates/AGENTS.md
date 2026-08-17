# <PREENCHER: nome do projeto>

<PREENCHER: uma frase dizendo o que este projeto faz e para quem>

Lido nativamente por OpenCode e Codex CLI. O Claude Code lê via `CLAUDE.md` — se o
projeto usar os dois, mantenha um deles como um link para o outro em vez de duplicar.

## Stack

- **Linguagem:** <PREENCHER: linguagem e versão — do manifesto, não do que parece>
- **Gerenciador:** <PREENCHER: npm/pnpm/poetry/uv/go/cargo — prove pelo lockfile>
- **Framework:** <PREENCHER: ou "nenhum">
- **Banco:** <PREENCHER: ou "nenhum">
- **Deploy:** <PREENCHER: ou <NAO ENCONTRADO>>

## Comandos

Todos verificados no repositório. `<NAO ENCONTRADO>` significa que não existe — não
invente um equivalente.

```bash
<PREENCHER: instalar>
<PREENCHER: rodar em dev>
<PREENCHER: teste>
<PREENCHER: lint>
<PREENCHER: formatar>
<PREENCHER: type-check>
<PREENCHER: build>
```

Antes de dizer que terminou, rode: `<PREENCHER: o comando mínimo de verificação>`

## Estrutura

```
<PREENCHER: diretórios de topo, um por linha, com o que cada um contém>
```

- **Entrada:** <PREENCHER: arquivo:linha por onde a execução começa>
- **Dados:** <PREENCHER: onde mora o acesso a banco/API>
- **Regras de negócio:** <PREENCHER: onde>
- **Testes:** <PREENCHER: onde, e o padrão de nome>

## Convenções

<PREENCHER: o que um agente precisa saber para escrever código que parece do time —
padrão de nomenclatura, tratamento de erro, formato de log, como se escreve teste
aqui. Extraia de código existente, não de boas práticas genéricas.>

## Zonas sensíveis

<PREENCHER: só as que existem. Formato: `caminho` — por que é sensível — o que nunca
fazer ali. Se o projeto não tiver nenhuma, escreva "nenhuma identificada".>

## Regras

- Mudança mínima: não refatore o que não foi pedido.
- Não commite, não dê push, não faça deploy sem pedido explícito.
- Teste que falhou é relatado como falha, com a saída colada.
- Segredo não sai de `.env`: referencie o nome da variável.

<!--
Integrado na esteira: github.com/Nero-o/esteira
Complementos em .esteira/projeto.md e .esteira/guardrails.md
-->
