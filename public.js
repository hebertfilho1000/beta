// public.js - public page (index.html): shows shortcuts (read-only) and login form (top-right)
// Requires storage.js (AppStore)
document.addEventListener('DOMContentLoaded', async () => {
  await AppStore.init();

  const grid = document.getElementById('grid');
  const emptyHint = document.getElementById('emptyHint');
  const groupsBar = document.getElementById('groupsBar');

  const loginForm = document.getElementById('loginForm');
  const loginUser = document.getElementById('loginUser');
  const loginPass = document.getElementById('loginPass');

  // --- Autofill protection / UX ---
  // Strategy:
  // - Inputs start readonly (set in HTML). Browser autofill typically ignores readonly inputs.
  // - On user focus we remove readonly so they can type. This prevents accidental autofill after Back.
  // - On pageshow (including bfcache restore) we explicitly reset the form and re-enable readonly.
  function lockLoginInputs(){
    try {
      loginForm.reset();
    } catch(e){}
    if(loginUser) {
      loginUser.value = '';
      loginUser.setAttribute('readonly', 'true');
    }
    if(loginPass) {
      loginPass.value = '';
      loginPass.setAttribute('readonly', 'true');
    }
  }
  function unlockLoginInputsOnce(){
    try {
      if(loginUser && loginUser.hasAttribute('readonly')) loginUser.removeAttribute('readonly');
      if(loginPass && loginPass.hasAttribute('readonly')) loginPass.removeAttribute('readonly');
      // remove listeners after first user interaction
      loginUser.removeEventListener('focus', unlockLoginInputsOnce);
      loginPass.removeEventListener('focus', unlockLoginInputsOnce);
    } catch(e){}
  }

  // ensure locked on start (in case HTML not readonly for some reason)
  lockLoginInputs();

  // Attach focus listeners to unlock on explicit user action
  if(loginUser) loginUser.addEventListener('focus', unlockLoginInputsOnce);
  if(loginPass) loginPass.addEventListener('focus', unlockLoginInputsOnce);

  // When page is shown (including when returned via bfcache), clear/lock inputs again
  window.addEventListener('pageshow', (event) => {
    // reset and re-lock to avoid browser showing autofilled values
    lockLoginInputs();
  });

  // A small timeout after load to clear any autofill some browsers may try
  setTimeout(() => lockLoginInputs(), 200);

  // --- Rendering helpers for icons/colors ---
  function createFaviconElement(s){
    const favicon = document.createElement('div');
    favicon.className = 'favicon';
    if(s && s.color) favicon.style.backgroundColor = s.color;
    if(s && s.icon && (s.icon.startsWith('http') || s.icon.startsWith('data:'))){
      const img = document.createElement('img');
      img.src = s.icon;
      img.alt = s.name || '';
      favicon.appendChild(img);
    } else if(s && s.icon && s.icon.match(/(^|\s)fa[-\w ]+|(^|\s)mdi[-\w ]+/)){
      const i = document.createElement('i');
      i.className = s.icon;
      favicon.appendChild(i);
    } else {
      favicon.textContent = s && s.icon ? s.icon : (s && s.name ? s.name.slice(0,2).toUpperCase() : '??');
    }
    return favicon;
  }

  function renderGroups(){
    groupsBar.innerHTML = '';
    const groups = AppStore.getGroups();
    groups.forEach((g, i) => {
      const chip = document.createElement('button');
      chip.className = 'group-chip';
      if(i === 0) chip.classList.add('active');
      chip.textContent = g.name;
      chip.addEventListener('click', () => {
        renderGroupItems(g);
        Array.from(groupsBar.querySelectorAll('.group-chip')).forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
      groupsBar.appendChild(chip);
    });
  }

  function renderGroupItems(g){
    grid.innerHTML = '';
    if(!g || !g.items || g.items.length === 0){
      emptyHint.style.display = 'block';
      return;
    } else {
      emptyHint.style.display = 'none';
    }
    g.items.forEach(s => {
      const card = document.createElement('div');
      card.className = 'card';

      const favicon = createFaviconElement(s);

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

      card.appendChild(favicon);
      card.appendChild(meta);
      card.appendChild(actions);

      card.addEventListener('click', () => {
        window.open(s.url.startsWith('http') ? s.url : 'https://' + s.url, '_blank');
      });

      grid.appendChild(card);
    });
  }

  const groups = AppStore.getGroups();
  renderGroups();
  renderGroupItems(groups[0]);

  // login -> on success redirect to admin.html
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // ensure inputs are unlocked (protection vs programmatic submit)
    unlockLoginInputsOnce();
    const u = loginUser.value ? loginUser.value.trim() : '';
    const p = loginPass.value || '';
    if(!u || !p){
      alert('Preencha usuário e senha antes de entrar.');
      return;
    }
    try{
      await AppStore.login(u,p);
      // redirect to admin page after login
      window.location.href = 'admin.html';
    }catch(err){
      alert(err.message || 'Erro no login');
      // clear password field for safety
      if(loginPass) loginPass.value = '';
    }
  });
});