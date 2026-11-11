# Plano — Dados iniciais

1. Revisar a spec de persistência que já existe e completar seu plano e tarefas antes da migration. Manter Prisma Migrate como dono do schema, com RLS, constraints de tenant e auditoria versionadas. Conferir os pré-requisitos locais do teste de banco.
2. Implementar autenticação por Supabase Auth e sessão no servidor com a stack do ADR-001. Usar a entrada visual existente e proteger a área autenticada, com evidência local do CA-01.
3. Implementar a carga em `prisma/seed.ts`, usando a lista e o manifesto como entradas. Validar patrimônio, referência de imagem, pertencimento ao tenant e repetição. Testar CA-02 a CA-04 com banco local e com o validador de imagens.
4. Preparar instruções para o responsável aplicar a migration, provisionar a conta, publicar as imagens e executar a carga. O ADR-001 prevê migration pelo GitHub Actions antes do deploy. Confirmar o acionamento humano do workflow e a sequência com o deploy automático da Vercel antes de configurar a operação.
5. Conferir CA-05 e CA-06 depois das ações do responsável. Rodar os checks do repositório e delegar a verificação da spec com evidências locais e de produção.

O provisionamento da conta e o upload ficam com o responsável. A validação local usa credenciais e dados exclusivos de teste.

Para habilitar o login no deploy, a configuração precisa conter `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `DATABASE_URL`. A migration usa `DIRECT_URL`. Confirmar no Supabase Auth que o cadastro público está fechado, que a conta foi provisionada pelo responsável e que a membership pertence ao tenant `suporte_ti`.

Executar `SUPABASE_TEACHER_USER_ID=<uuid-do-auth> npx prisma db seed` somente depois de aplicar a migration no banco escolhido. A senha não passa pelo seed.

A suíte `npm run test:integration` sobe PostgreSQL e Supabase Auth descartáveis no Docker e usa o Chromium do Playwright para o CA-01. Os testes geram credenciais exclusivas e injetam URLs locais no processo Next. O projeto fixa Node.js 24, a versão usada nos testes e compatível com os requisitos de Supabase JS e Testcontainers.
