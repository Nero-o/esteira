# Perfil técnico — <PREENCHER: nome do projeto>

Detalhe que não cabe no `AGENTS.md`. Carregado automaticamente pelo OpenCode via
`instructions`.

## Como isso roda de verdade

<PREENCHER: o caminho de uma requisição (ou de uma execução) do início ao fim, em 3
a 6 passos, cada um com arquivo:linha. Isto é o que evita que um agente proponha
mudança na camada errada.>

## Dependências que importam

<PREENCHER: as bibliotecas cujo comportamento muda decisão de design — ORM, cliente
HTTP, lib de validação, lib de data, lib de decimal. Com a versão. Não liste todas.>

## Serviços externos

<PREENCHER: com o que este projeto fala — banco, fila, gateway, API de terceiro.
Para cada um: para quê, e o que quebra se ele cair. Ou "nenhum".>

## Variáveis de ambiente

Apenas **nomes** e para que servem. Valor nunca entra aqui.

<PREENCHER: lido de .env.example, ou dos nomes referenciados no código>

## Migração e dados

- **Ferramenta:** <PREENCHER: alembic/prisma/flyway/nenhuma>
- **Comando:** <PREENCHER: ou <NAO ENCONTRADO>>
- **Regra:** migração não roda sem autorização explícita nesta conversa.

## O que já deu errado aqui

<PREENCHER: armadilhas conhecidas — o teste que falha por ordem, o serviço que
precisa estar de pé, o cache que precisa ser limpo, o passo que todo mundo esquece.
Se você não sabe, deixe "a preencher conforme aparecer" — é honesto e vai crescer.>

## Fora de escopo

<PREENCHER: o que existe no repositório mas não deve ser tocado — código legado
congelado, pasta gerada, vendored, submódulo.>
