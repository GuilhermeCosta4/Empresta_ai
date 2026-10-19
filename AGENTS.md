# AGENTS.md

## O que é o projeto

Este repositório está em fase documental e de decisão inicial para o sistema de empréstimo de equipamentos internos.

O que pode ser verificado hoje neste repositório:
- existe um documento de negócio em `docs/PRD.md`;
- existe um ADR em `docs/adr/001-stack.md`;
- existem regras de limite em `rules/restrictions.md`;
- há um checklist de integridade em `rules/checks.md`;
- existe uma spec de catálogo em `docs/specs/catalogo/`;
- existe um scaffold Next.js com TypeScript, Tailwind CSS e App Router em `src/app/`.

Este arquivo é a regra de operação do agente para este repositório. O que não puder ser verificado neste workspace não deve entrar aqui.

## Onde olhar

- `docs/PRD.md` — documento de negócio. Não é uma spec.
- `docs/adr/001-stack.md` — decisões técnicas já registradas e o motivo delas.
- `rules/restrictions.md` — limites do que o agente pode fazer.
- `rules/checks.md` — lista dos checks verificados do repositório atual.
- `docs/specs/` — quando existir, deve conter uma pasta por funcionalidade, com spec, plano e tarefas.

## Precedência

Quando houver conflito entre artefatos, a ordem de precedência é:

1. Regras e limites do repositório (`rules/restrictions.md`)
2. Documentos de decisão já existentes (`docs/adr/`)
3. Documento de negócio (`docs/PRD.md`)
4. Especificação funcional (`docs/specs/`, quando existir)
5. Código, quando existir

Se algo não estiver em lugar nenhum, pergunte e espere. Não decida por conta própria.

## Processo

- Leia `docs/adr/` antes de propor qualquer coisa estrutural.
- Leia `docs/PRD.md` antes de sugerir qualquer mudança de escopo ou requisito.
- Liste ambiguidades antes de implementar.
- Uma tarefa por vez.
- Se uma decisão nova precisar ser registrada, descreva a decisão, liste alternativas e pare. Não escreva ADR por conta própria.
- O agente não cria commit nem push. Todo commit e push serão realizados pelo usuário.
- O agente não avança sem aprovação explícita da tarefa atual.
- Se uma mudança sair do escopo pedido, pare e peça autorização antes de continuar.
- Se uma decisão nova foi tomada durante a tarefa, ela deve ser revisada com o ADR e com o PRD antes de virar regra de implementação.

## Comandos

Os comandos abaixo foram executados neste repositório e podem ser citados com segurança:

- `git status --short` — mostra mudanças e arquivos não rastreados no diretório atual.
- `git diff --check` — valida whitespace e problemas básicos de patch.
- `Get-ChildItem -Force -Recurse -File` — lista os arquivos existentes no workspace verificado.
- `npm run build` — compila o scaffold Next.js para produção.
- `npm run lint` — executa ESLint.
- `npm run typecheck` — executa TypeScript sem gerar arquivos.

Os três comandos da aplicação acima passaram no scaffold atual. Não há comando de teste configurado ou verificado. Para usar npm, Node.js 20.9 ou superior precisa estar disponível.

## Mapa de diretórios

Os diretórios e arquivos existentes hoje no workspace verificado são:

- `docs/`
  - `docs/PRD.md`
  - `docs/adr/`
    - `docs/adr/001-stack.md`
  - `docs/specs/catalogo/`
    - `spec.md`
    - `plano.md`
    - `tarefas.md`
- `rules/`
  - `rules/restrictions.md`
  - `rules/checks.md`
- `src/app/`
  - `layout.tsx`
  - `page.tsx`
  - `globals.css`
- `public/images/equipment/` — fotos locais dos equipamentos demonstrativos.
- Arquivos de raiz:
  - `.env`
  - `.env.example`
  - `.gitignore`
  - `AGENTS.md`
- Configuração da aplicação: `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs` e `components.json`.

## Convenções não óbvias

Estas são as regras que são fáceis de errar se o agente "chutar" sem olhar o repositório:

- A fonte de verdade de escopo e processo está em `docs/PRD.md` e em `docs/adr/001-stack.md`, não em analogia ou suposição.
- A ordem de precedência do repositório é: regras, ADR, PRD, spec, código.
- O agente não escreve ADR. Se houver uma decisão que precise ser registrada, ele descreve a decisão, lista alternativas e para.
- O agente não cria commit nem push; esse passo fica com o usuário.
- Se um check falhar, a tarefa não termina como sucesso. Isso vale mesmo que o restante tenha parecido funcional.
- O agente não afirma que um comando funciona sem executá-lo neste repositório.
- O agente não cria arquivos novos por iniciativa própria quando a tarefa não foi solicitada explicitamente.

## Como testar

O scaffold atual não tem testes de aplicação configurados. Os checks executáveis verificados são:

- `git status --short`
- `git diff --check`
- `npm run lint`
- `npm run typecheck`
- `npm run build`


## Estado atual do projeto

O estado verificado inclui documentação e uma demonstração front-end com entrada visual e catálogo responsivo. Busca, filtros e pedidos demonstrativos funcionam localmente. Não há autenticação real, backend, testes de aplicação ou persistência de empréstimos.

O protótipo de entrada e catálogo segue `docs/specs/catalogo/`.

Este arquivo não inventa implementação, comando ou arquitetura que não possam ser verificados neste repositório hoje.

## Regras de operação do agente

- O agente opera em uma tarefa por vez.
- O agente só pode criar ou alterar arquivos quando a tarefa foi pedida explicitamente pelo usuário.
- O agente não inventa arquitetura, padrão ou estrutura que não existam neste repositório ou que tenham sido aprovados pelo usuário.
- O agente deve reportar o que foi verificado e o que ficou sem verificação.
- O agente não relata sucesso parcial. Se qualquer check falhar, a tarefa não está concluída.
- O agente não decide por conta própria o que o PRD deixou ambíguo; lista as ambiguidades e espera.
- O agente não se compromete com commit, push, deploy ou release sem autorização do usuário.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
