# Spec: Schema inicial de persistência

**Status:** Rascunho. Ainda não possui `plano.md` nem `tarefas.md` e não está autorizada para implementação.

## Objetivo

Definir as tabelas necessárias para persistir tenants, memberships, equipamentos, empréstimos e auditoria na primeira versão do sistema.

## Decisões de modelagem

- Cada registro de equipamento representa uma unidade física identificável, com etiqueta única dentro do tenant.
- O Supabase Auth é a fonte das credenciais e dos IDs de usuário; não haverá tabela local de senhas ou usuários.
- A membership vincula o ID do Supabase Auth a um tenant e a um papel: `colaborador`, `operacoes` ou `admin`.
- Uma solicitação aceita cria imediatamente um empréstimo ativo, com vencimento 14 dias após a retirada registrada.
- Empréstimos são preservados como histórico. A devolução preenche data e ator, sem apagar o registro.
- A disponibilidade do equipamento é derivada: não está em manutenção e não possui empréstimo ativo.
- A devolução pode ser registrada pelo colaborador responsável ou por Operações; o ator que a registrou fica armazenado.
- Todo dado de domínio pertence a um tenant. O tenant é resolvido pela sessão no servidor, nunca aceito como tenant arbitrário do cliente.

## Tabelas

| Tabela | Dados principais |
|---|---|
| `tenants` | Identificador, nome e slug único; o tenant inicial é `suporte_ti`. |
| `memberships` | Tenant, `auth.users.id` externo e papel; combinação tenant/usuário única. |
| `equipment` | Tenant, etiqueta patrimonial, nome, categoria, detalhes opcionais e indicador de manutenção; etiqueta única por tenant. |
| `loans` | Tenant, equipamento, membership responsável, datas de retirada, vencimento e devolução, além da membership que registrou a devolução. |
| `audit_events` | Tenant, ator, ação, tipo e ID do recurso, metadados JSON e data; append-only. |

As referências entre equipamentos, empréstimos e memberships devem impedir vínculos entre tenants diferentes. Deve existir no máximo um empréstimo ativo por equipamento. Uma membership pode ter no máximo três empréstimos ativos, e não pode criar outro se possuir empréstimo vencido; essas duas regras dependem de operação transacional no service e não são substituídas por validação da tela.

## Isolamento e acesso

- Habilitar RLS em todas as tabelas e usar deny by default.
- As policies de tabelas de domínio comparam `tenant_id` ao contexto de tenant definido pelo servidor dentro da transação.
- O servidor aplica autorização primária por meio dos procedimentos do ADR-001; RLS é defesa em profundidade para erros de filtro.
- Memberships só podem ser consultadas por seu usuário e pelo papel de Operações/admin do mesmo tenant.
- Colaboradores só podem ler seus empréstimos; Operações/admin podem operar os registros do tenant.
- Auditoria permite inserção, mas não atualização nem remoção.
- A role de runtime do Prisma deve ser considerada explicitamente; uma role com `BYPASSRLS` não é restringida por policies.

## Fora de escopo

- Endpoints, services, autenticação, autorização da aplicação e interface.
- Regras de limite e atraso implementadas no service, além de constraints estruturais do banco.
- Cadastro de modelos de equipamento como catálogo separado; categoria é texto no equipamento.
- Rate limiting, apesar de previsto no ADR-001, pois não é necessário para os fluxos do PRD cobertos por este schema e será uma tabela operacional separada.
- Execução da migration em ambiente remoto.

## Critérios de aceite

- **CA-01:** Schema Prisma e migration SQL representam as tabelas e relações descritas.
- **CA-02:** Constraints e índices garantem tenant nas referências e empréstimo ativo único por equipamento.
- **CA-03:** RLS e policies estão presentes em migration versionada, sem depender de ajuste manual no painel.
- **CA-04:** Testes locais demonstram isolamento entre tenants e comportamento append-only da auditoria.
- **CA-05:** Nenhum segredo ou conexão remota é usado na geração ou teste local.
