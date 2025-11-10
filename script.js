const API_BASE = 'http://127.0.0.1:5000/api/contacts';

let allContacts = [];
let filteredContacts = [];

// 页面加载时获取联系人列表
document.addEventListener('DOMContentLoaded', loadContacts);

// 加载联系人列表
async function loadContacts() {
    showLoading();
    try {
        const response = await fetch(API_BASE);
        allContacts = await response.json();
        filteredContacts = [...allContacts];
        displayContacts(filteredContacts);
        updateContactsCount();
    } catch (error) {
        console.error('加载联系人失败:', error);
        showError('加载联系人失败，请检查后端服务是否运行');
    }
}

// 显示加载状态
function showLoading() {
    const container = document.getElementById('contacts-container');
    container.innerHTML = `
        <div class="loading-message">
            <i class="fas fa-spinner fa-spin"></i>
            <p>加载中...</p>
        </div>
    `;
}

// 显示错误信息
function showError(message) {
    const container = document.getElementById('contacts-container');
    container.innerHTML = `
        <div class="empty-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
            <button class="secondary-btn" onclick="loadContacts()">
                <i class="fas fa-redo"></i> 重新加载
            </button>
        </div>
    `;
}

// 显示联系人列表
function displayContacts(contacts) {
    const container = document.getElementById('contacts-container');
    
    if (contacts.length === 0) {
        const searchInput = document.getElementById('search-input').value;
        if (searchInput) {
            container.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-search"></i>
                    <p>没有找到匹配的联系人</p>
                    <button class="secondary-btn" onclick="clearSearch()">
                        <i class="fas fa-times"></i> 清除搜索
                    </button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-address-book"></i>
                    <p>暂无联系人，请添加第一个联系人</p>
                </div>
            `;
        }
        return;
    }

    container.innerHTML = contacts.map(contact => `
        <div class="contact-item" data-id="${contact.id}">
            <div class="contact-info">
                <h4>${contact.name}</h4>
                <p><i class="fas fa-phone"></i> ${contact.phone}</p>
                ${contact.email ? `<p><i class="fas fa-envelope"></i> ${contact.email}</p>` : ''}
                <p><i class="fas fa-calendar"></i> 创建时间: ${formatDate(contact.created_at)}</p>
            </div>
            <div class="contact-actions">
                <button class="edit-btn" onclick="editContact(${contact.id})">
                    <i class="fas fa-edit"></i> 编辑
                </button>
                <button class="delete-btn" onclick="deleteContact(${contact.id})">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </div>
        </div>
    `).join('');
}

// 搜索联系人
function searchContacts() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const statsElement = document.getElementById('search-stats');
    
    if (searchTerm === '') {
        filteredContacts = [...allContacts];
        statsElement.textContent = '';
    } else {
        filteredContacts = allContacts.filter(contact => 
            contact.name.toLowerCase().includes(searchTerm) ||
            contact.phone.includes(searchTerm) ||
            (contact.email && contact.email.toLowerCase().includes(searchTerm))
        );
        statsElement.textContent = `找到 ${filteredContacts.length} 个匹配的联系人`;
    }
    
    displayContacts(filteredContacts);
    updateContactsCount();
}

// 清除搜索
function clearSearch() {
    document.getElementById('search-input').value = '';
    document.getElementById('search-stats').textContent = '';
    filteredContacts = [...allContacts];
    displayContacts(filteredContacts);
    updateContactsCount();
}

// 更新联系人计数
function updateContactsCount() {
    const countElement = document.getElementById('contacts-count');
    const totalCount = allContacts.length;
    const showingCount = filteredContacts.length;
    
    if (showingCount === totalCount) {
        countElement.textContent = totalCount;
    } else {
        countElement.textContent = `${showingCount}/${totalCount}`;
    }
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return '未知';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 添加联系人
async function addContact() {
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!name || !phone) {
        showNotification('姓名和电话为必填项', 'warning');
        return;
    }

    try {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                phone: phone,
                email: email
            })
        });

        if (response.ok) {
            // 清空表单
            document.getElementById('name').value = '';
            document.getElementById('phone').value = '';
            document.getElementById('email').value = '';
            
            // 重新加载列表
            await loadContacts();
            showNotification('联系人添加成功！', 'success');
        } else {
            showNotification('添加联系人失败', 'error');
        }
    } catch (error) {
        console.error('添加联系人失败:', error);
        showNotification('添加联系人失败，请检查网络连接', 'error');
    }
}

// 删除联系人
async function deleteContact(id) {
    const contact = allContacts.find(c => c.id === id);
    if (!contact) return;

    if (!confirm(`确定要删除联系人 "${contact.name}" 吗？此操作不可撤销。`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadContacts();
            showNotification('联系人删除成功！', 'success');
        } else {
            showNotification('删除联系人失败', 'error');
        }
    } catch (error) {
        console.error('删除联系人失败:', error);
        showNotification('删除联系人失败', 'error');
    }
}

// 编辑联系人
async function editContact(id) {
    const contact = allContacts.find(c => c.id === id);
    if (!contact) return;

    const newName = prompt('请输入新的姓名：', contact.name);
    if (!newName) return;

    const newPhone = prompt('请输入新的电话：', contact.phone);
    if (!newPhone) return;

    const newEmail = prompt('请输入新的邮箱：', contact.email || '');

    try {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: newName,
                phone: newPhone,
                email: newEmail
            })
        });

        if (response.ok) {
            await loadContacts();
            showNotification('联系人更新成功！', 'success');
        } else {
            showNotification('更新联系人失败', 'error');
        }
    } catch (error) {
        console.error('更新联系人失败:', error);
        showNotification('更新联系人失败', 'error');
    }
}

// 显示通知
function showNotification(message, type = 'info') {
    // 简单的alert替代，你可以在这里添加更漂亮的Toast通知
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    alert(`${icons[type] || ''} ${message}`);
}