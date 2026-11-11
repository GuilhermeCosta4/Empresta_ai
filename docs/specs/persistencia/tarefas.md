# Tarefas — Schema inicial de persistência

- [x] Criar schema Prisma e migration inicial com as cinco tabelas, caminho da foto e constraints de integridade (CA-01 e CA-02).
- [x] Versionar policies de isolamento e proteção append-only da auditoria. Conferir acesso das roles do banco e documentar o efeito de `BYPASSRLS` (CA-03 e CA-04).
- [x] Rodar testes de integração no PostgreSQL descartável e confirmar que o destino está limitado ao container de teste (CA-01 a CA-05). `npm run test:integration` passou com seis testes.
- [x] Executar os checks do repositório e obter a verificação independente. Veredito final: `PRONTA`. Lint, tipos, 5 testes unitários, 6 de integração, 2 E2E e build aprovados.
