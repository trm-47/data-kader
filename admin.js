const GAS_URL = "https://script.google.com/macros/s/AKfycbz8ZZRmcSQsJm1m4VXk85311WDYMisGczcvZfm4j086FXjLNRobp7Q0hj9KEflmilWL2w/exec";
let MASTER_DATA = [];

// 1. Load Data
async function loadData() {
    try {
        const response = await fetch(GAS_URL + "?action=read", { redirect: "follow" });
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        // Terbaru di atas
        MASTER_DATA = data.reverse();
        
        applyFilters(); // Panggil filter pertama kali untuk render awal
    } catch (e) {
        document.getElementById("bodyKader").innerHTML = `<tr><td colspan="6" style="text-align:center; color:red; padding:30px;">Gagal memuat: ${e.message}</td></tr>`;
    }
}

// 2. Render Tabel dengan Style CSS Bos
function renderTable(data) {
    const tbody = document.getElementById("bodyKader");
    if (!tbody) return;
    tbody.innerHTML = "";

    data.forEach((item, idx) => {
        const p = item.pribadi || {};
        const k = item.kaderisasi || [];
        const f = item.formal || [];
        
        // Logika Prioritas Madya (Urgent)
        const hasMadya = k.some(row => row[2].toLowerCase().includes("madya"));
        const pratama = k.find(row => row[2].toLowerCase().includes("pratama"));
        const waitTime = (pratama && !hasMadya) ? (2026 - parseInt(pratama[5])) : 0;
        const isUrgent = waitTime >= 5;

        // Badge Kaderisasi
        const badges = k.map(row => {
            const isMadya = row[2].toLowerCase().includes("madya");
            return `<span class="badge ${isMadya ? 'warning-badge' : 'badge-red'}">${row[2]}</span>`;
        }).join(" ");

        const tr = document.createElement("tr");
        if (isUrgent) tr.className = "urgent-row";

        tr.innerHTML = `
            <td style="text-align:center;">
                <img src="${p.foto || 'https://ui-avatars.com/api/?name='+p.nama}" style="width:50px; height:50px; border-radius:12px; object-fit:cover;">
            </td>
            <td>
                <div style="font-weight:800; color:var(--dark-slate);">${p.nama}</div>
                <div style="font-size:11px; color:#64748b;">${p.kta || 'KTA -'}</div>
                ${isUrgent ? `<span class="urgent-badge">STAGNAN ${waitTime} THN</span>` : ''}
            </td>
            <td style="text-align:center; font-weight:700;">${p.umur || '-'}</td>
            <td style="font-size:12px; font-weight:600;">${f[19] || '-'}</td>
            <td>${badges || '<span class="badge badge-gray">Anggota</span>'}</td>
            <td style="text-align:center;">
                <button onclick="showDetail(${idx})" style="padding:8px 15px; background:var(--primary-red); color:white; border:none; border-radius:12px; font-size:11px; font-weight:800; cursor:pointer;">DETAIL</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 3. Update Statistik
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

// 4. Filter Gabungan (PENTING: Gunakan MASTER_DATA aslinya)
function applyFilters() {
    let result = [...MASTER_DATA];

    const filters = {
        kota: document.getElementById("fKota").value,
        jk: document.getElementById("fJK").value,
        agama: document.getElementById("fAgama").value,
        pend: document.getElementById("fPendidikan").value,
        kader: document.getElementById("fKader").value,
        status: document.getElementById("fStatusMadya").value
    };

    if (filters.kota !== "Semua") result = result.filter(i => i.pribadi.kota === filters.kota);
    if (filters.jk !== "Semua") result = result.filter(i => i.pribadi.jk === filters.jk);
    if (filters.agama !== "Semua") result = result.filter(i => i.pribadi.agama === filters.agama);
    if (filters.pend !== "Semua") result = result.filter(i => i.formal[19] === filters.pend);
    
    if (filters.kader !== "Semua") {
        result = result.filter(i => i.kaderisasi.some(k => k[2].toLowerCase().includes(filters.kader.toLowerCase())));
    }

    if (filters.status === "Sudah") {
        result = result.filter(i => i.kaderisasi.some(k => k[2].toLowerCase().includes("madya")));
    } else if (filters.status === "Prioritas") {
        result = result.filter(i => {
            const hasM = i.kaderisasi.some(k => k[2].toLowerCase().includes("madya"));
            const pratama = i.kaderisasi.find(k => k[2].toLowerCase().includes("pratama"));
            return !hasM && pratama && (2026 - parseInt(pratama[5]) >= 5);
        });
    }

    renderTable(result);
    updateStats(result);
}

// 5. Pencarian Cepat
function doSearch() {
    const val = document.getElementById("quickSearch").value.toLowerCase();
    const result = MASTER_DATA.filter(i => 
        i.pribadi.nama.toLowerCase().includes(val) || 
        (i.pribadi.kec && i.pribadi.kec.toLowerCase().includes(val))
    );
    renderTable(result);
}

// 6. Toggle Filter (Sesuai Kelas .active di CSS Bos)
function toggleFilter() {
    const fBody = document.getElementById("filterBody");
    fBody.classList.toggle("active");
    const icon = document.getElementById("filterIcon");
    icon.innerText = fBody.classList.contains("active") ? "▲" : "▼";
}

// 7. Reset
function resetFilters() {
    document.querySelectorAll('select').forEach(s => s.value = "Semua");
    document.getElementById("quickSearch").value = "";
    applyFilters();
}

window.onload = loadData;
