const GAS_URL = "https://script.google.com/macros/s/AKfycbzihYwId9oi6UFtd7ZHK8QOM0UlgiTQKZ7lcyETciaAJnX-QCKZUbaG2CPdZCESFGZp_Q/exec";
let MASTER_DATA = [];

// 1. Ambil Data
async function loadData() {
    try {
        const response = await fetch(GAS_URL + "?action=read", { redirect: "follow" });
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        // BALIK DATA: Supaya inputan terbaru di Google Sheet muncul paling atas
        MASTER_DATA = data.reverse();
        
        applyFilters(); // Render pertama kali
    } catch (e) {
        document.getElementById("bodyKader").innerHTML = `<tr><td colspan="6" style="text-align:center; color:red; padding:30px;">Gagal memuat: ${e.message}</td></tr>`;
    }
}

function renderTable(data) {
    const tbody = document.getElementById("bodyKader");
    if (!tbody) return;
    tbody.innerHTML = "";

    data.forEach((item, idx) => {
        const p = item.pribadi || {};
        const k = item.kaderisasi || [];
        
        // --- FIX LOGIKA FOTO SAKTI ---
        let fotoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=random&color=fff`;
        
        if (p.foto && p.foto !== "-") {
            let fileId = "";
            if (p.foto.includes("id=")) {
                fileId = p.foto.split("id=")[1].split("&")[0];
            } else if (p.foto.includes("file/d/")) {
                fileId = p.foto.split("file/d/")[1].split("/")[0];
            }

            if (fileId) {
                // Perbaikan: Gunakan backticks dan format ${fileId} yang benar
                fotoUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
            }
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="text-align:center;">
                <div style="width:50px; height:50px; border-radius:12px; overflow:hidden; border:2px solid #D71920; margin:auto; background:#eee;">
                    <img src="${fotoUrl}" 
                         style="width:100%; height:100%; object-fit:cover;" 
                         onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=ccc&color=666'">
                </div>
            </td>
            <td>
                <div style="font-weight:800; color:#1e293b;">${p.nama}</div>
                <div style="font-size:11px; color:#64748b;">KTA: ${p.kta || '-'}</div>
            </td>
            <td style="text-align:center; font-weight:700;">${p.umur || '-'}</td>
            <td style="font-size:12px;">${item.formal[19] || '-'}</td>
            <td>${k.map(row => `<span class="badge ${row[2].toLowerCase().includes('madya') ? 'warning-badge' : 'badge-red'}">${row[2]}</span>`).join(" ")}</td>
            <td style="text-align:center;">
                <button onclick="showDetail(${idx})" style="padding:6px 12px; background:#D71920; color:white; border:none; border-radius:8px; font-weight:800; cursor:pointer;">DETAIL</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
function applyFilters() {
    // 1. Ambil semua nilai dari dropdown (Pastikan ID di HTML sama)
    const fKota = document.getElementById('fKota').value;
    const fKec = document.getElementById('fKec').value;
    const fDesa = document.getElementById('fDesa').value;
    const fJK = document.getElementById('fJK').value;
    const fAgama = document.getElementById('fAgama').value;
    const fEdu = document.getElementById('fPendidikan').value;
    const fKader = document.getElementById('fKader').value;
    const fTingkat = document.getElementById('fTingkat').value;
    const fJenis = document.getElementById('fJenisTugas').value;
    const fStatusMadya = document.getElementById('fStatusMadya').value;

    // 2. Gunakan MASTER_DATA (bukan databaseKader)
    const filtered = MASTER_DATA.filter(item => {
        const p = item.pribadi || {};
        const formal = item.formal || [];
        const kader = item.kaderisasi || []; // Ini sekarang sudah jadi array dari Apps Script kita tadi
        const jabatan = item.jabatan || [];

        // --- Filter Wilayah ---
        const matchKota = fKota === "Semua" || (p.kota === fKota);
        const matchKec = fKec === "Semua" || (p.kec === fKec);
        const matchDesa = fDesa === "Semua" || (p.desa === fDesa);

        // --- Filter Kaderisasi Dasar ---
        // Karena kaderisasi sekarang array, kita gabungkan jadi teks untuk pencarian
        const textKader = kader.map(k => k[2]).join(" ").toLowerCase();
        const matchesKader = (fKader === "Semua") || textKader.includes(fKader.toLowerCase());

        // --- LOGIKA KHUSUS MADYA ---
        const currentYear = 2026; // Sesuai tahun sekarang
        const isMadya = textKader.includes("madya");
        const hasPratama = textKader.includes("pratama");
        
        // Cari tahun pratama di dalam array kaderisasi
        const dataPratama = kader.find(k => k[2].toLowerCase().includes("pratama"));
        const tahunPratama = dataPratama ? parseInt(dataPratama[5]) : 0;
        const masaTunggu = tahunPratama > 0 ? (currentYear - tahunPratama) : 0;

        let matchStatusMadya = true;
        if (fStatusMadya === "Sudah") {
            matchStatusMadya = isMadya;
        } else if (fStatusMadya === "Belum") {
            matchStatusMadya = !isMadya;
        } else if (fStatusMadya === "Prioritas") {
            matchStatusMadya = (hasPratama && !isMadya && masaTunggu >= 5);
        }

        // --- Filter Jabatan ---
        const textJabatan = jabatan.map(j => j.join(" ")).join(" ").toLowerCase();
        const matchesTingkat = fTingkat === "Semua" || textJabatan.includes(fTingkat.toLowerCase());
        const matchesJenis = fJenis === "Semua" || textJabatan.includes(fJenis.toLowerCase());
        
        // --- Filter Lainnya ---
        const matchesJK = fJK === "Semua" || p.jk === fJK;
        const matchesAgama = fAgama === "Semua" || p.agama === fAgama;
        const matchesEdu = fEdu === "Semua" || (formal[19] && formal[19].toString().includes(fEdu));

        return matchKota && matchKec && matchDesa && matchesJK && matchesAgama && 
               matchesEdu && matchesKader && matchesTingkat && matchesJenis && matchStatusMadya;
    });

    // 3. Render
    renderTable(filtered);
    updateStats(filtered);
}

// 4. Update Angka Statistik
function updateStats(data) {
    document.getElementById("statTotal").innerText = data.length;
    
    const young = data.filter(i => parseInt(i.pribadi.umur) < 45).length;
    document.getElementById("statYoung").innerText = young;

    const madya = data.filter(i => i.kaderisasi.some(k => k[2].toLowerCase().includes("madya"))).length;
    document.getElementById("statArea").innerText = madya;

    const priority = data.filter(i => {
        const hasM = i.kaderisasi.some(k => k[2].toLowerCase().includes("madya"));
        const pratama = i.kaderisasi.find(k => k[2].toLowerCase().includes("pratama"));
        return !hasM && pratama && (2026 - parseInt(pratama[5]) >= 5);
    }).length;
    document.getElementById("statNeedMadya").innerText = priority;
}

// 5. Pencarian & Toggle
function doSearch() {
    const val = document.getElementById("quickSearch").value.toLowerCase();
    const result = MASTER_DATA.filter(i => 
        i.pribadi.nama.toLowerCase().includes(val) || 
        (i.pribadi.kec && i.pribadi.kec.toLowerCase().includes(val))
    );
    renderTable(result);
}

function toggleFilter() {
    const fBody = document.getElementById("filterBody");
    const icon = document.getElementById("filterIcon");
    // Gunakan class .active dari CSS Bos
    fBody.classList.toggle("active");
    icon.innerText = fBody.classList.contains("active") ? "▲" : "▼";
}

window.onload = loadData;
