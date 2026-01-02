// antes: const favicon = document.createElement('div'); ...
const favicon = document.createElement('div');
favicon.className = 'favicon';
if(s.color){
  favicon.style.backgroundColor = s.color;
} else {
  favicon.style.backgroundColor = ''; // fallback CSS
}

// limpar conteúdo
favicon.innerHTML = '';
// se icon for URL (começa com http/https ou data:)
if(s.icon && (s.icon.startsWith('http') || s.icon.startsWith('data:'))){
  const img = document.createElement('img');
  img.src = s.icon;
  img.alt = s.name || '';
  favicon.appendChild(img);
} else if(s.icon && s.icon.match(/fa[-\w ]+|mdi[-\w ]+/)){ // classe de fonte (ex: "fa-brands fa-github")
  const i = document.createElement('i');
  i.className = s.icon;
  favicon.appendChild(i);
} else {
  // emoji ou texto curto (fallback: primeiras 2 letras)
  favicon.textContent = s.icon || (s.name ? s.name.slice(0,2).toUpperCase() : '??');
}