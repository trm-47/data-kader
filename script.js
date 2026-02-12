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
            preview.style.border = "3px solid var(--primary-red)";
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
        alert("⚠️ Instruksi: Semua kolom wajib diisi. Gunakan (-) jika tidak ada data.");
        return;
    }

    let existing = JSON.parse(localStorage.getItem('kaderData')) || {};
    localStorage.setItem('kaderData', JSON.stringify({ ...existing, ...dataStep1 }));
    window.location.href = 'step2.html';
}

/* ==========================================
    4. RENDER ENGINE (PREMIUM STYLE)
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

// Template Render dengan Gaya Luxury (Merah PDI-P)
const premiumTemplate = (title, subtitle, key, index, callback) => `
    <div style="background:rgba(215, 25, 32, 0.05); padding:12px; margin-bottom:8px; border-left:4px solid #D71920; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
        <div style="font-size:13px;">
            <strong style="color:#D71920; display:block;">${title}</strong>
            <small style="color:#64748b;">${subtitle}</small>
        </div>
        <button onclick="deleteItem('${key}', ${index}, ${callback})" style="color:#ef4444; border:none; background:none; font-size:20px; cursor:pointer; padding:0 10px;">&times;</button>
    </div>
`;

const renderPendidikan = () => renderList('pendidikanList', 'riwayat_pendidikan', (item, index) => 
    premiumTemplate(`${item.jenjang}: ${item.nama}`, `${item.tahun} | ${item.kota || '-'}`, 'riwayat_pendidikan', index, 'renderPendidikan'));

const renderKader = () => renderList('kaderList', 'riwayat_kader', (item, index) => 
    premiumTemplate(`Kader ${item.jenis}`, `${item.penyelenggara} (${item.tahun})`, 'riwayat_kader', index, 'renderKader'));

const renderJabatan = () => renderList('jabatanList', 'riwayat_jabatan_partai', (item, index) => 
    premiumTemplate(item.jabatan, `${item.tingkatan} | ${item.periode}`, 'riwayat_jabatan_partai', index, 'renderJabatan'));

const renderPekerjaan = () => renderList('pekerjaanList', 'riwayat_pekerjaan', (item, index) => 
    premiumTemplate(item.perusahaan, `${item.jabatan} (${item.masa_kerja || '-'})`, 'riwayat_pekerjaan', index, 'renderPekerjaan'));

/* ==========================================
    5. FUNGSI ADD DATA (Sesuai ID di HTML)
   ========================================== */
function addPendidikan() {
    const jenjang = document.getElementById('jenjang').value;
    const ptJenjangs = ['D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3'];
    const nama = ptJenjangs.includes(jenjang) ? document.getElementById('nama_pt')?.value : document.getElementById('nama_sekolah')?.value;
    const tahun = document.getElementById('tahun_lulus').value;
    
    if(!jenjang || !nama || !tahun) return alert("Lengkapi data pendidikan!");

    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data.riwayat_pendidikan || [];
    list.push({ jenjang, nama, tahun, kota: document.getElementById('kota_sekolah')?.value || '-' });
    data.riwayat_pendidikan = list;
    localStorage.setItem('kaderData', JSON.stringify(data));
    renderPendidikan();
}

// ... Fungsi add lainnya (Kader, Jabatan, dll) panggil add yang lama Bos masih oke ...

/* ==========================================
    6. LOGIKA SUBMIT FINAL (Gak Boleh Hilang!)
   ========================================== */
async function submitSeluruhData() {
    const data = JSON.parse(localStorage.getItem('kaderData'));
    const btn = document.querySelector('.btn-final');
    
    if(!data) return alert("Data kosong!");
    if(!confirm("Kirim data ke Pusat? Pastikan semua sudah benar.")) return;

    btn.disabled = true;
    btn.innerHTML = "⏳ MENGIRIM DATA...";
    
    const URL_API = 'https://script.google.com/macros/s/AKfycbzMBsu39WMKLJd9WmBKXiIov5yUEUjTDncQ5yvg8wm7YuVX_HzT0h5PhUOp4D1-pCJsQA/exec'; 

    try {
        await fetch(URL_API, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        alert("MERDEKA! Data Berhasil Terkirim.");
        localStorage.clear();
        window.location.href = 'finish.html';
    } catch (e) {
        alert("Gagal kirim! Cek koneksi.");
        btn.disabled = false;
        btn.innerHTML = "KIRIM DATA SEKARANG";
    }
}

/* ==========================================
    7. AUTO LOAD & INITIALIZE
   ========================================== */
window.addEventListener('load', () => {
    const saved = JSON.parse(localStorage.getItem('kaderData')) || {};
    const allFields = ['nama_lengkap', 'tempat_lahir', 'tanggal_lahir', 'nik', 'no_kta', 'alamat', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kab_kota', 'pekerjaan', 'kontak'];
    
    allFields.forEach(f => {
        const el = document.getElementById(f);
        if(el) el.value = saved[f] || '';
    });
    
    // Load Foto preview
    if (saved.foto && document.getElementById('photoPreview')) {
        document.getElementById('photoPreview').innerHTML = `<img src="${saved.foto}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
    }

    renderPendidikan(); renderKader(); renderJabatan(); renderPekerjaan();
});
