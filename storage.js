// storage.js - shared helper for groups, users, session
// Exposes global AppStore with async functions
(function(){
  const STORAGE_KEY = 'shortcuts_v1';
  const USERS_KEY = 'shortcuts_users_v1';
  const SESSION_KEY = 'shortcuts_session_v1';

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

  // hashing helpers
  function randomSalt(len = 12) {
    const arr = new Uint8Array(len);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => ('0' + (b % 36).toString(36)).slice(-1)).join('');
  }
  function bufToHex(buffer){
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
  }
  async function hashPassword(password, salt) {
    const enc = new TextEncoder();
    const data = enc.encode(salt + password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return bufToHex(hash);
  }

  // state
  let groups = [];
  let activeGroupId = null;
  let users = [];
  let session = null; // {username}

  // load/save
  function loadData(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw){
        const parsed = JSON.parse(raw);
        if(Array.isArray(parsed)){
          groups = [{id: id(), name: 'Geral', items: parsed}];
          activeGroupId = groups[0].id;
          saveData();
        } else if(parsed && Array.isArray(parsed.groups)){
          groups = parsed.groups;
          activeGroupId = parsed.activeGroupId || (groups[0] && groups[0].id) || null;
        } else {
          groups = defaultGroups();
          activeGroupId = groups[0].id;
          saveData();
        }
      } else {
        groups = defaultGroups();
        activeGroupId = groups[0].id;
        saveData();
      }
    } catch(e){
      console.error('Erro ao carregar atalhos', e);
      groups = defaultGroups();
      activeGroupId = groups[0].id;
    }
  }
  function saveData(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify({groups, activeGroupId}));
  }

  function loadUsers(){
    try{
      const raw = localStorage.getItem(USERS_KEY);
      if(raw){
        users = JSON.parse(raw);
      } else {
        // create default admin admin
        (async () => {
          const salt = randomSalt();
          const hash = await hashPassword('admin', salt);
          users = [{username:'admin', passwordHash: hash, salt, isAdmin: true}];
          saveUsers();
        })();
      }
    }catch(e){
      console.error('Erro ao carregar usuários', e);
      users = [];
    }
  }
  function saveUsers(){
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function loadSession(){
    try{
      const raw = sessionStorage.getItem(SESSION_KEY);
      if(raw) session = JSON.parse(raw);
      else session = null;
    }catch(e){
      session = null;
    }
  }
  function saveSession(){
    if(session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_KEY);
  }

  // public API
  window.AppStore = {
    async init(){
      loadData();
      loadUsers();
      loadSession();
      // ensure there's at least one user (init async default user if needed)
      if(users.length === 0){
        const salt = randomSalt();
        const hash = await hashPassword('admin', salt);
        users = [{username:'admin', passwordHash: hash, salt, isAdmin: true}];
        saveUsers();
      }
    },

    // data
    getGroups(){ return groups; },
    getActiveGroupId(){ return activeGroupId; },
    setActiveGroup(id){ activeGroupId = id; saveData(); },
    saveGroups(g, activeId){ groups = g; activeGroupId = activeId || (groups[0] && groups[0].id) || null; saveData(); },

    // users/session
    getUsers(){ return users.slice(); },
    async createUser(username, password, isAdmin = false){
      username = username.trim();
      if(!username || !password) throw new Error('Usuário ou senha inválidos');
      if(users.find(u => u.username === username)) throw new Error('Usuário já existe');
      const salt = randomSalt();
      const passwordHash = await hashPassword(password, salt);
      users.push({username, passwordHash, salt, isAdmin: !!isAdmin});
      saveUsers();
      return true;
    },
    async changeUserPassword(username, newPassword){
      const u = users.find(x => x.username === username);
      if(!u) throw new Error('Usuário não encontrado');
      const salt = randomSalt();
      const hash = await hashPassword(newPassword, salt);
      u.salt = salt;
      u.passwordHash = hash;
      saveUsers();
      return true;
    },
    deleteUser(username){
      const idx = users.findIndex(u => u.username === username);
      if(idx === -1) return false;
      const target = users[idx];
      if(target.isAdmin){
        const admins = users.filter(u => u.isAdmin);
        if(admins.length <= 1) throw new Error('Não é possível excluir o último administrador.');
      }
      users.splice(idx,1);
      saveUsers();
      return true;
    },
    toggleAdmin(username){
      const u = users.find(x => x.username === username);
      if(!u) throw new Error('Usuário não encontrado');
      if(u.isAdmin){
        const admins = users.filter(x => x.isAdmin);
        if(admins.length <= 1) throw new Error('Não é possível remover o último administrador.');
      }
      u.isAdmin = !u.isAdmin;
      saveUsers();
      return true;
    },

    async login(username, password){
      const u = users.find(x => x.username === username);
      if(!u) throw new Error('Usuário/Senha inválidos');
      const h = await hashPassword(password, u.salt);
      if(h === u.passwordHash){
        session = {username: u.username};
        saveSession();
        return true;
      } else {
        throw new Error('Usuário/Senha inválidos');
      }
    },
    logout(){
      session = null;
      saveSession();
    },
    currentSession(){ return session ? Object.assign({}, session) : null; },
    isAuthenticated(){ return !!(session && users.find(u => u.username === session.username)); },
    isCurrentAdmin(){ const s = session ? users.find(u => u.username === session.username) : null; return !!(s && s.isAdmin); },

    // convenience for hashing (exposed only for debugging, avoid exposing in prod)
    _hashPassword: hashPassword
  };
})();