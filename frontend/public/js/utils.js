export function showNotification(message, type = 'info') {
    const existingMessage = document.querySelector('.message-banner');
    if (existingMessage) {
        existingMessage.remove();
    }
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-banner ${type}`;
    messageDiv.textContent = message;

    const container = document.querySelector('.admin-container') || document.body;
    container.insertAdjacentElement('afterbegin', messageDiv);

    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => messageDiv.remove(), 500);
    }, 3000);
}

export function renderPagination(total, currentPage, totalPages, changePageCallback) {
    const pagination = document.getElementById('serverListPagination'); // Specific ID for server management
    if (!pagination) return;

    if (total <= 0 || totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '<div class="pagination">';

    html += `<button class="pagination-button ${currentPage === 1 ? 'disabled' : ''}"
            ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
            <i class="fas fa-chevron-left"></i> 上一页
            </button>`;

    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="pagination-button ${i === currentPage ? 'active' : ''}"
                data-page="${i}">${i}</button>`;
    }

    html += `<button class="pagination-button ${currentPage === totalPages ? 'disabled' : ''}"
            ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
            下一页 <i class="fas fa-chevron-right"></i>
            </button>`;

    html += '</div>';
    html += `<div class="pagination-info">第 ${currentPage}/${totalPages} 页，共 ${total} 条记录</div>`;

    pagination.innerHTML = html;

    const buttons = pagination.querySelectorAll('.pagination-button:not([disabled])');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const page = parseInt(button.dataset.page);
            if (page && page !== currentPage) {
                changePageCallback(page);
            }
        });
    });
}

/**
 * 格式化日期时间
 * @param {string|Date} date - 日期对象或日期字符串
 * @returns {string} 格式化后的日期字符串
 */
export function formatDateTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('zh-CN');
}

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间(毫秒)
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * 节流函数
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 限制时间(毫秒)
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit = 300) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}