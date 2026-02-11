function saveStep1() {
    // Ambil input jenis kelamin (Radio Button)
    const genderEl = document.querySelector('input[name="jenis_kelamin"]:checked');
    
    // Daftar semua field sesuai form dokumen 
    const fields = ['nama_lengkap', 'nik', 'no_kta', 'alamat', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kab_kota', 'pekerjaan', 'kontak'];
    
    let dataStep1 = {
        jenis_kelamin: genderEl ? genderEl.value : ''
    };

    // Ambil semua nilai dari form
    fields.forEach(field => {
        const el = document.getElementById(field);
        if (el) dataStep1[field] = el.value.trim();
    });

    // VALIDASI: Semua field wajib diisi (Mandatory)
    // Sesuai permintaan: Jika tidak ada, user harus isi "-" 
    const isAnyEmpty = fields.some(field => !dataStep1[field]) || !dataStep1.jenis_kelamin;

    if (isAnyEmpty) {
        alert("Semua kolom wajib diisi sesuai form resmi! Jika tidak ada/tidak memiliki (misal RW), silakan isi dengan tanda minus (-)");
        return;
    }

    // Ambil data lama dari LocalStorage agar tidak menimpa data foto
    let existingData = JSON.parse(localStorage.getItem('kaderData')) || {};
    
    // Gabungkan data
    let updatedData = { ...existingData, ...dataStep1 };

    // Simpan permanen di memori HP sementara
    localStorage.setItem('kaderData', JSON.stringify(updatedData));
    
    // Pindah ke halaman berikutnya (Pendidikan Formal)
    window.location.href = 'step2.html';
}

// Fungsi Load Data Otomatis (Saat User klik tombol 'Kembali')
window.addEventListener('load', () => {
    let savedData = JSON.parse(localStorage.getItem('kaderData'));
    if (savedData) {
        const fields = ['nama_lengkap', 'nik', 'no_kta', 'alamat', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kab_kota', 'pekerjaan', 'kontak'];
        
        // Isi kembali field teks
        fields.forEach(field => {
            if (savedData[field] && document.getElementById(field)) {
                document.getElementById(field).value = savedData[field];
            }
        });

        // Pilih kembali radio button jenis kelamin
        if (savedData.jenis_kelamin) {
            const radio = document.querySelector(`input[name="jenis_kelamin"][value="${savedData.jenis_kelamin}"]`);
            if (radio) radio.checked = true;
        }

        // Tampilkan kembali foto jika sudah ada
        if (savedData.foto && document.getElementById('photoPreview')) {
            document.getElementById('photoPreview').innerHTML = `<img src="${savedData.foto}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        }
    }
});

// Tambahan: Logika Preview Foto agar tersimpan di LocalStorage
document.getElementById('photoInput')?.addEventListener('change', function(e) {
    const reader = new FileReader();
    reader.onload = function() {
        const preview = document.getElementById('photoPreview');
        preview.innerHTML = `<img src="${reader.result}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        
        let existingData = JSON.parse(localStorage.getItem('kaderData')) || {};
        existingData.foto = reader.result; // Simpan string gambar
        localStorage.setItem('kaderData', JSON.stringify(existingData));
    }
    if (e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
});
