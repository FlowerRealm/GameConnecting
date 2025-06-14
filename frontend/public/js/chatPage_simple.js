// 简化版本的chatPage.js，专门用于测试离开服务器功能

console.log('chatPage_simple.js 加载');

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded 事件触发');
    
    // 获取离开服务器按钮
    const leaveButton = document.getElementById('leaveServerButton');
    console.log('离开服务器按钮:', leaveButton);
    
    if (leaveButton) {
        leaveButton.addEventListener('click', async () => {
            console.log('离开服务器按钮被点击');
            
            const urlParams = new URLSearchParams(window.location.search);
            const serverId = urlParams.get('serverId');
            console.log('服务器ID:', serverId);
            
            if (serverId) {
                try {
                    console.log('发送离开服务器请求...');
                    const token = localStorage.getItem('token');
                    console.log('Token:', token ? '存在' : '不存在');
                    
                    const response = await fetch(`https://work-2-pstntnwvalrqqmrq.prod-runtime.all-hands.dev/servers/${serverId}/leave`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    console.log('响应状态:', response.status);
                    const result = await response.json();
                    console.log('API响应:', result);
                    
                    if (result.success) {
                        alert('成功离开服务器');
                        window.location.href = '/servers';
                    } else {
                        alert('离开服务器失败: ' + result.message);
                    }
                } catch (error) {
                    console.error('离开服务器失败:', error);
                    alert('离开服务器时出错: ' + error.message);
                }
            } else {
                console.log('没有服务器ID，直接跳转');
                window.location.href = '/servers';
            }
        });
        
        console.log('事件监听器已添加');
    } else {
        console.error('找不到离开服务器按钮');
    }
});