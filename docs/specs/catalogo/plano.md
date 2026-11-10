# Plano: Login e catálogo demonstrativo

## Escopo

Implementar somente a experiência de entrada e catálogo descrita em `spec.md`. O formulário de entrada acessa a demonstração, e a tela usará dados locais sem backend nem persistência.

## Abordagem proposta

1. [x] Implementar o formulário visual de entrada e a transição local para o catálogo (`CA-02`, `CA-05`).
2. [x] Implementar busca, filtros e cartões de equipamentos com estados disponíveis, emprestados e em manutenção; somente disponíveis podem ser solicitados (`CA-01`, `CA-03`, `CA-04`).
3. [x] Implementar e validar o layout em desktop de 1440 × 900 px, com elementos essenciais visíveis e sem overflow horizontal (`CA-06`), e executar os checks configurados.

## Limites de implementação

- Não instalar ou adotar bibliotecas fora das decisões do ADR-001 sem aprovação.
- Não criar endpoints, banco, autenticação ou lógica real de empréstimo.
- Não apresentar dados demonstrativos como dados reais.
- Não aplicar nem simular as regras por pessoa de limite de itens e atraso, pois o protótipo não terá sessão nem servidor.
- A entrada e as solicitações são somente demonstrações locais.

## Validação proposta

- Executar `git status --short` e `git diff --check`.
- `npm run lint`, `npm run typecheck` e `npm run build` passaram nesta implementação.
- A automação do navegador confirmou filtros combinados e feedback de solicitação no catálogo demonstrativo.
- Vitest/Testing Library cobrem `CA-01` a `CA-05`; Playwright em viewport desktop cobre `CA-06`, conforme `rules/tests.md`.
