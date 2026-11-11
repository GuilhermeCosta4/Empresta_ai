# Entrega da prática

**Rascunho.** Os links, hashes das próximas etapas e resultados de produção serão preenchidos com evidência após a implementação.

## Links

- Repositório GitHub e tag `entrega-pratica` — pendentes de confirmação.
- Produção na Vercel — link e validação pendentes.

## 1. Conflitos identificados no enunciado

- **Verificador corrigir um teste.** O pedido do tech lead contraria a independência exigida na Entrega 1. O verificador devolve o CA e a evidência, e o agente principal corrige. Registrado em [rules/spec-flow.md](rules/spec-flow.md) e [agents/verificador-spec.md](agents/verificador-spec.md), commit `b757461`.
- **Senha no arquivo de carga.** Contraria [rules/secrets.md](rules/secrets.md) e o uso do Supabase Auth definido no [ADR-001](docs/adr/001-stack.md). A senha padrão da turma fica no Auth e será informada pelo responsável ao provisionar a conta. A carga pode vincular o ID do usuário ao tenant, sem lidar com a senha.
- **Dois ou três itens em manutenção.** A Entrega 3 cita TI-0004 e TI-0007, mas a lista obrigatória da prática também marca TI-0010. O responsável aprovou manter os três porque a lista define a situação de cada patrimônio. A [spec de dados iniciais](docs/specs/dados-iniciais/spec.md) prevê nove disponíveis e três em manutenção. A fonte é [equipamentos.json](skills/imagens-equipamentos/assets/equipamentos.json).
- **Instalar Sharp por ordem do briefing.** [rules/restrictions.md](rules/restrictions.md) exige uma decisão para bibliotecas ausentes do ADR-001. Sharp consta como dependência de desenvolvimento desde `88752a2`. O responsável aprovou formalizar o uso local da ferramenta para manter o fluxo de fotos já validado. A autorização foi registrada no [ADR-001](docs/adr/001-stack.md).
- **Cinco empréstimos em aberto.** O [PRD](docs/PRD.md) estabelece três itens simultâneos. A decisão é permitir até três empréstimos ativos e recusar o quarto. A spec de empréstimo deve registrar o motivo visível da recusa.
- **Quatorze dias úteis.** O [PRD](docs/PRD.md) fixa prazo de 14 dias. A decisão é contar 14 dias corridos desde a criação do empréstimo imediato e testar a virada de data.
- **Catálogo sem crédito.** O briefing de empréstimo conflita com o contrato da skill. A decisão é mostrar o link “Fotos: Pixabay” na tela do catálogo. O manifesto preserva créditos por imagem. Ver [revisao-visual.md](skills/imagens-equipamentos/references/revisao-visual.md) e [manifest.json](public/images/equipment/manifest.json).
- **Login presumido como pronto.** A abertura do enunciado pressupõe login em produção. A [spec existente](docs/specs/catalogo/spec.md) e `enterDemo` em [page.tsx](src/app/page.tsx) descrevem entrada local sem validação de credenciais. O login real é pré-requisito da Entrega 3 e precisa seguir o ADR-001.
- **Teste em produção com o usuário obrigatório.** A lista final cita o login do professor junto com o fluxo de empréstimo. Verificar o login do professor e o estado inicial sem empréstimos. Executar os testes que criam empréstimos com conta separada.
- **Fotos locais e publicação.** O commit `4c6acad` prepara arquivos locais e remove as quatro fotos demonstrativas antigas. A conclusão em produção exige bucket público, URLs anônimas e crédito na tela. O responsável executa upload e carga em produção. A CSP atual de [next.config.ts](next.config.ts) limita imagens diretas à própria origem, portanto a integração precisa servir por meio da própria origem ou liberar especificamente o host de Storage autorizado, preservando a CSP restritiva.

## 1b. Lacunas para registrar nas specs

- **Carga inicial.** Usar o tenant `suporte_ti` e patrimônio único por tenant, conforme o ADR-001 e [a spec de persistência](docs/specs/persistencia/spec.md). O caminho determinístico proposto é `equipment/<patrimonio>.jpg` no bucket `equipment-images`. A repetição preserva a identidade dos registros e não cria empréstimos nem redefine senha. O papel proposto para o professor é `colaborador`, suficiente para a correção.
- **Operação do deploy.** O ADR-001 atribui migrations ao GitHub Actions antes do deploy, e a prática atribui ao responsável toda escrita em produção. Proposta para conciliar: workflow de migration versionado com disparo humano explícito antes de publicar a versão correspondente. Banco local para testes.
- **Empréstimo.** Catálogo exibe os 12 itens com situação visível, conforme a lista de aceite. O ADR-002 deixa o tratamento de manutenção para a spec. Só o disponível admite solicitação. A operação precisa proteger tanto dois pedidos do mesmo item quanto pedidos concorrentes da mesma pessoa perto do limite. A data é registrada pelo servidor. O significado de vencimento na fronteira do prazo e a apresentação do fuso precisam ficar explícitos na spec.
- **Isolamento.** O tenant vem da sessão. Prisma Migrate é dono do schema, as policies ficam nas migrations e o acesso da aplicação passa por tRPC, service e Prisma. Os testes precisam cobrir sessão inválida, outro tenant, empréstimos de outra pessoa, concorrência, bloqueio por atraso e quarto empréstimo.

## 2. Onde o agente tentou decidir pelo responsável

O agente tratou os testes automatizados das fotos como fechamento da etapa antes de resolver as dúvidas de adequação visual. TI-0012 mostra câmeras antigas, enquanto o item se chama “Câmera compacta”. Essa imagem merece nova revisão antes da publicação. O agente também tratou o simples descarte da skill como candidato a aprovação no teste negativo. O critério literal da Aula 10 exige que ela não apareça.

## 3. Decisão candidata a ADR

O responsável aprovou registrar no [ADR-001](docs/adr/001-stack.md) o uso local do Sharp como dependência de desenvolvimento. A alternativa era substituir a ferramenta. Manter o Sharp reaproveita a geração e a validação automatizadas de 800 × 600 que já passaram.

## 4. Skill de imagens

O SKILL.md define o procedimento, a referência concentra a revisão humana e os scripts verificam formato, dimensões, IDs únicos e créditos. O manifesto registra 12 imagens de 800 × 600. A revisão versionada registra 161 reprovações ativas e uma reconsideração, com razões em [revisao.json](skills/imagens-equipamentos/assets/revisao.json). A publicação fica com o responsável e o procedimento local usa apenas a credencial do Pixabay.

Aula 10: o inventário encontrou uma cópia. Um pedido natural sobre projetores acionou a skill e parou porque os itens não tinham spec aprovada. O pedido de ilustração descartou o procedimento, mas ainda mencionou a skill após a revisão da descrição. O teste negativo estrito segue pendente.

## 5. Subagente verificador

O verificador é acionado pelo fluxo de specs antes do status de pronta, com o caminho da spec e o escopo da implementação. Ele lê regras, spec, plano, tarefas e evidências do monolito. O procedimento limita a verificação a checks locais. O isolamento efetivo de ferramentas e credenciais precisa ser demonstrado no harness usado.

## 6. Verificador em ação

Na revisão da persistência, o verificador apontou que a geração do cliente e o Vitest podiam carregar arquivos de ambiente da raiz, mesmo com a migration de teste confinada ao Docker. Isso comprometia a evidência do CA-05. O agente principal isolou a geração em [prisma/generate-client.mjs](prisma/generate-client.mjs) e desabilitou a leitura automática no [Vitest de integração](vitest.integration.config.mts).

Na rodada final de persistência, o verificador deu `PRONTA`: CA-01 a CA-05 atendidos com [seis testes de integração](tests/integration/persistence.test.ts), lint, tipos, cinco testes unitários, dois E2E e build aprovados. A conferência foi feita em cópia local sem os arquivos de ambiente do repositório.

O CA-01 dos dados iniciais foi exercitado em [auth.test.ts](tests/integration/auth.test.ts), com Supabase Auth, PostgreSQL e Chromium locais. A primeira execução pelo navegador expôs uma divergência entre a origem do navegador e a URL interna do Next. A correção usa o host recebido e HTTPS no deploy da Vercel para a comparação de mesma origem. A validação da conta do professor depende do provisionamento e da carga.

Na solicitação de empréstimo, a revisão apontou lacunas nas evidências de atomicidade e isolamento. A rodada corrigida forçou uma falha na auditoria e comprovou o rollback, conferiu a data no fuso de São Paulo e excluiu empréstimos devolvidos, de outro titular e de outro tenant. A suíte com build de produção e banco descartável passou em 14 testes de integração. Ver [tarefas de empréstimo](docs/specs/solicitar-emprestimo/tarefas.md).

Ainda faltam os hashes da demonstração do erro plantado e removido e as evidências finais de produção.

## 7. Regra posta à prova

A restrição a dependências expôs que instalar a ferramenta pedida pelo briefing exige registrar uma decisão do projeto. A relação entre migration em CI e responsabilidade humana pela escrita em produção também precisa aparecer no plano de operação.

## 8. Fora de escopo e pendências

Devolução, tela de Operações, cadastro de equipamento pela interface, importação da planilha, reserva futura, e-mail e renovação ficam fora da prática. Login, catálogo e solicitação foram validados localmente com build de produção. No Supabase hospedado, o responsável aplicou as duas migrations e executou o seed com 12 equipamentos, um vínculo para o professor e zero empréstimos. Onze fotos do bucket público foram verificadas por HTTP. Restam a substituição e publicação de TI-0012, a conferência na Vercel e a tag.

A migration inicial passou em seis testes no PostgreSQL descartável. O seed passou em três testes: cria exatamente 12 equipamentos, mantém TI-0004, TI-0007 e TI-0010 em manutenção, exige o UUID do professor já existente no Auth, não cria senha e preserva IDs e empréstimos ao ser repetido. A bateria final local passou em lint, typecheck, 5 testes unitários, 12 testes de integração, 2 E2E e build.

Para a carga hospedada, o responsável deve aplicar as migrations, configurar `SUPABASE_TEACHER_USER_ID` com o UUID real da conta já provisionada no Auth, publicar as imagens no bucket e executar `npx prisma db seed` com o banco correto. O seed não cria usuários nem manipula senhas. O `npm audit` apontou alerta crítico no Next.js já presente e alertas na cadeia de dependências de Prisma e Testcontainers. A revisão das versões e correções disponíveis fica registrada como pendência de publicação.
