// ===== Country Edit Logic =====

let countryId = null;
let countryData = null;
let partiesData = [];
let parliamentData = null;
let saveTimeout = null;

// ===== Utility Functions =====
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

async function checkAuth() {
  try {
    const res = await fetch('/api/auth/check');
    const data = await res.json();
    if (!data.authenticated) { window.location.href = '/'; return false; }
    return true;
  } catch (e) { window.location.href = '/'; return false; }
}

// ===== Data Loading =====
async function loadCountryData() {
  try {
    const res = await fetch(`/api/countries/${countryId}`);
    if (!res.ok) throw new Error('Not found');
    const data = await res.json();

    countryData = data.country;
    partiesData = data.parties || [];
    parliamentData = data.parliament || { senate_total: 0, house_total: 300, senate_name: '상원', house_name: '하원' };

    populateForm();
    renderParties();
    updateSeatPreviews();
  } catch (err) {
    showToast('국가 데이터를 불러올 수 없습니다', 'error');
    setTimeout(() => window.location.href = '/dashboard', 1500);
  }
}

// ===== Form Population =====
function populateForm() {
  const c = countryData;
  document.getElementById('editTitle').textContent = `${c.flag_emoji || '🏳️'} ${c.name} 편집`;
  document.title = `${c.name} 편집 — SimControl`;

  // Basic info
  document.getElementById('countryName').value = c.name || '';
  document.getElementById('flagEmoji').value = c.flag_emoji || '';
  document.getElementById('ownerId').value = c.owner_id || '';
  document.getElementById('embedColor').value = c.color || '#5865F2';
  document.getElementById('embedColorText').value = c.color || '#5865F2';
  document.getElementById('colorSwatch').style.background = c.color || '#5865F2';

  // Leader
  document.getElementById('leaderName').value = c.leader_name || '';
  document.getElementById('leaderTitle').value = c.leader_title || '';
  document.getElementById('leaderDesc').value = c.leader_description || '';
  document.getElementById('leaderImageUrl').value = c.leader_image || '';

  // Leader image preview
  if (c.leader_image) {
    const imgSrc = c.leader_image.startsWith('http') ? c.leader_image : c.leader_image;
    document.getElementById('leaderImagePreview').innerHTML = `<img src="${imgSrc}" alt="지도자 사진">`;
  }

  // Economy
  document.getElementById('gdp').value = c.gdp || 0;
  setSlider('stability', 'stabilityValue', c.stability || 0);
  setSlider('warSupport', 'warSupportValue', c.war_support || 0);

  // Military
  setSlider('armyPower', 'armyValue', c.army_power || 0);
  setSlider('navyPower', 'navyValue', c.navy_power || 0);
  setSlider('airforcePower', 'airforceValue', c.airforce_power || 0);
  setSlider('nuclearPower', 'nuclearValue', c.nuclear_power || 0);

  // Parliament
  const p = parliamentData;
  document.getElementById('houseName').value = p.house_name || '하원';
  document.getElementById('houseTotal').value = p.house_total || 0;
  document.getElementById('senateName').value = p.senate_name || '상원';
  document.getElementById('senateTotal').value = p.senate_total || 0;
}

function setSlider(sliderId, valueId, value) {
  const slider = document.getElementById(sliderId);
  const display = document.getElementById(valueId);
  slider.value = value;
  display.textContent = value;
}

// ===== Slider Setup =====
function setupSliders() {
  const sliders = [
    ['stability', 'stabilityValue'],
    ['warSupport', 'warSupportValue'],
    ['armyPower', 'armyValue'],
    ['navyPower', 'navyValue'],
    ['airforcePower', 'airforceValue'],
    ['nuclearPower', 'nuclearValue'],
  ];

  sliders.forEach(([sliderId, valueId]) => {
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(valueId);
    slider.addEventListener('input', () => {
      display.textContent = slider.value;
    });
  });
}

// ===== Color Picker =====
function setupColorPicker() {
  const picker = document.getElementById('embedColor');
  const text = document.getElementById('embedColorText');
  const swatch = document.getElementById('colorSwatch');

  swatch.addEventListener('click', () => picker.click());

  picker.addEventListener('input', () => {
    text.value = picker.value;
    swatch.style.background = picker.value;
  });

  text.addEventListener('input', () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(text.value)) {
      picker.value = text.value;
      swatch.style.background = text.value;
    }
  });
}

// ===== Image Upload =====
function setupImageUpload() {
  const uploadBtn = document.getElementById('uploadImageBtn');
  const fileInput = document.getElementById('leaderImageInput');
  const urlInput = document.getElementById('leaderImageUrl');
  const preview = document.getElementById('leaderImagePreview');

  uploadBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload/leader', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();

      urlInput.value = data.path;
      preview.innerHTML = `<img src="${data.path}" alt="지도자 사진">`;
      showToast('사진이 업로드되었습니다');
    } catch (err) {
      showToast('사진 업로드에 실패했습니다', 'error');
    }
  });

  urlInput.addEventListener('change', () => {
    if (urlInput.value) {
      preview.innerHTML = `<img src="${urlInput.value}" alt="지도자 사진" onerror="this.parentElement.innerHTML='<span class=placeholder>👤</span>'">`;
    } else {
      preview.innerHTML = '<span class="placeholder">👤</span>';
    }
  });
}

// ===== Party Management =====
function renderParties() {
  const list = document.getElementById('partyList');

  if (partiesData.length === 0) {
    list.innerHTML = `
      <div class="empty-state" style="padding: 30px;">
        <div class="icon" style="font-size:40px">🏷️</div>
        <h3>등록된 정당이 없습니다</h3>
        <p>위의 '정당 추가' 버튼을 눌러 시작하세요.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = partiesData.map((party, index) => `
    <div class="party-item" data-party-id="${party.id}" data-index="${index}">
      <div class="party-item-header">
        <div>
          <span class="party-color-dot" style="background:${party.color}"></span>
          <strong>${party.name || '새 정당'}</strong>
          <span style="color:var(--text-muted); font-size:12px; margin-left:8px">${party.ideology || ''}</span>
        </div>
        <button class="btn btn-danger btn-sm" onclick="deleteParty(${party.id}, '${party.name}')">🗑️ 삭제</button>
      </div>
      <div class="party-item-fields">
        <div class="form-group">
          <label>정당명</label>
          <input type="text" class="form-control party-name" data-id="${party.id}" value="${party.name || ''}" placeholder="정당명">
        </div>
        <div class="form-group">
          <label>색상</label>
          <div class="color-input-group">
            <div class="color-swatch" style="background:${party.color}" onclick="this.nextElementSibling.click()"></div>
            <input type="color" class="party-color-picker" data-id="${party.id}" value="${party.color || '#808080'}">
            <input type="text" class="form-control party-color" data-id="${party.id}" value="${party.color || '#808080'}" style="flex:1">
          </div>
        </div>
        <div class="form-group">
          <label>이념 성향</label>
          <input type="text" class="form-control party-ideology" data-id="${party.id}" value="${party.ideology || ''}" placeholder="보수주의, 진보 등">
        </div>
        <div class="form-group">
          <label>지지율 (%)</label>
          <input type="number" class="form-control party-support" data-id="${party.id}" value="${party.support_rate || 0}" min="0" max="100" step="0.1">
        </div>
        <div class="form-group">
          <label>하원 의석수</label>
          <input type="number" class="form-control party-house-seats" data-id="${party.id}" value="${party.house_seats || 0}" min="0">
        </div>
        <div class="form-group">
          <label>상원 의석수</label>
          <input type="number" class="form-control party-senate-seats" data-id="${party.id}" value="${party.senate_seats || 0}" min="0">
        </div>
      </div>
    </div>
  `).join('');

  // Bind party field events
  setupPartyFieldEvents();
}

function setupPartyFieldEvents() {
  // Color picker sync
  document.querySelectorAll('.party-color-picker').forEach(picker => {
    picker.addEventListener('input', (e) => {
      const id = e.target.dataset.id;
      const textInput = document.querySelector(`.party-color[data-id="${id}"]`);
      const swatch = e.target.previousElementSibling;
      textInput.value = e.target.value;
      swatch.style.background = e.target.value;
      debounceSeatPreview();
    });
  });

  document.querySelectorAll('.party-color').forEach(input => {
    input.addEventListener('input', (e) => {
      if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
        const id = e.target.dataset.id;
        const picker = document.querySelector(`.party-color-picker[data-id="${id}"]`);
        const swatch = picker.previousElementSibling;
        picker.value = e.target.value;
        swatch.style.background = e.target.value;
        debounceSeatPreview();
      }
    });
  });

  // Seat inputs → update preview
  document.querySelectorAll('.party-house-seats, .party-senate-seats').forEach(input => {
    input.addEventListener('input', () => debounceSeatPreview());
  });
}

let seatPreviewTimeout = null;
function debounceSeatPreview() {
  clearTimeout(seatPreviewTimeout);
  seatPreviewTimeout = setTimeout(() => updateSeatPreviews(), 150);
}

async function addParty() {
  try {
    const res = await fetch('/api/parties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        country_id: countryId,
        name: '새 정당',
        color: '#808080',
        ideology: '',
        support_rate: 0,
        senate_seats: 0,
        house_seats: 0,
      }),
    });

    if (!res.ok) throw new Error('Failed');
    const data = await res.json();

    partiesData.push({
      id: data.id,
      country_id: parseInt(countryId),
      name: '새 정당',
      color: '#808080',
      ideology: '',
      support_rate: 0,
      senate_seats: 0,
      house_seats: 0,
    });

    renderParties();
    updateSeatPreviews();
    showToast('정당이 추가되었습니다');
  } catch (err) {
    showToast('정당 추가에 실패했습니다', 'error');
  }
}

async function deleteParty(partyId, name) {
  if (!confirm(`'${name}' 정당을 삭제하시겠습니까?`)) return;

  try {
    const res = await fetch(`/api/parties/${partyId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed');

    partiesData = partiesData.filter(p => p.id !== partyId);
    renderParties();
    updateSeatPreviews();
    showToast(`${name} 정당이 삭제되었습니다`);
  } catch (err) {
    showToast('정당 삭제에 실패했습니다', 'error');
  }
}

// ===== Seat Visualization =====
function updateSeatPreviews() {
  // Gather current party data from DOM
  const currentParties = gatherPartyDataFromDOM();

  const houseTotal = parseInt(document.getElementById('houseTotal').value) || 0;
  const senateTotal = parseInt(document.getElementById('senateTotal').value) || 0;

  // House preview
  renderSeatBar('houseSeatBar', 'houseSeatLegend', currentParties, 'house_seats', houseTotal);

  // Senate preview
  const senatePreview = document.getElementById('senateSeatPreview');
  if (senateTotal > 0) {
    senatePreview.style.display = 'block';
    renderSeatBar('senateSeatBar', 'senateSeatLegend', currentParties, 'senate_seats', senateTotal);
  } else {
    senatePreview.style.display = 'none';
  }
}

function renderSeatBar(barId, legendId, parties, seatField, total) {
  const bar = document.getElementById(barId);
  const legend = document.getElementById(legendId);

  if (total === 0) {
    bar.innerHTML = '<div style="width:100%; display:flex; align-items:center; justify-content:center; color:var(--text-muted); font-size:12px;">의석수를 설정해주세요</div>';
    legend.innerHTML = '';
    return;
  }

  const validParties = parties.filter(p => (p[seatField] || 0) > 0);
  const allocatedSeats = validParties.reduce((sum, p) => sum + (p[seatField] || 0), 0);

  bar.innerHTML = validParties.map(p => {
    const seats = p[seatField] || 0;
    const pct = (seats / total * 100);
    return `<div class="seat-bar-segment" style="width:${pct}%; background:${p.color || '#808080'}">
      <span>${seats >= total * 0.08 ? seats : ''}</span>
    </div>`;
  }).join('');

  // Add empty seats if any
  if (allocatedSeats < total) {
    const emptyPct = ((total - allocatedSeats) / total * 100);
    bar.innerHTML += `<div class="seat-bar-segment" style="width:${emptyPct}%; background:rgba(255,255,255,0.05)">
      <span style="color:var(--text-muted)">${total - allocatedSeats}</span>
    </div>`;
  }

  legend.innerHTML = validParties.map(p => `
    <div class="seat-legend-item">
      <div class="seat-legend-dot" style="background:${p.color}"></div>
      ${p.name}: ${p[seatField]}석 (${(p[seatField] / total * 100).toFixed(1)}%)
    </div>
  `).join('');

  if (allocatedSeats < total) {
    legend.innerHTML += `
      <div class="seat-legend-item">
        <div class="seat-legend-dot" style="background:rgba(255,255,255,0.1)"></div>
        미배정: ${total - allocatedSeats}석
      </div>
    `;
  }
}

function gatherPartyDataFromDOM() {
  return partiesData.map(p => {
    const nameEl = document.querySelector(`.party-name[data-id="${p.id}"]`);
    const colorEl = document.querySelector(`.party-color[data-id="${p.id}"]`);
    const houseEl = document.querySelector(`.party-house-seats[data-id="${p.id}"]`);
    const senateEl = document.querySelector(`.party-senate-seats[data-id="${p.id}"]`);

    return {
      ...p,
      name: nameEl ? nameEl.value : p.name,
      color: colorEl ? colorEl.value : p.color,
      house_seats: houseEl ? parseInt(houseEl.value) || 0 : p.house_seats,
      senate_seats: senateEl ? parseInt(senateEl.value) || 0 : p.senate_seats,
    };
  });
}

// ===== Save All =====
async function saveAll() {
  const saveBtn = document.getElementById('saveAllBtn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span class="spinner"></span> 저장 중...';

  try {
    // 1. Save country data
    const countryPayload = {
      name: document.getElementById('countryName').value,
      flag_emoji: document.getElementById('flagEmoji').value,
      owner_id: document.getElementById('ownerId').value.trim(),
      color: document.getElementById('embedColorText').value,
      leader_name: document.getElementById('leaderName').value,
      leader_title: document.getElementById('leaderTitle').value,
      leader_description: document.getElementById('leaderDesc').value,
      leader_image: document.getElementById('leaderImageUrl').value,
      gdp: parseFloat(document.getElementById('gdp').value) || 0,
      stability: parseInt(document.getElementById('stability').value),
      war_support: parseInt(document.getElementById('warSupport').value),
      army_power: parseInt(document.getElementById('armyPower').value),
      navy_power: parseInt(document.getElementById('navyPower').value),
      airforce_power: parseInt(document.getElementById('airforcePower').value),
      nuclear_power: parseInt(document.getElementById('nuclearPower').value),
    };

    const countryRes = await fetch(`/api/countries/${countryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(countryPayload),
    });
    if (!countryRes.ok) throw new Error('국가 정보 저장 실패');

    // 2. Save parliament config
    const parliamentPayload = {
      house_name: document.getElementById('houseName').value,
      house_total: parseInt(document.getElementById('houseTotal').value) || 0,
      senate_name: document.getElementById('senateName').value,
      senate_total: parseInt(document.getElementById('senateTotal').value) || 0,
    };

    const parlRes = await fetch(`/api/parliament/${countryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parliamentPayload),
    });
    if (!parlRes.ok) throw new Error('의회 정보 저장 실패');

    // 3. Save all parties
    const currentParties = gatherPartyDataFromDOM();
    for (const party of currentParties) {
      const supportEl = document.querySelector(`.party-support[data-id="${party.id}"]`);
      const ideologyEl = document.querySelector(`.party-ideology[data-id="${party.id}"]`);

      const partyPayload = {
        name: party.name,
        color: party.color,
        ideology: ideologyEl ? ideologyEl.value : party.ideology,
        support_rate: supportEl ? parseFloat(supportEl.value) || 0 : party.support_rate,
        house_seats: party.house_seats,
        senate_seats: party.senate_seats,
      };

      const partyRes = await fetch(`/api/parties/${party.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partyPayload),
      });
      if (!partyRes.ok) throw new Error(`${party.name} 정당 저장 실패`);
    }

    // Update page title
    document.getElementById('editTitle').textContent =
      `${document.getElementById('flagEmoji').value} ${document.getElementById('countryName').value} 편집`;

    showToast('모든 변경사항이 저장되었습니다!');
  } catch (err) {
    showToast(err.message || '저장에 실패했습니다', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '💾 모두 저장';
  }
}

// ===== Delete Country =====
function setupDeleteCountry() {
  const modal = document.getElementById('deleteModal');
  const deleteBtn = document.getElementById('deleteCountryBtn');
  const cancelBtn = document.getElementById('cancelDelete');
  const confirmBtn = document.getElementById('confirmDelete');

  deleteBtn.addEventListener('click', () => modal.classList.add('active'));
  cancelBtn.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  confirmBtn.addEventListener('click', async () => {
    try {
      const res = await fetch(`/api/countries/${countryId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');

      showToast('국가가 삭제되었습니다');
      setTimeout(() => window.location.href = '/dashboard', 1000);
    } catch (err) {
      showToast('삭제에 실패했습니다', 'error');
    }
  });
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', async () => {
  const authed = await checkAuth();
  if (!authed) return;

  // Get country ID from URL
  const pathParts = window.location.pathname.split('/');
  countryId = pathParts[pathParts.length - 1];

  if (!countryId || isNaN(countryId)) {
    window.location.href = '/dashboard';
    return;
  }

  setupSliders();
  setupColorPicker();
  setupImageUpload();
  setupDeleteCountry();

  // Save button
  document.getElementById('saveAllBtn').addEventListener('click', saveAll);

  // Add party button
  document.getElementById('addPartyBtn').addEventListener('click', addParty);

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/';
  });

  // Parliament total changes → update preview
  document.getElementById('houseTotal').addEventListener('input', () => debounceSeatPreview());
  document.getElementById('senateTotal').addEventListener('input', () => debounceSeatPreview());

  // Load data
  await loadCountryData();
});
