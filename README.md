```markdown
# Painel de Atalhos (com Grupos e Autenticação Local)

Esta versão adiciona autenticação local simples e gerenciamento de usuários:

Visão geral
- Public: página pública com botões de atalho (clicáveis). No canto superior direito há o formulário de login (usuário + senha). Nesta view não há edição.
- Admin: após efetuar login com credenciais válidas, você vê a interface de edição completa (criar/editar/excluir atalhos, grupos, export/import), além de opções de gerenciamento de usuários e Logoff.

Armazenamento
- Atalhos/grupos: localStorage, chave `shortcuts_v1` (novo formato: { groups, activeGroupId }).
- Usuários: localStorage, chave `shortcuts_users_v1`.
- Sessão: sessionStorage, chave `shortcuts_session_v1` (expira ao fechar a aba).
- Migração automática: se detectado o formato antigo (array simples), o app automaticamente o converte para um único grupo "Geral".

Usuários padrão
- Ao primeiro uso, o app cria um usuário administrador padrão:
  - usuário: `admin`
  - senha: `admin`
- Por segurança, altere a senha do admin após o primeiro login.

Gerenciamento de usuários (somente admins)
- Administradores podem criar novos usuários, definir senha e marcar como Administrador.
- Administradores podem editar senha de qualquer usuário, alternar privilégios admin e excluir usuários.
- O app impede excluir o último administrador.

Como usar
1. Substitua/atualize os arquivos no repositório com os arquivos fornecidos.
2. Abra `index.html` no navegador (ou atualize sua GitHub Pages).
3. Na página pública, faça login no canto superior direito com:
   - usuário: `admin`
   - senha: `admin`
4. Ao logar você verá os controles de edição (Adicionar atalho, Grupos, Usuários, Export/Import, Reset) e o botão "Logoff" no canto superior direito.
5. Crie um novo usuário administrador e altere a senha padrão do `admin` para segurança.

Aviso de segurança
- Esta implementação é inteiramente client-side (localStorage/sessionStorage). Mesmo com hashing (SHA-256 + salt) aplicado às senhas, não é segura para ambientes de produção ou para proteger dados sensíveis.
- Para produção, implemente autenticação no servidor (HTTPS), use um backend para armazenar credenciais (com hashing adequado, bcrypt/scrypt/Argon2), e use sessões/ JWT seguras.
- Se quiser, posso:
  - adicionar um backend simples (Node/Express) que armazene usuários e atalhos com autenticação segura,
  - ou integrar com um serviço (Gist, Google Drive, Firebase) para persistência remota.

Notas finais
- Recursos já incluídos: grupos (criar/renomear/excluir/reordenar), mover atalhos entre grupos via edição, reordenação por drag & drop, export/import no novo formato, gerenciamento de usuários, login/logout.
- Melhorias possíveis: drag-and-drop entre colunas (mover atalhos entre grupos com drag), ícones automáticos por site (favicon fetch), sincronização remota e autenticação segura.

```