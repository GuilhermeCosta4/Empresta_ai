# Spec flow

## Objetivo

Este arquivo define o ciclo de uma funcionalidade no repositório: partir da spec, seguir para plano e então para tarefas.

## Fluxo

1. A funcionalidade começa com a especificação.
2. A partir da spec, o agente elabora ou revisa um plano.
3. O plano vira tarefas executáveis, com escopo claro e sem acoplamento indevido.
4. A implementação só acontece depois da revisão do fluxo.

## Regra de arquivo

- O agente não cria estrutura de funcionalidade sem que a tarefa esteja clara e aprovada.
- O agente não lê código como se fosse spec.
- O agente não usa o código como fonte de verdade quando a spec estiver em conflito com ele.

## O que vale como regra de operação

- Se não há spec, a funcionalidade não deve ser implementada como se já estivesse definida.
- O plano e as tarefas devem refletir o escopo aprovado.
- O agente deve mostrar o que será criado antes de criar.

## O que o agente não pode fazer

- inventar funcionalidade sem pedido;
- ignorar a existência de spec quando ela existir;
- mover o escopo para um plano mais amplo sem aprovação.

## Operação

- O agente não cria commit nem push. Esse passo continua sendo do usuário.
- Se a tarefa exige mudança de arquitetura ou de regra de negócio, ela precisa ser revisada antes de continuar.
