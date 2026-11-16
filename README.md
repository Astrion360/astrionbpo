# Astrion Assessoria — catálogo digital, assistente local e solicitação de proposta

Site estático multipágina para GitHub Pages, com identidade visual Astrion e recomendação local de serviços e soluções. O assistente não usa API de IA nem serviços de geração de texto. O formulário comercial utiliza **Formspree**, serviço de formulários já utilizado no site institucional da Astrion, para encaminhar pedidos ao e-mail oficial configurado na conta.

## Funcionalidades

- Catálogo pesquisável de **135 serviços**, com fichas e referências de preço.
- **17 soluções comerciais** e as três linhas de atuação.
- Assistente próprio: o visitante descreve o desafio, e o motor local identifica serviços/combos e justifica a sugestão.
- **Seleção voluntária**: recomendações são apenas exibidas. Os botões `Adicionar ao carrinho`, `Não adicionar`, `Retirar do carrinho` e `Reconsiderar` deixam o visitante no controle.
- Carrinho persistido no navegador (localStorage), com totais de projetos e mensalidades separados e sem duplicidades por código.
- Opção de encaminhar o desafio diretamente ao formulário, **mesmo sem adicionar itens ao carrinho**.
- Formulário de contato com nome, e-mail, empresa, telefone, necessidade e prazo. O resumo do carrinho acompanha a solicitação quando houver seleção.
- **Envio após consentimento** por meio do Formspree. O visitante recebe uma confirmação na página apenas quando o serviço confirma o recebimento. Em caso de falha, há opção de abrir o e-mail já preenchido e copiar o resumo.
- Nova apresentação visual, responsividade, estados de seleção e acessibilidade básica.

## Recebimento de mensagens

O site está configurado em `assets/config.js` com:

```
contactEmail: 'contato@astrion360.com.br'
formEndpoint: 'https://formspree.io/f/mwleqwkr'
```

Esse endpoint consta no manual do site institucional da Astrion (agosto de 2026) e deve estar ativo na conta do Formspree, com destino **contato@astrion360.com.br** no Zoho Mail. Não criar ou compartilhar senhas, chaves SMTP ou tokens no repositório.

**Atenção:** o código está pronto, mas não foi realizado um envio real de teste, para não criar solicitações artificiais no e-mail corporativo. Depois de publicar:

1. Abra `contato.html` pelo domínio publicado.
2. Preencha uma solicitação identificada como `TESTE INTERNO` com um e-mail seu e escolha um item do carrinho.
3. Verifique a confirmação do site, a caixa de entrada do Zoho, o Spam e o painel do Formspree.
4. Se o Formspree não entregar, verifique se `mwleqwkr` permanece ativo, se o destino está verificado e se não há bloqueios de origem ou limites do plano. O botão de e-mail manual funciona como alternativa.

O serviço de formulário é independente do motor de recomendações, que opera 100% no navegador.

## Publicação no GitHub Pages

1. Extraia o ZIP.
2. Envie **todos os arquivos de dentro da pasta**, inclusive o diretório `assets/`, para a raiz do repositório GitHub escolhido.
3. Abra **Settings → Pages → Deploy from a branch → main → /(root)**.
4. Confirme a publicação pela URL do repositório.

Os links são relativos e funcionam em projetos com subpasta do GitHub Pages ou domínio próprio. Nenhum build, framework, Node, API de IA ou Cloudflare Worker é necessário. Evite adicionar chaves ao GitHub. 

## Estrutura e manutenção

- `index.html`, `solucoes.html`, `solucao.html`, `servicos.html`, `servico.html`: apresentação e catálogo.
- `assistente.html`: descrição do desafio, análise local e escolhas voluntárias.
- `carrinho.html`: seleção e revisão do orçamento.
- `contato.html`: envio de pedido e confirmação.
- `privacidade.html`: informações sobre o processamento local e envio voluntário.
- `assets/catalog-data.json`: catálogo editável; `catalog-data.js`: dados carregados nas páginas.
- `assets/inteligencia-astrion.js`: regras de recomendação; `assets/carrinho-astrion.js`: regras e armazenamento do carrinho.
- `assets/app.js`: comportamento, cartões, carrinho e envio de formulário.
- `assets/styles.css` e `assets/visual-v3.css`: estilos do site.
- `assets/config.js`: endereço de destino, endpoint institucional e validade.
- `tools/atualizar_catalogo.py`: sincronização e validação do catálogo; `tools/validar_assistente.js`: testes das recomendações.

Para editar serviços e preços, altere `assets/catalog-data.json` e execute `python tools/atualizar_catalogo.py`. O prazo de validade comercial aparece em `assets/config.js` e nos rodapés; mantenha ambos coerentes.

## Privacidade e limitações

A descrição digitada no assistente é analisada **localmente**. Nenhuma consulta é enviada a um fornecedor de IA. Apenas quando o usuário escolhe enviar uma proposta e confirma o formulário, seus dados e a lista selecionada são encaminhados pelo Formspree ao canal comercial. A transferência ao Formspree requer conexão à internet e o serviço pode impor limites e filtros antispam. O carrinho guarda apenas identificadores dos itens em `localStorage`; a transferência da descrição da análise para o formulário usa `sessionStorage` temporariamente quando o usuário pede para encaminhar o desafio.

Preços são referências para orçamento, não contratação. Solicitações e recomendações não representam aprovação automática, promessa de resultado ou fechamento do negócio.

## Verificações efetuadas antes do ZIP

- Integridade e códigos de 135 serviços e 17 soluções por `tools/validar_assistente.js`.
- Testes da interface em Chrome/Playwright com HTML/CSS/JS incorporado, incluindo opção de não adicionar, inclusão, remoção e reconsideração, estados do formulário com resposta de sucesso/falha simulada, e verificação de ausência de overflow horizontal no celular.
- Envio de dados testado com resposta **simulada**; não houve entrega externa real nem publicação no GitHub.
