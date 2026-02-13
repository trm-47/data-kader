const GAS_URL = "https://script.google.com/macros/s/AKfycbwAbaGgSWdlZ3AwtPk3Guwu-izM6AIsmf4CrW5WFFytVOQd9jHymA_4SQVU83EiFWBaZA/exec?action=read";

let BOS_DATA = [];

// --- Fetch Data ---
async function loadData() {
    try {
        const response = await fetch(GAS_URL);
        const data = await response.json();

        if (!data || data.error) throw new Error(data.error || "Data kosong");

        BOS_DATA = data;
        renderTable();
    } catch (e) {
        document.getElementById("kader-table-body").innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Gagal memuat data: ${e.message}</td></tr>`;
        console.error(e);
    }
}

// --- Render Table ---
function renderTable() {
    const tbody = document.getElementById("kader-table-body");
    tbody.innerHTML = "";

    if (!BOS_DATA.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Data kosong</td></tr>`;
        return;
    }

    BOS_DATA.forEach((k, idx) => {
        const row = document.createElement("tr");

        // Nama + KTA
        const namaKTA = `${k.pribadi.nama} (${k.pribadi.kta || '-'})`;

        // Pendidikan Formal
        const edu = k.formal[19] || "-";

        // Pendidikan Kader lengkap
        const kaderList = ["Pratama","Madya","Utama","Guru","Perempuan","Tema Khusus"].map((lvl, i) => {
            return k.kaderisasi[i*2+2] ? `<span class="badge">${lvl}</span>` : "";
        }).join(" ");

        row.innerHTML = `
            <td>${namaKTA}</td>
            <td>${k.pribadi.umur || "-"}</td>
            <td>${k.pribadi.jk || "-"}</td>
            <td>${edu}</td>
            <td>${kaderList || "-"}</td>
        `;

        row.addEventListener("click", () => showDetail(idx));
        tbody.appendChild(row);
    });
}

// --- Show Detail Modal ---
function showDetail(idx) {
    const k = BOS_DATA[idx];
    if (!k) return;

    const p = k.pribadi;
    const f = k.formal;
    const kdr = k.kaderisasi;

    const kaderBadges = ["Pratama","Madya","Utama","Guru","Perempuan","Tema Khusus"].map((lvl,i) => {
        return kdr[i*2+2] ? `<span class="badge">${lvl}</span>` : "";
    }).join(" ");

    const html = `
        <h3>${p.nama} (No. KTA: ${p.kta || '-'})</h3>
        <img src="${p.foto || 'https://ui-avatars.com/api/?name='+encodeURIComponent(p.nama)}" width="150" style="border-radius:50%; margin:10px 0;">
        <p><b>Jenis Kelamin:</b> ${p.jk || '-'}</p>
        <p><b>Tempat, Tgl Lahir:</b> ${p.tmpt_lahir || '-'}, ${p.tgl_lahir || '-'}</p>
        <p><b>Alamat:</b> ${p.alamat || '-'}, RT ${p.rt || '-'} / RW ${p.rw || '-'}, ${p.desa || '-'}, ${p.kec || '-'}, ${p.kota || '-'}</p>
        <p><b>Umur:</b> ${p.umur || '-'}</p>
        <p><b>Agama:</b> ${p.agama || '-'}</p>
        <p><b>Email:</b> ${p.email || '-'}</p>
        <p><b>No. WA:</b> ${p.wa || '-'}</p>
        <p><b>Pendidikan Formal:</b> ${f[19] || '-'}</p>
        <p><b>Pendidikan Kader:</b> ${kaderBadges || '-'}</p>
    `;

    document.getElementById("modalInnerContent").innerHTML = html;
    document.getElementById("modalDetail").style.display = "block";
}

function closeDetail() {
    document.getElementById("modalDetail").style.display = "none";
}

// --- Initialize ---
window.onload = loadData;
