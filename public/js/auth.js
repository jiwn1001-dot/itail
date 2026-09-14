// ===== Auth Logic =====

document.addEventListener('DOMContentLoaded', async () => {
  // 이미 인증됐으면 대시보드로
  try {
    const res = await fetch('/api/auth/check');
    const data = await res.json();
    if (data.authenticated) {
      window.location.href = '/dashboard';
      return;
    }
  } catch (e) { /* ignore */ }

  const form = document.getElementById('loginForm');
  const passwordInput = document.getElementById('password');
  const errorMsg = document.getElementById('errorMsg');
  const loginBtn = document.getElementById('loginBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.style.display = 'none';
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="spinner"></span> 확인 중...';

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput.value }),
      });

      if (res.ok) {
        window.location.href = '/dashboard';
      } else {
        const data = await res.json();
        errorMsg.textContent = data.error || '로그인에 실패했습니다';
        errorMsg.style.display = 'block';
        passwordInput.focus();
        passwordInput.select();
      }
    } catch (err) {
      errorMsg.textContent = '서버에 연결할 수 없습니다';
      errorMsg.style.display = 'block';
    } finally {
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<span>🔐</span> 로그인';
    }
  });

  passwordInput.focus();
});
