// 1. 初始化 Supabase 客户端 (请确保 Supabase SDK 已在此脚本之前加载)
const _SUPABASE_URL = 'https://psvxbzkuqdpgzgmthdte.supabase.co';
const _SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzdnhiemt1cWRwZ3pnbXRoZHRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNTI1ODEsImV4cCI6MjA4MDYyODU4MX0.Oyso8hOwbfCs7QlRGwW9LEbBhLTSM-Vhn_-7RAUa418';
const _supabase = window.supabase.createClient(_SUPABASE_URL, _SUPABASE_KEY);

// 2. 立即执行的异步函数，用于检查访问权限
(async function checkAccess()
{
    // A. 检查用户是否已登录
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session)
    {
        alert("未登录，请先登录！");
        window.location.href = "../index.html"; // 跳转回主页
        return;
    }

    // B. 检查用户是否为 VIP (防止直接访问 URL)
    const { data: profile } = await _supabase
        .from('profiles')
        .select('is_vip, active_token')
        .eq('id', session.user.id)
        .single();

    if (!profile || !profile.is_vip)
    {
        alert("您尚未激活，无法进入实验！");
        window.location.href = "../index.html";
        return;
    }

    // C. 检查会话令牌，实现设备互踢
    const localToken = localStorage.getItem('bio_session_token');
    if (profile.active_token && profile.active_token !== localToken)
    {
        alert("您的账号已在其他设备登录，您已被强制下线。");
        await _supabase.auth.signOut(); // 退出当前设备
        window.location.href = "../index.html";
    }
})();