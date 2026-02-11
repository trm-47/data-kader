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
        alert("Semua kolom wajib diisi! Jika tidak ada, isi dengan tanda minus (-)");
        return;
    }

    let existing = JSON.parse(localStorage.getItem('kaderData')) || {};
    localStorage.setItem('kaderData', JSON.stringify({ ...existing, ...dataStep1 }));
    
    window.location.href = 'step2.html';
}

window.addEventListener('load', () => {
    let savedData = JSON.parse(localStorage.getItem('kaderData'));
    if (savedData) {
        const fields = ['nama_lengkap', 'nik', 'no_kta', 'alamat', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kab_kota', 'pekerjaan', 'kontak'];
        fields.forEach(f => {
            const el = document.getElementById(f);
            if (el && savedData[f]) el.value = savedData[f];
        });
        if (savedData.jenis_kelamin) {
            const radio = document.querySelector(`input[name="jenis_kelamin"][value="${savedData.jenis_kelamin}"]`);
            if (radio) radio.checked = true;
        }
        if (savedData.foto) {
            document.getElementById('photoPreview').innerHTML = `<img src="${savedData.foto}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        }
    }
});

document.getElementById('photoInput')?.addEventListener('change', function(e) {
    const reader = new FileReader();
    reader.onload = function() {
        document.getElementById('photoPreview').innerHTML = `<img src="${reader.result}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        let existing = JSON.parse(localStorage.getItem('kaderData')) || {};
        existing.foto = reader.result;
        localStorage.setItem('kaderData', JSON.stringify(existing));
    }
    if (e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
});

function addPendidikan() {
    const jenjang = document.getElementById('jenjang').value;
    const nama = document.getElementById('nama_sekolah').value.trim();
    const kota = document.getElementById('kota_sekolah').value.trim();
    const tahun = document.getElementById('tahun_lulus').value.trim();
    
    let infoTambahan = "";

    // Logika SMA/SMK
    if (jenjang === 'SMA/SMK') {
        let jur = document.getElementById('jurusan_sma').value;
        if (jur === 'Lainnya') {
            jur = document.getElementById('jurusan_lainnya').value.trim();
        }
        if (!jur) { alert("Isi jurusan SMA/SMK!"); return; }
        infoTambahan = "Jurusan: " + jur;
    }

    // Logika PT
    if (jenjang === 'PT') {
        const fak = document.getElementById('fakultas').value.trim();
        const jurPt = document.getElementById('jurusan_pt').value.trim() || "-";
        if (!fak) { alert("Fakultas wajib diisi!"); return; }
        infoTambahan = `Fakultas: ${fak}, Jurusan: ${jurPt}`;
    }

    if (!jenjang || !nama || !kota || !tahun) {
        alert("Mohon lengkapi semua data pendidikan!");
        return;
    }

    let existingData = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = existingData.riwayat_pendidikan || [];

    list.push({ jenjang, nama, kota, tahun, info: infoTambahan });
    existingData.riwayat_pendidikan = list;
    localStorage.setItem('kaderData', JSON.stringify(existingData));

    // Reset Form
    document.getElementById('jenjang').value = '';
    document.getElementById('nama_sekolah').value = '';
    document.getElementById('kota_sekolah').value = '';
    document.getElementById('tahun_lulus').value = '';
    document.getElementById('wrap_sma').style.display = 'none';
    document.getElementById('wrap_pt').style.display = 'none';

    renderPendidikan();
}

function renderPendidikan() {
    const container = document.getElementById('pendidikanList');
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
                <div style="font-size: 11px; color: #4b5563;">${item.info}</div>
                <div style="font-size: 11px; color: #64748b;">${item.kota} | Lulus: ${item.tahun}</div>
            </div>
            <button onclick="deletePendidikan(${index})" style="background: none; border: none; color: #ef4444; font-size: 18px; padding-left: 10px;">&times;</button>
        </div>
    `).join('');
}
