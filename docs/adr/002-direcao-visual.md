# ADR-002: Direção visual do protótipo

- **Status:** Aceito
- **Data:** 2026-10-02
- **Escopo:** experiência demonstrativa de entrada e catálogo de equipamentos

## Contexto

O protótipo de entrada e catálogo precisa apresentar os equipamentos de forma expressiva sem comprometer a leitura de nomes, categorias e situações. A spec do catálogo pede uma interface expressiva e legível em desktop e mobile, mas deixa identidade visual oficial e design system fora do escopo.

O layout implementado já estabelece uma linguagem visual própria para essa demonstração: composição editorial, fotografia dos equipamentos, fundo claro, verde profundo e acentos quentes, além de títulos serifados combinados com texto sem serifa.

## Decisão

Adotar a direção visual já aplicada no protótipo como referência para a experiência demonstrativa de entrada e catálogo:

- composição editorial, com hierarquia tipográfica clara e áreas de conteúdo e imagem;
- base clara e paleta com verde profundo e acentos quentes, mantendo contraste suficiente para textos e estados;
- títulos em serifada e textos funcionais em sem serifa;
- fotografias relacionadas aos equipamentos como parte da apresentação do catálogo;
- adaptação responsiva, preservando leitura e acesso às ações em telas menores.

Essa decisão não define identidade visual oficial da organização, tokens compartilhados nem um design system para telas futuras. A prioridade funcional continua sendo distinguir claramente disponibilidade, empréstimo e manutenção.

## Alternativas consideradas

| Alternativa | Motivo da decisão |
|---|---|
| Usar um visual genérico de painel administrativo | Não representa a direção expressiva já definida para a demonstração e reduz a distinção entre a entrada e a experiência de catálogo. |
| Definir agora uma identidade visual e um design system completos | Está além do escopo da spec atual, que limita a decisão à experiência demonstrativa. |
| Deixar a direção visual somente na spec do catálogo | Não registra explicitamente a linguagem visual já adotada como referência para esta experiência. |

## Consequências

### Benefícios

- Entrada e catálogo compartilham uma linguagem visual coerente.
- A apresentação dos equipamentos tem maior destaque sem substituir a clareza dos estados e das ações.
- A decisão fica limitada ao protótipo, sem antecipar uma identidade institucional ainda não definida.

### Custos e limites

- A direção deve ser revista se a organização aprovar uma identidade visual oficial.
- Novas telas não herdam automaticamente essa paleta ou tipografia; sua direção visual deve ser definida no escopo correspondente.
- O uso de fotografias exige imagens adequadas e alternativas textuais acessíveis.

## Fora do escopo

- Identidade visual oficial, logotipo e aplicações de marca.
- Tokens compartilhados, biblioteca de componentes ou design system.
- Direção visual de telas operacionais que não fazem parte do protótipo descrito na spec do catálogo.