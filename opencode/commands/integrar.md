---
description: Integra o projeto atual na esteira — gera AGENTS.md e .esteira/ com dados verificados
agent: arquiteto
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

# Instrução

Execute o procedimento de `~/.esteira/INTEGRACAO.md` neste projeto.
Leia esse arquivo primeiro — ele tem os 7 passos com critério de pronto em cada um.

Resumo do que ele pede:

1. Reconhecer o terreno (manifestos, CI, contexto de IA existente)
2. Extrair os comandos **reais** — de `package.json`/`Makefile`/CI, nunca de memória
3. Mapear a arquitetura com `arquivo:linha`
4. Identificar as zonas sensíveis que **existem**
5. Preencher os templates de `~/.esteira/templates/` em `AGENTS.md` e `.esteira/`
6. Rodar os comandos que forem seguros e corrigir os que falharem
7. Relatar o que ficou `<NAO ENCONTRADO>`

Delegue o mapeamento a `@mapeador` e use a ferramenta `claude` para o perfil
arquitetural — ele lê o repositório por conta própria. Se quiser conferência
cruzada dos comandos, chame `claude` e `codex` na mesma rodada.

**Não invente.** Comando que você não encontrou vira `<NAO ENCONTRADO>`. Um
`AGENTS.md` com comando inventado faz todo agente futuro errar com confiança —
é o pior resultado possível deste comando.

Não commite e não dê push.
