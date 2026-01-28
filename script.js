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

    try {
        const result = await DataStore.add(data);

        if (result.isOk) {
            // Success message with animation
            btn.innerHTML = '<span class="flex items-center justify-center gap-3"><svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>✅ Berjaya Dihantar!</span>';
            btn.classList.remove('from-purple-600', 'to-indigo-600');
            btn.classList.add('from-green-600', 'to-emerald-600');

            setTimeout(() => {
                playSuccessSound();
                // New logic: Hide form, show success state
                document.getElementById('form-user-permohonan').classList.add('hidden');
                document.getElementById('user-success-container').classList.remove('hidden');

                // Still reset form for next use
                document.getElementById('form-user-permohonan').reset();
                document.querySelectorAll('.user-jenis-btn').forEach(b => {
                    b.classList.remove('border-purple-600', 'bg-purple-50');
                    b.classList.add('border-slate-200');
                });
                document.getElementById('user-submit-section').classList.add('hidden');

                // Critical: Reset UI logic states
                toggleUserPermohonanFields();
                updateUserItemDropdown();

                btn.innerHTML = originalHTML;
                btn.disabled = false;
                btn.classList.remove('from-green-600', 'to-emerald-600');
                btn.classList.add('from-purple-600', 'to-indigo-600');
            }, 1500);

        } else {
            throw new Error(result.error || 'Unknown error');
        }
    } catch (err) {
        console.error('❌ Submit Error:', err);
        btn.innerHTML = '<span class="flex items-center justify-center gap-3">❌ Gagal Dihantar</span>';
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
        try {
            const data = localStorage.getItem(this.key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('❌ DataStore.get Error:', e);
            return [];
        }
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
        // Update global var
        allData = this.get();
        console.log('🔄 DataStore Notify: refreshing UI');

        // Bulletproof UI updates - individual crashes won't stop others
        const tasks = [
            { name: 'Dashboard', fn: updateDashboard },
            { name: 'Permohonan', fn: renderPermohonan },
            { name: 'Kategori', fn: renderKategori },
            { name: 'Peralatan', fn: renderPeralatan },
            { name: 'Item Dropdown', fn: updateItemDropdown },
            { name: 'Kategori Dropdown', fn: updateKategoriDropdown },
            { name: 'User Item Dropdown', fn: updateUserItemDropdown },
            { name: 'Laporan', fn: renderLaporan },
            { name: 'Notifications', fn: updateNotifications }
        ];

        tasks.forEach(t => {
            try {
                if (typeof t.fn === 'function') t.fn();
            } catch (e) {
                console.warn(`⚠️ UI Task [${t.name}] failed:`, e.message);
            }
        });
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
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const isUserMode = urlParams.get('user') === 'true' || window.location.hash.includes('user=true');

        // 1. Apply UI Visuals immediately
        applyBgSettings();
        applyLogoSettings();

        if (isUserMode) {
            // User Mode: Hide Login & Admin App, Show User Form ONLY
            const loginPage = document.getElementById('login-page');
            const appPage = document.getElementById('app');
            if (loginPage) loginPage.classList.add('hidden');
            if (appPage) appPage.classList.add('hidden');

            const userModal = document.getElementById('modal-user-form');
            if (userModal) {
                userModal.classList.remove('hidden');
                const closeBtn = userModal.querySelector('button[onclick="closeUserForm()"]');
                if (closeBtn) closeBtn.style.display = 'none';
            }
            document.body.classList.add('user-mode');

            // Trigger data update for user form
            DataStore.notify();

        } else {
            // Admin Logic
            const storedLogin = localStorage.getItem('isLoggedIn');
            if (storedLogin === 'true') {
                isLoggedIn = true;
                document.getElementById('login-page').classList.add('hidden');
                document.getElementById('app').classList.remove('hidden');

                // Priority: URL Hash > LocalStorage > Default
                const hashPage = window.location.hash.replace('#', '');
                const storedPage = localStorage.getItem('lastPage');
                const validPages = ['dashboard', 'permohonan', 'peralatan', 'tetapan', 'laporan'];

                let pageToLoad = 'dashboard';
                if (validPages.includes(hashPage)) {
                    pageToLoad = hashPage;
                } else if (validPages.includes(storedPage)) {
                    pageToLoad = storedPage;
                }

                showPage(pageToLoad);

                // Trigger data update only after showing page
                DataStore.notify();
            } else {
                // Not Logged In - Show Login Page
                document.getElementById('login-page').classList.remove('hidden');
                document.getElementById('app').classList.add('hidden');

                // Clear hash if not logged in to avoid confusion
                if (window.location.hash) {
                    history.replaceState(null, null, ' ');
                }
            }
        }
    } catch (err) {
        console.error('❌ Critical App Init Error:', err);
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

// Helper functions - Improved with Global Filtering
function getPermohonan() {
    const startVal = document.getElementById('filter-tarikh-mula')?.value;
    const endVal = document.getElementById('filter-tarikh-akhir')?.value;

    let data = allData.filter(d => d.type === 'permohonan');

    if (startVal || endVal) {
        const start = startVal ? new Date(startVal) : new Date(0);
        const end = endVal ? new Date(endVal) : new Date(8640000000000000);
        if (endVal) end.setHours(23, 59, 59, 999);

        data = data.filter(d => {
            const appDate = new Date(d.tarikhMulaPinjam);
            return appDate >= start && appDate <= end;
        });
    }

    return data;
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
        // Only update hash if it's different to avoid loops
        if (window.location.hash !== '#' + page) {
            window.location.hash = page;
        }
    }

    // Close sidebar on mobile after selection
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth < 768 && sidebar.classList.contains('translate-x-0')) {
        toggleSidebar();
    }
}

// Handle hash changes (back/forward browser buttons)
window.addEventListener('hashchange', () => {
    if (!isLoggedIn) return;
    const page = window.location.hash.replace('#', '');
    const validPages = ['dashboard', 'permohonan', 'peralatan', 'tetapan', 'laporan'];
    if (validPages.includes(page)) {
        showPage(page);
    }
});

// Modal functions with refined background blur
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
    // Blur everything behind
    const app = document.getElementById('app');
    const login = document.getElementById('login-page');
    const globalBg = document.getElementById('global-portal-bg');

    if (app) app.classList.add('modal-blur');
    if (login) login.classList.add('modal-blur');
    if (globalBg) globalBg.classList.add('modal-blur');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
    const app = document.getElementById('app');
    const login = document.getElementById('login-page');
    const globalBg = document.getElementById('global-portal-bg');

    // Safety: Only remove blur if no other modals are visible
    const visibleModals = document.querySelectorAll('.fixed[id^=\"modal-\"]:not(.hidden)');
    if (visibleModals.length === 0) {
        if (app) app.classList.remove('modal-blur');
        if (login) login.classList.remove('modal-blur');
        if (globalBg) globalBg.classList.remove('modal-blur');
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Mobile sidebar toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('translate-x-0');
        overlay.classList.remove('hidden');
    } else {
        sidebar.classList.add('-translate-x-full');
        sidebar.classList.remove('translate-x-0');
        overlay.classList.add('hidden');
    }
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

// Update notification badge
let lastNotificationCount = 0;
function updateNotifications() {
    const permohonan = allData.filter(d => d.type === 'permohonan' && d.status === 'Dalam Proses');
    const badge = document.getElementById('notification-badge');
    const countEl = document.getElementById('notification-count');

    if (!badge || !countEl) return;

    const currentCount = permohonan.length;

    if (currentCount > 0) {
        countEl.textContent = currentCount;
        badge.classList.remove('hidden');

        // Play notification sound if count increased
        if (currentCount > lastNotificationCount) {
            playNotificationSound();
        }
        lastNotificationCount = currentCount;

        // Add a little bounce animation when count changes
        badge.classList.remove('animate-bounce');
        void badge.offsetWidth; // trigger reflow
        badge.classList.add('animate-bounce');
        setTimeout(() => badge.classList.remove('animate-bounce'), 1000);
    } else {
        badge.classList.add('hidden');
        lastNotificationCount = 0;
    }
}

// Sound Effects Logic (Digital Synthesis)
function playSuccessSound() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.1); // C6

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
}

function playNotificationSound() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.2); // A4

    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
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
                conflictMessages.push(`Dewan telah ditempah pada ${formatDate(permohonan.tarikhMulaPinjam)} - ${formatDate(permohonan.tarikhPulang)}. Sila pilih tarikh lain.`);
                break;
            }
        }
    }

    // Check Peralatan availability (Simple Check: if item in use)
    if (hasPeralatan && !hasConflict) {
        const selectedItemsData = document.getElementById('items-data-hidden').value;
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
                        try {
                            const permohonanItems = JSON.parse(permohonan.itemsData);
                            const usedItem = permohonanItems.find(i => i.id === item.id);
                            if (usedItem) {
                                unitsInUse += usedItem.qty;
                            }
                        } catch (e) {
                            console.error('Error parsing itemsData:', e);
                        }
                    }
                }

                const totalAvailable = peralatan.kuantiti || 0;
                const availableDuringPeriod = totalAvailable - unitsInUse;

                if (item.qty > availableDuringPeriod) {
                    hasConflict = true;
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

// User Form Date Overlap & Availability Check
function checkUserDateOverlap() {
    const tarikhMula = document.getElementById('user-tarikh-mula').value;
    const tarikhPulang = document.getElementById('user-tarikh-pulang').value;
    const jenisPermohonan = document.getElementById('user-jenis-permohonan-hidden')?.value || '';
    const selections = jenisPermohonan.split(', ').filter(v => v);

    const errorDiv = document.getElementById('user-date-overlap-error');
    const errorMessage = document.getElementById('user-date-overlap-message');
    const submitBtn = document.getElementById('btn-submit-user-permohonan');

    // Update item list based on new potential dates
    if (selections.includes('Peralatan')) {
        updateUserItemDropdown();
    }

    if (!tarikhMula || !tarikhPulang || selections.length === 0) {
        errorDiv.classList.add('hidden');
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    const startDate = new Date(tarikhMula);
    const endDate = new Date(tarikhPulang);

    if (startDate >= endDate) {
        errorMessage.innerHTML = '⚠️ Tarikh mula mestilah sebelum tarikh tamat.';
        errorDiv.classList.remove('hidden');
        if (submitBtn) submitBtn.disabled = true;
        return;
    }

    let hasConflict = false;
    let conflictMessages = [];

    // 1. Check Dewan Conflicts
    if (selections.includes('Dewan')) {
        const matchingPermohonan = allData.filter(d =>
            d.type === 'permohonan' &&
            d.jenisPermohonan &&
            d.jenisPermohonan.includes('Dewan') &&
            (d.status === 'Dalam Proses' || d.status === 'Diluluskan' || d.status === 'Selesai')
        );

        for (const p of matchingPermohonan) {
            const existingStart = new Date(p.tarikhMulaPinjam);
            const existingEnd = new Date(p.tarikhPulang);

            if (startDate < existingEnd && endDate > existingStart) {
                hasConflict = true;
                conflictMessages.push(`🏛️ Dewan telah ditempah pada ${formatDate(p.tarikhMulaPinjam)} - ${formatDate(p.tarikhPulang)}. Sila pilih tarikh/waktu lain.`);
                break;
            }
        }
    }

    // 2. Check Peralatan Conflicts
    const itemsDataStr = document.getElementById('user-items-data-hidden').value;
    if (selections.includes('Peralatan') && itemsDataStr) {
        try {
            const selectedItems = JSON.parse(itemsDataStr);
            for (const item of selectedItems) {
                const totalStock = allData.find(d => d.type === 'peralatan' && d.__backendId === item.id)?.kuantiti || 0;

                // Calculate how many in use during this period
                let unitsInUse = 0;
                const relevantRequests = allData.filter(d =>
                    d.type === 'permohonan' &&
                    (d.status === 'Dalam Proses' || d.status === 'Diluluskan') &&
                    d.itemsData
                );

                for (const req of relevantRequests) {
                    const reqStart = new Date(req.tarikhMulaPinjam);
                    const reqEnd = new Date(req.tarikhPulang);

                    if (startDate < reqEnd && endDate > reqStart) {
                        const reqItems = JSON.parse(req.itemsData);
                        const match = reqItems.find(i => i.id === item.id);
                        if (match) unitsInUse += match.qty;
                    }
                }

                if (item.qty > (totalStock - unitsInUse)) {
                    hasConflict = true;
                    conflictMessages.push(`📦 <strong>${item.name}</strong> tidak mencukupi untuk tempoh ini. (Baki tersedia: ${totalStock - unitsInUse})`);
                }
            }
        } catch (e) { console.error(e); }
    }

    // Check for individual item quantity errors
    const qtyErrors = document.querySelectorAll('[id^="user-qty-error-"]:not(.hidden)');
    if (qtyErrors.length > 0) hasConflict = true;

    if (hasConflict) {
        errorMessage.innerHTML = conflictMessages.join('<br>');
        errorDiv.classList.remove('hidden');
        if (submitBtn) submitBtn.disabled = true;
    } else {
        errorDiv.classList.add('hidden');
        if (submitBtn) submitBtn.disabled = false;
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
    const tarikhMula = document.getElementById('user-tarikh-mula').value;
    const tarikhPulang = document.getElementById('user-tarikh-pulang').value;

    if (peralatan.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-sm text-center py-8">Tiada peralatan tersedia</p>';
        return;
    }

    container.innerHTML = peralatan.map(p => {
        const kat = kategori.find(k => k.__backendId === p.kategoriId);
        let unitsInUse = 0;

        // Calculate availability if dates are selected
        if (tarikhMula && tarikhPulang) {
            const start = new Date(tarikhMula);
            const end = new Date(tarikhPulang);
            const activePermohonan = allData.filter(d =>
                d.type === 'permohonan' &&
                (d.status === 'Dalam Proses' || d.status === 'Diluluskan') &&
                d.itemsData
            );

            activePermohonan.forEach(req => {
                const reqStart = new Date(req.tarikhMulaPinjam);
                const reqEnd = new Date(req.tarikhPulang);
                if (start < reqEnd && end > reqStart) {
                    try {
                        const items = JSON.parse(req.itemsData);
                        const match = items.find(i => i.id === p.__backendId);
                        if (match) unitsInUse += match.qty;
                    } catch (e) { }
                }
            });
        }

        const totalStock = p.kuantiti || 0;
        const available = totalStock - unitsInUse;
        const isAvailable = available > 0;
        const statusColor = isAvailable ? 'text-green-600' : 'text-red-600';

        return `
          <div class="border-2 border-slate-200 rounded-xl p-4 bg-white hover:border-purple-300 transition-colors ${!isAvailable ? 'opacity-60 bg-slate-50' : ''}">
            <label class="flex items-center gap-3 ${isAvailable ? 'cursor-pointer' : 'cursor-not-allowed'}">
              <input type="checkbox" value="${p.namaPeralatan}" data-id="${p.__backendId}" 
                onchange="toggleUserQtyInput('${p.__backendId}')" 
                class="user-item-checkbox w-5 h-5 text-purple-600 border-slate-300 rounded focus:ring-2 focus:ring-purple-500" 
                ${!isAvailable ? 'disabled' : ''}>
              <div class="flex-1">
                <span class="text-slate-800 font-semibold">${p.namaPeralatan}</span>
                <span class="text-slate-500 text-sm ml-2">(${kat ? kat.nama : '-'})</span>
                <span class="block text-xs ${statusColor} font-bold mt-1">
                    ${isAvailable ? `Tersedia: ${available} unit` : 'Tiada Stok Tersedia'}
                </span>
              </div>
            </label>
            <div id="user-qty-input-${p.__backendId}" class="hidden mt-3 pl-8">
                <label class="block text-xs font-medium text-slate-700 mb-1">Kuantiti Dipinjam (Maks: ${available})</label>
                <input type="number" id="user-qty-${p.__backendId}" min="1" max="${available}" value="1" 
                    oninput="validateUserQty('${p.__backendId}', ${available})" 
                    class="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                <p id="user-qty-error-${p.__backendId}" class="hidden text-[10px] text-red-600 mt-1 font-bold animate-pulse">
                    ⚠️ Kuantiti melebihi baki stok yang tersedia!
                </p>
            </div>
          </div>
        `;
    }).join('');
}

function toggleUserQtyInput(id) {
    const cb = document.querySelector(`.user-item-checkbox[data-id="${id}"]`);
    const inputDiv = document.getElementById(`user-qty-input-${id}`);
    if (cb.checked) {
        inputDiv.classList.remove('hidden');
    } else {
        inputDiv.classList.add('hidden');
    }
    updateUserSelectedItems();
}

function validateUserQty(id, max) {
    const input = document.getElementById(`user-qty-${id}`);
    const error = document.getElementById(`user-qty-error-${id}`);
    let val = parseInt(input.value) || 0;

    if (val > max) {
        input.classList.add('border-red-500', 'bg-red-50', 'text-red-900');
        input.classList.remove('border-slate-200', 'bg-white');
        error.classList.remove('hidden');
    } else {
        input.classList.remove('border-red-500', 'bg-red-50', 'text-red-900');
        input.classList.add('border-slate-200', 'bg-white');
        error.classList.add('hidden');
        if (val < 1 && input.value !== "") input.value = 1;
    }
    updateUserSelectedItems();
}

// User form functions
function closeUserForm() {
    const urlParams = new URLSearchParams(window.location.search);
    const isUserMode = urlParams.get('user') === 'true' || window.location.hash.includes('user=true');

    if (isUserMode) {
        // Attempt to close the tab
        window.close();
        // Fallback message if browser blocks window.close()
        setTimeout(() => {
            alert("Sila tutup tab ini secara manual.");
        }, 100);
    } else {
        closeModal('modal-user-form');
        // Ensure form is visible for next time (even if it was closed from success screen)
        setTimeout(() => {
            document.getElementById('form-user-permohonan').classList.remove('hidden');
            document.getElementById('user-success-container').classList.add('hidden');
        }, 500);
    }
}

function resetUserFormForNew() {
    // Hide success, show form
    document.getElementById('user-success-container').classList.add('hidden');
    document.getElementById('form-user-permohonan').classList.remove('hidden');

    // Clear everything
    document.getElementById('form-user-permohonan').reset();
    document.querySelectorAll('.user-jenis-btn').forEach(b => {
        b.classList.remove('border-purple-600', 'bg-purple-50');
        b.classList.add('border-slate-200');
    });
    toggleUserPermohonanFields();
    updateUserItemDropdown();
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
        const qtyInput = document.getElementById(`user-qty-${id}`);
        const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;

        selectedItems.push(`${name} (${qty} unit)`);
        itemsData.push({ id, name, qty });
    });

    document.getElementById('user-item-dipinjam-hidden').value = selectedItems.join(', ');
    document.getElementById('user-items-data-hidden').value = JSON.stringify(itemsData);

    checkUserDateOverlap();
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
    // Current URL minus anything from ? or # onwards
    const currentURL = window.location.origin + window.location.pathname;
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
    try {
        const toolbar = document.getElementById('editor-toolbar');
        if (toolbar && !toolbar.classList.contains('hidden')) {
            console.log('📝 Word Mode active, skipping update.');
            return;
        }

        const startEl = document.getElementById('filter-tarikh-mula');
        const endEl = document.getElementById('filter-tarikh-akhir');
        if (!startEl || !endEl) return;

        if (!startEl.value && !endEl.value) {
            const now = new Date();
            startEl.value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            endEl.value = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        }

        const permohonan = getPermohonan();
        const statusCounts = permohonan.reduce((acc, curr) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
        }, {});

        const chartStatusDiv = document.getElementById('chart-status');
        if (chartStatusDiv) {
            if (Object.keys(statusCounts).length === 0) {
                chartStatusDiv.innerHTML = '<p class="text-white/40 text-center py-8">Tiada data untuk tempoh ini</p>';
            } else {
                chartStatusDiv.innerHTML = Object.entries(statusCounts).map(([status, count]) => `
                    <div class="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 mb-3">
                        <span class="font-bold text-slate-300 text-xs uppercase tracking-wider">${status}</span>
                        <span class="font-black text-white text-xl">${count}</span>
                    </div>
                `).join('');
            }
        }

        const itemUsage = {};
        permohonan.forEach(p => {
            if (p.itemsData) {
                try {
                    const items = JSON.parse(p.itemsData);
                    items.forEach(item => { itemUsage[item.name] = (itemUsage[item.name] || 0) + (parseInt(item.qty) || 1); });
                } catch (e) { }
            } else if (p.items && p.items !== 'Dewan') {
                itemUsage[p.items] = (itemUsage[p.items] || 0) + 1;
            }
        });

        const sortedUsage = Object.entries(itemUsage).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const maxUsage = sortedUsage.length > 0 ? sortedUsage[0][1] : 1;
        const chartPeralatanDiv = document.getElementById('chart-peralatan');

        if (chartPeralatanDiv) {
            if (sortedUsage.length === 0) {
                chartPeralatanDiv.innerHTML = '<p class="text-slate-400 text-center py-4 text-xs italic">Tiada penggunaan peralatan</p>';
            } else {
                chartPeralatanDiv.innerHTML = sortedUsage.map(([name, count]) => {
                    const perc = Math.max(10, (count / maxUsage) * 100);
                    return `
                    <div class="mb-4">
                        <div class="flex justify-between items-center text-[11px] font-bold mb-1.5">
                            <span class="text-slate-700">${name}</span>
                            <span class="text-indigo-600">${count} Unit</span>
                        </div>
                        <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div class="bg-indigo-600 h-full rounded-full transition-all duration-1000" style="width: ${perc}%"></div>
                        </div>
                    </div>`
                }).join('');
            }
        }

        const activeStatusEl = document.getElementById('report-active-status');
        const topItemEl = document.getElementById('report-top-item');
        const approvalRateEl = document.getElementById('report-approval-rate');

        if (activeStatusEl) activeStatusEl.textContent = permohonan.length > 10 ? 'Sangat Tinggi' : permohonan.length > 0 ? 'Aktif' : 'Pasif';
        if (topItemEl) topItemEl.textContent = sortedUsage.length > 0 ? sortedUsage[0][0] : '-';
        if (approvalRateEl) {
            const approved = permohonan.filter(p => p.status === 'Diluluskan').length;
            const rate = permohonan.length > 0 ? Math.round((approved / permohonan.length) * 100) : 0;
            approvalRateEl.textContent = `${rate}%`;
        }

        renderLaporanPeralatanTable(itemUsage);
        renderLaporanDewanTable(permohonan);

    } catch (err) {
        console.error('❌ renderLaporan failed:', err);
    }
}

function renderLaporanPeralatanTable(usageData) {
    const tbody = document.getElementById('laporan-peralatan-table');
    if (!tbody) return;

    const peralatan = getPeralatan();
    const kategori = getKategori();

    if (peralatan.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-12 text-center text-slate-400 italic">Tiada data inventori</td></tr>';
        return;
    }

    // Filter duplicates
    const seen = new Set();
    const unique = peralatan.filter(p => {
        const key = p.namaPeralatan.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    tbody.innerHTML = unique.map(p => {
        const kat = kategori.find(k => k.__backendId === p.kategoriId);
        const usageCount = usageData[p.namaPeralatan] || 0;
        const hasStock = parseInt(p.kuantitiTersedia) > 0;

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                    <p class="font-bold text-slate-800">${p.namaPeralatan}</p>
                </td>
                <td class="px-6 py-4 text-slate-500 text-[10px] font-bold uppercase tracking-tighter">
                    ${kat ? kat.nama : '-'}
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="font-black text-indigo-700 text-lg">${usageCount}</span>
                </td>
                <td class="px-6 py-4 text-right">
                    <span class="status-badge ${hasStock ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}">
                        ${hasStock ? 'Sedia' : 'Habis'}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

function renderLaporanDewanTable(permohonanData) {
    const tbody = document.getElementById('laporan-dewan-table');
    if (!tbody) return;

    // Filter approved hall applications
    const dewanApps = permohonanData.filter(p => {
        const jenis = (p.jenisPermohonan || '').toLowerCase();
        const items = (p.items || '').toLowerCase();
        return (jenis.includes('dewan') || items.includes('dewan')) && p.status === 'Diluluskan';
    });

    if (dewanApps.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-10 text-center text-slate-300 font-medium italic">Tiada permohonan dewan direkodkan</td></tr>';
        return;
    }

    const now = new Date();
    // Sort by date
    const sortedApps = [...dewanApps].sort((a, b) => new Date(a.tarikhMulaPinjam) - new Date(b.tarikhMulaPinjam));

    const pastEvents = sortedApps.filter(p => new Date(p.tarikhMulaPinjam) < now);
    const upcomingEvents = sortedApps.filter(p => new Date(p.tarikhMulaPinjam) >= now);

    let html = `
        <tr class="bg-indigo-50/50">
            <td colspan="4" class="px-6 py-3 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                Rekod Ringkasan Fasiliti
            </td>
        </tr>
        <tr class="border-b border-slate-100">
            <td class="px-6 py-6" colspan="2">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center border border-indigo-200 shadow-sm">
                         <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <div>
                        <p class="font-black text-slate-900 text-lg leading-tight uppercase">Dewan Sri Kinabatangan</p>
                        <p class="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Status Asset: Sedia Digunakan</p>
                    </div>
                </div>
            </td>
            <td class="px-6 py-6 text-center">
                <div class="inline-flex flex-col items-center bg-white px-6 py-3 rounded-2xl border border-slate-200">
                    <span class="text-2xl font-black text-slate-800">${dewanApps.length}</span>
                    <span class="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">Total Acara</span>
                </div>
            </td>
            <td class="px-6 py-6 text-right">
                <p class="text-[10px] text-slate-400 font-bold uppercase mb-1">Kadar Penggunaan</p>
                <p class="text-sm font-black text-indigo-600">${Math.min(100, Math.round((dewanApps.length / 30) * 100))}% Bulanan</p>
            </td>
        </tr>
    `;

    // Past Events Section
    html += `
        <tr class="bg-slate-50">
            <td colspan="4" class="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                🕒 Acara Terdahulu (${pastEvents.length})
            </td>
        </tr>
    `;
    if (pastEvents.length === 0) {
        html += `<tr><td colspan="4" class="px-6 py-4 text-center text-xs text-slate-400 italic">Tiada acara terdahulu</td></tr>`;
    } else {
        pastEvents.slice(-3).reverse().forEach(p => {
            html += `
                <tr class="border-b border-slate-50 transition-colors hover:bg-slate-50/50">
                    <td class="px-6 py-4">
                        <p class="text-sm font-bold text-slate-700">${p.tujuan || 'Aktiviti Dewan'}</p>
                        <p class="text-[10px] text-slate-400 tracking-wide">${p.namaPemohon}</p>
                    </td>
                    <td class="px-6 py-4 text-xs text-slate-500">${new Date(p.tarikhMulaPinjam).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td class="px-6 py-4 text-center"><span class="px-2 py-1 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-full uppercase">Selesai</span></td>
                    <td class="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-tighter">Arsip</td>
                </tr>
            `;
        });
    }

    // Upcoming Events Section
    html += `
        <tr class="bg-indigo-50/30">
            <td colspan="4" class="px-6 py-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                📅 Acara Akan Datang (${upcomingEvents.length})
            </td>
        </tr>
    `;
    if (upcomingEvents.length === 0) {
        html += `<tr><td colspan="4" class="px-6 py-4 text-center text-xs text-slate-400 italic">Tiada acara akan datang</td></tr>`;
    } else {
        upcomingEvents.slice(0, 3).forEach(p => {
            html += `
                <tr class="border-b border-slate-50 transition-colors hover:bg-indigo-50/20">
                    <td class="px-6 py-4">
                        <p class="text-sm font-bold text-indigo-900">${p.tujuan || 'Aktiviti Dewan'}</p>
                        <p class="text-[10px] text-indigo-400 tracking-wide">${p.namaPemohon}</p>
                    </td>
                    <td class="px-6 py-4 text-xs text-indigo-600 font-bold">${new Date(p.tarikhMulaPinjam).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td class="px-6 py-4 text-center"><span class="px-2 py-1 bg-indigo-100 text-indigo-700 text-[9px] font-bold rounded-full uppercase tracking-widest shadow-sm">Booking</span></td>
                    <td class="px-6 py-4 text-right text-[10px] font-black text-indigo-600 uppercase tracking-tighter">Sedia</td>
                </tr>
            `;
        });
    }

    tbody.innerHTML = html;
}

// Date Filters for Laporan
function resetDateFilter() {
    document.getElementById('filter-tarikh-mula').value = '';
    document.getElementById('filter-tarikh-akhir').value = '';
    DataStore.notify(); // Re-render everything with original data
    showToast('🔄 Filter dikosongkan');
}

// Re-render everything triggered by filter inputs
function applyDateFilter() {
    DataStore.notify();
    showToast('✅ Data telah dikemaskini');
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

// Background Image Management Logic
let currentBgBase64 = null;

function handleBgUpload(input) {
    const file = input.files[0];
    const preview = document.getElementById('bg-preview');

    if (file) {
        if (file.size > 2 * 1024 * 1024) { // 2MB Limit
            showToast('⚠️ Fail terlalu besar! Had 2MB sahaja.');
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            currentBgBase64 = e.target.result;
            preview.innerHTML = `<img src="${currentBgBase64}" class="w-full h-full object-cover">`;
        };
        reader.readAsDataURL(file);
    }
}

function resetBgImage() {
    localStorage.removeItem('portalBgImage');
    localStorage.removeItem('portalBgSize');
    localStorage.removeItem('portalBgPosition');
    currentBgBase64 = null;
    document.getElementById('bg-preview').innerHTML = '<span class="text-xs">Tiada imej dipilih</span>';
    applyBgSettings();
    showToast('🗑️ Latar belakang telah dipadam.');
}

function updateBgPreview() {
    const preview = document.getElementById('bg-preview');
    const size = document.getElementById('bg-size').value;
    const pos = document.getElementById('bg-position').value;
    const img = preview.querySelector('img');
    if (img) {
        img.style.objectFit = size;
        img.style.objectPosition = pos;
    }
}

function saveBgSettings() {
    const size = document.getElementById('bg-size').value;
    const pos = document.getElementById('bg-position').value;

    if (currentBgBase64) {
        localStorage.setItem('portalBgImage', currentBgBase64);
    }

    localStorage.setItem('portalBgSize', size);
    localStorage.setItem('portalBgPosition', pos);

    applyBgSettings();
    showToast('✅ Tetapan latar belakang berjaya disimpan!');
}

function applyBgSettings() {
    const savedBg = localStorage.getItem('portalBgImage');
    const savedSize = localStorage.getItem('portalBgSize') || 'cover';
    const savedPos = localStorage.getItem('portalBgPosition') || 'center';

    let bgEl = document.getElementById('global-portal-bg');
    if (!bgEl) {
        bgEl = document.createElement('div');
        bgEl.id = 'global-portal-bg';
        bgEl.className = 'fixed inset-0 -z-50 pointer-events-none transition-all duration-700';
        document.body.prepend(bgEl);
    }

    if (savedBg) {
        bgEl.style.backgroundImage = `linear-gradient(rgba(15, 23, 42, 0.5), rgba(15, 23, 42, 0.5)), url(${savedBg})`;
        bgEl.style.backgroundSize = savedSize;
        bgEl.style.backgroundPosition = savedPos;
        bgEl.style.backgroundRepeat = 'no-repeat';
        bgEl.style.backgroundAttachment = 'fixed';
        bgEl.style.opacity = '1';
    } else {
        bgEl.style.backgroundImage = '';
        bgEl.style.opacity = '0';
    }

    // Also update preview if exists
    const preview = document.getElementById('bg-preview');
    if (preview && savedBg) {
        preview.innerHTML = `<img src="${savedBg}" style="width:100%; height:100%; object-fit:${savedSize}; object-position:${savedPos};">`;
    }
}

// Logo Management Logic
let currentLogoBase64 = null;

function handleLogoUpload(input) {
    const file = input.files[0];
    const preview = document.getElementById('logo-preview');

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            currentLogoBase64 = e.target.result;
            preview.innerHTML = `<img src="${currentLogoBase64}" class="w-full h-full object-contain">`;
        };
        reader.readAsDataURL(file);
    }
}

function resetLogoImage() {
    localStorage.removeItem('portalLogo');
    localStorage.removeItem('portalLogoFit');
    currentLogoBase64 = null;
    document.getElementById('logo-preview').innerHTML = '<span class="text-[10px]">Tiada logo</span>';
    applyLogoSettings();
    showToast('🗑️ Logo telah di-reset ke asal.');
}

function updateLogoPreview() {
    const preview = document.getElementById('logo-preview');
    const fit = document.getElementById('logo-fit').value;
    const img = preview.querySelector('img');
    if (img) img.style.objectFit = fit;
}

function saveLogoSettings() {
    const fit = document.getElementById('logo-fit').value;
    if (currentLogoBase64) {
        localStorage.setItem('portalLogo', currentLogoBase64);
    }
    localStorage.setItem('portalLogoFit', fit);
    applyLogoSettings();
    showToast('✅ Tetapan logo berjaya disimpan!');
}

function applyLogoSettings() {
    const savedLogo = localStorage.getItem('portalLogo');
    const savedFit = localStorage.getItem('portalLogoFit') || 'contain';

    const loginTarget = document.getElementById('login-logo-container');
    const sidebarTarget = document.getElementById('sidebar-logo-container');
    const preview = document.getElementById('logo-preview');

    if (savedLogo) {
        const logoHTML = `<img src="${savedLogo}" style="width:100%; height:100%; object-fit:${savedFit}; padding:4px;">`;
        if (loginTarget) loginTarget.innerHTML = logoHTML;
        if (sidebarTarget) sidebarTarget.innerHTML = logoHTML;

        if (document.getElementById('logo-fit')) {
            document.getElementById('logo-fit').value = savedFit;
        }

        if (preview) {
            preview.innerHTML = `<img src="${savedLogo}" style="width:100%; height:100%; object-fit:${savedFit};">`;
        }
    } else {
        const originalSVGs = {
            login: '<svg id="login-logo-svg" class="w-12 h-12" fill="none" stroke="currentColor" viewbox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>',
            sidebar: '<svg id="sidebar-logo-svg" class="w-6 h-6 text-indigo-900" fill="none" stroke="currentColor" viewbox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>'
        };
        if (loginTarget) loginTarget.innerHTML = originalSVGs.login;
        if (sidebarTarget) sidebarTarget.innerHTML = originalSVGs.sidebar;
    }
}

// --- WORD-LIKE EDITOR FOR REPORTS ---
function executeAdvancedPrint(editMode = false) {
    const showSummary = document.getElementById('print-summary').checked;
    const showPeralatan = document.getElementById('print-peralatan').checked;
    const showDewan = document.getElementById('print-dewan').checked;

    const startDate = document.getElementById('filter-tarikh-mula').value;
    const endDate = document.getElementById('filter-tarikh-akhir').value;

    // 1. Populate Printable Header Info
    const dateRangeEl = document.getElementById('print-date-range');
    const generatedDateEl = document.getElementById('print-generated-date');
    const logoTarget = document.getElementById('print-logo-target');
    const currentLogoContainer = document.getElementById('sidebar-logo-container');

    if (logoTarget && currentLogoContainer) {
        logoTarget.innerHTML = currentLogoContainer.innerHTML;
        const logoImg = logoTarget.querySelector('img');
        if (logoImg) {
            logoImg.style.padding = '0';
            logoImg.style.width = '100%';
            logoImg.style.height = '100%';
        }
    }

    if (dateRangeEl) dateRangeEl.textContent = `TEMPOH: ${startDate || '-'} hingga ${endDate || '-'}`;
    if (generatedDateEl) generatedDateEl.textContent = `DIJANA: ${new Date().toLocaleString('ms-MY')}`;

    // 2. Selection Toggle
    const summaryCards = document.getElementById('report-summary-cards');
    const summarySection = document.getElementById('report-summary-section');
    const peralatanSection = document.getElementById('report-section-peralatan');
    const dewanSection = document.getElementById('report-section-dewan');

    if (summaryCards) summaryCards.classList.toggle('print-hide', !showSummary);
    if (summarySection) summarySection.classList.toggle('print-hide', !showSummary);
    if (peralatanSection) peralatanSection.classList.toggle('print-hide', !showPeralatan);
    if (dewanSection) dewanSection.classList.toggle('print-hide', !showDewan);

    closeModal('modal-pilih-laporan');

    if (editMode) {
        openReportPreviewModal();
    } else {
        triggerPrintAction();
    }
}

function triggerPrintAction() {
    // Force Hide Toolbar if it was open
    document.getElementById('editor-toolbar').classList.add('hidden');
    document.getElementById('report-header-section').classList.add('no-print');
    document.getElementById('print-only-header').classList.remove('hidden');

    setTimeout(() => {
        window.print();
        document.getElementById('report-header-section').classList.remove('no-print');
        document.querySelectorAll('.print-hide').forEach(el => el.classList.remove('print-hide'));
        document.getElementById('print-only-header').classList.add('hidden');
    }, 250);
}

function openReportPreviewModal() {
    const modal = document.getElementById('reportPreviewModal');
    const editableArea = document.getElementById('reportEditableArea');
    if (!modal || !editableArea) return;

    // 1. Get current data and filters
    const startDate = document.getElementById('filter-tarikh-mula').value;
    const endDate = document.getElementById('filter-tarikh-akhir').value;
    const dateText = (startDate || endDate)
        ? `TEMPOH: ${startDate || '-'} HINGGA ${endDate || '-'}`
        : "TEMPOH: SEPANJANG MASA";

    const activeStatus = document.getElementById('report-active-status').textContent;
    const topItem = document.getElementById('report-top-item').textContent;
    const approvalRate = document.getElementById('report-approval-rate').textContent;

    // 2. Determine visibility from checkboxes
    const showSummary = document.getElementById('print-summary').checked;
    const showPeralatan = document.getElementById('print-peralatan').checked;
    const showDewan = document.getElementById('print-dewan').checked;

    // 3. Build Structured HTML Content
    let reportContent = `
        <div class="report-document-content">
            <!-- Formal Header -->
            <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="font-size: 24pt; font-weight: 900; margin: 0; color: #1e1b4b;">LAPORAN PENGURUSAN</h1>
                <h2 style="font-size: 14pt; font-weight: 700; margin: 5px 0 0; color: #4338ca; text-transform: uppercase;">Penggunaan Dewan dan Peralatan</h2>
                <p style="font-size: 10pt; font-weight: 600; margin-top: 15px; color: #64748b;">${dateText}</p>
            </div>

            ${showSummary ? `
            <!-- Executive Summary -->
            <div style="margin-bottom: 40px;">
                <h3 style="font-size: 12pt; font-weight: 900; text-transform: uppercase; border-left: 4px solid #4f46e5; padding-left: 10px; margin-bottom: 20px;">1. Ringkasan Eksekutif</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr>
                        <td style="padding: 15px; border: 1px solid #e2e8f0; width: 33.3%;">
                            <p style="font-size: 9pt; color: #64748b; margin: 0; text-transform: uppercase; font-weight: 700;">Status Keaktifan</p>
                            <p style="font-size: 16pt; font-weight: 900; margin: 5px 0 0; color: #1e293b;">${activeStatus}</p>
                        </td>
                        <td style="padding: 15px; border: 1px solid #e2e8f0; width: 33.3%;">
                            <p style="font-size: 9pt; color: #64748b; margin: 0; text-transform: uppercase; font-weight: 700;">Item Paling Laris</p>
                            <p style="font-size: 16pt; font-weight: 900; margin: 5px 0 0; color: #1e293b;">${topItem}</p>
                        </td>
                        <td style="padding: 15px; border: 1px solid #e2e8f0; width: 33.3%;">
                            <p style="font-size: 9pt; color: #64748b; margin: 0; text-transform: uppercase; font-weight: 700;">Kadar Kelulusan</p>
                            <p style="font-size: 16pt; font-weight: 900; margin: 5px 0 0; color: #1e293b;">${approvalRate}</p>
                        </td>
                    </tr>
                </table>
            </div>
            ` : ''}

            ${showPeralatan ? `
            <!-- Peralatan Analysis -->
            <div style="margin-bottom: 40px;">
                <h3 style="font-size: 12pt; font-weight: 900; text-transform: uppercase; border-left: 4px solid #4f46e5; padding-left: 10px; margin-bottom: 20px;">2. Analisis Peminjaman Peralatan</h3>
                <div style="margin-bottom: 20px;">
                    <p style="font-size: 10pt; color: #475569; margin-bottom: 15px;">Berikut adalah senarai peralatan yang telah dipinjam bagi tempoh berkenaan:</p>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #f8fafc;">
                                <th style="border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 9pt; text-transform: uppercase;">Peralatan</th>
                                <th style="border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 9pt; text-transform: uppercase;">Kategori</th>
                                <th style="border: 1px solid #e2e8f0; padding: 10px; text-align: center; font-size: 9pt; text-transform: uppercase;">Unit Dipinjam</th>
                                <th style="border: 1px solid #e2e8f0; padding: 10px; text-align: right; font-size: 9pt; text-transform: uppercase;">Status Inventori</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${document.getElementById('laporan-peralatan-table').innerHTML}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : ''}

            ${showDewan ? `
            <!-- Dewan Analysis -->
            <div style="margin-bottom: 40px;">
                <h3 style="font-size: 12pt; font-weight: 900; text-transform: uppercase; border-left: 4px solid #4f46e5; padding-left: 10px; margin-bottom: 20px;">3. Analisis Penggunaan Dewan</h3>
                <div style="margin-bottom: 20px;">
                    <p style="font-size: 10pt; color: #475569; margin-bottom: 15px;">Ringkasan penggunaan fasiliti dewan:</p>
                    <table style="width: 100%; border-collapse: collapse;">
                        ${document.getElementById('laporan-dewan-table').innerHTML}
                    </table>
                </div>
            </div>
            ` : ''}

            <div style="margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: left; font-size: 9pt; color: #64748b; display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <p style="margin: 0; font-weight: 700; color: #475569;">Sistem Pengurusan Peralatan & Dewan</p>
                </div>
                <div style="text-align: right;">
                    <p style="margin: 0; italic">Dijana secara automatik pada: ${new Date().toLocaleString('ms-MY', { day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true }).toUpperCase().replace(/AM/g, 'PAGI').replace(/PM/g, 'PTG')}</p>
                </div>
            </div>
        </div>
    `;

    editableArea.innerHTML = reportContent;
    modal.classList.add('active');

    // Clean up any stray classes or styles from cloned tables
    editableArea.querySelectorAll('tr, td, th').forEach(el => {
        el.className = el.className.replace(/hover:bg-slate-50|transition-colors/g, '');
    });

    // Initialize listeners
    initReportPreviewListeners();
}

function closeReportPreviewModal() {
    const modal = document.getElementById('reportPreviewModal');
    if (modal) modal.classList.remove('active');
}

function initReportPreviewListeners() {
    if (window.reportPreviewInitialized) return;

    document.getElementById('closeReportPreview').onclick = closeReportPreviewModal;
    document.getElementById('cancelReportPreview').onclick = closeReportPreviewModal;

    document.getElementById('confirmPrintBtn').onclick = () => {
        const editableArea = document.getElementById('reportEditableArea');
        const reportSource = document.getElementById('report-editable-area');
        if (editableArea && reportSource) {
            reportSource.innerHTML = editableArea.innerHTML;
            closeReportPreviewModal();
            triggerPrintAction();
        }
    };

    document.getElementById('saveReportSettingsBtn').onclick = () => {
        showToast('✅ Tetapan laporan telah dikemaskini.');
    };

    document.getElementById('increaseFontSize').onclick = () => changeFontSize(2);
    document.getElementById('decreaseFontSize').onclick = () => changeFontSize(-2);

    document.getElementById('reportLogoInput').onchange = function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                const img = document.createElement('img');
                img.src = event.target.result;
                img.id = 'report-dynamic-logo';
                img.style.width = document.getElementById('logoWidthSlider').value + 'px';
                const logoTarget = document.getElementById('reportEditableArea').querySelector('#print-logo-target');
                if (logoTarget) {
                    logoTarget.innerHTML = '';
                    logoTarget.appendChild(img);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    document.getElementById('logoWidthSlider').oninput = function (e) {
        const val = e.target.value;
        document.getElementById('logoWidthValue').textContent = val + 'px';
        const img = document.getElementById('report-dynamic-logo');
        if (img) img.style.width = val + 'px';
        else {
            const logoTarget = document.getElementById('reportEditableArea').querySelector('#print-logo-target img');
            if (logoTarget) logoTarget.style.width = val + 'px';
        }
    };

    window.reportPreviewInitialized = true;
}

function switchRibbonTab(tabId) {
    document.querySelectorAll('.ribbon-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelectorAll('.ribbon-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.ribbon-tab[onclick="switchRibbonTab('${tabId}')"]`).classList.add('active');
}

function transformText(type) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    let target = selection.commonAncestorContainer;
    if (target.nodeType === 3) target = target.parentElement;
    target.style.textTransform = type;
}

function updateLineHeight(val) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    let target = selection.commonAncestorContainer;
    if (target.nodeType === 3) target = target.parentElement;
    target.style.lineHeight = val;
}

window.formatDoc = function (cmd, value = null) {
    document.execCommand(cmd, false, value);
}

function toggleWordMode(active) {
    const toolbar = document.getElementById('editor-toolbar');
    const content = document.getElementById('page-laporan');
    if (active) {
        toolbar.classList.remove('hidden');
        content.classList.add('editing-active');
        document.querySelectorAll(`#page-laporan p, #page-laporan span, #page-laporan h1, #page-laporan h2, #page-laporan h3`).forEach(el => {
            if (el.innerText.trim().length > 0) el.setAttribute('contenteditable', 'true');
        });
    } else {
        toolbar.classList.add('hidden');
        content.classList.remove('editing-active');
        document.querySelectorAll('#page-laporan [contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    }
}

function changeFontSize(delta) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    // Get the range and the common ancestor
    const range = selection.getRangeAt(0);
    let target = range.commonAncestorContainer;

    // If it's a text node, get the parent element
    if (target.nodeType === 3) target = target.parentElement;

    // Logic: If there is a selection, wrap in span or apply to selected blocks
    if (!selection.isCollapsed) {
        // Advanced: Apply to the parent block to keep it simple for user
        const currentSize = window.getComputedStyle(target).fontSize;
        const newSize = Math.max(8, parseFloat(currentSize) + delta) + 'px';
        target.style.fontSize = newSize;

        showToast(`📏 Saiz tulisan: ${newSize}`);
    } else {
        // If just cursor is placed, change the whole block for convenience
        const currentSize = window.getComputedStyle(target).fontSize;
        const newSize = Math.max(8, parseFloat(currentSize) + delta) + 'px';
        target.style.fontSize = newSize;
    }
}

function saveEditorChanges() {
    toggleWordMode(false);
    showToast('✅ Tetapan disimpan. Memulakan cetakan...');
    setTimeout(triggerPrintAction, 500);
}
