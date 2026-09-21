# ADR-001: Stack e arquitetura da aplicação

- **Status:** Aceito
- **Data:** 2026-09-14
- **Escopo:** primeira versão do sistema de empréstimo de equipamentos internos

## Contexto

O produto substitui uma planilha compartilhada usada para controlar catálogo, empréstimos e devoluções de equipamentos. A primeira versão precisa atender colaboradores e Operações, com login, catálogo, solicitação e devolução de empréstimos, além da visão operacional dos empréstimos em aberto.

O projeto é acadêmico, não possui equipes separadas de front-end e back-end, não tem consumidor externo conhecido e será implantado como uma aplicação web. O isolamento entre tenants deve existir desde o primeiro schema, embora o primeiro tenant seja `suporte_ti`.

## Decisão

### Arquitetura e repositório

| Item | Escolha |
|---|---|
| Arquitetura | Monolito |
| Aplicação | Next.js com App Router, front-end e servidor no mesmo projeto |
| Repositório | Único |
| Deploy | Um projeto na Vercel |
| Camada de servidor | Route Handlers do Next.js, sem servidor separado |

O monolito é de código, não de processo: cada rota pode virar uma function na Vercel, mas o codebase e o deploy permanecem únicos. A separação em projetos criaria dois deploys, dois pipelines e uma fronteira HTTP sem ganho proporcional. A mesma origem também elimina CORS e permite sessão por cookie `httpOnly`.

### Camada de apresentação

| Item | Escolha |
|---|---|
| Linguagem | TypeScript em modo `strict` |
| Renderização | Client Components como padrão para telas com dados |
| Estado de servidor | TanStack Query via `@trpc/react-query` |
| Estado de cliente | `useState` e Context, sem biblioteca de store |
| Formulários | React Hook Form com `zodResolver` |
| Estilização | Tailwind CSS |
| Componentes | shadcn/ui |

O caminho de leitura será único: as telas consultam o servidor por tRPC. Isso evita manter em paralelo acesso direto ao Prisma por Server Components e acesso pelo cliente, com checagens de permissão duplicadas. TanStack Query fornece cache, revalidação e estados de carregamento; o estado local restante cabe em `useState` e Context. O mesmo schema Zod valida formulários e entradas dos procedimentos.

### Camada de servidor

| Item | Escolha |
|---|---|
| Padrão de API | tRPC |
| Endpoint | `app/api/trpc/[trpc]/route.ts` |
| Organização | `src/server/api/routers/<dominio>.ts`, um router por domínio |
| Camadas | Router/procedimento → Service → Prisma |
| Validação de entrada | Zod no `.input()` de todo procedimento |
| Serialização | `superjson` |
| Contexto de request | Sessão, `tenant_id`, `role` e cliente Prisma em `createContext` |
| Server Actions | Não usadas |

O procedimento trata entrada, contexto e permissão; a regra de negócio fica no service para ser testada sem montar contexto tRPC. O contexto é resolvido uma vez, evitando que cada procedimento repita a leitura da sessão e do tenant. Server Actions não serão usadas para não criar um segundo caminho de mutação com validação e autorização diferentes.

### Contrato e tipos

| Item | Escolha |
|---|---|
| Fonte da verdade | `AppRouter` do tRPC |
| Consumo no cliente | `RouterInputs` e `RouterOutputs` inferidos |
| Versionamento | Nenhum |
| Formato de erro | `TRPCError` com código e tratamento por `errorFormatter` |
| Paginação de listas | Cursor, via `useInfiniteQuery` |
| Consumidor externo | Fora de escopo |
| Tempo real | Fora de escopo |

Cliente e servidor sobem no mesmo deploy, portanto não haverá versionamento de contrato. Tipos de resposta não serão escritos manualmente. Listas usarão cursor para evitar os problemas de offset em escritas concorrentes. Atualização de tela será feita por polling do TanStack Query; conexões persistentes não fazem parte desta decisão.

### Dados e persistência

| Item | Escolha |
|---|---|
| Banco | PostgreSQL gerenciado pelo Supabase |
| ORM | Prisma |
| Dono do schema | Prisma Migrate, único |
| RLS, policies e triggers | SQL bruto dentro das migrations do Prisma |
| Instância do Prisma | Singleton global, compatível com hot reload |
| Conexão de runtime | Supavisor, porta `6543`, `?pgbouncer=true&connection_limit=1` |
| Conexão de migration | `directUrl`, porta `5432` |
| Seed | `prisma/seed.ts`, idempotente, criando o tenant `suporte_ti` |

Prisma Migrate será o único dono do schema. RLS, policies e triggers serão versionados em SQL nas migrations, e não aplicados manualmente pelo painel ou pela Supabase CLI. A conexão de runtime usará pooler com limite de uma conexão por instância serverless; migrations usarão a conexão direta.

### Multi-tenancy

| Item | Escolha |
|---|---|
| Modelo | Tenant discriminado por coluna, em banco único |
| Coluna | `tenant_id` em toda tabela de domínio |
| Vínculo usuário–tenant | `memberships (user_id, tenant_id, role)` |
| Primeiro tenant | `suporte_ti`, criado no seed |
| Origem do tenant | Sessão, resolvida no `createContext`, nunca pelo input |
| Aplicação do filtro | `tenantProcedure` injeta `tenant_id` no service |

Toda tabela de domínio terá `tenant_id`, para que nenhuma tabela fique sem possibilidade de isolamento por policy. Uma pessoa poderá pertencer a mais de um tenant com papéis diferentes. O tenant será obtido da sessão, e não aceito como entrada do cliente. O filtro será aplicado pelo middleware e passado ao service, reduzindo o risco de uma chamada esquecer o `where` de isolamento.

### Autenticação e autorização

| Item | Escolha |
|---|---|
| Provedor de identidade | Supabase Auth, e-mail e senha |
| Cadastro | Fechado, somente por convite de administrador |
| Integração com Next.js | `@supabase/ssr` |
| Sessão no navegador | Cookie `httpOnly`, escrito pelo `@supabase/ssr` |
| Renovação de sessão | Middleware do Next.js em toda rota |
| Autorização | `protectedProcedure`, `tenantProcedure` e `adminProcedure` |
| RLS | Habilitado em todas as tabelas, deny by default |
| Papel do RLS | Defesa em profundidade, não autorização primária |

A autorização primária ocorrerá no servidor, pois o Prisma usa por padrão um role que bypassa RLS. O RLS continuará habilitado como última barreira caso uma credencial vaze ou um procedimento deixe de aplicar seu middleware. O cadastro será por convite, pois não existe domínio corporativo que permita restringir cadastro aberto.

### Testes

| Item | Escolha |
|---|---|
| Runner | Vitest, único para servidor e componentes |
| Componentes | Testing Library |
| Integração de banco | Testcontainers com PostgreSQL real |
| Teste de procedimento | `createCaller` do tRPC |
| E2E de interface | Playwright |
| Isolamento obrigatório | Um caso por procedimento: tenant A não acessa dados de tenant B |
| Meta de cobertura | Sem percentual; caminhos críticos obrigatórios |

O banco real será usado nos testes de integração para exercitar constraints, cascade, transações e policies. Cada procedimento deverá ter teste de isolamento entre tenants. Os fluxos críticos da operação, como login, abertura de chamado e cadastro de ativo, serão cobertos por Playwright.

### Hospedagem e operação

| Item | Escolha |
|---|---|
| Hospedagem | Vercel, um projeto |
| Plano | Hobby |
| Região das functions | Padrão do Hobby, Estados Unidos |
| Região do Supabase | `sa-east-1`, São Paulo |
| Limite de execução | 60 s por request |
| Fila e agendamento | Fora de escopo; tudo roda dentro do request |
| Configuração | Variáveis de ambiente validadas com Zod no boot |
| Log | JSON estruturado com `request_id` e `tenant_id` |
| Rastreamento de erro | Sentry |
| CI | GitHub Actions |
| Migration em deploy | `prisma migrate deploy` em job do GitHub Actions antes do deploy |

O plano Hobby é aceito somente enquanto o projeto permanecer didático e não comercial. As functions ficarão na região padrão do Hobby, apesar do banco estar em São Paulo; essa latência é aceitável para demonstração e será o primeiro ponto a rever em uso real. Migrações ocorrerão no CI, nunca no boot das functions, para evitar execuções concorrentes.

### Segurança

| Item | Escolha |
|---|---|
| Cabeçalhos HTTP | Configurados em `next.config.js` |
| CSP | Restritiva, sem `unsafe-inline` |
| Rate limit | Por IP e por usuário, com contador no PostgreSQL |
| Segredos | Environment variables da Vercel, sem prefixo `NEXT_PUBLIC_` |
| `service_role` do Supabase | Somente em código de servidor |
| Auditoria | Tabela append-only com ator, tenant, ação e recurso |

Rate limit não será mantido em memória, pois instâncias serverless não compartilham estado. A chave `service_role`, que ignora RLS, jamais será alcançável pelo bundle do cliente. A auditoria será criada desde o início para registrar quem alterou cada recurso.

### Qualidade de código

| Item | Escolha |
|---|---|
| Lint e formatação | ESLint e Prettier |
| Hook de pré-commit | lint-staged e husky, somente lint e formatação |
| Convenção de commit | Nenhuma automação; mensagem escrita pela pessoa |

## Alternativas descartadas

| Alternativa | Motivo do descarte |
|---|---|
| Front-end e API em projetos separados | Criaria fronteira HTTP, CORS e dois deploys sem equipe separada para justificar |
| REST com OpenAPI gerado | Exigiria geração e cliente versionado que o tRPC dispensa |
| GraphQL | Custo de schema, resolvers e cache não se paga no volume atual |
| Server Actions para mutação | Criaria segundo caminho de validação e permissão |
| Server Components buscando direto no Prisma | Criaria segundo caminho de leitura e de checagem de tenant |
| RLS como autorização primária | Prisma bypassa RLS por padrão; fazê-lo valer exigiria configuração de sessão a cada request |
| Cliente Supabase para acesso a dados | Espalharia os acessos e tiraria o Prisma de dentro do contrato tRPC |
| Cadastro aberto por e-mail | Qualquer pessoa com a URL poderia criar conta |
| SSO corporativo | Não há identidade corporativa para federar |
| Sessão em `localStorage` | Token ficaria legível por XSS; cookie `httpOnly` é suficiente na mesma origem |
| Supabase CLI como dono das migrations | Criaria dois donos de schema |
| CASL ou biblioteca de política | As regras cabem nos três middlewares tRPC definidos |
| Zustand ou Redux | O estado local restante é pequeno |
| MUI ou Mantine | O visual do Figma precisaria lutar contra a biblioteca |
| BullMQ ou pg-boss | Não há volume assíncrono conhecido e a Vercel não hospeda worker de vida longa |
| Schema ou banco por tenant | Multiplicaria migrations sem exigência que justifique |
| Prisma mockado nos testes | Não exercitaria constraints, transações e policies reais |

## Consequências

### Fica mais fácil

- Alterações no retorno de um procedimento quebram no build a tela consumidora.
- Sessão segura por cookie `httpOnly`, sem domínio próprio nem CORS.
- Uma feature inteira cabe em um PR e em um repositório.
- Menos infraestrutura: um projeto Vercel, um CI e um runner de testes.
- Deploy atômico de tela e servidor.

### Fica mais difícil

- Escalar front-end e servidor de forma independente.
- Manter a fronteira servidor/cliente, pois um import incorreto pode expor segredo no bundle.
- Aproveitar Server Components para acesso direto a dados.
- Lidar com latência entre functions nos EUA e banco em São Paulo.
- Executar operações que excedam 60 s.
- Fazer envio de e-mail e integrações externas sem segurar a resposta.
- Manter middlewares e RLS coerentes ao longo do tempo.

### O que fica caro mudar depois

- Atender consumidores não-TypeScript: será necessário expor REST ou outro contrato.
- Adicionar conexão aberta, processamento longo, fila ou agendamento: exigirá infraestrutura fora da Vercel.
- Separar servidor e front-end: o acoplamento de tipos torna a separação trabalhosa.
- Trocar Prisma ou sair do Supabase: migrations, Auth e policies estão acoplados à solução.
- Adicionar `tenant_id` a uma tabela existente: exigirá backfill e revisão das queries.
- Federar identidade corporativa: exigirá migrar usuários cadastrados por e-mail e senha.

## Dependência do contexto acadêmico

O plano Hobby da Vercel é adequado enquanto o projeto for didático e não comercial. Se a empresa passar a usar o sistema, a migração para o plano Pro deverá ocorrer antes desse uso.

## Fora do escopo deste ADR

- Modelagem de domínio, entidades e relacionamentos.
- Design system, tokens e identidade visual.
- Papéis e matriz de permissão dentro de cada tenant.
- Provisionamento de tenant e convite de usuários.
- Provedor de e-mail transacional e outras integrações.
- Backup, retenção e plano de recuperação.
- Quantidade de ambientes, promoção entre ambientes e política de branch.
- Feature flags.
- Observabilidade além de logs e erros, incluindo métricas e tracing distribuído.
- LGPD, base legal, retenção e exclusão de dados.
- SLO, meta de latência e orçamento de custo.
