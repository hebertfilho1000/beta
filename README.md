```markdown
# Painel de Atalhos — Página Pública + Admin Separado (aprofundado)

Resumo das mudanças
- Separação em duas páginas: index.html (público) e admin.html (admin).
- Cada atalho pode ter `icon` (emoji / URL / classe FA) e `color`.
- Adição de Exportar/Importar Usuários (para copiar contas entre navegadores).
- Logout usa `location.replace('index.html')` para evitar que o botão Voltar do navegador retorne ao admin.
- `pageshow` no admin revalida sessão ao restaurar página da bfcache e redireciona se necessário.
- Botões "Adicionar atalho" e "+ Grupo" corrigidos e visíveis para administradores.

Como mover usuários entre PCs
- No PC A (origem): Admin → Usuários → Exportar Usuários → baixe users.json
- No PC B (destino): faça login como admin (ou outro admin local), vá em Usuários → Importar Usuários → escolha users.json e selecione substituir ou mesclar.
- Atenção: o arquivo exportado contém hashes e salts das senhas (não senhas em texto). Proteja esse arquivo.

Segurança
- Implementação totalmente client-side (localStorage/sessionStorage).
- Para produção: usar backend/serviço (Firebase/Auth + Firestore ou Node/Express + DB) para autenticação e sincronização segura.

Testes recomendados
1. index.html:
   - Ver atalhos públicos.
   - Fazer login com admin/admin (se for primeira execução).
2. admin.html:
   - Adicionar grupo (+ Grupo) — visível para admins.
   - Adicionar atalho (Adicionar atalho) — preencher nome, url, ícone e cor.
   - Editar atalho (✏️) e mover entre grupos no select.
   - Reordenar atalhos por drag dentro do grupo.
   - Exportar/Importar grupos (JSON).
   - Usuários: criar usuário, exportar/importar usuários, alterar senha, alternar admin, excluir (cuidado com último admin).
3. Logout:
   - Clique em Logoff — você deve ir para index.html.
   - Tentar clicar Back no navegador não deve voltar ao admin.html (deverá permanecer no public).

Próximos passos (opcionais)
- Sincronização remota (Firebase), para que usuários e atalhos sejam os mesmos em todos os dispositivos sem export/import.
- Automatizar captura de favicon a partir da URL (ex.: https://www.google.com/s2/favicons?domain=...).
- Melhorar UX: confirmação ao criar usuário, mensagens inline, paginação para many users, etc.

```