# Brasil Mailing Site

Site institucional da Brasil Mailing com consulta quantitativa para levantamento de bases de Pessoa Juridica por UF, cidade, CNAE e tipo de contato.

## Estrutura

- `index.html`: pagina principal.
- `styles.css`: estilos do site.
- `script.js`: interacoes, formulario e consulta quantitativa.
- `assets/`: logo e imagens.
- `data/cnae.json`: tabela de CNAEs para pesquisa.
- `data/pj_quantitativo.json`: dados quantitativos usados na consulta.

## Publicacao no Render

Configurar como Static Site.

- Build Command: deixar vazio.
- Publish Directory: `.`
- Branch: `main`

O arquivo `render.yaml` tambem deixa essa configuracao pronta para Blueprint no Render.

## Contato

O site direciona pedidos para o WhatsApp:

`12 98161-2085`

## Rastreamento de conversoes

As configuracoes ficam centralizadas em `tracking.js`.

- Google Ads: contato pelo WhatsApp (`generate_lead` e conversao direta).
- Google Analytics: levantamento gerado, pedido copiado e clique no WhatsApp.
- Meta: PageView, Lead e EstimateGenerated quando `metaPixelId` estiver preenchido.

Para ativar o Pixel da Meta, informe no campo `metaPixelId` o ID pertencente a
Brasil Mailing. Nao reutilize IDs de outros negocios.
