import { store } from './store.js';
import { config } from './config.js'; // Added import
import { AuthManager } from './auth.js'; // Added import

export class ErrorHandler {
    static handleApiError(error, context = '') {

        let message = '操作失败';
        let type = 'error';

        if (error.statusCode === 401 || error.statusCode === 403) {
            message = '登录已过期，请重新登录';
            // 清除认证信息
            localStorage.removeItem('gameconnecting_token');
            localStorage.removeItem('gameconnecting_username');
        } else if (error.statusCode === 404) {
            message = '请求的资源不存在';
        } else if (error.statusCode === 429) {
            message = '请求过于频繁，请稍后再试';
            type = 'warning';
        } else if (error.statusCode >= 500) {
            message = '服务器暂时不可用，请稍后再试';
        }

        if (error.message) {
            message = error.message;
        }

        store.addNotification(message, type);
        store.setState('error', {
            message,
            context,
            timestamp: new Date()
        });
    }

    static handleSocketError(error, context = '') {
        let message = '连接错误';
        let type = 'error';

        if (error.message === '认证失败' || error.data?.message === '认证失败') {
            message = '会话已过期，请重新登录';
            // Use AuthManager to clear data and notify, then redirect
            AuthManager.getInstance().logout(); // Use AuthManager to clear data and notify
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        } else if (error.message === '连接超时') {
            message = '连接超时，正在重试...';
            type = 'warning';
        }

        store.addNotification(message, type);
        store.setState('connectionStatus', 'error');
    }

    static handleValidationError(errors, context = '') {
        const message = Array.isArray(errors)
            ? errors[0]?.message || '输入验证失败'
            : errors.message || '输入验证失败';
        store.addNotification(message, 'warning');
    }

    static handleUnexpectedError(error, context = '') {
        const message = config.isDevelopment
            ? `错误: ${error.message}\n堆栈: ${error.stack}`
            : '发生了意外错误，请刷新页面重试';

        store.addNotification(message, 'error');

        if (config.isDevelopment) {
            console.error('完整错误信息:', {
                error,
                context,
                time: new Date().toISOString(),
                url: window.location.href
            });
        }
    }
}
window.onerror = function (message, source, lineno, colno, error) {
    ErrorHandler.handleUnexpectedError(error || message, 'window.onerror');
    return false;
};

window.onunhandledrejection = function (event) {
    ErrorHandler.handleUnexpectedError(event.reason, 'unhandledRejection');
};
