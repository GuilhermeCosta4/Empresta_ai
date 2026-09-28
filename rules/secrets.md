# Secrets

## Objetivo

Este arquivo define como lidar com variáveis de ambiente, chaves e segredos em um repositório que pode rodar com Supabase, Vercel e app local.

## Regra principal

- Segredo nunca entra em repositório, em commit, em log, em documentação pública, nem em resposta do agente.
- O agente não deve escrever um valor real de chave ou senha em arquivo, terminal, comentário ou mensagem.

## Separação de tipos

- Chave pública: pode existir no cliente e deve ficar em configuração que o navegador possa ler.
- Chave secreta: não pode ficar no cliente e também não pode entrar no repositório.
- Qualquer chave que ignora policy ou bypassa autorização deve ficar apenas em ambiente de servidor e em configuração de runtime apropriada.

## Onde cada valor deve existir

- Arquivo local de ambiente: só para uso local e sem versionamento.
- Ambiente de deploy: só no painel do provedor ou na configuração que o projeto usa em runtime.
- Cliente: só recebe o que é público e explícito, sem risco de autorização.
- Servidor: recebe o que precisa para autenticação, banco e integrações internas.

## O que o agente não pode fazer

- gravar senha, token, secret key ou service role em arquivo versionado;
- colocar chave sensível em exemplo público;
- afirmar que uma variável está correta sem verificar a fonte do valor;
- dizer que um segredo está seguro quando não foi conferido no ambiente real.

## Verificação mínima

Antes de encerrar a tarefa, confirmar:

- não há valor real em arquivos versionados;
- a variável sensível está no lugar correto (servidor ou ambiente local);
- a variável pública não foi confundida com a chave secreta.

## Operação

- O agente não cria commit nem push. Esse passo continua sendo do usuário.
- Se a configuração de env muda o comportamento do projeto, a tarefa precisa ser aprovada antes de ser aplicada.
