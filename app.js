let tasks = [];
let filterStatus = ""; // all/completed/uncompleted
let filterPriority = "";
let filterCategory = "";

function loadTasks() {
  const data = localStorage.getItem('todolist');
  if (data) tasks = JSON.parse(data);
}
loadTasks();

function saveTasks() {
  localStorage.setItem('todolist', JSON.stringify(tasks));
}

function render() {
  const list = document.getElementById('task-list');
  list.innerHTML = '';

  // Filtering
  let currentTasks = [...tasks];
  if (filterStatus === "completed") currentTasks = currentTasks.filter(t => t.completed);
  if (filterStatus === "uncompleted") currentTasks = currentTasks.filter(t => !t.completed);
  if (filterPriority) currentTasks = currentTasks.filter(t => t.priority === filterPriority);
  if (filterCategory) currentTasks = currentTasks.filter(t => t.category === filterCategory);

  currentTasks.forEach(task => {
    const div = document.createElement('div');
    div.className = `task ${task.completed ? 'completed' : ''}`;
    div.draggable = true;
    div.dataset.id = task.id;

    // Show task details
    div.innerHTML = `
      <input type="checkbox" ${task.completed ? 'checked' : ''}>
      <span class="task-text">${task.text}</span>
      <span class="edit" title="Edit">&#9998;</span>
      <span class="delete" title="Delete">×</span>
      <div class="task-details">
        <span>Priority: ${task.priority}</span>
        <span>Category: ${task.category}</span>
        <span>Created: ${new Date(task.createdAt).toLocaleString()}</span>
      </div>
    `;

    // Mark completed
    div.querySelector('input[type="checkbox"]').addEventListener('change', () => {
      task.completed = !task.completed;
      saveTasks();
      render();
    });

    // Delete
    div.querySelector('.delete').addEventListener('click', () => {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
      render();
    });

    // Edit
    div.querySelector('.edit').addEventListener('click', () => {
      editTask(div, task);
    });

    list.appendChild(div);
  });
}

// Add task
const taskInput = document.getElementById('task-input');
const priorityInput = document.getElementById('priority-input');
const categoryInput = document.getElementById('category-input');
taskInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter' && this.value.trim() !== '') {
    tasks.push({
      id: Date.now().toString(),
      text: this.value.trim(),
      completed: false,
      priority: priorityInput.value,
      category: categoryInput.value,
      createdAt: new Date().toISOString()
    });
    this.value = '';
    saveTasks();
    render();
  }
});

// Filtering
document.getElementById('filter-status').addEventListener('click', function() {
  filterStatus = "";
  render();
});
document.getElementById('filter-completed').addEventListener('click', function() {
  filterStatus = "completed";
  render();
});
document.getElementById('filter-uncompleted').addEventListener('click', function() {
  filterStatus = "uncompleted";
  render();
});
document.getElementById('filter-priority').addEventListener('change', function() {
  filterPriority = this.value;
  render();
});
document.getElementById('filter-category').addEventListener('change', function() {
  filterCategory = this.value;
  render();
});

// Drag & Drop
document.getElementById('task-list').addEventListener('dragstart', e => {
  const task = e.target.closest('.task');
  if (task) {
    task.classList.add('dragging');
    e.dataTransfer.setData('text/plain', '');
  }
});

document.getElementById('task-list').addEventListener('dragover', e => {
  e.preventDefault();
});

document.getElementById('task-list').addEventListener('drop', e => {
  e.preventDefault();
  const dragging = document.querySelector('.dragging');
  if (!dragging) return;

  const afterElement = getDragAfterElement(document.getElementById('task-list'), e.clientY);
  const list = document.getElementById('task-list');
  if (afterElement == null) {
    list.appendChild(dragging);
  } else {
    list.insertBefore(dragging, afterElement);
  }
  dragging.classList.remove('dragging');
  // Update tasks array
  tasks = Array.from(list.children).map(el =>
    tasks.find(t => t.id === el.dataset.id)
  );
  saveTasks();
});

function getDragAfterElement(container, y) {
  const items = [...container.querySelectorAll('.task:not(.dragging)')];
  return items.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    }
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Edit task inline
function editTask(div, task) {
  div.classList.add('task-editing');
  div.innerHTML = `
    <input type="text" value="${task.text}">
    <select>
      <option value="high" ${task.priority === "high" ? "selected" : ""}>High</option>
      <option value="medium" ${task.priority === "medium" ? "selected" : ""}>Medium</option>
      <option value="low" ${task.priority === "low" ? "selected" : ""}>Low</option>
    </select>
    <select>
      <option value="Work" ${task.category === "Work" ? "selected" : ""}>Work</option>
      <option value="Home" ${task.category === "Home" ? "selected" : ""}>Home</option>
      <option value="Personal" ${task.category === "Personal" ? "selected" : ""}>Personal</option>
    </select>
    <button class="save-edit">Save</button>
    <button class="cancel-edit">Cancel</button>
  `;
  div.querySelector('.save-edit').addEventListener('click', () => {
    const [textInput, prioritySelect, categorySelect] = div.querySelectorAll('input,select');
    task.text = textInput.value.trim() || task.text;
    task.priority = prioritySelect.value;
    task.category = categorySelect.value;
    saveTasks();
    render();
  });
  div.querySelector('.cancel-edit').addEventListener('click', render);
}

// Initial render
render();
  