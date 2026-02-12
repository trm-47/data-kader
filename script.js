(function() {
    // Kita samakan kuncinya dengan index yaitu 'kader_theme'
    const savedTheme = localStorage.getItem('kader_theme'); 
    if (savedTheme === 'premium') {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'premium.css'; 
        document.head.appendChild(link);
    }
})();

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

    const isMissing = fields.some(f => !dataStep1[f]) || !dataStep1.jenis_kelamin;
    if (isMissing) {
        alert("⚠️ Instruksi: Semua kolom wajib diisi. Gunakan (-) jika tidak ada data.");
        return;
    }

    let existing = JSON.parse(localStorage.getItem('kaderData')) || {};
    const finalData = { ...existing, ...dataStep1 };
    localStorage.setItem('kaderData', JSON.stringify(finalData));
    window.location.href = 'step2.html';
}

// Handler Foto
const photoInput = document.getElementById('photoInput');
if(photoInput) {
    photoInput.addEventListener('change', function(e) {
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
    });
}

/* ==========================================
    LOGIKA STEP 2: PENDIDIKAN FORMAL
   ========================================== */
function toggleExtraFields() {
    const jenjang = document.getElementById('jenjang').value;
    const ptJenjangs = ['D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3'];
    const wrapSma = document.getElementById('wrap_sma');
    const wrapPt = document.getElementById('wrap_pt');
    const inputNamaSekolahBiasa = document.getElementById('nama_sekolah')?.parentElement;

    if(wrapSma) wrapSma.style.display = (jenjang === 'SMA/SMK') ? 'block' : 'none';
    if(wrapPt) wrapPt.style.display = ptJenjangs.includes(jenjang) ? 'block' : 'none';
    if(inputNamaSekolahBiasa) inputNamaSekolahBiasa.style.display = ptJenjangs.includes(jenjang) ? 'none' : 'block';
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

    if (!jenjang || !namaFinal || !kota || !tahun) {
        alert("Mohon lengkapi semua data pendidikan!");
        return;
    }

    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data.riwayat_pendidikan || [];
    list.push({ jenjang, nama: namaFinal, kota, tahun, info: infoTambahan });
    data.riwayat_pendidikan = list;
    localStorage.setItem('kaderData', JSON.stringify(data));
    renderPendidikan();
}

function renderPendidikan() {
    const container = document.getElementById('pendidikanList');
    if(!container) return;
    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data.riwayat_pendidikan || [];
    container.innerHTML = list.map((item, index) => `
        <div class="data-box-item" style="background:#f8fafc; padding:10px; margin-bottom:5px; border-left:4px solid red; display:flex; justify-content:space-between;">
            <div><b>${item.jenjang}: ${item.nama}</b><br><small>${item.info} | ${item.tahun}</small></div>
            <button onclick="deletePendidikan(${index})" style="color:red; border:none; background:none;">&times;</button>
        </div>
    `).join('');
}

function deletePendidikan(index) {
    let data = JSON.parse(localStorage.getItem('kaderData'));
    data.riwayat_pendidikan.splice(index, 1);
    localStorage.setItem('kaderData', JSON.stringify(data));
    renderPendidikan();
}

/* ==========================================
    LOGIKA STEP 3 & 4: KADERISASI & JABATAN
   ========================================== */
function addPendidikanKader() {
    const jenis = document.getElementById('jenis_kader').value;
    const penyelenggara = document.getElementById('penyelenggara').value.trim();
    const tahun = document.getElementById('tahun_kader').value.trim();
    if (!jenis || !penyelenggara || !tahun) return alert("Isi lengkap!");
    
    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data.riwayat_kader || [];
    list.push({ jenis, penyelenggara, tahun });
    data.riwayat_kader = list;
    localStorage.setItem('kaderData', JSON.stringify(data));
    renderKader();
}

function renderKader() {
    const container = document.getElementById('kaderList');
    if(!container) return;
    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data.riwayat_kader || [];
    container.innerHTML = list.map((item, index) => `
        <div style="background:#fff5f5; padding:10px; margin-bottom:5px; border-left:4px solid red; display:flex; justify-content:space-between;">
            <div><b>${item.jenis}</b><br><small>${item.penyelenggara} (${item.tahun})</small></div>
            <button onclick="deleteKader(${index})" style="color:red; border:none; background:none;">&times;</button>
        </div>
    `).join('');
}

function deleteKader(index) {
    let data = JSON.parse(localStorage.getItem('kaderData'));
    data.riwayat_kader.splice(index, 1);
    localStorage.setItem('kaderData', JSON.stringify(data));
    renderKader();
}

function addJabatanPartai() {
    const tingkatan = document.getElementById('tingkatan_partai').value;
    const jabatan = document.getElementById('jabatan_partai').value;
    const periode = document.getElementById('periode_partai').value.trim();
    let bidang = document.getElementById('bidang_jabatan')?.value.trim() || "";

    if (!tingkatan || !jabatan || !periode) return alert("Lengkapi data!");

    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data.riwayat_jabatan_partai || [];
    list.push({ tingkatan, jabatan, bidang, periode });
    data.riwayat_jabatan_partai = list;
    localStorage.setItem('kaderData', JSON.stringify(data));
    renderJabatan();
}

function renderJabatan() {
    const container = document.getElementById('jabatanList');
    if(!container) return;
    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data.riwayat_jabatan_partai || [];
    container.innerHTML = list.map((item, index) => `
        <div style="background:#fff; padding:10px; margin-bottom:5px; border-left:4px solid red; display:flex; justify-content:space-between;">
            <div><b>${item.jabatan}</b><br><small>${item.tingkatan} | ${item.periode}</small></div>
            <button onclick="deleteJabatanPartai(${index})" style="color:red; border:none; background:none;">&times;</button>
        </div>
    `).join('');
}

function deleteJabatanPartai(index) {
    let data = JSON.parse(localStorage.getItem('kaderData'));
    data.riwayat_jabatan_partai.splice(index, 1);
    localStorage.setItem('kaderData', JSON.stringify(data));
    renderJabatan();
}

/* ==========================================
    LOGIKA STEP 5 & 6: KERJA & ORGANISASI
   ========================================== */
function addPekerjaan() {
    const perusahaan = document.getElementById('nama_perusahaan').value.trim();
    const jabatan = document.getElementById('jabatan_kerja').value.trim();
    const masa = document.getElementById('masa_kerja').value.trim();
    if (!perusahaan || !jabatan) return alert("Isi data!");

    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data.riwayat_pekerjaan || [];
    list.push({ perusahaan, jabatan, masa_kerja: masa });
    data.riwayat_pekerjaan = list;
    localStorage.setItem('kaderData', JSON.stringify(data));
    renderPekerjaan();
}

function renderPekerjaan() {
    const container = document.getElementById('pekerjaanList');
    if(!container) return;
    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data.riwayat_pekerjaan || [];
    container.innerHTML = list.map((item, index) => `
        <div style="background:#f1f5f9; padding:10px; margin-bottom:5px; border-left:4px solid #475569; display:flex; justify-content:space-between;">
            <div><b>${item.perusahaan}</b><br><small>${item.jabatan} (${item.masa_kerja})</small></div>
            <button onclick="deletePekerjaan(${index})" style="color:red; border:none; background:none;">&times;</button>
        </div>
    `).join('');
}

function deletePekerjaan(index) {
    let data = JSON.parse(localStorage.getItem('kaderData'));
    data.riwayat_pekerjaan.splice(index, 1);
    localStorage.setItem('kaderData', JSON.stringify(data));
    renderPekerjaan();
}

function addOrganisasi() {
    const nama = document.getElementById('org_nama').value.trim();
    const jabatan = document.getElementById('org_jabatan').value.trim();
    const periode = document.getElementById('org_periode').value.trim();
    if (!nama || !jabatan) return alert("Lengkapi data!");

    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data.riwayat_organisasi || [];
    list.push({ nama, jabatan, periode });
    data.riwayat_organisasi = list;
    localStorage.setItem('kaderData', JSON.stringify(data));
    renderOrganisasi();
}

function renderOrganisasi() {
    const container = document.getElementById('orgList');
    if(!container) return;
    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data.riwayat_organisasi || [];
    container.innerHTML = list.map((item, index) => `
        <div style="background:#f8fafc; padding:10px; margin-bottom:5px; border-left:4px solid gray; display:flex; justify-content:space-between;">
            <div><b>${item.nama}</b><br><small>${item.jabatan} (${item.periode})</small></div>
            <button onclick="deleteOrg(${index})" style="color:red; border:none; background:none;">&times;</button>
        </div>
    `).join('');
}

function deleteOrg(index) {
    let data = JSON.parse(localStorage.getItem('kaderData'));
    data.riwayat_organisasi.splice(index, 1);
    localStorage.setItem('kaderData', JSON.stringify(data));
    renderOrganisasi();
}

/* ==========================================
    FINAL: REVIEW & SUBMIT
   ========================================== */
function goToReview() {
    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    
    const checkboxes = document.querySelectorAll('input[name="bahasa"]:checked');
    data.kompetensi_bahasa = Array.from(checkboxes).map(cb => cb.value).join(', ') || '-';
    
    data.kemampuan_komputer = document.getElementById('komputer')?.value || '-';
    data.media_sosial = {
        facebook: document.getElementById('medsos_fb')?.value.trim() || '-',
        instagram: document.getElementById('medsos_ig')?.value.trim() || '-',
        tiktok: document.getElementById('medsos_tiktok')?.value.trim() || '-',
        twitter_x: document.getElementById('medsos_twitter')?.value.trim() || '-',
        youtube: document.getElementById('medsos_youtube')?.value.trim() || '-',
        linkedin: document.getElementById('medsos_linkedin')?.value.trim() || '-'
    };

    localStorage.setItem('kaderData', JSON.stringify(data));
    window.location.href = 'rekap.html';
}

async function submitSeluruhData() {
    const data = JSON.parse(localStorage.getItem('kaderData'));
    const btn = document.querySelector('.btn-final') || document.getElementById('btnSubmit');
    
    if(!data) return alert("Data kosong!");
    if(!confirm("Kirim data ke Pusat?")) return;

    btn.disabled = true;
    btn.innerHTML = "⏳ Sedang Mengirim...";
    
    const URL_API = 'https://script.google.com/macros/s/AKfycbzMBsu39WMKLJd9WmBKXiIov5yUEUjTDncQ5yvg8wm7YuVX_HzT0h5PhUOp4D1-pCJsQA/exec'; 

    try {
        await fetch(URL_API, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        setTimeout(() => {
            alert("MERDEKA! Data Berhasil Terkirim.");
            localStorage.clear();
            window.location.href = 'finish.html';
        }, 2000);
    } catch (e) {
        alert("Gagal kirim! Cek internet.");
        btn.disabled = false;
        btn.innerHTML = "KIRIM DATA SEKARANG";
    }
}

// Auto Load & Render on Page Load
window.addEventListener('load', () => {
    const savedData = JSON.parse(localStorage.getItem('kaderData'));
    if (!savedData) return;

    // Fill Step 1 Fields
    ['nama_lengkap', 'nik', 'no_kta', 'alamat', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kab_kota', 'pekerjaan', 'kontak'].forEach(f => {
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

    // Render Lists
    renderPendidikan();
    renderKader();
    renderJabatan();
    renderPekerjaan();
    renderOrganisasi();
    renderPenugasan();
});

/* --- KHUSUS PENUGASAN PARTAI (STEP 4) --- */
function addPenugasanPartai() {
    const jenis = document.getElementById('tugas_jenis').value;
    const lembaga = document.getElementById('tugas_lembaga').value;
    const jabatan = document.getElementById('tugas_jabatan').value;
    const lokasi = document.getElementById('tugas_lokasi').value;
    const periode = document.getElementById('tugas_periode').value;

    if (!jenis || !jabatan || !periode) {
        alert("⚠️ Mohon isi Jenis Penugasan, Jabatan, dan Periode!");
        return;
    }

    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data.riwayat_penugasan_partai || [];

    list.push({
        jenis: jenis,
        lembaga: (jenis === 'Legislatif') ? lembaga : 'Eksekutif',
        jabatan: jabatan,
        lokasi: lokasi,
        periode: periode
    });

    data.riwayat_penugasan_partai = list;
    localStorage.setItem('kaderData', JSON.stringify(data));

    document.getElementById('tugas_jabatan').value = '';
    document.getElementById('tugas_lokasi').value = '';
    document.getElementById('tugas_periode').value = '';

    renderPenugasan();
}

function renderPenugasan() {
    const container = document.getElementById('tugasList');
    if (!container) return;

    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data.riwayat_penugasan_partai || [];

    container.innerHTML = list.map((item, index) => `
        <div class="data-box-item" style="background:rgba(255,255,255,0.05); padding:12px; margin-bottom:10px; border-left:4px solid #D71920; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-size:13px;">
                <strong style="color:var(--primary-red);">${item.jenis} - ${item.jabatan}</strong><br>
                <span>${item.lembaga} | ${item.lokasi}</span><br>
                <small>Periode: ${item.periode}</small>
            </div>
            <button onclick="deletePenugasan(${index})" style="color:#D71920; border:none; background:none; font-size:20px; cursor:pointer;">&times;</button>
        </div>
    `).join('');
}

function deletePenugasan(index) {
    let data = JSON.parse(localStorage.getItem('kaderData'));
    data.riwayat_penugasan_partai.splice(index, 1);
    localStorage.setItem('kaderData', JSON.stringify(data));
    renderPenugasan();
}
