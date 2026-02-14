const GAS_URL = "https://script.google.com/macros/s/AKfycbz8ZZRmcSQsJm1m4VXk85311WDYMisGczcvZfm4j086FXjLNRobp7Q0hj9KEflmilWL2w/exec";

let BOS_DATA = [];

// --- Fetch Data ---
async function loadData() {
    try {
        console.log("Menghubungkan ke server...");
        // Tambahkan ?action=read dan mode redirect agar tidak kena CORS
        const response = await fetch(GAS_URL + "?action=read", {
            method: "GET",
            redirect: "follow" 
        });

        if (!response.ok) throw new Error("Server Google tidak merespon");

        const data = await response.json();

        if (data.error) throw new Error(data.error);

        BOS_DATA = data;
        renderTable();
    } catch (e) {
        const tableBody = document.getElementById("kader-table-body");
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red; padding:20px;">
                <b>Gagal memuat data!</b><br>${e.message}
            </td></tr>`;
        }
        console.error("Detail Error:", e);
    }
}

// --- Render Table ---
function renderTable() {
    const tbody = document.getElementById("kader-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!BOS_DATA.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Data tidak ditemukan</td></tr>`;
        return;
    }

    BOS_DATA.forEach((k, idx) => {
        const p = k.pribadi || {};
        const row = document.createElement("tr");

        // Nama + KTA
        const namaKTA = `<strong>${p.nama}</strong><br><small>${p.kta || '-'}</small>`;

        // Pendidikan Formal (Ambil dari data p. formal index 19)
        const edu = k.formal && k.formal[19] ? k.formal[19] : "-";

        // Pendidikan Kader (Revisi: Sekarang k.kaderisasi sudah berbentuk Array of Objects)
        // Kita cek teks di dalam k.kaderisasi
        const kaderList = (k.kaderisasi || []).map(item => {
            return `<span class="badge" style="background:#fee2e2; color:#b91c1c; padding:2px 6px; border-radius:4px; font-size:10px; margin-right:2px;">${item[2]}</span>`;
        }).join(" ");

        row.innerHTML = `
            <td>${namaKTA}</td>
            <td style="text-align:center;">${p.umur || "-"}</td>
            <td style="text-align:center;">${p.jk || "-"}</td>
            <td>${edu}</td>
            <td>${kaderList || '<span style="color:#ccc">-</span>'}</td>
        `;

        row.style.cursor = "pointer";
        row.addEventListener("click", () => showDetail(idx));
        tbody.appendChild(row);
    });
}

// --- Show Detail Modal ---
function showDetail(idx) {
    const k = BOS_DATA[idx];
    if (!k) return;

    const p = k.pribadi || {};
    const f = k.formal || [];
    const kdr = k.kaderisasi || [];

    // Tampilkan List Kaderisasi di Modal
    const kaderBadges = kdr.map(item => `<span class="badge" style="background:#fee2e2; color:#b91c1c; padding:4px 8px; border-radius:4px; margin-right:5px;">${item[2]} (${item[5]})</span>`).join(" ");

    const html = `
        <div style="text-align:center; border-bottom:1px solid #eee; padding-bottom:15px; margin-bottom:15px;">
            <img src="${p.foto || 'https://ui-avatars.com/api/?name='+encodeURIComponent(p.nama)}" width="120" height="120" style="border-radius:15px; object-fit:cover; border:3px solid #D71920;">
            <h3 style="margin:10px 0 5px 0;">${p.nama}</h3>
            <span style="color:#D71920; font-weight:bold;">No. KTA: ${p.kta || '-'}</span>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:13px;">
            <p><b>JK:</b> ${p.jk || '-'}</p>
            <p><b>Umur:</b> ${p.umur || '-'}</p>
            <p><b>Agama:</b> ${p.agama || '-'}</p>
            <p><b>WA:</b> ${p.wa || '-'}</p>
            <p style="grid-column: span 2;"><b>Tempat, Tgl Lahir:</b> ${p.tmpt_lahir || '-'}, ${p.tgl_lahir || '-'}</p>
            <p style="grid-column: span 2;"><b>Alamat:</b> ${p.alamat || '-'}, RT ${p.rt || '-'} / RW ${p.rw || '-'}, ${p.desa || '-'}, ${p.kec || '-'}, ${p.kota || '-'}</p>
            <p style="grid-column: span 2;"><b>Pendidikan Formal:</b> ${f[19] || '-'}</p>
            <p style="grid-column: span 2;"><b>Pendidikan Kader:</b><br>${kaderBadges || '-'}</p>
        </div>
    `;

    const modalContent = document.getElementById("modalInnerContent");
    const modalDetail = document.getElementById("modalDetail");
    
    if (modalContent && modalDetail) {
        modalContent.innerHTML = html;
        modalDetail.style.display = "block";
    }
}

function closeDetail() {
    const modal = document.getElementById("modalDetail");
    if (modal) modal.style.display = "none";
}

// --- Initialize ---
window.onload = loadData;
