// Painel de atalhos com suporte a grupos
const STORAGE_KEY = 'shortcuts_v1';

const grid = document.getElementById('grid');
const emptyHint = document.getElementById('emptyHint');
const addBtn = document.getElementById('addBtn');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');
const resetBtn = document.getElementById('resetBtn');

const groupsBar = document.getElementById('groupsBar');
const addGroupBtn = document.getElementById('addGroupBtn');

const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const form = document.getElementById('form');
const inputName = document.getElementById('inputName');
const inputUrl = document.getElementById('inputUrl');
const selectGroup = document.getElementById('selectGroup');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const deleteBtn = document.getElementById('deleteBtn');

let groups = []; // [{id, name, items: [{name,url}, ...]}]
let activeGroupId = null;

let editingIndex = null;
let editingGroupId = null;
let dragFromIndex = null;
let dragGroupFromIndex = null;

function id() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}

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

function defaultGroups(){
  return [{id: id(), name: 'Geral', items: defaultShortcuts()}];
}

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      // Migration: if old format (array of shortcuts) -> wrap into single group
      if(Array.isArray(parsed)){
        groups = [{id: id(), name: 'Geral', items: parsed}];
        activeGroupId = groups[0].id;
        save(); // persist new format
      } else if(parsed && Array.isArray(parsed.groups)){
        groups = parsed.groups;
        activeGroupId = parsed.activeGroupId || (groups[0] && groups[0].id) || null;
      } else {
        groups = defaultGroups();
        activeGroupId = groups[0].id;
        save();
      }
    } else {
      groups = defaultGroups();
      activeGroupId = groups[0].id;
      save();
    }
  } catch(e){
    console.error('Erro ao carregar atalhos', e);
    groups = defaultGroups();
    activeGroupId = groups[0].id;
  }
  render();
}

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify({groups, activeGroupId}));
  render();
}

function getActiveGroup(){
  return groups.find(g => g.id === activeGroupId) || groups[0];
}

function renderGroupsBar(){
  // clear existing chips except add button
  const existing = Array.from(groupsBar.querySelectorAll('.group-chip'));
  existing.forEach(el => el.remove());

  groups.forEach((g, idx) => {
    const chip = document.createElement('button');
    chip.className = 'group-chip';
    if(g.id === activeGroupId) chip.classList.add('active');
    chip.dataset.index = idx;
    chip.dataset.groupId = g.id;
    chip.setAttribute('draggable', 'true');
    chip.textContent = g.name;

    // actions inside chip (rename/delete)
    const actions = document.createElement('span');
    actions.className = 'actions';
    const editI = document.createElement('span');
    editI.className = 'icon';
    editI.title = 'Renomear grupo';
    editI.textContent = '✏️';
    editI.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const newName = prompt('Novo nome para o grupo:', g.name);
      if(newName && newName.trim()){
        g.name = newName.trim();
        save();
      }
    });
    const delI = document.createElement('span');
    delI.className = 'icon';
    delI.title = 'Excluir grupo';
    delI.textContent = '🗑️';
    delI.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if(groups.length === 1){
        alert('Não é possível excluir o último grupo.');
        return;
      }
      if(confirm(`Excluir o grupo "${g.name}" e todos os seus atalhos?`)){
        groups.splice(idx,1);
        if(activeGroupId === g.id){
          activeGroupId = groups[0].id;
        }
        save();
      }
    });

    actions.appendChild(editI);
    actions.appendChild(delI);
    chip.appendChild(actions);

    // clicking selects group
    chip.addEventListener('click', () => {
      activeGroupId = g.id;
      render();
    });

    // drag/drop to reorder groups
    chip.addEventListener('dragstart', (e) => {
      dragGroupFromIndex = idx;
      e.dataTransfer.effectAllowed = 'move';
      chip.style.opacity = '0.6';
    });
    chip.addEventListener('dragend', () => {
      dragGroupFromIndex = null;
      chip.style.opacity = '';
    });
    chip.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    chip.addEventListener('drop', (e) => {
      e.preventDefault();
      const toIndex = Number(chip.dataset.index);
      if(dragGroupFromIndex == null || dragGroupFromIndex === toIndex) return;
      const item = groups.splice(dragGroupFromIndex,1)[0];
      groups.splice(toIndex,0,item);
      save();
    });

    groupsBar.insertBefore(chip, addGroupBtn);
  });

  // update addGroup button position/visibility already in DOM
}

function renderGrid(){
  grid.innerHTML = '';
  const active = getActiveGroup();
  if(!active || !active.items || active.items.length === 0){
    emptyHint.style.display = 'block';
    return;
  } else {
    emptyHint.style.display = 'none';
  }

  active.items.forEach((s, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('draggable', 'true');
    card.dataset.index = i;

    // drag events for moving inside same group
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
      const items = active.items;
      const item = items.splice(dragFromIndex,1)[0];
      items.splice(toIndex,0,item);
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
      openEditModal(i, active.id);
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

function renderSelectGroup(){
  selectGroup.innerHTML = '';
  groups.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = g.name;
    selectGroup.appendChild(opt);
  });
}

function render(){
  renderGroupsBar();
  renderSelectGroup();
  renderGrid();
}

// Modal controls
function openEditModal(index = null, groupId = null){
  editingIndex = index;
  editingGroupId = groupId || activeGroupId;
  if(index === null){
    modalTitle.textContent = 'Adicionar atalho';
    inputName.value = '';
    inputUrl.value = '';
    deleteBtn.style.display = 'none';
    selectGroup.value = editingGroupId;
  } else {
    modalTitle.textContent = 'Editar atalho';
    const g = groups.find(x => x.id === editingGroupId);
    const s = g && g.items && g.items[index];
    inputName.value = s ? s.name : '';
    inputUrl.value = s ? s.url : '';
    deleteBtn.style.display = 'inline-block';
    selectGroup.value = editingGroupId;
  }
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
  inputName.focus();
}

function closeModal(){
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden','true');
  editingIndex = null;
  editingGroupId = null;
  form.reset();
}

// Form submit: create or update, possibly moving between groups
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = inputName.value.trim();
  const url = inputUrl.value.trim();
  if(!url) return;
  const targetGroupId = selectGroup.value;
  const targetGroup = groups.find(g => g.id === targetGroupId);
  if(!targetGroup) return alert('Grupo inválido');

  const record = {name, url};

  if(editingIndex === null){
    // add new to target group
    targetGroup.items.push(record);
  } else {
    // editing existing
    const fromGroup = groups.find(g => g.id === editingGroupId);
    if(!fromGroup) return;
    if(editingGroupId === targetGroupId){
      // update in place
      fromGroup.items[editingIndex] = record;
    } else {
      // remove from old, add to target
      const [item] = fromGroup.items.splice(editingIndex, 1);
      targetGroup.items.push(record);
    }
  }
  save();
  closeModal();
});

cancelBtn.addEventListener('click', () => closeModal());

deleteBtn.addEventListener('click', () => {
  if(editingIndex !== null && editingGroupId){
    if(confirm('Excluir este atalho?')) {
      const g = groups.find(x => x.id === editingGroupId);
      if(g){
        g.items.splice(editingIndex,1);
        save();
        closeModal();
      }
    }
  }
});

// add shortcut button opens modal with active group selected
addBtn.addEventListener('click', () => openEditModal(null, activeGroupId));

// export / import
exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({groups, activeGroupId}, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'shortcuts-groups.json';
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
        // old plain array -> ask to replace into a single group
        if(confirm('Arquivo JSON é um array antigo. Substituir atalhos atuais por este array (será colocado em um único grupo "Geral")?')) {
          groups = [{id: id(), name:'Geral', items: data.map(it => ({name:it.name||'', url:it.url||''}))}];
          activeGroupId = groups[0].id;
          save();
        }
      } else if(data && Array.isArray(data.groups)){
        if(confirm('Substituir dados atuais pelos grupos do arquivo importado?')) {
          groups = data.groups.map(g => ({id: g.id || id(), name: g.name || 'Grupo', items: Array.isArray(g.items) ? g.items.map(it => ({name: it.name||'', url: it.url||''})) : []}));
          activeGroupId = data.activeGroupId || (groups[0] && groups[0].id) || null;
          save();
        }
      } else {
        alert('Formato inválido: JSON esperado é {groups: [...] } ou array antigo de atalhos.');
      }
    }catch(err){
      alert('Erro ao ler JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

// groups management
addGroupBtn.addEventListener('click', () => {
  const name = prompt('Nome do novo grupo:', 'Novo Grupo');
  if(name && name.trim()){
    const g = {id: id(), name: name.trim(), items: []};
    groups.push(g);
    activeGroupId = g.id;
    save();
  }
});

// reset to defaults (groups + items)
resetBtn.addEventListener('click', () => {
  if(confirm('Restaurar exemplos e apagar seus atalhos salvos?')) {
    groups = defaultGroups();
    activeGroupId = groups[0].id;
    save();
  }
});

// clicking outside modal closes
modal.addEventListener('click', (e) => {
  if(e.target === modal) closeModal();
});

// initial load
load();