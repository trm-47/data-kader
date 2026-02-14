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
        
        // --- FIX FOTO DRIVE ---
        let fotoUrl = "https://ui-avatars.com/api/?name=" + encodeURIComponent(p.nama);
        if (p.foto && p.foto.includes("http")) {
            // Ubah link view Drive ke link direct image
            fotoUrl = p.foto.replace("open?id=", "uc?export=view&id=")
                            .replace("file/d/", "uc?export=view&id=")
                            .replace("/view?usp=sharing", "");
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="text-align:center;">
                <div style="width:45px; height:45px; border-radius:10px; overflow:hidden; border:1px solid #ddd; margin:auto;">
                    <img src="${fotoUrl}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://ui-avatars.com/api/?name=${p.nama}'">
                </div>
            </td>
            <td>
                <div style="font-weight:800;">${p.nama}</div>
                <div style="font-size:11px; color:#64748b;">KTA: ${p.kta || '-'}</div>
            </td>
            <td style="text-align:center; font-weight:700;">${p.umur || '-'}</td>
            <td style="font-size:12px;">${item.formal[19] || '-'}</td>
            <td>${k.map(row => `<span class="badge ${row[2].toLowerCase().includes('madya') ? 'warning-badge' : 'badge-red'}">${row[2]}</span>`).join(" ")}</td>
            <td style="text-align:center;">
                <button onclick="showDetail(${idx})" style="padding:6px 12px; background:var(--primary-red); color:white; border:none; border-radius:8px; font-weight:800; cursor:pointer;">DETAIL</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 3. Logika Filter Gabungan
function applyFilters() {
    let result = [...MASTER_DATA];

    // Ambil nilai filter
    const kota = document.getElementById("fKota").value;
    const jk = document.getElementById("fJK").value;
    const sMadya = document.getElementById("fStatusMadya").value;
    const fKader = document.getElementById("fKader").value;

    if (kota !== "Semua") result = result.filter(i => i.pribadi.kota === kota);
    if (jk !== "Semua") result = result.filter(i => i.pribadi.jk === jk);
    if (fKader !== "Semua") {
        result = result.filter(i => i.kaderisasi.some(k => k[2].toLowerCase().includes(fKader.toLowerCase())));
    }

    // Filter Prioritas Madya
    if (sMadya === "Sudah") {
        result = result.filter(i => i.kaderisasi.some(k => k[2].toLowerCase().includes("madya")));
    } else if (sMadya === "Belum") {
        result = result.filter(i => !i.kaderisasi.some(k => k[2].toLowerCase().includes("madya")));
    } else if (sMadya === "Prioritas") {
        result = result.filter(i => {
            const hasM = i.kaderisasi.some(k => k[2].toLowerCase().includes("madya"));
            const pratama = i.kaderisasi.find(k => k[2].toLowerCase().includes("pratama"));
            return !hasM && pratama && (2026 - parseInt(pratama[5]) >= 5);
        });
    }

    renderTable(result);
    updateStats(result);
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
