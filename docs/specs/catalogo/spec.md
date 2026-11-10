# Spec: Login e catálogo demonstrativo

**Status:** Implementada, com evidência automatizada dos critérios de aceite.

## Objetivo

Definir uma experiência visual de entrada e catálogo para que uma pessoa colaboradora explore equipamentos internos e identifique a situação de cada item.

## Público

Colaboradores que precisam consultar equipamentos disponíveis para empréstimo.

## Requisitos

- A tela inicial apresenta um formulário visual de e-mail e senha.
- O envio do formulário entra em uma demonstração local e abre o catálogo; não valida credenciais nem cria sessão.
- O catálogo pode ser aberto a partir da demonstração e permite voltar à entrada.
- A tela apresenta uma lista de equipamentos de demonstração.
- Cada equipamento exibe sua situação, distinguindo itens disponíveis, emprestados e em manutenção.
- A ação visual de solicitar empréstimo aparece somente para itens disponíveis.
- Busca e filtros de categoria e situação atualizam a lista localmente.
- Uma solicitação demonstrativa dá feedback visual local, sem criar empréstimo real.
- A interface tem direção visual expressiva, mantendo leitura clara de nomes e situações.
- Os dados são locais e demonstrativos. A tela não cria nem persiste empréstimos reais.
- O protótipo não implementa integração com API nem validação real de elegibilidade.

## Regras de negócio relacionadas

- O PRD determina que equipamento em manutenção não está disponível.
- O PRD permite solicitar item disponível e limita cada pessoa a três itens simultâneos; pessoas com item atrasado não podem solicitar outro.
- Como este protótipo não tem sessão nem servidor, os limites por pessoa não são aplicados por ele. A solicitação demonstrativa não substitui validação no servidor.
- O PRD pede login por e-mail e senha; esta tela apresenta apenas a forma visual do login, sem autenticação.

## Fora de escopo

- Autenticação, criação de sessão e recuperação de senha.
- Persistência ou envio de solicitações reais.
- Catálogo conectado ao banco ou a procedimentos tRPC.
- Tela de operações, cadastro de equipamentos e devolução.
- Definição de identidade visual de marca, paleta oficial ou design system além do direcionamento expressivo.

## Critérios de aceite

- **CA-01:** A tela permite distinguir visualmente equipamentos disponíveis, emprestados e em manutenção.
- **CA-02:** O formulário de entrada abre o catálogo em modo demonstrativo, sem alegar autenticação real.
- **CA-03:** Somente itens disponíveis apresentam a ação de solicitação.
- **CA-04:** A busca e os filtros combinam corretamente sobre a lista demonstrativa.
- **CA-05:** Nenhuma ação da tela é apresentada como empréstimo persistido ou real.
- **CA-06:** Em viewport desktop de 1440 × 900 px, o título do catálogo, a busca e o primeiro equipamento permanecem visíveis, sem overflow horizontal na página.

## Dependências e limites

- O scaffold Next.js está em `src/app/`.
- A stack aprovada no ADR-001 é Next.js App Router, TypeScript strict, Tailwind CSS e shadcn/ui.
- A integração real de dados deve seguir a arquitetura tRPC definida no ADR-001; este protótipo local não a implementa.
