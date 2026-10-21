# Sistema de Calendário e Aprovação de Conteúdo

Sistema interno para planejar, aprovar e publicar conteúdo de redes sociais — construído para a **Kruger Toledo Consultoria** e pensado para funcionar com vários projetos/clientes no futuro.

## O que tem aqui

- **Semanal:** planejamento e aprovação dos próximos 7 dias.
- **Mensal:** calendário por rede (Instagram, LinkedIn, TikTok) dos conteúdos aprovados/publicados.
- **Criativos:** levas de anúncios de tráfego pago, com upload em lote e aprovação em lote.
- **Feed:** simulador da grade do Instagram.
- **Ideias:** banco de ideias de conteúdo, com link de referência e link de copy/roteiro.
- Login por link mágico (sem senha), papéis por projeto (administrador, editor, aprovador, leitor).
- Upload de fotos/vídeos direto para o Cloudflare R2 (sem limite de 50MB).
- Checklist de publicação, histórico, comentários, notificações internas.
- Instalável como app (PWA) no celular.

## Tecnologias

- [Next.js](https://nextjs.org) (App Router, TypeScript) + Tailwind CSS
- [Supabase](https://supabase.com): banco de dados (Postgres), login e segurança por linha (RLS)
- [Cloudflare R2](https://developers.cloudflare.com/r2/): armazenamento dos arquivos (fotos/vídeos)
- [Resend](https://resend.com): envio de e-mails (link de login, notificações)
- Hospedagem prevista: [Vercel](https://vercel.com)

## Como rodar localmente

Pré-requisitos: [Node.js](https://nodejs.org) (versão LTS) e [Git](https://git-scm.com) instalados.

1. Instale as dependências:
   ```
   npm install
   ```
2. Copie `.env.local.example` para `.env.local` e preencha com as chaves do seu Supabase e do seu Cloudflare R2 (veja "Como criar as contas" abaixo).
3. Rode o projeto:
   ```
   npm run dev
   ```
4. Abra `http://localhost:3000` no navegador.

## Como criar as contas (Supabase e Cloudflare R2)

### Supabase
1. Crie um projeto gratuito em [supabase.com](https://supabase.com) (região São Paulo).
2. No **SQL Editor** do painel, rode, nessa ordem, cada um dos arquivos da pasta `supabase/migrations/` (do número mais baixo para o mais alto).
3. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public** para o `.env.local`.
4. Em **Authentication → URL Configuration**, configure a **Site URL** e as **Redirect URLs** com o endereço onde o site está rodando (local ou o domínio de produção).
5. (Recomendado) Em **Authentication → SMTP Settings**, configure um remetente de e-mail próprio via Resend, para os e-mails de login não caírem em spam e não esbarrarem no limite do plano gratuito.

### Cloudflare R2
1. Crie uma conta em [dash.cloudflare.com](https://dash.cloudflare.com) e ative o **R2 Object Storage**.
2. Crie um bucket (ex.: `kt-aprovacao-conteudo`).
3. Em **Manage R2 API Tokens**, crie um token com permissão **Object Read & Write**, aplicado a todos os buckets (ou só ao seu).
4. Copie o **Account ID**, **Access Key ID** e **Secret Access Key** para o `.env.local`.
5. Nas configurações do bucket, configure a **CORS Policy** liberando o endereço onde o site roda (`http://localhost:3000` em desenvolvimento, e o domínio de produção depois do deploy), métodos `GET` e `PUT`.

## Como criar o primeiro usuário administrador

1. Rode o app e acesse `/login` com o seu e-mail — isso cria sua conta.
2. No **SQL Editor** do Supabase, rode (trocando o e-mail e o slug do projeto):
   ```sql
   insert into project_members (project_id, user_id, papel)
   select p.id, u.id, 'administrador'
   from projects p, auth.users u
   where p.slug = 'kruger-toledo-consultoria' and u.email = 'seu-email@exemplo.com';
   ```

## Como adicionar um novo projeto/marca

1. No SQL Editor, insira uma linha na tabela `projects` com o tema (cores/fontes), redes ativas e regra de aprovação desse novo cliente.
2. Adicione você (e quem mais precisar) como membro desse projeto em `project_members`.
3. (Fase futura) Um seletor de projeto na tela vai deixar isso mais fácil, sem precisar de SQL — hoje o app assume que cada pessoa participa de um projeto.

## Como publicar (deploy)

1. Suba este código para um repositório no GitHub.
2. Crie uma conta na [Vercel](https://vercel.com) e importe o repositório.
3. Nas configurações do projeto na Vercel, adicione as mesmas variáveis de ambiente do `.env.local`.
4. Depois do primeiro deploy, atualize no Supabase (**Authentication → URL Configuration**) e no Cloudflare R2 (**CORS Policy**) com o domínio novo da Vercel.

## Estrutura do projeto (para quem for mexer no código depois)

- `src/app/` — páginas (cada pasta é uma rota)
- `src/app/actions/` — as ações que salvam/alteram dados (criar conteúdo, aprovar, etc.)
- `src/components/` — pedaços de tela reutilizáveis
- `src/lib/` — conexões (Supabase, R2) e funções auxiliares
- `supabase/migrations/` — histórico de tudo que foi criado no banco de dados, na ordem certa
