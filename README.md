```markdown
# Painel de Atalhos

Site simples que mostra muitos botões de atalho. Recursos:
- Adicionar, editar e excluir atalhos (nome + URL)
- Salva no Local Storage do navegador
- Reordenar por drag & drop
- Exportar/Importar JSON para backup ou mover entre máquinas

Como usar:
1. Coloque os arquivos (index.html, styles.css, app.js) em uma pasta (por exemplo `site/`).
2. Abra `index.html` no navegador.
3. Clique em "Adicionar atalho" para criar, clique no card para abrir, clique em ✏️ para editar.
4. Use Exportar JSON para salvar um backup, ou Importar JSON para carregar um arquivo exportado.

Observações:
- As alterações são salvas automaticamente no browser (localStorage). Se quiser persistência centralizada (por exemplo salvar no GitHub ou servidor), me diga e eu eu forneço uma versão com backend (Node/Express) ou integração com Google Sheets/Gist.
```