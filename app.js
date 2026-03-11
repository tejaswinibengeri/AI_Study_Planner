const API_URL = '/api';

// State
let token = localStorage.getItem('token') || null;
let user = JSON.parse(localStorage.getItem('user')) || null;

// DOM Elements - Views
const views = {
    register: document.getElementById('register-view'),
    login: document.getElementById('login-view'),
    dashboard: document.getElementById('dashboard-view'),
    addSubject: document.getElementById('add-subject-view'),
    studyPlan: document.getElementById('study-plan-view'),
};

// Nav Elements
const navBtns = {
    dashboard: document.getElementById('navDashboard'),
    addSubject: document.getElementById('navAddSubject'),
    studyPlan: document.getElementById('navStudyPlan'),
    logout: document.getElementById('navLogout'),
};

// Dashboard Elements
const welcomeMsg = document.getElementById('welcomeMsg');
const subjectsTable = document.getElementById('subjectsTable').querySelector('tbody');
const noSubjectsMsg = document.getElementById('noSubjectsMsg');
const totalSubjectsCount = document.getElementById('totalSubjectsCount');
const progressPercentage = document.getElementById('progressPercentage');

// Study Plan Elements
const planTable = document.getElementById('planTable').querySelector('tbody');
const noPlanMsg = document.getElementById('noPlanMsg');

// Setup App
function init() {
    if (token) {
        showView('dashboard');
        loadDashboardData();
        updateNav(true);
    } else {
        showView('login');
        updateNav(false);
    }
}

// Routing & Navigation
function showView(viewName) {
    Object.values(views).forEach(v => v.classList.add('hidden'));
    views[viewName].classList.remove('hidden');

    if (viewName === 'dashboard') loadDashboardData();
    if (viewName === 'studyPlan') loadStudyPlanData();
}

function updateNav(isLoggedIn) {
    if (isLoggedIn) {
        navBtns.dashboard.classList.remove('hidden');
        navBtns.addSubject.classList.remove('hidden');
        navBtns.studyPlan.classList.remove('hidden');
        navBtns.logout.classList.remove('hidden');
    } else {
        navBtns.dashboard.classList.add('hidden');
        navBtns.addSubject.classList.add('hidden');
        navBtns.studyPlan.classList.add('hidden');
        navBtns.logout.classList.add('hidden');
    }
}

// Event Listeners for Nav
navBtns.dashboard.addEventListener('click', () => showView('dashboard'));
navBtns.addSubject.addEventListener('click', () => showView('addSubject'));
navBtns.studyPlan.addEventListener('click', () => showView('studyPlan'));
navBtns.logout.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    token = null;
    user = null;
    showView('login');
    updateNav(false);
    showToast('Logged out successfully', 'success');
});

document.getElementById('showRegister').addEventListener('click', (e) => { e.preventDefault(); showView('register'); });
document.getElementById('showLogin').addEventListener('click', (e) => { e.preventDefault(); showView('login'); });
document.getElementById('goToAddSubjectBtn').addEventListener('click', () => showView('addSubject'));

// API Integration Helpers
async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const res = await fetch(`${API_URL}${endpoint}`, config);
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.message || 'API Error');
    return data;
}

// Auth Handlers
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    try {
        await apiCall('/auth/register', 'POST', { name, email, password });
        showToast('Registration successful! Please login.', 'success');
        showView('login');
        e.target.reset();
    } catch (err) {
        showToast(err.message, 'error');
    }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const data = await apiCall('/auth/login', 'POST', { email, password });
        token = data.token;
        user = data.user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        showToast('Login successful!', 'success');
        showView('dashboard');
        updateNav(true);
        e.target.reset();
    } catch (err) {
        showToast(err.message, 'error');
    }
});

// Add Subject Handler
document.getElementById('addSubjectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const subject_name = document.getElementById('subName').value;
    const exam_date = document.getElementById('subDate').value;
    const difficulty = document.getElementById('subDiff').value;

    try {
        await apiCall('/study/add-subject', 'POST', { subject_name, exam_date, difficulty });
        showToast('Subject added successfully!', 'success');
        e.target.reset();
        showView('dashboard'); // Redirect to dashboard to see new subject
    } catch (err) {
        showToast(err.message, 'error');
    }
});

// Load Dashboard Data
async function loadDashboardData() {
    if (!user) return;
    welcomeMsg.textContent = `Welcome, ${user.name}!`;

    try {
        const subjects = await apiCall('/study/subjects');
        const plan = await apiCall('/study/study-plan');

        renderSubjects(subjects);
        calculateProgress(plan);
        totalSubjectsCount.textContent = subjects.length;

    } catch (err) {
        if(err.message === 'Token is not valid') navBtns.logout.click();
        console.error(err);
    }
}

function renderSubjects(subjects) {
    subjectsTable.innerHTML = '';
    if (subjects.length === 0) {
        noSubjectsMsg.classList.remove('hidden');
    } else {
        noSubjectsMsg.classList.add('hidden');
        subjects.forEach(sub => {
            const tr = document.createElement('tr');
            const diffClass = sub.difficulty.toLowerCase();
            const dateStr = new Date(sub.exam_date).toLocaleDateString();
            
            tr.innerHTML = `
                <td><strong>${sub.subject_name}</strong></td>
                <td>${dateStr}</td>
                <td><span class="badge ${diffClass}">${sub.difficulty}</span></td>
            `;
            subjectsTable.appendChild(tr);
        });
    }
}

function calculateProgress(plan) {
    if (plan.length === 0) {
        progressPercentage.textContent = '0%';
        return;
    }
    const completed = plan.filter(t => t.status === 'Completed').length;
    const percent = Math.round((completed / plan.length) * 100);
    progressPercentage.textContent = `${percent}%`;
}

// Generate Plan Handler
document.getElementById('generatePlanBtn').addEventListener('click', async () => {
    const hours = document.getElementById('dailyHours').value;
    if (!hours || hours <= 0) {
        showToast('Please enter valid daily hours.', 'error');
        return;
    }

    try {
        await apiCall('/study/generate-study-plan', 'POST', { daily_hours: parseInt(hours) });
        showToast('Study Plan Generated!', 'success');
        loadStudyPlanData();
    } catch (err) {
        showToast(err.message, 'error');
    }
});

// Load Study Plan Data
async function loadStudyPlanData() {
    try {
        const plan = await apiCall('/study/study-plan');
        renderStudyPlan(plan);
    } catch (err) {
        console.error(err);
    }
}

function renderStudyPlan(plan) {
    planTable.innerHTML = '';
    if (plan.length === 0) {
        noPlanMsg.classList.remove('hidden');
    } else {
        noPlanMsg.classList.add('hidden');
        plan.forEach(task => {
            const tr = document.createElement('tr');
            const dateStr = new Date(task.study_date).toLocaleDateString();
            const statusClass = task.status.toLowerCase();
            
            const actionHtml = task.status === 'Pending' 
                ? `<button class="btn success-btn" onclick="completeTask(${task.id})">Mark Done</button>`
                : `<span style="color:var(--text-muted);font-size:0.85rem">Completed ✔</span>`;

            tr.innerHTML = `
                <td>${dateStr}</td>
                <td><strong>${task.subject_name}</strong></td>
                <td>${task.task}</td>
                <td><span class="badge ${statusClass}">${task.status}</span></td>
                <td>${actionHtml}</td>
            `;
            planTable.appendChild(tr);
        });
    }
}

// Complete Task
window.completeTask = async function(taskId) {
    try {
        await apiCall(`/study/complete-task/${taskId}`, 'PUT');
        showToast('Task marked as completed!', 'success');
        loadStudyPlanData(); // Refresh list
    } catch(err) {
        showToast(err.message, 'error');
    }
};

// UI Helpers
function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Initialize
init();
