---
description: Integra o projeto atual na esteira — gera AGENTS.md e .esteira/ com dados verificados
agent: integrador
---

# Projeto

Diretório: !`pwd`

Raiz do repo:
!`git rev-parse --show-toplevel 2>/dev/null || echo "(fora de git)"`

Arquivos de topo:
!`ls -A | head -40`

Manifestos encontrados:
!`ls package.json pyproject.toml go.mod Cargo.toml pom.xml Gemfile composer.json Makefile Taskfile.yml docker-compose.yml 2>/dev/null || echo "nenhum na raiz"`

Contexto de IA já existente:
!`ls AGENTS.md CLAUDE.md .cursorrules .github/copilot-instructions.md .esteira 2>/dev/null || echo "nenhum"`

---

# Procedimento

!`cat ~/.esteira/INTEGRACAO.md 2>/dev/null || echo "(INTEGRACAO.md nao encontrado — rode: esteira sync)"`

---

# Template de AGENTS.md

!`cat ~/.esteira/templates/AGENTS.md 2>/dev/null`

# Template de .esteira/projeto.md

!`cat ~/.esteira/templates/projeto.md 2>/dev/null`

# Template de .esteira/guardrails.md

!`cat ~/.esteira/templates/guardrails.md 2>/dev/null`

---

# Instrução

Execute o procedimento acima neste projeto. Ele veio inteiro no prompt — você não
precisa (nem deve) ler nada fora do diretório do projeto.

Preencha os três templates com o que **verificou abrindo arquivo**. Todo marcador
`<PREENCHER: ...>` some, virando conteúdo real ou `<NAO ENCONTRADO>`.

Delegue o levantamento a `@mapeador` e use a ferramenta `claude` para o perfil
arquitetural — depois confira você mesmo cada comando e cada caminho que eles
devolverem.

**Não invente.** Comando que você não encontrou vira `<NAO ENCONTRADO>`.

Grave `AGENTS.md`, `.esteira/projeto.md`, `.esteira/guardrails.md` e crie `.plans/`.
Não commite e não dê push.
