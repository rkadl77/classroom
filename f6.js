let currentTask = null;
let currentLeader = null;
let taskRating = 0;
let memberRatings = {};
let leaderRating = 0;

function loadData() {
    const savedTask = localStorage.getItem('currentTask');
    const savedLeader = localStorage.getItem('currentLeader');
    const completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '[]');
    
    if (savedTask && completedTasks.length > 0) {
        currentTask = JSON.parse(savedTask);
        currentLeader = savedLeader ? JSON.parse(savedLeader) : null;
        
        document.getElementById('ratingContent').style.display = 'block';
        document.getElementById('noTaskWarning').style.display = 'none';
        
        document.getElementById('currentTaskTitle').textContent = currentTask.title || 'Без названия';
        
        const isCompleted = completedTasks.some(t => t.task?.id === currentTask.id);
        const statusSpan = document.getElementById('taskStatus');
        if (isCompleted) {
            statusSpan.innerHTML = '✅ Завершена';
            statusSpan.className = 'task-status status-completed';
        } else {
            statusSpan.innerHTML = '🔄 В процессе';
            statusSpan.className = 'task-status status-incomplete';
        }
        
        loadSavedRatings();
        renderMemberStars();
        renderLeaderStars();
        updateTotalScore();
    } else {
        document.getElementById('ratingContent').style.display = 'none';
        document.getElementById('noTaskWarning').style.display = 'block';
    }
    
    loadRatingHistory();
}

function loadSavedRatings() {
    const savedRating = localStorage.getItem(`rating_${currentTask?.id}`);
    if (savedRating) {
        const ratingData = JSON.parse(savedRating);
        taskRating = ratingData.taskRating || 0;
        memberRatings = ratingData.memberRatings || {};
        leaderRating = ratingData.leaderRating || 0;
        
        updateTaskStarsDisplay();
    } else {
        taskRating = 0;
        memberRatings = {};
        leaderRating = 0;
        
        if (currentTask?.members) {
            currentTask.members.forEach(member => {
                memberRatings[member] = 0;
            });
        }
    }
}

function updateTaskStarsDisplay() {
    const stars = document.querySelectorAll('#taskStars .star');
    stars.forEach((star, index) => {
        if (index < taskRating) {
            star.classList.add('active');
            star.textContent = '★';
        } else {
            star.classList.remove('active');
            star.textContent = '☆';
        }
    });
    document.getElementById('taskRatingValue').textContent = `${taskRating} / 5`;
}

function renderMemberStars() {
    const container = document.getElementById('membersRatingList');
    if (!container || !currentTask?.members) return;
    
    container.innerHTML = '';
    currentTask.members.forEach(member => {
        const rating = memberRatings[member] || 0;
        const div = document.createElement('div');
        div.className = 'member-rating-item';
        div.innerHTML = `
            <div class="member-name">
                <span>👤</span> ${member}
            </div>
            <div class="member-stars" data-member="${member}">
                ${[1,2,3,4,5].map(v => `
                    <span class="member-star ${v <= rating ? 'active' : ''}" data-value="${v}">${v <= rating ? '★' : '☆'}</span>
                `).join('')}
            </div>
        `;
        
        const starsDiv = div.querySelector('.member-stars');
        starsDiv.querySelectorAll('.member-star').forEach(star => {
            star.addEventListener('click', (e) => {
                const value = parseInt(star.dataset.value);
                memberRatings[member] = value;
                renderMemberStars();
                updateTotalScore();
                showToast(`Оценка для ${member}: ${value}/5`, 1000);
            });
        });
        
        container.appendChild(div);
    });
}

function renderLeaderStars() {
    const container = document.getElementById('leaderRatingBlock');
    if (!container) return;
    
    if (!currentLeader) {
        container.innerHTML = `<div style="color: #64748b;">Лидер не назначен</div>`;
        return;
    }
    
    const leaderName = currentLeader.leaderName || 'Лидер';
    container.innerHTML = `
        <div class="leader-info">
            <div class="leader-icon">👑</div>
            <div>
                <div class="leader-name-rating">${leaderName}</div>
                <div class="leader-stars" id="leaderStarsContainer">
                    ${[1,2,3,4,5].map(v => `
                        <span class="leader-star ${v <= leaderRating ? 'active' : ''}" data-value="${v}">${v <= leaderRating ? '★' : '☆'}</span>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    const starsContainer = document.getElementById('leaderStarsContainer');
    if (starsContainer) {
        starsContainer.querySelectorAll('.leader-star').forEach(star => {
            star.addEventListener('click', (e) => {
                leaderRating = parseInt(star.dataset.value);
                renderLeaderStars();
                updateTotalScore();
                showToast(`Оценка лидера: ${leaderRating}/5`, 1000);
            });
        });
    }
}

function updateTotalScore() {
    let total = taskRating;
    
    if (currentTask?.members) {
        const memberSum = Object.values(memberRatings).reduce((sum, r) => sum + r, 0);
        total += memberSum;
    }
    
    total += leaderRating;
    
    const maxScore = 5 + (currentTask?.members?.length || 0) * 5 + 5;
    const percentage = maxScore > 0 ? (total / maxScore) * 100 : 0;
    
    document.getElementById('totalScore').textContent = Math.round(percentage);
    
    let grade = 'F';
    let gradeClass = 'grade-F';
    if (percentage >= 90) { grade = 'A+'; gradeClass = 'grade-A'; }
    else if (percentage >= 80) { grade = 'A'; gradeClass = 'grade-A'; }
    else if (percentage >= 70) { grade = 'B'; gradeClass = 'grade-B'; }
    else if (percentage >= 60) { grade = 'C'; gradeClass = 'grade-C'; }
    else if (percentage >= 50) { grade = 'D'; gradeClass = 'grade-D'; }
    
    const gradeElement = document.getElementById('gradeLetter');
    gradeElement.textContent = grade;
    gradeElement.className = `grade-letter ${gradeClass}`;
}

function saveRating() {
    if (!currentTask) {
        showToast('❌ Нет активной задачи', 1500);
        return;
    }
    
    const comment = document.getElementById('ratingComment').value;
    
    const ratingData = {
        taskId: currentTask.id,
        taskTitle: currentTask.title,
        taskRating: taskRating,
        memberRatings: memberRatings,
        leaderRating: leaderRating,
        comment: comment,
        totalScore: document.getElementById('totalScore').textContent,
        grade: document.getElementById('gradeLetter').textContent,
        createdAt: new Date().toLocaleString()
    };
    
    localStorage.setItem(`rating_${currentTask.id}`, JSON.stringify(ratingData));
    
    let ratings = JSON.parse(localStorage.getItem('ratings') || '[]');
    const existingIndex = ratings.findIndex(r => r.taskId === currentTask.id);
    if (existingIndex >= 0) {
        ratings[existingIndex] = ratingData;
    } else {
        ratings.push(ratingData);
    }
    localStorage.setItem('ratings', JSON.stringify(ratings));
    
    showToast(`⭐ Оценка сохранена! Общий балл: ${ratingData.totalScore}%`, 2500);
    loadRatingHistory();
}

function resetRating() {
    if (confirm('Сбросить все оценки для этой задачи?')) {
        taskRating = 0;
        memberRatings = {};
        leaderRating = 0;
        
        if (currentTask?.members) {
            currentTask.members.forEach(member => {
                memberRatings[member] = 0;
            });
        }
        
        updateTaskStarsDisplay();
        renderMemberStars();
        renderLeaderStars();
        updateTotalScore();
        document.getElementById('ratingComment').value = '';
        
        showToast('Оценки сброшены', 1200);
    }
}

function loadRatingHistory() {
    const container = document.getElementById('ratingHistoryList');
    const ratings = JSON.parse(localStorage.getItem('ratings') || '[]');
    
    if (ratings.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет сохранённых оценок</div>';
        return;
    }
    
    container.innerHTML = ratings.slice(-5).reverse().map(rating => `
        <div class="history-item">
            <div class="history-task">📋 ${escapeHtml(rating.taskTitle)}</div>
            <div class="history-score">⭐ ${rating.totalScore}% (${rating.grade})</div>
            <div class="history-date">${rating.createdAt}</div>
        </div>
    `).join('');
}

function setupTaskStars() {
    const stars = document.querySelectorAll('#taskStars .star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            taskRating = parseInt(star.dataset.value);
            updateTaskStarsDisplay();
            updateTotalScore();
            showToast(`Общая оценка задачи: ${taskRating}/5`, 1000);
        });
    });
}

function showToast(msg, duration = 2000) {
    const toast = document.getElementById('toastMessage');
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => {
        toast.style.opacity = '0';
    }, duration);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

document.getElementById('saveRatingBtn')?.addEventListener('click', saveRating);
document.getElementById('resetRatingBtn')?.addEventListener('click', resetRating);

setupTaskStars();
loadData();