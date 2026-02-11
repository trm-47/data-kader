/* ==========================================
   GLOBAL UTILITIES
   ========================================== */
const safeSet = (id, content) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = content;
};

const getLocalData = () => JSON.parse(localStorage.getItem('kaderData')) || {};
const saveLocalData = (data) => localStorage.setItem('kaderData', JSON.stringify(data));

/* ==========================================
   STEP 1: DATA PRIBADI & FOTO
   ========================================== */
function saveStep1() {
    const genderEl = document.querySelector('input[name="jenis_kelamin"]:checked');
    const fields = ['nama_lengkap', 'nik', 'no_kta', 'alamat', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kab_kota', 'pekerjaan', 'kontak'];
    
    let dataStep1 = { jenis_kelamin: genderEl ? genderEl.value : '' };
    fields.forEach(f => {
        const el = document.getElementById(f);
        dataStep1[f] = el ? el.value.trim() : '';
    });

    if (fields.some(f => !dataStep1[f]) || !dataStep1.jenis_kelamin) {
        alert("⚠️ Instruksi: Semua kolom wajib diisi. Gunakan (-) jika tidak ada data.");
        return;
    }

    const existing = getLocalData();
    saveLocalData({ ...existing, ...dataStep1 });
    window.location.href = 'step2.html';
}

// Handler Foto Selfie
document.getElementById('photoInput')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran foto terlalu besar, maksimal 2MB ya Bos.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function() {
        const preview = document.getElementById('photoPreview');
        if(preview) {
            preview.innerHTML = `<img src="${reader.result}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            preview.style.border = "3px solid var(--primary-red, #b91c1c)";
        }
        let data = getLocalData();
        data.foto = reader.result;
        saveLocalData(data);
    }
    reader.readAsDataURL(file);
});

/* ==========================================
   STEP 2: PENDIDIKAN FORMAL
   ========================================== */
function toggleExtraFields() {
    const jenjang = document.getElementById('jenjang').value;
    const ptJenjangs = ['D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3'];
    
    const wrapSma = document.getElementById('wrap_sma');
    const wrapPt = document.getElementById('wrap_pt');
    const wrapNamaSekolah = document.getElementById('nama_sekolah')?.parentElement;

    if(wrapSma) wrapSma.style.display = (jenjang === 'SMA/SMK') ? 'block' : 'none';
    if(wrapPt) wrapPt.style.display = ptJenjangs.includes(jenjang) ? 'block' : 'none';
    if(wrapNamaSekolah) wrapNamaSekolah.style.display = ptJenjangs.includes(jenjang) ? 'none' : 'block';
}

function addPendidikan() {
    const jenjang = document.getElementById('jenjang').value;
    const kota = document.getElementById('kota_sekolah').value.trim();
    const tahun = document.getElementById('tahun_lulus').value.trim();
    const ptJenjangs = ['D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3'];
    
    let namaFinal = "";
    let infoTambahan = "";

    if (ptJenjangs.includes(jenjang)) {
        namaFinal = document.getElementById('nama_pt').value.trim();
        const fak = document.getElementById('fakultas').value.trim();
        const jurPt = document.getElementById('jurusan_pt').value.trim() || "-";
        const status = document.getElementById('status_kelulusan').value;
        if (!namaFinal || !fak) { alert("Nama Perguruan Tinggi & Fakultas wajib diisi!"); return; }
        infoTambahan = `Fak: ${fak}, Jur: ${jurPt} (${status})`;
    } else {
        namaFinal = document.getElementById('nama_sekolah').value.trim();
        if (jenjang === 'SMA/SMK') {
            let jurSma = document.getElementById('jurusan_sma').value;
            if (jurSma === 'Lainnya') jurSma = document.getElementById('jurusan_lainnya').value.trim();
            if (!jurSma) { alert("Jurusan SMA wajib diisi!"); return; }
            infoTambahan = "Jurusan: " + jurSma;
        }
    }

    if (!jenjang || !namaFinal || !kota || !tahun) { alert("Mohon lengkapi data!"); return; }

    let data = getLocalData();
    let list = data.riwayat_pendidikan || [];
    list.push({ jenjang, nama: namaFinal, kota, tahun, info: infoTambahan });
    data.riwayat_pendidikan = list;
    saveLocalData(data);
    renderPendidikan();
}

function renderPendidikan() {
    const container = document.getElementById('pendidikanList');
    if(!container) return;
    const list = getLocalData().riwayat_pendidikan || [];
    container.innerHTML = list.length ? list.map((item, index) => `
        <div class="data-box-premium">
            <div style="flex: 1;">
                <b>${item.jenjang}: ${item.nama}</b>
                <p>${item.info || ''} | ${item.kota} (${item.tahun})</p>
            </div>
            <button onclick="deletePendidikan(${index})" class="btn-del">&times;</button>
        </div>
    `).join('') : '<p class="empty-text">Belum ada riwayat pendidikan.</p>';
}

function deletePendidikan(i) {
    let data = getLocalData();
    data.riwayat_pendidikan.splice(i, 1);
    saveLocalData(data);
    renderPendidikan();
}

/* ==========================================
   STEP 3 & 4: KADERISASI & JABATAN
   ========================================== */
function addJabatanPartai() {
    const tingkatan = document.getElementById('tingkatan_partai').value; 
    const jabatan = document.getElementById('jabatan_partai').value;
    const periode = document.getElementById('periode_partai').value.trim();
    let bidang = (jabatan.includes('Wakil')) ? document.getElementById('bidang_jabatan').value.trim() : "";

    const lokasi = prompt("Sebutkan Wilayah (Contoh: DPC Kota Surabaya / PAC Tegalsari):") || "-";

    if (!tingkatan || !jabatan || !periode) { alert("Lengkapi data!"); return; }

    let data = getLocalData();
    if (!data.riwayat_jabatan_partai) data.riwayat_jabatan_partai = [];
    data.riwayat_jabatan_partai.push({ tingkatan, jabatan, bidang, lokasi, periode });
    saveLocalData(data);
    renderJabatan();
}

function renderJabatan() {
    const container = document.getElementById('jabatanList');
    if(!container) return;
    const list = getLocalData().riwayat_jabatan_partai || [];
    container.innerHTML = list.map((item, index) => `
        <div class="data-box-premium" style="border-left:4px solid var(--primary-red, #b91c1c)">
            <div style="flex: 1;">
                <b>${item.jabatan} ${item.bidang ? '- '+item.bidang : ''}</b>
                <p>${item.tingkatan} | 📍 ${item.lokasi} (${item.periode})</p>
            </div>
            <button onclick="deleteJabatanPartai(${index})" class="btn-del">&times;</button>
        </div>
    `).join('');
}

function deleteJabatanPartai(i) {
    let data = getLocalData();
    data.riwayat_jabatan_partai.splice(i, 1);
    saveLocalData(data);
    renderJabatan();
}

/* ==========================================
   STEP 6: FINALISASI & MEDSOS
   ========================================== */
function goToReview() {
    let data = getLocalData();
    const checkboxes = document.querySelectorAll('input[name="bahasa"]:checked');
    let bahasaList = Array.from(checkboxes).map(cb => cb.value);
    const lainnya = document.getElementById('bahasa_lainnya')?.value.trim();
    if(lainnya) bahasaList.push(lainnya);

    data.kompetensi_bahasa = bahasaList.join(', ') || '-';
    data.kemampuan_komputer = document.getElementById('komputer')?.value || '-';
    data.media_sosial = {
        facebook: document.getElementById('medsos_fb')?.value || '-',
        instagram: document.getElementById('medsos_ig')?.value || '-',
        tiktok: document.getElementById('medsos_tiktok')?.value || '-'
    };

    saveLocalData(data);
    window.location.href = 'rekap.html';
}

/* ==========================================
   REKAP RENDERER (HALAMAN TERAKHIR)
   ========================================== */
function loadRekap() {
    const data = getLocalData();
    if (!data.nama_lengkap) return;

    // Foto
    const fCon = document.getElementById('fotoPreviewRekap');
    if (fCon) fCon.innerHTML = data.foto ? `<img src="${data.foto}" class="img-fluid rounded-circle shadow">` : 'No Photo';

    // Data Pribadi
    safeSet('rekapPribadi', `
        <div class="rekap-item"><div class="rekap-label">Nama</div><div class="rekap-value">${data.nama_lengkap}</div></div>
        <div class="rekap-item"><div class="rekap-label">NIK</div><div class="rekap-value">${data.nik}</div></div>
        <div class="rekap-item"><div class="rekap-label">WhatsApp</div><div class="rekap-value">${data.kontak}</div></div>
        <div class="rekap-item"><div class="rekap-label">Alamat</div><div class="rekap-value">${data.alamat}, RT${data.rt}/RW${data.rw}, ${data.kecamatan}</div></div>
    `);

    // Jabatan
    const jCon = document.getElementById('rekapJabatanPartai');
    if (jCon) {
        const jList = data.riwayat_jabatan_partai || [];
        jCon.innerHTML = jList.map(j => `
            <div class="rekap-box-simple">
                <b>${j.jabatan} ${j.bidang || ''}</b>
                <div>${j.tingkatan} - ${j.lokasi}</div>
            </div>
        `).join('') || 'Tidak ada data';
    }
}

/* ==========================================
   INITIALIZER (Satu-satunya window load)
   ========================================== */
window.addEventListener('load', () => {
    const data = getLocalData();
    
    // Auto-fill Step 1 fields
    const fieldsStep1 = ['nama_lengkap', 'nik', 'no_kta', 'alamat', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kab_kota', 'pekerjaan', 'kontak'];
    fieldsStep1.forEach(f => {
        const el = document.getElementById(f);
        if (el && data[f]) el.value = data[f];
    });

    if (data.jenis_kelamin) {
        const rad = document.querySelector(`input[name="jenis_kelamin"][value="${data.jenis_kelamin}"]`);
        if (rad) rad.checked = true;
    }

    // Render Lists
    renderPendidikan();
    renderJabatan();
    
    // Halaman Rekap
    if (document.getElementById('rekapPribadi')) {
        loadRekap();
    }
});
