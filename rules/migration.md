# Migration

## Objetivo

Este arquivo define o limite de operação para qualquer mudança que toque em schema ou estrutura persistente.

## Regra principal

- Toda alteração de schema deve ser tratada como migration versionada.
- O agente não altera schema diretamente em banco de produção nem em banco remoto sem aprovação explícita da tarefa.
- A mudança precisa estar refletida em arquivo de migration e em revisão do impacto.

## O que vale como regra

- O agente não inventa alteração de tabela, coluna, índice ou policy sem mostrar o efeito esperado.
- Se a mudança mexe em acesso a dados, ela precisa incluir política de acesso ou regra de isolamento.
- A criação de uma tabela nova exige revisão explícita de acesso e permissões antes de considerar a tarefa pronta.
- A mudança não deve depender de ajuste manual em banco pela interface e sim de processo versionado e reproduzível.

## Modelo inicial derivado do PRD e do ADR-001

Para a primeira versão, considerar o seguinte conjunto de tabelas:

| Tabela | Responsabilidade |
|---|---|
| `tenants` | Organizações isoladas, incluindo o tenant inicial `suporte_ti`. |
| `memberships` | Vínculo entre usuário do Supabase Auth, tenant e papel (`colaborador`, `operacoes` ou `admin`). Não duplicar credenciais em uma tabela local de usuários. |
| `equipment` | Uma linha por unidade física identificável, com nome, categoria e estado de manutenção. A disponibilidade para empréstimo é derivada da ausência de empréstimo ativo e do estado fora de manutenção. |
| `loans` | Empréstimos, vinculando equipamento, tenant e pessoa responsável, com criação, vencimento e devolução. Solicitação aceita cria empréstimo ativo; vencimento padrão é 14 dias. |
| `audit_events` | Registro append-only de ator, tenant, ação e recurso, conforme o ADR-001. |

O modelo deve preservar o histórico de empréstimos; devolver um equipamento encerra o empréstimo, sem apagar seu registro. A regra de negócio deve impedir mais de três empréstimos ativos por pessoa e novas solicitações quando houver empréstimo em atraso. A devolução pode ser registrada pela pessoa responsável ou por Operações; o registro deve identificar quem a confirmou.

Toda tabela de domínio deve carregar `tenant_id`, exceto `tenants`. Referências entre empréstimos e equipamentos ou memberships devem também respeitar o mesmo tenant. Cada migration deve incluir índices e constraints que protejam as relações e impeçam mais de um empréstimo ativo para o mesmo equipamento.

### Acesso e isolamento

- Aplicar autorização primária no servidor com os procedimentos definidos no ADR-001; o tenant vem da sessão e nunca de entrada controlada pelo cliente.
- Habilitar RLS em todas as tabelas, deny by default, como defesa em profundidade. A migration deve incluir as policies SQL e considerar explicitamente o role usado pela conexão Prisma, que pode bypassar RLS por padrão.
- Colaboradores acessam apenas seus empréstimos e equipamentos do tenant; Operações e admins podem consultar e operar os registros do tenant conforme as permissões do procedimento.
- `audit_events` é append-only: a aplicação pode inserir eventos, mas não atualizar nem remover registros.
- Não executar migrations em banco remoto como parte da implementação sem autorização explícita.

## Verificação mínima

Antes de encerrar a tarefa, confirmar:

- o schema mudou por migration versionada;
- a mudança foi revisada do ponto de vista de acesso;
- nenhuma tabela nova ficou sem regra de acesso;
- a alteração ficou dentro do escopo do pedido.

## Fora do escopo

- alterar dados sem pedido;
- rodar migration em ambiente remoto sem autorização;
- assumir que “o banco está certo” sem verificar o impacto da policy.

## Decisão de operação

- O agente não cria commit nem push. Esse passo continua sendo do usuário.
- Se a mudança de schema for grande ou afetar comportamento existente, o agente deve parar, listar os impactos e esperar aprovação.
