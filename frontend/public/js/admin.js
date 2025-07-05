import { AuthManager } from './auth.js';
import { apiService } from './apiService.js';
import { initNavbar } from './navbar.js';
import { renderUsers, closeModal, handleReview } from './userReview.js';
import { showNotification, renderPagination } from './utils.js';

const auth = AuthManager.getInstance();

// 添加缓存管理
const cache = {
    data: new Map(),
    timeouts: new Map(),

    set(key, value, ttl = 30000) {
        this.data.set(key, value);

        // 清除旧的超时
        if (this.timeouts.has(key)) {
            clearTimeout(this.timeouts.get(key));
        }

        // 设置新的超时
        const timeout = setTimeout(() => {
            this.data.delete(key);
            this.timeouts.delete(key);
        }, ttl);

        this.timeouts.set(key, timeout);
    },

    get(key) {
        return this.data.get(key);
    },

    clear(prefix = '') {
        if (prefix) {
            // 清除特定前缀的缓存
            for (const [key] of this.data) {
                if (key.startsWith(prefix)) {
                    this.data.delete(key);
                    if (this.timeouts.has(key)) {
                        clearTimeout(this.timeouts.get(key));
                        this.timeouts.delete(key);
                    }
                }
            }
        } else {
            // 清除所有缓存
            this.data.clear();
            for (const timeout of this.timeouts.values()) {
                clearTimeout(timeout);
            }
            this.timeouts.clear();
        }
    }
};

async function ensureAuth() {
    if (!auth.isAuthenticated() || !auth.isAdmin()) {
        window.location.href = '/';
        return false;
    }
    return true;
}

let currentTab = 'pending';
let currentPage = 1;
const limit = 10;

document.addEventListener('DOMContentLoaded', async () => {
    if (!await ensureAuth()) {
        return;
    }
    initNavbar();

    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            currentTab = button.dataset.tab;
            currentPage = 1;
            loadData();
        });
    });

    loadData();

    window.closeModal = closeModal;
    document.getElementById('rejectReviewBtn').addEventListener('click', () => handleReview('rejected', loadData));
    document.getElementById('approveReviewBtn').addEventListener('click', () => handleReview('approved', loadData));
    window.changePage = (page) => {
        if (page < 1) return;
        currentPage = page;
        loadData();
    };
});

async function loadData() {
    try {
        const cacheKey = `${currentTab}_${currentPage}_${limit}`;
        const cachedData = cache.get(cacheKey);

        if (cachedData) {
            if (currentTab === 'pending' || currentTab === 'all') {
                renderUsers(cachedData.data.data || cachedData.data, currentTab, limit);
            }
            return;
        }

        let response;
        if (currentTab === 'pending') {
            response = await apiService.request(`/admin/users?status=pending&page=${currentPage}&limit=${limit}`);
        } else if (currentTab === 'all') {
            response = await apiService.request(`/admin/users?page=${currentPage}&limit=${limit}`); // 确保请求路径是 /admin/users
        } else {
            console.error('Unknown tab:', currentTab);
            showNotification('未知标签页', 'error');
            return;
        }

        if (response.success && response.data) {
            // 缓存响应数据
            cache.set(cacheKey, response, 30000); // 30秒缓存

            if (currentTab === 'pending' || currentTab === 'all') {
                renderUsers(response.data.data || response.data, currentTab, limit);
            }
        } else if (response) {
            showNotification(response.message || `获取${currentTab}列表失败`, 'error');
        } else if (currentTab !== 'orgs') {
            showNotification(`获取${currentTab}列表失败`, 'error');
        }
    } catch (error) {
        console.error(`Error loading data for tab ${currentTab}:`, error);
        showNotification(`加载${currentTab}列表失败: ${error.message}`, 'error');
    }
}

export async function updateUser(userId, status, role, password) {
    try {
        console.log('[updateUser] userId:', userId, 'status:', status, 'role:', role, 'password:', password);
        if (status) {
            const statusResult = await apiService.request(
                `/admin/users/${userId}/status`,
                { method: 'PUT', body: JSON.stringify({ status }) }
            );
            console.log('[updateUser] statusResult:', statusResult);
            if (!statusResult.success) {
                showNotification('用户状态更新失败', 'error');
                return;
            }
        }

        if (role) {
            const roleResult = await apiService.request(
                `/admin/users/${userId}/role`,
                { method: 'PUT', body: JSON.stringify({ role }) }
            );
            console.log('[updateUser] roleResult:', roleResult);
            if (!roleResult.success) {
                showNotification('用户角色更新失败', 'error');
                return;
            }
        }

        if (password && password.length >= 6) {
            const pwdResult = await apiService.request(
                `/admin/users/${userId}/password`,
                { method: 'PUT', body: JSON.stringify({ password }) }
            );
            console.log('[updateUser] pwdResult:', pwdResult);
            if (!pwdResult.success) {
                showNotification('密码重置失败', 'error');
                return;
            }
        }

        showNotification('用户信息更新成功', 'success');
        loadData(); // 刷新用户列表
    } catch (error) {
        console.error('更新用户信息失败:', error);
        showNotification('更新用户信息失败: ' + error.message, 'error');
    }
}

// 导出缓存清理函数，供其他模块使用
export function clearCache(prefix = '') {
    cache.clear(prefix);
}