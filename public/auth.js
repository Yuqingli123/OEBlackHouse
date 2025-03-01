let currentPassword = "iris";
let isAdmin = false;

// 登录验证
function login() {
    if (document.getElementById('password').value === currentPassword) {
        isAdmin = true;
        document.getElementById('loginBox').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        refreshDashboard(); // 登录成功后刷新看板
    } else {
        alert("密码错误！");
    }
}

// 登出
function logout() {
    isAdmin = false;
    document.getElementById('loginBox').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    refreshDashboard(); // 登出后刷新看板
}