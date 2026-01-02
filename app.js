// Painel de atalhos com suporte a grupos + autenticação simples + gerenciamento de usuários
const STORAGE_KEY = 'shortcuts_v1';
const USERS_KEY = 'shortcuts_users_v1';
const SESSION_KEY = 'shortcuts_session_v1';

const grid = document.getElementById('grid');
const emptyHint = document.getElementById('emptyHint');

const adminControls = document.getElementById('adminControls');
const addBtn = document.getElementById('addBtn');
const usersBtn = document.getElementById('usersBtn');
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

const usersModal = document.getElementById('usersModal');
const usersList = document.getElementById('usersList');
const createUserForm = document.getElementById('createUserForm');
const newUserInput = document.getElementById('newUser');
const newPassInput = document.getElementById('newPass');
const newIsAdmin = document.getElementById('newIsAdmin');
const closeUsersModal = document.getElementById('closeUsersModal');

const loginForm = document.getElementById('loginForm');
const loginUser = document.getElementById('loginUser');
const loginPass = document.getElementById('loginPass');
const authArea = document.getElementById('authArea');
const sessionPanel = document.getElementById('sessionPanel');
const sessionUserEl = document.getElementById('sessionUser');
const logoutBtn = document.getElementById('logoutBtn');

let groups = []; // [{id, name, items: [{name,url}, ...]}]
let activeGroupId = null;

let users = []; // [{username, passwordHash, salt, isAdmin}]
let currentSession = null; // {username}

let editingIndex = null;
let editingGroupId = null;
let dragFromIndex = null;
let dragGroupFromIndex = null;

// ----------------- utils (hashing) -----------------
function randomSalt(len = 12) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => ('0' + (b % 36).toString(36)).slice(-1)).join('');
}
function bufToHex(buffer){
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}
async function hashPassword(password, salt) {
  // simple SHA-256(salt + password) via Web Crypto
  const enc = new TextEncoder();
  const data = enc.encode(salt + password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return bufToHex(hash);
}

// ----------------- defaults & storage -----------------
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
    {name:'Wikipedia', url:'https://pt.wikipedia.org'}
  ];
}
function defaultGroups(){
  return [{id: id(), name: 'Geral', items: defaultShortcuts()}];
}

// users storage helpers
function loadUsersFromStorage(){
  try{
    const raw = localStorage.getItem(USERS_KEY);
    if(raw){
      users = JSON.parse(raw);
    } else {
      // create default admin user: admin / admin
      (async () => {
        const salt = randomSalt();
        const hash = await hashPassword('admin', salt);
        users = [{username:'admin', passwordHash: hash, salt, isAdmin: true}];
        saveUsersToStorage();
      })();
    }
  }catch(e){
    console.error('Erro ao carregar usuários', e);
    users = [];
  }
}
function saveUsersToStorage(){
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// session helpers
function loadSession(){
  try{
    const raw = sessionStorage.getItem(SESSION_KEY);
    if(raw){
      currentSession = JSON.parse(raw);
    } else {
      currentSession = null;
    }
  }catch(e){
    currentSession = null;
  }
}
function saveSession(){
  if(currentSession){
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentSession));
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      if(Array.isArray(parsed)){
        groups = [{id: id(), name: 'Geral', items: parsed}];
        activeGroupId = groups[0].id;
        save(); // migrate
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
  loadUsersFromStorage();
  loadSession();

  // garantir que modal de usuários esteja fechado no carregamento
  if(usersModal) usersModal.classList.add('hidden');

  render();
}

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify({groups, activeGroupId}));
  render();
}

// ----------------- auth & users management -----------------
function findUser(username){
  return users.find(u => u.username === username);
}
async function createUser(username, password, isAdmin = false){
  username = username.trim();
  if(!username || !password) throw new Error('usuário ou senha inválidos');
  if(findUser(username)) throw new Error('Usuário já existe');
  const salt = randomSalt();
  const passwordHash = await hashPassword(password, salt);
  users.push({username, passwordHash, salt, isAdmin: !!isAdmin});
  saveUsersToStorage();
  renderUsersList();
}
async function changeUserPassword(username, newPassword){
  const u = findUser(username);
  if(!u) throw new Error('Usuário não encontrado');
  const salt = randomSalt();
  const hash = await hashPassword(newPassword, salt);
  u.salt = salt;
  u.passwordHash = hash;
  saveUsersToStorage();
  renderUsersList();
}
function deleteUser(username){
  const idx = users.findIndex(u => u.username === username);
  if(idx === -1) return;
  const target = users[idx];
  // prevent deleting last admin
  if(target.isAdmin){
    const admins = users.filter(u => u.isAdmin);
    if(admins.length <= 1){
      alert('Não é possível excluir o último administrador.');
      return false;
    }
  }
  users.splice(idx,1);
  saveUsersToStorage();
  renderUsersList();
  return true;
}
async function login(username, password){
  const u = findUser(username);
  if(!u) {
    throw new Error('Usuário/Senha inválidos');
  }
  const hash = await hashPassword(password, u.salt);
  if(hash === u.passwordHash){
    currentSession = {username: u.username};
    saveSession();
    render();
    return true;
  } else {
    throw new Error('Usuário/Senha inválidos');
  }
}
function logout(){
  currentSession = null;
  saveSession();
  render();
}
function isAuthenticated(){
  return currentSession && findUser(currentSession.username);
}
function isCurrentAdmin(){
  const u = isAuthenticated() ? findUser(currentSession.username) : null;
  return !!(u && u.isAdmin);
}

// ----------------- rendering -----------------
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

    const titleSpan = document.createElement('span');
    titleSpan.textContent = g.name;
    chip.appendChild(titleSpan);

    // actions inside chip (rename/delete) - only admin can see
    if(isAuthenticated()){
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
    }

    // clicking selects group
    chip.addEventListener('click', () => {
      activeGroupId = g.id;
      render();
    });

    // drag/drop to reorder groups (only admin)
    if(isAuthenticated()){
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
    }

    groupsBar.insertBefore(chip, addGroupBtn);
  });

  // update addGroup button visibility
  addGroupBtn.style.display = isAuthenticated() ? 'inline-flex' : 'none';
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
    // if admin -> draggable for reorder else not draggable
    if(isAuthenticated()){
      card.setAttribute('draggable', 'true');
      card.dataset.index = i;
    }

    // drag events for moving inside same group (admin only)
    if(isAuthenticated()){
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
    }

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

    actions.appendChild(openBtn);

    if(isAuthenticated()){
      const editBtn = document.createElement('button');
      editBtn.className = 'icon-btn';
      editBtn.title = 'Editar';
      editBtn.innerHTML = '✏️';
      editBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        openEditModal(i, active.id);
      });
      actions.appendChild(editBtn);
    }

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

function renderUsersList(){
  usersList.innerHTML = '';
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
        await changeUserPassword(u.username, np);
        alert('Senha alterada');
      }
    });
    const toggleAdminBtn = document.createElement('button');
    toggleAdminBtn.textContent = u.isAdmin ? 'Remover Admin' : 'Tornar Admin';
    toggleAdminBtn.addEventListener('click', () => {
      // prevent removing last admin
      if(u.isAdmin){
        const admins = users.filter(x => x.isAdmin);
        if(admins.length <= 1){
          alert('Não é possível remover o último administrador.');
          return;
        }
      }
      u.isAdmin = !u.isAdmin;
      saveUsersToStorage();
      renderUsersList();
    });
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Excluir';
    delBtn.addEventListener('click', () => {
      if(u.username === currentSession?.username){
        if(!confirm('Excluir seu próprio usuário? Isso irá fazer logoff. Confirmar?')){
          return;
        }
      } else {
        if(!confirm(`Excluir usuário ${u.username}?`)) return;
      }
      const ok = deleteUser(u.username);
      if(ok && u.username === currentSession?.username){
        logout();
        closeUsers();
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

function renderAuthArea(){
  // if authenticated -> show session panel, hide login form and show admin controls
  if(isAuthenticated()){
    loginForm.classList.add('hidden');
    sessionPanel.classList.remove('hidden');
    sessionUserEl.textContent = currentSession.username;
    adminControls.classList.remove('hidden');
  } else {
    loginForm.classList.remove('hidden');
    sessionPanel.classList.add('hidden');
    adminControls.classList.add('hidden');
  }
}

function render(){
  renderAuthArea();
  renderGroupsBar();
  renderSelectGroup();
  renderGrid();
  renderUsersList();
}

// ----------------- modal controls for shortcuts -----------------
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
      fromGroup.items.splice(editingIndex, 1);
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
addBtn.addEventListener('click', () => {
  if(!isAuthenticated()) return alert('Acesso negado');
  openEditModal(null, activeGroupId);
});

// export / import
exportBtn.addEventListener('click', () => {
  if(!isAuthenticated()) return alert('Acesso negado');
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
  if(!isAuthenticated()) return alert('Acesso negado');
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const data = JSON.parse(reader.result);
      if(Array.isArray(data)){
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
  if(!isAuthenticated()) return alert('Acesso negado');
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
  if(!isAuthenticated()) return alert('Acesso negado');
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
usersModal.addEventListener('click', (e) => {
  if(e.target === usersModal) closeUsers();
});

// ----------------- users modal controls -----------------
usersBtn.addEventListener('click', () => {
  if(!isAuthenticated() || !isCurrentAdmin()) return alert('Acesso negado: apenas administradores');
  openUsers();
});
function openUsers(){
  // abre o modal de usuários (somente quando chamado)
  if(!isAuthenticated() || !isCurrentAdmin()) return alert('Acesso negado');
  usersModal.classList.remove('hidden');
  usersModal.setAttribute('aria-hidden','false');
  renderUsersList();
  // focar o campo de novo usuário para conveniência
  setTimeout(() => {
    if(newUserInput) newUserInput.focus();
  }, 50);
}
function closeUsers(){
  usersModal.classList.add('hidden');
  usersModal.setAttribute('aria-hidden','true');
  createUserForm.reset();
  // voltar para a view administrativa (se estiver logado)
  render();
  // focar no nome do usuário da sessão para feedback
  setTimeout(() => {
    try{ if(sessionUserEl) sessionUserEl.focus(); }catch(e){}
  }, 50);
}
closeUsersModal.addEventListener('click', () => closeUsers());

createUserForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if(!isAuthenticated() || !isCurrentAdmin()) return alert('Acesso negado');
  const uname = newUserInput.value.trim();
  const pass = newPassInput.value;
  const adminFlag = !!newIsAdmin.checked;
  try{
    await createUser(uname, pass, adminFlag);
    alert('Usuário criado');
    createUserForm.reset();
    renderUsersList();
    // manter o modal aberto para criar mais se necessário
    setTimeout(() => { if(newUserInput) newUserInput.focus(); }, 50);
  }catch(err){
    alert(err.message || 'Erro ao criar usuário');
  }
});

// ----------------- login form -----------------
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const u = loginUser.value.trim();
  const p = loginPass.value;
  try{
    await login(u, p);
    loginForm.reset();
    render();
  }catch(err){
    alert(err.message || 'Erro no login');
  }
});

logoutBtn.addEventListener('click', () => {
  logout();
});

// ----------------- initial -----------------
load();