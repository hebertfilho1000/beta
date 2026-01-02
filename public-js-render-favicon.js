const favicon = document.createElement('div');
favicon.className = 'favicon';
if(s.color) favicon.style.backgroundColor = s.color;
favicon.innerHTML = '';
if(s.icon && (s.icon.startsWith('http') || s.icon.startsWith('data:'))){
  const img = document.createElement('img'); img.src = s.icon; img.alt = s.name||''; favicon.appendChild(img);
} else if(s.icon && s.icon.match(/fa[-\w ]+|mdi[-\w ]+/)){
  const i = document.createElement('i'); i.className = s.icon; favicon.appendChild(i);
} else {
  favicon.textContent = s.icon || (s.name ? s.name.slice(0,2).toUpperCase() : '??');
}