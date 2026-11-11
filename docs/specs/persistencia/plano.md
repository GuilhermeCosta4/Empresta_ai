# Plano — Schema inicial de persistência

## Impacto

A primeira migration cria cinco tabelas de domínio. Equipamentos, memberships e empréstimos ficam vinculados a tenants. O catálogo demonstrativo atual continua independente até a integração prevista nas specs de dados iniciais e de empréstimo.

## Modelagem e migration

1. Adicionar o schema Prisma e uma migration SQL versionada. Mapear os modelos para `tenants`, `memberships`, `equipment`, `loans` e `audit_events`. Guardar o identificador UUID externo do Supabase Auth na membership e o caminho relativo do objeto do Storage no equipamento.
2. Aplicar unicidade a slug de tenant, usuário dentro do tenant e patrimônio dentro do tenant. Usar chaves estrangeiras compostas nos vínculos de domínio para rejeitar referências entre tenants, inclusive no registro da devolução. Usar índice único parcial para um empréstimo ativo por equipamento, com base na ausência de data de devolução.
3. Versionar RLS e policies no SQL da migration. Sem contexto de sessão válido, a role sujeita a RLS não acessa dados de domínio. Com contexto estabelecido pelo servidor dentro de uma transação, a policy isola o tenant e limita a leitura de empréstimos ao titular ou a Operações/admin do mesmo tenant. Revisar também o acesso de `anon` e `authenticated` no Supabase, pois o acesso da aplicação passa pela API do monolito. O uso de uma role Prisma com `BYPASSRLS` exige filtros e autorização no servidor, conforme o ADR-001.
4. Tornar a auditoria append-only com permissões e trigger versionados. Cobrir tentativa de alteração e exclusão pela role de aplicação e verificar explicitamente a proteção aplicável quando RLS é contornada.

## Verificação local

- Usar PostgreSQL em Docker com Testcontainers, conforme o ADR-001. O Docker está ativo e a imagem `postgres:16` já existe na máquina. O teste fornece uma URL descartável do container e recusa configuração que aponte para fora do ambiente de teste.
- Executar a migration em banco vazio e conferir schema, constraints, índice parcial, RLS e policies no catálogo do PostgreSQL (CA-01 a CA-03).
- Testar dois tenants e duas pessoas do mesmo tenant. Exercitar leitura sem contexto, acesso permitido, acesso cruzado negado, vínculo cruzado rejeitado, segundo empréstimo ativo rejeitado e preservação da auditoria (CA-02 a CA-04).
- Conferir que geração e teste utilizam configuração descartável, sem ler credenciais de produção (CA-05). Rodar os checks do repositório e encaminhar as evidências ao verificador.

## Limite da tarefa

Esta etapa cobre a estrutura e as garantias do banco. O seed e o login estão na Entrega 3. Limite de três empréstimos por pessoa e bloqueio por atraso serão aplicados no service transacional da Entrega 4.
