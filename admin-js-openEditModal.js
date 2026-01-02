if(index === null){
  inputName.value = '';
  inputUrl.value = '';
  inputIcon.value = '';
  inputColor.value = '#0b1220';
  deleteBtn.style.display = 'none';
  selectGroup.value = editingGroupId;
} else {
  const s = g && g.items && g.items[index];
  inputName.value = s ? s.name : '';
  inputUrl.value = s ? s.url : '';
  inputIcon.value = s ? (s.icon || '') : '';
  inputColor.value = s ? (s.color || '#0b1220') : '#0b1220';
  deleteBtn.style.display = 'inline-block';
  selectGroup.value = editingGroupId;
}