---
description: Revisa as mudancas atuais em um modelo diferente do que escreveu o codigo
agent: arquiteto
---

# Alvo

${ARGUMENTS:-mudancas nao commitadas}

# Diff

!`git --no-pager diff --stat HEAD 2>/dev/null | tail -20`

!`git --no-pager diff HEAD 2>/dev/null | head -1200`

# Instrucao

Passe este diff para `@revisor`. Ele faz duas passadas: primeiro pede a revisao
ao Claude pela ferramenta `claude` (familia de modelo diferente da que escreveu
o codigo), depois verifica cada achado abrindo o arquivo.

Depois:

- Descarte achado que voce conseguir refutar abrindo o arquivo. Diga que refutou.
- Para o que sobrou, ordene por gravidade real e proponha a correcao concreta.
- Se nao sobrou nada, diga "diff limpo" e pare. Nao invente enchimento.

Nao aplique correcao nesta sessao — so reporte.
