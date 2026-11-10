---
name: imagens-equipamentos
description: Busca, revisa, padroniza e registra imagens de equipamentos obtidas pela API do Pixabay. Use ao preparar fotos do catálogo, popular imagens de equipamentos ou validar dimensões, créditos e duplicidade. Não use para logos, imagens da landing page, ilustrações ou upload ao Supabase.
---

# Imagens de equipamentos

## Precedência

Esta skill executa um procedimento; ela não decide produto nem arquitetura. Em conflito, valem `rules/`, `docs/adr/`, o PRD e a spec aprovada. Pare e avise.

## Antes de começar

1. Confirme que a spec com os equipamentos e seus critérios de aceite está aprovada.
2. Confirme que `PIXABAY_API_KEY` existe somente em `.env.local` e não mostre seu valor.
3. Leia `assets/equipamentos.json` e [references/revisao-visual.md](references/revisao-visual.md).
4. Não carregue credencial de escrita do Supabase. Esta skill não publica em produção.

## Procedimento

1. Busque candidatos sem selecionar automaticamente:

   ```powershell
   npm run images:workflow -- buscar
   ```

2. Inspecione cada candidato em `.cache/imagens-equipamentos/<patrimonio>/` conforme a referência. A revisão visual humana é obrigatória.
3. Registre cada reprovação com motivo verificável:

   ```powershell
   npm run images:workflow -- rejeitar TI-0001 <pixabay-id> "motivo"
   ```

4. Aprove uma foto somente após a revisão. Um ID não pode atender dois equipamentos:

   ```powershell
   npm run images:workflow -- aprovar TI-0001 <pixabay-id>
   ```

   Se uma inspeção ampliada justificar rever uma rejeição, registre a justificativa antes de aprovar:

   ```powershell
   npm run images:workflow -- reconsiderar TI-0001 <pixabay-id> "justificativa"
   ```

5. Quando os 12 equipamentos estiverem aprovados, gere as imagens e o manifesto:

   ```powershell
   npm run images:workflow -- finalizar
   npm run images:validate
   ```

6. Entregue os arquivos locais e o manifesto ao usuário. Pare antes de qualquer upload ou escrita no Supabase.

## Saída

- `public/images/equipment/TI-0001.jpg` até `TI-0012.jpg`, sempre em 800 × 600.
- `public/images/equipment/manifest.json`, com origem, autor, página da foto e licença.
- `assets/revisao.json`, com aprovações e reprovações justificadas.

## Não faça

- Não escolha foto sem inspeção visual.
- Não apague uma rejeição sem registrar a reconsideração e sua justificativa.
- Não aceite pessoa, marca ou logo legível, texto ou tela com conteúdo.
- Não repita ID do Pixabay.
- Não use busca manual, outra API ou URL fora do resultado da API do Pixabay.
- Não coloque chave em código, argumento de comando, log, manifesto ou Git.
- Não envie imagens ao Supabase nem execute seed, migration, commit, push ou deploy.
