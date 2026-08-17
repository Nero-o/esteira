---
description: Esteira de planejamento — mapeia o codigo, planeja no Claude, critica no GPT, consolida em .plans/
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
2. Rascunhe o plano no formato padrao.
3. `@cetico` — passe o rascunho INTEIRO e exija veredito. Corrija o que for
   bloqueador legitimo. No maximo 2 rodadas.
4. Grave em `.plans/<slug>.md` e me mostre: veredito final, o que mudou depois
   da critica, e qual e o primeiro passo a executar.

Nao escreva codigo de producao nesta sessao.
