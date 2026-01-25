document.getElementById('form-user-permohonan').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('ðŸš€ User form submitted');

    const btn = document.getElementById('btn-submit-user-permohonan');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="flex items-center justify-center gap-3"><svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Menghantar...</span>';

    const jenisPermohonan = document.getElementById('user-jenis-permohonan-hidden').value;
    const itemsDataStr = document.getElementById('user-items-data-hidden').value;

    const data = {
        type: 'permohonan',
        nama: document.getElementById('user-nama-pemohon').value,
        email: document.getElementById('user-email-pemohon').value,
        nomorTelefon: document.getElementById('user-nombor-telefon').value,
        cawangan: document.getElementById('user-cawangan').value,
        jenisPermohonan: jenisPermohonan,
        items: document.getElementById('user-item-dipinjam-hidden').value || jenisPermohonan,
        itemsData: itemsDataStr || '',
        tarikhMulaPinjam: document.getElementById('user-tarikh-mula').value,
        tarikhPulang: document.getElementById('user-tarikh-pulang').value,
        tujuan: document.getElementById('user-tujuan').value,
        status: 'Dalam Proses',
        catatan: '',
        createdAt: new Date().toISOString()
    };

    console.log('ðŸ“¦ User data to save:', data);

    const result = await DataStore.add(data);

    if (result.isOk) {
        // Success message with animation
        btn.innerHTML = '<span class="flex items-center justify-center gap-3"><svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>âœ… Berjaya Dihantar!</span>';
        btn.classList.remove('from-purple-600', 'to-indigo-600');
        btn.classList.add('from-green-600', 'to-emerald-600');

        setTimeout(() => {
            closeUserForm();
            document.getElementById('form-user-permohonan').reset();
            document.querySelectorAll('.user-jenis-btn').forEach(b => {
                b.classList.remove('border-purple-600', 'bg-purple-50');
                b.classList.add('border-slate-200');
            });
            document.getElementById('user-submit-section').classList.add('hidden');
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            btn.classList.remove('from-green-600', 'to-emerald-600');
            btn.classList.add('from-purple-600', 'to-indigo-600');

            // Show success toast
            showToast('âœ… Permohonan anda telah berjaya dihantar!');
        }, 2000);
    } else {
        console.error('âŒ Error:', result.error);
        btn.innerHTML = '<span class="flex items-center justify-center gap-3">âŒ Gagal Dihantar</span>';
        btn.classList.remove('from-purple-600', 'to-indigo-600');
        btn.classList.add('from-red-600', 'to-red-700');

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            btn.classList.remove('from-red-600', 'to-red-700');
            btn.classList.add('from-purple-600', 'to-indigo-600');
        }, 2000);
    }
});

// ADMIN FORM HANDLER
document.getElementById('form-permohonan').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('🚀 Admin form submitted');

    const btn = document.getElementById('btn-submit-permohonan');
    btn.disabled = true;
    btn.textContent = 'Menghantar...';

    const jenisPermohonan = document.getElementById('jenis-permohonan-hidden').value;
    const itemsDataStr = document.getElementById('items-data-hidden').value;

    const data = {
        type: 'permohonan',
        nama: document.getElementById('nama-pemohon').value,
        email: document.getElementById('email-pemohon').value,
        nomorTelefon: document.getElementById('nombor-telefon').value,
        cawangan: document.getElementById('cawangan').value,
        jenisPermohonan: jenisPermohonan,
        items: document.getElementById('item-dipinjam-hidden').value || jenisPermohonan,
        itemsData: itemsDataStr || '',
        tarikhMulaPinjam: document.getElementById('tarikh-mula').value,
        tarikhPulang: document.getElementById('tarikh-pulang').value,
        tujuan: document.getElementById('tujuan').value,
        status: 'Dalam Proses',
        catatan: '',
        createdAt: new Date().toISOString()
    };

    console.log('📦 Admin data to save:', data);

    const result = await DataStore.add(data);

    if (result.isOk) {
        showToast('Permohonan berjaya ditambah!');
        closeModal('modal-permohonan');
        document.getElementById('form-permohonan').reset();
        document.querySelectorAll('.jenis-btn').forEach(btn => {
            btn.classList.remove('border-indigo-600', 'bg-indigo-50');
            btn.classList.add('border-slate-200');
        });
        document.getElementById('field-senarai-item').classList.add('hidden');
        document.getElementById('admin-terma-dewan').classList.add('hidden');
        document.getElementById('admin-terma-peralatan').classList.add('hidden');
        document.getElementById('admin-terma-warning').classList.add('hidden');
    } else {
        console.error('❌ Error:', result.error);
        showToast('Gagal menambah permohonan');
    }

    btn.disabled = false;
    btn.textContent = 'Hantar Permohonan';
});

// Login credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// Data Persistence & Storage
const DataStore = {
    key: 'dewanData',
    get: function () {
        const data = localStorage.getItem(this.key);
        return data ? JSON.parse(data) : [];
    },
    save: function (data) {
        localStorage.setItem(this.key, JSON.stringify(data));
        allData = data;
        this.notify();
    },
    add: function (item) {
        const data = this.get();
        item.__backendId = Date.now().toString(); // Generate simple ID
        // Ensure type is set if missing (fallback to permohonan for user form)
        if (!item.type && item.nama && item.tarikhMulaPinjam) {
            item.type = 'permohonan';
        }
        console.log('📦 Saving Item to DataStore:', item);
        data.push(item);
        this.save(data);
        return Promise.resolve({ isOk: true });
    },
    remove: function (id) {
        let data = this.get();
        data = data.filter(d => d.__backendId !== id);
        this.save(data);
        return Promise.resolve({ isOk: true });
    },
    notify: function () {
        // Update global var and UI
        allData = this.get();
        console.log('🔄 DataStore Notify: refreshing UI with', allData.length, 'records');
        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof renderPermohonan === 'function') renderPermohonan();
        if (typeof renderKategori === 'function') renderKategori();
        if (typeof renderPeralatan === 'function') renderPeralatan();
        if (typeof updateItemDropdown === 'function') updateItemDropdown();
        if (typeof updateKategoriDropdown === 'function') updateKategoriDropdown();
        if (typeof updateUserItemDropdown === 'function') updateUserItemDropdown();
        if (typeof renderLaporan === 'function') renderLaporan();
    },
    getByDateRange: function (startDate, endDate) {
        return this.get().filter(d => {
            if (d.type !== 'permohonan') return false;
            const appDate = new Date(d.tarikhMulaPinjam);
            return appDate >= startDate && appDate <= endDate;
        });
    }
};

// Listen for storage changes from other tabs
window.addEventListener('storage', (e) => {
    if (e.key === DataStore.key) {
        console.log('🔄 Storan dikemaskini dari tab lain');
        DataStore.notify();
    }
});

// Initialize Data
let allData = DataStore.get();
let currentConfig = {};
let isLoggedIn = false;

// Initialize Element SDK (Keep existing)
const defaultConfig = {
    portal_title: 'PENGURUSAN DEWAN SRI KINABATANGAN',
    org_name: 'Sistem Portal',
    primary_color: '#4f46e5',
    secondary_color: '#f8fafc',
    text_color: '#1e293b',
    accent_color: '#fbbf24',
    surface_color: '#ffffff'
};

if (window.elementSdk) {
    window.elementSdk.init({
        defaultConfig,
        onConfigChange: async (config) => {
            currentConfig = config;
            document.getElementById('portal-title').textContent = config.portal_title || defaultConfig.portal_title;
            document.getElementById('org-name').textContent = config.org_name || defaultConfig.org_name;
        },
        mapToCapabilities: (config) => ({
            recolorables: [
                {
                    get: () => config.primary_color || defaultConfig.primary_color,
                    set: (value) => { config.primary_color = value; window.elementSdk.setConfig({ primary_color: value }); }
                },
                {
                    get: () => config.secondary_color || defaultConfig.secondary_color,
                    set: (value) => { config.secondary_color = value; window.elementSdk.setConfig({ secondary_color: value }); }
                },
                {
                    get: () => config.text_color || defaultConfig.text_color,
                    set: (value) => { config.text_color = value; window.elementSdk.setConfig({ text_color: value }); }
                },
                {
                    get: () => config.accent_color || defaultConfig.accent_color,
                    set: (value) => { config.accent_color = value; window.elementSdk.setConfig({ accent_color: value }); }
                },
                {
                    get: () => config.surface_color || defaultConfig.surface_color,
                    set: (value) => { config.surface_color = value; window.elementSdk.setConfig({ surface_color: value }); }
                }
            ],
            borderables: [],
            fontEditable: undefined,
            fontSizeable: undefined
        }),
        mapToEditPanelValues: (config) => new Map([
            ['portal_title', config.portal_title || defaultConfig.portal_title],
            ['org_name', config.org_name || defaultConfig.org_name]
        ])
    });
}

// Check Login & Page State on Load
window.addEventListener('DOMContentLoaded', () => {
    // Refresh Data UI
    DataStore.notify();

    const urlParams = new URLSearchParams(window.location.search);
    const isUserMode = urlParams.get('user') === 'true';

    if (isUserMode) {
        // User Mode: Hide Login & Admin App, Show User Form ONLY
        const loginPage = document.getElementById('login-page');
        const appPage = document.getElementById('app');
        if (loginPage) loginPage.classList.add('hidden');
        if (appPage) appPage.classList.add('hidden');

        // Open user form and prevent closing
        const userModal = document.getElementById('modal-user-form');
        if (userModal) {
            userModal.classList.remove('hidden');
            // Hide close button in user mode to force focus on form
            const closeBtn = userModal.querySelector('button[onclick="closeUserForm()"]');
            if (closeBtn) closeBtn.style.display = 'none';
        }

        // Add special class for user mode styling if needed
        document.body.classList.add('user-mode');

    } else {
        // Admin Logic
        const storedLogin = localStorage.getItem('isLoggedIn');
        if (storedLogin === 'true') {
            // Admin Mode (Logged In)
            isLoggedIn = true;
            document.getElementById('login-page').classList.add('hidden');
            document.getElementById('app').classList.remove('hidden');

            const lastPage = localStorage.getItem('lastPage') || 'dashboard';
            showPage(lastPage);
        } else {
            // Not Logged In - Show Login Page
            document.getElementById('login-page').classList.remove('hidden');
            document.getElementById('app').classList.add('hidden');
        }
    }
});

// Login handler (Global function for button click)
window.handleLogin = async function () {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorDiv = document.getElementById('login-error');

    const username = usernameInput.value;
    const password = passwordInput.value;

    console.log('Attempting login with:', username);

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        isLoggedIn = true;
        localStorage.setItem('isLoggedIn', 'true'); // Save state

        console.log('✅ Login Successful');

        // Force UI Update
        const pageLogin = document.getElementById('login-page');
        const pageApp = document.getElementById('app');

        if (pageLogin) pageLogin.classList.add('hidden');
        if (pageApp) pageApp.classList.remove('hidden');

        DataStore.notify(); // Ensure data is rendered

        // Go to dashboard or saved page
        const lastPage = localStorage.getItem('lastPage') || 'dashboard';
        showPage(lastPage);
    } else {
        console.log('❌ Login Failed');
        if (errorDiv) {
            errorDiv.classList.remove('hidden');
            setTimeout(() => errorDiv.classList.add('hidden'), 3000);
        } else {
            alert('Username atau password salah');
        }
    }
};

// Allow Enter key to trigger login
document.getElementById('form-login').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleLogin();
    }
});

// Logout function
function logout() {
    isLoggedIn = false;
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('lastPage');

    document.getElementById('app').classList.add('hidden');
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// Helper functions
function getPermohonan() {
    return allData.filter(d => d.type === 'permohonan');
}

function getKategori() {
    return allData.filter(d => d.type === 'kategori');
}

function getPeralatan() {
    return allData.filter(d => d.type === 'peralatan');
}

// Page navigation with persistence
function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(`page-${page}`).classList.remove('hidden');
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });

    // Save state if logged in
    if (isLoggedIn) {
        localStorage.setItem('lastPage', page);
    }
}

// Modal functions
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Dashboard update
function updateDashboard() {
    const permohonan = getPermohonan();
    const peralatan = getPeralatan();

    document.getElementById('stat-total').textContent = permohonan.length;
    document.getElementById('stat-pending').textContent = permohonan.filter(p => p.status === 'Dalam Proses').length;
    document.getElementById('stat-approved').textContent = permohonan.filter(p => p.status === 'Diluluskan').length;
    document.getElementById('stat-peralatan').textContent = peralatan.length;

    // Recent applications
    const recentContainer = document.getElementById('recent-applications');
    const recent = permohonan.slice(-5).reverse();

    if (recent.length === 0) {
        recentContainer.innerHTML = '<p class="text-slate-400 text-center py-8">Tiada permohonan terkini</p>';
    } else {
        recentContainer.innerHTML = recent.map(p => `
          <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold">
                ${p.nama ? p.nama.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <p class="font-medium text-slate-800">${p.nama || 'Tidak diketahui'}</p>
                <p class="text-sm text-slate-500">${p.cawangan || '-'}</p>
              </div>
            </div>
            <span class="status-badge ${getStatusClass(p.status)}">${p.status || 'Dalam Proses'}</span>
          </div>
        `).join('');
    }
}

function getStatusClass(status) {
    switch (status) {
        case 'Diluluskan': return 'bg-green-100 text-green-700';
        case 'Ditolak': return 'bg-red-100 text-red-700';
        case 'Selesai': return 'bg-blue-100 text-blue-700';
        default: return 'bg-amber-100 text-amber-700';
    }
}

// Render permohonan table
function renderPermohonan() {
    const tbody = document.getElementById('permohonan-table');
    const permohonan = getPermohonan();

    if (permohonan.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="px-6 py-12 text-center text-slate-400">Tiada permohonan</td></tr>';
        return;
    }

    tbody.innerHTML = permohonan.map(p => `
        <tr class="hover:bg-slate-50">
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-sm">
                ${p.nama ? p.nama.charAt(0).toUpperCase() : 'U'}
              </div>
              <span class="font-medium text-slate-800">${p.nama || '-'}</span>
            </div>
          </td>
          <td class="px-6 py-4 text-slate-600">${p.email || '-'}</td>
          <td class="px-6 py-4 text-slate-600">${p.nomorTelefon || '-'}</td>
          <td class="px-6 py-4 text-slate-600">${p.cawangan || '-'}</td>
          <td class="px-6 py-4 text-slate-600">${p.items || '-'}</td>
          <td class="px-6 py-4 text-slate-600">${formatDate(p.tarikhMulaPinjam)}</td>
          <td class="px-6 py-4 text-slate-600">${formatDate(p.tarikhPulang)}</td>
          <td class="px-6 py-4"><span class="status-badge ${getStatusClass(p.status)}">${p.status || 'Dalam Proses'}</span></td>
          <td class="px-6 py-4">
            <div class="flex gap-2">
              <button onclick="openTindakan('${p.__backendId}')" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Urus</button>
              <button onclick="openDeleteModal('${p.__backendId}', 'permohonan')" class="text-red-600 hover:text-red-800 text-sm font-medium">Padam</button>
            </div>
          </td>
        </tr>
      `).join('');
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('ms-MY', { dateStyle: 'short', timeStyle: 'short' });
}

// Render kategori
function renderKategori() {
    const container = document.getElementById('kategori-list');
    const kategori = getKategori();

    if (kategori.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-center py-8">Tiada kategori</p>';
        return;
    }

    container.innerHTML = kategori.map(k => `
        <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
              </svg>
            </div>
            <span class="font-medium text-slate-800">${k.nama || '-'}</span>
          </div>
          <button onclick="openDeleteModal('${k.__backendId}', 'kategori')" class="text-red-500 hover:text-red-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      `).join('');
}

// Render peralatan
function renderPeralatan() {
    const container = document.getElementById('peralatan-list');
    const peralatan = getPeralatan();
    const kategori = getKategori();

    if (peralatan.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-center py-8">Tiada peralatan</p>';
        return;
    }

    container.innerHTML = peralatan.map(p => {
        const kat = kategori.find(k => k.__backendId === p.kategoriId);
        const tersedia = p.kuantitiTersedia !== undefined ? p.kuantitiTersedia : p.kuantiti;
        const statusColor = tersedia > 0 ? 'text-green-600' : 'text-red-600';
        return `
          <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <div>
                <p class="font-medium text-slate-800">${p.namaPeralatan || '-'}</p>
                <p class="text-sm text-slate-500">${kat ? kat.nama : 'Tiada Kategori'}</p>
                <p class="text-xs ${statusColor} font-semibold mt-1">Tersedia: ${tersedia}/${p.kuantiti || 0} unit</p>
              </div>
            </div>
            <button onclick="openDeleteModal('${p.__backendId}', 'peralatan')" class="text-red-500 hover:text-red-700">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        `;
    }).join('');
}

// Update dropdowns
function updateItemDropdown() {
    const container = document.getElementById('item-dipinjam-container');
    if (!container) {
        console.error('âŒ Container item-dipinjam-container NOT FOUND!');
        return;
    }

    console.log('âœ… Found container:', container);

    const peralatan = getPeralatan();
    const kategori = getKategori();

    console.log('ï¿½ï¿½ï¿½ Peralatan:', peralatan.length);

    if (peralatan.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-sm text-center py-4">Tiada peralatan tersedia</p>';
        return;
    }

    container.innerHTML = peralatan.map(p => {
        const kat = kategori.find(k => k.__backendId === p.kategoriId);
        const tersedia = p.kuantitiTersedia !== undefined ? p.kuantitiTersedia : p.kuantiti;
        const isAvailable = tersedia > 0;
        return `
          <div class="border border-slate-200 rounded-lg p-3 bg-white">
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" value="${p.namaPeralatan}" data-id="${p.__backendId}" onchange="toggleQuantityInput('${p.__backendId}')" class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500" ${!isAvailable ? 'disabled' : ''}>
              <div class="flex-1">
                <span class="text-slate-700 font-medium">${p.namaPeralatan}</span>
                <span class="text-slate-500 text-sm ml-2">(${kat ? kat.nama : '-'})</span>
                <span class="block text-xs ${isAvailable ? 'text-green-600' : 'text-red-600'} font-semibold mt-1">Tersedia: ${tersedia}/${p.kuantiti || 0} unit</span>
              </div>
            </label>
            <div id="qty-input-${p.__backendId}" class="hidden mt-3 pl-7">
              <label class="block text-xs font-medium text-slate-700 mb-1">Kuantiti Dipinjam</label>
              <input type="number" id="qty-${p.__backendId}" min="1" max="${tersedia}" value="1" onchange="validateQuantity('${p.__backendId}', ${tersedia})" oninput="validateQuantity('${p.__backendId}', ${tersedia})" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Masukkan kuantiti">
              <p id="qty-error-${p.__backendId}" class="hidden text-xs text-red-600 mt-1 font-medium">âš ï¸ Kuantiti melebihi stok tersedia (Maks: ${tersedia} unit)</p>
            </div>
          </div>
        `;
    }).join('');

    console.log('âœ… Updated container HTML successfully');
}

function toggleQuantityInput(id) {
    const checkbox = document.querySelector(`input[data-id="${id}"]`);
    const qtyInput = document.getElementById(`qty-input-${id}`);

    if (checkbox.checked) {
        qtyInput.classList.remove('hidden');
    } else {
        qtyInput.classList.add('hidden');
    }

    updateSelectedItems();
}

function validateQuantity(id, maxQty) {
    const input = document.getElementById(`qty-${id}`);
    const error = document.getElementById(`qty-error-${id}`);
    const value = parseInt(input.value) || 0;

    if (value > maxQty) {
        input.classList.add('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
        input.classList.remove('border-slate-200', 'focus:ring-indigo-500', 'focus:border-indigo-500');
        error.classList.remove('hidden');
        input.value = maxQty;
    } else if (value < 1) {
        input.value = 1;
        input.classList.remove('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
        input.classList.add('border-slate-200', 'focus:ring-indigo-500', 'focus:border-indigo-500');
        error.classList.add('hidden');
    } else {
        input.classList.remove('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
        input.classList.add('border-slate-200', 'focus:ring-indigo-500', 'focus:border-indigo-500');
        error.classList.add('hidden');
    }

    updateSelectedItems();
}

function updateSelectedItems() {
    const checkboxes = document.querySelectorAll('#item-dipinjam-container input[type="checkbox"]:checked');
    const selectedItems = [];
    const itemsData = [];

    checkboxes.forEach(cb => {
        const id = cb.dataset.id;
        const name = cb.value;
        const qtyInput = document.getElementById(`qty-${id}`);
        const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;

        selectedItems.push(`${name} (${qty} unit)`);
        itemsData.push({ id, name, qty });
    });

    document.getElementById('item-dipinjam-hidden').value = selectedItems.join(', ');
    document.getElementById('items-data-hidden').value = JSON.stringify(itemsData);

    // Check date overlap when items change
    checkDateOverlap();
}

// Check Date Overlap (Admin)
function checkDateOverlap() {
    const tarikhMula = document.getElementById('tarikh-mula').value;
    const tarikhPulang = document.getElementById('tarikh-pulang').value;
    const jenisPermohonan = document.getElementById('jenis-permohonan-hidden')?.value || '';
    const selections = jenisPermohonan.split(', ').filter(v => v);

    const errorDiv = document.getElementById('date-overlap-error');
    const errorMessage = document.getElementById('date-overlap-message');

    if (!tarikhMula || !tarikhPulang || selections.length === 0) {
        errorDiv.classList.add('hidden');
        return;
    }

    const startDate = new Date(tarikhMula);
    const endDate = new Date(tarikhPulang);

    const hasDewan = selections.includes('Dewan');
    const hasPeralatan = selections.includes('Peralatan');

    let hasConflict = false;
    let conflictMessages = [];

    // Check Dewan availability
    if (hasDewan) {
        const dewanPermohonan = allData.filter(d =>
            d.type === 'permohonan' && d.jenisPermohonan && d.jenisPermohonan.includes('Dewan')
        );

        for (const permohonan of dewanPermohonan) {
            if (permohonan.status === 'Ditolak' || permohonan.status === 'Selesai') continue;

            const existingStart = new Date(permohonan.tarikhMulaPinjam);
            const existingEnd = new Date(permohonan.tarikhPulang);

            if (startDate < existingEnd && endDate > existingStart) {
                hasConflict = true;
                conflictMessages.push(`🏛️ Dewan telah ditempah pada ${formatDate(permohonan.tarikhMulaPinjam)} - ${formatDate(permohonan.tarikhPulang)}. Sila pilih tarikh lain.`);
                break;
            }
        }
    }

    // Check Peralatan availability (Simple Check: if item in use)
    if (hasPeralatan && !hasConflict) {
        // For admin, we might need to know WHICH items are selected.
        // Currently admin form has checkboxes in #item-dipinjam-container
        const selectedItemsData = document.getElementById('items-data-hidden').value;
        if (selectedItemsData) {
            const itemsData = JSON.parse(selectedItemsData);

            for (const item of itemsData) {
                const peralatan = allData.find(d => d.__backendId === item.id);
                if (!peralatan) continue;

                let unitsInUse = 0;
                // Sum usages in other active applications
                const peralatanPermohonan = allData.filter(d =>
                    d.type === 'permohonan' &&
                    d.itemsData &&
                    (d.status === 'Dalam Proses' || d.status === 'Diluluskan')
                );

                for (const permohonan of peralatanPermohonan) {
                    const existingStart = new Date(permohonan.tarikhMulaPinjam);
                    const existingEnd = new Date(permohonan.tarikhPulang);

                    if (startDate < existingEnd && endDate > existingStart) {
                        const permohonanItems = JSON.parse(permohonan.itemsData);
                        const usedItem = permohonanItems.find(i => i.id === item.id);
                        if (usedItem) {
                            unitsInUse += usedItem.qty;
                        }
                    }
                }

                const totalAvailable = peralatan.kuantiti || 0;
                const availableDuringPeriod = totalAvailable - unitsInUse;

                if (item.qty > availableDuringPeriod) {
                    hasConflict = true;
                    // Fix: Use correct item name
                    conflictMessages.push(`📦 ${item.name} tidak mencukupi (Tersedia: ${availableDuringPeriod}).`);
                }
            }
        }
    }

    if (hasConflict) {
        errorMessage.innerHTML = conflictMessages.join('<br>');
        errorDiv.classList.remove('hidden');
    } else {
        errorDiv.classList.add('hidden');
    }
}


function updateKategoriDropdown() {
    const select = document.getElementById('kategori-peralatan');
    const kategori = getKategori();

    select.innerHTML = '<option value="">Pilih Kategori</option>' +
        kategori.map(k => `<option value="${k.__backendId}">${k.nama}</option>`).join('');
}

function updateUserItemDropdown() {
    const container = document.getElementById('user-item-dipinjam-container');
    if (!container) return;

    const peralatan = getPeralatan();
    const kategori = getKategori();

    if (peralatan.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-sm text-center py-8">Tiada peralatan tersedia</p>';
        return;
    }

    container.innerHTML = peralatan.map(p => {
        const kat = kategori.find(k => k.__backendId === p.kategoriId);
        const tersedia = p.kuantitiTersedia !== undefined ? p.kuantitiTersedia : p.kuantiti;
        const isAvailable = tersedia > 0;
        return `
          <div class="border-2 border-slate-200 rounded-xl p-4 bg-white hover:border-purple-300 transition-colors">
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" value="${p.namaPeralatan}" data-id="${p.__backendId}" onchange="updateUserSelectedItems()" class="user-item-checkbox w-5 h-5 text-purple-600 border-slate-300 rounded focus:ring-2 focus:ring-purple-500" ${!isAvailable ? 'disabled' : ''}>
              <div class="flex-1">
                <span class="text-slate-800 font-semibold">${p.namaPeralatan}</span>
                <span class="text-slate-500 text-sm ml-2">(${kat ? kat.nama : '-'})</span>
                <span class="block text-xs ${isAvailable ? 'text-green-600' : 'text-red-600'} font-bold mt-1">Stok: ${tersedia} unit</span>
              </div>
            </label>
          </div>
        `;
    }).join('');
}

// User form functions
function closeUserForm() {
    closeModal('modal-user-form');
}

function selectUserJenisPermohonan(value, button) {
    const isActive = button.classList.contains('border-purple-600');

    if (isActive) {
        button.classList.remove('border-purple-600', 'bg-purple-50');
        button.classList.add('border-slate-200');
    } else {
        button.classList.remove('border-slate-200');
        button.classList.add('border-purple-600', 'bg-purple-50');
    }

    const selectedButtons = document.querySelectorAll('.user-jenis-btn.border-purple-600');
    const selectedValues = Array.from(selectedButtons).map(btn => {
        // Target the specific title element (p.font-semibold) to get the correct value
        const titleEl = btn.querySelector('p.font-semibold');
        return titleEl ? titleEl.textContent.trim() : btn.textContent.trim();
    });

    document.getElementById('user-jenis-permohonan-hidden').value = selectedValues.join(', ');

    toggleUserPermohonanFields();
}

function toggleUserPermohonanFields() {
    const selectedValues = document.getElementById('user-jenis-permohonan-hidden')?.value || '';
    const selections = selectedValues.split(', ').filter(v => v);

    const fieldSenariItem = document.getElementById('user-field-senarai-item');

    const hasPeralatan = selections.includes('Peralatan');
    const hasDewan = selections.includes('Dewan');

    // Show/hide Peralatan fields (HANYA muncul jika user pilih Peralatan)
    if (hasPeralatan) {
        fieldSenariItem.classList.remove('hidden');
        document.getElementById('user-item-dipinjam-hidden').setAttribute('required', 'required');
    } else {
        fieldSenariItem.classList.add('hidden');
        document.getElementById('user-item-dipinjam-hidden').removeAttribute('required');
        // Clear selected items (checkboxes only now)
        document.querySelectorAll('.user-item-checkbox').forEach(cb => cb.checked = false);
        document.getElementById('user-item-dipinjam-hidden').value = '';
        document.getElementById('user-items-data-hidden').value = '';
    }

    // Toggle Terma & Syarat sections
    const termaDewan = document.getElementById('user-terma-dewan');
    const termaPeralatan = document.getElementById('user-terma-peralatan');

    if (hasDewan) {
        termaDewan.classList.remove('hidden');
    } else {
        termaDewan.classList.add('hidden');
        document.getElementById('user-terma-dewan-tick').checked = false;
    }

    if (hasPeralatan) {
        termaPeralatan.classList.remove('hidden');
    } else {
        termaPeralatan.classList.add('hidden');
        document.getElementById('user-terma-peralatan-tick').checked = false;
    }

    // Update section numbers dynamically
    let sectionNumber = 3;
    if (hasPeralatan) {
        sectionNumber = 4;
    }

    const tarikhSection = document.getElementById('tarikh-section-number');
    const tujuanSection = document.getElementById('tujuan-section-number');
    const termaSection = document.getElementById('terma-section-number');

    if (tarikhSection) tarikhSection.textContent = sectionNumber;
    if (tujuanSection) tujuanSection.textContent = sectionNumber + 1;
    if (termaSection) termaSection.textContent = sectionNumber + 2;

    checkUserTerms();
}

function checkUserTerms() {
    const jenisPermohonan = document.getElementById('user-jenis-permohonan-hidden')?.value || '';
    const selections = jenisPermohonan.split(', ').filter(v => v);

    const hasDewan = selections.includes('Dewan');
    const hasPeralatan = selections.includes('Peralatan');

    let allChecked = true;

    // Check Dewan terma
    if (hasDewan) {
        const dewanTick = document.getElementById('user-terma-dewan-tick');
        if (!dewanTick || !dewanTick.checked) {
            allChecked = false;
        }
    }

    // Check Peralatan terma
    if (hasPeralatan) {
        const peralatanTick = document.getElementById('user-terma-peralatan-tick');
        if (!peralatanTick || !peralatanTick.checked) {
            allChecked = false;
        }
    }

    // Check General terma (WAJIB untuk semua)
    const syaratTick = document.getElementById('user-terma-syarat-tick');
    if (!syaratTick || !syaratTick.checked) {
        allChecked = false;
    }

    const submitSection = document.getElementById('user-submit-section');
    const warningDiv = document.getElementById('user-terma-warning');

    if (allChecked && selections.length > 0) {
        submitSection.classList.remove('hidden');
        warningDiv.classList.add('hidden');
    } else {
        submitSection.classList.add('hidden');
        if (selections.length > 0) {
            warningDiv.classList.remove('hidden');
        } else {
            warningDiv.classList.add('hidden');
        }
    }
}

function updateUserSelectedItems() {
    const checkboxes = document.querySelectorAll('.user-item-checkbox:checked');
    const selectedItems = [];
    const itemsData = [];

    checkboxes.forEach(cb => {
        const id = cb.dataset.id;
        const name = cb.value;
        const qty = 1; // Default to 1 as per requirement

        selectedItems.push(`${name}`);
        itemsData.push({ id, name, qty });
    });

    document.getElementById('user-item-dipinjam-hidden').value = selectedItems.join(', ');
    document.getElementById('user-items-data-hidden').value = JSON.stringify(itemsData);

    checkUserDateOverlap();
    checkUserTerms(); // Trigger validation to show/hide submit button
}

function checkUserDateOverlap() {
    const tarikhMula = document.getElementById('user-tarikh-mula').value;
    const tarikhPulang = document.getElementById('user-tarikh-pulang').value;
    const jenisPermohonan = document.getElementById('user-jenis-permohonan-hidden')?.value || '';
    const selections = jenisPermohonan.split(', ').filter(v => v);

    const errorDiv = document.getElementById('user-date-overlap-error');
    const errorMessage = document.getElementById('user-date-overlap-message');

    if (!tarikhMula || !tarikhPulang || selections.length === 0) {
        errorDiv.classList.add('hidden');
        return;
    }

    const startDate = new Date(tarikhMula);
    const endDate = new Date(tarikhPulang);

    const hasDewan = selections.includes('Dewan');
    const hasPeralatan = selections.includes('Peralatan');

    let hasConflict = false;
    let conflictMessages = [];

    if (hasDewan) {
        const dewanPermohonan = allData.filter(d =>
            d.type === 'permohonan' && d.jenisPermohonan && d.jenisPermohonan.includes('Dewan')
        );

        for (const permohonan of dewanPermohonan) {
            if (permohonan.status === 'Ditolak' || permohonan.status === 'Selesai') continue;

            const existingStart = new Date(permohonan.tarikhMulaPinjam);
            const existingEnd = new Date(permohonan.tarikhPulang);

            if (startDate < existingEnd && endDate > existingStart) {
                hasConflict = true;
                conflictMessages.push(`ðŸ›ï¸ Dewan telah ditempah pada ${formatDate(permohonan.tarikhMulaPinjam)} - ${formatDate(permohonan.tarikhPulang)}. Sila pilih tarikh lain.`);
                break;
            }
        }
    }

    if (hasPeralatan && !hasConflict) {
        const selectedItemsData = document.getElementById('user-items-data-hidden').value;
        if (selectedItemsData) {
            const itemsData = JSON.parse(selectedItemsData);

            for (const item of itemsData) {
                const peralatan = allData.find(d => d.__backendId === item.id);
                if (!peralatan) continue;

                let unitsInUse = 0;

                const peralatanPermohonan = allData.filter(d =>
                    d.type === 'permohonan' &&
                    d.itemsData &&
                    (d.status === 'Dalam Proses' || d.status === 'Diluluskan')
                );

                for (const permohonan of peralatanPermohonan) {
                    const existingStart = new Date(permohonan.tarikhMulaPinjam);
                    const existingEnd = new Date(permohonan.tarikhPulang);

                    if (startDate < existingEnd && endDate > existingStart) {
                        const permohonanItems = JSON.parse(permohonan.itemsData);
                        const usedItem = permohonanItems.find(i => i.id === item.id);
                        if (usedItem) {
                            unitsInUse += usedItem.qty;
                        }
                    }
                }

                const totalAvailable = peralatan.kuantiti || 0;
                const availableDuringPeriod = totalAvailable - unitsInUse;

                if (item.qty > availableDuringPeriod) {
                    hasConflict = true;
                    conflictMessages.push(`ðŸ“¦ ${item.name} tidak mencukupi pada tarikh tersebut. Tersedia: ${availableDuringPeriod} unit. Sila pilih tarikh lain.`);
                }
            }
        }
    }

    if (hasConflict) {
        errorMessage.innerHTML = conflictMessages.join('<br><br>');
        errorDiv.classList.remove('hidden');
    } else {
        errorDiv.classList.add('hidden');
    }
}

// Sharelink functions
function showSharelinkInfo() {
    const currentURL = window.location.href.split('?')[0]; // Clean URL base
    const sharelinkURL = `${currentURL}?user=true`;
    document.getElementById('sharelink-url').value = sharelinkURL;
    openModal('modal-sharelink');
}

function copySharelink() {
    const input = document.getElementById('sharelink-url');
    input.select();
    input.setSelectionRange(0, 99999);

    try {
        navigator.clipboard.writeText(input.value).then(() => {
            showToast('Link berjaya disalin!');
        }).catch(() => {
            // Fallback for older browsers
            document.execCommand('copy');
            showToast('Link berjaya disalin!');
        });
    } catch (err) {
        showToast('Gagal menyalin link');
    }
}

// Check if user came from sharelink
window.addEventListener('DOMContentLoaded', () => {
    // Refresh Data UI
    DataStore.notify();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('user') === 'true') {
        // User Mode: Hide Login & Admin App, Show User Form ONLY
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('app').classList.add('hidden');

        // Open user form and prevent closing
        const userModal = document.getElementById('modal-user-form');
        userModal.classList.remove('hidden');

        // Hide close button in user mode to force focus on form
        const closeBtn = userModal.querySelector('button[onclick="closeUserForm()"]');
        if (closeBtn) closeBtn.style.display = 'none';

        // Add special class for user mode styling if needed
        document.body.classList.add('user-mode');

    } else if (localStorage.getItem('isLoggedIn') === 'true') {
        // Admin Mode (Logged In)
        isLoggedIn = true;
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');

        const lastPage = localStorage.getItem('lastPage') || 'dashboard';
        showPage(lastPage);
    }
});

// Admin Form Selection Handlers
function selectJenisPermohonan(value, button) {
    const isActive = button.classList.contains('border-indigo-600');

    if (isActive) {
        button.classList.remove('border-indigo-600', 'bg-indigo-50');
        button.classList.add('border-slate-200');
    } else {
        button.classList.remove('border-slate-200');
        button.classList.add('border-indigo-600', 'bg-indigo-50');
    }

    const selectedButtons = document.querySelectorAll('.jenis-btn.border-indigo-600');
    const selectedValues = Array.from(selectedButtons).map(btn => {
        const span = btn.querySelector('span');
        return span ? span.textContent.trim() : btn.textContent.trim();
    });

    document.getElementById('jenis-permohonan-hidden').value = selectedValues.join(', ');

    togglePermohonanFields();
}

function togglePermohonanFields() {
    const selectedValues = document.getElementById('jenis-permohonan-hidden')?.value || '';
    const selections = selectedValues.split(', ').filter(v => v);

    const fieldSenariItem = document.getElementById('field-senarai-item');
    const hasPeralatan = selections.includes('Peralatan');
    const hasDewan = selections.includes('Dewan');

    // Show/hide Peralatan fields
    if (hasPeralatan && fieldSenariItem) {
        fieldSenariItem.classList.remove('hidden');
    } else if (fieldSenariItem) {
        fieldSenariItem.classList.add('hidden');
    }

    // Toggle Terma & Syarat sections
    const termaDewan = document.getElementById('admin-terma-dewan');
    const termaPeralatan = document.getElementById('admin-terma-peralatan');

    if (termaDewan) {
        if (hasDewan) {
            termaDewan.classList.remove('hidden');
        } else {
            termaDewan.classList.add('hidden');
            const tick = document.getElementById('admin-terma-dewan-tick');
            if (tick) tick.checked = false;
        }
    }

    if (termaPeralatan) {
        if (hasPeralatan) {
            termaPeralatan.classList.remove('hidden');
        } else {
            termaPeralatan.classList.add('hidden');
            const tick = document.getElementById('admin-terma-peralatan-tick');
            if (tick) tick.checked = false;
        }
    }

    // Trigger validation
    if (typeof checkAdminTerms === 'function') checkAdminTerms();
    if (typeof checkDateOverlap === 'function') checkDateOverlap();
}

function checkAdminTerms() {
    const jenisPermohonan = document.getElementById('jenis-permohonan-hidden')?.value || '';
    const selections = jenisPermohonan.split(', ').filter(v => v);

    const hasDewan = selections.includes('Dewan');
    const hasPeralatan = selections.includes('Peralatan');

    let allChecked = true;

    // Check Dewan terma
    if (hasDewan) {
        const dewanTick = document.getElementById('admin-terma-dewan-tick');
        if (!dewanTick.checked) {
            allChecked = false;
        }
    }

    // Check Peralatan terma
    if (hasPeralatan) {
        const peralatanTick = document.getElementById('admin-terma-peralatan-tick');
        if (!peralatanTick.checked) {
            allChecked = false;
        }
    }

    // Check General terma (WAJIB untuk semua)
    const syaratTick = document.getElementById('admin-terma-syarat-tick');
    if (!syaratTick.checked) {
        allChecked = false;
    }

    const submitBtn = document.getElementById('btn-submit-permohonan');
    const warningDiv = document.getElementById('admin-terma-warning');

    if (allChecked && selections.length > 0) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        warningDiv.classList.add('hidden');
    } else {
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        if (selections.length > 0) {
            warningDiv.classList.remove('hidden');
        } else {
            warningDiv.classList.add('hidden');
        }
    }
}

// --- OPEN TINDAKAN (Admin Urus Permohonan) ---
function openTindakan(id) {
    const permohonan = allData.find(d => d.__backendId === id);
    if (!permohonan) {
        showToast('Data tidak dijumpai');
        return;
    }

    document.getElementById('tindakan-id').value = id;
    document.getElementById('detail-nama').textContent = permohonan.nama;
    document.getElementById('detail-email').textContent = permohonan.email;
    document.getElementById('detail-telefon').textContent = permohonan.nomorTelefon;
    document.getElementById('detail-cawangan').textContent = permohonan.cawangan;
    document.getElementById('detail-jenis').textContent = permohonan.jenisPermohonan;
    document.getElementById('detail-items').textContent = permohonan.items;

    // Format dates for display
    document.getElementById('detail-tarikh-mula').textContent = formatDate(permohonan.tarikhMulaPinjam);
    document.getElementById('detail-tarikh-tamat').textContent = formatDate(permohonan.tarikhPulang);

    document.getElementById('detail-tujuan').textContent = permohonan.tujuan;

    // Set current status
    document.getElementById('status-permohonan').value = permohonan.status || 'Dalam Proses';
    document.getElementById('catatan-admin').value = permohonan.catatan || '';

    openModal('modal-tindakan');
}

// Handle Tindakan Submit
document.getElementById('form-tindakan').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('tindakan-id').value;
    const status = document.getElementById('status-permohonan').value;
    const catatan = document.getElementById('catatan-admin').value;

    const data = allData.find(d => d.__backendId === id);
    if (data) {
        data.status = status;
        data.catatan = catatan;
        DataStore.save(allData); // Save updated array

        showToast('Status permohonan dikemaskini!');
        closeModal('modal-tindakan');

        // Refresh UI
        updateDashboard();
        renderPermohonan();
        renderLaporan(); // Update reports
    }
});


// --- DELETE LOGIC ---
function openDeleteModal(id, type) {
    document.getElementById('delete-id').value = id;
    document.getElementById('delete-type').value = type;
    openModal('modal-delete');
}

// Data Persistence & Storage


function confirmDelete() {
    const id = document.getElementById('delete-id').value;
    const type = document.getElementById('delete-type').value;

    DataStore.remove(id).then(() => {
        showToast('Item berjaya dipadam');
        closeModal('modal-delete');

        // Refresh related UIs
        if (type === 'permohonan') {
            updateDashboard();
            renderPermohonan();
        } else if (type === 'kategori') {
            renderKategori();
            updateKategoriDropdown();
            renderPeralatan(); // Peralatan list might change visuals if cat removed
        } else if (type === 'peralatan') {
            renderPeralatan();
            updateItemDropdown();
            updateUserItemDropdown();
            updateDashboard(); // Stats might change
        }
        renderLaporan();
    });
}


// --- FORM HANDLERS (Kategori & Peralatan) ---
// Form Kategori
document.getElementById('form-kategori').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('🚀 Submitting Kategori Form');
    const btn = document.getElementById('btn-submit-kategori');
    const originalText = btn.textContent;
    btn.textContent = 'Menyimpan...';
    btn.disabled = true;

    const nama = document.getElementById('nama-kategori').value;
    if (!nama) {
        showToast('Sila masukkan nama kategori');
        btn.textContent = originalText;
        btn.disabled = false;
        return;
    }

    const data = {
        type: 'kategori',
        nama: nama,
        createdAt: new Date().toISOString()
    };

    await DataStore.add(data);
    showToast('Kategori berjaya ditambah');
    closeModal('modal-kategori');
    document.getElementById('form-kategori').reset();

    btn.textContent = originalText;
    btn.disabled = false;
});

// Form Peralatan
document.getElementById('form-peralatan').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('🚀 Submitting Peralatan Form');
    const btn = document.getElementById('btn-submit-peralatan');
    const originalText = btn.textContent;
    btn.textContent = 'Menyimpan...';
    btn.disabled = true;

    const nama = document.getElementById('nama-peralatan').value;
    const kategoriId = document.getElementById('kategori-peralatan').value;
    const kuantiti = parseInt(document.getElementById('kuantiti-peralatan').value) || 0;

    if (!nama || !kategoriId || kuantiti < 1) {
        showToast('Sila lengkapkan semua maklumat');
        btn.textContent = originalText;
        btn.disabled = false;
        return;
    }

    const data = {
        type: 'peralatan',
        namaPeralatan: nama,
        kategoriId: kategoriId,
        kuantiti: kuantiti,
        kuantitiTersedia: kuantiti, // Init available = total
        createdAt: new Date().toISOString()
    };

    await DataStore.add(data);
    showToast('Peralatan berjaya ditambah');
    closeModal('modal-peralatan');
    document.getElementById('form-peralatan').reset(); // Clear form

    btn.textContent = originalText;
    btn.disabled = false;
});


// --- LAPORAN & REPORTING ---
function renderLaporan() {
    // 1. Calculate & Render Stats
    const permohonan = getPermohonan();

    // Status Chart/Stats (Simple List for now as no Chart.js yet)
    const statusCounts = permohonan.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {});

    const chartStatusDiv = document.getElementById('chart-status');
    if (Object.keys(statusCounts).length === 0) {
        chartStatusDiv.innerHTML = '<p class="text-slate-400 text-center py-8">Tiada data</p>';
    } else {
        chartStatusDiv.innerHTML = Object.entries(statusCounts).map(([status, count]) => `
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg mb-2">
                <span class="font-medium text-slate-700">${status}</span>
                <span class="font-bold text-indigo-600">${count}</span>
            </div>
        `).join('');
    }

    // 2. Equipment Usage Stats
    // Flatten all items requested from all applications
    const itemUsage = {}; // { itemName: count }

    permohonan.forEach(p => {
        if (p.itemsData) {
            try {
                const items = JSON.parse(p.itemsData);
                items.forEach(item => {
                    itemUsage[item.name] = (itemUsage[item.name] || 0) + (item.qty || 1);
                });
            } catch (e) { }
        } else if (p.items && p.items !== 'Dewan') {
            // Fallback for older/simpler data
            itemUsage[p.items] = (itemUsage[p.items] || 0) + 1;
        }
    });

    const chartPeralatanDiv = document.getElementById('chart-peralatan');
    const sortedUsage = Object.entries(itemUsage).sort((a, b) => b[1] - a[1]).slice(0, 5); // Top 5

    if (sortedUsage.length === 0) {
        chartPeralatanDiv.innerHTML = '<p class="text-slate-400 text-center py-8">Tiada penggunaan peralatan</p>';
    } else {
        chartPeralatanDiv.innerHTML = sortedUsage.map(([name, count]) => `
            <div class="mb-3">
                <div class="flex justify-between text-sm mb-1">
                    <span class="font-medium text-slate-700">${name}</span>
                    <span class="font-bold text-purple-600">${count} kali</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2.5">
                    <div class="bg-purple-600 h-2.5 rounded-full" style="width: 10%"></div>
                </div>
            </div>
        `).join('');
    }

    // 3. Render Detailed Report Tables
    renderLaporanPeralatanTable(itemUsage);
    renderLaporanDewanTable(permohonan);
}

function renderLaporanPeralatanTable(usageData) {
    const tbody = document.getElementById('laporan-peralatan-table');
    const peralatan = getPeralatan();
    const kategori = getKategori();

    if (peralatan.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-12 text-center text-slate-400">Tiada data</td></tr>';
        return;
    }

    tbody.innerHTML = peralatan.map(p => {
        const kat = kategori.find(k => k.__backendId === p.kategoriId);
        const usageCount = usageData[p.namaPeralatan] || 0;

        return `
            <tr>
                <td class="px-6 py-4 text-slate-800">${p.namaPeralatan}</td>
                <td class="px-6 py-4 text-slate-600">${kat ? kat.nama : '-'}</td>
                <td class="px-6 py-4 text-center font-bold text-indigo-600">${usageCount}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded text-xs font-semibold ${p.kuantitiTersedia > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                        ${p.kuantitiTersedia > 0 ? 'Ada Stok' : 'Habis'}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

function renderLaporanDewanTable(permohonanData) {
    const tbody = document.getElementById('laporan-dewan-table');
    const dewanApps = permohonanData.filter(p => p.jenisPermohonan && p.jenisPermohonan.includes('Dewan'));

    if (dewanApps.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-12 text-center text-slate-400">Tiada rekod penggunaan dewan</td></tr>';
        return;
    }

    // Just showing summary for Dewan
    tbody.innerHTML = `
        <tr>
            <td class="px-6 py-4 text-slate-800">Dewan Sri Kinabatangan</td>
            <td class="px-6 py-4 text-slate-600">Fasiliti Utama</td>
            <td class="px-6 py-4 text-center font-bold text-indigo-600">${dewanApps.length}</td>
            <td class="px-6 py-4"><span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">Aktif</span></td>
        </tr>
    `;
}

// Date Filters (Simple implementation)
function applyDateFilter() {
    const start = document.getElementById('filter-tarikh-mula').value;
    const end = document.getElementById('filter-tarikh-akhir').value;

    if (!start || !end) return;

    const startDate = new Date(start);
    const endDate = new Date(end);

    const allPermohonan = DataStore.getByDateRange(startDate, endDate); // Need to helper or just filter here
    // For simplicity, re-fetching all and filtering in-memory
    const filtered = allData.filter(d => {
        if (d.type !== 'permohonan') return false;
        const appDate = new Date(d.tarikhMulaPinjam);
        return appDate >= startDate && appDate <= endDate;
    });

    // Quick Hack: Temporarily replace 'getPermohonan' behavior or just update UI directly?
    // Safer: Update UI directly with filtered data
    // Implementing a temporary override for tables
    renderFilteredPermohonan(filtered);
    showToast('Filter tarikh digunakan');
}

function resetDateFilter() {
    document.getElementById('filter-tarikh-mula').value = '';
    document.getElementById('filter-tarikh-akhir').value = '';
    renderPermohonan(); // Reset to default
    showToast('Filter dikosongkan');
}

function renderFilteredPermohonan(filteredData) {
    const tbody = document.getElementById('permohonan-table');
    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="px-6 py-12 text-center text-slate-400">Tiada permohonan dalam tarikh ini</td></tr>';
        return;
    }
    // Reuse existing render map logic logic... (Duplicate logic for brevity, ideally refactor)
    tbody.innerHTML = filteredData.map(p => `
        <tr class="hover:bg-slate-50">
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-sm">
                ${p.nama ? p.nama.charAt(0).toUpperCase() : 'U'}
              </div>
              <span class="font-medium text-slate-800">${p.nama || '-'}</span>
            </div>
          </td>
          <td class="px-6 py-4 text-slate-600">${p.email || '-'}</td>
          <td class="px-6 py-4 text-slate-600">${p.nomorTelefon || '-'}</td>
          <td class="px-6 py-4 text-slate-600">${p.cawangan || '-'}</td>
          <td class="px-6 py-4 text-slate-600">${p.items || '-'}</td>
          <td class="px-6 py-4 text-slate-600">${formatDate(p.tarikhMulaPinjam)}</td>
          <td class="px-6 py-4 text-slate-600">${formatDate(p.tarikhPulang)}</td>
          <td class="px-6 py-4"><span class="status-badge ${getStatusClass(p.status)}">${p.status || 'Dalam Proses'}</span></td>
          <td class="px-6 py-4">
            <div class="flex gap-2">
              <button onclick="openTindakan('${p.__backendId}')" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Urus</button>
              <button onclick="openDeleteModal('${p.__backendId}', 'permohonan')" class="text-red-600 hover:text-red-800 text-sm font-medium">Padam</button>
            </div>
          </td>
        </tr>
      `).join('');
}
// Download Functions
function toggleDownloadMenu() {
    const menu = document.getElementById('download-menu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

// Close menu when clicking outside
window.addEventListener('click', (e) => {
    const menu = document.getElementById('download-menu');
    const btn = e.target.closest('button[onclick="toggleDownloadMenu()"]');
    if (menu && !menu.classList.contains('hidden') && !btn) {
        menu.classList.add('hidden');
    }
});

function downloadExcel() {
    const data = getPermohonan();
    if (!data.length) {
        showToast('Tiada data untuk dimuat turun');
        return;
    }

    // Define Headers
    const headers = [
        'Nama Pemohon',
        'Email',
        'No. Telefon',
        'Cawangan',
        'Jenis Permohonan',
        'Item Dipinjam',
        'Tarikh Mula',
        'Tarikh Pulang',
        'Tujuan',
        'Status',
        'Catatan Admin'
    ];

    // Map Data to Rows
    const rows = data.map(row => {
        // Handle items - escape commas for CSV
        const items = row.items ? row.items.replace(/,/g, ';') : '-';

        // Return array of values
        return [
            `"${row.nama || ''}"`,
            `"${row.email || ''}"`,
            `"${row.nomorTelefon || ''}"`,
            `"${row.cawangan || ''}"`,
            `"${row.jenisPermohonan || ''}"`,
            `"${items}"`,
            `"${row.tarikhMulaPinjam || ''}"`,
            `"${row.tarikhPulang || ''}"`,
            `"${(row.tujuan || '').replace(/"/g, '""')}"`, // Escape quotes
            `"${row.status || ''}"`,
            `"${(row.catatan || '').replace(/"/g, '""')}"`
        ];
    });

    // Combine Headers and Rows
    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
    ].join('\n');

    // Create Blob and Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Senarai_Permohonan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toggleDownloadMenu(); // Close menu
    showToast('Fail berjaya dimuat turun!');
}

function downloadPDF() {
    // Using window.print() as a robust "Save as PDF" solution for vanilla JS
    // This allows the user to use the system's "Save as PDF" feature
    toggleDownloadMenu();
    window.print();
}

function printReport() {
    window.print();
}
