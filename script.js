/* ==========================================
    LOGIKA STEP 1: DATA PRIBADI (SULTAN EDITION)
   ========================================== */

function saveStep1() {
    // 1. Ambil elemen gender
    const genderEl = document.querySelector('input[name="jenis_kelamin"]:checked');
    
    // 2. Daftar ID field sesuai HTML
    const fields = ['nama_lengkap', 'nik', 'no_kta', 'alamat', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kab_kota', 'pekerjaan', 'kontak'];
    
    let dataStep1 = {
        jenis_kelamin: genderEl ? genderEl.value : ''
    };

    // 3. Loop ambil nilai
    fields.forEach(f => {
        const el = document.getElementById(f);
        dataStep1[f] = el ? el.value.trim() : '';
    });

    // 4. Validasi Premium
    const isMissing = fields.some(f => !dataStep1[f]) || !dataStep1.jenis_kelamin;
    if (isMissing) {
        // Efek goyang (shake) pada tombol jika gagal bisa ditambah nanti, sementara alert premium:
        alert("⚠️ Instruksi: Semua kolom wajib diisi. Gunakan (-) jika tidak ada data.");
        return;
    }

    // 5. MERGE DATA (Agar Foto tidak hilang)
    // Kita ambil data lama (mungkin sudah ada foto dari handler di bawah)
    let existing = JSON.parse(localStorage.getItem('kaderData')) || {};
    
    // Gabungkan: Data Lama + Data Baru dari Step 1
    const finalData = { ...existing, ...dataStep1 };
    
    localStorage.setItem('kaderData', JSON.stringify(finalData));
    
    // 6. Transisi Halus ke Step 2
    window.location.href = 'step2.html';
}

/* ==========================================
    HANDLER FOTO SELFIE (PREMIUM PREVIEW)
   ========================================== */
document.getElementById('photoInput')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi Ukuran (Opsional tapi disarankan agar localStorage tidak penuh)
    if (file.size > 2 * 1024 * 1024) { // 2MB
        alert("Ukuran foto terlalu besar, maksimal 2MB ya Bos.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function() {
        const preview = document.getElementById('photoPreview');
        if(preview) {
            // Styling preview agar sesuai dengan class .photo-preview di CSS Luxury
            preview.innerHTML = `<img src="${reader.result}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            preview.style.border = "3px solid var(--primary-red)";
        }
        
        // Simpan foto ke localStorage secara instan
        let existing = JSON.parse(localStorage.getItem('kaderData')) || {};
        existing.foto = reader.result;
        localStorage.setItem('kaderData', JSON.stringify(existing));
    }
    reader.readAsDataURL(file);
});

/* ==========================================
    AUTO-LOAD DATA (Jika user klik Back)
   ========================================== */
window.addEventListener('DOMContentLoaded', () => {
    // Jika user balik lagi ke Step 1, isi otomatis field yang sudah pernah diisi
    const savedData = JSON.parse(localStorage.getItem('kaderData'));
    if (savedData) {
        if (savedData.nama_lengkap) document.getElementById('nama_lengkap').value = savedData.nama_lengkap;
        if (savedData.nik) document.getElementById('nik').value = savedData.nik;
        if (savedData.no_kta) document.getElementById('no_kta').value = savedData.no_kta;
        if (savedData.alamat) document.getElementById('alamat').value = savedData.alamat;
        if (savedData.rt) document.getElementById('rt').value = savedData.rt;
        if (savedData.rw) document.getElementById('rw').value = savedData.rw;
        if (savedData.kelurahan) document.getElementById('kelurahan').value = savedData.kelurahan;
        if (savedData.kecamatan) document.getElementById('kecamatan').value = savedData.kecamatan;
        if (savedData.kab_kota) document.getElementById('kab_kota').value = savedData.kab_kota;
        if (savedData.pekerjaan) document.getElementById('pekerjaan').value = savedData.pekerjaan;
        if (savedData.kontak) document.getElementById('kontak').value = savedData.kontak;
        
        // Load Gender
        if (savedData.jenis_kelamin) {
            const radio = document.querySelector(`input[name="jenis_kelamin"][value="${savedData.jenis_kelamin}"]`);
            if (radio) radio.checked = true;
        }

        // Load Foto Preview
        if (savedData.foto) {
            const preview = document.getElementById('photoPreview');
            if (preview) preview.innerHTML = `<img src="${savedData.foto}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        }
    }
});

/* ==========================================
   LOGIKA STEP 2: PENDIDIKAN FORMAL
   ========================================== */

function toggleExtraFields() {
    const jenjang = document.getElementById('jenjang').value;
    const ptJenjangs = ['D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3'];
    
    // Tampilkan field SMA/SMK
    const wrapSma = document.getElementById('wrap_sma');
    if(wrapSma) wrapSma.style.display = (jenjang === 'SMA/SMK') ? 'block' : 'none';
    
    // Tampilkan field Perguruan Tinggi
    const wrapPt = document.getElementById('wrap_pt');
    if(wrapPt) wrapPt.style.display = ptJenjangs.includes(jenjang) ? 'block' : 'none';
    
    // Sembunyikan input nama sekolah biasa jika sedang input PT
    const inputNamaSekolahBiasa = document.getElementById('nama_sekolah')?.parentElement;
    if(inputNamaSekolahBiasa) {
        inputNamaSekolahBiasa.style.display = ptJenjangs.includes(jenjang) ? 'none' : 'block';
    }
}

function addPendidikan() {
    const jenjang = document.getElementById('jenjang').value;
    const kota = document.getElementById('kota_sekolah').value.trim();
    const tahun = document.getElementById('tahun_lulus').value.trim();
    const ptJenjangs = ['D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3'];
    
    let namaFinal = "";
    let infoTambahan = "";

    if (ptJenjangs.includes(jenjang)) {
        // Logika Perguruan Tinggi (Urutan: Kampus -> Fakultas -> Jurusan -> Status)
        namaFinal = document.getElementById('nama_pt').value.trim();
        const fak = document.getElementById('fakultas').value.trim();
        const jurPt = document.getElementById('jurusan_pt').value.trim() || "-";
        const status = document.getElementById('status_kelulusan').value;

        if (!namaFinal || !fak) { alert("Nama Perguruan Tinggi & Fakultas wajib diisi!"); return; }
        infoTambahan = `Fak: ${fak}, Jur: ${jurPt} (${status})`;
    } else {
        // Logika Sekolah Biasa (SD, SMP, SMA)
        namaFinal = document.getElementById('nama_sekolah').value.trim();
        if (jenjang === 'SMA/SMK') {
            let jurSma = document.getElementById('jurusan_sma').value;
            if (jurSma === 'Lainnya') jurSma = document.getElementById('jurusan_lainnya').value.trim();
            if (!jurSma) { alert("Jurusan SMA wajib diisi!"); return; }
            infoTambahan = "Jurusan: " + jurSma;
        }
    }

    if (!jenjang || !namaFinal || !kota || !tahun) {
        alert("Mohon lengkapi semua data pendidikan!");
        return;
    }

    let existingData = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = existingData.riwayat_pendidikan || [];

    list.push({ jenjang, nama: namaFinal, kota, tahun, info: infoTambahan });
    existingData.riwayat_pendidikan = list;
    localStorage.setItem('kaderData', JSON.stringify(existingData));

    // Reset dan Refresh tampilan
    renderPendidikan();
    if(document.getElementById('jenjang')) {
        // Reset manual atau reload halaman untuk membersihkan field dinamis
        window.location.reload(); 
    }
}

function renderPendidikan() {
    const container = document.getElementById('pendidikanList');
    if(!container) return;

    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data.riwayat_pendidikan || [];

    if (list.length === 0) {
        container.innerHTML = '<p style="font-size: 12px; color: #94a3b8; text-align: center;">Belum ada riwayat pendidikan.</p>';
        return;
    }

    container.innerHTML = list.map((item, index) => `
        <div style="background: #f8fafc; padding: 12px; border-radius: 10px; margin-bottom: 8px; border-left: 4px solid var(--primary-color); display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
                <div style="font-size: 13px; font-weight: 700;">${item.jenjang}: ${item.nama}</div>
                <div style="font-size: 11px; color: #4b5563; line-height:1.4;">${item.info}</div>
                <div style="font-size: 11px; color: #64748b;">${item.kota} | Lulus: ${item.tahun}</div>
            </div>
            <button onclick="deletePendidikan(${index})" style="background: none; border: none; color: #ef4444; font-size: 20px; padding-left: 10px; cursor:pointer;">&times;</button>
        </div>
    `).join('');
}

function deletePendidikan(index) {
    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    data.riwayat_pendidikan.splice(index, 1);
    localStorage.setItem('kaderData', JSON.stringify(data));
    renderPendidikan();
}

/* ==========================================
   AUTO-LOAD DATA SAAT HALAMAN DIBUKA
   ========================================== */

window.addEventListener('load', () => {
    let savedData = JSON.parse(localStorage.getItem('kaderData'));
    if (!savedData) return;

    // Load data Step 1 (Jika ada di halaman Step 1)
    const fieldsStep1 = ['nama_lengkap', 'nik', 'no_kta', 'alamat', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kab_kota', 'pekerjaan', 'kontak'];
    fieldsStep1.forEach(f => {
        const el = document.getElementById(f);
        if (el && savedData[f]) el.value = savedData[f];
    });

    if (savedData.jenis_kelamin) {
        const radio = document.querySelector(`input[name="jenis_kelamin"][value="${savedData.jenis_kelamin}"]`);
        if (radio) radio.checked = true;
    }

    if (savedData.foto && document.getElementById('photoPreview')) {
        document.getElementById('photoPreview').innerHTML = `<img src="${savedData.foto}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
    }

    // Load data Step 2 (Jika ada di halaman Step 2)
    renderPendidikan();
});

/* ==========================================
   LOGIKA STEP 3: PENDIDIKAN KADER
   ========================================== */

function addPendidikanKader() {
    const jenis = document.getElementById('jenis_kader').value;
    const penyelenggara = document.getElementById('penyelenggara').value.trim();
    const tahun = document.getElementById('tahun_kader').value.trim();

    if (!jenis || !penyelenggara || !tahun) {
        alert("Mohon isi semua data pendidikan kader! Jika belum pernah, bisa dilewati atau isi tanda (-)");
        return;
    }

    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let listKader = data.riwayat_kader || [];

    listKader.push({ jenis, penyelenggara, tahun });
    data.riwayat_kader = listKader;
    localStorage.setItem('kaderData', JSON.stringify(data));

    // Reset Form
    document.getElementById('jenis_kader').value = '';
    document.getElementById('penyelenggara').value = '';
    document.getElementById('tahun_kader').value = '';

    renderKader();
}

function renderKader() {
    const container = document.getElementById('kaderList');
    if(!container) return;

    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data.riwayat_kader || [];

    if (list.length === 0) {
        container.innerHTML = '<p style="font-size: 12px; color: #94a3b8; text-align: center;">Belum ada riwayat pendidikan kader.</p>';
        return;
    }

    container.innerHTML = list.map((item, index) => `
        <div style="background: #fff5f5; padding: 12px; border-radius: 10px; margin-bottom: 8px; border-left: 4px solid var(--primary-color); display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
                <div style="font-size: 13px; font-weight: 700; color: var(--primary-color);">Kader ${item.jenis}</div>
                <div style="font-size: 11px; color: #4b5563;">Penyelenggara: ${item.penyelenggara}</div>
                <div style="font-size: 11px; color: #64748b;">Tahun: ${item.tahun}</div>
            </div>
            <button onclick="deleteKader(${index})" style="background: none; border: none; color: #ef4444; font-size: 20px; cursor:pointer;">&times;</button>
        </div>
    `).join('');
}

function deleteKader(index) {
    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    data.riwayat_kader.splice(index, 1);
    localStorage.setItem('kaderData', JSON.stringify(data));
    renderKader();
}

/* ==========================================
   LOGIKA STEP 4: JABATAN PARTAI
   ========================================== */

/* ==========================================
    LOGIKA STEP 4: JABATAN PARTAI (FIXED)
   ========================================== */

function addJabatanPartai() {
    // 1. Ambil value dari form
    const tingkatanTerpilih = document.getElementById('tingkatan_partai').value; 
    const jabatan = document.getElementById('jabatan_partai').value;
    const periode = document.getElementById('periode_partai').value.trim();
    let bidang = "";

    // 2. Tambah Lokasi via Prompt (Agar 📍 di rekap tidak kosong)
    const lokasi = prompt("Sebutkan Wilayah (Contoh: DPC Kota Surabaya / PAC Tegalsari):") || "-";

    // 3. Logika Bidang untuk Wakil Ketua/Sekretaris
    if (jabatan === 'Wakil Ketua' || jabatan === 'Wakil Sekretaris') {
        bidang = document.getElementById('bidang_jabatan').value.trim();
        if (!bidang) {
            alert("Harap isi bidang jabatan!");
            return;
        }
    }

    if (!tingkatanTerpilih || !jabatan || !periode) {
        alert("Lengkapi data jabatan partai!");
        return;
    }

    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    if (!data.riwayat_jabatan_partai) data.riwayat_jabatan_partai = [];

    // 4. SIMPAN DENGAN KEY 'tingkatan' & 'lokasi'
    data.riwayat_jabatan_partai.push({ 
        tingkatan: tingkatanTerpilih, 
        jabatan: jabatan,
        bidang: bidang,
        lokasi: lokasi,
        periode: periode 
    });

    localStorage.setItem('kaderData', JSON.stringify(data));

    // 5. Reset Form
    document.getElementById('tingkatan_partai').value = '';
    document.getElementById('jabatan_partai').value = '';
    document.getElementById('periode_partai').value = '';
    if(document.getElementById('bidang_jabatan')) document.getElementById('bidang_jabatan').value = '';
    if(document.getElementById('wrap_bidang')) document.getElementById('wrap_bidang').style.display = 'none';

    renderJabatan();
}

function renderJabatan() {
    const container = document.getElementById('jabatanList');
    if(!container) return;

    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data.riwayat_jabatan_partai || [];

    if (list.length === 0) {
        container.innerHTML = '<p style="font-size: 12px; color: #94a3b8; text-align: center;">Belum ada riwayat jabatan partai.</p>';
        return;
    }

    container.innerHTML = list.map((item, index) => `
        <div style="background: #fff; padding: 12px; border-radius: 10px; margin-bottom: 8px; border-left: 4px solid #b91c1c; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
                <div style="font-size: 13px; font-weight: 700; color: #1e293b;">${item.jabatan} ${item.bidang ? '- ' + item.bidang : ''}</div>
                <div style="font-size: 11px; color: #b91c1c; font-weight:600; text-transform: uppercase;">${item.tingkatan}</div>
                <div style="font-size: 11px; color: #64748b;">📍 ${item.lokasi} | Periode: ${item.periode}</div>
            </div>
            <button onclick="deleteJabatanPartai(${index})" style="background: none; border: none; color: #ef4444; font-size: 20px; cursor:pointer;">&times;</button>
        </div>
    `).join('');
}

function deleteJabatanPartai(index) {
    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    data.riwayat_jabatan_partai.splice(index, 1);
    localStorage.setItem('kaderData', JSON.stringify(data));
    renderJabatan();
}

/* ==========================================
   LOGIKA STEP 5: RIWAYAT PEKERJAAN
   ========================================== */

function addPekerjaan() {
    const perusahaan = document.getElementById('nama_perusahaan').value.trim();
    const jabatan = document.getElementById('jabatan_kerja').value.trim();
    const masa = document.getElementById('masa_kerja').value.trim();

    if (!perusahaan || !jabatan || !masa) {
        alert("Lengkapi data pekerjaan! Jika tidak ada, isi dengan tanda (-)");
        return;
    }

    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let listPekerjaan = data.riwayat_pekerjaan || [];

    listPekerjaan.push({ perusahaan, jabatan, masa });
    data.riwayat_pekerjaan = listPekerjaan;
    localStorage.setItem('kaderData', JSON.stringify(data));

    // Reset Form
    document.getElementById('nama_perusahaan').value = '';
    document.getElementById('jabatan_kerja').value = '';
    document.getElementById('masa_kerja').value = '';

    renderPekerjaan();
}

function renderPekerjaan() {
    const container = document.getElementById('pekerjaanList');
    if(!container) return;

    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data.riwayat_pekerjaan || [];

    if (list.length === 0) {
        container.innerHTML = '<p style="font-size: 12px; color: #94a3b8; text-align: center;">Belum ada riwayat pekerjaan.</p>';
        return;
    }

    container.innerHTML = list.map((item, index) => `
        <div style="background: #f1f5f9; padding: 12px; border-radius: 10px; margin-bottom: 8px; border-left: 4px solid #475569; display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
                <div style="font-size: 13px; font-weight: 700; color: #1e293b;">${item.perusahaan}</div>
                <div style="font-size: 11px; color: #475569;">Jabatan: ${item.jabatan}</div>
                <div style="font-size: 11px; color: #64748b;">Masa: ${item.masa}</div>
            </div>
            <button onclick="deletePekerjaan(${index})" style="background: none; border: none; color: #ef4444; font-size: 20px; cursor:pointer;">&times;</button>
        </div>
    `).join('');
}

function deletePekerjaan(index) {
    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    data.riwayat_pekerjaan.splice(index, 1);
    localStorage.setItem('kaderData', JSON.stringify(data));
    renderPekerjaan();
}

/* ==========================================
   LOGIKA STEP 6: ORGANISASI & FINAL SUBMIT
   ========================================== */

function addOrganisasi() {
    const nama = document.getElementById('org_nama').value.trim();
    const jabatan = document.getElementById('org_jabatan').value.trim();
    const periode = document.getElementById('org_periode').value.trim();

    if (!nama || !jabatan || !periode) {
        alert("Lengkapi data organisasi!");
        return;
    }

    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data.riwayat_organisasi || [];
    list.push({ nama, jabatan, periode });
    data.riwayat_organisasi = list;
    localStorage.setItem('kaderData', JSON.stringify(data));

    document.getElementById('org_nama').value = '';
    document.getElementById('org_jabatan').value = '';
    document.getElementById('org_periode').value = '';
    renderOrganisasi();
}

function renderOrganisasi() {
    const container = document.getElementById('orgList');
    if(!container) return;
    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data.riwayat_organisasi || [];

    container.innerHTML = list.map((item, index) => `
        <div style="background: #f8fafc; padding: 10px; border-radius: 8px; margin-top: 8px; border-left: 3px solid #64748b; display: flex; justify-content: space-between;">
            <div style="font-size: 12px;"><b>${item.nama}</b> - ${item.jabatan} (${item.periode})</div>
            <button onclick="deleteOrg(${index})" style="color:red; border:none; background:none;">&times;</button>
        </div>
    `).join('');
}

function deleteOrg(index) {
    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    data.riwayat_organisasi.splice(index, 1);
    localStorage.setItem('kaderData', JSON.stringify(data));
    renderOrganisasi();
}

/* ==========================================
   LOGIKA STEP 6: SIMPAN & LANJUT KE REKAP
   ========================================== */

function goToReview() {
    let data = JSON.parse(localStorage.getItem('kaderData')) || {};

    // 1. Ambil Kompetensi Bahasa
    const checkboxes = document.querySelectorAll('input[name="bahasa"]:checked');
    let bahasaList = Array.from(checkboxes).map(cb => cb.value);
    const lainnya = document.getElementById('bahasa_lainnya').value.trim();
    if(lainnya) bahasaList.push(lainnya);

    // 2. Simpan Kompetensi
    data.kompetensi_bahasa = bahasaList.length > 0 ? bahasaList.join(', ') : '-';
    data.kemampuan_komputer = document.getElementById('komputer').value;

    // 3. Ambil Semua Akun Medsos
    data.media_sosial = {
        facebook: document.getElementById('medsos_fb').value.trim() || '-',
        instagram: document.getElementById('medsos_ig').value.trim() || '-',
        tiktok: document.getElementById('medsos_tiktok').value.trim() || '-',
        twitter_x: document.getElementById('medsos_twitter').value.trim() || '-',
        youtube: document.getElementById('medsos_youtube').value.trim() || '-',
        linkedin: document.getElementById('medsos_linkedin').value.trim() || '-'
    };

    // 4. Update LocalStorage
    localStorage.setItem('kaderData', JSON.stringify(data));

    // 5. Lempar ke Halaman Rekap (Slider)
    window.location.href = 'rekap.html';
}

/* ==========================================
    1. FUNGSI MEMUAT DATA KE HALAMAN REVIEW
   ========================================== */
function loadRekap() {
    console.log("Memulai proses rekap data..."); 
    const data = JSON.parse(localStorage.getItem('kaderData'));
    
    if (!data) {
        console.warn("Data tidak ditemukan di penyimpanan lokal!");
        return;
    }

    // --- 1. RENDER FOTO (Premium Style) ---
    const fotoContainer = document.getElementById('fotoPreviewRekap');
    if (fotoContainer) {
        fotoContainer.innerHTML = data.foto 
            ? `<img src="${data.foto}" style="width:120px; height:120px; border-radius:50%; object-fit:cover; border:4px solid var(--primary-red, #b91c1c); box-shadow: 0 4px 15px rgba(0,0,0,0.3);">`
            : `<div style="width:100px; height:100px; background:#ddd; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:auto; color:#666;">No Photo</div>`;
    }

    // --- 2. RENDER DATA PRIBADI (Tetap Mewah) ---
    const rekapPribadi = document.getElementById('rekapPribadi');
    if (rekapPribadi) {
        rekapPribadi.innerHTML = `
            <div class="rekap-item"><div class="rekap-label">Nama Lengkap</div><div class="rekap-value">${data.nama_lengkap || '-'}</div></div>
            <div class="rekap-item"><div class="rekap-label">NIK</div><div class="rekap-value">${data.nik || '-'}</div></div>
            <div class="rekap-item"><div class="rekap-label">No. KTA</div><div class="rekap-value">${data.no_kta || '-'}</div></div>
            <div class="rekap-item"><div class="rekap-label">WhatsApp</div><div class="rekap-value">${data.kontak || '-'}</div></div>
            <div class="rekap-item"><div class="rekap-label">Alamat</div><div class="rekap-value">${data.alamat || '-'}, RT ${data.rt}/RW ${data.rw}, ${data.kelurahan}, ${data.kecamatan}, ${data.kab_kota}</div></div>
            <div class="rekap-item"><div class="rekap-label">Pekerjaan</div><div class="rekap-value">${data.pekerjaan || '-'}</div></div>
        `;
    }

    // --- 3. RENDER JABATAN PARTAI ---
    const rekapJabatan = document.getElementById('rekapJabatanPartai');
    if (rekapJabatan) {
        const listJabatan = data.riwayat_jabatan_partai || [];
        rekapJabatan.innerHTML = listJabatan.length > 0 
            ? listJabatan.map(j => `
                <div style="background:#fff; border-left:4px solid var(--primary-red, #b91c1c); padding:12px; margin-bottom:10px; border-radius:8px; box-shadow:0 3px 6px rgba(0,0,0,0.1);">
                    <div style="font-size:10px; color:var(--primary-red, #b91c1c); font-weight:bold; text-transform:uppercase;">${j.tingkatan}</div>
                    <div style="font-weight:bold; font-size:14px; color:#1e293b; margin:2px 0;">${j.jabatan} ${j.bidang ? '- ' + j.bidang : ''}</div>
                    <div style="font-size:11px; color:#64748b;">📍 ${j.lokasi} | Periode: ${j.periode}</div>
                </div>
            `).join('')
            : '<p style="color:gray; font-size:12px; text-align:center; padding:10px;">Tidak ada riwayat jabatan partai</p>';
    }

    // --- 4. RENDER PENDIDIKAN FORMAL ---
    const rekapEdu = document.getElementById('rekapPendidikan');
    if (rekapEdu) {
        const listEdu = data.riwayat_pendidikan || [];
        rekapEdu.innerHTML = listEdu.length > 0 
            ? listEdu.map(e => `
                <div class="rekap-item">
                    <div class="rekap-label">${e.jenjang}</div>
                    <div class="rekap-value"><b>${e.nama}</b><br><small>${e.info || ''} (Lulus: ${e.tahun})</small></div>
                </div>`).join('')
            : '<p style="color:gray; font-size:12px; text-align:center;">Data pendidikan kosong</p>';
    }

    // --- 5. RENDER PENUGASAN PARTAI (Ditambahkan agar sinkron) ---
    const rekapTugas = document.getElementById('rekapPenugasan');
    if (rekapTugas) {
        const listTugas = data.riwayat_penugasan_partai || [];
        rekapTugas.innerHTML = listTugas.length > 0 
            ? listTugas.map(t => `
                <div class="rekap-item">
                    <div class="rekap-label">${t.jenis}</div>
                    <div class="rekap-value"><b>${t.jabatan}</b><br><small>${t.lokasi} (${t.periode})</small></div>
                </div>`).join('')
            : '<p style="color:gray; font-size:12px; text-align:center;">Tidak ada riwayat penugasan</p>';
    }

    // --- 6. RENDER MEDSOS & SKILL ---
    const rekapMedsos = document.getElementById('rekapMedsos');
    if (rekapMedsos) {
        const m = data.media_sosial || {};
        rekapMedsos.innerHTML = `
            <div class="rekap-item"><div class="rekap-label">Bahasa</div><div class="rekap-value">${data.kompetensi_bahasa || '-'}</div></div>
            <div class="rekap-item"><div class="rekap-label">Komputer</div><div class="rekap-value">${data.kemampuan_komputer || '-'}</div></div>
            <div class="rekap-item"><div class="rekap-label">Instagram</div><div class="rekap-value">${m.instagram || '-'}</div></div>
            <div class="rekap-item"><div class="rekap-label">TikTok</div><div class="rekap-value">${m.tiktok || '-'}</div></div>
        `;
    }
}

/* ==========================================
    2. FUNGSI KIRIM DATA KE GOOGLE SHEETS
   ========================================== */
async function submitSeluruhData() {
    const data = JSON.parse(localStorage.getItem('kaderData'));
    if(!data) return alert("Data tidak ditemukan!");

    const btn = document.getElementById('btnSubmit');
    const originalText = btn.innerHTML;

    if(!confirm("Apakah data sudah benar? Data akan dikirim ke basis data pusat.")) return;

    btn.disabled = true;
    btn.innerHTML = "⏳ Mengirim ke Pusat...";

    const URL_API = 'URL_PUNYA_BOS_DI_SINI'; 

    try {
        await fetch(URL_API, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        alert("MERDEKA! Data Kader Berhasil Terkirim.");
        localStorage.removeItem('kaderData');
        window.location.href = 'finish.html';
    } catch (e) {
        console.error(e);
        alert("Gagal kirim! Cek koneksi internet Bos.");
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

/* ==========================================
    3. FUNGSI SKIN & TEMA
   ========================================== */
function applySkin(themeData) {
    const root = document.documentElement;
    if(themeData.mainColor) root.style.setProperty('--primary-red', themeData.mainColor);
    if(themeData.borderRadius) root.style.setProperty('--radius-premium', themeData.borderRadius + 'px');
    localStorage.setItem('preferredSkin', JSON.stringify(themeData));
}

/* ==========================================
    4. LOGIKA PENUGASAN PARTAI
   ========================================== */
function addPenugasanPartai() {
    const jenis = document.getElementById('tugas_jenis').value;
    const lembaga = document.getElementById('tugas_lembaga')?.value || '';
    const jabatan = document.getElementById('tugas_jabatan').value;
    const lokasi = document.getElementById('tugas_lokasi').value;
    const periode = document.getElementById('tugas_periode').value;

    if (!jenis || !jabatan) return alert("Minimal jenis dan jabatan diisi!");

    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    if (!data.riwayat_penugasan_partai) data.riwayat_penugasan_partai = [];

    data.riwayat_penugasan_partai.push({
        jenis, lembaga, jabatan, lokasi, periode
    });

    localStorage.setItem('kaderData', JSON.stringify(data));
    renderPenugasan();
    
    // Reset Form (Jika ada di halaman pengisian)
    if(document.getElementById('tugas_jabatan')) document.getElementById('tugas_jabatan').value = '';
    if(document.getElementById('tugas_lokasi')) document.getElementById('tugas_lokasi').value = '';
}

function renderPenugasan() {
    const data = JSON.parse(localStorage.getItem('kaderData')) || {};
    const list = document.getElementById('tugasList');
    if (!list) return;
    
    const items = data.riwayat_penugasan_partai || [];
    list.innerHTML = items.map((t, index) => `
        <div class="list-item-rekap" style="display:flex; justify-content:space-between; align-items:center; background:#f1f5f9; padding:8px; margin-bottom:5px; border-radius:5px;">
            <span style="font-size:12px;"><b>${t.jenis}</b>: ${t.jabatan}</span>
            <button onclick="deletePenugasan(${index})" style="border:none; background:none; color:red; cursor:pointer;">❌</button>
        </div>
    `).join('');
}

function deletePenugasan(index) {
    let data = JSON.parse(localStorage.getItem('kaderData'));
    data.riwayat_penugasan_partai.splice(index, 1);
    localStorage.setItem('kaderData', JSON.stringify(data));
    renderPenugasan();
}

/* ==========================================
    5. INISIALISASI SAAT HALAMAN DIBUKA
   ========================================== */
window.addEventListener('DOMContentLoaded', () => {
    // 1. Cek Skin
    const savedSkin = JSON.parse(localStorage.getItem('preferredSkin'));
    if(savedSkin) applySkin(savedSkin);

    // 2. Jalankan loadRekap jika elemen tujuan ada
    if (document.getElementById('rekapPribadi') || document.getElementById('rekapJabatanPartai')) {
        loadRekap();
    }

    // 3. Render list penugasan jika di form input
    if (document.getElementById('tugasList')) {
        renderPenugasan();
    }
});
// Fungsi pembantu agar tidak error jika field tidak lengkap
function safeSet(id, content) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = content;
}
