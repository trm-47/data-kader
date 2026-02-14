const GAS_URL = "https://script.google.com/macros/s/AKfycbz8ZZRmcSQsJm1m4VXk85311WDYMisGczcvZfm4j086FXjLNRobp7Q0hj9KEflmilWL2w/exec";
let MASTER_DATA = [];
let FILTERED_DATA = [];

// 1. Ambil Data dari Google Sheets
async function loadData() {
    try {
        const response = await fetch(GAS_URL + "?action=read", { redirect: "follow" });
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);

        MASTER_DATA = data;
        FILTERED_DATA = [...MASTER_DATA];
        
        renderTable(FILTERED_DATA);
        updateStats(FILTERED_DATA);
    } catch (e) {
        document.getElementById("bodyKader").innerHTML = `<tr><td colspan="6" style="text-align:center; color:red; padding:30px;">Gagal memuat: ${e.message}</td></tr>`;
    }
}

// 2. Update Kotak Statistik di Atas
function updateStats(data) {
    const total = data.length;
    const young = data.filter(item => {
        const umur = parseInt(item.pribadi.umur);
        return umur > 0 && umur <= 44; // Estimasi Gen Z & Milenial
    }).length;

    const madyaList = data.filter(item => 
        item.kaderisasi.some(k => k[2].toLowerCase().includes("madya"))
    );
    
    // Hitung Prioritas (Sudah Pratama > 5 tahun tapi belum Madya)
    const priority = data.filter(item => {
        const hasMadya = item.kaderisasi.some(k => k[2].toLowerCase().includes("madya"));
        const pratama = item.kaderisasi.find(k => k[2].toLowerCase().includes("pratama"));
        const thnPratama = pratama ? parseInt(pratama[5]) : 0;
        return !hasMadya && pratama && (2026 - thnPratama >= 5);
    }).length;

    document.getElementById("statTotal").innerText = total;
    document.getElementById("statYoung").innerText = young;
    document.getElementById("statNeedMadya").innerText = priority;
    document.getElementById("statArea").innerText = madyaList.length;
}

// 3. Render Tabel (Gunakan ID bodyKader)
function renderTable(data) {
    const tbody = document.getElementById("bodyKader");
    tbody.innerHTML = "";

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px;">Data tidak ditemukan.</td></tr>';
        return;
    }

    data.forEach((item, idx) => {
        const p = item.pribadi;
        const k = item.kaderisasi || [];
        
        // Cek status prioritas untuk styling
        const hasMadya = k.some(row => row[2].toLowerCase().includes("madya"));
        const pratama = k.find(row => row[2].toLowerCase().includes("pratama"));
        const isUrgent = (!hasMadya && pratama && (2026 - parseInt(pratama[5]) >= 5));

        const badges = k.map(row => `<span class="badge" style="background:#fee2e2; color:#b91c1c; font-size:10px; padding:2px 5px; margin:1px; border-radius:3px; display:inline-block;">${row[2]}</span>`).join("");

        const tr = document.createElement("tr");
        if (isUrgent) tr.style.backgroundColor = "#fff1f2";

        tr.innerHTML = `
            <td><img src="${p.foto || 'https://ui-avatars.com/api/?name='+p.nama}" style="width:45px; height:45px; border-radius:8px; object-fit:cover;"></td>
            <td>
                <strong>${p.nama}</strong><br>
                <small style="color:#666">${p.kta || '-'}</small>
            </td>
            <td style="text-align:center;">${p.umur || '-'}</td>
            <td>${item.formal[19] || '-'}</td>
            <td>${badges || '<small style="color:#ccc">Anggota</small>'}</td>
            <td style="text-align:center;">
                <button onclick="showDetail(${idx})" style="padding:5px 10px; cursor:pointer; background:#D71920; color:white; border:none; border-radius:4px; font-size:12px;">Detail</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 4. Fungsi Pencarian Cepat
function doSearch() {
    const val = document.getElementById("quickSearch").value.toLowerCase();
    const result = MASTER_DATA.filter(item => 
        item.pribadi.nama.toLowerCase().includes(val) || 
        (item.pribadi.nik && item.pribadi.nik.includes(val)) ||
        (item.pribadi.kec && item.pribadi.kec.toLowerCase().includes(val))
    );
    renderTable(result);
}

// 5. Modal Detail
function showDetail(idx) {
    // Ambil dari FILTERED_DATA agar indexnya cocok saat difilter
    const item = MASTER_DATA[idx]; 
    const p = item.pribadi;
    const k = item.kaderisasi;

    const html = `
        <div style="display:flex; gap:20px; align-items:start;">
            <img src="${p.foto}" width="120" style="border-radius:10px;">
            <div>
                <h2 style="margin:0">${p.nama}</h2>
                <p style="color:#D71920; font-weight:bold;">KTA: ${p.kta || '-'}</p>
                <p><b>Wilayah:</b> ${p.kec}, ${p.kota}</p>
                <p><b>WA:</b> ${p.wa || '-'}</p>
            </div>
        </div>
        <hr style="margin:15px 0; border:0; border-top:1px solid #eee;">
        <p><b>Pendidikan Terakhir:</b> ${item.formal[19] || '-'}</p>
        <p><b>Riwayat Kaderisasi:</b><br> ${k.map(r => r[2] + " (" + r[5] + ")").join(", ") || '-'}</p>
    `;
    document.getElementById("modalInnerContent").innerHTML = html;
    document.getElementById("modalDetail").style.display = "block";
}

function closeDetail() {
    document.getElementById("modalDetail").style.display = "none";
}

// 6. Fungsi Filter (Sederhana)
function applyFilters() {
    let result = [...MASTER_DATA];
    
    const kota = document.getElementById("fKota").value;
    const jk = document.getElementById("fJK").value;
    const statusMadya = document.getElementById("fStatusMadya").value;

    if (kota !== "Semua") result = result.filter(i => i.pribadi.kota === kota);
    if (jk !== "Semua") result = result.filter(i => i.pribadi.jk === jk);
    
    if (statusMadya === "Sudah") {
        result = result.filter(i => i.kaderisasi.some(k => k[2].toLowerCase().includes("madya")));
    } else if (statusMadya === "Prioritas") {
        result = result.filter(i => {
            const hasMadya = i.kaderisasi.some(k => k[2].toLowerCase().includes("madya"));
            const pratama = i.kaderisasi.find(k => k[2].toLowerCase().includes("pratama"));
            return !hasMadya && pratama && (2026 - parseInt(pratama[5]) >= 5);
        });
    }

    renderTable(result);
    updateStats(result);
}

// Fungsi bantu untuk toggle filter di mobile
function toggleFilter() {
    const body = document.getElementById("filterBody");
    body.style.display = body.style.display === "block" ? "none" : "block";
}

window.onload = loadData;
