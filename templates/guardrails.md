# Guardrails de <PREENCHER: nome do projeto>

Regras deste domínio. Somam-se aos guardrails globais da esteira
(anti-alucinação, anti-injeção, anti-vazamento, escopo) — não os substituem.

Escreva só o que é **verdade neste projeto**. Regra copiada de outro lugar vira
ruído, e ruído treina o agente a ignorar a lista inteira.

## Nunca

<PREENCHER: as ações proibidas aqui, com o motivo. Exemplos do tipo certo:
- `float` em valor monetário — use `Decimal`; erro de arredondamento vira divergência contábil
- deletar linha de `transacoes` — a tabela é append-only, estorno é um novo registro
- log de `cpf`, `email` ou `token` — vai para observabilidade de terceiro
- alterar migração já aplicada em produção — crie uma nova
Se não houver nenhuma, escreva "nenhuma além dos guardrails globais".>

## Sempre

<PREENCHER: o que é obrigatório aqui. Exemplos do tipo certo:
- valor monetário em `Decimal`, arredondamento só na borda de apresentação
- rota nova nasce com verificação de permissão; sem ela, não passa em review
- alteração de schema acompanha migração reversível
>

## Zonas críticas

| Caminho | Por quê | Antes de mexer |
|---|---|---|
| <PREENCHER> | <PREENCHER> | <PREENCHER: o que verificar / quem avisar> |

## Dados sensíveis neste projeto

<PREENCHER: quais campos são pessoais ou regulados, onde vivem, e o que pode
aparecer em log, em teste e em prompt de ferramenta externa. Teste usa dado
fictício — nunca dump de produção.>

## Verificação obrigatória

<PREENCHER: o que precisa passar antes de declarar pronto neste projeto —
comando de teste, cobertura mínima, checagem de tipo, lint. Só o que existe.>
