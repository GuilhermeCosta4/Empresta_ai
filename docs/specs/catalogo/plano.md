# Plano: Login e catálogo demonstrativo

## Escopo

Implementar somente a experiência de entrada e catálogo descrita em `spec.md`. O formulário de entrada acessa a demonstração, e a tela usará dados locais sem backend nem persistência.

## Abordagem proposta

1. [x] Implementar o formulário visual de entrada e a transição local para o catálogo.
2. [x] Implementar busca, filtros e cartões de equipamentos com estados disponíveis, emprestados e em manutenção; somente disponíveis podem ser solicitados.
3. [x] Validar interação, layout em desktop e mobile e executar os checks configurados.

## Limites de implementação

- Não instalar ou adotar bibliotecas fora das decisões do ADR-001 sem aprovação.
- Não criar endpoints, banco, autenticação ou lógica real de empréstimo.
- Não apresentar dados demonstrativos como dados reais.
- Não aplicar nem simular as regras por pessoa de limite de itens e atraso, pois o protótipo não terá sessão nem servidor.
- A entrada e as solicitações são somente demonstrações locais.

## Validação proposta

- Executar `git status --short` e `git diff --check`.
- `npm run lint`, `npm run typecheck` e `npm run build` passaram nesta implementação.
- A automação do navegador confirmou filtros combinados, feedback de solicitação, carregamento das oito imagens e ausência de overflow horizontal em viewport de 390 px.