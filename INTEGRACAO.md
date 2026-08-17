# Integrar um projeto na esteira

Procedimento executável. Se você é uma IA lendo isto, siga na ordem e não pule passo.

**O que você vai produzir**, no repositório do projeto:

```
AGENTS.md            perfil do projeto, lido nativamente por OpenCode e Codex
.esteira/
  projeto.md         stack, comandos reais, zonas sensíveis
  guardrails.md      regras do domínio
.plans/              vazio; o /plano grava aqui
```

**Regra que vale para todos os passos:** preencha só com o que você **verificou
abrindo arquivo**. Comando de teste que você não encontrou no `package.json` não
entra. Se não achou, escreva `<NAO ENCONTRADO>` — é uma resposta útil; um chute
plausível não é. Este é o defeito mais caro desta integração: um `AGENTS.md` com
comandos inventados faz todo agente futuro errar com confiança.

---

## Passo 1 — Reconhecer o terreno

Leia, nesta ordem, o que existir:

- `README.md`, `CONTRIBUTING.md`
- manifesto de dependência: `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`,
  `pom.xml`, `Gemfile`, `composer.json`
- orquestração: `Makefile`, `Taskfile.yml`, `docker-compose.yml`, `justfile`
- CI: `.github/workflows/*.yml`, `.gitlab-ci.yml`
- contexto de IA que já exista: `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `.github/copilot-instructions.md`

Se já houver `AGENTS.md` ou `CLAUDE.md`, **não sobrescreva**: leia, aproveite, e no
final diga o que você acrescentou.

**Pronto quando:** você sabe dizer a linguagem, o gerenciador de pacotes, o
framework e como o projeto sobe — cada um com o arquivo que provou isso.

## Passo 2 — Extrair os comandos reais

Os comandos vão para o `AGENTS.md` e viram o que todo agente roda. Tire-os da fonte,
não da memória:

- `package.json` → `scripts` (o nome exato: pode ser `test:unit`, não `test`)
- `pyproject.toml` → `[tool.poetry.scripts]`, `[project.scripts]`, config de pytest/ruff
- `Makefile` → os alvos de verdade
- CI → o que o pipeline roda é a fonte mais confiável de todas, porque é o que
  precisa passar

Colete: instalar, rodar em dev, build, teste, lint, formatação, type-check, migração.

**Pronto quando:** cada comando listado existe textualmente em algum arquivo do
repositório, e você sabe apontar em qual. Os que não existem estão marcados
`<NAO ENCONTRADO>`.

## Passo 3 — Mapear a arquitetura

Sem inventar camada que não existe. Descreva:

- os diretórios de topo e o que cada um contém
- por onde entra uma requisição (ou o que o binário faz ao subir)
- onde mora o acesso a dados
- onde moram as regras de negócio
- onde ficam os testes e qual o padrão de nome deles

Se o projeto tiver `graphify-out/GRAPH_REPORT.md`, leia primeiro: ele já traz os nós
centrais e as comunidades, e economiza uma varredura inteira.

**Pronto quando:** cada afirmação tem `arquivo:linha` ou caminho de diretório.

## Passo 4 — Identificar zonas sensíveis

Onde um erro custa caro neste projeto específico. Procure por:

- dinheiro: cálculo financeiro, arredondamento, `Decimal`, moeda, imposto, juros
- identidade: autenticação, autorização, sessão, permissão, papel de usuário
- dado pessoal: CPF, e-mail, telefone, endereço, saúde, biometria
- integridade: migração de banco, script de backfill, deleção em massa
- integração externa: webhook, gateway de pagamento, envio de e-mail/SMS
- superfície pública: rota sem autenticação, upload, template renderizado

Para cada zona encontrada: caminho + por que é sensível + o que nunca fazer ali.

**Pronto quando:** você listou as zonas que **existem**. Projeto simples pode ter
uma só — não invente as outras para preencher a tabela.

## Passo 5 — Escrever os arquivos

Copie os templates e preencha. Todo marcador `<PREENCHER: ...>` some, virando
conteúdo real ou `<NAO ENCONTRADO>`.

- `templates/AGENTS.md` → `AGENTS.md` na raiz
- `templates/projeto.md` → `.esteira/projeto.md`
- `templates/guardrails.md` → `.esteira/guardrails.md`

Crie `.plans/` com um `.gitkeep`.

Acrescente ao `.gitignore` do projeto, se ainda não estiver:

```
.esteira/local/
```

**Pronto quando:** nenhum `<PREENCHER:` sobrou nos três arquivos.

## Passo 6 — Verificar antes de entregar

Não pule. Rode:

1. Cada comando do `AGENTS.md` que seja seguro rodar (teste, lint, type-check,
   build). Instalação e migração **não** — peça autorização.
2. Se algum falhar, corrija o comando no `AGENTS.md` ou marque
   `<NAO ENCONTRADO>`. **Não deixe comando quebrado documentado.**
3. Confira que nenhum segredo entrou nos arquivos que você escreveu: valor de
   variável de ambiente, token, senha, URL com credencial. Nome de variável pode;
   valor não.

**Pronto quando:** você consegue dizer, para cada comando documentado, se ele roda
— porque rodou, não porque parece certo.

## Passo 7 — Relatar

Entregue, em texto:

- o que você criou e o que aproveitou de contexto que já existia
- os comandos que rodaram e os que falharam, com a saída real
- o que ficou `<NAO ENCONTRADO>` e o que a pessoa precisa preencher
- as zonas sensíveis que encontrou

---

## O que NÃO fazer

- Não escreva comando que você não encontrou no repositório.
- Não copie zona sensível de outro projeto porque "costuma ter".
- Não leia `.env`, chave ou credencial. Se precisar saber quais variáveis existem,
  leia `.env.example`. Se não houver, liste os nomes lidos do código.
- Não commite, não dê push, não abra PR.
- Não instale dependência nem rode migração.
- Não crie arquivo além dos listados no Passo 5.
- Não reescreva `README.md` do projeto.

---

## Se a esteira ainda não estiver instalada nesta máquina

```bash
curl -fsSL https://raw.githubusercontent.com/Nero-o/esteira/main/install.sh \
  | bash -s -- --repo https://github.com/Nero-o/esteira
```

Depois, de dentro do projeto: `opencode` e então `/plano`, `/duelo`, `/revisar`.
