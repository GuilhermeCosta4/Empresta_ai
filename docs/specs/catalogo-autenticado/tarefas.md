# Tarefas

- [x] Implementar a consulta, os cartões, os filtros e o tratamento das fotos.
- [x] Exercitar os três critérios em [auth.test.ts](../../../tests/integration/auth.test.ts). Lint, typecheck, 5 testes unitários, 13 de integração, 3 E2E e build passaram.
- [x] Corrigir a CSP de produção mantendo a exigência do ADR-001. O Proxy fornece um nonce por resposta e o Next.js o incorpora aos scripts durante a renderização dinâmica.
- [x] Revalidar login, logout e os 12 cartões em Chromium com o build de produção, a CSP ativa e serviços descartáveis.
- [x] Verificador independente deu `PRONTA` para CA-01 a CA-03. A entrega de fotos foi simulada em integração e o caminho permitido na CSP foi conferido separadamente em E2E. Conferência do catálogo na Vercel pendente.
