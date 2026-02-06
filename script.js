// ===== SYSTEM CLOCK INITIALIZATION =====
function updateClock() {
    try {
        const now = new Date();
        const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

        const timeStr = now.toLocaleTimeString('ms-MY', options).toUpperCase();
        const dateStr = now.toLocaleDateString('ms-MY', dateOptions);

        const ids = ['clock', 'date', 'dash-clock', 'dash-date', 'dash-clock-big', 'dash-date-big'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const val = (id.includes('date')) ? dateStr : timeStr;
                if (el.tagName === 'INPUT') el.value = val;
                else el.textContent = val;
            }
        });
    } catch (e) { console.error('Clock error:', e); }
}

function startClock() {
    if (window.clockInterval) clearInterval(window.clockInterval);
    updateClock();
    window.clockInterval = setInterval(updateClock, 1000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startClock);
} else {
    startClock();
}

// ===== GOOGLE SHEETS DATABASE INTEGRATION =====
// PENTING: Gantikan URL ini dengan URL deployment Apps Script anda
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwfs87D-SdyF0r39GmIH237Sm6-CFr-u-WemwmM1TewwiE_RMyMLmHXNfBVsKW4BuykRA/exec'; // <- TUKAR INI!

// Google Sheets Database API
const GoogleSheetsDB = {
    isConfigured: function () {
        return GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== 'YOUR_GOOGLE_SCRIPT_URL_HERE';
    },

    // Test connection to Google Sheets
    testConnection: async function () {
        if (!this.isConfigured()) {
            console.warn('⚠️ Google Sheets belum dikonfigurasi. Sila masukkan URL Apps Script.');
            return { success: false, error: 'Not configured' };
        }

        try {
            const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=test`);
            const result = await response.json();
            if (result.success) {
                console.log('✅ Google Sheets Connected!', result);
            }
            return result;
        } catch (error) {
            console.error('❌ Google Sheets connection failed:', error);
            return { success: false, error: error.message };
        }
    },

    // Fetch all data from Google Sheets
    fetchAll: async function () {
        if (!this.isConfigured()) return { success: false, data: [] };

        try {
            const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getAll`);
            const result = await response.json();
            console.log('📥 Data fetched from Google Sheets:', result);
            return result;
        } catch (error) {
            console.error('❌ Fetch from Google Sheets failed:', error);
            return { success: false, data: [], error: error.message };
        }
    },

    // Add single item to Google Sheets
    add: async function (type, item) {
        if (!this.isConfigured()) return { success: false };

        try {
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'add', type: type, item: item })
            });
            const result = await response.json();
            console.log('📤 Data added to Google Sheets:', result);
            return result;
        } catch (error) {
            console.error('❌ Add to Google Sheets failed:', error);
            return { success: false, error: error.message };
        }
    },

    // Update item in Google Sheets
    update: async function (type, id, item) {
        if (!this.isConfigured()) return { success: false };

        try {
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'update', type: type, id: id, item: item })
            });
            const result = await response.json();
            console.log('📝 Data updated in Google Sheets:', result);
            return result;
        } catch (error) {
            console.error('❌ Update Google Sheets failed:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete item from Google Sheets
    delete: async function (type, id) {
        if (!this.isConfigured()) return { success: false };

        try {
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'delete', type: type, id: id })
            });
            const result = await response.json();
            console.log('🗑️ Data deleted from Google Sheets:', result);
            return result;
        } catch (error) {
            console.error('❌ Delete from Google Sheets failed:', error);
            return { success: false, error: error.message };
        }
    },

    // Sync all local data to Google Sheets
    syncToSheets: async function (allData) {
        if (!this.isConfigured()) return { success: false };

        try {
            console.log('🔄 Syncing all data to Google Sheets...');
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'sync', allData: allData })
            });
            const result = await response.json();
            console.log('✅ Sync complete:', result);
            return result;
        } catch (error) {
            console.error('❌ Sync to Google Sheets failed:', error);
            return { success: false, error: error.message };
        }
    },

    // Export localStorage data to Google Sheets (one-time export)
    exportLocalToSheets: async function () {
        const localData = JSON.parse(localStorage.getItem('dewanData') || '[]');
        if (localData.length === 0) {
            console.log('ℹ️ Tiada data untuk export');
            return { success: false, error: 'No local data' };
        }

        console.log(`📤 Exporting ${localData.length} items to Google Sheets...`);
        return await this.syncToSheets(localData);
    },

    // Import data from Google Sheets to localStorage
    importFromSheets: async function () {
        const result = await this.fetchAll();
        if (result.success && result.data) {
            localStorage.setItem('dewanData', JSON.stringify(result.data));
            console.log(`📥 Imported ${result.data.length} items from Google Sheets`);

            // Refresh UI
            if (typeof DataStore !== 'undefined') {
                DataStore.notify();
            }
            return { success: true, count: result.data.length };
        }
        return { success: false };
    }
};

// Make GoogleSheetsDB available globally
window.GoogleSheetsDB = GoogleSheetsDB;

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
            'https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js',
            'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js',
            'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js'
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

//form data js untuk bahagian user,admin dan table permohonan form+table

// FORM USER - DISABLING OLD HANDLER (Consolidated at the end)
/*
document.getElementById('form-user-permohonan').addEventListener('submit', async (e) => {
    ...
});
*/

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

// --- INVENTORY UTILITY ---
/**
 * Calculates available stock for a specific item during a specific time period.
 * @param {string} itemId The __backendId of the equipment
 * @param {string} startDate ISO string or valid date string
 * @param {string} endDate ISO string or valid date string
 * @param {string} excludePermohonanId (Optional) ID of a permohonan to ignore (useful when editing a request)
 * @returns {number} The remaining units available
 */
// Helper to parse dates robustly
function parseSafeDate(dateStr) {
    if (!dateStr) return new Date(NaN);
    if (dateStr instanceof Date) return dateStr;

    // Try standard parsing
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;

    // Try DD/MM/YYYY
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
        const parts = dateStr.split(' ')[0].split('/');
        if (parts.length === 3) {
            // Assume DD/MM/YYYY
            d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            if (!isNaN(d.getTime())) return d;
        }
    }
    return new Date(NaN);
}

function getAvailableStock(itemId, startDate = null, endDate = null, excludePermohonanId = null) {
    const p = allData.find(d => d.type === 'peralatan' && String(d.__backendId) === String(itemId));
    if (!p) return 0;

    let unitsInUse = 0;
    const totalStock = parseInt(p.kuantiti) || 0;

    const start = parseSafeDate(startDate);
    const end = parseSafeDate(endDate);

    const hasDates = !isNaN(start.getTime()) && !isNaN(end.getTime());

    // Filter permohonan that should deduct stock
    const activePermohonan = allData.filter(d =>
        d.type === 'permohonan' &&
        !['selesai', 'ditolak', 'dibatalkan'].includes((d.status || '').toLowerCase()) &&
        String(d.__backendId) !== String(excludePermohonanId)
    );

    activePermohonan.forEach(req => {
        let shouldDeduct = false;

        if (hasDates) {
            const reqStart = parseSafeDate(req.tarikhMulaPinjam);
            const reqEnd = parseSafeDate(req.tarikhPulang);
            if (!isNaN(reqStart.getTime()) && !isNaN(reqEnd.getTime())) {
                // Standard overlap: StartA < EndB AND EndA > StartB
                if (start < reqEnd && end > reqStart) {
                    shouldDeduct = true;
                }
            }
        } else {
            // If no dates provided, we count it if it's "Active"
            shouldDeduct = true;
        }

        if (shouldDeduct) {
            try {
                const itemsData = req.itemsData;
                if (itemsData) {
                    const items = (typeof itemsData === 'string') ? JSON.parse(itemsData) : itemsData;
                    if (Array.isArray(items)) {
                        const match = items.find(i => String(i.id) === String(itemId));
                        if (match) {
                            unitsInUse += parseInt(match.qty) || 0;
                        }
                    }
                } else if (req.items && req.items.includes(p.namaPeralatan)) {
                    // Fallback for old data without itemsData (very basic)
                    // If the item name is in the string, assume 1 unit if we can't parse more
                    const match = req.items.match(new RegExp(`${p.namaPeralatan}\\s*\\((\\d+)\\s*unit\\)`, 'i'));
                    unitsInUse += match ? parseInt(match[1]) : 1;
                }
            } catch (e) {
                console.warn('Inventory calc deduction error:', e);
            }
        }
    });

    const baki = totalStock - unitsInUse;
    return Math.max(0, baki);
}

// Data Persistence & Storage - with Google Sheets Sync
const DataStore = {
    key: 'dewanData',
    syncEnabled: true, // Toggle to enable/disable Google Sheets sync

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

    add: async function (item) {
        const data = this.get();
        item.__backendId = Date.now().toString();
        if (!item.type && item.nama && item.tarikhMulaPinjam) {
            item.type = 'permohonan';
        }
        console.log('📦 Saving Item to DataStore:', item);
        data.push(item);
        this.save(data);

        // Sync to Google Sheets (Wait for it to ensure consistency)
        // Sync to Google Sheets
        if (this.syncEnabled && GoogleSheetsDB.isConfigured()) {
            try {
                const res = await GoogleSheetsDB.add(item.type, item);
                if (!res.success) {
                    console.error('❌ Google Sheets add failed:', res.error);
                    showToast('Gagal menyelaraskan ke Google Sheets: ' + (res.error || 'Ralat tidak diketahui'), 'error');
                }
            } catch (err) {
                console.warn('⚠️ Google Sheets sync failed (add):', err);
                showToast('Ralat sambungan ke Google Sheets.', 'error');
            }
        }

        return { isOk: true };
    },

    update: async function (id, updatedItem) {
        let data = this.get();
        // Convert id to string for consistent comparison
        const targetId = String(id).trim();
        const index = data.findIndex(d => d.__backendId && String(d.__backendId).trim() === targetId);

        if (index !== -1) {
            const oldType = data[index].type;
            data[index] = { ...data[index], ...updatedItem };
            this.save(data);

            if (this.syncEnabled && GoogleSheetsDB.isConfigured()) {
                try {
                    const res = await GoogleSheetsDB.update(oldType || updatedItem.type, targetId, data[index]);
                    if (!res.success) {
                        console.error('❌ Google Sheets update failed:', res.error);
                        showToast('Gagal mengemaskini Google Sheets: ' + (res.error || 'Ralat tidak diketahui'), 'error');
                    } else {
                        console.log('✅ Google Sheets update success');
                    }
                } catch (err) {
                    console.warn('⚠️ Google Sheets sync failed (update):', err);
                    showToast('Ralat sambungan semasa mengemaskini Google Sheets.', 'error');
                }
            }

            return { isOk: true };
        }
        return Promise.resolve({ isOk: false, error: 'Item not found' });
    },

    remove: async function (id, fallbackType = 'permohonan') {
        let data = this.get();
        const targetId = String(id).trim();

        const item = data.find(d => d.__backendId && String(d.__backendId).trim() === targetId);
        const itemType = item ? item.type : fallbackType;

        console.log(`🗑️ DataStore: Attempting delete of [${itemType}] ID: ${targetId}`);

        // Filter out item
        const initialLength = data.length;
        data = data.filter(d => !d.__backendId || String(d.__backendId).trim() !== targetId);

        this.save(data);

        // Sync to Google Sheets
        if (this.syncEnabled && GoogleSheetsDB.isConfigured()) {
            try {
                console.log(`📡 Syncing delete to Sheets for [${itemType}] ID: ${targetId}`);
                const result = await GoogleSheetsDB.delete(itemType, targetId);
                if (result.success) {
                    console.log('📡 Sheets delete success:', result);
                } else {
                    console.error('❌ Sheets delete failed:', result.error);
                    showToast('Gagal memadam data pada Google Sheets: ' + (result.error || 'Ralat tidak diketahui'), 'error');
                }
            } catch (err) {
                console.warn('⚠️ Google Sheets sync failed (delete):', err);
                showToast('Gagal menyambung ke Google Sheets untuk pemadaman.', 'error');
            }
        }

        return { isOk: true };
    },

    notify: function () {
        allData = this.get();
        console.log('🔄 DataStore Notify: refreshing UI');

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
    },

    // Load data from Google Sheets
    loadFromGoogleSheets: async function () {
        if (!GoogleSheetsDB.isConfigured()) {
            console.log('ℹ️ Google Sheets not configured, using localStorage only');
            return false;
        }

        try {
            console.log('📥 Loading data from Google Sheets...');
            const result = await GoogleSheetsDB.fetchAll();

            if (result.success && result.data && result.data.length > 0) {
                this.save(result.data);
                console.log(`✅ Loaded ${result.data.length} items from Google Sheets`);
                return true;
            } else {
                console.log('ℹ️ No data in Google Sheets, using localStorage');
                return false;
            }
        } catch (error) {
            console.error('❌ Failed to load from Google Sheets:', error);
            return false;
        }
    },

    // Full sync - push all local data to Google Sheets
    syncAllToSheets: async function () {
        if (!GoogleSheetsDB.isConfigured()) {
            console.warn('⚠️ Google Sheets not configured');
            return { success: false };
        }

        const allData = this.get();
        console.log(`🔄 Syncing ${allData.length} items to Google Sheets...`);

        const result = await GoogleSheetsDB.syncToSheets(allData);

        if (result.success) {
            showToast('✅ Data berjaya di-sync ke Google Sheets!');
        } else {
            showToast('❌ Gagal sync ke Google Sheets');
        }

        return result;
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

// ===== GOOGLE SHEETS UI FUNCTIONS =====

// Test Google Sheets connection
async function testGoogleSheetsConnection() {
    const indicator = document.getElementById('sheets-status-indicator');
    const statusText = document.getElementById('sheets-status-text');

    if (!indicator || !statusText) return;

    // Show loading state
    indicator.className = 'w-3 h-3 rounded-full bg-yellow-400 animate-pulse';
    statusText.textContent = 'Menguji sambungan...';

    try {
        const result = await GoogleSheetsDB.testConnection();

        if (result.success) {
            indicator.className = 'w-3 h-3 rounded-full bg-green-500';
            statusText.textContent = '✅ Sambungan berjaya!';
            showToast('✅ Google Sheets berjaya disambungkan!');
        } else {
            indicator.className = 'w-3 h-3 rounded-full bg-red-500';
            statusText.textContent = '❌ ' + (result.error || 'Gagal menyambung');
            showToast('❌ Gagal menyambung ke Google Sheets');
        }
    } catch (error) {
        indicator.className = 'w-3 h-3 rounded-full bg-red-500';
        statusText.textContent = '❌ Ralat: ' + error.message;
        showToast('❌ Ralat sambungan');
    }
}

// Sync/Export data to Google Sheets
async function syncDataToSheets() {
    if (!GoogleSheetsDB.isConfigured()) {
        showToast('⚠️ Sila konfigurasi Google Sheets terlebih dahulu');
        return;
    }

    showToast('🔄 Mengexport data ke Google Sheets...');

    try {
        const result = await DataStore.syncAllToSheets();
        if (result.success) {
            console.log('✅ Export complete:', result);
        }
    } catch (error) {
        console.error('Export error:', error);
        showToast('❌ Gagal export: ' + error.message);
    }
}

// Load/Import data from Google Sheets
async function loadDataFromSheets() {
    if (!GoogleSheetsDB.isConfigured()) {
        showToast('⚠️ Sila konfigurasi Google Sheets terlebih dahulu');
        return;
    }

    showToast('📥 Memuat data dari Google Sheets...');

    try {
        const loaded = await DataStore.loadFromGoogleSheets();
        if (loaded) {
            showToast('✅ Data berjaya dimuat dari Google Sheets!');
        } else {
            showToast('ℹ️ Tiada data di Google Sheets');
        }
    } catch (error) {
        console.error('Import error:', error);
        showToast('❌ Gagal import: ' + error.message);
    }
}

// Toggle auto-sync feature
function toggleAutoSync() {
    const toggle = document.getElementById('auto-sync-toggle');
    if (toggle) {
        DataStore.syncEnabled = toggle.checked;
        console.log('Auto-sync:', DataStore.syncEnabled ? 'ON' : 'OFF');
        showToast(DataStore.syncEnabled ? '✅ Auto-sync diaktifkan' : '⏸️ Auto-sync dinyahaktifkan');
    }
}

// Update Google Sheets status indicator on page load
function updateSheetsStatusIndicator() {
    const indicator = document.getElementById('sheets-status-indicator');
    const statusText = document.getElementById('sheets-status-text');

    if (!indicator || !statusText) return;

    if (GoogleSheetsDB.isConfigured()) {
        indicator.className = 'w-3 h-3 rounded-full bg-yellow-400';
        statusText.textContent = 'Dikonfigurasi - Klik test untuk sahkan';
    } else {
        indicator.className = 'w-3 h-3 rounded-full bg-slate-400';
        statusText.textContent = 'Belum dikonfigurasi';
    }
}

// Auto-load data from Google Sheets on page load
async function autoLoadFromGoogleSheets() {
    if (!GoogleSheetsDB.isConfigured()) {
        console.log('ℹ️ Google Sheets not configured, using localStorage');
        return;
    }

    try {
        console.log('🔄 Auto-loading data from Google Sheets...');

        const result = await GoogleSheetsDB.fetchAll();

        if (result.success && result.data && result.data.length > 0) {
            // Save to localStorage and update UI
            localStorage.setItem('dewanData', JSON.stringify(result.data));
            allData = result.data;

            // Update UI
            if (typeof DataStore !== 'undefined') {
                DataStore.notify();
            }

            console.log(`✅ Auto-loaded ${result.data.length} items from Google Sheets`);

            // Update status indicator to green
            const indicator = document.getElementById('sheets-status-indicator');
            const statusText = document.getElementById('sheets-status-text');
            if (indicator) indicator.className = 'w-3 h-3 rounded-full bg-green-500';
            if (statusText) statusText.textContent = '✅ Data dimuat dari Google Sheets';

        } else {
            console.log('ℹ️ No data in Google Sheets or fetch failed, using localStorage');
        }
    } catch (error) {
        console.warn('⚠️ Auto-load from Google Sheets failed:', error.message);
        // Silently fail - just use localStorage
    }
}

// Check Login & Page State on Load
window.addEventListener('DOMContentLoaded', () => {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const isUserMode = urlParams.get('user') === 'true' || window.location.hash.includes('user=true');

        // 1. Apply UI Visuals immediately
        applyBgSettings();
        applyLogoSettings();

        // 2. Update Google Sheets status indicator
        updateSheetsStatusIndicator();

        // 3. Auto-load data from Google Sheets (if configured)
        autoLoadFromGoogleSheets().then(() => {
            // Start looping for live updates only if NOT in user mode (Admin side needs to know)
            if (!isUserMode) {
                startRealtimeSync();
            }
        });

        if (isUserMode) {
            console.log('🚀 User Mode Activated');
            // User Mode: Hide Login & Admin App, Show User Form ONLY
            const loginPage = document.getElementById('login-page');
            const appPage = document.getElementById('app');

            if (loginPage) {
                loginPage.classList.add('hidden');
                loginPage.style.setProperty('display', 'none', 'important');
            }
            if (appPage) {
                appPage.classList.add('hidden');
                appPage.style.setProperty('display', 'none', 'important');
            }

            const userModal = document.getElementById('modal-user-form');
            if (userModal) {
                userModal.classList.remove('hidden');
                userModal.style.display = 'flex'; // Ensure it's visible (flex for centering)
                const closeBtn = userModal.querySelector('button[onclick="closeUserForm()"]');
                if (closeBtn) closeBtn.style.display = 'none';
            } else {
                console.error('❌ modal-user-form NOT FOUND');
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
    if (window.auth && window.firebaseInitialized) {
        try {
            const res = await window.auth.signInWithEmailAndPassword(username, password);
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
    if (window.auth && window.firebaseInitialized) {
        window.auth.signOut()
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
    console.log('🔓 Opening modal:', id);
    const el = document.getElementById(id);
    if (!el) {
        console.error('❌ Modal element not found:', id);
        return;
    }
    el.classList.remove('hidden');
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
          <!-- No Rujukan Column -->
          <td class="px-6 py-4 text-indigo-900 font-mono text-xs font-bold">${p.noPermohonan || '-'}</td>
          
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

    let html = `
    <div class="overflow-x-auto">
        <table class="w-full">
            <thead class="bg-slate-50">
                <tr>
                    <th class="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Nama Kategori</th>
                    <th class="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Tindakan</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
    `;

    html += kategori.map(k => `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-4 py-3">
                    <p class="font-medium text-slate-800">${k.namaKategori || k.nama || '-'}</p>
                </td>
                <td class="px-4 py-3 text-right">
                    <div class="flex justify-end gap-1">
                        <button onclick="openEditKategori('${k.__backendId}')" class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                        </button>
                        <button onclick="openDeleteModal('${k.__backendId}', 'kategori')" class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Padam">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

    html += `
            </tbody>
        </table>
    </div>
    `;

    container.innerHTML = html;
}

// Render peralatan
function openEditKategori(id) {
    const targetId = String(id).trim();
    const data = allData.find(d => d.__backendId && String(d.__backendId).trim() === targetId);
    if (!data) {
        console.error('❌ Kategori not found for edit ID:', targetId);
        return;
    }

    document.getElementById('kategori-id').value = targetId;
    document.getElementById('nama-kategori').value = data.namaKategori || data.nama || '';

    // Update modal UI
    const modal = document.getElementById('modal-kategori');
    if (modal) {
        modal.querySelector('h3').textContent = 'Edit Kategori';
        document.getElementById('btn-submit-kategori').textContent = 'Kemaskini';
    }

    openModal('modal-kategori');
}

function openAddPeralatan() {
    const form = document.getElementById('form-peralatan');
    if (form) form.reset();

    document.getElementById('peralatan-id').value = '';

    // Update modal UI
    const modal = document.getElementById('modal-peralatan');
    if (modal) {
        modal.querySelector('h3').textContent = 'Tambah Peralatan';
        document.getElementById('btn-submit-peralatan').textContent = 'Simpan';
    }

    openModal('modal-peralatan');
}

function openAddKategori() {
    const form = document.getElementById('form-kategori');
    if (form) form.reset();

    document.getElementById('kategori-id').value = '';

    // Update modal UI
    const modal = document.getElementById('modal-kategori');
    if (modal) {
        modal.querySelector('h3').textContent = 'Tambah Kategori';
        document.getElementById('btn-submit-kategori').textContent = 'Simpan';
    }

    openModal('modal-kategori');
}

function openEditPeralatan(id) {
    const targetId = String(id).trim();
    const data = allData.find(d => d.__backendId && String(d.__backendId).trim() === targetId);
    if (!data) {
        console.error('❌ Peralatan not found for edit ID:', targetId);
        return;
    }

    document.getElementById('peralatan-id').value = targetId;
    document.getElementById('kategori-peralatan').value = data.kategori || '';
    document.getElementById('nama-peralatan').value = data.namaPeralatan || '';
    document.getElementById('kuantiti-peralatan').value = data.kuantiti || 0;

    // Reset transaction fields
    document.getElementById('tambah-baru').value = 0;
    document.getElementById('item-rosak').value = 0;

    // Update modal UI
    const modal = document.getElementById('modal-peralatan');
    if (modal) {
        modal.querySelector('h3').textContent = 'Edit Peralatan';
        document.getElementById('btn-submit-peralatan').textContent = 'Kemaskini';
    }

    openModal('modal-peralatan');
}

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

    let html = `
    <div class="overflow-x-auto">
        <table class="w-full">
            <thead class="bg-slate-50">
                <tr>
                    <th class="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Peralatan</th>
                    <th class="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Kategori</th>
                    <th class="px-4 py-3 text-center text-xs font-black text-slate-500 uppercase tracking-widest">Baki/Jumlah</th>
                    <th class="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Tindakan</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
    `;

    html += peralatan.map(p => {
        const kat = kategori.find(k => k.__backendId === p.kategori);
        const bakiSekarang = getAvailableStock(p.__backendId);
        const statusColor = bakiSekarang > 0 ? 'text-green-600' : 'text-red-600';
        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-4 py-3">
                    <p class="font-medium text-slate-800">${p.namaPeralatan || '-'}</p>
                </td>
                <td class="px-4 py-3">
                    <p class="text-sm text-slate-500">${kat ? kat.namaKategori || kat.nama : 'Tiada Kategori'}</p>
                </td>
                <td class="px-4 py-3 text-center">
                    <p class="text-xs ${statusColor} font-bold">${bakiSekarang} / ${p.kuantiti || 0}</p>
                </td>
                <td class="px-4 py-3 text-right">
                    <div class="flex justify-end gap-1">
                        <button onclick="openEditPeralatan('${p.__backendId}')" class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                        </button>
                        <button onclick="openDeleteModal('${p.__backendId}', 'peralatan')" class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Padam">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    html += `
            </tbody>
        </table>
    </div>
    `;

    container.innerHTML = html;
}

// Update dropdowns
function updateItemDropdown() {
    const container = document.getElementById('item-dipinjam-container');
    if (!container) {
        console.error('âŒ Container item-dipinjam-container NOT FOUND!');
        return;
    }

    // Save currently checked items and their quantities
    const checkedItems = {};
    container.querySelectorAll('input.item-checkbox:checked').forEach(cb => {
        const id = cb.dataset.id;
        const qtyVal = document.getElementById(`qty-${id}`)?.value || "1";
        checkedItems[id] = qtyVal;
    });

    const peralatan = getPeralatan();
    const kategori = getKategori();
    const start = document.getElementById('tarikh-mula').value;
    const end = document.getElementById('tarikh-pulang').value;

    if (peralatan.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-sm text-center py-4">Tiada peralatan tersedia</p>';
        return;
    }

    container.innerHTML = peralatan.map(p => {
        const kat = kategori.find(k => k.__backendId === p.kategori);
        const tersedia = getAvailableStock(p.__backendId, start, end);
        const isAvailable = tersedia > 0;
        const wasChecked = checkedItems[p.__backendId] !== undefined;

        // If item was checked, its quantity should be added to available stock for validation purposes
        // This allows the user to keep their selection even if the available stock changes slightly
        const maxQtyForValidation = tersedia + (wasChecked ? parseInt(checkedItems[p.__backendId]) : 0);

        return `
        <div class="border border-slate-200 rounded-lg p-3 bg-white">
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" value="${p.namaPeralatan}" data-id="${p.__backendId}" 
                onchange="toggleQuantityInput('${p.__backendId}')" 
                class="item-checkbox w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500" 
                ${!isAvailable && !wasChecked ? 'disabled' : ''} ${wasChecked ? 'checked' : ''}>
              <div class="flex-1">
                <span class="text-slate-700 font-medium">${p.namaPeralatan}</span>
                <span class="text-slate-500 text-sm ml-2">(${kat ? kat.namaKategori || kat.nama : '-'})</span>
                <span class="block text-xs ${isAvailable ? 'text-green-600' : 'text-red-600'} font-semibold mt-1">Baki: ${tersedia}/${p.kuantiti || 0} unit</span>
              </div>
            </label>
            <div id="qty-input-${p.__backendId}" class="${wasChecked ? '' : 'hidden'} mt-3 pl-7">
              <label class="block text-xs font-medium text-slate-700 mb-1">Kuantiti Dipinjam</label>
              <input type="number" id="qty-${p.__backendId}" min="1" max="${maxQtyForValidation}" 
                value="${wasChecked ? checkedItems[p.__backendId] : 1}" 
                onchange="validateQuantity('${p.__backendId}', ${maxQtyForValidation})" 
                oninput="validateQuantity('${p.__backendId}', ${maxQtyForValidation})" 
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>
          </div>
            `;
    }).join('');
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
    } else if (value < 1 && input.value !== "") {
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

function refreshAdminInventoryDisplay() {
    updateItemDropdown();
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

    // Check Peralatan availability using central utility
    if (hasPeralatan && !hasConflict) {
        const selectedItemsData = document.getElementById('items-data-hidden').value;
        if (selectedItemsData) {
            try {
                const itemsData = JSON.parse(selectedItemsData);
                for (const item of itemsData) {
                    const availableDuringPeriod = getAvailableStock(item.id, startDate, endDate);
                    if (item.qty > availableDuringPeriod) {
                        hasConflict = true;
                        const p = allData.find(d => d.__backendId === item.id);
                        const total = p ? (p.kuantiti || 0) : 0;
                        conflictMessages.push(`⚠️ ${item.name} tidak mencukupi pada tarikh tersebut. Baki: ${availableDuringPeriod}/${total} unit. Sila pilih tarikh lain.`);
                    }
                }
            } catch (e) {
                console.error('Error checking peralatan conflict:', e);
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
                conflictMessages.push(`🏛️ Dewan telah ditempah pada ${formatDate(p.tarikhMulaPinjam)} - ${formatDate(p.tarikhPulang)}. Sila pilih tarikh / waktu lain.`);
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
        kategori.map(k => `<option value="${k.__backendId}">${k.namaKategori || k.nama || 'Tiada Nama'}</option>`).join('');
}

function updateUserItemDropdown() {
    const container = document.getElementById('user-item-dipinjam-container');
    if (!container) return;

    // Save currently checked items and their quantities
    const checkedItems = {};
    container.querySelectorAll('input.user-item-checkbox:checked').forEach(cb => {
        const id = cb.dataset.id;
        const qtyVal = document.getElementById(`user-qty-${id}`)?.value || "1";
        checkedItems[id] = qtyVal;
    });

    const peralatan = getPeralatan();
    const kategori = getKategori();
    const tarikhMula = document.getElementById('user-tarikh-mula').value;
    const tarikhPulang = document.getElementById('user-tarikh-pulang').value;

    if (peralatan.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-sm text-center py-8">Tiada peralatan tersedia</p>';
        return;
    }

    container.innerHTML = peralatan.map(p => {
        const kat = kategori.find(k => k.__backendId === p.kategori);
        const available = getAvailableStock(p.__backendId, tarikhMula, tarikhPulang);
        const totalStock = p.kuantiti || 0;
        const wasChecked = checkedItems[p.__backendId] !== undefined;
        const isAvailable = available > 0 || wasChecked;
        const statusColor = isAvailable ? 'text-green-600' : 'text-red-600';

        return `
    <div class="border-2 border-slate-200 rounded-xl p-4 bg-white hover:border-purple-300 transition-colors ${!isAvailable ? 'opacity-60 bg-slate-50' : ''}">
            <label class="flex items-center gap-3 ${isAvailable ? 'cursor-pointer' : 'cursor-not-allowed'}">
              <input type="checkbox" value="${p.namaPeralatan}" data-id="${p.__backendId}" 
                onchange="toggleUserQtyInput('${p.__backendId}')" 
                class="user-item-checkbox w-5 h-5 text-purple-600 border-slate-300 rounded focus:ring-2 focus:ring-purple-500" 
                ${!isAvailable ? 'disabled' : ''} ${wasChecked ? 'checked' : ''}>
              <div class="flex-1">
                <span class="text-slate-800 font-semibold">${p.namaPeralatan}</span>
                <span class="text-slate-500 text-sm ml-2">(${kat ? kat.namaKategori || kat.nama : '-'})</span>
                <span class="block text-xs ${statusColor} font-bold mt-1">
                    ${available > 0 ? `Baki Tersedia: ${available}/${totalStock} unit` : 'Tiada Stok Tersedia'}
                </span>
              </div>
            </label>
            <div id="user-qty-input-${p.__backendId}" class="${wasChecked ? '' : 'hidden'} mt-3 pl-8">
                <label class="block text-xs font-medium text-slate-700 mb-1">Kuantiti Dipinjam (Maks: ${available + (wasChecked ? parseInt(checkedItems[p.__backendId]) : 0)})</label>
                <input type="number" id="user-qty-${p.__backendId}" min="1" max="${available + (wasChecked ? parseInt(checkedItems[p.__backendId]) : 0)}" 
                    value="${wasChecked ? checkedItems[p.__backendId] : 1}" 
                    oninput="validateUserQty('${p.__backendId}', ${available + (wasChecked ? parseInt(checkedItems[p.__backendId]) : 0)})" 
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
        input.value = max;
        input.classList.add('border-red-500', 'bg-red-50', 'text-red-900');
        input.classList.remove('border-slate-200', 'bg-white');
        error.classList.remove('hidden');
    } else if (val < 1 && input.value !== "") {
        input.value = 1;
        input.classList.remove('border-red-500', 'bg-red-50', 'text-red-900');
        input.classList.add('border-slate-200', 'bg-white');
        error.classList.add('hidden');
    } else {
        input.classList.remove('border-red-500', 'bg-red-50', 'text-red-900');
        input.classList.add('border-slate-200', 'bg-white');
        error.classList.add('hidden');
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

function refreshUserInventoryDisplay() {
    updateUserItemDropdown();
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
                    conflictMessages.push(`⚠️ ${item.name} tidak mencukupi pada tarikh tersebut. Tersedia: ${availableDuringPeriod} unit. Sila pilih tarikh lain.`);
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
    console.log('🔗 showSharelinkInfo called');
    // Current URL minus anything from ? or # onwards
    const currentURL = window.location.origin + window.location.pathname;
    const sharelinkURL = `${currentURL}?user=true`;
    console.log('🔗 Generated Link:', sharelinkURL);

    const input = document.getElementById('sharelink-url');
    if (input) {
        input.value = sharelinkURL;
    } else {
        console.error('❌ Element #sharelink-url not found');
    }

    console.log('🔗 Opening modal-sharelink');
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
// Redundant DOMContentLoaded listener removed - initialization logic is handled at the top of the file
// See line ~947 window.addEventListener('DOMContentLoaded', ...)

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
    const permohonan = allData.find(d => String(d.__backendId) === String(id));
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
        const selected = selectedItems.find(item => String(item.id) === String(p.__backendId));
        const qty = selected ? (parseInt(selected.qty) || 0) : 0;

        // Calculate availability excluding current request items
        const bakiTersedia = getAvailableStock(p.__backendId, permohonan.tarikhMulaPinjam, permohonan.tarikhPulang, permohonan.__backendId);
        const isAvailable = bakiTersedia > 0;

        return `
    <div class="border border-slate-300 rounded-lg p-4 bg-white hover:bg-slate-50 transition-colors">
        <div class="flex items-start gap-4">
            <div class="flex items-center pt-1">
                <input type="checkbox" id="item-tindakan-${p.__backendId}" class="item-tindakan-checkbox w-5 h-5 cursor-pointer"
                    data-name="${p.namaPeralatan}" ${selected ? 'checked' : ''}>
            </div>
            <div class="flex-1 min-w-0">
                <label for="item-tindakan-${p.__backendId}" class="cursor-pointer block">
                    <p class="font-bold text-slate-800 text-base">${idx + 1}. ${p.namaPeralatan}</p>
                    <p class="text-xs ${isAvailable ? 'text-green-600' : 'text-red-600'} font-semibold mt-1">Baki Stok (Luar Permohonan Ini): ${bakiTersedia} unit</p>
                </label>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
                <input type="number" id="qty-tindakan-${p.__backendId}" min="1" value="${selected ? qty : 1}"
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
            const id = this.id.replace('item-tindakan-', '');
            const qtyInput = document.getElementById(`qty-tindakan-${id}`);
            if (qtyInput) {
                qtyInput.disabled = !this.checked;
            }
        });
    });
}

// Collect selected items from the tindakan modal
function collectTindakanItems() {
    const selected = [];
    document.querySelectorAll('.item-tindakan-checkbox:checked').forEach(checkbox => {
        const id = checkbox.id.replace('item-tindakan-', '');
        const name = checkbox.dataset.name;
        const qtyInput = document.getElementById(`qty-tindakan-${id}`);
        const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;
        selected.push({ id, name, qty });
    });
    return selected;
}

// Mark permohonan as completed with timestamp
function markAsCompleted() {
    const id = document.getElementById('tindakan-id').value;
    const data = allData.find(d => String(d.__backendId) === String(id));

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
    const data = allData.find(d => String(d.__backendId) === String(id));

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
document.getElementById('form-tindakan').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('tindakan-id').value;
    const status = document.getElementById('status-permohonan').value;
    const catatan = document.getElementById('catatan-admin').value;

    const data = allData.find(d => String(d.__backendId) === String(id));
    if (data) {
        const updates = {
            status: status,
            catatan: catatan
        };

        // Update items Data ALWAYS (even if empty) to allow reduction to 0 items
        if (data.jenisPermohonan === 'Peralatan') {
            const selectedItems = collectTindakanItems();
            updates.itemsData = JSON.stringify(selectedItems);
            updates.items = selectedItems.length > 0
                ? selectedItems.map(item => `${item.name} (${item.qty} unit)`).join(', ')
                : 'Tiada item';
        }

        // If status is set to "Selesai", mark statusSelesai as true and record completion time
        if (status === 'Selesai' && !data.statusSelesai) {
            updates.statusSelesai = true;
            updates.tarikhSelesai = new Date().toISOString();
        }

        // Use DataStore.update to ensure sync
        await DataStore.update(id, updates);

        showToast('✅ Berjaya dikemaskini!');
        closeModal('modal-tindakan');

        // Refresh UI
        updateDashboard();
        renderPermohonan();
        renderLaporan(); // Update reports
    } else {
        showToast('❌ Ralat: Data tidak dijumpai');
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

    DataStore.remove(id, type).then(() => {
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
        const now = new Date();

        permohonan.forEach(p => {
            const isHandled = ['diluluskan', 'dalam proses'].includes((p.status || '').toLowerCase());
            if (!isHandled) return;

            const updateTime = p.updatedAt || p.createdAt;

            if (p.itemsData) {
                try {
                    const items = typeof p.itemsData === 'string' ? JSON.parse(p.itemsData) : p.itemsData;
                    if (Array.isArray(items)) {
                        items.forEach(item => {
                            const qty = parseInt(item.qty) || 0;
                            if (!itemUsage[item.name]) {
                                itemUsage[item.name] = { qty: 0, latest: null };
                            }
                            itemUsage[item.name].qty += qty;
                            if (!itemUsage[item.name].latest || new Date(updateTime) > new Date(itemUsage[item.name].latest)) {
                                itemUsage[item.name].latest = updateTime;
                            }
                        });
                    }
                } catch (e) { }
            } else if (p.items && p.items !== 'Dewan') {
                if (!itemUsage[p.items]) {
                    itemUsage[p.items] = { qty: 0, latest: null };
                }
                itemUsage[p.items].qty += 1;
                if (!itemUsage[p.items].latest || new Date(updateTime) > new Date(itemUsage[p.items].latest)) {
                    itemUsage[p.items].latest = updateTime;
                }
            }
        });

        // For Charts and Summaries
        const sortedUsage = Object.entries(itemUsage)
            .map(([name, data]) => [name, data.qty])
            .sort((a, b) => b[1] - a[1]);

        const top5Usage = sortedUsage.slice(0, 5);
        const maxUsage = top5Usage.length > 0 ? top5Usage[0][1] : 1;
        const chartPeralatanDiv = document.getElementById('chart-peralatan');

        if (chartPeralatanDiv) {
            if (top5Usage.length === 0) {
                chartPeralatanDiv.innerHTML = '<p class="text-slate-400 text-center py-4 text-xs italic">Tiada penggunaan peralatan</p>';
            } else {
                chartPeralatanDiv.innerHTML = top5Usage.map(([name, count]) => {
                    const perc = Math.max(10, (count / maxUsage) * 100);
                    return `
                        <div class="mb-4">
                            <div class="flex justify-between items-center text-[11px] font-bold mb-1.5">
                                <span class="text-slate-700">${name}</span>
                                <span class="text-indigo-600">${count} Unit Diguna</span>
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
            approvalRateEl.textContent = `${rate}% `;
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
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-12 text-center text-slate-400 italic">Tiada data inventori</td></tr>';
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

    // Update Headers for 7 columns
    const thead = tbody.closest('table').querySelector('thead');
    if (thead) {
        thead.innerHTML = `
            <tr class="bg-slate-50">
                <th class="px-4 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">Peralatan</th>
                <th class="px-4 py-4 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">Baru (+)</th>
                <th class="px-4 py-4 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">Rosak (-)</th>
                <th class="px-4 py-4 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">Jumlah</th>
                <th class="px-4 py-4 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">Diguna</th>
                <th class="px-4 py-4 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">Baki</th>
                <th class="px-4 py-4 text-right text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</th>
            </tr>
        `;
    }

    tbody.innerHTML = unique.map(p => {
        const usageDataForItem = usageData[p.namaPeralatan] || { qty: 0, latest: null };
        const usageCount = usageDataForItem.qty;
        const total = parseInt(p.kuantiti) || 0;
        const baki = Math.max(0, total - usageCount);
        const hasStock = baki > 0;

        const dateBaru = p.lastUpdateBaru ? `<br><span class="text-[8px] opacity-60">${formatRelativeDate(p.lastUpdateBaru)}</span>` : '';
        const dateRosak = p.lastUpdateRosak ? `<br><span class="text-[8px] opacity-60">${formatRelativeDate(p.lastUpdateRosak)}</span>` : '';
        const dateJumlah = p.lastUpdateJumlah ? `<br><span class="text-[8px] opacity-60">${formatRelativeDate(p.lastUpdateJumlah)}</span>` : '';
        const dateLatestUse = usageDataForItem.latest ? `<br><span class="text-[8px] opacity-60">${formatRelativeDate(usageDataForItem.latest)}</span>` : '';

        return `
            <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
                <td class="px-4 py-4">
                    <p class="font-bold text-slate-800 text-xs">${p.namaPeralatan}</p>
                </td>
                <td class="px-4 py-4 text-center">
                    <span class="text-green-600 font-bold">${p.totalBaru || 0}</span>${dateBaru}
                </td>
                <td class="px-4 py-4 text-center">
                    <span class="text-red-500 font-bold">${p.totalRosak || 0}</span>${dateRosak}
                </td>
                <td class="px-4 py-4 text-center">
                    <span class="text-slate-800 font-black">${total}</span>${dateJumlah}
                </td>
                <td class="px-4 py-4 text-center">
                    <span class="text-indigo-600 font-bold">${usageCount}</span>${dateLatestUse}
                </td>
                <td class="px-4 py-4 text-center">
                    <span class="font-bold border-b-2 ${hasStock ? 'border-green-400 text-green-700' : 'border-red-400 text-red-700'}">${baki}</span>
                </td>
                <td class="px-4 py-4 text-right">
                    <span class="status-badge ${hasStock ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}">
                        ${hasStock ? 'Sedia' : 'Habis'}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

// Helper to format date relative to now or simple string
function formatRelativeDate(isoDate) {
    if (!isoDate) return '-';
    const date = new Date(isoDate);
    return date.toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
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
        savePortalSetting('portalBgImage', currentBgBase64);
    }

    localStorage.setItem('portalBgSize', size);
    localStorage.setItem('portalBgPosition', pos);
    savePortalSetting('portalBgSize', size);
    savePortalSetting('portalBgPosition', pos);

    applyBgSettings();
    showToast('✅ Tetapan latar belakang berjaya disimpan (Online Sync)');
}

async function savePortalSetting(key, val) {
    const id = `setting_${key}`;
    const setting = {
        type: 'tetapan',
        __backendId: id,
        key: key,
        value: val,
        updatedAt: new Date().toISOString()
    };

    // Check if exists in allData
    const existing = allData.find(d => d.__backendId === id);
    if (existing) {
        await DataStore.update(id, { value: val, updatedAt: new Date().toISOString() });
    } else {
        await DataStore.add(setting);
    }
}

function applyBgSettings() {
    // Try to get from DataStore first for most recent online data, fallback to localStorage
    const bgFromData = allData.find(d => d.key === 'portalBgImage')?.value;
    const savedBg = bgFromData || localStorage.getItem('portalBgImage');

    const sizeFromData = allData.find(d => d.key === 'portalBgSize')?.value;
    const savedSize = sizeFromData || localStorage.getItem('portalBgSize') || 'cover';

    const posFromData = allData.find(d => d.key === 'portalBgPosition')?.value;
    const savedPos = posFromData || localStorage.getItem('portalBgPosition') || 'center';

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
        savePortalSetting('portalLogo', currentLogoBase64);
    }
    localStorage.setItem('portalLogoFit', fit);
    savePortalSetting('portalLogoFit', fit);
    applyLogoSettings();
    showToast('✅ Tetapan logo berjaya disimpan (Online Sync)!');
}

//arealoginscript

function applyLogoSettings() {
    const logoFromData = allData.find(d => d.key === 'portalLogo')?.value;
    const savedLogo = logoFromData || localStorage.getItem('portalLogo');

    const fitFromData = allData.find(d => d.key === 'portalLogoFit')?.value;
    const savedFit = fitFromData || localStorage.getItem('portalLogoFit') || 'contain';

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
                                    <th style="border: 1px solid #e5e7eb; font-size: 8pt;">Peralatan</th>
                                    <th style="text-align: center; border: 1px solid #e5e7eb; font-size: 8pt;">Baru (+)</th>
                                    <th style="text-align: center; border: 1px solid #e5e7eb; font-size: 8pt;">Rosak (-)</th>
                                    <th style="text-align: center; border: 1px solid #e5e7eb; font-size: 8pt;">Jumlah</th>
                                    <th style="text-align: center; border: 1px solid #e5e7eb; font-size: 8pt;">Diguna</th>
                                    <th style="text-align: center; border: 1px solid #e5e7eb; font-size: 8pt;">Baki</th>
                                    <th style="text-align: right; border: 1px solid #e5e7eb; font-size: 8pt;">Status</th>
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
                        padding: 0;
                        background: #f8fafc;
                        min-height: calc(100vh - 250px);
                    }
                    
                    /* Content sections */
                    .report-section {
                        background: white;
                        padding: 25px;
                        border-radius: 10px;
                        border: 1px solid #e5e7eb;
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
                    
                    /* TAILWIND ICON SCALING FIXES */
                    .w-5 { width: 20px !important; } .h-5 { height: 20px !important; }
                    .w-6 { width: 24px !important; } .h-6 { height: 24px !important; }
                    .w-7 { width: 28px !important; } .h-7 { height: 28px !important; }
                    .w-8 { width: 32px !important; } .h-8 { height: 32px !important; }
                    .w-10 { width: 40px !important; } .h-10 { height: 40px !important; }
                    .w-12 { width: 48px !important; } .h-12 { height: 48px !important; }
                    .rounded-full { border-radius: 9999px !important; }
                    .rounded-xl { border-radius: 12px !important; }
                    .flex { display: flex !important; }
                    .items-center { align-items: center !important; }
                    .justify-center { justify-content: center !important; }
                    .gap-4 { gap: 1rem !important; }
                    svg { display: block; max-width: 100%; max-height: 100%; }

                    @media print {
                        body {
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        .report-section {
                            box-shadow: none;
                        }
                    }
                </style>
            </head>
            <body>
                <table style="width: 100%; border: none; border-collapse: collapse; margin: 0; padding: 0;">
                    <thead>
                        <tr><td style="height: 170px; border: none; padding: 0;">&nbsp;</td></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border: none; padding: 0;">
                                <div class="report-body">
                                    ${editableArea.querySelector('.report-body').innerHTML}
                                </div>
                            </td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr><td style="height: 80px; border: none; padding: 0;">&nbsp;</td></tr>
                    </tfoot>
                </table>

                <div class="report-header">
                    ${editableArea.querySelector('.report-header').innerHTML}
                </div>

                <div class="report-footer">
                    ${editableArea.querySelector('.report-footer').innerHTML}
                </div>
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

// ===== REAL-TIME SYNC & NOTIFICATION =====
let isSyncing = false;
const SYNC_INTERVAL = 15000; // Check every 15 seconds

function startRealtimeSync() {
    console.log('📡 Starting Real-time Sync (Interval: 15s)');

    // Initial sync handles first load, so we just set interval
    setInterval(async () => {
        // Don't sync if user is not logged in (admin only)
        if (localStorage.getItem('isLoggedIn') !== 'true') return;

        if (isSyncing || !GoogleSheetsDB.isConfigured()) return;

        isSyncing = true;
        try {
            // 1. Fetch silently
            // We use fetchAll which is already defined in GoogleSheetsDB
            // But we want to avoid full UI parsing unless needed
            const result = await fetch(`${GOOGLE_SCRIPT_URL}?action=getAll`).then(r => r.json());

            if (result.success && result.data) {
                const currentCount = allData.length;
                const newCount = result.data.length;

                // 2. Check for differences (simple count check first)
                if (newCount !== currentCount) {
                    console.log(`🔔 New update detected! ${currentCount} -> ${newCount}`);

                    const isNewData = newCount > currentCount;

                    // Save & Update UI
                    localStorage.setItem('dewanData', JSON.stringify(result.data));
                    allData = result.data;
                    DataStore.notify();

                    // 3. Notify Admin if data ADDED
                    if (isNewData) {
                        playNotificationSound();
                        showToast(`🔔 ${newCount - currentCount} permohonan/data baru diterima!`);

                        // Update indicator to show activity
                        const indicator = document.getElementById('sheets-status-indicator');
                        if (indicator) {
                            indicator.className = 'w-3 h-3 rounded-full bg-blue-500 animate-pulse';
                            setTimeout(() => indicator.className = 'w-3 h-3 rounded-full bg-green-500', 2000);
                        }
                    }
                }
            }
        } catch (err) {
            console.warn('Silent sync warning:', err.message);
        } finally {
            isSyncing = false;
        }
    }, SYNC_INTERVAL);
}

// Notification Sound System
function playNotificationSound() {
    const soundFromData = allData.find(d => d.key === 'portalSoundChoice')?.value;
    const choice = soundFromData || localStorage.getItem('portalSoundChoice') || 'beep';

    const volFromData = allData.find(d => d.key === 'portalSoundVolume')?.value;
    const volume = (volFromData || localStorage.getItem('portalSoundVolume') || 50) / 100;

    const customUrl = allData.find(d => d.key === 'portalCustomSoundUrl')?.value || localStorage.getItem('portalCustomSoundUrl');

    try {
        if (choice === 'custom' && customUrl) {
            const audio = new Audio(customUrl);
            audio.volume = volume;
            audio.play().catch(e => console.error('Custom sound audio play failed', e));
        } else if (choice === 'bell') {
            playFreqSound([880, 1046.5], volume, 300);
        } else if (choice === 'modern') {
            playFreqSound([440, 554.37, 659.25], volume, 150, 50);
        } else {
            // Default Beep
            playFreqSound([500, 800], volume, 200, 50);
        }
    } catch (e) {
        console.error('Core audio play failed', e);
    }
}

function playFreqSound(freqs, volume, duration, gap = 50) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        freqs.forEach((freq, idx) => {
            setTimeout(() => {
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
                gainNode.gain.setValueAtTime(volume * 0.2, audioCtx.currentTime); // Normalise volume
                oscillator.start();
                setTimeout(() => oscillator.stop(), duration);
            }, idx * (duration + gap));
        });
    } catch (e) {
        console.warn('Frequency sound failed', e);
    }
}

function testNotificationSound() {
    // Temporarily read from UI
    const choice = document.getElementById('sound-choice').value;
    const volume = document.getElementById('sound-volume').value / 100;
    const customUrl = document.getElementById('custom-sound-url').value;

    if (choice === 'custom' && customUrl) {
        const audio = new Audio(customUrl);
        audio.volume = volume;
        audio.play().catch(e => {
            showToast('❌ Gagal memutar URL audio khas', 'error');
            console.error(e);
        });
    } else if (choice === 'bell') {
        playFreqSound([880, 1046.5], volume, 300);
    } else if (choice === 'modern') {
        playFreqSound([440, 554.37, 659.25], volume, 150, 50);
    } else {
        playFreqSound([500, 800], volume, 200, 50);
    }
}

async function saveSoundSettings() {
    const choice = document.getElementById('sound-choice').value;
    const volume = document.getElementById('sound-volume').value;
    const customUrl = document.getElementById('custom-sound-url').value;

    localStorage.setItem('portalSoundChoice', choice);
    localStorage.setItem('portalSoundVolume', volume);
    localStorage.setItem('portalCustomSoundUrl', customUrl);

    await savePortalSetting('portalSoundChoice', choice);
    await savePortalSetting('portalSoundVolume', volume);
    await savePortalSetting('portalCustomSoundUrl', customUrl);

    showToast('✅ Tetapan bunyi disimpan (Online Sync)!');
}

// Logic to show/hide custom sound URL
document.addEventListener('DOMContentLoaded', () => {
    const soundChoice = document.getElementById('sound-choice');
    if (soundChoice) {
        soundChoice.addEventListener('change', function () {
            const container = document.getElementById('custom-sound-container');
            if (this.value === 'custom') {
                container.classList.remove('hidden');
            } else {
                container.classList.add('hidden');
            }
        });
    }

    // Load current values safely
    setTimeout(() => {
        const savedChoice = allData.find(d => d.key === 'portalSoundChoice')?.value || localStorage.getItem('portalSoundChoice');
        if (savedChoice && document.getElementById('sound-choice')) {
            document.getElementById('sound-choice').value = savedChoice;
            if (savedChoice === 'custom') document.getElementById('custom-sound-container').classList.remove('hidden');
        }

        const savedVol = allData.find(d => d.key === 'portalSoundVolume')?.value || localStorage.getItem('portalSoundVolume');
        if (savedVol && document.getElementById('sound-volume')) {
            document.getElementById('sound-volume').value = savedVol;
            document.getElementById('volume-val').textContent = savedVol;
        }

        const savedUrl = allData.find(d => d.key === 'portalCustomSoundUrl')?.value || localStorage.getItem('portalCustomSoundUrl');
        if (savedUrl && document.getElementById('custom-sound-url')) {
            document.getElementById('custom-sound-url').value = savedUrl;
        }
    }, 1000);
});

// ===== REFERENCE NUMBER LOGIC =====
function generateReferenceNo() {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Get all permohonan for this year to find the next number
    const permohonanTahunIni = allData.filter(d => {
        if (d.type !== 'permohonan' || !d.noPermohonan) return false;
        // Format: DSK-XXX-YYYY
        const parts = d.noPermohonan.split('-');
        return parts.length === 3 && parts[2] === currentYear.toString();
    });

    let nextNumber = 1;
    if (permohonanTahunIni.length > 0) {
        const lastNo = permohonanTahunIni
            .map(d => parseInt(d.noPermohonan.split('-')[1]) || 0)
            .reduce((max, val) => Math.max(max, val), 0);
        nextNumber = lastNo + 1;
    }

    const paddedNo = nextNumber.toString().padStart(3, '0');
    return `DSK-${paddedNo}-${currentYear}`;
}

// Initialize User Form Handler with Reference Number
function attachUserFormHandler() {
    const form = document.getElementById('form-user-permohonan');
    if (!form) return;

    // Check if we already attached prevent duplicated submission
    if (form.dataset.attached === 'true') return;
    form.dataset.attached = 'true';

    console.log('📝 User Form Handler Attached');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = document.getElementById('btn-submit-user-permohonan'); // Ensure ID matches your HTML button
        // Fallback if ID is different
        const submitBtn = btn || form.querySelector('button[type="submit"]');

        const originalText = submitBtn ? submitBtn.innerHTML : 'Hantar';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Menghantar...';
        }

        try {
            // Collect Data
            const id = Date.now().toString();
            const noPermohonan = generateReferenceNo();

            const permohonan = {
                type: 'permohonan',
                __backendId: id,
                noPermohonan: noPermohonan,
                nama: document.getElementById('user-nama-pemohon').value,
                email: document.getElementById('user-email-pemohon').value,
                nomorTelefon: document.getElementById('user-nombor-telefon').value,
                cawangan: document.getElementById('user-cawangan').value,
                jenisPermohonan: document.getElementById('user-jenis-permohonan-hidden').value,
                tujuan: document.getElementById('user-tujuan').value,
                tarikhMulaPinjam: document.getElementById('user-tarikh-mula').value,
                tarikhPulang: document.getElementById('user-tarikh-pulang').value,
                itemsData: document.getElementById('user-items-data-hidden').value,
                items: document.getElementById('user-item-dipinjam-hidden').value,
                status: 'Dalam Proses',
                createdAt: new Date().toISOString()
            };

            console.log('🚀 Submitting User Permohonan:', permohonan);

            // Save Data
            await DataStore.add(permohonan);

            // Show Success UI with Reference Number
            form.classList.add('hidden');
            const successContainer = document.getElementById('user-success-container');
            if (successContainer) {
                successContainer.classList.remove('hidden');

                // Show Reference No
                const refEl = document.getElementById('success-no-permohonan');
                if (refEl) {
                    refEl.textContent = noPermohonan;
                } else {
                    // Inject if missing from HTML edit failure earlier
                    const p = document.createElement('p');
                    p.innerHTML = `<br>No. Rujukan: <strong class="text-2xl text-indigo-600">${noPermohonan}</strong>`;
                    // Insert before the buttons
                    const btnContainer = successContainer.querySelector('div.mt-10') || successContainer.lastElementChild;
                    successContainer.insertBefore(p, btnContainer);
                }
            }

            // Clear Form
            form.reset();

        } catch (error) {
            console.error('Submit Error:', error);
            showToast('❌ Gagal menghantar permohonan. Sila cuba lagi.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }
    });
}

// ADMIN ADD KATEGORI & PERALATAN HANDLERS
document.addEventListener('DOMContentLoaded', () => {
    // Kategori Form
    const formKategori = document.getElementById('form-kategori');
    if (formKategori) {
        formKategori.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-submit-kategori');
            const editId = document.getElementById('kategori-id').value;

            btn.disabled = true;
            btn.textContent = 'Menyimpan...';

            const data = {
                type: 'kategori',
                namaKategori: document.getElementById('nama-kategori').value,
                createdAt: new Date().toISOString()
            };

            let result;
            if (editId) {
                result = await DataStore.update(editId, data);
            } else {
                result = await DataStore.add(data);
            }

            if (result.isOk) {
                showToast(editId ? 'Kategori berjaya dikemaskini!' : 'Kategori berjaya ditambah!');
                closeModal('modal-kategori');
                formKategori.reset();
                document.getElementById('kategori-id').value = '';
            }
            btn.disabled = false;
            btn.textContent = 'Simpan';
        });
    }

    // Peralatan Form
    const formPeralatan = document.getElementById('form-peralatan');
    if (formPeralatan) {
        formPeralatan.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-submit-peralatan');
            const editId = document.getElementById('peralatan-id').value;

            btn.disabled = true;
            btn.textContent = 'Menyimpan...';

            const addedBaru = parseInt(document.getElementById('tambah-baru').value) || 0;
            const addedRosak = parseInt(document.getElementById('item-rosak').value) || 0;

            // Get existing data if editing
            let existing = null;
            if (editId) {
                existing = allData.find(d => String(d.__backendId) === String(editId));
            }

            const now = new Date().toISOString();

            // Calculate new totals
            let currentTotal = existing ? (parseInt(existing.kuantiti) || 0) : 0;
            let totalBaru = existing ? (parseInt(existing.totalBaru) || 0) : 0;
            let totalRosak = existing ? (parseInt(existing.totalRosak) || 0) : 0;

            let lastUpdateBaru = existing ? existing.lastUpdateBaru : null;
            let lastUpdateRosak = existing ? existing.lastUpdateRosak : null;
            let lastUpdateJumlah = existing ? existing.lastUpdateJumlah : null;

            if (addedBaru > 0) {
                currentTotal += addedBaru;
                totalBaru += addedBaru;
                lastUpdateBaru = now;
                lastUpdateJumlah = now;
            }

            if (addedRosak > 0) {
                // Ensure we don't subtract more than available, but typically equipment total includes broken ones until removed?
                // User said "tolak dari jumlah yang ada".
                currentTotal = Math.max(0, currentTotal - addedRosak);
                totalRosak += addedRosak;
                lastUpdateRosak = now;
                lastUpdateJumlah = now;
            }

            const data = {
                type: 'peralatan',
                kategori: document.getElementById('kategori-peralatan').value,
                namaPeralatan: document.getElementById('nama-peralatan').value,
                kuantiti: currentTotal,
                kuantitiTersedia: currentTotal, // Will be recalculated by sync logic anyway
                totalBaru: totalBaru,
                totalRosak: totalRosak,
                lastUpdateBaru: lastUpdateBaru,
                lastUpdateRosak: lastUpdateRosak,
                lastUpdateJumlah: lastUpdateJumlah,
                createdAt: existing ? existing.createdAt : now
            };

            let result;
            if (editId) {
                result = await DataStore.update(editId, data);
            } else {
                // For new items, initial quantity is set as "Baru"
                data.totalBaru = data.kuantiti;
                data.lastUpdateBaru = now;
                data.lastUpdateJumlah = now;
                result = await DataStore.add(data);
            }

            if (result.isOk) {
                showToast(editId ? 'Peralatan dikemaskini!' : 'Peralatan berjaya ditambah!');
                closeModal('modal-peralatan');
                formPeralatan.reset();
                document.getElementById('peralatan-id').value = '';

                // Refresh UIs
                renderPeralatan();
                if (typeof renderLaporan === 'function') renderLaporan();
            }
            btn.disabled = false;
            btn.textContent = editId ? 'Kemaskini' : 'Simpan';
        });
    }
});

// Call on load
document.addEventListener('DOMContentLoaded', attachUserFormHandler);

