const CONFIG = {
    URL: "https://script.google.com/macros/s/AKfycbwNnLpzYiZKtFCnZjRqDLc0c0l6bXBVfahBwC7eV8PE-hhbzmpiE2kKj0NziNTmUJuyfg/exec",
    YEAR: 2026
};

let MASTER_DATA = [];

// Init Aplikasi
async function init() {
    try {
        const response = await fetch(`${CONFIG.URL}?action=read`);
        const data = await response.json();
        
        MASTER_DATA = data.reverse();
        
        populateKecamatan(MASTER_DATA);
        render(MASTER_DATA);
        
        document.getElementById('statusText').innerText = "Terhubung";
        document.getElementById('dot').classList.add('online');
    } catch (err) {
        document.getElementById('statusText').innerText = "Koneksi Gagal";
        console.error(err);
    }
}

// Render Tabel Utama
function render(data) {
    const tbody = document.getElementById('tableBody');
    let madyaCount = 0;
    let urgentCount = 0;

    tbody.innerHTML = data.map(item => {
        const p = item.pribadi || {};
        const k = item.kaderisasi || [];
        
        // Cek Jenjang & Prioritas
        const isMadya = k.some(r => r[2].toLowerCase().includes('madya'));
        const pratama = k.find(r => r[2].toLowerCase().includes('pratama'));
        const waitTime = (pratama && !isMadya) ? CONFIG.YEAR - parseInt(pratama[5]) : 0;
        const isUrgent = waitTime >= 5;

        if (isMadya) madyaCount++;
        if (isUrgent) urgentCount++;

        const badges = k.map(r => `<span class="badge">${r[2]}</span>`).join('');

        return `
            <tr class="${isUrgent ? 'urgent-row' : ''}">
                <td><img class="avatar" src="https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=random"></td>
                <td>
                    <strong>${p.nama}</strong><br>
                    <small style="color:var(--gray)">${p.kta || '-'}</small>
                    ${isUrgent ? `<br><small style="color:red; font-weight:bold">⚠ Stagnan ${waitTime} Thn</small>` : ''}
                </td>
                <td>${badges || '<span class="badge" style="background:#eee; color:#666">Anggota</span>'}</td>
                <td>${p.kec || '-'}</td>
            </tr>
        `;
    }).join('');

    // Update Stats
    document.getElementById('sTotal').innerText = data.length;
    document.getElementById('sMadya').innerText = madyaCount;
    document.getElementById('sUrgent').innerText = urgentCount;
}

// Ambil list kecamatan unik untuk dropdown
function populateKecamatan(data) {
    const select = document.getElementById('filterKec');
    const list = [...new Set(data.map(i => i.pribadi.kec))].filter(Boolean).sort();
    list.forEach(kec => {
        const opt = document.createElement('option');
        opt.value = opt.innerText = kec;
        select.appendChild(opt);
    });
}

// Event Listeners untuk Search & Filter
const handleFilter = () => {
    const sTerm = document.getElementById('searchInput').value.toLowerCase();
    const sKec = document.getElementById('filterKec').value;

    const filtered = MASTER_DATA.filter(item => {
        const matchNama = item.pribadi.nama.toLowerCase().includes(sTerm) || 
                          (item.pribadi.kta && item.pribadi.kta.includes(sTerm));
        const matchKec = sKec === 'all' || item.pribadi.kec === sKec;
        return matchNama && matchKec;
    });

    render(filtered);
};

document.getElementById('searchInput').addEventListener('input', handleFilter);
document.getElementById('filterKec').addEventListener('change', handleFilter);

window.onload = init;
