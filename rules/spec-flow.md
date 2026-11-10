# Spec flow

## Objetivo

Este arquivo define o ciclo de uma funcionalidade no repositório: partir da spec, seguir para plano e então para tarefas.

## Fluxo

1. A funcionalidade começa com a especificação e critérios de aceite identificados como `CA-NN`.
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
- Neste repositório, os arquivos da etapa se chamam `spec.md`, `plano.md` e `tarefas.md`.
- Uma spec sem plano ou tarefas deve declarar explicitamente que ainda está em rascunho e não está pronta para implementação.
- Uma spec implementada só pode ser considerada pronta quando seus critérios possuem evidência conforme `rules/tests.md` e os comandos de `rules/checks.md` passam.

## O que o agente não pode fazer

- inventar funcionalidade sem pedido;
- ignorar a existência de spec quando ela existir;
- mover o escopo para um plano mais amplo sem aprovação.

## Operação

- O agente não cria commit nem push. Esse passo continua sendo do usuário.
- Se a tarefa exige mudança de arquitetura ou de regra de negócio, ela precisa ser revisada antes de continuar.

## Antes de declarar uma spec pronta

- Delegue ao subagente `verificador-spec` (`agents/verificador-spec.md`), passando o caminho da spec e o que deve ser verificado.
- A spec só pode ser declarada pronta com `Veredito: PRONTA`.
- Qualquer outro resultado volta para as tarefas. Quem corrige é o agente principal; o verificador nunca corrige.
