let editId = null;
let countdownIntervals = {}; // 用于存储倒计时定时器的引用

// 自定义时间格式化函数，将时间转换为本地时间
function toLocalISOString(date) {
    const offset = date.getTimezoneOffset() * 60000; // 获取时区偏移（毫秒）
    const localTime = new Date(date.getTime() - offset); // 转换为本地时间
    return localTime.toISOString().slice(0, 16); // 返回 YYYY-MM-DDTHH:mm 格式
}

// 计算释放时间
function calcReleaseTime() {
    const startTime = new Date(document.getElementById('startTime').value);
    const duration = parseInt(document.querySelector('input[name="duration"]:checked').value);
    const releaseTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
    document.getElementById('releaseTime').value = toLocalISOString(releaseTime); // 使用本地时间
}

// 增加时长
function addDuration(hours) {
    const releaseTime = new Date(document.getElementById('releaseTime').value);
    releaseTime.setTime(releaseTime.getTime() + hours * 60 * 60 * 1000); // 修复：正确增加时间
    document.getElementById('releaseTime').value = toLocalISOString(releaseTime); // 使用本地时间
    refreshDashboard(); // 更新释放时间后刷新看板
}

// 保存记录
function saveRecord() {
    const record = {
        id: editId || Date.now(),
        name: document.getElementById('studentName').value,
        type: document.getElementById('offenseType').value,
        start: document.getElementById('startTime').value,
        release: document.getElementById('releaseTime').value,
        status: 'active'
    };

    fetch('/api/records', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(record)
    })
    .then(response => response.text())
    .then(() => {
        closeForm();
        refreshDashboard();
    })
    .catch(error => console.error('Error:', error));
}

// 刷新看板
function refreshDashboard() {
    const dashboardBody = document.querySelector('#dashboard tbody');
    dashboardBody.innerHTML = '';

    fetch('/api/records')
        .then(response => response.json())
        .then(records => {
            const now = new Date();

            // 按状态排序，已领取的排在最后
            records.sort((a, b) => (a.status === 'released' ? 1 : -1));

            records.forEach(record => {
                const releaseTime = new Date(record.release);
                const row = document.createElement('tr');
                row.className = record.status === 'released' ? 'released' : releaseTime < now ? 'overdue' : '';

                // 处理姓名显示
                const fullName = record.name; // 显示完整的姓名

                row.innerHTML = `
                    <td>${fullName}</td>
                    <td>${record.type}</td>
                    <td>${new Date(record.start).toLocaleString()}</td>
                    <td>${releaseTime.toLocaleString()}</td>
                    <td id="remainingTime-${record.id}">${record.status === 'active' ? `${Math.ceil((releaseTime - now) / 3600000)}小时` : ''}</td>
                    <td>
                        ${isAdmin ? `
                            <button class="edit-btn" onclick="showRecordForm(${record.id})">编辑</button>
                            <button class="delete-btn" onclick="deleteRecord(${record.id})">删除</button>
                            ${record.status === 'active' ? `<button onclick="markReleased(${record.id})">标记领取</button>` : ''}
                        ` : ''}
                    </td>
                `;

                dashboardBody.appendChild(row);

                // 设置倒计时
                if (record.status === 'active') {
                    if (countdownIntervals[record.id]) {
                        clearInterval(countdownIntervals[record.id]);
                    }
                    countdownIntervals[record.id] = setInterval(() => {
                        const now = new Date();
                        const remainingTime = releaseTime - now;
                        if (remainingTime <= 0) {
                            document.getElementById(`remainingTime-${record.id}`).innerText = '待出狱';
                            clearInterval(countdownIntervals[record.id]);
                        } else {
                            const hours = Math.floor(remainingTime / 3600000);
                            const minutes = Math.floor((remainingTime % 3600000) / 60000);
                            const seconds = Math.floor((remainingTime % 60000) / 1000);
                            document.getElementById(`remainingTime-${record.id}`).innerText = `${hours}小时${minutes}分${seconds}秒`;
                        }
                    }, 1000);
                }
            });
        })
        .catch(error => console.error('Error:', error));
}

// 删除记录
function deleteRecord(id) {
    if (!isAdmin) {
        alert("请先登录！");
        return;
    }

    fetch(`/api/records/${id}`, {
        method: 'DELETE'
    })
    .then(response => response.text())
    .then(() => {
        refreshDashboard();
    })
    .catch(error => console.error('Error:', error));
}

// 标记为已领取
function markReleased(id) {
    if (!isAdmin) {
        alert("请先登录！");
        return;
    }

    fetch('/api/records')
        .then(response => response.json())
        .then(records => {
            const record = records.find(r => r.id === id);
            record.status = 'released';

            fetch('/api/records', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(record)
            })
            .then(response => response.text())
            .then(() => {
                refreshDashboard();
            })
            .catch(error => console.error('Error:', error));
        })
        .catch(error => console.error('Error:', error));
}

// 显示表单
function showRecordForm(id) {
    if (!isAdmin) return;

    // 设置开始时间为当前本地时间
    document.getElementById('startTime').value = toLocalISOString(new Date());
    document.getElementById('duration24').checked = true; // 默认选择24小时
    calcReleaseTime(); // 计算释放时间

    if (id) {
        fetch('/api/records')
            .then(response => response.json())
            .then(records => {
                const record = records.find(r => r.id === id);
                document.getElementById('studentName').value = record.name;
                document.getElementById('offenseType').value = record.type;
                document.getElementById('startTime').value = toLocalISOString(new Date(record.start));
                document.getElementById('releaseTime').value = toLocalISOString(new Date(record.release));
                editId = id;
            })
            .catch(error => console.error('Error:', error));
    } else {
        document.getElementById('studentName').value = '';
        document.getElementById('offenseType').value = '出勤';
        editId = null;
    }

    document.getElementById('recordForm').style.display = 'block';
}

// 关闭表单
function closeForm() {
    document.getElementById('recordForm').style.display = 'none';
}

// 初始化
setInterval(refreshDashboard, 60000); // 每分钟刷新
refreshDashboard();