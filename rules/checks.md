# Regras de verificação e checks

## Objetivo

Este arquivo lista os checks mínimos que devem ser usados para validar que o repositório está em um estado consistente com o que pode ser verificado hoje.

## Checks obrigatórios

### 1. Estado de arquivos

- Executar `git status --short`.
- Confirmar que não há alteração inesperada fora do escopo da tarefa atual.
- Se houver arquivo novo, confirmar que ele é realmente necessário para a tarefa.

### 2. Integridade de patch

- Executar `git diff --check`.
- Qualquer problema de whitespace, patch quebrado ou linha vazia estranha deve ser corrigido antes de encerrar a tarefa.

### 3. Verificação de arquivos presentes

- Executar `Get-ChildItem -Force -Recurse -File`.
- Confirmar que os arquivos listados correspondem ao que realmente existe no workspace.
- Não listar pastas ou arquivos não verificados.

### 4. Proibição de afirmações sem evidência

- Não afirmar que um comando funciona sem executá-lo neste repositório.
- Não afirmar que exista app, build, comando de teste, backend ou frontend sem evidência real no workspace.
- Se não houver evidência, o agente deve dizer que ainda não foi verificado.

### 5. Regras de escopo

- Verificar se a tarefa permaneceu dentro do escopo pedido.
- Se uma alteração saiu do escopo, a tarefa não pode ser tratada como concluída.

### 6. Regras de precedência

- Antes de decidir alguma regra ou comportamento, confirmar se ela está em:
  1. `rules/restrictions.md`
  2. `docs/adr/001-stack.md`
  3. `docs/PRD.md`
  4. `docs/specs/` quando existir
  5. código real, quando existir

### 7. Regras de commit e push

- O agente não cria commit nem push.
- Se a tarefa incluir commit ou push, isso fica explícito como ação do usuário.

## Check final antes de encerrar

Antes de responder como concluído, confirmar:

- o comando foi executado;
- a saída foi revisada;
- o resultado bate com o que o agente está afirmando;
- a tarefa respeitou o escopo;
- não houve suposição sem evidência.

## O que não é permitido

- escrever comando de build sem execução real no repo;
- escrever comando de teste sem execução real no repo;
- escrever comando de execução de app sem execução real no repo;
- citar arquivos inexistentes;
- listar pastas planejadas como se já existissem;
- dizer que a tarefa terminou quando um check fallou.
