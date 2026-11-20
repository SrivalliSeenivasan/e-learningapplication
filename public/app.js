let currentUser = null;
let courses = [];

async function registerUser() {
  const name = document.getElementById('nameInput').value.trim();
  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value.trim();

  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();
  document.getElementById('authMsg').innerText = data.message || data.error;
  if (res.ok) {
    currentUser = data.user;
    showDashboard();
  }
}

async function loginUser() {
  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value.trim();

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  document.getElementById('authMsg').innerText = data.message || data.error;
  if (res.ok) {
    currentUser = data.user;
    showDashboard();
  }
}

function logout() {
  currentUser = null;
  document.getElementById('dashboardSection').classList.add('hidden');
  document.getElementById('authSection').classList.remove('hidden');
}

async function showDashboard() {
  document.getElementById('authSection').classList.add('hidden');
  document.getElementById('dashboardSection').classList.remove('hidden');
  document.getElementById('studentName').innerText = currentUser.name;

  updateProgressStats();
  await loadCourses();
}

function updateProgressStats() {
  const prog = currentUser.progress || [];
  const completed = prog.filter((p) => p.completed).length;
  const avg = completed
    ? Math.round(prog.reduce((sum, p) => sum + p.score, 0) / completed)
    : 0;

  document.getElementById('completedCount').innerText = completed;
  document.getElementById('avgScore').innerText = `${avg}%`;
}

async function loadCourses() {
  const res = await fetch('/api/courses');
  courses = await res.json();
  const container = document.getElementById('coursesList');
  container.innerHTML = '';

  courses.forEach((course) => {
    const div = document.createElement('div');
    div.className = 'course-box';
    div.innerHTML = `
      <h4>${course.title} (${course.category})</h4>
      <p><strong>Lesson:</strong> ${course.lesson}</p>
      <p><strong>Quiz:</strong> ${course.quizQuestion}</p>
      <select id="ans-${course._id}">
        ${course.options.map((opt) => `<option value="${opt}">${opt}</option>`).join('')}
      </select>
      <button onclick="submitQuiz('${course._id}')">Submit Quiz</button>
      <p id="res-${course._id}"></p>
    `;
    container.appendChild(div);
  });
}

async function submitQuiz(courseId) {
  const selectedOption = document.getElementById(`ans-${courseId}`).value;
  const res = await fetch('/api/quiz-submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: currentUser._id,
      courseId,
      selectedOption
    })
  });
  const data = await res.json();
  const resEl = document.getElementById(`res-${courseId}`);

  if (res.ok) {
    currentUser = data.user;
    updateProgressStats();
    resEl.innerText = data.isCorrect
      ? 'Correct! Score: 100%'
      : `Incorrect. Correct answer: ${data.correctAnswer}`;
  } else {
    resEl.innerText = data.error;
  }
}