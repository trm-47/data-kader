const URL_GAS = "https://script.google.com/macros/s/AKfycbwAbaGgSWdlZ3AwtPk3Guwu-izM6AIsmf4CrW5WFFytVOQd9jHymA_4SQVU83EiFWBaZA/exec";
let dataKader = [];

// Ambil Data
async function loadData() {
    try {
        const response = await fetch(`${URL_GAS}?action=read`);
        const result = await response.json();
        dataKader = result.reverse();
        renderTable(dataKader);
        document.getElementById('statusInfo').innerText = "Data Sinkron";
    } catch (error) {
        document.getElementById('statusInfo').innerText = "Gagal memuat data!";
    }
}

// Render Tabel
function renderTable(data) {
    const body = document.getElementById('tableBody');
    body.innerHTML = data.map(item => {
        const p = item.pribadi;
        const k = item.kaderisasi || [];
        
        // Logika Badge & Prioritas
        const badges = k.map(rk => `<span class="badge">${rk[2]}</span>`).join('');
        const isMadya = k.some(rk => rk[2].toLowerCase().includes('madya'));
        const pratama = k.find(rk => rk[2].toLowerCase().includes('pratama'));
        const isUrgent = (pratama && !isMadya && (2026 - parseInt(pratama[5])) >= 5);

        return `
            <tr class="${isUrgent ? 'urgent-row' : ''}">
                <td><img src="https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=random" width="40" style="border-radius:50%"></td>
                <td><strong>${p.nama}</strong><br><small>${p.kta || '-'}</small></td>
                <td>${badges || 'Anggota'}</td>
                <td><button onclick="alert('Nama: ${p.nama}')">Cek</button></td>
            </tr>
        `;
    }).join('');
    
    updateStats(data);
}

// Stats
function updateStats(data) {
    document.getElementById('sTotal').innerText = data.length;
    // Tambahkan logika stats lainnya di sini
}

// Filter Search
document.getElementById('searchInput').addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    const filtered = dataKader.filter(item => item.pribadi.nama.toLowerCase().includes(search));
    renderTable(filtered);
});

// Jalankan saat startup
window.onload = loadData;
