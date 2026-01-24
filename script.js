// =====================
// SIDEBAR & OVERLAY
// =====================
var menuToggle = document.getElementById("menuToggle");
var sidebar = document.getElementById("sidebar");
var overlay = document.getElementById("overlay");

menuToggle.addEventListener("click", function () {
    if (sidebar.classList.contains("sidebar-closed")) {
        sidebar.classList.remove("sidebar-closed");
        overlay.classList.remove("hidden");
    } else {
        sidebar.classList.add("sidebar-closed");
        overlay.classList.add("hidden");
    }
});

overlay.addEventListener("click", function () {
    sidebar.classList.add("sidebar-closed");
    overlay.classList.add("hidden");
});

// =====================
// TOAST NOTIFICATION
// =====================
var toast = document.getElementById("toast");

function showToast(message, type) {
    type = type || "success";
    toast.textContent = message;
    toast.className = "toast " + (type === "success" ? "bg-green-600" : "bg-red-600");
    toast.style.display = "block";
    setTimeout(function () {
        toast.style.display = "none";
    }, 3000);
}

// =====================
// PAGE NAVIGATION
// =====================
var navButtons = document.querySelectorAll(".nav-btn");
var pages = document.querySelectorAll(".page-content");

function showPage(pageId) {
    pages.forEach(function (page) { page.classList.add("hidden"); });
    var activePage = document.getElementById(pageId + "Page");
    if (activePage) activePage.classList.remove("hidden");

    navButtons.forEach(function (btn) {
        btn.classList.remove("bg-blue-600");
        if (btn.getAttribute("data-page") === pageId) btn.classList.add("bg-blue-600");
    });

    localStorage.setItem("lastPage", pageId);
}

var lastPage = localStorage.getItem("lastPage") || "dashboard";
showPage(lastPage);

navButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
        var pageId = this.getAttribute("data-page");
        showPage(pageId);
        if (window.innerWidth < 768) {
            sidebar.classList.add("sidebar-closed");
            overlay.classList.add("hidden");
        }
    });
});

// =====================
// LOCAL STORAGE DATA
// =====================
var permohonanData = JSON.parse(localStorage.getItem("permohonanData") || "[]");
var peralatanData = JSON.parse(localStorage.getItem("peralatanData") || "[]");
var kategoriData = JSON.parse(localStorage.getItem("kategoriData") || "[]");

// =====================
// DASHBOARD
// =====================
var totalPeralatanElem = document.getElementById("totalPeralatan");
var totalPermohonanElem = document.getElementById("totalPermohonan");

function updateDashboard() {
    totalPeralatanElem.textContent = peralatanData.length;
    var newPermohonan = permohonanData.filter(p => p.status === "Baru").length;
    totalPermohonanElem.textContent = newPermohonan;
}

// =====================
// KATEGORI MANAGEMENT
// =====================
var kategoriForm = document.getElementById("kategoriForm");
var kategoriList = document.getElementById("kategoriList");
var namaKategoriInput = document.getElementById("namaKategori");
var closeKategoriBtn = document.getElementById("closeKategori");
var kategoriSelect = document.getElementById("kategoriPeralatan");

function renderKategori() {
    kategoriList.innerHTML = "";
    if (kategoriData.length === 0) kategoriList.innerHTML = "<p>Tiada kategori.</p>";
    kategoriData.forEach(function (kat, i) {
        var div = document.createElement("div");
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        div.style.alignItems = "center";
        div.innerHTML = kat + ' <button data-index="' + i + '">Hapus</button>';
        kategoriList.appendChild(div);
    });
}

function renderKategoriSelect() {
    kategoriSelect.innerHTML = "<option value=''>Pilih Kategori</option>";
    kategoriData.forEach(function (kat) {
        var opt = document.createElement("option");
        opt.value = kat;
        opt.textContent = kat;
        kategoriSelect.appendChild(opt);
    });
}

kategoriForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var kat = namaKategoriInput.value.trim();
    if (!kat) return;
    kategoriData.push(kat);
    localStorage.setItem("kategoriData", JSON.stringify(kategoriData));
    namaKategoriInput.value = "";
    renderKategori();
    renderKategoriSelect();
    showToast("Kategori ditambah!");
});

kategoriList.addEventListener("click", function (e) {
    if (e.target.tagName === "BUTTON") {
        var idx = parseInt(e.target.getAttribute("data-index"));
        kategoriData.splice(idx, 1);
        localStorage.setItem("kategoriData", JSON.stringify(kategoriData));
        renderKategori();
        renderKategoriSelect();
        showToast("Kategori dihapus!");
    }
});

closeKategoriBtn.addEventListener("click", function () {
    document.getElementById("formKategori").classList.add("hidden");
});

renderKategori();
renderKategoriSelect();

// =====================
// PERALATAN ICT MANAGEMENT
// =====================
var btnNewPeralatan = document.getElementById("btnNewPeralatan");
var formPeralatan = document.getElementById("formPeralatan"); // container
var peralatanForm = document.getElementById("peralatanForm"); // actual form
var peralatanTableBody = document.getElementById("peralatanTableBody");
var cancelPeralatan = document.getElementById("cancelPeralatan");

function renderPeralatanTable() {
    peralatanTableBody.innerHTML = "";
    peralatanData.forEach(function (item, i) {
        var tr = document.createElement("tr");
        tr.innerHTML =
            "<td>" + item.kategori + "</td>" +
            "<td>" + item.nama + "</td>" +
            "<td>" + item.noUMS + "</td>" +
            "<td>" + item.noSiri + "</td>" +
            "<td>" + (item.jumlah || 0) + "</td>" +
            "<td><button data-index='" + i + "'>Hapus</button></td>";
        peralatanTableBody.appendChild(tr);
    });
    updateDashboard();
}

btnNewPeralatan.addEventListener("click", function () {
    formPeralatan.classList.remove("hidden");
});

cancelPeralatan.addEventListener("click", function () {
    formPeralatan.classList.add("hidden");
    peralatanForm.reset();
});

peralatanForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var newPeralatan = {
        kategori: kategoriSelect.value,
        nama: document.getElementById("namaPeralatan").value.trim(),
        noUMS: document.getElementById("nomorPendaftaranUMS").value.trim(),
        noSiri: document.getElementById("nomorSiri").value.trim(),
        jumlah: 0
    };
    if (!newPeralatan.kategori || !newPeralatan.nama) {
        return showToast("Sila pilih kategori dan isi nama peralatan!", "error");
    }
    peralatanData.push(newPeralatan);
    localStorage.setItem("peralatanData", JSON.stringify(peralatanData));
    renderPeralatanTable();
    renderItemCheckboxes();
    formPeralatan.classList.add("hidden");
    peralatanForm.reset();
    showToast("Peralatan ditambah!");
});

peralatanTableBody.addEventListener("click", function (e) {
    if (e.target.tagName === "BUTTON") {
        var idx = parseInt(e.target.getAttribute("data-index"));
        peralatanData.splice(idx, 1);
        localStorage.setItem("peralatanData", JSON.stringify(peralatanData));
        renderPeralatanTable();
        renderItemCheckboxes();
        showToast("Peralatan dihapus!");
    }
});

// =====================
// PERMOHONAN MANAGEMENT (dengan multi-choice dari peralatan ICT)
// =====================
var btnNewPermohonan = document.getElementById("btnNewPermohonan");
var formPermohonan = document.getElementById("formPermohonan");
var permohonanForm = document.getElementById("permohonanForm");
var permohonanTableBody = document.getElementById("permohonanTableBody");
var cancelPermohonan = document.getElementById("cancelPermohonan");
var itemCheckboxContainer = document.getElementById("itemCheckboxContainer");

// Buka form permohonan
btnNewPermohonan.addEventListener("click", function () {
    formPermohonan.classList.remove("hidden");
    renderItemCheckboxes(); // pastikan checkbox dikemaskini setiap kali form dibuka
});

// Tutup form permohonan
cancelPermohonan.addEventListener("click", function () {
    formPermohonan.classList.add("hidden");
    permohonanForm.reset();
});

// Render checkbox berdasarkan peralatan ICT
function renderItemCheckboxes() {
    itemCheckboxContainer.innerHTML = "";
    if (peralatanData.length === 0) {
        itemCheckboxContainer.innerHTML = "<p>Tiada peralatan tersedia.</p>";
        return;
    }
    peralatanData.forEach(function (item, i) {
        var div = document.createElement("div");
        div.style.marginBottom = "5px";
        div.innerHTML = "<input type='checkbox' id='item-" + i + "' value='" + item.nama + "'>" +
            "<label for='item-" + i + "'> " + item.nama + "</label>";
        itemCheckboxContainer.appendChild(div);
    });
}

// =====================
// PERALATAN MANAGEMENT (tambah property dipinjam)
// =====================
function renderItemCheckboxes() {
    itemCheckboxContainer.innerHTML = "";
    var availableItems = peralatanData.filter(item => !item.dipinjam);
    if (availableItems.length === 0) {
        itemCheckboxContainer.innerHTML = "<p>Tiada peralatan tersedia.</p>";
        return;
    }
    availableItems.forEach(function (item, i) {
        var div = document.createElement("div");
        div.style.marginBottom = "5px";
        div.innerHTML = "<input type='checkbox' id='item-" + i + "' value='" + item.nama + "'>" +
            "<label for='item-" + i + "'> " + item.nama + "</label>";
        itemCheckboxContainer.appendChild(div);
    });
}

// Submit permohonan
permohonanForm.addEventListener("submit", function (e) {
    e.preventDefault();

    var checkboxes = itemCheckboxContainer.querySelectorAll("input[type=checkbox]:checked");
    if (checkboxes.length === 0) return showToast("Sila pilih item!", "error");

    var selectedItems = Array.from(checkboxes).map(cb => cb.value);

    // tandakan item sebagai dipinjam
    peralatanData.forEach(item => {
        if (selectedItems.includes(item.nama)) item.dipinjam = true;
    });

    localStorage.setItem("peralatanData", JSON.stringify(peralatanData));

    var newPermohonan = {
        nama: document.getElementById("namaPengguna").value.trim(),
        email: document.getElementById("emailPengguna").value.trim(),
        telefon: document.getElementById("nomorTelefon").value.trim(),
        kuantiti: parseInt(document.getElementById("kuantitiDipinjam").value),
        items: selectedItems,
        status: "Baru",
        tarikh: new Date().toLocaleDateString()
    };

    permohonanData.push(newPermohonan);
    localStorage.setItem("permohonanData", JSON.stringify(permohonanData));

    permohonanForm.reset();

    // Check if we are in public view mode
    var currentUrlParams = new URLSearchParams(window.location.search);
    if (currentUrlParams.get('view') !== 'user_form') {
        formPermohonan.classList.add("hidden");
        renderPermohonanTable();
        renderItemCheckboxes(); // kemaskini senarai item tersedia
        renderPeralatanTable(); // update table peralatan supaya nampak status
    } else {
        // In public mode, refresh checkboxes to reflect stock changes
        renderItemCheckboxes();
    }

    showToast("Permohonan berjaya dihantar!");
});

// Jika mahu user pulangkan item (contoh: button di permohonan table)
permohonanTableBody.addEventListener("click", function (e) {
    if (e.target.tagName === "BUTTON" && e.target.dataset.action === "pulangkan") {
        var idx = parseInt(e.target.dataset.index);
        var permohonan = permohonanData[idx];
        permohonan.items.forEach(itemName => {
            var item = peralatanData.find(p => p.nama === itemName);
            if (item) item.dipinjam = false;
        });
        permohonan.status = "Selesai";
        localStorage.setItem("peralatanData", JSON.stringify(peralatanData));
        localStorage.setItem("permohonanData", JSON.stringify(permohonanData));
        renderPermohonanTable();
        renderItemCheckboxes();
        renderPeralatanTable();
        showToast("Item telah dipulangkan!");
    }
});





// Toggle formKategori dengan butang Urus Kategori
var btnManageKategori = document.getElementById("btnManageKategori");
btnManageKategori.addEventListener("click", function () {
    formKategori.classList.toggle("hidden");
});

function renderPermohonanTable() {
    permohonanTableBody.innerHTML = "";
    permohonanData.forEach(function (item, i) {
        var tr = document.createElement("tr");
        tr.innerHTML =
            "<td>" + item.nama + "</td>" +
            "<td>" + item.email + "</td>" +
            "<td>" + item.telefon + "</td>" +
            "<td>" + item.items.join(", ") + "</td>" +
            "<td>" + item.kuantiti + "</td>" +
            "<td>" + item.status + "</td>" +
            "<td>" + item.tarikh + "</td>" +
            "<td><button data-index='" + i + "'>Hapus</button></td>";
        permohonanTableBody.appendChild(tr);
    });
    updateDashboard();
}

permohonanTableBody.addEventListener("click", function (e) {
    if (e.target.tagName === "BUTTON") {
        var idx = parseInt(e.target.getAttribute("data-index"));
        permohonanData.splice(idx, 1);
        localStorage.setItem("permohonanData", JSON.stringify(permohonanData));
        renderPermohonanTable();
        showToast("Permohonan dihapus!");
    }
});

// =====================
// INITIAL RENDER
// =====================
renderPermohonanTable();
renderPeralatanTable();
updateDashboard();

// =====================
// SHARE LINK FUNCTIONALITY
// =====================
var btnUserFormLink = document.getElementById("btnUserFormLink");
var userFormModal = document.getElementById("userFormModal");
var btnCloseUserFormModal = document.getElementById("btnCloseUserFormModal");
var btnCopyUserFormLink = document.getElementById("btnCopyUserFormLink");
var userFormLinkInput = document.getElementById("userFormLink");

if (btnUserFormLink) {
    btnUserFormLink.addEventListener("click", function (e) {
        e.preventDefault(); // Prevent default behavior if any
        // Generate current URL with ?view=user_form
        var baseUrl = window.location.origin + window.location.pathname;
        var shareUrl = baseUrl + "?view=user_form";
        userFormLinkInput.value = shareUrl;

        userFormModal.classList.remove("hidden");
        userFormModal.style.display = "flex"; // Force flex display

        // Ensure z-index is high enough just in case
        userFormModal.style.zIndex = "9999";
    });
}

if (btnCloseUserFormModal) {
    btnCloseUserFormModal.addEventListener("click", function () {
        userFormModal.classList.add("hidden");
        userFormModal.classList.remove("flex");
    });
}

if (btnCopyUserFormLink) {
    btnCopyUserFormLink.addEventListener("click", function () {
        userFormLinkInput.select();
        document.execCommand("copy");
        showToast("Pautan berjaya disalin!");
    });
}

// =====================
// PUBLIC VIEW MODE
// =====================
var urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('view') === 'user_form') {
    // Hide Admin UI elements
    var header = document.querySelector("#app > header");
    if (header) header.style.display = 'none';

    // Hide Sidebar and Main Content Wrapper
    var mainFlexParams = document.querySelector("#app > div.flex");
    if (mainFlexParams) mainFlexParams.style.display = 'none';

    // Setup Main App Container for Public View
    var appContainer = document.getElementById("app");
    appContainer.className = "min-h-screen bg-slate-200 flex items-center justify-center p-4";

    // Prepare the Form
    var formContainer = document.getElementById("formPermohonan");
    if (formContainer) {
        formContainer.classList.remove("hidden");
        formContainer.classList.add("w-full", "max-w-2xl");

        // Move to app root (this moves it out of the hidden mainFlexParams)
        appContainer.appendChild(formContainer);

        // Hide Cancel Button
        var btnCancel = document.getElementById("cancelPermohonan");
        if (btnCancel) btnCancel.style.display = "none";

        // Add Public Header
        var publicHeader = document.createElement("div");
        publicHeader.className = "text-center mb-6";
        publicHeader.innerHTML = "<h1 class='text-3xl font-bold text-slate-800'>Permohonan Peralatan ICT</h1><p class='text-slate-600 mt-2'>Sila isi borang di bawah untuk meminjam peralatan.</p>";
        formContainer.insertBefore(publicHeader, formContainer.firstChild);

        // Ensure checkboxes are rendered
        renderItemCheckboxes();
    }
}
