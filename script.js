const STORAGE_KEY = "taskflow-tasks-v1";

const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
let tasks = loadTasks();
let currentFilter = "all";
// Load tasks from Local Storage
function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    if (!Array.isArray(saved)) return [];

    return saved.filter(
      (task) =>
        task &&
        typeof task.id === "string" &&
        typeof task.text === "string" &&
        typeof task.completed === "boolean",
    );
  } catch {
    return [];
  }
}

// Save tasks to Local Storage
function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    alert("Unable to save tasks in browser storage.");
  }
}

// Add a new task
function addTask(text) {
  const id = globalThis.crypto?.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

  tasks.unshift({
    id,
    text,
    completed: false,
  });

  saveTasks();
  renderTasks();
}

// Edit an existing task
function editTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;

  const updatedText = prompt("Edit your task:", task.text);

  if (updatedText === null) return;

  const cleanText = updatedText.trim();

  if (!cleanText) {
    alert("Task cannot be empty.");
    return;
  }

  task.text = cleanText.slice(0, 180);

  saveTasks();
  renderTasks();
}

// Delete a task
function deleteTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;

  if (!confirm(`Delete "${task.text}"?`)) return;

  tasks = tasks.filter((item) => item.id !== id);

  saveTasks();
  renderTasks();
}

// Mark a task complete or incomplete
function toggleTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;

  task.completed = !task.completed;

  saveTasks();
  renderTasks();
}

// Create an action button
function createButton(label, className, callback) {
  const button = document.createElement("button");

  button.type = "button";
  button.textContent = label;
  button.className = className;
  button.addEventListener("click", callback);

  return button;
}

// Display tasks
function renderTasks() {
  taskList.replaceChildren();

  const visibleTasks = tasks.filter((task) => {
    if (currentFilter === "active") {
      return !task.completed;
    }

    if (currentFilter === "completed") {
      return task.completed;
    }

    return true;
  });

  visibleTasks.forEach((task) => {
    const row = document.createElement("div");
    row.className = "task";

    if (task.completed) {
      row.classList.add("completed");
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Toggle completion for ${task.text}`);

    checkbox.addEventListener("change", () => {
      toggleTask(task.id);
    });

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const editButton = createButton("Edit", "edit-btn", () =>
      editTask(task.id),
    );

    const deleteButton = createButton("Delete", "delete-btn", () =>
      deleteTask(task.id),
    );

    row.append(checkbox, text, editButton, deleteButton);

    taskList.appendChild(row);
  });

  // Update task statistics
  const completedCount = tasks.filter((task) => task.completed).length;

  document.getElementById("total-count").textContent = tasks.length;

  document.getElementById("active-count").textContent =
    tasks.length - completedCount;

  document.getElementById("done-count").textContent = completedCount;

  // Empty state message
  emptyState.hidden = visibleTasks.length > 0;

  if (visibleTasks.length === 0) {
    if (tasks.length === 0) {
      emptyState.textContent = "You're all caught up! Add a task to begin.";
    } else if (currentFilter === "active") {
      emptyState.textContent = "No tasks left to do.";
    } else if (currentFilter === "completed") {
      emptyState.textContent = "No completed tasks yet.";
    } else {
      emptyState.textContent = "No tasks found.";
    }
  }

  // Update active filter
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === currentFilter);
  });

  // Disable clear button when nothing is completed
  const clearButton = document.getElementById("clear-completed");

  clearButton.disabled = completedCount === 0;
}

// Handle add-task form
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = input.value.trim();

  if (!text) return;

  addTask(text.slice(0, 180));

  form.reset();
  input.focus();
});

// Filter tasks
document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    renderTasks();
  });
});

// Clear completed tasks
document.getElementById("clear-completed").addEventListener("click", () => {
  const hasCompleted = tasks.some((task) => task.completed);

  if (!hasCompleted) return;

  if (!confirm("Clear all completed tasks?")) return;

  tasks = tasks.filter((task) => !task.completed);

  saveTasks();
  renderTasks();
});

// Initial render
renderTasks();
