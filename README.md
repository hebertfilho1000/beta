```markdown
# Painel de Atalhos (com Grupos)

Site simples que mostra muitos botões de atalho, agora com suporte a grupos.

Recursos:
- Criar/renomear/excluir grupos
- Reordenar grupos (arrastar os chips)
- Adicionar, editar e excluir atalhos (nome + URL)
- Mover atalhos entre grupos ao editar/criar
- Salva no Local Storage do navegador
- Reordenar atalhos dentro do grupo por drag & drop
- Exportar/Importar JSON (novo formato salva {groups, activeGroupId})
- Reset para exemplos

Migração:
- Se você já tinha a versão anterior (um array simples no localStorage), o app detecta e converte para um único grupo "Geral" automaticamente.

Como usar:
1. Substitua os arquivos no repositório pela versão atualizada (index.html, styles.css, app.js, README.md).
2. Abra `index.html` no navegador ou atualize sua GitHub Pages.
3. Use a barra de grupos para criar/selecionar/renomear/excluir grupos.
4. Clique em "Adicionar atalho" para criar um atalho; escolha o grupo no modal.
5. Edite um atalho para movê-lo entre grupos (campo "Grupo" no modal).

Se quiser, eu posso:
- Gerar um commit/PR com essas alterações (se você me autorizar novamente e o repo já tiver um commit inicial).
- Adicionar funcionalidade para mover atalhos entre grupos via drag-and-drop direto entre listas (interface com múltiplas colunas).
- Implementar persistência no servidor ou usar Gist/GitHub para armazenar centralmente.
