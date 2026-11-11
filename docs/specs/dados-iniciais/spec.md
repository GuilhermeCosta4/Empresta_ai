# Spec 002 — Dados iniciais

**Status:** Em implementação. Persistência e login validados localmente. Carga e validação do deploy pendentes.

## Objetivo

Preparar o ambiente para que o professor consiga autenticar-se na Vercel e para que o tenant `suporte_ti` tenha os 12 equipamentos iniciais com fotos públicas.

## Decisões e requisitos

- Usar [a lista obrigatória](../../../skills/imagens-equipamentos/assets/equipamentos.json) como fonte da carga. São quatro notebooks, três monitores, três cabos e duas câmeras. TI-0004, TI-0007 e TI-0010 ficam em manutenção. Os outros nove começam disponíveis em um ambiente sem empréstimos. O responsável aprovou os três patrimônios porque a lista obrigatória especifica a situação por item.
- Identificar cada equipamento por tenant e patrimônio. Usar o [schema de persistência](../persistencia/spec.md) como base da migration e incluir no equipamento uma referência estável à imagem. A disponibilidade é derivada de manutenção e empréstimos ativos.
- Usar as fotos da skill e seu [manifesto](../../../public/images/equipment/manifest.json). Publicar no bucket público `equipment-images`, com um objeto por patrimônio no caminho `equipment/<patrimônio>.jpg`. A repetição usa o mesmo caminho. Conferir a adequação visual da foto de TI-0012 antes do upload.
- Provisionar `marcelo.grilo@institutojef.org.br` no Supabase Auth com a senha padrão informada pelo responsável no ambiente apropriado. Vincular o ID do Auth ao tenant `suporte_ti` com papel `colaborador`, o papel suficiente para a correção.
- Executar o seed com `SUPABASE_TEACHER_USER_ID` apontando para o UUID retornado pelo Auth. O valor é local ou variável de ambiente do deploy e não entra no Git. O seed não cria usuário nem senha.
- Autenticar e-mail e senha pelo Supabase Auth com a integração de sessão do [ADR-001](../../adr/001-stack.md). Recusar credenciais inválidas e acesso sem vínculo. Proteger a entrada autenticada, renovar a sessão e permitir sair. As regras de acesso são exercitadas com contas de teste separadas.
- O login real usa a raiz e encaminha para `/inicio`. A demonstração anterior fica isolada em `/demo`. Login e logout usam tRPC na mesma origem, com cookies `HttpOnly` e `Secure` em produção. O servidor confere vínculo no login e em cada acesso à área autenticada. O limite de tentativas usa contador PostgreSQL por conta e por IP em uma janela de 15 minutos.
- Repetir o seed sem duplicar o tenant, a membership ou os equipamentos. Preservar IDs, credenciais e empréstimos existentes. A carga cria zero empréstimos. Se a conta do professor já tiver empréstimos, reportar a divergência ao responsável para conferência.
- O responsável executa as escritas no Auth, banco e Storage de produção. A senha e as credenciais de escrita ficam fora do Git e dos logs. Os testes automatizados usam ambiente local.

## Critérios de aceite

- **CA-01:** No ambiente de teste, credenciais válidas e vínculo autorizado abrem a área autenticada. Senha inválida, ausência de sessão e ausência de vínculo impedem acesso. O logout encerra a sessão.
- **CA-02:** A carga em banco local cria exatamente os 12 patrimônios da lista em `suporte_ti`, com nome, categoria e referência à imagem. Os únicos patrimônios em manutenção são TI-0004, TI-0007 e TI-0010. A carga cria zero empréstimos.
- **CA-03:** Duas execuções da carga preservam as identidades e a quantidade de equipamentos, tenant e membership. Empréstimos existentes e credenciais são preservados.
- **CA-04:** Cada referência mapeia para uma foto distinta do manifesto, em JPEG de 800 × 600, com créditos. O caminho público por patrimônio é determinístico.
- **CA-05:** Na Vercel, o responsável comprova que a conta do professor autentica e tem zero empréstimos. A conferência usa evidência sem expor a senha.
- **CA-06:** No deploy, a carga contém os 12 patrimônios e as 12 URLs abrem sem login. A conferência confirma a situação de cada item e as dimensões das fotos.

## Fora de escopo

Catálogo conectado e seu crédito na tela, solicitação e devolução de empréstimos, tela de Operações, cadastro de equipamentos pela interface e importação de planilha. A Entrega 4 cobre catálogo, solicitação e a visualização de empréstimos em aberto.
