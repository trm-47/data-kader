/* ==========================================
    1. THEME & INITIALIZER
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
    2. RENDER ENGINE (SULTAN STYLE)
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

// Fungsi Render untuk masing-masing List
const renderPendidikan = () => renderList('pendidikanList', 'riwayat_pendidikan', (item, index) => premiumTemplate(`${item.jenjang}: ${item.nama}`, `${item.tahun} | ${item.kota}`, 'riwayat_pendidikan', index, 'renderPendidikan'));
const renderKader = () => renderList('kaderList', 'riwayat_kader', (item, index) => premiumTemplate(`Kader ${item.jenis}`, `${item.penyelenggara} (${item.tahun})`, 'riwayat_kader', index, 'renderKader'));
const renderJabatan = () => renderList('jabatanList', 'riwayat_jabatan_partai', (item, index) => premiumTemplate(item.jabatan, `${item.tingkatan} | ${item.periode}`, 'riwayat_jabatan_partai', index, 'renderJabatan'));
const renderPekerjaan = () => renderList('pekerjaanList', 'riwayat_pekerjaan', (item, index) => premiumTemplate(item.perusahaan, `${item.jabatan} (${item.masa_kerja})`, 'riwayat_pekerjaan', index, 'renderPekerjaan'));
const renderOrganisasi = () => renderList('organisasiList', 'riwayat_organisasi', (item, index) => premiumTemplate(item.nama, `${item.jabatan} (${item.periode})`, 'riwayat_organisasi', index, 'renderOrganisasi'));
const renderPenugasan = () => renderList('penugasanList', 'riwayat_penugasan', (item, index) => premiumTemplate(item.tugas, `${item.wilayah} (${item.tahun})`, 'riwayat_penugasan', index, 'renderPenugasan'));

/* ==========================================
    3. FUNGSI ADD DATA (STEP 2 - 5)
   ========================================== */
function saveToLocal(key, obj) {
    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data[key] || [];
    list.push(obj);
    data[key] = list;
    localStorage.setItem('kaderData', JSON.stringify(data));
}

// Tombol + Step 2
function addPendidikan() {
    const jenjang = document.getElementById('jenjang')?.value;
    const ptJenjangs = ['D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3'];
    const nama = ptJenjangs.includes(jenjang) ? document.getElementById('nama_pt')?.value : document.getElementById('nama_sekolah')?.value;
    const tahun = document.getElementById('tahun_lulus')?.value;
    if(!jenjang || !nama) return alert("Isi data pendidikan!");
    saveToLocal('riwayat_pendidikan', { jenjang, nama, tahun, kota: document.getElementById('kota_sekolah')?.value || '-' });
    renderPendidikan();
}

// Tombol + Step 3
function addPendidikanKader() {
    const jenis = document.getElementById('jenis_kader')?.value;
    const penyelenggara = document.getElementById('penyelenggara')?.value;
    const tahun = document.getElementById('tahun_kader')?.value;
    if(!jenis || !penyelenggara) return alert("Isi data kaderisasi!");
    saveToLocal('riwayat_kader', { jenis, penyelenggara, tahun });
    renderKader();
}

// Tombol + Step 4 (Jabatan)
function addJabatanPartai() {
    const tingkatan = document.getElementById('tingkatan_partai')?.value;
    const jabatan = document.getElementById('jabatan_partai')?.value;
    const periode = document.getElementById('periode_partai')?.value;
    if(!tingkatan || !jabatan) return alert("Isi data jabatan!");
    saveToLocal('riwayat_jabatan_partai', { tingkatan, jabatan, periode });
    renderJabatan();
}

// Tombol + Step 4 (Pekerjaan)
function addPekerjaan() {
    const perusahaan = document.getElementById('nama_perusahaan')?.value;
    const jabatan = document.getElementById('jabatan_kerja')?.value;
    const masa = document.getElementById('masa_kerja')?.value;
    if(!perusahaan) return alert("Isi nama perusahaan!");
    saveToLocal('riwayat_pekerjaan', { perusahaan, jabatan, masa_kerja: masa });
    renderPekerjaan();
}

// Tombol + Step 5 (Organisasi)
function addOrganisasi() {
    const nama = document.getElementById('nama_org')?.value;
    const jabatan = document.getElementById('jabatan_org')?.value;
    const periode = document.getElementById('periode_org')?.value;
    if(!nama) return alert("Isi nama organisasi!");
    saveToLocal('riwayat_organisasi', { nama, jabatan, periode });
    renderOrganisasi();
}

// Tombol + Step 5 (Penugasan)
function addPenugasan() {
    const tugas = document.getElementById('nama_penugasan')?.value;
    const wilayah = document.getElementById('wilayah_penugasan')?.value;
    const tahun = document.getElementById('tahun_penugasan')?.value;
    if(!tugas) return alert("Isi nama penugasan!");
    saveToLocal('riwayat_penugasan', { tugas, wilayah, tahun });
    renderPenugasan();
}

/* ==========================================
    4. SUBMIT & LOAD
   ========================================== */
window.addEventListener('load', () => {
    const saved = JSON.parse(localStorage.getItem('kaderData')) || {};
    // Load Step 1
    const fields = ['nama_lengkap', 'tempat_lahir', 'tanggal_lahir', 'nik', 'no_kta', 'alamat', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kab_kota', 'pekerjaan', 'kontak'];
    fields.forEach(f => {
        const el = document.getElementById(f); if(el) el.value = saved[f] || '';
    });
    // Render semua list
    renderPendidikan(); renderKader(); renderJabatan(); renderPekerjaan(); renderOrganisasi(); renderPenugasan();
});
