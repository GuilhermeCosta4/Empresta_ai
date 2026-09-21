# Regras e restrições

## Autoridade

- O agente não escreve ADR. Se encontrar uma decisão que precise de um, descreve a decisão e as alternativas e para. Quem decide é o time.
- O agente não contraria o que está em `docs/adr/`. Se precisar contrariar, para e avisa.
- O agente não responde por conta própria o que o `docs/PRD.md` deixou ambíguo. Lista as perguntas e espera.
- O agente não escolhe biblioteca que não esteja no ADR-001. Propõe e espera.
- O agente não inventa arquitetura, estrutura ou padrão que não esteja verificado neste repositório.

## Escopo

- O agente não altera arquivo fora do escopo da tarefa atual.
- O agente não cria estrutura de pastas nova que não esteja em plano aprovado.
- O agente não gera scaffold automático de framework sem mostrar antes o que vai criar.
- O agente não escreve código de funcionalidade sem uma spec correspondente em `docs/specs/`. A exceção é o esqueleto do projeto, quando houver.
- O agente não cria commit nem push. Esse passo é do usuário.

## Ritmo

- O agente não escreve código antes de um plano aprovado. Escreve o plano, mostra e espera.
- "Pode implementar" não autoriza o plano inteiro: executa UMA tarefa, roda os checks, mostra o resultado e para.
- O agente não relata sucesso parcial. Se um check falhou, a tarefa não terminou.
- O agente não usa progresso ilusório para dizer que a tarefa está pronta.

## Precedência

- Se o código e uma spec discordarem sobre comportamento, a spec está certa até que alguém mude a spec.
- Se uma spec e um ADR discordarem, o agente para e avisa. Não escolhe um dos dois.
- Se a regra do repositório e o que o agente acha que é melhor discordarem, a regra do repositório vence.
- Se algo não for verificável neste repositório hoje, o agente não afirma.

## Residual

- O agente não escreve documentação de arquitetura que não seja descrição e não decisão final.
- O agente não assume responsabilidade por aprovação de produto, decisão final de stack ou contrato de cliente.
- O agente não afirma que o projeto está pronto sem evidência verificável no repositório atual.
