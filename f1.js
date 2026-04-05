const membersContainer = document.getElementById('membersListContainer');
const memberInput = document.getElementById('memberNameInput');
const addMemberBtn = document.getElementById('addMemberBtn');
const taskTitle = document.getElementById('taskTitle');
const taskDesc = document.getElementById('taskDesc');
const deadline = document.getElementById('deadline');
const priority = document.getElementById('priority');
const notifyCheck = document.getElementById('notifyTeam');
const subtaskCheck = document.getElementById('allowSubtasks');
const form = document.getElementById('groupTaskForm');
const resetBtn = document.getElementById('resetBtn');

const fileInput = document.getElementById('fileInput');
const fileTrigger = document.getElementById('fileTrigger');
const fileDropArea = document.getElementById('fileDropArea');
const filePreviewList = document.getElementById('filePreviewList');
let currentFiles = [];

function saveTaskToStorage(taskData) {
    localStorage.setItem('currentTask', JSON.stringify(taskData));
    
    let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    tasks.push(taskData);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('totalTasks', tasks.length);
    
    console.log('Задача сохранена:', taskData);
}

function updateFilePreview() {
    if (!filePreviewList) return;
    if (currentFiles.length === 0) {
        filePreviewList.innerHTML = '<span style="opacity:0.6;">Файлы не выбраны</span>';
        return;
    }
    filePreviewList.innerHTML = currentFiles.map((file, idx) => `
        <div class="file-badge">
            📄 ${file.name.length > 25 ? file.name.slice(0, 22)+'...' : file.name}
            <button type="button" data-idx="${idx}" style="background:none; border:none; color:#f87171; cursor:pointer;">✕</button>
        </div>
    `).join('');
    
    document.querySelectorAll('.file-badge button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = btn.getAttribute('data-idx');
            if (idx !== null) {
                currentFiles.splice(parseInt(idx), 1);
                updateFilePreview();
                const dataTransfer = new DataTransfer();
                currentFiles.forEach(f => dataTransfer.items.add(f));
                fileInput.files = dataTransfer.files;
            }
            e.stopPropagation();
        });
    });
}

function handleFiles(files) {
    if (!files) return;
    const fileArray = Array.from(files);
    fileArray.forEach(f => {
        if (!currentFiles.some(ex => ex.name === f.name && ex.size === f.size)) {
            currentFiles.push(f);
        }
    });
    updateFilePreview();
    const dataTransfer = new DataTransfer();
    currentFiles.forEach(f => dataTransfer.items.add(f));
    fileInput.files = dataTransfer.files;
}

fileTrigger.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

fileDropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileDropArea.style.borderColor = '#2dd4bf';
});
fileDropArea.addEventListener('dragleave', () => {
    fileDropArea.style.borderColor = '#475569';
});
fileDropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileDropArea.style.borderColor = '#475569';
    const dtFiles = e.dataTransfer.files;
    if (dtFiles.length) handleFiles(dtFiles);
});

function getMembersFromDOM() {
    const tags = membersContainer.querySelectorAll('.member-tag');
    return Array.from(tags).map(tag => tag.getAttribute('data-name') || tag.innerText.trim());
}

function addMember(name) {
    const trimmed = name.trim();
    if (!trimmed) return false;
    
    const exists = Array.from(membersContainer.querySelectorAll('.member-tag')).some(
        tag => (tag.getAttribute('data-name') || tag.innerText) === trimmed
    );
    if (exists) {
        showToast('⚠️ Участник уже добавлен', 1500);
        return false;
    }
    
    const memberDiv = document.createElement('div');
    memberDiv.className = 'member-tag';
    memberDiv.setAttribute('data-name', trimmed);
    const displayName = trimmed.length > 22 ? trimmed.slice(0, 20)+'..' : trimmed;
    memberDiv.innerHTML = `<span>👤 ${displayName}</span><button type="button" class="remove-member">✕</button>`;
    membersContainer.appendChild(memberDiv);
    memberInput.value = '';
    return true;
}

function removeMember(btnElement) {
    const tagDiv = btnElement.closest('.member-tag');
    if (tagDiv) tagDiv.remove();
}

membersContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-member')) {
        removeMember(e.target);
    }
});

addMemberBtn.addEventListener('click', () => {
    if (memberInput.value.trim()) {
        addMember(memberInput.value);
    } else {
        showToast('Введите имя участника', 1000);
    }
});

memberInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addMember(memberInput.value);
    }
});

function showToast(msg, duration = 2000) {
    const toast = document.getElementById('toastMessage');
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => {
        toast.style.opacity = '0';
    }, duration);
}

function collectFormData() {
    const title = taskTitle.value.trim();
    if (!title) {
        showToast('❌ Укажите название задачи', 1800);
        return null;
    }
    const members = getMembersFromDOM();
    if (members.length === 0) {
        showToast('❌ Добавьте хотя бы одного участника в групповую задачу', 2000);
        return null;
    }
    const data = {
        id: Date.now(),
        title: title,
        description: taskDesc.value,
        deadline: deadline.value || 'не указан',
        priority: priority.value,
        members: members,
        notify: notifyCheck.checked,
        allowSubtasks: subtaskCheck.checked,
        attachments: currentFiles.map(f => f.name),
        createdAt: new Date().toLocaleString()
    };
    return data;
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = collectFormData();
    if (formData) {
        saveTaskToStorage(formData);
        console.log('✅ Групповая задача создана:', formData);
        showToast(`🎉 Групповая задача "${formData.title}" создана! Участников: ${formData.members.length}`, 3000);
        form.style.transform = 'scale(1.01)';
        setTimeout(() => form.style.transform = '', 200);
    }
});

resetBtn.addEventListener('click', () => {
    taskTitle.value = '';
    taskDesc.value = '';
    deadline.value = '';
    priority.value = 'medium';
    notifyCheck.checked = false;
    subtaskCheck.checked = false;
    
    membersContainer.innerHTML = '';
    addMember('Анна Кузнецова');
    addMember('Дмитрий Волков');
    
    currentFiles = [];
    updateFilePreview();
    fileInput.value = '';
    showToast('Форма очищена', 1200);
});

updateFilePreview();
const today = new Date();
const future = new Date(today);
future.setDate(today.getDate() + 5);
if(deadline) deadline.value = future.toISOString().split('T')[0];