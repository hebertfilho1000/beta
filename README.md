```markdown
# Painel de Atalhos — Página Pública + Admin Separado (com ícones e cores por atalho)

Arquivos
- index.html — página pública (somente leitura). Formulário de login no canto superior direito; ao logar, redireciona para admin.html.
- admin.html — área administrativa (edição de atalhos e grupos) e seção separada para gerenciamento de usuários (sem modal).
- storage.js — funções compartilhadas (grupos, usuários, sessão, hash).
- public.js — lógica da página pública (render leitura + login).
- admin.js — lógica da página admin (edição, usuários, logoff). Suporta ícone e cor por atalho.
- styles.css — estilos compartilhados.
- README.md — este arquivo.

Novidades / instruções rápidas
- Cada atalho agora pode ter:
  - icon: texto (emoji), URL de imagem (https://...), ou classe de ícone (ex.: `fa-brands fa-github`).
  - color: cor de fundo para a "favicon box" (input type="color" no modal).
- No admin: abra a aba "Atalhos", clique em "Adicionar atalho" ou ✏️ em um card para editar. Defina Ícone e Cor no formulário.
- Na pública: o card exibirá o ícone (imagem / FontAwesome / emoji) e aplicará a cor de fundo definida.

Usuários & autenticação
- Usuários são gerenciados no admin (aba "Usuários"): criar, alterar senha, alternar admin, excluir (com proteção para o último admin).
- Login: admin/admin criado no primeiro uso — altere a senha inicialmente.
- Sessão salva em sessionStorage (encerra ao fechar a aba).

Observações de segurança
- Implementação inteiramente client-side (localStorage/sessionStorage). Mesmo com hashing SHA‑256+salt, NÃO é adequada para produção.
- Para uso público com restrição real, implemente autenticação e armazenamento no servidor (HTTPS + bcrypt/Argon2).

Próximos passos (opcionais)
- Sincronização remota (Gist/Firebase/Backend).
- Favicon automático ao inserir URL (utilizando https://www.google.com/s2/favicons?domain=...).
- Drag-and-drop entre colunas para mover atalhos entre grupos.

```