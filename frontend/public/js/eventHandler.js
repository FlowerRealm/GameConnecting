/**
 * 通用事件处理模块
 * 合并了多个模块中相似的事件处理函数
 */

/**
 * 通用模态框管理
 */
export const modalHandler = {
    /**
     * 显示模态框
     * @param {string} modalId - 模态框ID
     * @param {Object} data - 要传递给模态框的数据
     */
    show(modalId, data = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // 设置数据
        if (data) {
            Object.entries(data).forEach(([key, value]) => {
                modal.dataset[key] = value;
            });
        }

        // 显示模态框
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');

        // 添加点击外部关闭事件
        modal.addEventListener('click', this.handleOutsideClick);
    },

    /**
     * 关闭模态框
     * @param {string} modalId - 模态框ID
     */
    close(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // 关闭模态框
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');

        // 清除数据
        Array.from(modal.attributes)
            .filter(attr => attr.name.startsWith('data-'))
            .forEach(attr => {
                if (attr.name !== 'data-id') {
                    modal.removeAttribute(attr.name);
                }
            });

        // 移除点击外部关闭事件
        modal.removeEventListener('click', this.handleOutsideClick);
    },

    /**
     * 处理点击模态框外部关闭
     * @param {Event} event - 点击事件
     */
    handleOutsideClick(event) {
        if (event.target === event.currentTarget) {
            event.currentTarget.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    }
};

/**
 * 通用表单处理
 */
export const formHandler = {
    /**
     * 处理表单提交
     * @param {Event} event - 表单提交事件
     * @param {Function} submitCallback - 提交回调函数
     */
    handleSubmit(event, submitCallback) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const data = {};

        // 收集表单数据
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }

        // 调用回调处理提交
        if (typeof submitCallback === 'function') {
            submitCallback(data);
        }
    },

    /**
     * 重置表单
     * @param {string} formId - 表单ID
     */
    resetForm(formId) {
        const form = document.getElementById(formId);
        if (form) form.reset();
    },

    /**
     * 填充表单数据
     * @param {string} formId - 表单ID
     * @param {Object} data - 要填充的数据
     */
    fillForm(formId, data) {
        const form = document.getElementById(formId);
        if (!form || !data) return;

        Object.entries(data).forEach(([key, value]) => {
            const field = form.elements[key];
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = !!value;
                } else {
                    field.value = value || '';
                }
            }
        });
    }
};

/**
 * 通用标签页处理
 */
export const tabHandler = {
    /**
     * 初始化标签页
     * @param {string} tabContainerSelector - 标签页容器选择器
     * @param {Object} tabCallbacks - 标签页回调函数 {tabName: callback}
     */
    init(tabContainerSelector, tabCallbacks = {}) {
        const container = document.querySelector(tabContainerSelector);
        if (!container) return;

        const tabButtons = container.querySelectorAll('.tab-button');

        tabButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                this.switchTab(event, tabCallbacks);
            });
        });
    },

    /**
     * 切换标签页
     * @param {Event} event - 点击事件
     * @param {Object} tabCallbacks - 标签页回调函数
     */
    switchTab(event, tabCallbacks = {}) {
        const clickedTab = event.target;
        const tabName = clickedTab.dataset.tab;
        const container = clickedTab.closest('.tabs-container');

        if (!container) return;

        // 移除所有标签页的active类
        container.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('active');
        });

        // 隐藏所有内容区域
        container.querySelectorAll('.tab-content > div').forEach(content => {
            content.classList.remove('active');
        });

        // 激活当前标签页
        clickedTab.classList.add('active');

        // 显示对应内容
        const targetContent = container.querySelector(`[data-tab-content="${tabName}"]`);
        if (targetContent) {
            targetContent.classList.add('active');
        }

        // 调用回调
        if (tabCallbacks[tabName] && typeof tabCallbacks[tabName] === 'function') {
            tabCallbacks[tabName]();
        }
    }
};

/**
 * 通用列表处理
 */
export const listHandler = {
    /**
     * 渲染空状态
     * @param {string} containerId - 容器ID
     * @param {string} message - 空状态消息
     * @param {string} icon - 图标类名
     */
    renderEmpty(containerId, message = '暂无数据', icon = 'fa-info-circle') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="empty-state">
                <i class="fas ${icon}"></i>
                <p>${message}</p>
            </div>
        `;
    }
};