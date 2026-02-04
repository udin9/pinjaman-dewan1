/**
 * ============================================
 * GOOGLE APPS SCRIPT - DATABASE API
 * Portal Pengurusan Dewan Sri Kinabatangan
 * ============================================
 * 
 * ARAHAN:
 * 1. Buka Google Spreadsheet anda
 * 2. Click Extensions > Apps Script
 * 3. Padam semua kod, paste kod ini
 * 4. Save dan Deploy sebagai Web App
 * 5. Copy URL deployment ke script.js
 */

// ===== CONFIGURATION =====
const SHEET_NAMES = {
    permohonan: 'Permohonan',
    kategori: 'Kategori',
    peralatan: 'Peralatan'
};

// ===== MAIN HANDLERS =====

/**
 * Handle GET requests - Read data
 */
function doGet(e) {
    try {
        const action = e.parameter.action || 'getAll';
        const type = e.parameter.type || 'permohonan';

        let result;

        switch (action) {
            case 'getAll':
                result = getAllData();
                break;
            case 'getByType':
                result = getDataByType(type);
                break;
            case 'test':
                result = { success: true, message: 'Connection OK!', timestamp: new Date().toISOString() };
                break;
            default:
                result = getAllData();
        }

        return ContentService
            .createTextOutput(JSON.stringify(result))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService
            .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * Handle POST requests - Create, Update, Delete
 */
function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const action = data.action || 'add';

        let result;

        switch (action) {
            case 'add':
                result = addData(data.type, data.item);
                break;
            case 'update':
                result = updateData(data.type, data.id, data.item);
                break;
            case 'delete':
                result = deleteData(data.type, data.id);
                break;
            case 'bulkAdd':
                result = bulkAddData(data.type, data.items);
                break;
            case 'sync':
                result = syncAllData(data.allData);
                break;
            default:
                result = { success: false, error: 'Unknown action' };
        }

        return ContentService
            .createTextOutput(JSON.stringify(result))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService
            .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

// ===== DATA OPERATIONS =====

/**
 * Get all data from all sheets
 */
function getAllData() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const allData = [];

    // Get Permohonan
    const permohonanData = getSheetData(ss, SHEET_NAMES.permohonan);
    permohonanData.forEach(row => {
        row.type = 'permohonan';
        allData.push(row);
    });

    // Get Kategori
    const kategoriData = getSheetData(ss, SHEET_NAMES.kategori);
    kategoriData.forEach(row => {
        row.type = 'kategori';
        allData.push(row);
    });

    // Get Peralatan
    const peralatanData = getSheetData(ss, SHEET_NAMES.peralatan);
    peralatanData.forEach(row => {
        row.type = 'peralatan';
        allData.push(row);
    });

    return { success: true, data: allData };
}

/**
 * Get data by type
 */
function getDataByType(type) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = SHEET_NAMES[type] || SHEET_NAMES.permohonan;
    const data = getSheetData(ss, sheetName);

    data.forEach(row => row.type = type);

    return { success: true, data: data };
}

/**
 * Convert sheet to array of objects
 */
function getSheetData(ss, sheetName) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return []; // No data rows

    const headers = data[0];
    const rows = data.slice(1);

    return rows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            if (header && header.toString().trim()) {
                obj[header.toString().trim()] = row[index];
            }
        });
        return obj;
    }).filter(obj => obj.__backendId); // Only return rows with ID
}

/**
 * Add new data
 */
function addData(type, item) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = SHEET_NAMES[type] || SHEET_NAMES.permohonan;
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
        return { success: false, error: 'Sheet not found: ' + sheetName };
    }

    // Get headers
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Build row data based on headers
    const rowData = headers.map(header => {
        const key = header.toString().trim();
        return item[key] !== undefined ? item[key] : '';
    });

    // Append row
    sheet.appendRow(rowData);

    return { success: true, message: 'Data added successfully', id: item.__backendId };
}

/**
 * Update existing data
 */
function updateData(type, id, item) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = SHEET_NAMES[type] || SHEET_NAMES.permohonan;
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
        return { success: false, error: 'Sheet not found: ' + sheetName };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idColIndex = headers.indexOf('__backendId');

    if (idColIndex === -1) {
        return { success: false, error: '__backendId column not found' };
    }

    // Find row with matching ID
    for (let i = 1; i < data.length; i++) {
        if (data[i][idColIndex].toString() === id.toString()) {
            // Update row
            const rowData = headers.map(header => {
                const key = header.toString().trim();
                return item[key] !== undefined ? item[key] : data[i][headers.indexOf(header)];
            });

            sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
            return { success: true, message: 'Data updated successfully' };
        }
    }

    return { success: false, error: 'ID not found: ' + id };
}

/**
 * Delete data by ID
 */
function deleteData(type, id) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = SHEET_NAMES[type] || SHEET_NAMES.permohonan;
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
        return { success: false, error: 'Sheet not found: ' + sheetName };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idColIndex = headers.indexOf('__backendId');

    if (idColIndex === -1) {
        return { success: false, error: '__backendId column not found' };
    }

    // Find and delete row
    for (let i = 1; i < data.length; i++) {
        if (data[i][idColIndex].toString() === id.toString()) {
            sheet.deleteRow(i + 1);
            return { success: true, message: 'Data deleted successfully' };
        }
    }

    return { success: false, error: 'ID not found: ' + id };
}

/**
 * Bulk add data
 */
function bulkAddData(type, items) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = SHEET_NAMES[type] || SHEET_NAMES.permohonan;
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
        return { success: false, error: 'Sheet not found: ' + sheetName };
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    const rows = items.map(item => {
        return headers.map(header => {
            const key = header.toString().trim();
            return item[key] !== undefined ? item[key] : '';
        });
    });

    if (rows.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
    }

    return { success: true, message: `${rows.length} items added successfully` };
}

/**
 * Sync all data - Clear and rewrite
 */
function syncAllData(allData) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Group data by type
    const grouped = {
        permohonan: allData.filter(d => d.type === 'permohonan'),
        kategori: allData.filter(d => d.type === 'kategori'),
        peralatan: allData.filter(d => d.type === 'peralatan')
    };

    // Sync each sheet
    Object.keys(grouped).forEach(type => {
        const sheetName = SHEET_NAMES[type];
        const sheet = ss.getSheetByName(sheetName);

        if (!sheet) return;

        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

        // Clear existing data (keep headers)
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
            sheet.deleteRows(2, lastRow - 1);
        }

        // Add new data
        const items = grouped[type];
        if (items.length > 0) {
            const rows = items.map(item => {
                return headers.map(header => {
                    const key = header.toString().trim();
                    return item[key] !== undefined ? item[key] : '';
                });
            });

            sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
        }
    });

    return {
        success: true, message: 'All data synced successfully', counts: {
            permohonan: grouped.permohonan.length,
            kategori: grouped.kategori.length,
            peralatan: grouped.peralatan.length
        }
    };
}

// ===== UTILITY FUNCTIONS =====

/**
 * Initialize sheets with headers (run manually once)
 */
function initializeSheets() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Permohonan headers
    const permohonanHeaders = [
        '__backendId', 'nama', 'email', 'nomorTelefon', 'cawangan',
        'jenisPermohonan', 'items', 'itemsData', 'tarikhMulaPinjam',
        'tarikhPulang', 'tujuan', 'status', 'catatan', 'createdAt'
    ];

    // Kategori headers
    const kategoriHeaders = ['__backendId', 'namaKategori', 'createdAt'];

    // Peralatan headers
    const peralatanHeaders = ['__backendId', 'kategori', 'namaPeralatan', 'kuantiti', 'createdAt'];

    // Create/update sheets
    createOrUpdateSheet(ss, SHEET_NAMES.permohonan, permohonanHeaders);
    createOrUpdateSheet(ss, SHEET_NAMES.kategori, kategoriHeaders);
    createOrUpdateSheet(ss, SHEET_NAMES.peralatan, peralatanHeaders);

    return 'Sheets initialized successfully!';
}

function createOrUpdateSheet(ss, sheetName, headers) {
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
        sheet = ss.insertSheet(sheetName);
    }

    // Set headers
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Format header row
    sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#4f46e5')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
}
