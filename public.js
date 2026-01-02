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

  function createFaviconElement(s){
    const favicon = document.createElement('div');
    favicon.className = 'favicon';
    // color applied if provided
    if(s.color) favicon.style.backgroundColor = s.color;
    // decide content
    if(s.icon && (s.icon.startsWith('http') || s.icon.startsWith('data:'))){
      const img = document.createElement('img');
      img.src = s.icon;
      img.alt = s.name || '';
      favicon.appendChild(img);
    } else if(s.icon && s.icon.match(/(^|\s)fa[-\w ]+|(^|\s)mdi[-\w ]+/)){
      const i = document.createElement('i');
      i.className = s.icon;
      favicon.appendChild(i);
    } else {
      favicon.textContent = s.icon || (s.name ? s.name.slice(0,2).toUpperCase() : '??');
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
    const u = loginUser.value.trim();
    const p = loginPass.value;
    try{
      await AppStore.login(u,p);
      // redirect to admin page after login
      window.location.href = 'admin.html';
    }catch(err){
      alert(err.message || 'Erro no login');
    }
  });
});