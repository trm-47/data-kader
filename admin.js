const URL_GAS = "https://script.google.com/macros/s/AKfycbwAbaGgSWdlZ3AwtPk3Guwu-izM6AIsmf4CrW5WFFytVOQd9jHymA_4SQVU83EiFWBaZA/exec";
let databaseKader = [];

// --- INITIALIZATION ---
window.onload = fetchData;

// --- DATA FETCHING ---
async function fetchData() {
    try {
        console.log("Memulai penarikan data...");
        const response = await fetch(URL_GAS + "?action=read");
        const data = await response.json();

        console.log("Data diterima:", data);

        if (data.error) {
            throw new Error(data.error);
        }

        databaseKader = data;
        renderTable(data);
        updateStats(data);
    } catch (error) {
        console.error("Error Detail:", error);
        document.getElementById('bodyKader').innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; color:red; padding:20px;">
                    Gagal memuat data: ${error.message}<br>
                    <small>Pastikan Deployment GAS sudah benar dan "Anyone" bisa akses.</small>
                </td>
            </tr>`;
    }
}

// --- UTILITY FUNCTIONS ---
function calculateAge(birthDateString) {
    if (!birthDateString || birthDateString === "-") {
        return { age: "-", gen: "-", rawAge: 0 };
    }

    try {
        let birthDate;
        if (birthDateString instanceof Date) {
            birthDate = birthDateString;
        } else {
            if (typeof birthDateString === 'string' && birthDateString.includes('/')) {
                const parts = birthDateString.split('/');
                if (parts.length === 3 && parts[2].length === 4) {
                    birthDate = new Date(parts[2], parts[1] - 1, parts[0]);
                }
            }
            if (!birthDate || isNaN(birthDate.getTime())) {
                birthDate = new Date(birthDateString);
            }
        }

        if (isNaN(birthDate.getTime())) {
            return { age: "-", gen: "-", rawAge: 0 };
        }

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        const year = birthDate.getFullYear();
        let gen = "Lainnya";
        if (year >= 1997 && year <= 2012) gen = "Gen Z";
        else if (year >= 1981 && year <= 1996) gen = "Millennial";
        else if (year >= 1965 && year <= 1980) gen = "Gen X";
        else if (year <= 1964) gen = "Boomer";

        return { age: age + " Thn", gen: gen, rawAge: age };
    } catch (e) {
        console.error("Gagal hitung umur:", e);
        return { age: "-", gen: "-", rawAge: 0 };
    }
}

function formatDriveUrl(url) {
    if (!url || !url.includes("drive.google.com")) return url;
    let fileId = null;
    const idParam = url.split("id=")[1];
    if (idParam) fileId = idParam.split("&")[0];
    if (!fileId && url.includes("/d/")) fileId = url.split("/d/")[1].split("/")[0];
    return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : url;
}

// --- CORE RENDERING (FIXED VERSION) ---
function renderTable(data) {
    const body = document.getElementById('bodyKader');
    if (!body) return;
    body.innerHTML = "";

    if (!data || data.length === 0) {
        body.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:50px;">Data tidak ditemukan.</td></tr>';
        return;
    }

    const displayData = [...data].reverse();

    displayData.forEach((item) => {
        if (!item || !item.pribadi) return;
        const p = item.pribadi;
        const f = item.formal || [];
        const k = item.kaderisasi || [];
        const ageInfo = calculateAge(p.tgl_lahir);

        // --- LOGIKA MENAMPILKAN SEMUA JENJANG KADERISASI ---
        let htmlBadgeKader = "";
        let rowClass = "";
        let badgeWarning = "";

        if (Array.isArray(k) && k.length > 0) {
            // Gabung semua jenjang dari array kaderisasi (Kolom index 2)
            k.forEach(row => {
                const jenjang = row[2] ? row[2].toString().trim() : "";
                if (jenjang && jenjang !== "-") {
                    htmlBadgeKader += `<span class="badge badge-red" style="margin-bottom:2px; display:block; text-align:center; font-size:9px;">${jenjang}</span>`;
                }
            });

            // Logika Prioritas (Pratama > 5 thn & Belum Madya)
            const textKaderLower = k.map(r => r[2].toString().toLowerCase()).join(" ");
            const isMadya = textKaderLower.includes("madya");
            const pratamaRow = k.find(r => r[2].toString().toLowerCase().includes("pratama"));

            if (pratamaRow && !isMadya) {
                const thnPratama = parseInt(pratamaRow[5]);
                if (thnPratama) {
                    const masaTunggu = new Date().getFullYear() - thnPratama;
                    if (masaTunggu >= 5) {
                        rowClass = "urgent-row";
                        badgeWarning = `<br><span class="urgent-badge">🚨 PRIORITAS MADYA (${masaTunggu} Thn)</span>`;
                    } else {
                        rowClass = "warning-row";
                        badgeWarning = `<br><span class="warning-badge">⚠️ MASA TUNGGU (${masaTunggu} Thn)</span>`;
                    }
                }
            }
        } 
        
        if (!htmlBadgeKader) htmlBadgeKader = `<span class="badge badge-gray">Anggota</span>`;

        // --- WHATSAPP ---
        const waNumber = p.wa ? p.wa.toString().replace(/[^0-9]/g, '') : '';
        const waLink = waNumber ? `https://wa.me/${waNumber.startsWith('0') ? '62' + waNumber.slice(1) : waNumber}` : '#';
        const btnWA = waNumber ?
            `<a href="${waLink}" target="_blank" onclick="event.stopPropagation()" style="background:#25D366; color:white; padding:6px 12px; border-radius:8px; text-decoration:none; font-size:11px; font-weight:bold; display:inline-flex; align-items:center; gap:5px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">💬 Chat</a>` :
            `<span style="color:#cbd5e1; font-size:10px;">-</span>`;

        // --- PENDIDIKAN ---
        let infoPendidikan = `<span class="badge badge-gray">${p.kec || '-'}</span>`;
        const listEdu = [
            { label: "S3", idx: 17 }, { label: "S2", idx: 15 }, { label: "S1", idx: 11 },
            { label: "D1-D3", idx: 9 }, { label: "SMA/SMK", idx: 6 }, { label: "SMP", idx: 4 }, { label: "SD", idx: 2 }
        ];
        for (let edu of listEdu) {
            if (f[edu.idx] && f[edu.idx].toString().trim() !== "" && f[edu.idx] !== "-") {
                let detail = (edu.label === "S1") ? `<br><small>${(f[12] && f[12] !== "-") ? f[12] : f[11]}</small>` : `<br><small>${f[edu.idx]}</small>`;
                infoPendidikan = `<strong>${edu.label}</strong>${detail}`;
                break;
            }
        }

        const originalIdx = databaseKader.indexOf(item);

        body.innerHTML += `
            <tr class="${rowClass}" onclick="openDetail(${originalIdx})">
                <td data-label="Foto">
                    <img src="${formatDriveUrl(p.foto)}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=random'" style="width:45px; height:45px; border-radius:10px; object-fit:cover;">
                </td>
                <td data-label="Identitas">
                    <strong style="font-size:15px;">${p.nama || 'Tanpa Nama'}</strong>${badgeWarning}
                    <br>
                    <small style="color: #D71920; font-weight: 700;">No. KTA: ${p.kta || '-'}</small>
                </td>
                <td data-label="Usia" style="text-align:center;">
                    ${ageInfo.age}<br><span class="badge badge-gray">${ageInfo.gen}</span>
                </td>
                <td data-label="Pendidikan">
                    ${infoPendidikan}
                </td>
                <td data-label="Kaderisasi">
                    <div style="display:flex; flex-direction:column; gap:2px;">${htmlBadgeKader}</div>
                </td>
                <td data-label="Aksi" style="text-align:center;">
                    ${btnWA}
                </td>
            </tr>`;
    });
}

function updateStats(data) {
    if (!data || data.length === 0) {
        document.querySelectorAll('.stat-card h2').forEach(el => el.innerText = "-");
        return;
    }
    const total = data.length;
    let youth = 0, madyaCount = 0, needMadyaCount = 0;
    data.forEach(item => {
        const p = item.pribadi || {};
        const k = item.kaderisasi || [];
        if (p.tgl_lahir) {
            const ageInfo = calculateAge(p.tgl_lahir);
            if (ageInfo.gen === "Gen Z" || ageInfo.gen === "Millennial") youth++;
        }
        const textKader = k.map(r => r[2].toString().toLowerCase()).join(" ");
        if (textKader.includes("madya")) {
            madyaCount++;
        } else if (textKader.includes("pratama")) {
            needMadyaCount++;
        }
    });
    document.getElementById('statTotal').innerText = total;
    document.getElementById('statYoung').innerText = youth + " (" + Math.round((youth / total) * 100) + "%)";
    document.getElementById('statNeedMadya').innerText = needMadyaCount;
    document.getElementById('statArea').innerText = madyaCount + " (" + Math.round((madyaCount / total) * 100) + "%)";
}

// --- FILTER & SEARCH LOGIC ---
function toggleFilter() {
    const body = document.getElementById('filterBody');
    const icon = document.getElementById('filterIcon');
    body.classList.toggle('active');
    icon.innerText = body.classList.contains('active') ? '▲' : '▼';
}

function doSearch() {
    const val = document.getElementById('quickSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#bodyKader tr');
    rows.forEach(row => {
        if (row.cells.length < 2) return;
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(val) ? "" : "none";
    });
}

function resetFilters() {
    document.querySelectorAll('.filter-body select').forEach(s => s.value = 'Semua');
    document.querySelectorAll('.filter-body input').forEach(i => i.value = '');
    const qs = document.getElementById('quickSearch');
    if (qs) qs.value = '';
    applyFilters();
}

function applyFilters() {
    const fKota = document.getElementById('fKota').value;
    const fKec = document.getElementById('fKec').value;
    const fDesa = document.getElementById('fDesa').value;
    const fJK = document.getElementById('fJK').value;
    const fAgama = document.getElementById('fAgama').value;
    const fEdu = document.getElementById('fPendidikan').value;
    const fKader = document.getElementById('fKader').value;
    const fTingkat = document.getElementById('fTingkat').value;
    const fJenis = document.getElementById('fJenisTugas').value;
    const fBahasa = document.getElementById('fBahasa').value;
    const fIT = document.getElementById('fIT').value;
    const fStatusMadya = document.getElementById('fStatusMadya').value;

    const filtered = databaseKader.filter(item => {
        const p = item.pribadi || {};
        const formal = item.formal || [];
        const kader = item.kaderisasi || [];
        const medsos = item.medsos || [];
        const jabatan = item.jabatan || [];

        const matchKota = fKota === "Semua" || (p.kab_kota === fKota) || (p.kota === fKota);
        const matchKec = fKec === "Semua" || (p.kec === fKec);
        const matchDesa = fDesa === "Semua" || (p.desa === fDesa);

        const textKader = kader.map(r => r[2].toString().toLowerCase()).join(" ");
        let matchesKader = (fKader === "Semua") || textKader.includes(fKader.toLowerCase());

        const currentYear = new Date().getFullYear();
        const isMadya = textKader.includes("madya");
        const hasPratama = textKader.includes("pratama");
        
        const pratamaRow = kader.find(r => r[2].toString().toLowerCase().includes("pratama"));
        const thnPratama = pratamaRow ? parseInt(pratamaRow[5]) : 0;
        const masaTunggu = thnPratama > 0 ? (currentYear - thnPratama) : 0;

        let matchStatusMadya = true;
        if (fStatusMadya === "Sudah") matchStatusMadya = isMadya;
        else if (fStatusMadya === "Belum") matchStatusMadya = !isMadya;
        else if (fStatusMadya === "Prioritas") matchStatusMadya = (hasPratama && !isMadya && masaTunggu >= 5);
        
        const textJabatan = jabatan.map(j => j.join(" ")).join(" ").toLowerCase();
        const matchesTingkat = fTingkat === "Semua" || textJabatan.includes(fTingkat.toLowerCase());
        const matchesJenis = fJenis === "Semua" || textJabatan.includes(fJenis.toLowerCase());
        
        const valBahasa = medsos[3] ? medsos[3].toString().trim() : "-";
        const matchesBahasa = fBahasa === "Semua" || (fBahasa === "Ya" ? (valBahasa !== "-" && valBahasa !== "") : (valBahasa === "-" || valBahasa === ""));
        
        const valIT = medsos[8] ? medsos[8].toString().trim() : "-";
        const matchesIT = fIT === "Semua" || (fIT === "Ya" ? (valIT !== "-" && valIT !== "") : (valIT === "-" || valIT === ""));
        
        const matchesJK = fJK === "Semua" || p.jk === fJK;
        const matchesAgama = fAgama === "Semua" || p.agama === fAgama;
        const matchesEdu = fEdu === "Semua" || (formal[19] && formal[19].toString().includes(fEdu));

        return matchKota && matchKec && matchDesa && matchesJK && matchesAgama && 
               matchesEdu && matchesKader && matchesTingkat && matchesJenis && 
               matchesBahasa && matchesIT && matchStatusMadya;
    });

    renderTable(filtered);
    updateStats(filtered);
}

// --- MODAL DETAIL LOGIC ---
function openDetail(originalIndex) {
    const item = databaseKader[originalIndex];
    if (!item) return;
    const p = item.pribadi || {};
    const f = item.formal || [];
    const k = item.kaderisasi || [];
    const ageInfo = calculateAge(p.tgl_lahir);

    // Pemetaan Tahun Kaderisasi untuk Analisa
    const mapKader = {};
    if (Array.isArray(k)) {
        k.forEach(row => {
            const jenjang = row[2].toString().toUpperCase();
            if (jenjang.includes("PRATAMA")) mapKader.PRATAMA = row[5];
            if (jenjang.includes("MADYA")) mapKader.MADYA = row[5];
            if (jenjang.includes("UTAMA")) mapKader.UTAMA = row[5];
            if (jenjang.includes("GURU")) mapKader.GURU = row[5];
            if (jenjang.includes("WANITA") || jenjang.includes("PEREMPUAN")) mapKader.WANITA = row[5];
        });
    }

    const listAnalisa = [
        { label: 'PRATAMA', year: mapKader.PRATAMA, color: '#ef4444' },
        { label: 'MADYA', year: mapKader.MADYA, color: '#dc2626' },
        { label: 'UTAMA', year: mapKader.UTAMA, color: '#b91c1c' },
        { label: 'GURU', year: mapKader.GURU, color: '#991b1b' },
        { label: 'WANITA', year: mapKader.WANITA, color: '#db2777' }
    ];

    let htmlContent = `
        <div style="text-align:center; margin-bottom:30px; background: linear-gradient(135deg, #fff1f2 0%, #ffffff 100%); padding: 40px 20px; border-radius: 0 0 50px 50px; margin: -30px -30px 30px -30px; border-bottom: 2px solid #fee2e2;">
            <div style="position: relative; display: inline-block;">
                <img src="${formatDriveUrl(p.foto)}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=D71920&color=fff&size=128'" style="width:140px; height:140px; border-radius:50%; object-fit:cover; border: 6px solid white; box-shadow: 0 15px 35px rgba(215,25,32,0.2);">
            </div>
            <h2 style="margin-top:20px; color:#1e293b; font-size:26px; font-weight:800;">${(p.nama || '-').toUpperCase()}</h2>
            <p style="color:#D71920; font-weight:800;">ID KADER: ${p.kta || '-'}</p>
        </div>
        <div class="profile-section">
            <div class="section-title">Identitas Pribadi</div>
            <div class="data-grid">
                <div class="data-item"><label>Usia</label><span>${ageInfo.age} (${ageInfo.gen})</span></div>
                <div class="data-item"><label>WhatsApp</label><span>${p.wa || '-'}</span></div>
                <div class="data-item" style="grid-column: span 2;"><label>Alamat</label><span>${p.desa}, ${p.kec}, ${p.kota}</span></div>
            </div>
        </div>
        <div class="profile-section" style="border: 2px solid #D71920; border-radius: 20px; padding: 20px;">
            <h3 style="font-size: 14px; font-weight: 800; margin-bottom: 20px;">ANALISA JENJANG KADERISASI</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px;">
                ${listAnalisa.map(lvl => {
                    const cYear = new Date().getFullYear();
                    const isStagnan = (lvl.label === 'PRATAMA' && lvl.year && !mapKader.MADYA && (cYear - parseInt(lvl.year)) >= 5);
                    return `
                    <div style="text-align: center; padding: 10px; border-radius: 12px; border: 2px solid ${lvl.year ? lvl.color : '#f1f5f9'}; background: ${isStagnan ? '#fff1f2' : '#fff'}">
                        <div style="font-size: 9px; font-weight: 800;">${lvl.label}</div>
                        <div style="font-size: 14px; font-weight: 900; color: ${lvl.color}">${lvl.year || '—'}</div>
                        ${isStagnan ? '<div style="font-size:7px; background:#be123c; color:white; padding:2px; border-radius:4px;">STAGNAN</div>' : ''}
                    </div>`;
                }).join('')}
            </div>
        </div>
        <div style="text-align:center; padding-top:20px;">
             <button onclick="window.print()" style="background:#1e293b; color:white; border:none; padding:10px 20px; border-radius:10px; cursor:pointer;">CETAK PROFIL</button>
        </div>`;

    document.getElementById('modalInnerContent').innerHTML = htmlContent;
    document.getElementById('modalDetail').style.display = "block";
}

function closeDetail() { document.getElementById('modalDetail').style.display = "none"; }
window.onclick = function(e) { if (e.target == document.getElementById('modalDetail')) closeDetail(); }
document.addEventListener('keydown', e => { if (e.key === "Escape") closeDetail(); });

function updateKecamatanOptions() {
    const selectedKota = document.getElementById('fKota').value;
    const kecSelect = document.getElementById('fKec');
    kecSelect.innerHTML = '<option value="Semua">Semua Kecamatan</option>';
    if (selectedKota !== "Semua") {
        const filtered = databaseKader.filter(item => (item.pribadi.kab_kota === selectedKota || item.pribadi.kota === selectedKota));
        const uniqueKec = [...new Set(filtered.map(item => item.pribadi.kec))].filter(Boolean).sort();
        uniqueKec.forEach(kec => kecSelect.innerHTML += `<option value="${kec}">${kec}</option>`);
    }
    applyFilters();
}

function updateDesaOptions() {
    const selectedKota = document.getElementById('fKota').value;
    const selectedKec = document.getElementById('fKec').value;
    const desaSelect = document.getElementById('fDesa');
    desaSelect.innerHTML = '<option value="Semua">Semua Kelurahan/Desa</option>';
    if (selectedKec !== "Semua") {
        const filtered = databaseKader.filter(item => (item.pribadi.kab_kota === selectedKota || item.pribadi.kota === selectedKota) && item.pribadi.kec === selectedKec);
        const uniqueDesa = [...new Set(filtered.map(item => item.pribadi.desa))].filter(Boolean).sort();
        uniqueDesa.forEach(desa => desaSelect.innerHTML += `<option value="${desa}">${desa}</option>`);
    }
    applyFilters();
}
