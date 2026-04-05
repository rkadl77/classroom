let teamMembers = [];
let currentTask = null;

function loadTaskFromStorage() {
    const savedTask = localStorage.getItem('currentTask');
    if (savedTask) {
        currentTask = JSON.parse(savedTask);
        teamMembers = currentTask.members || ['Анна Кузнецова', 'Дмитрий Волков'];
        
        const taskInfo = document.getElementById('taskNamePlaceholder');
        if (taskInfo) {
            taskInfo.innerHTML = `📋 Текущая задача: <strong>${currentTask.title || 'Без названия'}</strong> | Участников: ${teamMembers.length}`;
        }
    } else {
        teamMembers = ['Анна Кузнецова', 'Дмитрий Волков'];
        const taskInfo = document.getElementById('taskNamePlaceholder');
        if (taskInfo) {
            taskInfo.innerHTML = `⚠️ Нет активной задачи. Сначала создайте задачу в F1.`;
        }
    }
    
    updateMembersList();
    updateRotationQueue();
}

function updateMembersList() {
    const container = document.getElementById('membersList');
    if (!container) return;
    
    container.innerHTML = '';
    teamMembers.forEach((member, index) => {
        const div = document.createElement('div');
        div.className = 'member-radio';
        div.innerHTML = `
            <input type="radio" name="selectedLeader" value="${member}" id="leader_${index}">
            <span>👑 ${member}</span>
        `;
        container.appendChild(div);
    });
}

function updateRotationQueue() {
    const queueElem = document.getElementById('rotationQueue');
    if (queueElem && teamMembers.length > 0) {
        queueElem.textContent = teamMembers.join(' → ') + ' → ' + teamMembers[0];
    } else if (queueElem) {
        queueElem.textContent = 'нет участников';
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

const autoSettings = document.getElementById('autoSettings');
const manualSettings = document.getElementById('manualSettings');
const voteSettings = document.getElementById('voteSettings');
const rotationSettings = document.getElementById('rotationSettings');

const radioButtons = document.querySelectorAll('input[name="leaderType"]');
radioButtons.forEach(radio => {
    radio.addEventListener('change', (e) => {
        autoSettings.style.display = 'none';
        manualSettings.style.display = 'none';
        voteSettings.style.display = 'none';
        rotationSettings.style.display = 'none';
        
        if (e.target.value === 'auto') autoSettings.style.display = 'block';
        if (e.target.value === 'manual') manualSettings.style.display = 'block';
        if (e.target.value === 'vote') voteSettings.style.display = 'block';
        if (e.target.value === 'rotation') rotationSettings.style.display = 'block';
        
        updatePreview();
    });
});

function updatePreview() {
    const selectedType = document.querySelector('input[name="leaderType"]:checked').value;
    const previewResult = document.getElementById('previewResult');
    
    let leaderName = '';
    let methodDesc = '';
    
    switch(selectedType) {
        case 'auto':
            let selectedMember = teamMembers[0];
            if (document.getElementById('criteriaExperience').checked) {
                selectedMember = teamMembers[0];
            }
            leaderName = selectedMember;
            methodDesc = 'Автоматический выбор по критериям';
            break;
            
        case 'manual':
            const selectedRadio = document.querySelector('input[name="selectedLeader"]:checked');
            leaderName = selectedRadio ? selectedRadio.value : 'не выбран';
            methodDesc = 'Ручной выбор лидера';
            break;
            
        case 'vote':
            leaderName = 'будет определён голосованием';
            methodDesc = `Голосование (${document.getElementById('voteDuration').value} ч.)`;
            break;
            
        case 'rotation':
            leaderName = teamMembers[0] || 'нет участников';
            methodDesc = `Ротация каждые ${document.getElementById('rotationDays').value} дн.`;
            break;
    }
    
    if (leaderName === 'не выбран') {
        previewResult.innerHTML = '<div class="preview-placeholder">❌ Выберите лидера из списка</div>';
    } else {
        previewResult.innerHTML = `
            <div class="preview-leader">
                <div class="preview-leader-icon">👑</div>
                <div>
                    <div class="preview-leader-name">${leaderName}</div>
                    <div class="preview-leader-method">${methodDesc}</div>
                </div>
            </div>
        `;
    }
}

document.getElementById('previewBtn')?.addEventListener('click', updatePreview);

document.getElementById('resetBtn')?.addEventListener('click', () => {
    document.querySelector('input[value="auto"]').checked = true;
    autoSettings.style.display = 'block';
    manualSettings.style.display = 'none';
    voteSettings.style.display = 'none';
    rotationSettings.style.display = 'none';
    
    document.getElementById('criteriaExperience').checked = true;
    document.getElementById('criteriaLoad').checked = true;
    document.getElementById('criteriaTasks').checked = true;
    document.getElementById('criteriaSeniority').checked = false;
    
    document.getElementById('voteDuration').value = '24';
    document.getElementById('voteAnonymous').checked = true;
    document.getElementById('voteMajority').checked = true;
    
    document.getElementById('rotationDays').value = '7';
    document.getElementById('rotationTasks').value = '3';
    
    document.getElementById('powerAssign').checked = true;
    document.getElementById('powerDeadline').checked = true;
    document.getElementById('powerApprove').checked = true;
    document.getElementById('powerKick').checked = false;
    
    updatePreview();
    showToast('Настройки сброшены', 1200);
});

document.getElementById('leaderForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!currentTask) {
        showToast('❌ Нет активной задачи. Сначала создайте задачу в F1', 2500);
        return;
    }
    
    const selectedType = document.querySelector('input[name="leaderType"]:checked').value;
    let leaderName = '';
    
    if (selectedType === 'manual') {
        const selectedRadio = document.querySelector('input[name="selectedLeader"]:checked');
        if (!selectedRadio) {
            showToast('❌ Выберите лидера из списка', 1500);
            return;
        }
        leaderName = selectedRadio.value;
    } else if (selectedType === 'auto') {
        leaderName = teamMembers[0];
    } else if (selectedType === 'vote') {
        leaderName = 'будет определён голосованием';
    } else if (selectedType === 'rotation') {
        leaderName = teamMembers[0] + ' (первый в очереди)';
    }
    
    const leaderSettings = {
        taskId: currentTask.id || Date.now(),
        taskTitle: currentTask.title,
        leaderType: selectedType,
        leaderName: leaderName,
        criteria: {
            experience: document.getElementById('criteriaExperience')?.checked,
            load: document.getElementById('criteriaLoad')?.checked,
            tasks: document.getElementById('criteriaTasks')?.checked,
            seniority: document.getElementById('criteriaSeniority')?.checked
        },
        voteDuration: document.getElementById('voteDuration')?.value,
        voteAnonymous: document.getElementById('voteAnonymous')?.checked,
        voteMajority: document.getElementById('voteMajority')?.checked,
        rotationDays: document.getElementById('rotationDays')?.value,
        rotationTasks: document.getElementById('rotationTasks')?.value,
        powers: {
            assign: document.getElementById('powerAssign')?.checked,
            deadline: document.getElementById('powerDeadline')?.checked,
            approve: document.getElementById('powerApprove')?.checked,
            kick: document.getElementById('powerKick')?.checked
        },
        appliedAt: new Date().toLocaleString()
    };
    
    localStorage.setItem('currentLeader', JSON.stringify(leaderSettings));
    
    let leaders = JSON.parse(localStorage.getItem('leaders') || '[]');
    leaders.push(leaderSettings);
    localStorage.setItem('leaders', JSON.stringify(leaders));
    
    console.log('✅ Лидер назначен:', leaderSettings);
    showToast(`👑 Лидер (${selectedType}) назначен для задачи "${currentTask.title}"`, 2500);
});

document.querySelectorAll('#voteDuration, #rotationDays, .checkbox-label input').forEach(el => {
    el?.addEventListener('change', updatePreview);
});

document.getElementById('membersList')?.addEventListener('change', updatePreview);

loadTaskFromStorage();
updatePreview();