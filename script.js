function saveStep1() {
    const fields = ['nama_lengkap', 'nik', 'no_kta', 'alamat', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kab_kota', 'pekerjaan', 'kontak'];
    let dataStep1 = {};

    // Ambil semua nilai input
    fields.forEach(field => {
        dataStep1[field] = document.getElementById(field).value;
    });

    // Validasi sederhana untuk field mandatory
    if (!dataStep1.nama_lengkap || !dataStep1.nik || !dataStep1.alamat || !dataStep1.kelurahan || !dataStep1.kontak) {
        alert("Mohon lengkapi data yang bertanda bintang (*)");
        return;
    }

    // Gabungkan dengan data lama (jika ada)
    let existingData = JSON.parse(localStorage.getItem('kaderData')) || {};
    let updatedData = { ...existingData, ...dataStep1 };

    localStorage.setItem('kaderData', JSON.stringify(updatedData));
    
    // Pindah ke Step 2
    window.location.href = 'step2.html';
}

// Tambahkan fungsi untuk load data otomatis saat user kembali ke halaman ini
window.addEventListener('load', () => {
    let savedData = JSON.parse(localStorage.getItem('kaderData'));
    if (savedData) {
        const fields = ['nama_lengkap', 'nik', 'no_kta', 'alamat', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kab_kota', 'pekerjaan', 'kontak'];
        fields.forEach(field => {
            if (savedData[field]) document.getElementById(field).value = savedData[field];
        });
        if (savedData.foto) {
            document.getElementById('photoPreview').innerHTML = `<img src="${savedData.foto}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        }
    }
});
