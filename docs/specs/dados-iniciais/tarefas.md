# Tarefas — Dados iniciais

- [x] Fechar o plano e as tarefas do schema de persistência e provar a migration local com isolamento entre tenants. A spec de persistência recebeu o veredito `PRONTA` para uso local.
- [x] Implementar e testar a entrada autenticada e o logout (CA-01). Três cenários em [auth.test.ts](../../../tests/integration/auth.test.ts) usam Supabase Auth e PostgreSQL descartáveis, com login pelo navegador, cookies, recusas, logout e limite de tentativas.
- [x] Implementar e testar o seed repetível de tenant, equipamentos e membership (CA-02 e CA-03). `npm run test:integration` cobre duas execuções, preservação de IDs e empréstimo existente.
- [ ] Provisionar a conta do professor no Auth e executar `npx prisma db seed` com o UUID dela no ambiente alvo.
- [x] Revisar a adequação visual de TI-0012, validar as fotos e mapear os caminhos determinísticos (CA-04). Foto Pixabay 3545828 aprovada pelo responsável com exceção explícita para marca e texto.
- [ ] Preparar o procedimento de publicação e conferir com o responsável a ordem de migration, seed, upload e deploy.
- [ ] Reunir evidências do login do professor, zero empréstimos e acesso público às fotos (CA-05 e CA-06).
- [x] Rodar os checks locais: lint, typecheck, 5 testes unitários, 12 testes de integração, 2 E2E e build.
- [ ] Obter o veredito do verificador com evidência para cada CA de produção.
