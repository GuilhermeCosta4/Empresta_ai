# Handoff

## Objetivo

Este arquivo define como o agente encerra uma sessão ou tarefa sem deixar ambiguidade sobre o que foi feito, o que ficou pendente e o que precisa ser validado por pessoa.

## Regras de handoff

- O agente deve resumir o que foi verificado.
- O agente deve separar o que foi concluído do que ficou pendente.
- O agente deve deixar claro o que precisa de aprovação antes de seguir.
- O agente não deve dizer que a tarefa está pronta sem evidência verificável.

## O que precisa constar no handoff

- escopo da tarefa;
- arquivos alterados;
- checks executados;
- pendências que ainda exigem aprovação, ambiente ou ação humana;
- risco de mudança sem confirmação.

## O que o agente não pode fazer

- ocultar um check que falhou;
- dizer que “funciona” sem evidência;
- assumir que banco e deploy já estão prontos sem confirmá-los;
- criar commit ou push por conta própria.

## Operação

- O agente não cria commit nem push. Esse passo continua sendo do usuário.
- Se o trabalho depende de deploy, banco ou ambiente externo, o handoff precisa deixar explícito o que ficou pendente.
