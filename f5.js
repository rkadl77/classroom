let currentTask = null;
let currentDistribution = null;
let currentLeader = null;

function loadAllData() {
    const savedTask = localStorage.getItem('currentTask');
    const savedDistribution = localStorage.getItem('currentDistribution');
    const savedLeader = localStorage.getItem('currentLeader');
    
    if (savedTask) {
        currentTask = JSON.parse(savedTask);
        document.getElementById('solutionContent').style.display = 'block';
        document.getElementById('noTaskWarning').style.display = 'none';
    } else {
        document.getElementById('solutionContent').style.display = 'none';
        document.getElementById('noTaskWarning').style.display = 'block';
        return;
    }
    
    if (savedDistribution) {
        currentDistribution = JSON.parse(savedDistribution);
    }
    
    if (savedLeader) {
        currentLeader = JSON.parse(savedLeader);
    }
    
    renderTaskInfo();
    renderDistribution();
    renderLeaderInfo();
    renderProgress();
    loadSavedComment();
}

function getPriorityClass(priority) {
    const classes = {
        'low': 'priority-low',
        'medium': 'priority-medium',
        'high': 'priority-high',
        'critical': 'priority-high'
    };
    return classes[priority] || '';
}

function getPriorityName(priority) {
    const names = {
        'low': '🟢 Низкий',
        'medium': '🟡 Средний',
        'high': '🔴 Высокий',
        'critical': '🔥 Критический'
    };
    return names[priority] || priority;
}

function renderTaskInfo() {
    if (!currentTask) return;
    
    const container = document.getElementById('taskInfo');
    container.innerHTML = `
        <div class="info-row">
            <span class="info-label">Название задачи:</span>
            <span class="info-value">${escapeHtml(currentTask.title)}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Описание:</span>
            <span class="info-value">${escapeHtml(currentTask.description) || '—'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Дедлайн:</span>
            <span class="info-value">${currentTask.deadline || 'не указан'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Приоритет:</span>
            <span class="info-value ${getPriorityClass(currentTask.priority)}">${getPriorityName(currentTask.priority)}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Участники:</span>
            <span class="info-value">${currentTask.members.join(', ')}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Создана:</span>
            <span class="info-value">${currentTask.createdAt || 'только что'}</span>
        </div>
    `;
}

function renderDistribution() {
    const container = document.getElementById('distributionList');
    
    if (!currentDistribution || !currentTask) {
        container.innerHTML = `
            <div class="distribution-item">
                <span style="color: #64748b;">Распределение не настроено</span>
            </div>
        `;
        return;
    }
    
    const members = currentTask.members || [];
    const distType = currentDistribution.distributionType;
    
    let distText = '';
    switch(distType) {
        case 'auto':
            distText = 'Автоматическое распределение';
            break;
        case 'manual':
            distText = 'Ручное распределение';
            break;
        case 'equal':
            distText = 'Равномерное распределение';
            break;
        default:
            distText = distType;
    }
    
    let distributionHtml = `
        <div class="distribution-item" style="background: #2dd4bf10;">
            <span class="info-label">Тип распределения:</span>
            <span class="info-value">${distText}</span>
        </div>
    `;
    
    if (distType === 'equal') {
        const percent = members.length ? Math.floor(100 / members.length) : 0;
        members.forEach(member => {
            distributionHtml += `
                <div class="distribution-item">
                    <span class="distribution-member">👤 ${member}</span>
                    <span class="distribution-load">📋 ${percent}% задачи</span>
                </div>
            `;
        });
    } else {
        members.forEach((member, idx) => {
            const loadVariants = ['30%', '25%', '35%', '20%', '40%'];
            const load = loadVariants[idx % loadVariants.length];
            distributionHtml += `
                <div class="distribution-item">
                    <span class="distribution-member">👤 ${member}</span>
                    <span class="distribution-load">📋 ${load} работы</span>
                </div>
            `;
        });
    }
    
    container.innerHTML = distributionHtml;
}

function renderLeaderInfo() {
    const container = document.getElementById('leaderInfo');
    
    if (!currentLeader) {
        container.innerHTML = `
            <div style="color: #64748b; text-align: center; padding: 1rem;">
                Лидер не назначен. Перейдите в F4 для настройки.
            </div>
        `;
        return;
    }
    
    const methodNames = {
        'auto': '🤖 Автоматический выбор',
        'manual': '✋ Ручной выбор',
        'vote': '🗳️ Голосование',
        'rotation': '🔄 Ротация'
    };
    
    const powers = [];
    if (currentLeader.powers?.assign) powers.push('Назначать ответственных');
    if (currentLeader.powers?.deadline) powers.push('Менять дедлайны');
    if (currentLeader.powers?.approve) powers.push('Утверждать выполнение');
    if (currentLeader.powers?.kick) powers.push('Исключать участников');
    
    container.innerHTML = `
        <div class="leader-avatar">👑</div>
        <div class="leader-details">
            <div class="leader-name">${escapeHtml(currentLeader.leaderName)}</div>
            <div class="leader-method">${methodNames[currentLeader.leaderType] || currentLeader.leaderType}</div>
            <div class="leader-powers">
                ${powers.map(p => `<span class="power-tag">${p}</span>`).join('')}
            </div>
        </div>
    `;
}

function renderProgress() {
    const progressBar = document.getElementById('progressBar');
    const progressStats = document.getElementById('progressStats');
    
    let savedProgress = localStorage.getItem('taskProgress');
    let progress = savedProgress ? parseInt(savedProgress) : 0;
    
    if (isNaN(progress)) progress = 0;
    
    progressBar.style.width = progress + '%';
    progressStats.innerHTML = `
        <span>Выполнено: ${progress}%</span>
        <span>Осталось: ${100 - progress}%</span>
    `;
}

function loadSavedComment() {
    const savedComment = localStorage.getItem('teamComment');
    const commentArea = document.getElementById('teamComment');
    if (commentArea && savedComment) {
        commentArea.value = savedComment;
    }
}

function saveComment() {
    const comment = document.getElementById('teamComment').value;
    localStorage.setItem('teamComment', comment);
    showToast('Комментарий сохранён', 1500);
}

function exportToJSON() {
    const exportData = {
        task: currentTask,
        distribution: currentDistribution,
        leader: currentLeader,
        comment: localStorage.getItem('teamComment'),
        progress: localStorage.getItem('taskProgress'),
        exportDate: new Date().toLocaleString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team_solution_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Данные экспортированы в JSON', 2000);
}

function completeTask() {
    if (confirm('Вы уверены, что хотите завершить задачу?')) {
        localStorage.setItem('taskProgress', '100');
        renderProgress();
        
        const completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '[]');
        completedTasks.push({
            task: currentTask,
            completedAt: new Date().toLocaleString()
        });
        localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
        
        showToast('🎉 Задача завершена! Отличная работа команды!', 3000);
        
        const statusBadge = document.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.innerHTML = '<span class="status-icon">✅</span><span class="status-text">Завершена</span>';
        }
    }
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

document.getElementById('saveCommentBtn')?.addEventListener('click', saveComment);
document.getElementById('exportBtn')?.addEventListener('click', exportToJSON);
document.getElementById('completeBtn')?.addEventListener('click', completeTask);

loadAllData();