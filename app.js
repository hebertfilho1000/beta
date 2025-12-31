// Painel de atalhos - salva em localStorage, suporta adicionar/editar/remover/reordenar, export/import JSON
const STORAGE_KEY = 'shortcuts_v1';
const grid = document.getElementById('grid');
const emptyHint = document.getElementById('emptyHint');
const addBtn = document.getElementById('addBtn');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');
const resetBtn = document.getElementById('resetBtn');

const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const form = document.getElementById('form');
const inputName = document.getElementById('inputName');
const inputUrl = document.getElementById('inputUrl');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const deleteBtn = document.getElementById('deleteBtn');

let shortcuts = [];
let editingIndex = null;
let dragFromIndex = null;

function defaultShortcuts(){
  return [
    {name:'Google', url:'https://www.google.com'},
    {name:'YouTube', url:'https://www.youtube.com'},
    {name:'Gmail', url:'https://mail.google.com'},
    {name:'GitHub', url:'https://github.com'},
    {name:'Stack Overflow', url:'https://stackoverflow.com'},
    {name:'Twitter', url:'https://twitter.com'},
    {name:'LinkedIn', url:'https://www.linkedin.com'},
    {name:'Wikipedia', url:'https://pt.wikipedia.org'},
    {name:'Notion', url:'https://www.notion.so'}
  ];
}

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      shortcuts = JSON.parse(raw);
    } else {
      shortcuts = defaultShortcuts();
      save();
    }
  }catch(e){
    console.error('Erro ao carregar atalhos', e);
    shortcuts = defaultShortcuts();
  }
  render();
}

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
  render();
}

function render(){
  grid.innerHTML = '';
  if(shortcuts.length === 0){
    emptyHint.style.display = 'block';
  } else {
    emptyHint.style.display = 'none';
  }
  shortcuts.forEach((s, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('draggable', 'true');
    card.dataset.index = i;

    // events for drag/drop
    card.addEventListener('dragstart', (e) => {
      dragFromIndex = i;
      e.dataTransfer.effectAllowed = 'move';
      card.style.opacity = '0.6';
    });
    card.addEventListener('dragend', () => {
      dragFromIndex = null;
      card.style.opacity = '';
    });
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    card.addEventListener('drop', (e) => {
      e.preventDefault();
      const toIndex = Number(card.dataset.index);
      if(dragFromIndex == null || dragFromIndex === toIndex) return;
      const item = shortcuts.splice(dragFromIndex,1)[0];
      shortcuts.splice(toIndex,0,item);
      save();
    });

    const favicon = document.createElement('div');
    favicon.className = 'favicon';
    favicon.textContent = s.name ? s.name.slice(0,2).toUpperCase() : '??';

    const meta = document.createElement('div');
    meta.className = 'meta';
    const nameEl = document.createElement('div');
    nameEl.className = 'name';
    nameEl.textContent = s.name || '(sem nome)';
    const urlEl = document.createElement('div');
    urlEl.className = 'url';
    urlEl.textContent = s.url;

    meta.appendChild(nameEl);
    meta.appendChild(urlEl);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const openBtn = document.createElement('button');
    openBtn.className = 'icon-btn';
    openBtn.title = 'Abrir';
    openBtn.innerHTML = '🔗';
    openBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      window.open(s.url.startsWith('http') ? s.url : 'https://' + s.url, '_blank');
    });

    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn';
    editBtn.title = 'Editar';
    editBtn.innerHTML = '✏️';
    editBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      openEditModal(i);
    });

    actions.appendChild(openBtn);
    actions.appendChild(editBtn);

    card.appendChild(favicon);
    card.appendChild(meta);
    card.appendChild(actions);

    // clicking card opens link
    card.addEventListener('click', () => {
      window.open(s.url.startsWith('http') ? s.url : 'https://' + s.url, '_blank');
    });

    grid.appendChild(card);
  });
}

function openEditModal(index = null){
  editingIndex = index;
  if(index === null){
    modalTitle.textContent = 'Adicionar atalho';
    inputName.value = '';
    inputUrl.value = '';
    deleteBtn.style.display = 'none';
  } else {
    modalTitle.textContent = 'Editar atalho';
    const s = shortcuts[index];
    inputName.value = s.name || '';
    inputUrl.value = s.url || '';
    deleteBtn.style.display = 'inline-block';
  }
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
  inputName.focus();
}

function closeModal(){
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden','true');
  editingIndex = null;
  form.reset();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = inputName.value.trim();
  const url = inputUrl.value.trim();
  if(!url) return;
  const record = {name, url};
  if(editingIndex === null){
    shortcuts.push(record);
  } else {
    shortcuts[editingIndex] = record;
  }
  save();
  closeModal();
});

cancelBtn.addEventListener('click', () => closeModal());

deleteBtn.addEventListener('click', () => {
  if(editingIndex !== null){
    if(confirm('Excluir este atalho?')) {
      shortcuts.splice(editingIndex,1);
      save();
      closeModal();
    }
  }
});

addBtn.addEventListener('click', () => openEditModal(null));
exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(shortcuts, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'shortcuts.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});
importFile.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const data = JSON.parse(reader.result);
      if(Array.isArray(data)){
        if(confirm('Substituir atalhos atuais pelo arquivo importado?')) {
          shortcuts = data.map(it => ({name:it.name||'', url:it.url||''}));
          save();
        }
      } else {
        alert('Formato inválido: JSON deve ser um array de objetos {name, url}');
      }
    }catch(err){
      alert('Erro ao ler JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
  // reset input to allow reimport same file later
  e.target.value = '';
});

resetBtn.addEventListener('click', () => {
  if(confirm('Restaurar exemplos e apagar seus atalhos salvos?')) {
    shortcuts = defaultShortcuts();
    save();
  }
});

// fechar modal clicando fora
modal.addEventListener('click', (e) => {
  if(e.target === modal) closeModal();
});

// inicialização
load();