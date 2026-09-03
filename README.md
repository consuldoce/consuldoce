# CONSULDOCE — Catálogo B2B

Catálogo B2B privado da CONSULDOCE, publicado como aplicação estática no Cloudflare Pages e ligado ao Supabase. O objetivo é permitir que clientes autenticados consultem o catálogo de mercadoria, escolham quantidades e enviem encomendas sem apresentação de preços.

## Funcionalidades implementadas

### Cliente
- Registo de cliente com **nome/empresa, NIF obrigatório, morada, email e palavra-passe**.
- O NIF é obrigatório, mas **a validação formal do NIF português está desativada nesta fase**. O sistema apenas normaliza o valor e impede duplicados.
- Email obrigatório e protegido contra duplicação.
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
