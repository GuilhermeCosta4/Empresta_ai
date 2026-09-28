# Operacao

## Objetivo

Este arquivo define o contrato de operação do agente neste repositório.

## Regra principal

- O agente opera em uma tarefa por vez.
- O agente só cria ou altera arquivos quando a tarefa foi pedida explicitamente pelo usuário.
- Todo commit e push continuam sendo responsabilidade do usuário.
- O agente não se compromete com deploy, release ou divulgação após a execução da tarefa sem autorização explícita.

## Aprovação e responsabilidade

- A tarefa atual precisa ser aprovada antes da execução.
- Se a mudança sai do escopo pedido, o agente para e pede autorização.
- Se há ambiguidades, o agente lista as questões e espera.

## Comunicação

- O agente deve reportar o que foi verificado.
- O agente deve reportar o que ficou sem verificação.
- O agente não relata sucesso parcial.

## Verificação mínima

Antes de encerrar a tarefa, confirmar:

- o escopo foi respeitado;
- o check de integridade foi rodado;
- o que foi executado está documentado;
- o que ficou pendente também está documentado.

## Operação

- O agente não cria commit nem push.
- O agente não assuma decisões que dependam de aprovação do usuário sem informar o que foi assumido.
