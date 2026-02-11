/* ==========================================
   LOGIKA STEP 1: DATA PRIBADI
   ========================================== */

function saveStep1() {
    const genderEl = document.querySelector('input[name="jenis_kelamin"]:checked');
    const fields = ['nama_lengkap', 'nik', 'no_kta', 'alamat', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kab_kota', 'pekerjaan', 'kontak'];
    
    let dataStep1 = {
        jenis_kelamin: genderEl ? genderEl.value : ''
    };

    fields.forEach(f => {
        const el = document.getElementById(f);
        dataStep1[f] = el ? el.value.trim() : '';
    });

    // Validasi Mandatory: Semua harus diisi atau diisi "-"
    const isMissing = fields.some(f => !dataStep1[f]) || !dataStep1.jenis_kelamin;

    if (isMissing) {
        alert("Semua kolom wajib diisi! Jika tidak ada, isi dengan tanda minus (-)");
        return;
    }

    let existing = JSON.parse(localStorage.getItem('kaderData')) || {};
    localStorage.setItem('kaderData', JSON.stringify({ ...existing, ...dataStep1 }));
    
    window.location.href = 'step2.html';
}

// Handler Foto Selfie
document.getElementById('photoInput')?.addEventListener('change', function(e) {
    const reader = new FileReader();
    reader.onload = function() {
        const preview = document.getElementById('photoPreview');
        if(preview) preview.innerHTML = `<img src="${reader.result}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        
        let existing = JSON.parse(localStorage.getItem('kaderData')) || {};
        existing.foto = reader.result;
        localStorage.setItem('kaderData', JSON.stringify(existing));
    }
    if (e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
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

function addJabatanPartai() {
    const tingkat = document.getElementById('tingkatan_partai').value;
    const jabatan = document.getElementById('jabatan_partai').value;
    const periode = document.getElementById('periode_partai').value.trim();
    let bidang = "";

    // Cek jika butuh bidang
    if (jabatan === 'Wakil Ketua' || jabatan === 'Wakil Sekretaris') {
        bidang = document.getElementById('bidang_jabatan').value.trim();
        if (!bidang) {
            alert("Harap isi bidang jabatan!");
            return;
        }
    }

    if (!tingkat || !jabatan || !periode) {
        alert("Lengkapi data jabatan partai!");
        return;
    }

    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let listJabatan = data.riwayat_jabatan_partai || [];

    listJabatan.push({ 
        tingkat, 
        jabatan: bidang ? `${jabatan} ${bidang}` : jabatan, 
        periode 
    });

    data.riwayat_jabatan_partai = listJabatan;
    localStorage.setItem('kaderData', JSON.stringify(data));

    // Reset Form
    document.getElementById('tingkatan_partai').value = '';
    document.getElementById('jabatan_partai').value = '';
    document.getElementById('periode_partai').value = '';
    document.getElementById('bidang_jabatan').value = '';
    document.getElementById('wrap_bidang').style.display = 'none';

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
                <div style="font-size: 13px; font-weight: 700; color: #1e293b;">${item.jabatan}</div>
                <div style="font-size: 11px; color: #b91c1c; font-weight:600;">${item.tingkat}</div>
                <div style="font-size: 11px; color: #64748b;">Periode: ${item.periode}</div>
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

// 1. Fungsi Memuat Data ke Halaman Review
function loadRekap() {
    const data = JSON.parse(localStorage.getItem('kaderData')) || {};
    
    // Render Foto
    const fotoContainer = document.getElementById('fotoPreviewRekap');
    if (fotoContainer && data.foto) {
        fotoContainer.innerHTML = `<img src="${data.foto}" style="width:100px; height:100px; border-radius:50%; object-fit:cover; border:3px solid var(--primary-color);">`;
    }

    // Render Pribadi
    const rekapPribadi = document.getElementById('rekapPribadi');
    if (rekapPribadi) {
        rekapPribadi.innerHTML = `
            <div class="rekap-item"><div class="rekap-label">Nama</div><div class="rekap-value">${data.nama_lengkap || '-'}</div></div>
            <div class="rekap-item"><div class="rekap-label">NIK</div><div class="rekap-value">${data.nik || '-'}</div></div>
            <div class="rekap-item"><div class="rekap-label">Alamat</div><div class="rekap-value">${data.alamat || '-'}, RT ${data.rt}/RW ${data.rw}, ${data.kecamatan}</div></div>
        `;
    }

    // Render Pendidikan
    const rekapEdu = document.getElementById('rekapPendidikan');
    if (rekapEdu) {
        rekapEdu.innerHTML = data.riwayat_pendidikan?.map(e => `
            <div class="rekap-item">
                <div class="rekap-label">${e.jenjang}</div>
                <div class="rekap-value">${e.nama} (${e.tahun})</div>
            </div>
        `).join('') || '<p style="font-size:12px;color:gray;">Tidak ada data pendidikan formal</p>';
    }

    // Render Medsos & Skill
    const rekapMedsos = document.getElementById('rekapMedsos');
    const medsos = data.media_sosial || {};
    if (rekapMedsos) {
        rekapMedsos.innerHTML = `
            <div class="rekap-item"><div class="rekap-label">Bahasa</div><div class="rekap-value">${data.kompetensi_bahasa || '-'}</div></div>
            <div class="rekap-item"><div class="rekap-label">WhatsApp</div><div class="rekap-value">${data.kontak || '-'}</div></div>
            <div class="rekap-item"><div class="rekap-label">Medsos</div><div class="rekap-value" style="font-size:12px;">IG: ${medsos.instagram || '-'}<br>TikTok: ${medsos.tiktok || '-'}</div></div>
        `;
    }
}

// 2. Fungsi Kirim Data ke Google Sheets
async function submitSeluruhData() {
    const data = JSON.parse(localStorage.getItem('kaderData'));
    const btn = document.getElementById('btnSubmit');
    
    if(!data) return alert("Data kosong!");

    btn.disabled = true;
    btn.innerHTML = "⏳ Sedang Mengirim...";
    
    // GANTI DENGAN URL APPS SCRIPT BOS
    const URL_API = 'URL_PUNYA_BOS_DI_SINI'; 

    try {
        // Gunakan fetch dengan mode no-cors untuk Google Apps Script
        await fetch(URL_API, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        alert("MERDEKA! Data Kader Berhasil Terkirim ke Pusat.");
        localStorage.clear();
        window.location.href = 'finish.html';
    } catch (e) {
        console.error(e);
        alert("Waduh, gagal kirim. Cek koneksi internet Bos.");
        btn.disabled = false;
        btn.innerHTML = "KIRIM DATA SEKARANG";
    }
}
