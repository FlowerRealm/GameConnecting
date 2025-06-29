import { AuthManager } from './auth.js';
import { apiService } from './apiService.js';
import { initNavbar } from './navbar.js';
import { renderUsers, closeModal, handleReview } from './userReview.js';
import { renderPendingOrgMemberships } from './orgMembership.js';
import { loadOrganizations, initOrgManagement } from './orgManagement.js';
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
    initOrgManagement();

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
            } else if (currentTab === 'org-pending') {
                renderPendingOrgMemberships(cachedData.data, renderPagination);
            }
            return;
        }

        let response;
        if (currentTab === 'pending') {
            response = await apiService.request('/admin/pending-users');
        } else if (currentTab === 'all') {
            response = await apiService.request(`/admin/users?page=${currentPage}&limit=${limit}`);
        } else if (currentTab === 'org-pending') {
            response = await apiService.request('/api/admin/organizations/pending-memberships', {
                params: { page: currentPage, limit: limit }
            });
        } else if (currentTab === 'orgs') {
            loadOrganizations();
            return;
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
            } else if (currentTab === 'org-pending') {
                renderPendingOrgMemberships(response.data, renderPagination);
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

// 导出缓存清理函数，供其他模块使用
export function clearCache(prefix = '') {
    cache.clear(prefix);
}