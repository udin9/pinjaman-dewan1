# 📊 Panduan Setup Google Sheets sebagai Database

## Langkah 1: Buat Google Spreadsheet

1. Pergi ke [Google Sheets](https://sheets.google.com)
2. Klik **"Blank"** untuk buat spreadsheet baru
3. Namakan spreadsheet: **"Database Dewan Sri Kinabatangan"**

### Buat 3 Sheet dengan nama berikut:
- **Permohonan** (rename Sheet1)
- **Kategori** (tambah sheet baru)
- **Peralatan** (tambah sheet baru)

### Header untuk setiap Sheet:

#### Sheet: Permohonan
Baris 1, masukkan header ini:
```
__backendId | nama | email | nomorTelefon | cawangan | jenisPermohonan | items | itemsData | tarikhMulaPinjam | tarikhPulang | tujuan | status | catatan | createdAt
```

#### Sheet: Kategori
Baris 1, masukkan header ini:
```
__backendId | namaKategori | createdAt
```

#### Sheet: Peralatan
Baris 1, masukkan header ini:
```
__backendId | kategori | namaPeralatan | kuantiti | createdAt
```

---

## Langkah 2: Setup Google Apps Script

1. Dalam Google Spreadsheet anda, klik **Extensions > Apps Script**
2. Padam semua kod sedia ada
3. Copy dan paste kod dari fail `google-apps-script.js` yang disediakan
4. Klik **Save** (Ctrl+S)
5. Namakan projek: **"Dewan API"**

---

## Langkah 3: Deploy sebagai Web App

1. Dalam Apps Script, klik **Deploy > New deployment**
2. Klik ikon gear ⚙️ di sebelah "Select type", pilih **Web app**
3. Tetapan:
   - **Description**: Dewan Database API
   - **Execute as**: Me
   - **Who has access**: **Anyone** (PENTING!)
4. Klik **Deploy**
5. **SIMPAN URL** yang diberikan! Contoh:
   ```
   https://script.google.com/macros/s/AKfycbxxxxxxxxxx/exec
   ```

---

## Langkah 4: Masukkan URL ke Portal

1. Buka fail `script.js`
2. Cari baris `GOOGLE_SCRIPT_URL`
3. Gantikan dengan URL deployment anda:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
   ```

---

## Langkah 5: Test Sambungan

1. Buka portal web anda
2. Buka Console (F12 > Console)
3. Taip: `GoogleSheetsDB.testConnection()`
4. Jika berjaya, anda akan lihat: ✅ Google Sheets Connected!

---

## 🔧 Troubleshooting

### Error: "Authorization required"
- Pastikan anda deploy dengan "Who has access: Anyone"
- Cuba deploy semula

### Error: "Script function not found"
- Pastikan kod Apps Script sudah disimpan
- Deploy semula selepas setiap perubahan kod

### Data tidak muncul di Sheets
- Semak nama sheet betul (case-sensitive): Permohonan, Kategori, Peralatan
- Pastikan header row lengkap

---

## 📱 Cara Export Data Sedia Ada ke Google Sheets

Selepas setup selesai, jalankan arahan ini dalam Console:
```javascript
GoogleSheetsDB.exportLocalToSheets()
```

Ini akan export semua data dari localStorage ke Google Sheets.

---

## 🔄 Sync Mode

Portal ini menggunakan **Hybrid Sync**:
- Data disimpan di **localStorage** (untuk offline/cepat)
- Auto-sync ke **Google Sheets** (untuk backup/share)
- Bila refresh, data akan dimuat dari Google Sheets

