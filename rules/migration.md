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
