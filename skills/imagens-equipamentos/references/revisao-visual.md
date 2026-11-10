# Revisão visual e publicação

## Aprovação humana obrigatória

Abra cada candidato e aprove somente quando todos os itens forem verdadeiros:

- o equipamento pesquisado é o assunto principal;
- não há pessoa identificável;
- não há marca ou logo legível;
- não há texto legível;
- nenhuma tela exibe conteúdo;
- a imagem suporta corte horizontal em 4:3 sem perder o equipamento;
- a foto ainda não foi usada por outro patrimônio.

Rejeite e registre um motivo concreto quando qualquer item falhar. Não use análise automática como substituta da inspeção visual.

## Garantias por código

Os scripts garantem:

- fonte restrita à API do Pixabay;
- IDs de foto únicos;
- arquivos JPEG com exatamente 800 × 600;
- nomes determinísticos por patrimônio;
- manifesto com fotógrafo, página original e licença;
- repetição do processo sem criar um segundo arquivo para o mesmo patrimônio.

## Créditos

O manifesto deve manter, para cada foto:

- ID do Pixabay;
- nome e perfil do colaborador;
- página original da foto;
- link da Pixabay Content License.

A tela que exibir as imagens deve mostrar `Fotos: Pixabay` com link para `https://pixabay.com/`.

## Supabase Storage

O agente somente prepara os arquivos. A publicação é uma ação humana posterior:

- bucket público planejado: `equipment-images`;
- caminho determinístico: `equipment/<patrimonio>.jpg`;
- ao repetir, substituir o mesmo caminho em vez de criar outro nome;
- conferir a URL pública e as dimensões depois do upload.

Não adicione comando de upload a esta skill e não carregue uma secret key para executá-la.
