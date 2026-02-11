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
