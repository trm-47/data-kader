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
