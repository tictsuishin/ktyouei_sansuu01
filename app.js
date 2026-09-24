const STORAGE_KEY = "my-study-log.entries.v1";
const GOOGLE_SHEETS_URL = "";
const SUBJECTS = ["こくご", "さんすう", "しゃかい", "りか", "おんがく", "たいいく", "ずこう", "どうとく", "えいご", "そうごうてきながくしゅう"];
const UNDERSTANDING_OPTIONS = [
  { value: "5", label: "よくりかいできた" },
  { value: "4", label: "だいたいいりかいできた" },
  { value: "3", label: "ふつう" },
  { value: "2", label: "すこしむずかしかった" },
  { value: "1", label: "まだむずかしい" },
];

const form = document.querySelector("#study-form");
const dateInput = document.querySelector("#entry-date");
const subjectInput = document.querySelector("#entry-subject");
const taskInput = document.querySelector("#entry-task");
const goalInput = document.querySelector("#entry-goal");
const learningMethodInput = document.querySelector("#entry-learning-method");
const soloEvaluationInput = document.querySelector("#entry-solo-evaluation");
const peerLearningInput = document.querySelector("#entry-peer-learning");
const peerEvaluationInput = document.querySelector("#entry-peer-evaluation");
const understandingInput = document.querySelector("#entry-understanding");
const contentInput = document.querySelector("#entry-content");
const reflectionInput = document.querySelector("#entry-reflection");
const clearButton = document.querySelector("#clear-button");
const entryList = document.querySelector("#entry-list");
const emptyState = document.querySelector("#empty-state");
const saveState = document.querySelector("#save-state");
const charCount = document.querySelector("#char-count");
const editingLabel = document.querySelector("#editing-label");
const entryCount = document.querySelector("#entry-count");
const averageEvaluation = document.querySelector("#average-evaluation");
const summaryRow = document.querySelector("#summary-row");
const subjectFilter = document.querySelector("#subject-filter");
const periodFilter = document.querySelector("#period-filter");
const evaluationChart = document.querySelector("#evaluation-chart");
const evaluationSubjectFilter = document.querySelector("#evaluation-subject-filter");
const evaluationPeriodFilter = document.querySelector("#evaluation-period-filter");

let entries = loadEntries();

function loadEntries() {
  const rawEntries = localStorage.getItem(STORAGE_KEY);
  if (!rawEntries) return [];
  try {
    const parsedEntries = JSON.parse(rawEntries);
    return Array.isArray(parsedEntries) ? parsedEntries : [];
  } catch {
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

async function sendEntryToGoogleSheets(entry) {
  if (!GOOGLE_SHEETS_URL) {
    return false;
  }

  await fetch(GOOGLE_SHEETS_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain",
    },
    body: JSON.stringify(entry),
  });

  return true;
}

function getTodayIso() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function formatDate(dateText) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${dateText}T00:00:00`));
}

function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sortEntries() {
  entries.sort((a, b) => b.date.localeCompare(a.date));
}

function getFilteredEntries() {
  const selectedSubject = subjectFilter.value;
  const selectedPeriod = periodFilter.value;
  const period = getPeriodRange(selectedPeriod);
  return entries.filter((entry) => {
    const matchesPeriod = !period || (entry.date >= period.start && entry.date <= period.end);
    const matchesSubject = selectedSubject === "all" || entry.subject === selectedSubject;
    return matchesSubject
      && matchesPeriod;
  });
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPeriodRange(period) {
  if (period === "all") return null;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayOfWeek = start.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  if (period === "this-week") {
    start.setDate(start.getDate() + mondayOffset);
    return { start: toIsoDate(start), end: toIsoDate(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)) };
  }
  if (period === "last-week") {
    start.setDate(start.getDate() + mondayOffset - 7);
    return { start: toIsoDate(start), end: toIsoDate(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)) };
  }
  if (period === "this-month") {
    return { start: toIsoDate(new Date(start.getFullYear(), start.getMonth(), 1)), end: toIsoDate(new Date(start.getFullYear(), start.getMonth() + 1, 0)) };
  }
  return { start: toIsoDate(new Date(start.getFullYear(), start.getMonth() - 1, 1)), end: toIsoDate(new Date(start.getFullYear(), start.getMonth(), 0)) };
}

function renderEntries() {
  const filteredEntries = getFilteredEntries();
  entryList.innerHTML = filteredEntries.map((entry) => `
    <li class="entry-card">
      <div class="entry-topline">
        <span class="entry-date">${formatDate(entry.date)}</span>
        <span class="learning-method-badge">${escapeHtml(entry.subject)} ・ ${escapeHtml(entry.learningMethod || "まなびかたみせってい")}</span>
      </div>
      ${entry.task ? `<p class="entry-task"><strong>ほんじのかだい:</strong> ${escapeHtml(entry.task)}</p>` : ""}
      ${entry.goal ? `<p class="entry-task"><strong>かだいにたいするじぶんのめざすすがた:</strong> ${escapeHtml(entry.goal)}</p>` : ""}
      <div class="understanding">めざすすがた: <span aria-label="${entry.understanding}/5">${"★".repeat(entry.understanding)}${"☆".repeat(5 - entry.understanding)}</span></div>
      <div class="understanding">ひとりでのひょうか: <span aria-label="${entry.soloEvaluation || entry.evaluation || "-"}/5">${entry.soloEvaluation || entry.evaluation ? `${"★".repeat(entry.soloEvaluation || entry.evaluation)}${"☆".repeat(5 - (entry.soloEvaluation || entry.evaluation))}` : "みせってい"}</span></div>
      <div class="understanding">なかまととのひょうか: <span aria-label="${entry.peerEvaluation || entry.evaluation || "-"}/5">${entry.peerEvaluation || entry.evaluation ? `${"★".repeat(entry.peerEvaluation || entry.evaluation)}${"☆".repeat(5 - (entry.peerEvaluation || entry.evaluation))}` : "みせってい"}</span></div>
      <p class="entry-note">${escapeHtml(entry.content)}</p>
      ${(entry.reflection || entry.nextAction) ? `<p class="next-action"><strong>ほんじのふりかえり:</strong> ${escapeHtml(entry.reflection || entry.nextAction)}</p>` : ""}
      <div class="entry-actions">
        <button type="button" data-action="edit" data-date="${entry.date}">へんしゅう</button>
        <button class="danger-button" type="button" data-action="delete" data-date="${entry.date}">さくじょ</button>
      </div>
    </li>
  `).join("");
  emptyState.innerHTML = entries.length && !filteredEntries.length
    ? "<strong>じょうけんにあうきろくがありません</strong><span>けんさくわーどやかもくふるいをかえてみてください。</span>"
    : "<strong>まだがくしゅうのきろくがありません</strong><span>まなんだことをほぞんすると、ここにひょうじされます。</span>";
  emptyState.hidden = filteredEntries.length > 0;
  entryList.hidden = filteredEntries.length === 0;
}

function renderSubjectFilter() {
  const currentValue = subjectFilter.value;
  const subjects = getSubjects();
  subjectFilter.innerHTML = `<option value="all">すべてのかもく</option>${subjects.map((subject) => `<option value="${escapeHtml(subject)}">${escapeHtml(subject)}</option>`).join("")}`;
  subjectFilter.value = subjects.includes(currentValue) ? currentValue : "all";
}

function getSubjects() {
  return SUBJECTS;
}

function renderEvaluationSubjectFilter() {
  const currentValue = evaluationSubjectFilter.value;
  const subjects = getSubjects();
  evaluationSubjectFilter.innerHTML = `<option value="all">すべてのかもく</option>${subjects.map((subject) => `<option value="${escapeHtml(subject)}">${escapeHtml(subject)}</option>`).join("")}`;
  evaluationSubjectFilter.value = subjects.includes(currentValue) ? currentValue : "all";
}

function renderSummary() {
  entryCount.textContent = entries.length;
  renderEvaluationSubjectFilter();
  const selectedSubject = evaluationSubjectFilter.value;
  const selectedPeriod = evaluationPeriodFilter.value;
  const period = getPeriodRange(selectedPeriod);
  const evaluatedEntries = entries.filter((entry) =>
    (selectedSubject === "all" || entry.subject === selectedSubject)
    && (!period || (entry.date >= period.start && entry.date <= period.end))
    && Number.isInteger(Number(entry.evaluation))
    && Number(entry.evaluation) >= 1
    && Number(entry.evaluation) <= 5,
  );
  const average = evaluatedEntries.length
    ? evaluatedEntries.reduce((sum, entry) => sum + Number(entry.evaluation), 0) / evaluatedEntries.length
    : 0;
  averageEvaluation.textContent = evaluatedEntries.length ? average.toFixed(1) : "-";
  const counts = entries.reduce((result, entry) => {
    const method = entry.learningMethod || "まなびかたみせってい";
    result[method] = (result[method] || 0) + 1;
    return result;
  }, {});
  summaryRow.innerHTML = Object.entries(counts).sort(([, a], [, b]) => b - a)
    .map(([method, count]) => `<span class="summary-chip">${escapeHtml(method)} ${count}けん</span>`).join("");
  renderEvaluationChart();
}

function renderEvaluationChart() {
  const selectedSubject = evaluationSubjectFilter.value;
  const period = getPeriodRange(evaluationPeriodFilter.value);
  const evaluatedEntries = entries
    .filter((entry) =>
      (selectedSubject === "all" || entry.subject === selectedSubject)
      && (!period || (entry.date >= period.start && entry.date <= period.end))
      && Number.isInteger(Number(entry.evaluation))
      && Number(entry.evaluation) >= 1
      && Number(entry.evaluation) <= 5,
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  if (!evaluatedEntries.length) {
    evaluationChart.innerHTML = '<p class="chart-empty">ほんじのひょうかをほぞんすると、ここにひょうじされます</p>';
    return;
  }

  const width = 640;
  const height = 190;
  const left = 34;
  const right = 12;
  const top = 14;
  const bottom = 34;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const xStep = evaluatedEntries.length > 1 ? chartWidth / (evaluatedEntries.length - 1) : 0;
  const points = evaluatedEntries.map((entry, index) => {
    const value = Number(entry.evaluation);
    const x = evaluatedEntries.length > 1 ? left + index * xStep : width / 2;
    const y = top + ((5 - value) / 4) * chartHeight;
    return { entry, value, x, y };
  });
  const linePoints = points.map(({ x, y }) => `${x},${y}`).join(" ");
  const gridLines = [1, 2, 3, 4, 5].map((value) => {
    const y = top + ((5 - value) / 4) * chartHeight;
    return `<line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" /><text x="8" y="${y + 4}">${value}</text>`;
  }).join("");
  const pointMarkup = points.map(({ entry, value, x, y }) => `
    <circle cx="${x}" cy="${y}" r="5" />
    <text class="evaluation-value" x="${x}" y="${y - 10}">${value}</text>
    <text class="evaluation-date" x="${x}" y="${height - 10}">${escapeHtml(entry.date.slice(5))}</text>
  `).join("");

  evaluationChart.innerHTML = `
    <svg class="evaluation-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="ほんじのひょうかのへんか">
      <g class="evaluation-grid">${gridLines}</g>
      <polyline class="evaluation-line" points="${linePoints}" />
      <g class="evaluation-points">${pointMarkup}</g>
    </svg>
  `;
}

function render() {
  sortEntries();
  renderSubjectFilter();
  renderSummary();
  renderEntries();
}

function updateCharCount() {
  charCount.textContent = contentInput.value.length;
}

function updateSaveState(text) {
  saveState.textContent = text;
}

function resetForm() {
  form.reset();
  dateInput.value = getTodayIso();
  goalInput.value = "";
  editingLabel.textContent = "きょうのがくしゅうのきろくをかいています";
  updateCharCount();
  updateSaveState("みほぞん");
}

function normalizeUnderstandingValue(value) {
  const normalized = Number(value);
  if ([5, 4, 3, 1].includes(normalized)) {
    return normalized;
  }
  if (normalized === 2) {
    return 3;
  }
  return "";
}

function loadEntryIntoForm(entry) {
  dateInput.value = entry.date;
  subjectInput.value = entry.subject;
  taskInput.value = entry.task || "";
  goalInput.value = entry.goal || "";
  learningMethodInput.value = entry.learningMethod || "";
  soloEvaluationInput.value = entry.soloEvaluation || entry.evaluation || "";
  peerLearningInput.value = entry.peerLearning || "";
  peerEvaluationInput.value = entry.peerEvaluation || entry.evaluation || "";
  understandingInput.value = normalizeUnderstandingValue(entry.understanding);
  contentInput.value = entry.content;
  reflectionInput.value = entry.reflection || entry.nextAction || "";
  editingLabel.textContent = `${formatDate(entry.date)}のきろくをへんしゅうちゅう`;
  updateCharCount();
  updateSaveState("へんしゅうちゅう");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const date = dateInput.value;
  const subject = subjectInput.value.trim();
  const task = taskInput.value.trim();
  const goal = goalInput.value.trim();
  const learningMethod = learningMethodInput.value;
  const soloEvaluation = Number(soloEvaluationInput.value);
  const peerLearning = peerLearningInput.value;
  const peerEvaluation = Number(peerEvaluationInput.value);
  const understanding = Number(understandingInput.value);
  const evaluation = (soloEvaluation + peerEvaluation) / 2;
  const content = contentInput.value.trim();
  const reflection = reflectionInput.value.trim();
  if (!date || !subject || !task || !learningMethod || !peerLearning || !understanding
    || !soloEvaluation || !peerEvaluation) {
    updateSaveState("にゅうりょくをかくにん");
    return;
  }
  const existingIndex = entries.findIndex((entry) => entry.date === date);
  const now = new Date().toISOString();
  const nextEntry = {
    id: existingIndex >= 0 ? entries[existingIndex].id : createId(),
    date, subject, task, goal, learningMethod, soloEvaluation, peerLearning, peerEvaluation,
    understanding, evaluation, content, reflection,
    createdAt: existingIndex >= 0 ? entries[existingIndex].createdAt : now,
    updatedAt: now,
  };
  if (existingIndex >= 0) entries[existingIndex] = nextEntry;
  else entries.push(nextEntry);
  saveEntries();
  render();
  loadEntryIntoForm(nextEntry);
  try {
    const sentToGoogleSheets = await sendEntryToGoogleSheets(nextEntry);
    updateSaveState(sentToGoogleSheets ? "ほぞん・Sheetsそうしんずみ" : "ほぞんずみ（Sheetsみせってい）");
  } catch (error) {
    console.error("Googleスプレッドシートへのそうしんにしっぱいしました", error);
    updateSaveState("ほぞんずみ（Sheetsそうしんしっぱい）");
  }
});

dateInput.addEventListener("change", () => {
  const existingEntry = entries.find((entry) => entry.date === dateInput.value);
  if (existingEntry) {
    loadEntryIntoForm(existingEntry);
    return;
  }
  subjectInput.value = "";
  taskInput.value = "";
  goalInput.value = "";
  learningMethodInput.value = "";
  soloEvaluationInput.value = "";
  peerLearningInput.value = "";
  peerEvaluationInput.value = "";
  understandingInput.value = "";
  contentInput.value = "";
  reflectionInput.value = "";
  editingLabel.textContent = `${formatDate(dateInput.value)}のきろくをかいています`;
  updateCharCount();
  updateSaveState("みほぞん");
});

form.addEventListener("input", () => {
  updateCharCount();
  updateSaveState("へんしゅうちゅう");
});

clearButton.addEventListener("click", resetForm);
subjectFilter.addEventListener("change", renderEntries);
periodFilter.addEventListener("change", renderEntries);
evaluationSubjectFilter.addEventListener("change", renderSummary);
evaluationPeriodFilter.addEventListener("change", renderSummary);

entryList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const entry = entries.find((item) => item.date === button.dataset.date);
  if (!entry) return;
  if (button.dataset.action === "edit") {
    loadEntryIntoForm(entry);
    document.querySelector(".editor-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (button.dataset.action === "delete" && confirm(`${formatDate(entry.date)}の学習記録を削除しますか？`)) {
    entries = entries.filter((item) => item.date !== entry.date);
    saveEntries();
    render();
    resetForm();
  }
});

dateInput.value = getTodayIso();
updateCharCount();
render();
