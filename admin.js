// admin.js - admin page: requires storage.js (AppStore)
// provides editing UX and separate users section (not modal)
document.addEventListener('DOMContentLoaded', async () => {
  await AppStore.init();

  // protect admin page
  if(!AppStore.isAuthenticated()){
    // not authenticated: redirect to public page
    window.location.href = 'index.html';
    return;
  }

  const logoutBtn = document.getElementById('logoutBtn');
  const tabShortcuts = document.getElementById('tabShortcuts');
  const tabUsers = document.getElementById('tabUsers');
  const sectionShortcuts = document.getElementById('sectionShortcuts');
  const sectionUsers = document.getElementById('sectionUsers');

  const grid = document.querySelector('#sectionShortcuts #grid');
  const emptyHint = document.getElementById('emptyHint');
  const groupsBar = document.getElementById('groupsBar');
  const addGroupBtn = document.getElementById('addGroupBtn');

  const addBtn = document.getElementById('addBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importFile = document.getElementById('importFile');
  const resetBtn = document.getElementById('resetBtn');

  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const form = document.getElementById('form');
  const inputName = document.getElementById('inputName');
  const inputUrl = document.getElementById('inputUrl');
  const selectGroup = document.getElementById('selectGroup');
  const cancelBtn = document.getElementById('cancelBtn');
  const deleteBtn = document.getElementById('deleteBtn');

  const usersList = document.getElementById('usersList');
  const createUserForm = document.getElementById('createUserForm');
  const newUserInput = document.getElementById('newUser');
  const newPassInput = document.getElementById('newPass');
  const newIsAdmin = document.getElementById('newIsAdmin');

  let groups = AppStore.getGroups();
  let activeGroupId = AppStore.getActiveGroupId() || (groups[0] && groups[0].id);
  let editingIndex = null;
  let editingGroupId = null;
  let dragFromIndex = null;

  function saveAndReload(newGroups, activeId){
    AppStore.saveGroups(newGroups, activeId);
    groups = AppStore.getGroups();
    activeGroupId = AppStore.getActiveGroupId();
    renderAll();
  }

  function renderGroupsBar(){
    groupsBar.innerHTML = '';
    groups.forEach((g, i) => {
      const chip = document.createElement('button');
      chip.className = 'group-chip';
      if(g.id === activeGroupId) chip.classList.add('active');
      chip.textContent = g.name;
      chip.addEventListener('click', () => {
        activeGroupId = g.id;
        saveAndReload(groups, activeGroupId);
      });
      groupsBar.appendChild(chip);
    });
    // add group button at end
    addGroupBtn.style.display = AppStore.isCurrentAdmin() ? 'inline-flex' : 'none';
  }

  function renderGrid(){
    grid.innerHTML = '';
    const active = groups.find(g => g.id === activeGroupId) || groups[0];
    if(!active || !active.items || active.items.length === 0){
      emptyHint.style.display = 'block';
      return;
    } else {
      emptyHint.style.display = 'none';
    }
    active.items.forEach((s,i) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.setAttribute('draggable','true');
      card.dataset.index = i;
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

      // drag events (reorder)
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
      });
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        const toIndex = Number(card.dataset.index);
        if(dragFromIndex == null || dragFromIndex === toIndex) return;
        const items = active.items;
        const item = items.splice(dragFromIndex,1)[0];
        items.splice(toIndex,0,item);
        saveAndReload(groups, activeGroupId);
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

  // modal
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
      targetGroup.items.push(record);
    } else {
      const fromGroup = groups.find(g => g.id === editingGroupId);
      if(!fromGroup) return;
      if(editingGroupId === targetGroupId){
        fromGroup.items[editingIndex] = record;
      } else {
        fromGroup.items.splice(editingIndex,1);
        targetGroup.items.push(record);
      }
    }
    saveAndReload(groups, activeGroupId);
    closeModal();
  });
  cancelBtn.addEventListener('click', closeModal);
  deleteBtn.addEventListener('click', () => {
    if(editingIndex !== null && editingGroupId){
      if(confirm('Excluir este atalho?')){
        const g = groups.find(x => x.id === editingGroupId);
        if(g){ g.items.splice(editingIndex,1); saveAndReload(groups, activeGroupId); closeModal(); }
      }
    }
  });

  // groups
  addGroupBtn.addEventListener('click', () => {
    const name = prompt('Nome do novo grupo:', 'Novo Grupo');
    if(name && name.trim()){
      groups.push({id: id(), name: name.trim(), items: []});
      saveAndReload(groups, activeGroupId);
    }
  });

  // admin functions: export/import/reset
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
          if(confirm('Arquivo JSON é um array antigo. Substituir atalhos atuais por este array (será colocado em um único grupo "Geral")?')) {
            groups = [{id: id(), name:'Geral', items: data.map(it => ({name:it.name||'', url:it.url||''}))}];
            saveAndReload(groups, groups[0].id);
          }
        } else if(data && Array.isArray(data.groups)){
          if(confirm('Substituir dados atuais pelos grupos do arquivo importado?')) {
            groups = data.groups.map(g => ({id: g.id || id(), name: g.name || 'Grupo', items: Array.isArray(g.items) ? g.items.map(it => ({name: it.name||'', url: it.url||''})) : []}));
            saveAndReload(groups, data.activeGroupId || (groups[0] && groups[0].id));
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
  resetBtn.addEventListener('click', () => {
    if(confirm('Restaurar exemplos e apagar seus atalhos salvos?')) {
      groups = [{id: id(), name: 'Geral', items: defaultShortcuts()}];
      saveAndReload(groups, groups[0].id);
    }
  });

  // users management
  function renderUsersList(){
    usersList.innerHTML = '';
    const users = AppStore.getUsers();
    users.forEach(u => {
      const row = document.createElement('div');
      row.className = 'user-row';
      const meta = document.createElement('div');
      meta.className = 'meta';
      const uname = document.createElement('div');
      uname.className = 'uname';
      uname.textContent = u.username;
      const urole = document.createElement('div');
      urole.className = 'urole';
      urole.textContent = u.isAdmin ? 'Administrador' : 'Editor';
      meta.appendChild(uname);
      meta.appendChild(urole);

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '8px';
      const changePassBtn = document.createElement('button');
      changePassBtn.textContent = 'Senha';
      changePassBtn.addEventListener('click', async () => {
        const np = prompt(`Nova senha para ${u.username}:`);
        if(np){
          await AppStore.changeUserPassword(u.username, np);
          alert('Senha alterada');
          renderUsersList();
        }
      });
      const toggleAdminBtn = document.createElement('button');
      toggleAdminBtn.textContent = u.isAdmin ? 'Remover Admin' : 'Tornar Admin';
      toggleAdminBtn.addEventListener('click', () => {
        try{
          AppStore.toggleAdmin(u.username);
          renderUsersList();
        }catch(err){
          alert(err.message || 'Erro');
        }
      });
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Excluir';
      delBtn.addEventListener('click', () => {
        if(u.username === AppStore.currentSession()?.username){
          if(!confirm('Excluir seu próprio usuário? Isso irá fazer logoff. Confirmar?')) return;
        } else {
          if(!confirm(`Excluir usuário ${u.username}?`)) return;
        }
        try{
          const ok = AppStore.deleteUser(u.username);
          if(ok){
            if(u.username === AppStore.currentSession()?.username){
              AppStore.logout();
              window.location.href = 'index.html';
            } else {
              renderUsersList();
            }
          }
        }catch(err){
          alert(err.message || 'Erro ao excluir');
        }
      });

      actions.appendChild(changePassBtn);
      actions.appendChild(toggleAdminBtn);
      actions.appendChild(delBtn);

      row.appendChild(meta);
      row.appendChild(actions);
      usersList.appendChild(row);
    });
  }

  createUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const uname = newUserInput.value.trim();
    const pass = newPassInput.value;
    const adminFlag = !!newIsAdmin.checked;
    try{
      await AppStore.createUser(uname, pass, adminFlag);
      alert('Usuário criado');
      createUserForm.reset();
      renderUsersList();
    }catch(err){
      alert(err.message || 'Erro ao criar usuário');
    }
  });

  // tabs
  tabShortcuts.addEventListener('click', () => {
    tabShortcuts.classList.add('active');
    tabUsers.classList.remove('active');
    sectionShortcuts.classList.remove('hidden');
    sectionUsers.classList.add('hidden');
    renderAll();
  });
  tabUsers.addEventListener('click', () => {
    tabUsers.classList.add('active');
    tabShortcuts.classList.remove('active');
    sectionUsers.classList.remove('hidden');
    sectionShortcuts.classList.add('hidden');
    renderUsersList();
  });

  logoutBtn.addEventListener('click', () => {
    AppStore.logout();
    window.location.href = 'index.html';
  });

  // initial render helpers
  function renderAll(){
    groups = AppStore.getGroups();
    activeGroupId = AppStore.getActiveGroupId() || (groups[0] && groups[0].id);
    renderGroupsBar();
    renderSelectGroup();
    renderGrid();
  }

  // expose some helpers used above
  function id(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
  function defaultShortcuts(){ return [
    {name:'Google', url:'https://www.google.com'},
    {name:'YouTube', url:'https://www.youtube.com'},
    {name:'Gmail', url:'https://mail.google.com'},
    {name:'GitHub', url:'https://github.com'},
    {name:'Stack Overflow', url:'https://stackoverflow.com'},
    {name:'Wikipedia', url:'https://pt.wikipedia.org'}
  ]; }

  function renderSelectGroup(){
    selectGroup.innerHTML = '';
    groups.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent = g.name;
      selectGroup.appendChild(opt);
    });
  }

  // initial
  renderAll();
  // default show shortcuts tab
  tabShortcuts.click();
});