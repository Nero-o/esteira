---
description: Duelo de IAs — Codex CLI e Claude Code CLI respondem a mesma pergunta em paralelo e voce arbitra
agent: arquiteto
---

# Pergunta

$ARGUMENTS

# Respostas independentes

!`bash ~/.config/opencode/bin/segunda-opiniao.sh "$ARGUMENTS"`

# Instrucao

Voce acabou de receber duas respostas produzidas de forma independente, cada
uma por um CLI diferente com suas proprias skills e MCPs. Arbitre:

1. **Onde concordam** — trate como base solida, mas confira se os dois nao
   estao errados pelo mesmo motivo (ambos podem ter lido a mesma doc velha).
2. **Onde divergem** — este e o ponto que interessa. Abra os arquivos e decida
   com evidencia (`arquivo:linha`), nao por qual resposta soa melhor.
3. **O que so um viu** — costuma ser o achado mais valioso do duelo.

Entregue:

```
DECISAO: <a recomendacao final, uma frase>

POR QUE: <o argumento vencedor + a evidencia que o sustenta>

DESCARTADO: <o que a outra resposta propunha e por que nao vale>

RISCO RESIDUAL: <o que continua incerto mesmo depois do duelo>
```
