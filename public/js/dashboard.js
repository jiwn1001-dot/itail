// ===== Dashboard Logic =====

// Toast notification
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `${type === 'success' ? '✅' : '❌'} ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fadeOut');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Check auth
async function checkAuth() {
  try {
    const res = await fetch('/api/auth/check');
    const data = await res.json();
    if (!data.authenticated) {
      window.location.href = '/';
      return false;
    }
    return true;
  } catch (e) {
    window.location.href = '/';
    return false;
  }
}

// Power bar color
function getPowerColor(value) {
  if (value >= 80) return '#51cf66';
  if (value >= 60) return '#ffd43b';
  if (value >= 40) return '#ff922b';
  return '#ff6b6b';
}

// Format GDP
function formatGdp(gdp) {
  return `$${parseFloat(gdp).toFixed(1)}`;
}

// Load and render countries
async function loadCountries() {
  const grid = document.getElementById('countryGrid');
  const emptyState = document.getElementById('emptyState');

  try {
    const res = await fetch('/api/countries');
    if (!res.ok) throw new Error('Failed to load');
    const countries = await res.json();

    // Update stats
    document.getElementById('countryCount').textContent = countries.length;
    document.getElementById('avgStability').textContent =
      countries.length > 0
        ? Math.round(countries.reduce((sum, c) => sum + c.stability, 0) / countries.length)
        : '-';
    document.getElementById('topGdp').textContent =
      countries.length > 0
        ? formatGdp(Math.max(...countries.map(c => c.gdp)))
        : '-';

    // Count parties (we don't have this in list API, so estimate)
    document.getElementById('partyCount').textContent = '–';

    if (countries.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    grid.innerHTML = countries.map((c, i) => {
      const avgMilitary = Math.round((c.army_power + c.navy_power + c.airforce_power + c.nuclear_power) / 4);

      return `
        <div class="country-card" onclick="window.location.href='/edit/${c.id}'" style="--card-accent: ${c.color || '#5865F2'}; animation-delay: ${i * 0.05}s">
          <div class="country-card-header">
            <div class="country-flag">${c.flag_emoji || '🏳️'}</div>
            <div class="country-info">
              <h3>${c.name}</h3>
              <div class="leader">${c.leader_title || ''} ${c.leader_name || '미설정'}</div>
            </div>
          </div>

          <div class="country-stats">
            <div class="country-stat">
              <span class="stat-name">⚔️ 군사력 종합</span>
              <div class="stat-bar"><div class="stat-bar-fill" style="width:${avgMilitary}%; background:${getPowerColor(avgMilitary)}"></div></div>
              <span class="stat-num">${avgMilitary}/100</span>
            </div>
            <div class="country-stat">
              <span class="stat-name">📊 안정도</span>
              <div class="stat-bar"><div class="stat-bar-fill" style="width:${c.stability}%; background:${getPowerColor(c.stability)}"></div></div>
              <span class="stat-num">${c.stability}/100</span>
            </div>
            <div class="country-stat">
              <span class="stat-name">🗳️ 전쟁 지지도</span>
              <div class="stat-bar"><div class="stat-bar-fill" style="width:${c.war_support}%; background:${getPowerColor(c.war_support)}"></div></div>
              <span class="stat-num">${c.war_support}/100</span>
            </div>
            <div class="country-stat">
              <span class="stat-name">☢️ 핵 역량</span>
              <div class="stat-bar"><div class="stat-bar-fill" style="width:${c.nuclear_power}%; background:${c.nuclear_power > 0 ? getPowerColor(c.nuclear_power) : '#444'}"></div></div>
              <span class="stat-num">${c.nuclear_power > 0 ? c.nuclear_power + '/100' : '없음'}</span>
            </div>
          </div>

          <div class="country-card-footer">
            <span class="gdp-badge">💰 ${formatGdp(c.gdp)}</span>
            <span class="btn btn-secondary btn-sm">편집 →</span>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading countries:', err);
    showToast('국가 목록을 불러올 수 없습니다', 'error');
  }
}

// Add country modal
function setupAddCountry() {
  const modal = document.getElementById('addCountryModal');
  const addBtn = document.getElementById('addCountryBtn');
  const cancelBtn = document.getElementById('cancelAddCountry');
  const confirmBtn = document.getElementById('confirmAddCountry');

  addBtn.addEventListener('click', () => modal.classList.add('active'));
  cancelBtn.addEventListener('click', () => modal.classList.remove('active'));

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  confirmBtn.addEventListener('click', async () => {
    const name = document.getElementById('newCountryName').value.trim();
    const emoji = document.getElementById('newCountryEmoji').value.trim();

    if (!name) {
      showToast('국가명을 입력해주세요', 'error');
      return;
    }

    try {
      const res = await fetch('/api/countries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, flag_emoji: emoji || '🏳️' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      const data = await res.json();
      modal.classList.remove('active');
      showToast(`${emoji || '🏳️'} ${name} 국가가 추가되었습니다`);

      // 편집 페이지로 이동
      window.location.href = `/edit/${data.id}`;
    } catch (err) {
      showToast(err.message || '국가 추가에 실패했습니다', 'error');
    }
  });
}

// Logout
function setupLogout() {
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/';
  });
}

// Init
document.addEventListener('DOMContentLoaded', async () => {
  const authed = await checkAuth();
  if (!authed) return;

  setupLogout();
  setupAddCountry();
  await loadCountries();
});
