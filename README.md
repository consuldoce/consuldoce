# CONSULDOCE · Catálogo B2B vivo

Site estático pronto para **Cloudflare Pages + GitHub**, com backend **Supabase**. O objetivo é disponibilizar aos clientes da Consuldoce um catálogo privado, sem preços, onde escolhem quantidades e submetem encomendas.

## Funcionalidades incluídas

### Cliente
- Registo com email, palavra-passe, nome/empresa, NIF e morada.
- Login/logout.
- Catálogo privado de produtos.
- Pesquisa por produto, referência e código de barras.
- Filtro por família.
- Imagens dos produtos.
- Seleção de quantidades.
- Limitação automática ao stock quando o produto tem `track_stock=true`.
- Carrinho persistente no navegador.
- Finalização da encomenda com observações opcionais.
- Histórico das próprias encomendas.
- Não são mostrados preços.

### Administração
- Área protegida por papel `admin` no Supabase.
- Gestão de produtos: criar, editar, publicar/ocultar, stock, família, unidade, código de barras e imagem.
- Upload de imagens para Supabase Storage.
- Importação direta de `.XLS`/`.XLSX` Sage 50.
- A importação reconhece automaticamente a **Listagem de Artigos** e o **Inventário de Existências**.
- Os ficheiros Sage fornecidos foram analisados e o projeto inclui `seed/products.json` com 421 artigos normalizados como ponto de partida.
- Gestão/consulta de encomendas, alteração de estado e reenvio do email.
- Consulta dos clientes registados.

### Encomendas e email
- A criação da encomenda é feita por uma função SQL transacional: valida produtos, valida stock, grava linhas e decrementa stock com bloqueio das linhas.
- Depois de criada, o frontend chama a Edge Function `send-order-email`.
- A Edge Function valida o utilizador e o acesso à encomenda e envia o email para `consuldoce@gmail.com` através da API Resend.
- Se o email falhar, a encomenda **não é perdida**: permanece na base de dados e pode ser reenviada no backoffice.

## Dados Sage analisados

Foram considerados os dois ficheiros fornecidos:

- `C__Sage Data_Sage 50c_CONSULDOCE_Listagem de Artig(2).XLS` — 421 artigos.
- `C__Sage Data_Sage 50c_CONSULDOCE_Inventário de exi(1).XLS` — 545 linhas de inventário.
- 414 referências da listagem têm correspondência direta no inventário.
- A família `SERVIÇOS` fica inicialmente não publicada no seed, para evitar colocar serviços no catálogo de mercadoria.
- As imagens não estão presentes nos XLS (`Imagem` sem valores úteis), por isso foram deixadas para carregamento pelo administrador.

## Arquitetura escolhida

**Frontend:** HTML/CSS/JavaScript estático. Não depende de Node para produção e pode ser servido diretamente pelo Cloudflare Pages.

**Base de dados:** Supabase PostgreSQL + Auth + Storage + Edge Functions.

**Email:** Resend via Edge Function.

### Porquê Supabase em vez de D1/R2 nesta versão?

Para este caso, Supabase simplifica bastante:
- autenticação de clientes;
- PostgreSQL relacional;
- Row Level Security (RLS);
- armazenamento das imagens;
- funções server-side para a lógica sensível.

Cloudflare Pages continua a servir o site e GitHub continua a ser o repositório/deploy source. D1/R2 seria uma boa alternativa, mas exigiria implementar mais infraestrutura de autenticação/autorização e gestão de ficheiros.

## Instalação — Supabase

1. O projeto Supabase configurado para esta versão é `https://lepiuwvmcwxamkqpeill.supabase.co` (project ref: `lepiuwvmcwxamkqpeill`).
2. Abra **SQL Editor**.
3. Execute o conteúdo de `supabase/schema.sql`.
4. Em **Authentication → Providers → Email**, configure a política de confirmação de email que pretende. Para um portal B2B fechado pode preferir confirmação de email ativa.
5. Crie a sua conta de administrador através do site.
6. Depois de criada a conta, no SQL Editor execute:

```sql
update public.profiles
set role = 'admin'
where email = 'SEU_EMAIL_ADMIN';
```

7. Em **Project Settings → API**, confirme o **Project URL** e a chave pública configurados em `config.js`.
8. O ZIP já inclui `config.js` preenchido com esses valores. Se criares outro projeto, substitui-os pelos valores do novo projeto.

### Regra importante de segurança

Nunca coloque `service_role`, password de base de dados, chave Resend ou outros segredos em `config.js`, no GitHub ou no código do browser. A `anon key` do Supabase é pública por desenho; a segurança dos dados depende das políticas RLS.

## Instalação — email de encomendas

A função está em `supabase/functions/send-order-email/index.ts`.

Instale a Supabase CLI no seu computador e faça login, depois associe o projeto e publique a função. Exemplo:

```bash
supabase login
supabase link --project-ref lepiuwvmcwxamkqpeill
supabase functions deploy send-order-email
```

Configure os secrets da função:

```bash
supabase secrets set \
  RESEND_API_KEY="re_xxxxxxxxx" \
  RESEND_FROM="Encomendas <encomendas@seudominio.pt>" \
  ORDER_EMAIL_TO="consuldoce@gmail.com"
```

A função também recebe `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` do ambiente Supabase quando publicada; **não os copie para o frontend**.

### Resend e domínio

Para produção, valide no Resend um domínio de envio seu, por exemplo `consuldoce.pt`, e use um remetente como `encomendas@consuldoce.pt`. Não use a service role key no browser.

## Instalação — Cloudflare Pages

O projeto foi pensado para deploy sem build:

- **Framework preset:** None
- **Build command:** deixar vazio
- **Build output directory:** `/`
- **Root directory:** `/`

Se o repositório GitHub já estiver ligado ao Cloudflare Pages, basta colocar estes ficheiros na branch configurada. O domínio `consuldoce.pages.dev` poderá continuar a ser usado.

## Imagens

No backoffice, cada produto pode receber:
- uma URL externa; ou
- um ficheiro de imagem carregado para o bucket privado de gestão/publicamente servido `product-images`.

As imagens são consideradas conteúdo de catálogo, não informação confidencial. Os dados de clientes e encomendas permanecem protegidos por RLS.

## Importação Sage

Na administração → **Importar Excel (artigos e stock em operações separadas)**:

1. selecione um ou ambos os ficheiros `.XLS`/`.XLSX`;
2. a aplicação identifica a listagem e o inventário pelas colunas;
3. faz `upsert` por `Ref_` → `sku`;
4. usa `Produto`, `Descricao Curta`, `Familia`, `C_ Barras`, `Uni`;
5. usa `Qnt_ Existente` do inventário quando disponível;
6. publica os produtos normais e deixa `SERVIÇOS` oculto quando a opção de publicação automática está ativa.

A importação não lê nem armazena preços. Os campos de preço existentes no Sage são deliberadamente ignorados pelo catálogo.

## Segurança implementada

- RLS em `profiles`, `products`, `orders` e `order_items`.
- O papel `admin` não é editável pelo próprio cliente.
- A função `create_order` é server-side e transacional.
- Stock é validado dentro da transação e decrementado com `FOR UPDATE`.
- O email é enviado server-side, nunca diretamente com uma chave secreta no browser.
- A Edge Function valida que o utilizador autenticado é dono da encomenda ou administrador.
- O `service_role` só aparece no ambiente da Edge Function.
- Inputs apresentados na interface são escapados antes de serem renderizados.
- Não existem preços no frontend, no seed ou na API de catálogo.

## Paleta visual

Inspirada nos anexos fornecidos da aplicação existente:
- roxo profundo como cor institucional;
- roxo secundário para navegação;
- amarelo/dourado para ações principais;
- branco/quente para superfícies;
- verde menta como detalhe de apoio.

## Estrutura

```text
/
├── index.html
├── app.js
├── styles.css
├── config.example.js
├── config.js                 # preencher localmente; não guardar segredos
├── seed/
│   └── products.json
├── supabase/
│   ├── schema.sql
│   └── functions/
│       └── send-order-email/
│           └── index.ts
└── README.md
```

## Nota para evolução futura

Esta primeira versão privilegia simplicidade de deploy e segurança do backend. Para uma segunda fase, é recomendável adicionar:
- edição em massa de produtos;
- associação automática de imagens por SKU;
- favoritos e listas de encomenda frequente;
- exportação das encomendas para Excel/CSV;
- notificações de estado para o cliente;
- integração direta com o Sage/API ou sincronização agendada de stock;
- domínio próprio, por exemplo `catalogo.consuldoce.pt`;
- CSP mais restritiva depois de transformar o frontend numa build Vite/React sem handlers inline.

## Registo de clientes e recuperação de acesso

A versão atual acrescenta:

- validação do algoritmo de NIF português no formulário;
- normalização do NIF para 9 dígitos;
- prevenção de NIF duplicado na base de dados através de índice único;
- prevenção de email duplicado no perfil (além da própria autenticação Supabase);
- verificação prévia de disponibilidade de email/NIF durante o registo;
- recuperação de palavra-passe por email através do Supabase Auth;
- formulário seguro para definir uma nova palavra-passe após o link de recuperação;
- área de produtos com pesquisa, filtro por família, seleção múltipla, publicação/ocultação em lote e associação de fotografias em lote por nome de ficheiro igual à referência/SKU.

### Migração obrigatória desta versão

Como o projeto já tinha sido instalado anteriormente, execute uma vez no Supabase SQL Editor:

`supabase/migration_registration_security.sql`

Esta migração deve ser executada **depois** do `supabase/schema.sql` original. Não contém preços nem dados de clientes.

### Recuperação de palavra-passe no Supabase

Em **Authentication → URL Configuration**, adicione como Redirect URL o endereço do catálogo com `?recovery=1#/reset-password`. Para o domínio Cloudflare, por exemplo:

`https://consuldoce.pages.dev/?recovery=1#/reset-password`

Se também utilizar um domínio próprio, adicione a URL equivalente desse domínio. O frontend nunca recebe nem armazena a service-role key.
