# Painel de Atalhos — Página Pública + Admin Separado

Estrutura
- index.html — página pública (somente leitura). Tem o formulário de login no canto superior direito; ao logar, redireciona para admin.html.
- admin.html — área administrativa (edição de atalhos e grupos) e seção separada para gerenciamento de usuários (sem modal).
- storage.js — funções compartilhadas (grupos, usuários, sessão, hash).
- public.js — lógica da página pública (render leitura + login).
- admin.js — lógica da página admin (edição, usuários, logoff).
- styles.css — estilos compartilhados.

Como usar
1. Coloque os arquivos no repositório e abra `index.html` (ou publique via GitHub Pages).
2. Página pública: visualiza atalhos; use o formulário no canto superior direito para entrar.
3. Login inicial: usuário `admin`, senha `admin` (recomendo alterar a senha).
4. Ao logar, será redirecionado para `admin.html` — aqui você pode editar atalhos e gerenciar usuários na aba "Usuários".
5. Clique em "Logoff" para encerrar a sessão e voltar para a página pública.

Segurança
- Implementação client-side (localStorage/sessionStorage). Usa SHA-256+salt para armazenar senhas, mas isto NÃO é seguro para produção. Para uso real em site público, implemente backend seguro para autenticação e armazenamento.

Se quiser que eu:
- gere o commit/PR com esses arquivos diretamente no repositório (posso tentar, peça autorização), ou
- adicione proteção extra (por ex. bloqueio direto de admin.html via rota estática + login server-side), ou
- implemente sincronização remota (Gist/Firebase) — me diga qual prefere.