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
    2. RENDER ENGINE (PREMIUM)
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

// Fungsi Render Khusus Step 4
const renderJabatan = () => renderList('jabatanList', 'riwayat_jabatan_partai', (item, index) => 
    premiumTemplate(item.jabatan, `${item.tingkatan} | ${item.periode}`, 'riwayat_jabatan_partai', index, 'renderJabatan'));

const renderPenugasan = () => renderList('tugasList', 'riwayat_penugasan', (item, index) => 
    premiumTemplate(item.tugas_jabatan, `${item.tugas_jenis} - ${item.tugas_lokasi} (${item.tugas_periode})`, 'riwayat_penugasan', index, 'renderPenugasan'));

/* ==========================================
    3. FUNGSI ADD DATA (Sesuai ID HTML Step 4)
   ========================================== */
function saveToLocal(key, obj) {
    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data[key] || [];
    list.push(obj);
    data[key] = list;
    localStorage.setItem('kaderData', JSON.stringify(data));
}

// Handler Tambah Struktur (Step 4)
function addJabatanPartai() {
    const tingkatan = document.getElementById('tingkatan_partai')?.value;
    let jabatan = document.getElementById('jabatan_partai')?.value;
    const bidang = document.getElementById('bidang_jabatan')?.value;
    const periode = document.getElementById('periode_partai')?.value;

    if(!tingkatan || !jabatan) return alert("Lengkapi data struktur!");
    
    // Jika ada bidang (Wakil Ketua/Sekretaris), gabungkan namanya
    if(bidang) jabatan = `${jabatan} ${bidang}`;

    saveToLocal('riwayat_jabatan_partai', { tingkatan, jabatan, periode });
    renderJabatan();
    
    // Reset fields
    document.getElementById('bidang_jabatan').value = '';
    document.getElementById('periode_partai').value = '';
}

// Handler Tambah Penugasan (Step 4) - SESUAI HTML BOS
function addPenugasanPartai() {
    const tugas_jenis = document.getElementById('tugas_jenis')?.value;
    const tugas_lembaga = document.getElementById('tugas_lembaga')?.value;
    const tugas_jabatan = document.getElementById('tugas_jabatan')?.value;
    const tugas_lokasi = document.getElementById('tugas_lokasi')?.value;
    const tugas_periode = document.getElementById('tugas_periode')?.value;

    if(!tugas_jenis || !tugas_jabatan) return alert("Lengkapi data penugasan!");

    const dataTugas = {
        tugas_jenis: tugas_jenis === 'Legislatif' ? `Legislatif (${tugas_lembaga})` : tugas_jenis,
        tugas_jabatan,
        tugas_lokasi,
        tugas_periode
    };

    saveToLocal('riwayat_penugasan', dataTugas);
    renderPenugasan();

    // Reset fields
    document.getElementById('tugas_jabatan').value = '';
    document.getElementById('tugas_lokasi').value = '';
    document.getElementById('tugas_periode').value = '';
}

/* ==========================================
    4. AUTO LOAD
   ========================================== */
window.addEventListener('load', () => {
    renderJabatan();
    renderPenugasan();
    // Jika ada fungsi render step lain (pendidikan, kader, dll) tambahkan di bawah sini
});
