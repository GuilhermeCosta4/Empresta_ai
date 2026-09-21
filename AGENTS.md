# AGENTS.md

## O que é o projeto

Este repositório é o projeto de documentação e decisão inicial para o sistema de empréstimo de equipamentos internos.

O que pode ser verificado hoje neste repositório:
- existe um documento de negócio em `docs/PRD.md`;
- existe um ADR em `docs/adr/001-stack.md`;
- ainda não há código em execução, nem comandos de build, teste ou execução;
- ainda não há pasta de código ou estrutura de implementação.

A equipe e o processo devem trabalhar com base no que está documentado hoje. O projeto ainda não está implementado.

## Onde olhar

- `docs/PRD.md` — o documento de negócio. Não é uma spec.
- `docs/adr/001-stack.md` — decisões técnicas já registradas e o motivo delas.
- `rules/restrictions.md` — limites do que o agente pode fazer.
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
- Se uma decisão nova precisar ser registrada, descreva a decisão e as alternativas e pare. Não escreva ADR por conta própria.
- Nenhum commit ou push deve ser feito pelo agente. Todo commit e push serão realizados por você.

## Estado atual do projeto

O projeto ainda não tem código.

Não existe comando de build, de teste ou execução neste repositório hoje.

A seção de implementação e execução será preenchida quando houver código, comandos e estrutura de aplicação disponíveis.

Este arquivo não inventa implementação, comando ou arquitetura que não possam ser verificados neste repositório hoje.
