
var tasks = JSON.parse(localStorage.getItem('mp_tasks') || '[]');
var selectedIds = [];
var editingId = null;
var activeFilter = 'visi';
var activePriorityFilter = 'visi';

function save() {
  localStorage.setItem('mp_tasks', JSON.stringify(tasks));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function showScreen(id) {
  var screens = document.querySelectorAll('.screen');
  for (var i = 0; i < screens.length; i++) {
    screens[i].classList.remove('active');
  }
  document.getElementById(id).classList.add('active');
}

function openProgress() {
  showScreen('screen-progress');
}

function openNew() {
  clearNewForm();
  showScreen('screen-new');
}

function openEdit(id) {
  var task = tasks.find(t => t.id === id);
  if (!task) return;

  editingId = id;

  document.getElementById('edit-title').value = task.title || '';
  document.getElementById('edit-start-date').value = task.startDate || '';
  document.getElementById('edit-start-time').value = task.startTime || '';
  document.getElementById('edit-end-date').value = task.endDate || '';
  document.getElementById('edit-end-time').value = task.endTime || '';
  document.getElementById('edit-priority').value = task.priority || 'videja';
  document.getElementById('edit-notes').value = task.notes || '';

  showScreen('screen-edit');
}

function showToast(msg) {
  var t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function () {
    t.classList.remove('show');
  }, 2000);
}

function priorityFlag(p) {
  if (p === 'augsta') return { emoji: '🚩', color: '#E53935' };
  if (p === 'videja') return { emoji: '🏴', color: '#FF9800' };
  return { emoji: '🏳', color: '#4CAF50' };
}

function formatDate(d) {
  if (!d) return '';
  var parts = d.split('-');
  return parts[2] + '.' + parts[1] + '.' + parts[0];
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function getFiltered() {
  var result = tasks.slice();

  if (activeFilter === 'nepabeigtie') result = result.filter(t => !t.done);
  if (activeFilter === 'pabeigtie') result = result.filter(t => t.done);
  if (activeFilter === 'augsta') result = result.filter(t => t.priority === 'augsta');
  if (activeFilter === 'videja') result = result.filter(t => t.priority === 'videja');
  if (activeFilter === 'zema') result = result.filter(t => t.priority === 'zema');

  if (activePriorityFilter !== 'visi') {
    result = result.filter(t => t.priority === activePriorityFilter);
  }

  return result;
}

function applyFilter(el) {
  var items = document.querySelectorAll('.filter-item');
  for (var i = 0; i < items.length; i++) items[i].classList.remove('active-filter');
  el.classList.add('active-filter');

  activeFilter = el.getAttribute('data-filter');
  showScreen('screen-list');
  renderTasks();
}

function onPriorityChange(val) {
  activePriorityFilter = val;
  renderTasks();
}

function renderTasks() {
  var list = document.getElementById('task-list');
  var filtered = getFiltered();

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state"><span class="emoji">📚</span>Nav mājasdarbu.<br>Nospied <b>+</b>, lai pievienotu!</div>';
    return;
  }

  var html = '';

  for (var i = 0; i < filtered.length; i++) {
    var task = filtered[i];
    var flag = priorityFlag(task.priority);
    var isSel = selectedIds.indexOf(task.id) >= 0;

    var dt = '';
    if (task.startDate) {
      dt = formatDate(task.startDate);
      if (task.startTime && task.endTime) dt += ' ' + task.startTime + '–' + task.endTime;
      else if (task.startTime) dt += ' ' + task.startTime;
    }

    html += '<div class="task-card ' + (isSel ? 'selected' : '') + ' ' + (task.done ? 'done' : '') + '" data-id="' + task.id + '">';
    html += '<div class="task-checkbox" onclick="checkClick(event,\'' + task.id + '\')">' + (isSel ? '✔' : '') + '</div>';
    html += '<div class="task-body" onclick="cardClick(event,\'' + task.id + '\')">';
    html += '<div class="task-name">' + escHtml(task.title) + '</div>';
    if (dt) html += '<div class="task-datetime">' + dt + '</div>';
    html += '</div>';
    html += '<div class="priority-flag" style="color:' + flag.color + '">' + flag.emoji + '</div>';
    html += '</div>';
  }

  list.innerHTML = html;
}

function cardClick(e, id) {
  openEdit(id);
}

function checkClick(e, id) {
  e.stopPropagation();

  var i = selectedIds.indexOf(id);
  if (i >= 0) selectedIds.splice(i, 1);
  else selectedIds.push(id);

  renderTasks();
}

function deleteSelected() {
  tasks = tasks.filter(t => selectedIds.indexOf(t.id) === -1);
  selectedIds = [];
  save();
  renderTasks();
  showToast('Uzdevumi dzēsti');
}

function markDone() {
  tasks.forEach(t => {
    if (selectedIds.indexOf(t.id) >= 0) t.done = true;
  });
  selectedIds = [];
  save();
  renderTasks();
  showToast('Atzīmēts kā pabeigts');
}

function clearSelection() {
  selectedIds = [];
  renderTasks();
}

function confirmNew() {
  var title = document.getElementById('new-title').value;
  if (!title) return showToast('Ievadi nosaukumu');

  var task = {
    id: uid(),
    title: title,
    startDate: document.getElementById('new-start-date').value,
    startTime: document.getElementById('new-start-time').value,
    endDate: document.getElementById('new-end-date').value,
    endTime: document.getElementById('new-end-time').value,
    priority: document.getElementById('new-priority').value,
    notes: document.getElementById('new-notes').value,
    done: false
  };

  tasks.push(task);
  save();
  renderTasks();
  showScreen('screen-list');
  showToast('Pievienots');
}

function confirmEdit() {
  var task = tasks.find(t => t.id === editingId);
  if (!task) return;

  task.title = document.getElementById('edit-title').value;
  task.startDate = document.getElementById('edit-start-date').value;
  task.startTime = document.getElementById('edit-start-time').value;
  task.endDate = document.getElementById('edit-end-date').value;
  task.endTime = document.getElementById('edit-end-time').value;
  task.priority = document.getElementById('edit-priority').value;
  task.notes = document.getElementById('edit-notes').value;

  save();
  renderTasks();
  showScreen('screen-list');
  showToast('Saglabāts');
}

function clearNewForm() {
  document.getElementById('new-title').value = '';
  document.getElementById('new-start-date').value = '';
  document.getElementById('new-start-time').value = '';
  document.getElementById('new-end-date').value = '';
  document.getElementById('new-end-time').value = '';
  document.getElementById('new-notes').value = '';
}

renderTasks();
