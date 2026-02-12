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
    2. HANDLER FOTO
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
        }
        let existing = JSON.parse(localStorage.getItem('kaderData')) || {};
        existing.foto = reader.result;
        localStorage.setItem('kaderData', JSON.stringify(existing));
    }
    reader.readAsDataURL(file);
};

document.addEventListener('change', (e) => {
    if (e.target.id === 'inputCamera' || e.target.id === 'inputGallery') handlePhoto(e);
});

/* ==========================================
    3. LOGIKA SAVE STEP 1
   ========================================== */
function saveStep1() {
    const genderEl = document.querySelector('input[name="jenis_kelamin"]:checked');
    const fields = ['nama_lengkap', 'tempat_lahir', 'tanggal_lahir', 'nik', 'no_kta', 'alamat', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kab_kota', 'pekerjaan', 'kontak'];
    
    let dataStep1 = { jenis_kelamin: genderEl ? genderEl.value : '' };
    fields.forEach(f => {
        const el = document.getElementById(f);
        dataStep1[f] = el ? el.value.trim() : '';
    });

    const requiredFields = fields.filter(f => f !== 'no_kta');
    if (requiredFields.some(f => !dataStep1[f]) || !dataStep1.jenis_kelamin) {
        alert("⚠️ Mohon lengkapi semua kolom bertanda bintang (*).");
        return;
    }

    let existing = JSON.parse(localStorage.getItem('kaderData')) || {};
    localStorage.setItem('kaderData', JSON.stringify({ ...existing, ...dataStep1 }));
    window.location.href = 'step2.html';
}

/* ==========================================
    4. FUNGSI ADD DATA (STEP 2 - 6)
   ========================================== */
function addPendidikan() {
    const jenjang = document.getElementById('jenjang').value;
    const nama = document.getElementById('nama_sekolah')?.value || document.getElementById('nama_pt')?.value;
    const tahun = document.getElementById('tahun_lulus').value;
    if(!jenjang || !nama || !tahun) return alert("Isi data pendidikan!");

    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data.riwayat_pendidikan || [];
    list.push({ jenjang, nama, tahun, kota: document.getElementById('kota_sekolah')?.value || '-' });
    data.riwayat_pendidikan = list;
    localStorage.setItem('kaderData', JSON.stringify(data));
    renderPendidikan();
}

function addPendidikanKader() {
    const jenis = document.getElementById('jenis_kader').value;
    const penyelenggara = document.getElementById('penyelenggara').value;
    const tahun = document.getElementById('tahun_kader').value;
    if(!jenis || !penyelenggara || !tahun) return alert("Lengkapi data kaderisasi!");

    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data.riwayat_kader || [];
    list.push({ jenis, penyelenggara, tahun });
    data.riwayat_kader = list;
    localStorage.setItem('kaderData', JSON.stringify(data));
    renderKader();
}

function addJabatanPartai() {
    const tingkatan = document.getElementById('tingkatan_partai').value;
    const jabatan = document.getElementById('jabatan_partai').value;
    const periode = document.getElementById('periode_partai').value;
    if(!tingkatan || !jabatan) return alert("Lengkapi data jabatan!");

    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data.riwayat_jabatan_partai || [];
    list.push({ tingkatan, jabatan, periode });
    data.riwayat_jabatan_partai = list;
    localStorage.setItem('kaderData', JSON.stringify(data));
    renderJabatan();
}

function addPekerjaan() {
    const perusahaan = document.getElementById('nama_perusahaan').value;
    const jabatan = document.getElementById('jabatan_kerja').value;
    if(!perusahaan || !jabatan) return alert("Isi data pekerjaan!");

    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data.riwayat_pekerjaan || [];
    list.push({ perusahaan, jabatan, masa_kerja: document.getElementById('masa_kerja')?.value || '-' });
    data.riwayat_pekerjaan = list;
    localStorage.setItem('kaderData', JSON.stringify(data));
    renderPekerjaan();
}

/* ==========================================
    5. LOGIKA SUBMIT FINAL (UNTUK REKAP)
   ========================================== */
async function submitSeluruhData() {
    const data = JSON.parse(localStorage.getItem('kaderData'));
    const btn = document.querySelector('.btn-final');
    
    if(!data) return alert("Data kosong!");
    if(!confirm("Kirim data ke Pusat sekarang?")) return;

    btn.disabled = true;
    btn.innerHTML = "⏳ SEDANG MENGIRIM...";
    
    // URL Web App Google Sheets Bos
    const URL_API = 'https://script.google.com/macros/s/AKfycbzMBsu39WMKLJd9WmBKXiIov5yUEUjTDncQ5yvg8wm7YuVX_HzT0h5PhUOp4D1-pCJsQA/exec'; 

    try {
        await fetch(URL_API, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        alert("MERDEKA! Data Berhasil Terkirim ke Pusat.");
        localStorage.clear();
        window.location.href = 'finish.html';
    } catch (e) {
        alert("Gagal kirim! Pastikan internet aktif.");
        btn.disabled = false;
        btn.innerHTML = "KIRIM DATA SEKARANG";
    }
}

/* ==========================================
    6. RENDER ENGINE & AUTO LOAD
   ========================================== */
function deleteItem(key, index, callback) {
    let data = JSON.parse(localStorage.getItem('kaderData'));
    data[key].splice(index, 1);
    localStorage.setItem('kaderData', JSON.stringify(data));
    callback();
}

function renderList(id, key, template) {
    const el = document.getElementById(id);
    if(!el) return;
    const data = JSON.parse(localStorage.getItem('kaderData')) || {};
    const list = data[key] || [];
    el.innerHTML = list.map((item, index) => template(item, index)).join('');
}

const renderPendidikan = () => renderList('pendidikanList', 'riwayat_pendidikan', (item, index) => `<div class="data-box-item"><b>${item.jenjang}: ${item.nama}</b> (${item.tahun}) <button onclick="deleteItem('riwayat_pendidikan', ${index}, renderPendidikan)">×</button></div>`);
const renderKader = () => renderList('kaderList', 'riwayat_kader', (item, index) => `<div class="data-box-item"><b>${item.jenis}</b> - ${item.penyelenggara} <button onclick="deleteItem('riwayat_kader', ${index}, renderKader)">×</button></div>`);
const renderJabatan = () => renderList('jabatanList', 'riwayat_jabatan_partai', (item, index) => `<div class="data-box-item"><b>${item.jabatan}</b> (${item.tingkatan}) <button onclick="deleteItem('riwayat_jabatan_partai', ${index}, renderJabatan)">×</button></div>`);
const renderPekerjaan = () => renderList('pekerjaanList', 'riwayat_pekerjaan', (item, index) => `<div class="data-box-item"><b>${item.perusahaan}</b> - ${item.jabatan} <button onclick="deleteItem('riwayat_pekerjaan', ${index}, renderPekerjaan)">×</button></div>`);

window.addEventListener('load', () => {
    const saved = JSON.parse(localStorage.getItem('kaderData')) || {};
    const allFields = ['nama_lengkap', 'tempat_lahir', 'tanggal_lahir', 'nik', 'no_kta', 'alamat', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kab_kota', 'pekerjaan', 'kontak'];
    allFields.forEach(f => { if(document.getElementById(f)) document.getElementById(f).value = saved[f] || ''; });
    
    renderPendidikan(); renderKader(); renderJabatan(); renderPekerjaan();
});
