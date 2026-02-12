/* ==========================================
    1. THEME ENGINE & INITIALIZER
   ========================================== */
(function() {
    const savedTheme = localStorage.getItem('kader_theme'); 
    if (savedTheme === 'premium') {
        const link = document.createElement('link');
        link.id = 'premium-theme-link';
        link.rel = 'stylesheet'; link.href = 'premium.css'; 
        document.head.appendChild(link);
    }
})();

/* ==========================================
    2. HANDLER FOTO
   ========================================== */
const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function() {
        const preview = document.getElementById('photoPreview');
        if(preview) preview.innerHTML = `<img src="${reader.result}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
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
        alert("⚠️ Mohon lengkapi semua data wajib."); return;
    }

    let existing = JSON.parse(localStorage.getItem('kaderData')) || {};
    localStorage.setItem('kaderData', JSON.stringify({ ...existing, ...dataStep1 }));
    window.location.href = 'step2.html';
}

/* ==========================================
    4. RENDER ENGINE (PREMIUM STYLE)
   ========================================== */
function deleteItem(key, index, callbackName) {
    let data = JSON.parse(localStorage.getItem('kaderData'));
    data[key].splice(index, 1);
    localStorage.setItem('kaderData', JSON.stringify(data));
    if (callbackName && typeof window[callbackName] === 'function') window[callbackName]();
}

function renderList(id, key, template) {
    const el = document.getElementById(id);
    if(!el) return;
    const data = JSON.parse(localStorage.getItem('kaderData')) || {};
    const list = data[key] || [];
    el.innerHTML = list.map((item, index) => template(item, index)).join('');
}

const premiumTemplate = (title, subtitle, key, index, callbackName) => `
    <div style="background:rgba(215, 25, 32, 0.05); padding:12px; margin-bottom:8px; border-left:4px solid #D71920; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
        <div style="font-size:13px;">
            <strong style="color:#D71920; display:block;">${title}</strong>
            <small style="color:#64748b;">${subtitle}</small>
        </div>
        <button onclick="deleteItem('${key}', ${index}, '${callbackName}')" style="color:#ef4444; border:none; background:none; font-size:20px; cursor:pointer; padding:0 10px;">&times;</button>
    </div>
`;

// Fungsi Render Global
const renderPendidikan = () => renderList('pendidikanList', 'riwayat_pendidikan', (item, index) => premiumTemplate(`${item.jenjang}: ${item.nama}`, `${item.tahun} | ${item.kota}`, 'riwayat_pendidikan', index, 'renderPendidikan'));
const renderKader = () => renderList('kaderList', 'riwayat_kader', (item, index) => premiumTemplate(`Kader ${item.jenis}`, `${item.penyelenggara} (${item.tahun})`, 'riwayat_kader', index, 'renderKader'));
const renderJabatan = () => renderList('jabatanList', 'riwayat_jabatan_partai', (item, index) => premiumTemplate(item.jabatan, `${item.tingkatan} | ${item.periode}`, 'riwayat_jabatan_partai', index, 'renderJabatan'));
const renderPekerjaan = () => renderList('pekerjaanList', 'riwayat_pekerjaan', (item, index) => premiumTemplate(item.perusahaan, `${item.jabatan} (${item.masa_kerja})`, 'riwayat_pekerjaan', index, 'renderPekerjaan'));
const renderOrganisasi = () => renderList('orgList', 'riwayat_organisasi', (item, index) => 
    premiumTemplate(item.nama, `${item.jabatan} | ${item.periode}`, 'riwayat_organisasi', index, 'renderOrganisasi'));

// Penyesuaian Render Penugasan untuk Step 4 (Target ID: tugasList)
const renderPenugasan = () => renderList('tugasList', 'riwayat_penugasan', (item, index) => premiumTemplate(item.jabatan, `${item.jenis} - ${item.lokasi} (${item.periode})`, 'riwayat_penugasan', index, 'renderPenugasan'));

/* ==========================================
    5. FUNGSI ADD DATA (STEP 2 - 6)
   ========================================== */
function saveToLocal(key, obj) {
    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data[key] || [];
    list.push(obj);
    data[key] = list;
    localStorage.setItem('kaderData', JSON.stringify(data));
}

function addPendidikan() {
    const jenjang = document.getElementById('jenjang')?.value;
    const ptJenjangs = ['D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3'];
    const nama = ptJenjangs.includes(jenjang) ? document.getElementById('nama_pt')?.value : document.getElementById('nama_sekolah')?.value;
    const tahun = document.getElementById('tahun_lulus')?.value;
    if(!jenjang || !nama || !tahun) return alert("Lengkapi data!");
    saveToLocal('riwayat_pendidikan', { jenjang, nama, tahun, kota: document.getElementById('kota_sekolah')?.value || '-' });
    renderPendidikan();
}

function addPendidikanKader() {
    const jenis = document.getElementById('jenis_kader')?.value;
    const penyelenggara = document.getElementById('penyelenggara')?.value;
    const tahun = document.getElementById('tahun_kader')?.value;
    if(!jenis || !penyelenggara) return alert("Lengkapi data kader!");
    saveToLocal('riwayat_kader', { jenis, penyelenggara, tahun });
    renderKader();
}

function addJabatanPartai() {
    const tingkatan = document.getElementById('tingkatan_partai')?.value;
    let jabatan = document.getElementById('jabatan_partai')?.value;
    const bidang = document.getElementById('bidang_jabatan')?.value;
    const periode = document.getElementById('periode_partai')?.value;

    if(!tingkatan || !jabatan) return alert("Lengkapi data jabatan!");
    if(bidang) jabatan = `${jabatan} ${bidang}`;

    saveToLocal('riwayat_jabatan_partai', { tingkatan, jabatan, periode });
    renderJabatan();
}

// Handler Penugasan Step 4 (Nama Fungsi & ID disesuaikan dengan HTML)
function addPenugasanPartai() {
    const jenis = document.getElementById('tugas_jenis')?.value;
    const lembaga = document.getElementById('tugas_lembaga')?.value;
    const jabatan = document.getElementById('tugas_jabatan')?.value;
    const lokasi = document.getElementById('tugas_lokasi')?.value;
    const periode = document.getElementById('tugas_periode')?.value;

    if(!jenis || !jabatan) return alert("Lengkapi data penugasan!");

    const dataTugas = {
        jenis: jenis === 'Legislatif' ? `Legislatif (${lembaga})` : jenis,
        jabatan: jabatan,
        lokasi: lokasi,
        periode: periode
    };

    saveToLocal('riwayat_penugasan', dataTugas);
    renderPenugasan();
}

function addPekerjaan() {
    const perusahaan = document.getElementById('nama_perusahaan')?.value;
    const jabatan = document.getElementById('jabatan_kerja')?.value;
    const masa = document.getElementById('masa_kerja')?.value; // ID harus sesuai HTML

    if(!perusahaan || !jabatan) return alert("Lengkapi data kerja!");
    
    // Simpan ke local dengan key masa_kerja
    saveToLocal('riwayat_pekerjaan', { 
        perusahaan: perusahaan, 
        jabatan: jabatan, 
        masa_kerja: masa // Ambil dari variabel masa di atas
    });
    
    // Reset input biar bisa nambah lagi
    document.getElementById('nama_perusahaan').value = '';
    document.getElementById('jabatan_kerja').value = '';
    document.getElementById('masa_kerja').value = '';
    
    renderPekerjaan();
}

function addOrganisasi() {
    const nama = document.getElementById('org_nama')?.value;
    const tingkat = document.getElementById('org_tingkat')?.value;
    const jabatan = document.getElementById('org_jabatan')?.value;
    const periode = document.getElementById('org_periode')?.value;

    if(!nama || !jabatan) return alert("Lengkapi data organisasi!");

    // Gabungkan nama dan tingkatan agar rapi di list
    const namaLengkap = tingkat ? `${nama} (${tingkat})` : nama;

    saveToLocal('riwayat_organisasi', { 
        nama: namaLengkap, 
        jabatan: jabatan, 
        periode: periode || '-' 
    });
    
    // Reset field sesuai ID di HTML Step 6
    if(document.getElementById('org_nama')) document.getElementById('org_nama').value = '';
    if(document.getElementById('org_jabatan')) document.getElementById('org_jabatan').value = '';
    if(document.getElementById('org_periode')) document.getElementById('org_periode').value = '';

    renderOrganisasi();
}
function saveStep6() {
    const facebook = document.getElementById('fb_kader')?.value || '-';
    const instagram = document.getElementById('ig_kader')?.value || '-';
    const tiktok = document.getElementById('tt_kader')?.value || '-';
    let existing = JSON.parse(localStorage.getItem('kaderData')) || {};
    existing.medsos = { facebook, instagram, tiktok };
    localStorage.setItem('kaderData', JSON.stringify(existing));
    window.location.href = 'rekap.html';
}

/* ==========================================
    6. SUBMIT & INITIAL LOAD
   ========================================== */
async function submitSeluruhData() {
    const data = JSON.parse(localStorage.getItem('kaderData'));
    if(!data) return alert("Data kosong!");
    const btn = document.querySelector('.btn-final');
    btn.disabled = true; btn.innerHTML = "⏳ MENGIRIM...";
    const URL_API = 'https://script.google.com/macros/s/AKfycbzMBsu39WMKLJd9WmBKXiIov5yUEUjTDncQ5yvg8wm7YuVX_HzT0h5PhUOp4D1-pCJsQA/exec';
    try {
        await fetch(URL_API, { method: 'POST', mode: 'no-cors', body: JSON.stringify(data) });
        alert("MERDEKA! Data Terkirim."); localStorage.clear(); window.location.href = 'finish.html';
    } catch (e) { alert("Gagal!"); btn.disabled = false; btn.innerHTML = "KIRIM SEKARANG"; }
}

window.addEventListener('load', () => {
    const saved = JSON.parse(localStorage.getItem('kaderData')) || {};
    ['nama_lengkap', 'tempat_lahir', 'tanggal_lahir', 'nik', 'no_kta', 'alamat', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kab_kota', 'pekerjaan', 'kontak'].forEach(f => {
        const el = document.getElementById(f); if(el) el.value = saved[f] || '';
    });
    if(saved.medsos) {
        if(document.getElementById('fb_kader')) document.getElementById('fb_kader').value = saved.medsos.facebook || '';
        if(document.getElementById('ig_kader')) document.getElementById('ig_kader').value = saved.medsos.instagram || '';
        if(document.getElementById('tt_kader')) document.getElementById('tt_kader').value = saved.medsos.tiktok || '';
    }
    renderPendidikan(); renderKader(); renderJabatan(); renderPekerjaan(); renderOrganisasi(); renderPenugasan();
});
