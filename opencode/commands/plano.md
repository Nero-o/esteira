---
description: Esteira de planejamento — mapeia, planeja no Claude (CLI), critica no GPT, consolida em .plans/
agent: arquiteto
---

# Objetivo

$ARGUMENTS

# Estado do repo

Branch: !`git branch --show-current 2>/dev/null || echo "(fora de git)"`

Ultimos commits:
!`git log --oneline -8 2>/dev/null || echo "-"`

Arquivos sujos:
!`git status --short 2>/dev/null | head -25 || echo "-"`

# Instrucao

Rode a esteira completa:

1. `@mapeador` — mapeie o que importa para este objetivo.
2. Ferramenta `claude` — mande UMA chamada com o objetivo, os caminhos que o
   mapeador achou e o formato de plano padrao. Ele le os arquivos sozinho.
3. Critique o plano dele voce mesmo, abrindo os arquivos citados. Voce e GPT,
   ele e Claude: e essa diferenca que da valor a esta etapa.
4. So se sobrar divergencia grave que voce nao resolve lendo o codigo, chame a
   ferramenta `codex` para desempatar.
5. Grave em `.plans/<slug>.md` e me mostre: o que o Claude propos, o que voce
   derrubou e por que, e qual e o primeiro passo a executar.

Nao escreva codigo de producao nesta sessao.
