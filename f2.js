const form = document.getElementById('distributionForm');
const resetBtn = document.getElementById('resetBtn');
const previewBtn = document.getElementById('previewBtn');

const autoSettings = document.getElementById('autoSettings');
const manualSettings = document.getElementById('manualSettings');
const equalSettings = document.getElementById('equalSettings');

const autoStrategy = document.getElementById('autoStrategy');
const customWeightsPanel = document.getElementById('customWeightsPanel');
const weightsList = document.getElementById('weightsList');
const manualAssignmentList = document.getElementById('manualAssignmentList');
const equalPartsCount = document.getElementById('equalPartsCount');
const previewResult = document.getElementById('previewResult');

const prioritySpeed = document.getElementById('prioritySpeed');
const priorityQuality = document.getElementById('priorityQuality');
const priorityBalance = document.getElementById('priorityBalance');
const speedVal = document.getElementById('speedVal');
const qualityVal = document.getElementById('qualityVal');
const balanceVal = document.getElementById('balanceVal');
const priorityWarning = document.getElementById('priorityWarning');


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
    
    updateMembersLists();
    updateEqualParts();
}

function updateMembersLists() {
    if (weightsList) {
        weightsList.innerHTML = '';
        teamMembers.forEach(member => {
            const div = document.createElement('div');
            div.className = 'weight-item';
            div.innerHTML = `
                <span>${member}</span>
                <input type="range" min="0" max="100" value="50" class="member-weight" data-member="${member}">
                <span class="weight-value">50%</span>
            `;
            const range = div.querySelector('input');
            const valueSpan = div.querySelector('.weight-value');
            range.addEventListener('input', () => {
                valueSpan.textContent = range.value + '%';
                updatePreview();
            });
            weightsList.appendChild(div);
        });
    }

    if (manualAssignmentList) {
        manualAssignmentList.innerHTML = '';
        teamMembers.forEach(member => {
            const div = document.createElement('div');
            div.className = 'manual-item';
            div.innerHTML = `
                <input type="checkbox" class="assign-checkbox" data-member="${member}">
                <span>${member}</span>
            `;
            div.querySelector('input').addEventListener('change', () => updatePreview());
            manualAssignmentList.appendChild(div);
        });
    }
}

function updateEqualParts() {
    if (equalPartsCount) {
        equalPartsCount.textContent = teamMembers.length;
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

function updateSliderValues() {
    const speed = parseInt(prioritySpeed.value);
    const quality = parseInt(priorityQuality.value);
    const balance = parseInt(priorityBalance.value);
    
    speedVal.textContent = speed + '%';
    qualityVal.textContent = quality + '%';
    balanceVal.textContent = balance + '%';
    
    const sum = speed + quality + balance;
    if (sum !== 100) {
        priorityWarning.textContent = `⚠️ Сумма приоритетов = ${sum}%. Рекомендуется 100%`;
    } else {
        priorityWarning.textContent = '';
    }
    
    updatePreview();
}

prioritySpeed.addEventListener('input', updateSliderValues);
priorityQuality.addEventListener('input', updateSliderValues);
priorityBalance.addEventListener('input', updateSliderValues);

const radioButtons = document.querySelectorAll('input[name="distributionType"]');
radioButtons.forEach(radio => {
    radio.addEventListener('change', (e) => {
        autoSettings.style.display = 'none';
        manualSettings.style.display = 'none';
        equalSettings.style.display = 'none';
        
        if (e.target.value === 'auto') autoSettings.style.display = 'block';
        if (e.target.value === 'manual') manualSettings.style.display = 'block';
        if (e.target.value === 'equal') equalSettings.style.display = 'block';
        
        updatePreview();
    });
});

autoStrategy.addEventListener('change', (e) => {
    customWeightsPanel.style.display = e.target.value === 'custom' ? 'block' : 'none';
    updatePreview();
});

function updatePreview() {
    const selectedType = document.querySelector('input[name="distributionType"]:checked').value;
    
    let result = [];
    
    switch(selectedType) {
        case 'auto':
            const strategy = autoStrategy.value;
            if (strategy === 'custom') {
                const weights = [];
                document.querySelectorAll('.member-weight').forEach((input, idx) => {
                    weights.push({
                        name: teamMembers[idx],
                        weight: parseInt(input.value)
                    });
                });
                result = weights.map(w => ({ 
                    name: w.name, 
                    load: w.weight > 66 ? '🔴 Высокая нагрузка' : (w.weight > 33 ? '🟡 Средняя нагрузка' : '🟢 Низкая нагрузка')
                }));
            } else {
                result = teamMembers.map(m => ({ name: m, load: '📊 ~30% задачи' }));
            }
            break;
            
        case 'manual':
            const checkboxes = document.querySelectorAll('#manualAssignmentList .assign-checkbox');
            const checked = Array.from(checkboxes).filter(cb => cb.checked);
            if (checked.length === 0) {
                result = [];
            } else {
                result = checked.map(cb => {
                    const parent = cb.closest('.manual-item');
                    const name = parent.querySelector('span').textContent;
                    return { name: name, load: '✅ Назначен' };
                });
            }
            break;
            
        case 'equal':
            const percent = teamMembers.length ? Math.floor(100 / teamMembers.length) : 0;
            result = teamMembers.map(m => ({ name: m, load: `📋 ${percent}% задачи` }));
            break;
    }
    
    if (result.length === 0) {
        previewResult.innerHTML = '<div class="preview-placeholder">❌ Нет назначенных участников</div>';
    } else {
        previewResult.innerHTML = result.map(item => `
            <div class="preview-result-item">
                <span class="preview-member">👤 ${item.name}</span>
                <span class="preview-load">${item.load}</span>
            </div>
        `).join('');
    }
}

resetBtn.addEventListener('click', () => {
    document.querySelector('input[value="auto"]').checked = true;
    autoSettings.style.display = 'block';
    manualSettings.style.display = 'none';
    equalSettings.style.display = 'none';
    
    autoStrategy.value = 'balanced';
    customWeightsPanel.style.display = 'none';
    
    document.getElementById('maxTasksPerMember').value = '3';
    document.getElementById('maxHoursPerDay').value = '6';
    document.getElementById('requireApproval').checked = false;
    
    prioritySpeed.value = '30';
    priorityQuality.value = '50';
    priorityBalance.value = '20';
    updateSliderValues();
    
    updatePreview();
    showToast('Настройки сброшены', 1200);
});

previewBtn.addEventListener('click', () => {
    updatePreview();
    showToast('Предпросмотр обновлён', 1000);
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!currentTask) {
        showToast('❌ Нет активной задачи. Сначала создайте задачу в F1', 2500);
        return;
    }
    
    const selectedType = document.querySelector('input[name="distributionType"]:checked').value;
    
    const distributionSettings = {
        taskId: currentTask.id || Date.now(),
        taskTitle: currentTask.title,
        distributionType: selectedType,
        autoStrategy: selectedType === 'auto' ? autoStrategy.value : null,
        maxTasksPerMember: document.getElementById('maxTasksPerMember').value,
        maxHoursPerDay: document.getElementById('maxHoursPerDay').value,
        requireApproval: document.getElementById('requireApproval').checked,
        priorities: {
            speed: prioritySpeed.value,
            quality: priorityQuality.value,
            balance: priorityBalance.value
        },
        appliedAt: new Date().toLocaleString()
    };
    
    localStorage.setItem('currentDistribution', JSON.stringify(distributionSettings));
    
    let distributions = JSON.parse(localStorage.getItem('distributions') || '[]');
    distributions.push(distributionSettings);
    localStorage.setItem('distributions', JSON.stringify(distributions));
    
    console.log('✅ Настройки распределения сохранены:', distributionSettings);
    showToast(`✅ Распределение (${selectedType}) применено к задаче "${currentTask.title}"`, 2500);
});

loadTaskFromStorage();
updateSliderValues();
updatePreview();