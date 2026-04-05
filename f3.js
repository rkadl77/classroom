function loadStatistics() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const distributions = JSON.parse(localStorage.getItem('distributions') || '[]');
    const currentTask = JSON.parse(localStorage.getItem('currentTask') || '{}');
    
    document.getElementById('totalTasks').textContent = tasks.length;
    document.getElementById('totalDistributions').textContent = distributions.length;
    document.getElementById('totalMembers').textContent = currentTask.members ? currentTask.members.length : 0;
    
    const recentTasksList = document.getElementById('recentTasksList');
    if (tasks.length === 0) {
        recentTasksList.innerHTML = '<div class="empty-state">Нет созданных задач</div>';
    } else {
        recentTasksList.innerHTML = tasks.slice(-5).reverse().map(task => `
            <div class="task-item">
                <div class="task-title">${escapeHtml(task.title)}</div>
                <div class="task-meta">
                    <span>👥 ${task.members.length} участников</span>
                    <span>📅 ${task.deadline || 'без дедлайна'}</span>
                    <span>🕐 ${task.createdAt || 'недавно'}</span>
                </div>
            </div>
        `).join('');
    }
    
    const recentDistributionsList = document.getElementById('recentDistributionsList');
    if (distributions.length === 0) {
        recentDistributionsList.innerHTML = '<div class="empty-state">Нет сохранённых распределений</div>';
    } else {
        recentDistributionsList.innerHTML = distributions.slice(-5).reverse().map(dist => `
            <div class="distribution-item">
                <div class="task-title">${escapeHtml(dist.taskTitle || 'Без названия')}</div>
                <div class="task-meta">
                    <span class="distribution-type">${getDistributionTypeName(dist.distributionType)}</span>
                    <span>📅 ${dist.appliedAt || 'недавно'}</span>
                </div>
            </div>
        `).join('');
    }
}

function getDistributionTypeName(type) {
    const types = {
        'auto': '🤖 Автоматическое',
        'manual': '✋ Ручное',
        'equal': '📊 Равномерное'
    };
    return types[type] || type;
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

function showToast(msg, duration = 2000) {
    const toast = document.getElementById('toastMessage');
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => {
        toast.style.opacity = '0';
    }, duration);
}

document.getElementById('refreshBtn').addEventListener('click', () => {
    loadStatistics();
    showToast('Статистика обновлена', 1000);
});

document.getElementById('clearDataBtn').addEventListener('click', () => {
    if (confirm('Вы уверены? Будут удалены все задачи и настройки распределения.')) {
        localStorage.removeItem('tasks');
        localStorage.removeItem('distributions');
        localStorage.removeItem('currentTask');
        localStorage.removeItem('currentDistribution');
        loadStatistics();
        showToast('Статистика очищена', 1500);
    }
});

loadStatistics();