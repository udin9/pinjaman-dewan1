// ===== FIREBASE AUTH HANDLER =====
let auth = null;
let firebaseInitialized = false;
let firebaseReadyPromise = null;

// Create a promise that resolves when Firebase is ready
function getFirebaseReady() {
    return new Promise((resolve) => {
        if (firebaseInitialized && auth) {
            resolve();
            return;
        }

        // Poll every 100ms until Firebase is ready
        const checkInterval = setInterval(() => {
            if (firebaseInitialized && auth && typeof firebase !== 'undefined') {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            resolve(); // Resolve anyway to avoid infinite wait
        }, 10000);
    });

// Helper to show login errors in the UI
function showLoginError(message, duration = 7000) {
    const errDiv = document.getElementById('login-error');
    const details = document.getElementById('login-error-details');
    if (errDiv) errDiv.classList.remove('hidden');
    if (details) {
        details.textContent = message;
        details.classList.remove('hidden');
    }
    console.error('Login error:', message);
    // Auto-hide after a while
    setTimeout(() => {
        if (errDiv) errDiv.classList.add('hidden');
        if (details) details.classList.add('hidden');
    }, duration);
}

// Load Firebase SDKs dynamically if they are not already present. This helps when CDN is blocked or network is slow.
async function ensureFirebaseSDKs(timeoutMs = 10000) {
    if (typeof firebase !== 'undefined') return;
    if (window._firebaseLoadAttempted) return; // prevent duplicate attempts
    window._firebaseLoadAttempted = true;

    const statusEl = document.getElementById('login-status');
    if (statusEl) {
        statusEl.textContent = 'Memuat Firebase SDK...';
        statusEl.classList.remove('hidden');
    }

    const urls = [
        'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js',
        'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js',
        'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js'
    ];

    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = url;
            s.async = true;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Gagal memuat ' + url));
            document.head.appendChild(s);
        });
    }

    // Timeout wrapper
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout memuat Firebase SDK')), timeoutMs));

    try {
        await Promise.race([Promise.all(urls.map(loadScript)), timeoutPromise]);
        if (statusEl) {
            statusEl.textContent = 'Firebase SDK dimuat';
            setTimeout(() => statusEl.classList.add('hidden'), 1500);
        }
        console.log('✅ Firebase SDKs loaded dynamically');
    } catch (err) {
        if (statusEl) {
            statusEl.textContent = 'Gagal memuat Firebase SDK';
        }
        console.error('❌ ensureFirebaseSDKs error:', err);
        throw err;
    }
} 
}

// Initialize Firebase when page is ready
async function initializeFirebase() {
    if (firebaseInitialized) {
        console.log('ℹ️ Firebase already initialized');
        return;
    }

    if (typeof firebase === 'undefined') {
        try {
            await ensureFirebaseSDKs();
        } catch (err) {
            console.error('❌ Firebase SDK load failed:', err);
            showLoginError('Gagal memuat Firebase SDK. Sila semak sambungan rangkaian atau pembekal CDN.');
            // Retry after a delay so user can fix network/pop-up issues
            setTimeout(initializeFirebase, 3000);
            return;
        }
    }

    try {
        const firebaseConfig = {
            apiKey: "AIzaSyAYBhrerG2yfHk-xFna0tLI-QbaVDNaV5M",
            authDomain: "sistem-alat-ganti.firebaseapp.com",
            projectId: "sistem-alat-ganti",
            appId: "1:974832583504:web:b3c94e86651d299d252255"
        };

        // Initialize Firebase if not already initialized
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log('🔥 Firebase app initialized');
        }

        auth = firebase.auth();
        // Initialize Firestore if available (we included the firestore SDK)
        if (typeof firebase.firestore === 'function') {
            db = firebase.firestore();
            window.db = db;
            console.log('🔥 Firestore ready');
        }
        firebaseInitialized = true;
        window.firebaseReady = true;
        console.log('🔥 Firebase Auth ready');

        // Setup auth listener
        setupAuthListener();

    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        showLoginError('Firebase initialization error: ' + (error.message || error));
        // Retry after delay
        setTimeout(initializeFirebase, 1000);
    }
}

// Setup authentication state listener
function setupAuthListener() {
    if (!auth) {
        console.error('❌ Auth not available for listener');
        return;
    }

    try {
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('✅ User logged in:', user.email);
                isLoggedIn = true;
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userEmail', user.email);
                // Try to get role & name from Firestore 'users' collection
                if (typeof db !== 'undefined') {
                    db.collection('users').doc(user.uid).get()
                        .then(docSnap => {
                            if (docSnap.exists) {
                                const u = docSnap.data();
                                localStorage.setItem('userRole', u.role || '');
                                localStorage.setItem('userName', u.name || user.displayName || user.email);
                            } else {
                                localStorage.setItem('userName', user.displayName || user.email);
                            }
                        }).catch(err => {
                            console.warn('Firestore read error:', err);
                            localStorage.setItem('userName', user.displayName || user.email);
                        });
                } else {
                    localStorage.setItem('userName', user.displayName || user.email);
                }

                const pageLogin = document.getElementById('login-page');
                const pageApp = document.getElementById('app');
                if (pageLogin) pageLogin.classList.add('hidden');
                if (pageApp) pageApp.classList.remove('hidden');

                if (typeof DataStore !== 'undefined') {
                    DataStore.notify();
                }
                const lastPage = localStorage.getItem('lastPage') || 'dashboard';
                showPage(lastPage);
            } else {
                console.log('ℹ️ No user logged in');
            }
        });
    } catch (error) {
        console.error('❌ Error setting up auth listener:', error);
    }
}

// Google Sign-In button handler
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase immediately
    initializeFirebase();

    // Setup Google button
    const googleSignInBtn = document.getElementById('btn-google-signin');
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', handleGoogleSignIn);
        console.log('✅ Google Sign-In button ready');
    }
});

window.handleGoogleSignIn = async function () {
    console.log('🔐 Google Sign-In clicked');

    const btn = document.getElementById('btn-google-signin');
    const originalHTML = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<svg class="animate-spin h-5 w-5 text-indigo-600 mx-auto" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';

    try {
        // Wait for Firebase to be ready
        console.log('⏳ Waiting for Firebase...');
        await getFirebaseReady();

        if (!auth || !firebaseInitialized || typeof firebase === 'undefined') {
            console.error('❌ Firebase auth still not ready after wait');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            alert('⚠️ Sistem belum siap. Sila refresh halaman dan cuba lagi.');
            return;
        }

        console.log('✅ Firebase ready, opening sign-in popup...');
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');

        console.log('📱 Opening Google sign-in popup...');
        const result = await auth.signInWithPopup(provider);

        console.log('✅ Google Sign-In Success:', result.user.email);
        // Auth state change listener akan handle UI update automatically

    } catch (error) {
        console.error('❌ Google Sign-In Error:', error.code, error.message);
        btn.disabled = false;
        btn.innerHTML = originalHTML;

        if (error.code === 'auth/popup-closed-by-user') {
            console.log('ℹ️ User closed login popup');
            // Just reset button, don't show alert
        } else if (error.code === 'auth/popup-blocked') {
            alert('⚠️ Popup diblok oleh browser. Sila benarkan popup untuk domain ini.');
        } else if (error.code === 'auth/network-request-failed') {
            alert('❌ Ralat rangkaian. Sila semak sambungan internet Anda.');
        } else if (error.code === 'auth/invalid-api-key' || error.code === 'auth/configuration-not-found') {
            alert('❌ Ralat konfigurasi Firebase. Sila hubungi pentadbir sistem.');
            console.error('Firebase config error - ensure authorized domains are set in Firebase Console');
        } else {
            alert('❌ Ralat login: ' + error.message);
        }
    }
};

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

        // Refresh the permohonan table to show new entry
        renderPermohonan();
        updateDashboard();
    } else {
        console.error('❌ Error:', result.error);
        showToast('Gagal menambah permohonan');
    }

    btn.disabled = false;
    btn.textContent = 'Hantar Permohonan';
});

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
    // Quick UI feedback: disable submit and show loading text
    const submitBtn = document.querySelector('#form-login button[type="submit"]');
    const originalBtnHTML = submitBtn ? submitBtn.innerHTML : null;
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sila tunggu...';
    }
    function restoreSubmit() {
        if (submitBtn) {
            submitBtn.disabled = false;
            if (originalBtnHTML) submitBtn.innerHTML = originalBtnHTML;
        }
    }
    // Try Firebase auth first when available
    if (auth && firebaseInitialized) {
        try {
            const res = await auth.signInWithEmailAndPassword(username, password);
            console.log('✅ Firebase login success:', res.user.email);
            localStorage.setItem('isLoggedIn', 'true');
            restoreSubmit();
            return;
        } catch (err) {
            console.warn('Firebase login failed:', err.code, err.message);
            if (err.code !== 'auth/user-not-found' && err.code !== 'auth/wrong-password') {
                showLoginError('Ralat sambungan log masuk: ' + (err.message || err.code));
                restoreSubmit();
                return;
            }
        }
    }

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        isLoggedIn = true;
        localStorage.setItem('isLoggedIn', 'true'); // Save state
        restoreSubmit();

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
        showLoginError('Username atau password salah');
        restoreSubmit();
    }
};


// Allow Enter key to trigger login
document.getElementById('form-login').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleLogin();
    }
});
// Also handle form submit
document.getElementById('form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    handleLogin();
});
// Extra: also listen for direct button clicks to ensure we catch clicks even if form submit is intercepted elsewhere
const loginSubmitBtn = document.querySelector('#form-login button[type="submit"]');
if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('🔘 Login submit button clicked');
        handleLogin();
    });
}

// Logout function
function logout() {
    console.log('🚪 Logout triggered');

    // Clear UI first
    isLoggedIn = false;
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('lastPage');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');

    const appEl = document.getElementById('app');
    const loginEl = document.getElementById('login-page');

    if (appEl) appEl.classList.add('hidden');
    if (loginEl) loginEl.classList.remove('hidden');

    // Clear form
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';

    // Firebase Sign Out (if available)
    if (auth && firebaseInitialized) {
        auth.signOut()
            .then(() => {
                console.log('✅ Firebase signed out');
            })
            .catch((error) => {
                console.error('⚠️ Firebase logout error (non-critical):', error.message);
            });
    } else {
        console.log('ℹ️ Firebase not initialized, skipping Firebase sign-out');
    }
}

// Login credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// end off login data

// Helper functions - Show all permohonan data
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

    // Render permohonan table when showing page
    if (page === 'permohonan') {
        renderPermohonan();
    }

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

    // Safety check - if element doesn't exist, skip rendering
    if (!tbody) {
        console.warn('⚠️ renderPermohonan: Element #permohonan-table not found');
        return;
    }

    const permohonan = getPermohonan();

    if (permohonan.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="px-6 py-12 text-center text-slate-400">Tiada permohonan</td></tr>';
        return;
    }

    tbody.innerHTML = permohonan.map(p => {
        // Format items display
        let itemsDisplay = '-';
        if (p.itemsData) {
            try {
                const items = JSON.parse(p.itemsData);
                itemsDisplay = items.map((item, idx) => `${idx + 1}. ${item.name} (${item.qty} unit)`).join('<br>');
            } catch (e) {
                itemsDisplay = p.items || '-';
            }
        } else if (p.items && p.items !== 'Dewan') {
            itemsDisplay = p.items;
        }

        return `
        <tr class="hover:bg-slate-50">
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-sm">
                ${p.nama ? p.nama.charAt(0).toUpperCase() : 'U'}
              </div>
              <span class="font-medium text-slate-800">${p.nama || '-'}</span>
            </div>
          </td>
          <td class="px-6 py-4 text-slate-600 text-sm">${p.email || '-'}</td>
          <td class="px-6 py-4 text-slate-600 text-sm">${p.nomorTelefon || '-'}</td>
          <td class="px-6 py-4 text-slate-600 text-sm">${p.cawangan || '-'}</td>
          <td class="px-6 py-4 text-slate-600 text-sm font-semibold">${p.jenisPermohonan || '-'}</td>
          <td class="px-6 py-4 text-slate-600 text-sm">
            <div class="whitespace-pre-wrap">${itemsDisplay}</div>
          </td>
          <td class="px-6 py-4 text-slate-600 text-sm">${formatDate(p.tarikhMulaPinjam)}</td>
          <td class="px-6 py-4 text-slate-600 text-sm">${formatDate(p.tarikhPulang)}</td>
          <td class="px-6 py-4"><span class="status-badge ${getStatusClass(p.status)}">${p.status || 'Dalam Proses'}</span></td>
          <td class="px-6 py-4">
            <div class="flex gap-2 flex-wrap">
              ${p.status === 'Selesai' ? '<span class="text-green-600 text-sm font-medium">✓ Selesai</span>' : `<button onclick="quickMarkCompleted('${p.__backendId}')" class="text-green-600 hover:text-green-800 text-sm font-medium" title="Tandai Selesai">✓ Selesai</button>`}
              <button onclick="openTindakan('${p.__backendId}')" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Urus</button>
              <button onclick="openDeleteModal('${p.__backendId}', 'permohonan')" class="text-red-600 hover:text-red-800 text-sm font-medium">Padam</button>
            </div>
          </td>
        </tr>
      `}).join('');
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('ms-MY', { dateStyle: 'short', timeStyle: 'short' });
}

// Render kategori
function renderKategori() {
    const container = document.getElementById('kategori-list');

    // Safety check - if element doesn't exist, skip rendering
    if (!container) {
        console.warn('⚠️ renderKategori: Element #kategori-list not found');
        return;
    }

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

    // Safety check - if element doesn't exist, skip rendering
    if (!container) {
        console.warn('⚠️ renderPeralatan: Element #peralatan-list not found');
        return;
    }

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

            // Calculate end of existing booking day (next day midnight)
            const existingEndMidnight = new Date(existingEnd);
            existingEndMidnight.setDate(existingEndMidnight.getDate() + 1);
            existingEndMidnight.setHours(0, 0, 0, 0);

            // New booking start should be on or after existing booking end midnight
            if (startDate < existingEndMidnight && endDate > existingStart) {
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

                    // Calculate end of existing booking day (next day midnight)
                    const existingEndMidnight = new Date(existingEnd);
                    existingEndMidnight.setDate(existingEndMidnight.getDate() + 1);
                    existingEndMidnight.setHours(0, 0, 0, 0);

                    // Check overlap: new start < existing end midnight AND new end > existing start
                    if (startDate < existingEndMidnight && endDate > existingStart) {
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

            // Calculate end of existing booking day (next day midnight)
            const existingEndMidnight = new Date(existingEnd);
            existingEndMidnight.setDate(existingEndMidnight.getDate() + 1);
            existingEndMidnight.setHours(0, 0, 0, 0);

            // New booking start should be on or after existing booking end midnight
            if (startDate < existingEndMidnight && endDate > existingStart) {
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

                    // Calculate end of existing booking day (next day midnight)
                    const reqEndMidnight = new Date(reqEnd);
                    reqEndMidnight.setDate(reqEndMidnight.getDate() + 1);
                    reqEndMidnight.setHours(0, 0, 0, 0);

                    // Check overlap: new start < existing end midnight AND new end > existing start
                    if (startDate < reqEndMidnight && endDate > reqStart) {
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

    // Safety check - if element doesn't exist, skip
    if (!select) {
        console.warn('⚠️ updateKategoriDropdown: Element #kategori-peralatan not found');
        return;
    }

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

                // Calculate end of existing booking day (next day midnight)
                const reqEndMidnight = new Date(reqEnd);
                reqEndMidnight.setDate(reqEndMidnight.getDate() + 1);
                reqEndMidnight.setHours(0, 0, 0, 0);

                // Check overlap: new start < existing end midnight AND new end > existing start
                if (start < reqEndMidnight && end > reqStart) {
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

    // Set tarikh selesai if already recorded
    document.getElementById('tarikh-selesai').value = permohonan.tarikhSelesai ? formatDate(permohonan.tarikhSelesai) : '';

    // Hide/Show button Selesai based on status
    const btnSelesai = document.getElementById('btn-mark-selesai');
    if (permohonan.status === 'Selesai' || permohonan.statusSelesai === true) {
        btnSelesai.classList.add('hidden');
    } else {
        btnSelesai.classList.remove('hidden');
    }

    // Populate items edit section if permohonan is for Peralatan
    if (permohonan.jenisPermohonan === 'Peralatan') {
        document.getElementById('items-edit-section').classList.remove('hidden');
        populateItemsEditContainer(permohonan);
    } else {
        document.getElementById('items-edit-section').classList.add('hidden');
    }

    openModal('modal-tindakan');
}

// Populate items edit container with checkboxes
function populateItemsEditContainer(permohonan) {
    const container = document.getElementById('items-edit-container');
    const peralatan = getPeralatan();

    if (peralatan.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-sm text-center py-4">Tiada peralatan tersedia</p>';
        return;
    }

    // Parse existing items
    let selectedItems = [];
    if (permohonan.itemsData) {
        try {
            selectedItems = JSON.parse(permohonan.itemsData);
        } catch (e) {
            selectedItems = [];
        }
    }

    container.innerHTML = peralatan.map((p, idx) => {
        const selected = selectedItems.find(item => item.name === p.namaPeralatan);
        const qty = selected ? selected.qty : 0;
        const tersedia = Math.max(0, parseInt(p.kuantitiTersedia) || 0);
        const isAvailable = tersedia > 0;

        return `
            <div class="border border-slate-300 rounded-lg p-4 bg-white hover:bg-slate-50 transition-colors">
                <div class="flex items-start gap-4">
                    <div class="flex items-center pt-1">
                        <input type="checkbox" id="item-tindakan-${p.__backendId}" class="item-tindakan-checkbox w-5 h-5 cursor-pointer"
                            data-name="${p.namaPeralatan}" ${selected ? 'checked' : ''} onchange="updateTindakanItemsDisplay()">
                    </div>
                    <div class="flex-1 min-w-0">
                        <label for="item-tindakan-${p.__backendId}" class="cursor-pointer block">
                            <p class="font-bold text-slate-800 text-base">${idx + 1}. ${p.namaPeralatan}</p>
                            <p class="text-xs ${isAvailable ? 'text-green-600' : 'text-red-600'} font-semibold mt-1">Stok Tersedia: ${tersedia} unit</p>
                        </label>
                    </div>
                    <div class="flex items-center gap-2 flex-shrink-0">
                        <input type="number" id="qty-tindakan-${p.__backendId}" min="1" max="${tersedia}" value="${selected ? qty : 1}"
                            class="item-tindakan-qty w-20 px-3 py-2 border border-slate-300 rounded-lg text-center text-sm font-medium" ${selected ? '' : 'disabled'}>
                        <span class="text-sm text-slate-600 font-medium min-w-[40px]">unit</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Re-attach event listeners
    document.querySelectorAll('.item-tindakan-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const qty = document.getElementById(`qty-tindakan-${this.dataset.name.split('###')[0]}`);
            if (qty) qty.disabled = !this.checked;
            updateTindakanItemsDisplay();
        });
    });
}

// Update items display and itemsData after editing
function updateTindakanItemsDisplay() {
    const selected = [];
    document.querySelectorAll('.item-tindakan-checkbox:checked').forEach(checkbox => {
        const name = checkbox.dataset.name;
        // Find the corresponding qty input
        const qtyInput = document.querySelector(`input.item-tindakan-qty[data-name="${name}"]`);
        if (!qtyInput) {
            // Try by finding the container and looking for qty input
            const container = checkbox.closest('div[class*="flex items-center"]');
            const qtyEl = container?.querySelector('input[type="number"]');
            const qty = qtyEl ? parseInt(qtyEl.value) || 1 : 1;
            selected.push({ name, qty });
        } else {
            const qty = parseInt(qtyInput.value) || 1;
            selected.push({ name, qty });
        }
    });

    // Store items data for form submission
    window.tindakanSelectedItems = selected;
}

// Mark permohonan as completed with timestamp
function markAsCompleted() {
    const id = document.getElementById('tindakan-id').value;
    const data = allData.find(d => d.__backendId === id);

    if (!data) {
        showToast('❌ Data tidak dijumpai');
        return;
    }

    // Record completion timestamp and mark statusSelesai only if not already recorded
    if (!data.statusSelesai) {
        data.statusSelesai = true;
        data.tarikhSelesai = new Date().toISOString();
        data.status = 'Selesai';
        DataStore.save(allData);
        showToast('✅ Tarikh selesai telah direkodkan!');
    } else {
        showToast('⚠️ Tarikh selesai sudah direkodkan sebelumnya');
    }

    // Update the display field
    document.getElementById('tarikh-selesai').value = formatDate(data.tarikhSelesai);
    document.getElementById('status-permohonan').value = 'Selesai';
}

// Quick mark as completed from table
function quickMarkCompleted(id) {
    const data = allData.find(d => d.__backendId === id);

    if (!data) {
        showToast('❌ Data tidak dijumpai');
        return;
    }

    // Record completion timestamp and mark statusSelesai
    if (!data.statusSelesai) {
        data.statusSelesai = true;
        data.tarikhSelesai = new Date().toISOString();
        data.status = 'Selesai';
        DataStore.save(allData);
        showToast('✅ Permohonan ditandai selesai!');
        renderPermohonan();
        renderLaporanDewanTable(getPermohonan()); // Update laporan
    } else {
        showToast('⚠️ Permohonan sudah ditandai selesai sebelumnya');
    }
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

        // Update items if edited (for Peralatan permohonan)
        if (window.tindakanSelectedItems && window.tindakanSelectedItems.length > 0) {
            data.itemsData = JSON.stringify(window.tindakanSelectedItems);
            const itemNames = window.tindakanSelectedItems.map(item => `${item.name} (${item.qty} unit)`).join(', ');
            data.items = itemNames;
        }

        // If status is set to "Selesai", mark statusSelesai as true and record completion time
        if (status === 'Selesai' && !data.statusSelesai) {
            data.statusSelesai = true;
            data.tarikhSelesai = new Date().toISOString();
        }

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
                chartStatusDiv.innerHTML = '<p class="text-slate-400 text-center py-8">Tiada data untuk tempoh ini</p>';
            } else {
                chartStatusDiv.innerHTML = Object.entries(statusCounts).map(([status, count]) => `
                    <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-3">
                        <span class="font-bold text-slate-700 text-xs uppercase tracking-wider">${status}</span>
                        <span class="font-black text-indigo-600 text-xl">${count}</span>
                    </div>
                `).join('');
            }
        }

        const itemUsage = {};
        permohonan.forEach(p => {
            if (p.itemsData) {
                try {
                    const items = JSON.parse(p.itemsData);
                    items.forEach(item => {
                        // Hitung kekerapan permohonan (1 permohonan = 1, tidak kira unit)
                        itemUsage[item.name] = (itemUsage[item.name] || 0) + 1;
                    });
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
                            <span class="text-indigo-600">${count} Kali</span>
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

    // Filter approved hall applications (hanya Diluluskan & Selesai)
    const dewanApps = permohonanData.filter(p => {
        const jenis = (p.jenisPermohonan || '').toLowerCase();
        const items = (p.items || '').toLowerCase();
        return (jenis.includes('dewan') || items.includes('dewan')) && (p.status === 'Diluluskan' || p.status === 'Selesai');
    });

    if (dewanApps.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-10 text-center text-slate-300 font-medium italic">Tiada permohonan dewan direkodkan</td></tr>';
        return;
    }

    const now = new Date();
    // Sort by date
    const sortedApps = [...dewanApps].sort((a, b) => new Date(a.tarikhMulaPinjam) - new Date(b.tarikhMulaPinjam));

    // Categorize events:
    // 1. Acara Terdahulu = Status "Selesai" (baik dari button OR status field) - ONLY SHOW IF STATUS IS "SELESAI"
    // 2. Acara Akan Datang = Tarikh Mula Penggunaan belum tiba (startDate > now)
    // 3. Acara Sedang Berlangsung = Sudah bermula tapi belum selesai (startDate <= now < endDate + 1 day)

    const pastEvents = sortedApps.filter(p => {
        // Only show as past if status is explicitly "Selesai"
        return p.status === 'Selesai';
    });

    const upcomingEvents = sortedApps.filter(p => {
        const startDate = new Date(p.tarikhMulaPinjam);
        return startDate > now;
    });

    const ongoingEvents = sortedApps.filter(p => {
        const startDate = new Date(p.tarikhMulaPinjam);
        const endDate = new Date(p.tarikhPulang);
        // Calculate midnight (00:00) of the next day after end date
        const nextDayMidnight = new Date(endDate);
        nextDayMidnight.setDate(nextDayMidnight.getDate() + 1);
        nextDayMidnight.setHours(0, 0, 0, 0);
        return startDate <= now && now < nextDayMidnight;
    });

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

    // Ongoing Events Section
    html += `
        <tr class="bg-orange-50">
            <td colspan="4" class="px-6 py-4 text-[10px] font-black text-orange-600 uppercase tracking-widest">
                🔴 Acara Sedang Berlangsung (${ongoingEvents.length})
            </td>
        </tr>
    `;
    if (ongoingEvents.length === 0) {
        html += `<tr><td colspan="4" class="px-6 py-4 text-center text-xs text-slate-400 italic">Tiada acara sedang berlangsung</td></tr>`;
    } else {
        ongoingEvents.forEach(p => {
            html += `
                <tr class="border-b border-orange-100 transition-colors hover:bg-orange-50/30 bg-orange-50/10">
                    <td class="px-6 py-4">
                        <p class="text-sm font-bold text-orange-900">${p.tujuan || 'Aktiviti Dewan'}</p>
                        <p class="text-[10px] text-orange-500 tracking-wide">${p.nama || 'Pemohon'}</p>
                    </td>
                    <td class="px-6 py-4">
                        <div class="text-xs text-orange-700 font-medium">
                            <p class="text-orange-900 font-bold">Tarikh Penggunaan</p>
                            <p class="font-bold">${new Date(p.tarikhMulaPinjam).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' })} - ${new Date(p.tarikhPulang).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-center"><span class="px-2 py-1 bg-orange-200 text-orange-800 text-[9px] font-bold rounded-full uppercase tracking-widest shadow-sm animate-pulse">Sedang</span></td>
                    <td class="px-6 py-4 text-right text-[10px] font-black text-orange-600 uppercase tracking-tighter">Aktif</td>
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
                        <p class="text-[10px] text-indigo-400 tracking-wide">${p.nama || 'Pemohon'}</p>
                    </td>
                    <td class="px-6 py-4">
                        <div class="text-xs text-indigo-600 font-medium">
                            <p class="text-indigo-900 font-bold">Tarikh Penggunaan</p>
                            <p class="font-bold">${new Date(p.tarikhMulaPinjam).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' })} - ${new Date(p.tarikhPulang).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-center"><span class="px-2 py-1 bg-indigo-100 text-indigo-700 text-[9px] font-bold rounded-full uppercase tracking-widest shadow-sm">Booking</span></td>
                    <td class="px-6 py-4 text-right text-[10px] font-black text-indigo-600 uppercase tracking-tighter">Sedia</td>
                </tr>
            `;
        });
    }

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
                        <p class="text-[10px] text-slate-400 tracking-wide">${p.nama || 'Pemohon'}</p>
                    </td>
                    <td class="px-6 py-4">
                        <div class="text-xs text-slate-500 font-medium">
                            <p class="text-slate-600 font-bold">Tarikh Tamat</p>
                            <p>${new Date(p.tarikhMulaPinjam).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' })} - ${new Date(p.tarikhPulang).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-center"><span class="px-2 py-1 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-full uppercase">Selesai</span></td>
                    <td class="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-tighter">Arsip</td>
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
    console.log('applyDateFilter called');
    // Ensure data store updates and laporan rerenders immediately
    try {
        DataStore.notify();
        renderLaporan();
        showToast('✅ Data telah dikemaskini');
    } catch (e) {
        console.error('❌ applyDateFilter error:', e);
        showToast('❌ Gagal menerapkan filter. Lihat console.');
    }
}

// Date Filters for Senarai Permohonan section
function applyPermohonanDateFilter() {
    console.log('applyPermohonanDateFilter called');
    try {
        DataStore.notify();
        renderPermohonan();
        showToast('✅ Filter telah diterapkan');
    } catch (e) {
        console.error('❌ applyPermohonanDateFilter error:', e);
        showToast('❌ Gagal menerapkan filter permohonan. Lihat console.');
    }
}

function resetPermohonanDateFilter() {
    const filterStart = document.getElementById('permohonan-filter-tarikh-mula');
    const filterEnd = document.getElementById('permohonan-filter-tarikh-akhir');
    if (filterStart) filterStart.value = '';
    if (filterEnd) filterEnd.value = '';
    try {
        DataStore.notify();
        renderPermohonan();
        showToast('🔄 Filter dikosongkan');
    } catch (e) {
        console.error('❌ resetPermohonanDateFilter error:', e);
        showToast('❌ Gagal reset filter. Lihat console.');
    }
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

//arealoginscript

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

//login page script

// LOGIN FUNCTION
// ===== LOGIN =====
// ===== LOGIN =====
const loginForm = document.getElementById('loginForm');
const loadingOverlay = document.getElementById('loadingOverlay');

function showLoader() {
    loadingOverlay.style.display = 'flex';
}

function hideLoader() {
    loadingOverlay.style.display = 'none';
}

if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        showLoader();

        setTimeout(() => {
            hideLoader();

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();

            // Ambil user dari localStorage
            fetch("data/users.json")
                .then(res => res.json())
                .then(users => {

                    const foundUser = users.find(
                        u => u.id === username && u.password === password
                    );

                    if (!foundUser) {
                        alert("❌ Username atau password salah!");
                        return;
                    }

                    // SIMPAN SESSION (kekalkan logic anda)
                    sessionStorage.setItem("loggedIn", "true");
                    sessionStorage.setItem("currentUser", JSON.stringify(foundUser));

                    window.location.href = "dashboard.html";
                })
                .catch(() => {
                    alert("❌ Gagal load data user");
                });


        }, 1500);
    });
}

// ===== SESSION CHECK =====
if (window.location.pathname.endsWith("dashboard.html")) {
    if (sessionStorage.getItem("loggedIn") !== "true") {
        window.location.href = "index.html";
    }
}

// ===== AUTO LOGOUT + REMINDER =====
let timeoutReminder, autoLogout;
const timeoutLimit = 10 * 60 * 1000; // 10 minit
const reminderTime = 9 * 60 * 1000;  // 1 minit sebelum logout

// Popup reminder
const timeoutReminderDiv = document.createElement('div');
timeoutReminderDiv.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:rgba(26,188,156,0.95);color:#fff;padding:18px 25px;border-radius:12px;font-weight:700;box-shadow:0 0 15px #1abc9c,0 0 25px rgba(26,188,156,0.5);text-align:center;display:none;z-index:9999;';
timeoutReminderDiv.innerHTML = '⚠️ Anda akan logout dalam 1 minit kerana tiada aktiviti! <button id="stayLoggedIn" style="margin-top:10px;padding:8px 16px;border:none;border-radius:10px;background:#3498db;color:#fff;cursor:pointer;box-shadow:0 5px 15px rgba(0,0,0,0.4);">Terus Login</button>';
document.body.appendChild(timeoutReminderDiv);
const stayBtn = document.getElementById('stayLoggedIn');

function resetIdleTimer() {
    clearTimeout(timeoutReminder); clearTimeout(autoLogout);
    timeoutReminderDiv.style.display = 'none';
    startIdleTimer();
}

function startIdleTimer() {
    timeoutReminder = setTimeout(() => { timeoutReminderDiv.style.display = 'block'; }, reminderTime);
    autoLogout = setTimeout(() => { sessionStorage.removeItem("loggedIn"); window.location.href = "index.html"; }, timeoutLimit);
}

['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => { document.addEventListener(evt, resetIdleTimer, false); });
stayBtn.addEventListener('click', () => { timeoutReminderDiv.style.display = 'none'; resetIdleTimer(); });
startIdleTimer();

// ===== BURGER MENU LOGOUT CONFIRM =====
const logoutBtn = document.getElementById('logoutBtn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation(); // ⬅️ INI FIX UTAMA
        // Simpan last section / scroll
        const dashboardState = {
            scrollY: window.scrollY,
            lastSection: window.location.hash || '#dashboard'
        };
        localStorage.setItem('dashboardState', JSON.stringify(dashboardState));

        // Tambah overlay
        let overlayDiv = document.createElement('div');
        overlayDiv.id = "logoutOverlay";
        overlayDiv.style.display = 'block';
        document.body.appendChild(overlayDiv);

        // Buat popup confirm logout
        let confirmDiv = document.createElement('div');
        confirmDiv.id = "confirmLogoutDiv";
        confirmDiv.style.cssText = `
      position:fixed;top:50%;left:50%;
      transform:translate(-50%,-50%);
      background:rgba(44,62,80,0.95);
      color:#fff;
      padding:25px 35px;
      border-radius:15px;
      box-shadow:0 0 20px #3498db,0 0 35px rgba(52,152,219,0.5);
      text-align:center;
      z-index:9999;
    `;
        confirmDiv.innerHTML = `
      <p>⚠️ Anda pasti mahu logout?</p>
      <div style="margin-top:20px;display:flex;justify-content:space-around;gap:15px;">
        <button id="cancelLogoutBtn" style="
          padding:10px 20px;
          border:none;
          border-radius:12px;
          background:#7f8c8d;
          color:#fff;
          font-weight:bold;
          cursor:pointer;
          box-shadow:0 6px 15px rgba(0,0,0,0.4);
        ">Batal</button>
        <button id="confirmLogoutBtn" style="
          padding:10px 20px;
          border:none;
          border-radius:12px;
          background:#e74c3c;
          color:#fff;
          font-weight:bold;
          cursor:pointer;
          box-shadow:0 6px 15px rgba(0,0,0,0.4),0 0 15px #e74c3c;
        ">Logout</button>
      </div>
    `;
        document.body.appendChild(confirmDiv);

        const cancelBtn = document.getElementById('cancelLogoutBtn');
        const confirmBtn = document.getElementById('confirmLogoutBtn');

        // Cancel → remove popup & overlay, restore last section
        cancelBtn.addEventListener('click', () => {
            confirmDiv.remove();
            overlayDiv.remove(); // hilangkan kabur
            const savedState = JSON.parse(localStorage.getItem('dashboardState'));
            if (savedState) {
                window.scrollTo({ top: savedState.scrollY, behavior: 'smooth' });
                if (savedState.lastSection) {
                    const sectionEl = document.querySelector(savedState.lastSection);
                    if (sectionEl) sectionEl.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });

        // Confirm → logout
        confirmDiv.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'confirmLogoutBtn') {
                sessionStorage.removeItem("loggedIn");
                window.location.href = "index.html";


            }
        });
    });
}

let users = JSON.parse(localStorage.getItem("users")) || [];

function renderUsers() {
    const table = document.getElementById("userTable");
    if (!table) return;

    table.innerHTML = "";

    users.forEach((u, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${u.name || "-"}</td>
            <td>${u.id}</td>
            <td>${u.role}</td>
            <td>
                <button class="admin-delete" data-index="${index}">Padam</button>
            </td>
        `;
        table.appendChild(tr);
    });
}

renderUsers();

const addUserForm = document.getElementById("addUserForm");

if (addUserForm) {
    addUserForm.addEventListener("submit", e => {
        e.preventDefault();

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const role = document.getElementById("role").value;
        const password = document.getElementById("password").value;

        if (users.some(u => u.id === email)) {
            alert("User sudah wujud");
            return;
        }

        users.push({
            name,
            id: email,
            password,
            role
        });

        localStorage.setItem("users", JSON.stringify(users));
        e.target.reset();
        renderUsers();
    });
}

document.addEventListener("click", e => {
    if (e.target.classList.contains("admin-delete")) {
        const index = e.target.dataset.index;
        if (!confirm("Padam user ini?")) return;

        users.splice(index, 1);
        localStorage.setItem("users", JSON.stringify(users));
        renderUsers();
    }
});

//end of login page script

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
        ? `${startDate || '-'} hingga ${endDate || '-'}`
        : "Sepanjang Masa";

    const activeStatus = document.getElementById('report-active-status').textContent;
    const topItem = document.getElementById('report-top-item').textContent;
    const approvalRate = document.getElementById('report-approval-rate').textContent;

    // 2. Determine visibility from checkboxes
    const showSummary = document.getElementById('print-summary').checked;
    const showPeralatan = document.getElementById('print-peralatan').checked;
    const showDewan = document.getElementById('print-dewan').checked;

    // 3. Get logo if available
    const logoContainer = document.getElementById('sidebar-logo-container');
    let logoHTML = '';
    if (logoContainer) {
        const logoImg = logoContainer.querySelector('img');
        if (logoImg) {
            logoHTML = `<img src="${logoImg.src}" style="width: 80px; height: 80px; object-fit: contain;" />`;
        }
    }

    // 4. Build Professional A4 Report HTML
    let reportContent = `
        <div class="report-document">
            
            <!-- FIXED HEADER -->
            <div class="report-header">
                <div style="display: flex; align-items: center; gap: 25px;">
                    ${logoHTML ? `<div class="logo-container">${logoHTML}</div>` : ''}
                    <div style="flex: 1;">
                        <h1>Laporan Pengurusan</h1>
                        <h2>Penggunaan Dewan dan Peralatan</h2>
                        <div class="date-info">
                            <p>📅 Tempoh: <strong>${dateText}</strong></p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- MAIN CONTENT -->
            <div class="report-body">
                
                ${showSummary ? `
                <div class="report-section" style="border-left: 6px solid #667eea;">
                    <h3 style="color: #667eea;">
                        Ringkasan Eksekutif
                    </h3>
                    <div class="stats-grid">
                        <div class="stat-card" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-color: #bae6fd; color: #0369a1;">
                            <p>Status Keaktifan</p>
                            <p style="color: #0c4a6e;">${activeStatus}</p>
                        </div>
                        <div class="stat-card" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-color: #fcd34d; color: #92400e;">
                            <p>Item Paling Laris</p>
                            <p style="color: #78350f;">${topItem}</p>
                        </div>
                        <div class="stat-card" style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-color: #86efac; color: #15803d;">
                            <p>Kadar Kelulusan</p>
                            <p style="color: #14532d;">${approvalRate}</p>
                        </div>
                    </div>
                </div>
                ` : ''}

                ${showPeralatan ? `
                <div class="report-section" style="border-left: 6px solid #f59e0b;">
                    <h3 style="color: #f59e0b;">
                        Analisis Peminjaman Peralatan
                    </h3>
                    <p style="font-size: 10pt; color: #64748b; margin-bottom: 15px;">Berikut adalah analisis kekerapan permohonan peralatan berdasarkan aliran inventori dan permintaan:</p>
                    <div style="border: 2px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                        <table style="margin: 0;">
                            <thead>
                                <tr>
                                    <th style="border: 1px solid #e5e7eb;">Peralatan</th>
                                    <th style="border: 1px solid #e5e7eb;">Kategori</th>
                                    <th style="text-align: center; border: 1px solid #e5e7eb;">Kekerapan Permohonan</th>
                                    <th style="text-align: right; border: 1px solid #e5e7eb;">Status Inventori</th>
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
                <div class="report-section" style="border-left: 6px solid #8b5cf6;">
                    <h3 style="color: #8b5cf6;">
                        Analisis Penggunaan Dewan
                    </h3>
                    <p style="font-size: 10pt; color: #64748b; margin-bottom: 15px;">Ringkasan penggunaan fasiliti dewan:</p>
                    <div style="border: 2px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                        <table style="margin: 0;">
                            ${document.getElementById('laporan-dewan-table').innerHTML}
                        </table>
                    </div>
                </div>
                ` : ''}

            </div>

            <!-- FIXED FOOTER -->
            <div class="report-footer">
                <div class="footer-left">
                    <p>Sistem Pengurusan Peralatan & Dewan</p>
                    <p>Dewan Sri Kinabatangan</p>
                </div>
                <div class="footer-right">
                    <p>Dijana secara automatik pada:</p>
                    <p>${new Date().toLocaleString('ms-MY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    }).toUpperCase().replace(/AM/g, 'PAGI').replace(/PM/g, 'PTG')}</p>
                </div>
            </div>

        </div>
    `;

    editableArea.innerHTML = reportContent;
    modal.classList.add('active');

    // Clean up any stray classes from cloned tables
    editableArea.querySelectorAll('tr, td, th').forEach(el => {
        el.className = el.className.replace(/hover:bg-slate-50|transition-colors|bg-indigo-50\/50|bg-slate-50|bg-indigo-50\/30|border-b|border-slate-50|border-slate-100/g, '');
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
        if (!editableArea) return;

        // Create a temporary print window with the edited content
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            showToast('❌ Sila benarkan popup untuk mencetak');
            return;
        }

        // Build the print document with proper A4 layout and fixed header/footer
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Laporan Pengurusan - Dewan & Peralatan</title>
                <style>
                    * { 
                        margin: 0; 
                        padding: 0; 
                        box-sizing: border-box; 
                    }
                    
                    @page { 
                        size: A4; 
                        margin: 0;
                    }
                    
                    body { 
                        font-family: 'Inter', 'Segoe UI', Arial, sans-serif; 
                        line-height: 1.6; 
                        color: #1e293b;
                        background: white;
                    }
                    
                    /* Fixed Header */
                    .report-header {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        height: 160px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 25px 35px;
                        border-bottom: 5px solid #4c51bf;
                        z-index: 1000;
                    }
                    
                    .report-header h1 {
                        font-size: 26pt;
                        font-weight: 900;
                        margin: 0;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                    }
                    
                    .report-header h2 {
                        font-size: 13pt;
                        font-weight: 600;
                        margin: 5px 0 0;
                        opacity: 0.95;
                        text-transform: uppercase;
                    }
                    
                    .report-header .date-info {
                        margin-top: 10px;
                        padding-top: 10px;
                        border-top: 2px solid rgba(255,255,255,0.3);
                        font-size: 10pt;
                    }
                    
                    .logo-container {
                        flex-shrink: 0;
                        background: white;
                        padding: 10px;
                        border-radius: 10px;
                        box-shadow: 0 8px 20px rgba(0,0,0,0.2);
                    }
                    
                    /* Fixed Footer */
                    .report-footer {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        height: 70px;
                        background: #1e293b;
                        color: white;
                        padding: 15px 35px;
                        border-top: 5px solid #475569;
                        z-index: 1000;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    
                    .footer-left p:first-child {
                        font-weight: 800;
                        font-size: 10pt;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin: 0;
                    }
                    
                    .footer-left p:last-child {
                        font-size: 8pt;
                        opacity: 0.7;
                        margin: 3px 0 0;
                    }
                    
                    .footer-right {
                        text-align: right;
                    }
                    
                    .footer-right p:first-child {
                        font-size: 8pt;
                        opacity: 0.8;
                        margin: 0;
                    }
                    
                    .footer-right p:last-child {
                        font-weight: 700;
                        font-size: 9pt;
                        margin: 3px 0 0;
                    }
                    
                    /* Main content with proper spacing */
                    .report-body {
                        margin-top: 160px;
                        margin-bottom: 70px;
                        padding: 25px 35px;
                        background: #f8fafc;
                        min-height: calc(100vh - 230px);
                    }
                    
                    /* Content sections */
                    .report-section {
                        background: white;
                        padding: 25px;
                        border-radius: 10px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                        margin-bottom: 25px;
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    
                    .report-section h3 {
                        font-size: 15pt;
                        font-weight: 900;
                        text-transform: uppercase;
                        color: #1e293b;
                        margin: 0 0 18px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        page-break-after: avoid;
                    }
                    
                    .section-number {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        width: 32px;
                        height: 32px;
                        color: white;
                        border-radius: 8px;
                        font-size: 16pt;
                        flex-shrink: 0;
                    }
                    
                    /* Stats grid */
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 15px;
                        margin-top: 10px;
                    }
                    
                    .stat-card {
                        padding: 18px;
                        border-radius: 8px;
                        border: 2px solid;
                        text-align: center;
                        page-break-inside: avoid;
                    }
                    
                    .stat-card p:first-child {
                        font-size: 8pt;
                        margin: 0;
                        text-transform: uppercase;
                        font-weight: 800;
                        letter-spacing: 0.5px;
                    }
                    
                    .stat-card p:last-child {
                        font-size: 18pt;
                        font-weight: 900;
                        margin: 8px 0 0;
                    }
                    
                    /* Tables */
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 12px 0;
                        page-break-inside: auto;
                    }
                    
                    thead {
                        display: table-header-group;
                    }
                    
                    tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }
                    
                    th, td { 
                        padding: 10px; 
                        text-align: left; 
                        border: 1px solid #d1d5db;
                        font-size: 9pt;
                    }
                    
                    th { 
                        background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                        font-weight: 800;
                        color: #475569;
                        text-transform: uppercase;
                        font-size: 8pt;
                        letter-spacing: 0.5px;
                    }
                    
                    tbody tr:nth-child(even) {
                        background: #f9fafb;
                    }
                    
                    tbody td {
                        border: 1px solid #d1d5db;
                    }
                    
                    /* Print adjustments */
                    @media print {
                        body {
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        
                        .report-section {
                            box-shadow: none;
                            border: 1px solid #e5e7eb;
                        }
                    }
                </style>
            </head>
            <body>
                ${editableArea.innerHTML}
            </body>
            </html>
        `);

        printWindow.document.close();

        // Wait for content to load, then print
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
            closeReportPreviewModal();
            showToast('✅ Dokumen telah dihantar ke printer');
        }, 500);
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
