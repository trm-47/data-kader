// Fungsi untuk menyimpan data dan lanjut ke halaman berikutnya
function saveAndNext() {
    // Ambil nilai dari input
    const data = {
        nama_lengkap: document.getElementById('nama_lengkap').value,
        nik: document.getElementById('nik').value,
        tempat_lahir: document.getElementById('tempat_lahir').value,
        // Foto akan diproses berbeda nanti, untuk sementara simpan datanya dulu
    };

    // Validasi sederhana: Jika kosong, jangan lanjut
    if (!data.nama_lengkap || !data.nik) {
        alert("Mohon lengkapi field yang bertanda bintang (*)");
        return;
    }

    // Simpan ke LocalStorage (Memori HP)
    // Kita tumpuk datanya agar tidak hilang
    let existingData = JSON.parse(localStorage.getItem('kaderData')) || {};
    let newData = { ...existingData, ...data };
    
    localStorage.setItem('kaderData', JSON.stringify(newData));

    // Pindah ke step berikutnya
    window.location.href = 'step2.html';
}

// Logika Preview Foto
document.getElementById('photoInput')?.addEventListener('change', function(e) {
    const reader = new FileReader();
    reader.onload = function() {
        const preview = document.getElementById('photoPreview');
        preview.innerHTML = `<img src="${reader.result}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        
        // Simpan Base64 foto ke LocalStorage (sementara)
        let existingData = JSON.parse(localStorage.getItem('kaderData')) || {};
        existingData.foto = reader.result;
        localStorage.setItem('kaderData', JSON.stringify(existingData));
    }
    reader.readAsDataURL(e.target.files[0]);
});

// Auto-Load data saat halaman dibuka kembali
window.onload = function() {
    let savedData = JSON.parse(localStorage.getItem('kaderData'));
    if (savedData) {
        if(document.getElementById('nama_lengkap')) document.getElementById('nama_lengkap').value = savedData.nama_lengkap || '';
        if(document.getElementById('nik')) document.getElementById('nik').value = savedData.nik || '';
        if(document.getElementById('tempat_lahir')) document.getElementById('tempat_lahir').value = savedData.tempat_lahir || '';
        // Jika ada foto, tampilkan
        if(savedData.foto && document.getElementById('photoPreview')) {
            document.getElementById('photoPreview').innerHTML = `<img src="${savedData.foto}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        }
    }
}
