# Tests

## Objetivo

Este arquivo define o limite de operação para escrita e ajuste de testes no repositório.

## Regra principal

- Teste não é opcional quando a tarefa toca em regra de acesso, isolamento de tenant, policy, segurança ou schema.
- O teste deve validar o comportamento real e não apenas um mock.
- O teste deve rodar contra banco local, nunca contra o ambiente remoto.

## O que precisa existir em teste

- Quando a regra é de acesso ou isolamento, o teste precisa provar que um tenant não vê dado de outro tenant.
- Quando a tarefa muda schema, o teste precisa cobrir a mudança relevante e o comportamento esperado.
- Quando a tarefa muda regra de autorização, o teste precisa cobrir a falha e o caso permitido.

## O que o agente não pode fazer

- escrever teste que só valida mock ou estrutura vazia;
- testar contra banco remoto por conveniência;
- dizer que o caso está coberto sem evidencia real de execução;
- trocar a regra de produto por um teste de conveniência.

## Verificação mínima

Antes de encerrar a tarefa, confirmar:

- o teste corresponde ao comportamento real que foi alterado;
- o ambiente de execução foi o local e não o remoto;
- a política de acesso foi testada de forma explícita.

## Operação

- O agente não cria commit nem push. Esse passo continua sendo do usuário.
- Se a tarefa mudar a regra de teste, a mesma precisa ser revisada antes de ser considerada concluída.
