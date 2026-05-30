const STORAGE_KEY = "personalTaskManager.tasks";
const CATEGORY_STORAGE_KEY = "personalTaskManager.categories";
const PRIORITY_STORAGE_KEY = "personalTaskManager.priorities";
const SYNC_SESSION_KEY = "personalTaskManager.syncSession";
const SYNC_DEBOUNCE_MS = 600;

const DEFAULT_CATEGORIES = [
  { id: "assignment", label: "課題", color: "#167255" },
  { id: "job", label: "就活", color: "#4c58b8" },
  { id: "daily", label: "日常生活系", color: "#9a5a16" }
];

const DEFAULT_PRIORITIES = [
  { id: "high", label: "高", color: "#e25555" },
  { id: "medium", label: "中", color: "#d89a19" },
  { id: "low", label: "低", color: "#2f9e77" }
];

const OPTION_COLORS = [
  "#e25555",
  "#d89a19",
  "#2f9e77",
  "#4c58b8",
  "#9a5a16",
  "#7b4bb7",
  "#2f7df6",
  "#657087"
];

const taskForm = document.getElementById("taskForm");
const taskTitleInput = document.getElementById("taskTitle");
const taskMemoInput = document.getElementById("taskMemo");
const taskCategorySelect = document.getElementById("taskCategory");
const taskPrioritySelect = document.getElementById("taskPriority");
const taskDeadlineInput = document.getElementById("taskDeadline");
const taskEstimateInput = document.getElementById("taskEstimate");
const taskList = document.getElementById("taskList");
const emptyMessage = document.getElementById("emptyMessage");
const filterButtons = document.querySelectorAll(".filter-button");
const categoryFilterToggle = document.getElementById("categoryFilterToggle");
const categoryFilterMenu = document.getElementById("categoryFilterMenu");
const categoryFilterSearch = document.getElementById("categoryFilterSearch");
const categoryFilterList = document.getElementById("categoryFilterList");
const currentFilterLabel = document.getElementById("currentFilterLabel");
const totalCount = document.getElementById("totalCount");
const activeCount = document.getElementById("activeCount");
const completedCount = document.getElementById("completedCount");
const prevMonthButton = document.getElementById("prevMonthButton");
const nextMonthButton = document.getElementById("nextMonthButton");
const calendarMonthLabel = document.getElementById("calendarMonthLabel");
const calendarGrid = document.getElementById("calendarGrid");
const calendarTaskModal = document.getElementById("calendarTaskModal");
const calendarTaskModalTitle = document.getElementById("calendarTaskModalTitle");
const closeCalendarTaskModalButton = document.getElementById("closeCalendarTaskModalButton");
const calendarTaskList = document.getElementById("calendarTaskList");
const calendarTaskEmptyMessage = document.getElementById("calendarTaskEmptyMessage");
const memoModal = document.getElementById("memoModal");
const memoModalTitle = document.getElementById("memoModalTitle");
const closeMemoModalButton = document.getElementById("closeMemoModalButton");
const taskEditTitleInput = document.getElementById("taskEditTitle");
const memoEditInput = document.getElementById("memoEditInput");
const taskEditCategorySelect = document.getElementById("taskEditCategory");
const taskEditPrioritySelect = document.getElementById("taskEditPriority");
const taskEditEstimateInput = document.getElementById("taskEditEstimate");
const taskEditDeadlineInput = document.getElementById("taskEditDeadline");
const saveMemoButton = document.getElementById("saveMemoButton");
const editCategoryButton = document.getElementById("editCategoryButton");
const editPriorityButton = document.getElementById("editPriorityButton");
const optionModal = document.getElementById("optionModal");
const optionModalTitle = document.getElementById("optionModalTitle");
const closeOptionModalButton = document.getElementById("closeOptionModalButton");
const optionNewLabelInput = document.getElementById("optionNewLabelInput");
const optionNewColorInput = document.getElementById("optionNewColorInput");
const addOptionButton = document.getElementById("addOptionButton");
const editableOptionList = document.getElementById("editableOptionList");
const syncForm = document.getElementById("syncForm");
const syncToggleButton = document.getElementById("syncToggleButton");
const syncAccountPanel = document.getElementById("syncAccountPanel");
const syncAccountIdInput = document.getElementById("syncAccountId");
const syncPasswordInput = document.getElementById("syncPassword");
const syncStatus = document.getElementById("syncStatus");
const syncLoginButton = document.getElementById("syncLoginButton");
const syncCreateButton = document.getElementById("syncCreateButton");
const syncNowButton = document.getElementById("syncNowButton");
const syncLogoutButton = document.getElementById("syncLogoutButton");

let categories = loadOptions(CATEGORY_STORAGE_KEY, DEFAULT_CATEGORIES);
let priorities = loadOptions(PRIORITY_STORAGE_KEY, DEFAULT_PRIORITIES);
let tasks = loadTasks();
let currentFilter = "all";
let currentCategoryFilters = [];
let editingOptionType = "category";
let calendarDate = new Date();
let editingMemoTaskId = "";
let syncSession = loadSyncSession();
let syncTimer = 0;
let isApplyingRemoteData = false;

renderOptions();
renderTasks();
renderCalendar();
updateSyncUi();

if (syncSession.accountId && syncSession.password) {
  loginSyncAccount();
}

taskForm.addEventListener("submit", function (event) {
  event.preventDefault();
  addTask();
});

syncForm.addEventListener("submit", function (event) {
  event.preventDefault();
  loginSyncAccount();
});

syncToggleButton.addEventListener("click", function () {
  toggleSyncPanel(syncAccountPanel.classList.contains("hidden"));
});

syncCreateButton.addEventListener("click", function () {
  createSyncAccount();
});

syncNowButton.addEventListener("click", function () {
  syncNow();
});

syncLogoutButton.addEventListener("click", function () {
  logoutSyncAccount();
});

editCategoryButton.addEventListener("click", function () {
  openOptionModal("category");
});

editPriorityButton.addEventListener("click", function () {
  openOptionModal("priority");
});

addOptionButton.addEventListener("click", function () {
  addOption(editingOptionType, optionNewLabelInput.value, optionNewColorInput.value);
  optionNewLabelInput.value = "";
  renderOptionEditor();
  optionNewLabelInput.focus();
});

optionNewLabelInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    addOption(editingOptionType, optionNewLabelInput.value, optionNewColorInput.value);
    optionNewLabelInput.value = "";
    renderOptionEditor();
  }
});

editableOptionList.addEventListener("input", function (event) {
  const optionItem = event.target.closest(".editable-option-item");

  if (!optionItem) {
    return;
  }

  if (event.target.classList.contains("option-label-input")) {
    updateOptionLabel(editingOptionType, optionItem.dataset.optionId, event.target.value);
  }

  if (event.target.classList.contains("option-color-input")) {
    updateOptionColor(editingOptionType, optionItem.dataset.optionId, event.target.value);
  }
});

editableOptionList.addEventListener("click", function (event) {
  const deleteButton = event.target.closest(".option-delete-button");

  if (!deleteButton) {
    return;
  }

  deleteOption(editingOptionType, deleteButton.dataset.optionId);
  renderOptionEditor();
});

closeOptionModalButton.addEventListener("click", closeOptionModal);
closeCalendarTaskModalButton.addEventListener("click", closeCalendarTaskModal);
closeMemoModalButton.addEventListener("click", closeMemoModal);
saveMemoButton.addEventListener("click", saveTaskChanges);

optionModal.addEventListener("click", function (event) {
  if (event.target === optionModal) {
    closeOptionModal();
  }
});

calendarTaskModal.addEventListener("click", function (event) {
  if (event.target === calendarTaskModal) {
    closeCalendarTaskModal();
  }
});

memoModal.addEventListener("click", function (event) {
  if (event.target === memoModal) {
    closeMemoModal();
  }
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && !optionModal.classList.contains("hidden")) {
    closeOptionModal();
  }

  if (event.key === "Escape" && !calendarTaskModal.classList.contains("hidden")) {
    closeCalendarTaskModal();
  }

  if (event.key === "Escape" && !memoModal.classList.contains("hidden")) {
    closeMemoModal();
  }
});

filterButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    currentFilter = button.dataset.filter;
    updateFilterButtons();
    renderTasks();
    renderCalendar();
  });
});

prevMonthButton.addEventListener("click", function () {
  calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
  renderCalendar();
});

nextMonthButton.addEventListener("click", function () {
  calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
  renderCalendar();
});

calendarGrid.addEventListener("click", function (event) {
  const dayCell = event.target.closest(".calendar-day[data-date]");

  if (dayCell) {
    openCalendarTaskModal(dayCell.dataset.date);
  }
});

calendarGrid.addEventListener("keydown", function (event) {
  const dayCell = event.target.closest(".calendar-day[data-date]");

  if (!dayCell || (event.key !== "Enter" && event.key !== " ")) {
    return;
  }

  event.preventDefault();
  openCalendarTaskModal(dayCell.dataset.date);
});

categoryFilterToggle.addEventListener("click", function () {
  const willOpen = categoryFilterMenu.classList.contains("hidden");

  categoryFilterMenu.classList.toggle("hidden", !willOpen);
  categoryFilterToggle.setAttribute("aria-expanded", String(willOpen));

  if (willOpen) {
    categoryFilterSearch.value = "";
    renderCategoryFilterOptions();
    categoryFilterSearch.focus();
  }
});

categoryFilterSearch.addEventListener("input", renderCategoryFilterOptions);

categoryFilterList.addEventListener("click", function (event) {
  const optionButton = event.target.closest(".category-filter-option");

  if (!optionButton) {
    return;
  }

  toggleCategoryFilter(optionButton.dataset.categoryFilter);
  renderCategoryFilterOptions();
  updateCategoryFilterButton();
  renderTasks();
  renderCalendar();
});

document.addEventListener("click", function (event) {
  if (!event.target.closest(".category-combobox")) {
    closeCategoryFilterMenu();
  }
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && !categoryFilterMenu.classList.contains("hidden")) {
    closeCategoryFilterMenu();
    categoryFilterToggle.focus();
  }
});

function loadOptions(storageKey, defaults) {
  const savedOptions = localStorage.getItem(storageKey);

  if (!savedOptions) {
    return normalizeOptions(defaults, defaults);
  }

  try {
    const parsedOptions = JSON.parse(savedOptions);

    return normalizeOptions(parsedOptions, defaults);
  } catch (error) {
    console.error("選択肢を読み込めませんでした。", error);
    return normalizeOptions(defaults, defaults);
  }
}

function normalizeOptions(options, defaults) {
  if (!Array.isArray(options)) {
    return normalizeOptions(defaults, defaults);
  }

  const normalizedOptions = options
    .filter(function (option) {
      return option && option.id && option.label;
    })
    .map(function (option, index) {
      return {
        ...option,
        color: option.color || defaults[index]?.color || OPTION_COLORS[index % OPTION_COLORS.length]
      };
    });

  return normalizedOptions.length > 0 ? normalizedOptions : defaults;
}

function saveCategories() {
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
  queueSync();
}

function savePriorities() {
  localStorage.setItem(PRIORITY_STORAGE_KEY, JSON.stringify(priorities));
  queueSync();
}

function saveOptions(type) {
  if (type === "category") {
    saveCategories();
  }

  if (type === "priority") {
    savePriorities();
  }
}

function loadTasks() {
  const savedTasks = localStorage.getItem(STORAGE_KEY);

  if (!savedTasks) {
    return [];
  }

  try {
    const parsedTasks = JSON.parse(savedTasks);
    return normalizeTasks(parsedTasks);
  } catch (error) {
    console.error("保存済みタスクを読み込めませんでした。", error);
    return [];
  }
}

function normalizeTasks(taskList) {
  if (!Array.isArray(taskList)) {
    return [];
  }

  return taskList
    .filter(function (task) {
      return task && task.id && task.title;
    })
    .map(function (task) {
      return {
        ...task,
        createdAt: task.createdAt || getTodayText(),
        category: task.category || getFallbackOptionId(categories),
        priority: task.priority || getFallbackOptionId(priorities),
        memo: task.memo || "",
        estimatedHours: normalizeEstimatedHours(
          task.estimatedHours ?? convertEstimatedMinutesToHours(task.estimatedMinutes)
        )
      };
    });
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  queueSync();
}

function loadSyncSession() {
  try {
    const savedSession = sessionStorage.getItem(SYNC_SESSION_KEY);

    return savedSession ? JSON.parse(savedSession) : { accountId: "", password: "" };
  } catch (error) {
    return { accountId: "", password: "" };
  }
}

function saveSyncSession() {
  if (!syncSession.accountId || !syncSession.password) {
    sessionStorage.removeItem(SYNC_SESSION_KEY);
    return;
  }

  sessionStorage.setItem(SYNC_SESSION_KEY, JSON.stringify(syncSession));
}

function updateSyncUi(message) {
  const isConnected = Boolean(syncSession.accountId && syncSession.password);

  syncAccountIdInput.value = syncSession.accountId || syncAccountIdInput.value;
  syncPasswordInput.value = syncSession.password || syncPasswordInput.value;
  syncNowButton.disabled = !isConnected;
  syncLogoutButton.classList.toggle("hidden", !isConnected);
  syncLoginButton.textContent = isConnected ? "再ログイン" : "ログイン";
  syncCreateButton.disabled = isConnected;
  syncStatus.textContent = message || (isConnected ? `接続中: ${syncSession.accountId}` : "未接続");
}

function toggleSyncPanel(shouldOpen) {
  syncAccountPanel.classList.toggle("hidden", !shouldOpen);
  syncToggleButton.setAttribute("aria-expanded", String(shouldOpen));

  if (shouldOpen) {
    syncAccountIdInput.focus();
  }
}

async function createSyncAccount() {
  const credentials = getSyncCredentials();

  if (!credentials) {
    return;
  }

  syncSession = credentials;
  saveSyncSession();
  updateSyncUi("作成中...");

  try {
    await requestSyncApi("/api/sync/create", {
      accountId: credentials.accountId,
      password: credentials.password,
      data: getSyncData()
    });

    updateSyncUi("作成して同期しました");
  } catch (error) {
    syncSession = { accountId: "", password: "" };
    saveSyncSession();
    updateSyncUi(error.message);
  }
}

async function loginSyncAccount() {
  const credentials = getSyncCredentials();

  if (!credentials) {
    return;
  }

  const localData = getSyncData();
  syncSession = credentials;
  saveSyncSession();
  updateSyncUi("ログイン中...");

  try {
    const response = await requestSyncApi("/api/sync/login", {
      accountId: credentials.accountId,
      password: credentials.password
    });
    const mergedData = mergeSyncData(response.data, localData);

    applyRemoteData(mergedData);
    await syncNow();
    updateSyncUi("ログインして同期しました");
  } catch (error) {
    syncSession = { accountId: "", password: "" };
    saveSyncSession();
    updateSyncUi(error.message);
  }
}

function getSyncCredentials() {
  const accountId = syncAccountIdInput.value.trim();
  const password = syncPasswordInput.value;

  if (!isValidAccountId(accountId)) {
    updateSyncUi("IDは3〜40文字の英数字・_・-で入力してください");
    syncAccountIdInput.focus();
    return null;
  }

  if (password.length < 12) {
    updateSyncUi("パスワードは12桁以上にしてください");
    syncPasswordInput.focus();
    return null;
  }

  return { accountId: accountId, password: password };
}

function logoutSyncAccount() {
  syncSession = { accountId: "", password: "" };
  clearTimeout(syncTimer);
  saveSyncSession();
  updateSyncUi("同期を解除しました");
}

function queueSync() {
  if (isApplyingRemoteData || !syncSession.accountId || !syncSession.password) {
    return;
  }

  clearTimeout(syncTimer);
  syncTimer = setTimeout(function () {
    syncNow();
  }, SYNC_DEBOUNCE_MS);
}

async function syncNow() {
  if (!syncSession.accountId || !syncSession.password) {
    return;
  }

  updateSyncUi("同期中...");

  try {
    await requestSyncApi("/api/sync/save", {
      accountId: syncSession.accountId,
      password: syncSession.password,
      data: getSyncData()
    });
    updateSyncUi("同期しました");
  } catch (error) {
    updateSyncUi(error.message);
  }
}

async function requestSyncApi(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json().catch(function () {
    return { error: "同期サーバーから不正な応答が返りました" };
  });

  if (!response.ok) {
    throw new Error(result.error || "同期に失敗しました");
  }

  return result;
}

function getSyncData() {
  return {
    tasks: tasks,
    categories: categories,
    priorities: priorities
  };
}

function mergeSyncData(remoteData, localData) {
  return {
    tasks: mergeById(normalizeTasks(remoteData?.tasks), normalizeTasks(localData?.tasks)),
    categories: mergeById(
      normalizeOptions(remoteData?.categories, DEFAULT_CATEGORIES),
      normalizeOptions(localData?.categories, DEFAULT_CATEGORIES)
    ),
    priorities: mergeById(
      normalizeOptions(remoteData?.priorities, DEFAULT_PRIORITIES),
      normalizeOptions(localData?.priorities, DEFAULT_PRIORITIES)
    )
  };
}

function mergeById(remoteItems, localItems) {
  const mergedItems = new Map();

  remoteItems.forEach(function (item) {
    mergedItems.set(item.id, item);
  });

  localItems.forEach(function (item) {
    mergedItems.set(item.id, item);
  });

  return Array.from(mergedItems.values());
}

function applyRemoteData(data) {
  isApplyingRemoteData = true;
  categories = normalizeOptions(data?.categories, DEFAULT_CATEGORIES);
  priorities = normalizeOptions(data?.priorities, DEFAULT_PRIORITIES);
  tasks = normalizeTasks(data?.tasks);
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
  localStorage.setItem(PRIORITY_STORAGE_KEY, JSON.stringify(priorities));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  renderOptions();
  renderTasks();
  renderCalendar();
  isApplyingRemoteData = false;
}

function isValidAccountId(accountId) {
  return /^[A-Za-z0-9_-]{3,40}$/.test(accountId);
}

function addTask() {
  const title = taskTitleInput.value.trim();
  const memo = taskMemoInput.value.trim();
  const estimatedHours = normalizeEstimatedHours(taskEstimateInput.value);

  if (!title || categories.length === 0 || priorities.length === 0) {
    return;
  }

  const newTask = {
    id: generateTaskId(),
    title: title,
    memo: memo,
    createdAt: getTodayText(),
    category: taskCategorySelect.value,
    priority: taskPrioritySelect.value,
    deadline: taskDeadlineInput.value,
    estimatedHours: estimatedHours,
    completed: false
  };

  tasks.unshift(newTask);
  saveTasks();
  taskForm.reset();
  selectFallbackOptions();
  taskTitleInput.focus();
  renderTasks();
}

function addOption(type, rawLabel, color) {
  const label = rawLabel.trim();

  if (!label) {
    return;
  }

  getOptionList(type).push({
    id: generateOptionId(type),
    label: label,
    color: color || getNextOptionColor(type)
  });

  saveOptions(type);
  renderOptions();
  renderTasks();
  renderCalendar();
}

function updateOptionLabel(type, optionId, rawLabel) {
  const option = getOptionById(type, optionId);

  if (!option) {
    return;
  }

  option.label = rawLabel.trim() || option.label;
  saveOptions(type);
  renderOptions();
  renderTasks();
  renderCalendar();
}

function updateOptionColor(type, optionId, color) {
  const option = getOptionById(type, optionId);

  if (!option) {
    return;
  }

  option.color = color;
  saveOptions(type);
  renderOptions();
  renderTasks();
  renderCalendar();
}

function deleteOption(type, optionId) {
  if (!optionId) {
    return;
  }

  if (type === "category") {
    categories = categories.filter(function (category) {
      return category.id !== optionId;
    });

    const fallbackCategory = getFallbackOptionId(categories);
    tasks = tasks.map(function (task) {
      return task.category === optionId ? { ...task, category: fallbackCategory } : task;
    });

    currentCategoryFilters = currentCategoryFilters.filter(function (categoryId) {
      return categoryId !== optionId;
    });

    saveCategories();
  }

  if (type === "priority") {
    priorities = priorities.filter(function (priority) {
      return priority.id !== optionId;
    });

    const fallbackPriority = getFallbackOptionId(priorities);
    tasks = tasks.map(function (task) {
      return task.priority === optionId ? { ...task, priority: fallbackPriority } : task;
    });

    savePriorities();
  }

  saveTasks();
  renderOptions();
  renderTasks();
  renderCalendar();
}

function renderOptions() {
  renderSelectOptions(taskCategorySelect, categories);
  renderSelectOptions(taskPrioritySelect, priorities);
  renderSelectOptions(taskEditCategorySelect, categories);
  renderSelectOptions(taskEditPrioritySelect, priorities);
  renderCategoryFilterOptions();
  updateCategoryFilterButton();
  selectFallbackOptions();
  updateAddButtonState();
}

function renderSelectOptions(selectElement, options) {
  const selectedValue = selectElement.value;
  selectElement.innerHTML = "";

  options.forEach(function (option) {
    const optionElement = document.createElement("option");
    optionElement.value = option.id;
    optionElement.textContent = option.label;
    selectElement.appendChild(optionElement);
  });

  if (options.some(function (option) { return option.id === selectedValue; })) {
    selectElement.value = selectedValue;
  }
}

function renderOptionEditor() {
  const options = getOptionList(editingOptionType);
  editableOptionList.innerHTML = "";
  optionNewColorInput.value = getNextOptionColor(editingOptionType);

  options.forEach(function (option) {
    const item = document.createElement("li");
    item.className = "editable-option-item";
    item.dataset.optionId = option.id;
    item.innerHTML = `
      <input class="option-label-input" type="text" value="">
      <input class="option-color-input color-input" type="color" value="${option.color}" aria-label="色を選択">
      <button class="option-delete-button" type="button" data-option-id="${option.id}">削除</button>
    `;

    item.querySelector(".option-label-input").value = option.label;
    editableOptionList.appendChild(item);
  });
}

function renderCategoryFilterOptions() {
  const searchText = categoryFilterSearch.value.trim().toLowerCase();
  const filterOptions = [
    { id: "all", label: "すべて", color: "" },
    ...categories
  ].filter(function (category) {
    return category.label.toLowerCase().includes(searchText);
  });

  categoryFilterList.innerHTML = "";

  if (filterOptions.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "category-filter-empty";
    emptyItem.textContent = "候補がありません";
    categoryFilterList.appendChild(emptyItem);
    return;
  }

  filterOptions.forEach(function (category) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.className = "category-filter-option";
    button.type = "button";
    button.dataset.categoryFilter = category.id;
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", String(isCategoryFilterSelected(category.id)));

    if (category.color) {
      button.style.setProperty("--category-color", category.color);
    }

    button.innerHTML = `
      <span class="category-filter-swatch"></span>
      <span class="category-filter-name"></span>
      <span class="category-filter-check">✓</span>
    `;
    button.querySelector(".category-filter-name").textContent = category.label;
    item.appendChild(button);
    categoryFilterList.appendChild(item);
  });
}

function updateAddButtonState() {
  const cannotAddTask = categories.length === 0 || priorities.length === 0;
  const submitButton = taskForm.querySelector(".primary-button");

  taskCategorySelect.disabled = categories.length === 0;
  taskPrioritySelect.disabled = priorities.length === 0;
  submitButton.disabled = cannotAddTask;
  submitButton.textContent = cannotAddTask ? "種類と優先度を追加してください" : "追加";
}

function openOptionModal(type) {
  editingOptionType = type;
  optionModalTitle.textContent = type === "category" ? "種類を編集" : "優先度を編集";
  optionNewLabelInput.value = "";
  renderOptionEditor();
  optionModal.classList.remove("hidden");
  keepPageWidthWhenModalOpens();
  document.body.classList.add("modal-open");
  optionNewLabelInput.focus();
}

function closeOptionModal() {
  optionModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
  document.body.style.paddingRight = "";
}

function closeCategoryFilterMenu() {
  categoryFilterMenu.classList.add("hidden");
  categoryFilterToggle.setAttribute("aria-expanded", "false");
}

function toggleCategoryFilter(categoryId) {
  if (categoryId === "all") {
    currentCategoryFilters = [];
    return;
  }

  if (currentCategoryFilters.includes(categoryId)) {
    currentCategoryFilters = currentCategoryFilters.filter(function (selectedCategoryId) {
      return selectedCategoryId !== categoryId;
    });
    return;
  }

  currentCategoryFilters = [...currentCategoryFilters, categoryId];
}

function isCategoryFilterSelected(categoryId) {
  if (categoryId === "all") {
    return currentCategoryFilters.length === 0;
  }

  return currentCategoryFilters.includes(categoryId);
}

function keepPageWidthWhenModalOpens() {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

  document.body.style.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : "";
}

function selectFallbackOptions() {
  if (categories.length > 0 && !taskCategorySelect.value) {
    taskCategorySelect.value = categories[0].id;
  }

  if (priorities.length > 0 && !taskPrioritySelect.value) {
    taskPrioritySelect.value = priorities[0].id;
  }
}

function getOptionList(type) {
  return type === "category" ? categories : priorities;
}

function getOptionById(type, optionId) {
  return getOptionList(type).find(function (option) {
    return option.id === optionId;
  });
}

function getFallbackOptionId(options) {
  return options[0] ? options[0].id : "";
}

function getNextOptionColor(type) {
  const options = getOptionList(type);

  return OPTION_COLORS[options.length % OPTION_COLORS.length];
}

function generateOptionId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function generateTaskId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toggleTaskCompleted(taskId) {
  tasks = tasks.map(function (task) {
    if (task.id === taskId) {
      return {
        ...task,
        completed: !task.completed
      };
    }

    return task;
  });

  saveTasks();
  renderTasks();
  renderCalendar();
}

function deleteTask(taskId) {
  tasks = tasks.filter(function (task) {
    return task.id !== taskId;
  });

  saveTasks();
  renderTasks();
  renderCalendar();
}

function renderTasks() {
  taskList.innerHTML = "";

  const visibleTasks = getVisibleTasks().sort(function (firstTask, secondTask) {
    return Number(firstTask.completed) - Number(secondTask.completed);
  });

  visibleTasks.forEach(function (task) {
    taskList.appendChild(createTaskElement(task));
  });

  emptyMessage.classList.toggle("visible", visibleTasks.length === 0);
  updateTaskCounts();
  updateFilterLabel();
}

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDate = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0);
  const startOffset = firstDate.getDay();
  const totalCells = Math.ceil((startOffset + lastDate.getDate()) / 7) * 7;
  const tasksByDate = getTasksByDate(getVisibleTasks());

  calendarMonthLabel.textContent = `${year}年${month + 1}月`;
  calendarGrid.innerHTML = "";

  for (let cellIndex = 0; cellIndex < totalCells; cellIndex += 1) {
    const dayNumber = cellIndex - startOffset + 1;
    const dayCell = document.createElement("div");
    dayCell.className = "calendar-day";

    if (dayNumber < 1 || dayNumber > lastDate.getDate()) {
      dayCell.classList.add("muted");
      calendarGrid.appendChild(dayCell);
      continue;
    }

    const dateText = formatDateValue(year, month + 1, dayNumber);
    const dayTasks = tasksByDate[dateText] || [];
    const incompleteCount = dayTasks.filter(function (task) {
      return !task.completed;
    }).length;

    if (dateText === getTodayText()) {
      dayCell.classList.add("today");
    }

    if (dayTasks.length > 0) {
      dayCell.classList.add("has-task");
    }

    dayCell.dataset.date = dateText;
    dayCell.setAttribute("role", "button");
    dayCell.tabIndex = 0;
    dayCell.setAttribute("aria-label", `${formatDateLabel(dateText)}のタスクを見る`);

    dayCell.innerHTML = `
      <span class="calendar-date-number">${dayNumber}</span>
      <div class="calendar-task-dots"></div>
      <span class="calendar-task-count"></span>
    `;

    const dots = dayCell.querySelector(".calendar-task-dots");
    dayTasks.slice(0, 3).forEach(function (task) {
      const dot = document.createElement("span");
      dot.className = "calendar-task-dot";
      dot.style.backgroundColor = getPriorityColor(task.priority);
      dots.appendChild(dot);
    });

    const count = dayCell.querySelector(".calendar-task-count");
    count.textContent = dayTasks.length > 0 ? `${incompleteCount}/${dayTasks.length}` : "";
    dayCell.title = createCalendarDayTitle(dateText, dayTasks);
    calendarGrid.appendChild(dayCell);
  }
}

function openCalendarTaskModal(dateText) {
  const dayTasks = (getTasksByDate(getVisibleTasks())[dateText] || []).sort(function (firstTask, secondTask) {
    return Number(firstTask.completed) - Number(secondTask.completed);
  });

  calendarTaskModalTitle.textContent = `${formatDateLabel(dateText)}のタスク`;
  calendarTaskList.innerHTML = "";

  dayTasks.forEach(function (task) {
    const item = document.createElement("li");
    const dateType = task.deadline === dateText ? "締切" : "開始";
    item.className = `calendar-task-item${task.completed ? " completed" : ""}`;
    item.setAttribute("role", "button");
    item.tabIndex = 0;
    item.setAttribute("aria-label", `${task.title}を編集`);
    item.style.setProperty("--priority-color", getPriorityColor(task.priority));
    item.innerHTML = `
      <div>
        <strong class="calendar-task-title"></strong>
        <p class="calendar-task-memo"></p>
        <div class="calendar-task-meta">
          <span class="badge">${dateType}</span>
          <span class="badge category-badge"></span>
          <span class="badge priority-badge">${getPriorityLabel(task.priority)}</span>
          ${createEstimateBadge(task)}
        </div>
      </div>
    `;

    item.querySelector(".calendar-task-title").textContent = task.title;
    const memoElement = item.querySelector(".calendar-task-memo");
    memoElement.textContent = task.memo || "";
    memoElement.hidden = !task.memo;

    const categoryBadge = item.querySelector(".category-badge");
    categoryBadge.textContent = getCategoryLabel(task.category);
    categoryBadge.style.backgroundColor = getSoftColor(getCategoryColor(task.category));
    categoryBadge.style.color = getCategoryColor(task.category);

    const priorityBadge = item.querySelector(".priority-badge");
    priorityBadge.style.backgroundColor = getSoftColor(getPriorityColor(task.priority));
    priorityBadge.style.color = getPriorityColor(task.priority);

    item.addEventListener("click", function () {
      closeCalendarTaskModal();
      openTaskEditModal(task.id);
    });
    item.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      closeCalendarTaskModal();
      openTaskEditModal(task.id);
    });

    calendarTaskList.appendChild(item);
  });

  calendarTaskEmptyMessage.classList.toggle("visible", dayTasks.length === 0);
  calendarTaskModal.classList.remove("hidden");
  keepPageWidthWhenModalOpens();
  document.body.classList.add("modal-open");
  closeCalendarTaskModalButton.focus();
}

function closeCalendarTaskModal() {
  calendarTaskModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
  document.body.style.paddingRight = "";
}

function openTaskEditModal(taskId) {
  const task = tasks.find(function (item) {
    return item.id === taskId;
  });

  if (!task) {
    return;
  }

  editingMemoTaskId = taskId;
  memoModalTitle.textContent = "タスクを編集";
  renderSelectOptions(taskEditCategorySelect, categories);
  renderSelectOptions(taskEditPrioritySelect, priorities);
  taskEditTitleInput.value = task.title || "";
  memoEditInput.value = task.memo || "";
  taskEditCategorySelect.value = task.category;
  taskEditPrioritySelect.value = task.priority;
  taskEditEstimateInput.value = task.estimatedHours || "";
  taskEditDeadlineInput.value = task.deadline || "";
  memoModal.classList.remove("hidden");
  keepPageWidthWhenModalOpens();
  document.body.classList.add("modal-open");
  taskEditTitleInput.focus();
}

function closeMemoModal() {
  memoModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
  document.body.style.paddingRight = "";
  editingMemoTaskId = "";
}

function saveTaskChanges() {
  const title = taskEditTitleInput.value.trim();

  if (!title) {
    taskEditTitleInput.focus();
    return;
  }

  tasks = tasks.map(function (task) {
    if (task.id === editingMemoTaskId) {
      return {
        ...task,
        title: title,
        memo: memoEditInput.value.trim(),
        category: taskEditCategorySelect.value,
        priority: taskEditPrioritySelect.value,
        estimatedHours: normalizeEstimatedHours(taskEditEstimateInput.value),
        deadline: taskEditDeadlineInput.value
      };
    }

    return task;
  });

  saveTasks();
  renderTasks();
  renderCalendar();
  closeMemoModal();
}

function getTasksByDate(taskItems = tasks) {
  return taskItems.reduce(function (groupedTasks, task) {
    const dateText = task.deadline || task.createdAt;

    if (!dateText) {
      return groupedTasks;
    }

    if (!groupedTasks[dateText]) {
      groupedTasks[dateText] = [];
    }

    groupedTasks[dateText].push(task);
    return groupedTasks;
  }, {});
}

function createCalendarDayTitle(dateText, dayTasks) {
  if (dayTasks.length === 0) {
    return `${formatDateLabel(dateText)}: タスクなし`;
  }

  const taskTitles = dayTasks.slice(0, 5).map(function (task) {
    const dateType = task.deadline ? "締切" : "開始";
    return `${dateType}: ${task.title}`;
  });

  return `${formatDateLabel(dateText)}\n${taskTitles.join("\n")}`;
}

function getVisibleTasks() {
  return tasks.filter(function (task) {
    const matchesStatus =
      currentFilter === "all" ||
      (currentFilter === "active" && !task.completed) ||
      (currentFilter === "completed" && task.completed);

    const matchesCategory =
      currentCategoryFilters.length === 0 || currentCategoryFilters.includes(task.category);

    return matchesStatus && matchesCategory;
  });
}

function createTaskElement(task) {
  const taskItem = document.createElement("li");
  const dateStatus = getDeadlineStatus(task);

  taskItem.className = [
    "task-card",
    task.completed ? "completed" : "",
    dateStatus
  ].filter(Boolean).join(" ");
  taskItem.style.setProperty("--priority-color", getPriorityColor(task.priority));

  taskItem.innerHTML = `
    <button class="complete-button" type="button" aria-label="${task.completed ? "未完了に戻す" : "完了にする"}">
      ${task.completed ? "✓" : ""}
    </button>
    <div class="task-content" role="button" tabindex="0" aria-label="${task.title}を編集">
      <div class="task-title"></div>
      <p class="task-memo"></p>
      <div class="task-meta">
        <span class="badge category-badge"></span>
        <span class="badge priority-badge">${getPriorityLabel(task.priority)}</span>
        ${createEstimateBadge(task)}
        <span class="badge start-badge">開始: ${formatDateLabel(task.createdAt)}</span>
        ${createDeadlineBadge(task, dateStatus)}
      </div>
    </div>
    <button class="delete-button" type="button" aria-label="削除">×</button>
  `;

  taskItem.querySelector(".task-title").textContent = task.title;
  const memoElement = taskItem.querySelector(".task-memo");
  memoElement.textContent = task.memo || "";
  memoElement.hidden = !task.memo;

  const categoryBadge = taskItem.querySelector(".category-badge");
  categoryBadge.textContent = getCategoryLabel(task.category);
  categoryBadge.style.backgroundColor = getSoftColor(getCategoryColor(task.category));
  categoryBadge.style.color = getCategoryColor(task.category);

  const priorityBadge = taskItem.querySelector(".priority-badge");
  priorityBadge.style.backgroundColor = getSoftColor(getPriorityColor(task.priority));
  priorityBadge.style.color = getPriorityColor(task.priority);

  const taskContent = taskItem.querySelector(".task-content");

  taskContent.addEventListener("click", function () {
    openTaskEditModal(task.id);
  });
  taskContent.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    openTaskEditModal(task.id);
  });
  taskItem.querySelector(".complete-button").addEventListener("click", function () {
    toggleTaskCompleted(task.id);
  });
  taskItem.querySelector(".delete-button").addEventListener("click", function () {
    deleteTask(task.id);
  });

  return taskItem;
}

function createDeadlineBadge(task, dateStatus) {
  if (!task.deadline) {
    return '<span class="badge deadline-badge">締切なし</span>';
  }

  const label = formatDeadline(task.deadline);

  if (dateStatus === "due-today") {
    return `<span class="badge deadline-badge due-today">今日まで: ${label}</span>`;
  }

  if (dateStatus === "overdue") {
    return `<span class="badge deadline-badge overdue">期限切れ: ${label}</span>`;
  }

  return `<span class="badge deadline-badge">締切: ${label}</span>`;
}

function createEstimateBadge(task) {
  if (!task.estimatedHours) {
    return "";
  }

  return `<span class="badge estimate-badge">推定: ${formatEstimatedHours(task.estimatedHours)}</span>`;
}

function getDeadlineStatus(task) {
  if (!task.deadline || task.completed) {
    return "";
  }

  const today = getTodayText();

  if (task.deadline === today) {
    return "due-today";
  }

  if (task.deadline < today) {
    return "overdue";
  }

  return "";
}

function getTodayText() {
  const today = new Date();

  return formatDateValue(today.getFullYear(), today.getMonth() + 1, today.getDate());
}

function formatDateValue(year, month, day) {
  const paddedMonth = String(month).padStart(2, "0");
  const paddedDay = String(day).padStart(2, "0");

  return `${year}-${paddedMonth}-${paddedDay}`;
}

function formatDeadline(deadline) {
  return formatDateLabel(deadline);
}

function convertEstimatedMinutesToHours(minutes) {
  const numericMinutes = Number(minutes);

  if (!Number.isFinite(numericMinutes) || numericMinutes <= 0) {
    return 0;
  }

  return numericMinutes / 60;
}

function normalizeEstimatedHours(value) {
  const hours = Number(value);

  if (!Number.isFinite(hours) || hours <= 0) {
    return 0;
  }

  return Math.round(hours * 100) / 100;
}

function formatEstimatedHours(hours) {
  if (Number.isInteger(hours)) {
    return `${hours}時間`;
  }

  return `${hours}時間`;
}

function formatDateLabel(dateText) {
  if (!dateText) {
    return "未設定";
  }

  const date = new Date(`${dateText}T00:00:00`);

  return date.toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short"
  });
}

function getCategoryLabel(categoryId) {
  const category = getOptionById("category", categoryId);

  return category ? category.label : "未分類";
}

function getCategoryColor(categoryId) {
  const category = getOptionById("category", categoryId);

  return category && category.color ? category.color : "#167255";
}

function getPriorityLabel(priorityId) {
  const priority = getOptionById("priority", priorityId);

  return `優先度: ${priority ? priority.label : "なし"}`;
}

function getPriorityColor(priorityId) {
  const priority = getOptionById("priority", priorityId);

  return priority && priority.color ? priority.color : "#657087";
}

function getSoftColor(color) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) {
    return "#edf3fb";
  }

  const red = parseInt(color.slice(1, 3), 16);
  const green = parseInt(color.slice(3, 5), 16);
  const blue = parseInt(color.slice(5, 7), 16);

  return `rgba(${red}, ${green}, ${blue}, 0.14)`;
}

function updateFilterButtons() {
  filterButtons.forEach(function (button) {
    button.classList.toggle("active", button.dataset.filter === currentFilter);
  });
}

function updateCategoryFilterButton() {
  let label = "すべて";

  if (currentCategoryFilters.length === 1) {
    label = getCategoryLabel(currentCategoryFilters[0]);
  }

  if (currentCategoryFilters.length > 1) {
    label = `${currentCategoryFilters.length}件選択中`;
  }

  categoryFilterToggle.textContent = label;
}

function updateTaskCounts() {
  const completedTasks = tasks.filter(function (task) {
    return task.completed;
  });

  totalCount.textContent = tasks.length;
  activeCount.textContent = tasks.length - completedTasks.length;
  completedCount.textContent = completedTasks.length;
}

function updateFilterLabel() {
  const statusLabels = {
    all: "すべて",
    active: "未完了",
    completed: "完了済み"
  };

  let categoryLabel = "すべての種類";

  if (currentCategoryFilters.length === 1) {
    categoryLabel = getCategoryLabel(currentCategoryFilters[0]);
  }

  if (currentCategoryFilters.length > 1) {
    categoryLabel = currentCategoryFilters.map(getCategoryLabel).join("・");
  }

  currentFilterLabel.textContent = `${categoryLabel} / ${statusLabels[currentFilter]} 表示中`;
}
