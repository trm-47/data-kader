/* ==========================================
    1. THEME ENGINE & INITIALIZER
   ========================================== */
(function() {
    const savedTheme = localStorage.getItem('kader_theme'); 
    if (savedTheme === 'premium') {
        const link = document.createElement('link');
        link.id = 'premium-theme-link';
        link.rel = 'stylesheet';
        link.href = 'premium.css'; 
        document.head.appendChild(link);
    }
})();

/* ==========================================
    2. HANDLER FOTO (SELFIE & GALERI)
   ========================================== */
const handlePhoto = (e) => {
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
            preview.style.border = "3px solid var(--primary-red)";
        }
        let existing = JSON.parse(localStorage.getItem('kaderData')) || {};
        existing.foto = reader.result;
        localStorage.setItem('kaderData', JSON.stringify(existing));
    }
    reader.readAsDataURL(file);
};

document.addEventListener('change', (e) => {
    if (e.target.id === 'inputCamera' || e.target.id === 'inputGallery') {
        handlePhoto(e);
    }
});

/* ==========================================
    3. LOGIKA STEP 1: DATA PRIBADI (FIXED)
   ========================================== */
function saveStep1() {
    const genderEl = document.querySelector('input[name="jenis_kelamin"]:checked');
    
    // Harus sinkron dengan ID di HTML Bos
    const fields = [
        'nama_lengkap', 'tempat_lahir', 'tanggal_lahir', 'nik', 
        'no_kta', 'alamat', 'rt', 'rw', 'kelurahan', 
        'kecamatan', 'kab_kota', 'pekerjaan', 'kontak'
    ];
    
    let dataStep1 = {
        jenis_kelamin: genderEl ? genderEl.value : ''
    };

    fields.forEach(f => {
        const el = document.getElementById(f);
        dataStep1[f] = el ? el.value.trim() : '';
    });

    // Validasi: No KTA boleh kosong, yang lain wajib
    const requiredFields = fields.filter(f => f !== 'no_kta');
    const isMissing = requiredFields.some(f => !dataStep1[f]) || !dataStep1.jenis_kelamin;

    if (isMissing) {
        alert("⚠️ Mohon lengkapi semua kolom yang bertanda bintang (*).");
        return;
    }

    let existing = JSON.parse(localStorage.getItem('kaderData')) || {};
    const finalData = { ...existing, ...dataStep1 };
    localStorage.setItem('kaderData', JSON.stringify(finalData));
    window.location.href = 'step2.html';
}

/* ==========================================
    4. RENDERER ENGINE (SAFE MODE)
   ========================================== */
function renderList(containerId, dataKey, templateFn) {
    const container = document.getElementById(containerId);
    if(!container) return; // Mencegah error jika elemen tidak ada di halaman tersebut

    const data = JSON.parse(localStorage.getItem('kaderData')) || {};
    const list = data[dataKey] || [];
    container.innerHTML = list.map((item, index) => templateFn(item, index)).join('');
}

function renderPendidikan() {
    renderList('pendidikanList', 'riwayat_pendidikan', (item, index) => `
        <div class="data-box-item" style="background:rgba(0,0,0,0.03); padding:10px; margin-bottom:5px; border-left:4px solid red; display:flex; justify-content:space-between;">
            <div><b>${item.jenjang}: ${item.nama}</b><br><small>${item.info} | ${item.tahun}</small></div>
            <button onclick="deleteItem('riwayat_pendidikan', ${index}, renderPendidikan)" style="color:red; border:none; background:none; cursor:pointer;">&times;</button>
        </div>
    `);
}

function renderKader() {
    renderList('kaderList', 'riwayat_kader', (item, index) => `
        <div style="background:rgba(215, 25, 32, 0.05); padding:10px; margin-bottom:5px; border-left:4px solid red; display:flex; justify-content:space-between;">
            <div><b>${item.jenis}</b><br><small>${item.penyelenggara} (${item.tahun})</small></div>
            <button onclick="deleteItem('riwayat_kader', ${index}, renderKader)" style="color:red; border:none; background:none; cursor:pointer;">&times;</button>
        </div>
    `);
}

function renderJabatan() {
    renderList('jabatanList', 'riwayat_jabatan_partai', (item, index) => `
        <div style="background:rgba(255,255,255,0.05); padding:10px; margin-bottom:5px; border-left:4px solid red; display:flex; justify-content:space-between;">
            <div><b>${item.jabatan}</b><br><small>${item.tingkatan} | ${item.periode}</small></div>
            <button onclick="deleteItem('riwayat_jabatan_partai', ${index}, renderJabatan)" style="color:red; border:none; background:none; cursor:pointer;">&times;</button>
        </div>
    `);
}

function renderPekerjaan() {
    renderList('pekerjaanList', 'riwayat_pekerjaan', (item, index) => `
        <div style="background:rgba(0,0,0,0.03); padding:10px; margin-bottom:5px; border-left:4px solid #475569; display:flex; justify-content:space-between;">
            <div><b>${item.perusahaan}</b><br><small>${item.jabatan} (${item.masa_kerja})</small></div>
            <button onclick="deleteItem('riwayat_pekerjaan', ${index}, renderPekerjaan)" style="color:red; border:none; background:none; cursor:pointer;">&times;</button>
        </div>
    `);
}

function renderOrganisasi() {
    renderList('orgList', 'riwayat_organisasi', (item, index) => `
        <div style="background:rgba(0,0,0,0.03); padding:10px; margin-bottom:5px; border-left:4px solid gray; display:flex; justify-content:space-between;">
            <div><b>${item.nama}</b><br><small>${item.jabatan} (${item.periode})</small></div>
            <button onclick="deleteItem('riwayat_organisasi', ${index}, renderOrganisasi)" style="color:red; border:none; background:none; cursor:pointer;">&times;</button>
        </div>
    `);
}

function renderPenugasan() {
    renderList('tugasList', 'riwayat_penugasan_partai', (item, index) => `
        <div style="background:rgba(255,255,255,0.05); padding:12px; margin-bottom:10px; border-left:4px solid red; border-radius:8px; display:flex; justify-content:space-between;">
            <div style="font-size:13px;">
                <strong style="color:red;">${item.jenis} - ${item.jabatan}</strong><br>
                <span>${item.lembaga} | ${item.lokasi}</span><br>
                <small>Periode: ${item.periode}</small>
            </div>
            <button onclick="deleteItem('riwayat_penugasan_partai', ${index}, renderPenugasan)" style="color:red; border:none; background:none; font-size:20px; cursor:pointer;">&times;</button>
        </div>
    `);
}

/* ==========================================
    5. FUNGSI ACTION (ADD/DELETE)
   ========================================== */
function deleteItem(key, index, callback) {
    let data = JSON.parse(localStorage.getItem('kaderData'));
    data[key].splice(index, 1);
    localStorage.setItem('kaderData', JSON.stringify(data));
    callback();
}

// Tambahkan logika addPendidikan, addPendidikanKader, dll tetap sama dengan sebelumnya
// namun pastikan memanggil render yang sesuai.

/* ==========================================
    6. AUTO LOAD
   ========================================== */
window.addEventListener('load', () => {
    const savedData = JSON.parse(localStorage.getItem('kaderData')) || {};
    
    // Isi input field
    const allFields = ['nama_lengkap', 'tempat_lahir', 'tanggal_lahir', 'nik', 'no_kta', 'alamat', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kab_kota', 'pekerjaan', 'kontak'];
    allFields.forEach(f => {
        const el = document.getElementById(f);
        if (el && savedData[f]) el.value = savedData[f];
    });

    if (savedData.jenis_kelamin) {
        const radio = document.querySelector(`input[name="jenis_kelamin"][value="${savedData.jenis_kelamin}"]`);
        if (radio) radio.checked = true;
    }

    if (savedData.foto && document.getElementById('photoPreview')) {
        const preview = document.getElementById('photoPreview');
        preview.innerHTML = `<img src="${savedData.foto}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        preview.style.border = "3px solid var(--primary-red)";
    }

    // Jalankan semua render (Safe Mode akan memfilter mana yang harus jalan)
    renderPendidikan();
    renderKader();
    renderJabatan();
    renderPekerjaan();
    renderOrganisasi();
    renderPenugasan();
});
