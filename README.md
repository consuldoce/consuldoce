# CONSULDOCE — Catálogo B2B v32

Versão consolidada com layout responsivo reforçado para iPhone/iOS e Android, mantendo o catálogo B2B, administração, encomendas, stock, PWA, autenticação e integração Supabase/Resend. A v18 acrescenta contacto telefónico estruturado e morada completa no registo de cliente. A v19 acrescenta uma área autenticada de edição dos dados do cliente. A v20 acrescenta múltiplas moradas de entrega. A v21 melhora o seletor de telemóvel para ecrãs móveis e garante que o email de encomenda inclui todos os dados do cliente e as moradas cadastradas. A v23 corrige a largura do campo de telemóvel no registo e na área de cliente, colocando o bloco numa linha própria para garantir espaço suficiente para pelo menos 9 dígitos em ecrãs móveis.


### Alterações v32
- Cartões do catálogo passam a ter estrutura uniforme e proporção visual adequada a fotografias de embalagens.
- As fotografias carregadas pelo backoffice são automaticamente preparadas para um formato normalizado 4:5 (800 × 1000 px), com fundo branco e a embalagem inteira visível, mantendo proporções.
- O mesmo tratamento é aplicado ao carregamento individual e ao carregamento de fotografias em lote.
- A área da imagem do catálogo usa a mesma proporção em todos os cartões, evitando cortes e alturas inconsistentes.
- Cache do Service Worker atualizada.


### Alterações v30
- Área de imagem dos cartões do catálogo aumentada para permitir visualizar produtos com imagens maiores ou mais altas sem cortar a imagem.
- No backoffice, clicar na miniatura da imagem de um produto abre uma pré-visualização ampliada em popup.
- Mantida a seleção e eliminação em massa das imagens dos produtos.
- Cache do Service Worker atualizada.

### Alterações v27
- Arranque da aplicação tornado mais robusto para evitar ecrãs totalmente brancos quando o Supabase demora a responder ou ocorre um erro durante o render.
- Erros de renderização passam a ser apresentados ao utilizador em vez de deixar a página vazia.
- Cache do Service Worker e versões dos assets atualizadas para impedir que uma versão anterior do JavaScript fique presa após o deploy.
- Mantida a funcionalidade de progresso percentual das operações de administração e carregamento de fotografias em lote.

### Alterações v25
- Fluxo de recuperação de palavra-passe separado do login e do catálogo.
- O email de recuperação aponta sempre para `/recovery`.
- A rota `/recovery` é reconhecida mesmo quando aberta como `.../recovery?1`.
- O token de recuperação nunca é tratado como uma sessão normal de cliente: apresenta exclusivamente o formulário para definir a nova palavra-passe.
- A recuperação pede apenas nova palavra-passe e confirmação; não pede a palavra-passe antiga.
- Depois de alterar a palavra-passe, a sessão de recuperação é terminada e o cliente regressa ao login.
- Uma sessão de recuperação não permite entrar automaticamente no catálogo.
- Para o Supabase Auth, o URL `https://consuldoce.pages.dev/recovery` deve estar incluído nos Redirect URLs permitidos.
- Não é necessária migration SQL para esta correção.

### Alterações v23
- Campo de telemóvel colocado numa linha própria no registo e na área de cliente.
- Seletor reduzido a bandeira + indicativo internacional, mantendo o número com largura suficiente para visualizar pelo menos 9 dígitos em telemóveis.
- Layout responsivo ajustado sem alterar a estrutura da base de dados.
- Não é necessária nova migration SQL para esta versão.

### Alterações v18
- Registo de cliente com número de telemóvel obrigatório.
- Seletor de país/indicativo telefónico com bandeira e indicativo internacional, Portugal pré-selecionado.
- Morada estruturada em endereço principal, complemento (andar/lote/fração/etc.), código postal, localidade postal e país.
- Lista de países em português para a morada, com Portugal pré-selecionado.
- Os novos dados são gravados no perfil Supabase e a coluna `address` antiga é mantida para compatibilidade.
- Backoffice de clientes mostra telemóvel e morada estruturada.
- O email de encomenda passa a incluir o telemóvel e a morada completa.

### Correção v17
- Cabeçalho responsivo em ecrãs pequenos, sem sobreposição de logótipo e botões.
- Ações do cabeçalho podem ocupar uma segunda linha e têm scroll horizontal seguro quando necessário.
- Conteúdo, filtros, cartões, modais e carrinho limitados à largura do viewport.
- Catálogo em uma coluna em telemóveis para leitura e interação mais confortável.
- Mantida a política CSP sem `unsafe-inline`.
- Cache do PWA atualizada para v17.

# CONSULDOCE — Catálogo B2B

Catálogo B2B privado da CONSULDOCE, publicado como aplicação estática no Cloudflare Pages e ligado ao Supabase. O objetivo é permitir que clientes autenticados consultem o catálogo de mercadoria, escolham quantidades e enviem encomendas sem apresentação de preços.

## Funcionalidades implementadas

### Cliente
- Registo de cliente com **nome/empresa, NIF obrigatório, telemóvel, morada estruturada, email e palavra-passe**.
- O NIF é obrigatório, mas **a validação formal do NIF português está desativada nesta fase**. O sistema apenas normaliza o valor e impede duplicados.
- Email obrigatório e protegido contra duplicação.
- Telemóvel obrigatório, com seleção de país/indicativo internacional.
- Proteção contra duplo envio do formulário de registo.
- Confirmação de email através do Supabase Auth.
- Login e logout.
- Recuperação de palavra-passe e alteração da palavra-passe através do fluxo do Supabase Auth.
- Catálogo sem preços.
- Estado do produto apresentado apenas como **Em stock** ou **Fora de stock**.
- A disponibilidade é definida pelo administrador e não pelo stock físico importado.
- Só produtos marcados pelo administrador como **Em stock** podem ser adicionados ao carrinho.
- Carrinho com escolha de quantidades.
- Finalização da encomenda através de uma função SQL atómica no Supabase.
- A encomenda fica associada ao cliente autenticado.
- O cliente pode consultar as suas próprias encomendas.
- Pesquisa única do catálogo e filtros por categoria/família.
- Filtro para mostrar apenas produtos em stock.
- Ordenação por nome, categoria/família e **ID do produto/referência (SKU)**. Não existe ordenação por preço no catálogo público.

### Administração
- Área de backoffice protegida por papel `admin`.
- Gestão de produtos.
- Criação e edição de produtos.
- ID do produto/referência (SKU) em coluna própria.
- Pesquisa única na tabela, abrangendo ID/referência, nome, família, código de barras, descrição e outros dados relevantes.
- Ordenação da tabela por ID do produto, nome e família.
- Filtro por família.
- Gestão da visibilidade dos produtos.
- Gestão do estado comercial **Em stock / Fora de stock**, independente do stock físico.
- Seleção múltipla de produtos.
- Operações em lote para marcar produtos como Em stock, Fora de stock, publicar ou ocultar.
- A opção de seleção em lote respeita os filtros atualmente aplicados.
- Importação separada dos ficheiros Excel do Sage para catálogo/listagem de artigos e inventário/existências.
- Carregamento e gestão de imagens dos produtos através do Supabase Storage.
- Consulta de encomendas e dados dos clientes no backoffice.

### Dados do cliente
- `phone_country_code` guarda o indicativo internacional (ex. `+351`).
- `phone_number` guarda o número de telemóvel sem o indicativo.
- `address_line1` guarda o endereço principal.
- `address_line2` guarda andar/lote/fração/porta ou complemento.
- `postal_code` e `postal_locality` guardam código postal e localidade.
- `country` guarda o país selecionado.
- A coluna legada `address` continua preenchida para compatibilidade com código e relatórios existentes.

### Encomendas e email
- O servidor valida novamente que cada produto está ativo e marcado como `in_stock` antes de aceitar a encomenda.
- O `stock_quantity` é tratado como stock físico/informativo e não é decrementado automaticamente.
- Se uma encomenda incluir produtos marcados como Em stock pelo administrador mas sem stock físico registado, a mensagem enviada à CONSULDOCE apresenta um aviso e lista esses artigos.
- O email de encomenda é enviado por uma Supabase Edge Function através do Resend para `ORDER_EMAIL_TO`.
- A chave do Resend e a service role key nunca são colocadas no código do navegador.

## PWA

A aplicação está preparada como PWA:
- manifest Web App;
- service worker;
- ícones 180, 192 e 512 px;
- `apple-touch-icon` para iOS;
- metadados de instalação e tema;
- cache do shell da aplicação para carregamento resiliente.

## Arquitetura

- **Frontend:** HTML/CSS/JavaScript estático.
- **Hosting:** Cloudflare Pages.
- **Autenticação:** Supabase Auth.
- **Base de dados:** Supabase PostgreSQL + RLS.
- **Imagens:** Supabase Storage, bucket público apenas para leitura e escrita/alteração limitada a administradores.
- **Email de encomendas:** Supabase Edge Function + Resend.
- **Importação:** ficheiros Excel processados no backoffice; nenhum Excel de exemplo é incluído no repositório.

## Conteúdo do ZIP

O ZIP contém apenas ficheiros necessários ao funcionamento e manutenção do projeto:

- `index.html`
- `app.js`
- `styles.css`
- `config.js` — contém apenas valores públicos do Supabase.
- `manifest.webmanifest`
- `sw.js`
- ícones e favicon
- `_headers`
- `.gitignore`
- `supabase_schema.sql` — **schema completo e único da base de dados, na raiz** (inclui tabelas, RLS, funções, triggers, índices, view pública segura e Storage).
- `supabase/functions/send-order-email/index.ts` — Edge Function necessária para o email de encomendas.

Não são incluídos ficheiros de exemplo, dados fictícios, exports de Excel, seeds ou migrations SQL fragmentadas.

## Configuração do Supabase

1. Criar/configurar o projeto Supabase.
2. Executar **uma única vez** o `supabase_schema.sql` completo no SQL Editor. Este ficheiro é a fonte única da estrutura da base de dados, políticas RLS, funções, triggers, índices e Storage necessários.
3. Em Authentication → URL Configuration, definir como Site URL:
   `https://consuldoce.pages.dev/`
4. Adicionar como Redirect URL permitida:
   `https://consuldoce.pages.dev/**`
5. Criar o primeiro utilizador através do registo normal e, no Table Editor de `public.profiles`, alterar o papel dessa conta para `admin`. Não existe seleção de papel no registo público.

## Secrets da Edge Function

Na configuração de secrets das Edge Functions, configurar:

- `RESEND_API_KEY` — chave privada do Resend.
- `RESEND_FROM` — remetente autorizado pelo Resend. Durante testes pode ser `onboarding@resend.dev`; para produção recomenda-se um endereço do domínio da empresa depois de o domínio ser verificado no Resend.
- `ORDER_EMAIL_TO` — endereço que recebe as encomendas, atualmente `consuldoce@gmail.com`.

O Supabase disponibiliza à Edge Function as variáveis internas necessárias para aceder ao projeto. **Nunca copiar `SUPABASE_SERVICE_ROLE_KEY` para `config.js` ou para qualquer código enviado ao navegador.**

## Cloudflare Pages

No Cloudflare Pages, configurar apenas as variáveis públicas necessárias ao frontend:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

A publishable/anon key do Supabase foi concebida para utilização no cliente e a segurança dos dados é garantida pelas políticas RLS e pelas funções de servidor. Chaves secretas nunca devem ser colocadas nestas variáveis públicas.

O site é publicado em:
`https://consuldoce.pages.dev/`

## Segurança

- RLS ativado nas tabelas de perfis, produtos, encomendas e linhas de encomenda.
- Clientes só conseguem consultar os próprios dados e as próprias encomendas.
- Administração de produtos, clientes, encomendas e imagens protegida pelo papel `admin`.
- O papel `admin` não pode ser escolhido no registo público.
- Uma trigger impede um utilizador normal de promover o próprio perfil para administrador.
- Email e NIF têm índices únicos no lado do servidor.
- O NIF é obrigatório para perfis de cliente, mas a validação de dígito de controlo está deliberadamente desativada nesta fase.
- A criação de encomendas é feita através de função PostgreSQL `SECURITY DEFINER`, com validação server-side do estado dos produtos.
- O browser não recebe nem usa a service role key.
- O catálogo público é servido através da função segura `get_catalog_products()`, que devolve exclusivamente os campos necessários ao cliente e exclui deliberadamente o preço interno e o stock físico. A tabela base `products` é legível apenas por administradores.
- A Edge Function valida a sessão do utilizador e confirma que a encomenda pertence ao utilizador, salvo quando o utilizador é administrador.
- A Edge Function de email restringe CORS ao domínio de produção da CONSULDOCE.
- O conteúdo HTML dos emails é escapado antes de ser inserido na mensagem.
- `_headers` inclui cabeçalhos de segurança básicos para o site estático.

## Importação do Sage

A importação é feita a partir do backoffice. Os ficheiros do Sage não são incluídos neste repositório.

O catálogo e o inventário/existências são tratados separadamente, evitando obrigar o administrador a carregar sempre os dois ficheiros. A referência/SKU é usada como ID humano do produto e como chave única do catálogo.

## Política de stock

Existem dois conceitos distintos:

1. **Stock físico (`stock_quantity`)** — informação importada do Sage.
2. **Disponibilidade comercial (`in_stock`)** — decisão manual do administrador que determina se o cliente pode encomendar.

Isto permite marcar um artigo como **Em stock** mesmo quando o stock físico importado é zero ou não foi carregado. Nesse caso, a encomenda é aceite e o email interno alerta para a possível falta de stock físico.

## Deploy

O fluxo recomendado é:

1. Atualizar o código no GitHub.
2. O Cloudflare Pages fazer o deployment automático.
3. Para alterações da base de dados, atualizar o `supabase_schema.sql` como fonte única e aplicar as alterações de forma controlada no Supabase.
4. Fazer testes de registo, login, recuperação de password, catálogo, carrinho, encomenda e email antes de produção.

## Nota sobre o domínio

O frontend está preparado para `https://consuldoce.pages.dev/`. Quando existir um domínio próprio da empresa, deve ser adicionado ao Cloudflare Pages e ao Supabase Auth Redirect Configuration e, para email de produção, verificado no Resend antes de trocar o remetente.


## Deployment — prevenção de página em branco

A inicialização do frontend é tolerante a falhas: o ecrã de autenticação é renderizado antes da consulta de sessão ao Supabase e erros de inicialização são apresentados ao utilizador. O service worker não interceta navegações HTML e a shell usa uma versão de cache nova para evitar que deployments antigos deixem a aplicação presa numa versão anterior.

Em Cloudflare Pages, publicar todos os ficheiros da raiz do projeto. Não é necessário configurar uma build command; o site é uma aplicação estática.


## Correção de arranque

A versão atual usa `SUPABASE_PUBLISHABLE_KEY` no frontend, compatível com a chave `sb_publishable_...` configurada em `config.js`. A chave é pública por natureza; nunca deve ser substituída por uma `service_role` key.


## Migração do catálogo existente

Se a base de dados já estiver instalada e contiver os produtos atuais, **não é necessário apagar dados nem executar novamente o schema completo**. Para esta correção do carregamento do catálogo, executar uma única vez o ficheiro de migração fornecido separadamente: `migration_catalog_rpc.sql`.

O ZIP de produção continua a conter apenas `supabase_schema.sql` como ficheiro SQL canónico na raiz; a migration é fornecida fora do ZIP apenas para facilitar a atualização de uma instalação já existente.

## Atualização v14 — catálogo e ações

- O filtro **Apenas em stock** vem ativo por defeito ao abrir o catálogo.
- Foi removido o botão **Ver carrinho** da barra de filtros do catálogo; o carrinho continua disponível no cabeçalho e, quando aplicável, no fluxo de encomenda.
- Os controlos da aplicação usam delegação de eventos JavaScript, sem `onclick`/`onchange` inline, mantendo a CSP sem `unsafe-inline` para scripts.
- A pesquisa do catálogo e da administração reage também à introdução de texto (`input`), além de alterações de select/checkbox.
- O schema consolidado continua em `supabase_schema.sql` na raiz; não executar esse ficheiro sobre uma base de produção existente sem primeiro aplicar a migration compatível.


## v15 — filtro Em stock

O catálogo carrega os produtos através de `get_catalog_products(false)` e aplica um filtro estrito sobre o campo administrativo `products.in_stock`. Quando **Apenas em stock** está ativo (estado inicial), apenas produtos cujo `in_stock` é verdadeiro podem ser apresentados e encomendados. A função SQL também suporta filtragem server-side através de `p_only_in_stock`, mantendo a regra no servidor.


## v17 — responsive backoffice

A interface de administração foi otimizada para iPhone/iOS e Android: navegação interna sem cortes, painéis dimensionados ao ecrã, filtros responsivos e tabelas com scroll horizontal táctil quando a quantidade de colunas não permite uma redução segura.

## Migração v18 numa base existente

Para uma base Supabase já em produção, não é necessário substituir o schema inteiro. Aplicar a migration externa `migration_client_contact_address_v18.sql`, que acrescenta os campos de contacto/morada, migra a morada antiga para `address_line1` e atualiza o trigger de criação de perfil. A migration não apaga clientes, produtos ou encomendas.

Para uma instalação nova, usar apenas o `supabase_schema.sql` que acompanha esta versão. As migrations de atualização são mantidas fora do ZIP de distribuição consolidado.


## Área de cliente — v19

A aplicação inclui uma secção autenticada **Minha conta** onde o cliente pode consultar e alterar os seus dados de empresa/contacto: nome, NIF, telemóvel com país/indicativo, endereço em duas linhas, código postal, localidade, país e email. Inclui também alteração de palavra-passe.

As alterações de NIF e email continuam protegidas pelas regras de unicidade da base de dados; a validação formal do NIF português permanece desativada por decisão funcional atual. Alterações de email através do Supabase Auth podem exigir confirmação no novo endereço.

## v20 — múltiplas moradas de entrega

A área **Minha conta** suporta agora várias moradas de entrega por cliente. Cada morada tem um nome identificativo (por exemplo, Sede, Armazém ou Loja), endereço principal, complemento, código postal, localidade e país.

Regras funcionais:

- O cliente pode adicionar, editar e eliminar moradas.
- Existe sempre uma **morada predefinida** quando o cliente tem pelo menos uma morada.
- Ao adicionar a primeira morada, esta fica automaticamente predefinida.
- O cliente pode mudar a morada predefinida a qualquer momento.
- A última morada predefinida não pode ser eliminada sem existir outra morada disponível.
- Ao iniciar uma encomenda, a morada predefinida é selecionada automaticamente.
- Antes de enviar a encomenda, o cliente pode escolher qualquer outra morada do seu cadastro.
- A encomenda guarda uma **cópia da morada escolhida**. Assim, alterar uma morada no futuro não altera a morada que consta numa encomenda histórica.
- O email interno da encomenda usa a morada de entrega efetivamente escolhida, e não simplesmente a morada atual do perfil.

### Migração v20 numa base existente

Para a instalação Supabase que já contém os dados atuais, executar uma única vez, no SQL Editor, o ficheiro externo `migration_customer_addresses_v20.sql`.

A migration:

- cria a tabela de moradas;
- migra a morada atual dos clientes para uma morada `Principal` quando existe informação;
- garante uma única morada predefinida por cliente;
- acrescenta à encomenda os campos necessários para guardar o snapshot da morada de entrega;
- atualiza a função segura `create_order` para validar que a morada pertence ao cliente autenticado;
- mantém os dados existentes e não apaga produtos, clientes ou encomendas.

O ZIP consolidado continua a ter **um único `supabase_schema.sql` canónico na raiz**. A migration v20 é fornecida separadamente apenas para atualizar a instalação já existente.


## v21 — telemóvel e email completo de encomenda
- O seletor de país do telemóvel apresenta apenas **bandeira + indicativo**, por exemplo `🇵🇹 (+351)`, deixando mais largura para o número em iPhone e Android.
- O indicativo continua guardado no campo `profiles.phone_country_code` e o número em `profiles.phone_number`.
- O email de cada encomenda inclui nome/empresa, NIF, email, telemóvel, morada atualmente registada, morada efetivamente escolhida para entrega e as moradas existentes no cadastro.
- A morada histórica da encomenda continua a ser usada para preservar o endereço escolhido no momento da compra.
- Cache do PWA atualizada para forçar a entrada da versão V29 após deploy.
- Backoffice: botão **Selecionar com imagem** seleciona automaticamente todos os produtos que têm imagem e **Apagar imagens selecionadas** remove apenas as imagens dos produtos selecionados, com confirmação e progresso.

Não é necessária uma nova migration SQL para a v21: não foram introduzidas novas colunas ou tabelas.


## Recuperação de palavra-passe — v23

O pedido de recuperação usa um `redirectTo` explícito para a mesma origem com `?recovery=1`, sem depender de hash routing. A aplicação reconhece também sessões de `PASSWORD_RECOVERY` e tokens de recuperação no fragmento, encaminhando o utilizador para `#/reset-password` antes de apresentar o catálogo. Em Supabase Authentication → URL Configuration deve continuar autorizado o domínio do catálogo e o padrão `https://consuldoce.pages.dev/**`.


## v25 — operações com progresso
- O carregamento de fotografias em lote apresenta progresso percentual, ficheiro em processamento e resultado detalhado.
- Atualizações em lote de stock e publicação/ocultação apresentam progresso e estado de conclusão/erro.
- Importações de artigos e stock apresentam percentagem de processamento e detalhe da operação.
- O seletor de fotografias é reiniciado após cada operação para permitir selecionar novamente os mesmos ficheiros.


## Arranque robusto v27

A inicialização do cliente Supabase é feita de forma protegida, evitando que uma falha na criação do cliente deixe a aplicação num ecrã branco. O versionamento de cache do Service Worker também foi incrementado para v27.

## V37 — gestão de clientes e contas
- A lista de países do registo/conta/moradas passou a um campo pesquisável com lista de sugestões, evitando o menu nativo excessivamente alto em alguns browsers.
- O registo concluído mostra uma página própria a confirmar que a conta foi criada e que é necessário confirmar o email para concluir a ativação. Ao sair desse ecrã, o formulário é descartado.
- O NIF continua protegido por unicidade server-side através do índice único existente.
- O backoffice permite consultar o histórico de encomendas de cada cliente.
- O backoffice permite fazer reset à palavra-passe de um cliente. É criada uma palavra-passe temporária e o cliente é obrigado a escolher uma nova no próximo login.
- O administrador pode eliminar contas de clientes, mas nunca a própria conta. As encomendas históricas são preservadas através de snapshots do nome/email/NIF e deixam de depender do perfil eliminado.
- Foi adicionada a Edge Function `admin-client-management`. Esta função usa `SUPABASE_SERVICE_ROLE_KEY` exclusivamente no servidor e valida que o utilizador que chama a função é administrador.

### Edge Function adicional
Depois de instalar V37, fazer deploy de `supabase/functions/admin-client-management/index.ts` no projeto Supabase e garantir os secrets da função:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

A `service_role` nunca deve ser colocada em `config.js` nem no browser.


## V37 — Gestão de contas
- O cliente autenticado pode pedir um email de redefinição de palavra-passe e eliminar a própria conta.
- O administrador pode eliminar contas de clientes e fazer reset de palavra-passe de clientes.
- Contas de administrador não podem ser eliminadas ou ter a palavra-passe gerida através desta função.
- A eliminação preserva o histórico das encomendas através dos snapshots comerciais.


## V37 — correção de compatibilidade da gestão de contas
- Compatibilidade com bases existentes: adiciona `profiles.must_change_password` se ainda não existir.
- Garante índices únicos para NIF e email normalizado.
- A validação server-side apresenta mensagens claras quando NIF ou email já existem.
