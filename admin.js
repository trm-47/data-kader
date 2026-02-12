const URL_GAS = "https://script.google.com/macros/s/AKfycbzQA3fNn9ZcnXqfGL0yBA2SqFVx9MAQjLniltAkb5_0SHA2OGKTSXp3xpgVRVb6X7fq7g/exec";
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

    // Format ...?id=FILE_ID
    const idParam = url.split("id=")[1];
    if (idParam) {
        fileId = idParam.split("&")[0];
    }

    // Format .../d/FILE_ID/
    if (!fileId && url.includes("/d/")) {
        fileId = url.split("/d/")[1].split("/")[0];
    }

    if (fileId) {
        return `https://lh3.googleusercontent.com/d/${fileId}`;
    }

    return url;
}


// --- CORE RENDERING ---
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

        // 1. Logika Stagnan (Warning) - Update Progresif
        const currentYear = new Date().getFullYear();
        const hasPratama = k[2] && k[2] !== "" && k[2] !== "-";
        const noMadya = !k[4] || k[4] === "" || k[4] === "-";
        
        let rowClass = "";
        let badgeWarning = "";

        if (hasPratama && noMadya) {
            const tahunPratama = parseInt(k[2]);
            const masaTunggu = currentYear - tahunPratama;

            if (masaTunggu > 5) {
                rowClass = "urgent-row"; // Class untuk CSS Merah (🚨 PRIORITAS)
                badgeWarning = `<br><span class="urgent-badge">🚨 PRIORITAS MADYA (> ${masaTunggu} Thn)</span>`;
            } else {
                rowClass = "warning-row"; // Class untuk CSS Kuning (⚠️ BUTUH)
                badgeWarning = `<br><span class="warning-badge">⚠️ BUTUH MADYA (${masaTunggu} Thn)</span>`;
            }
        }

        // 2. Logika WhatsApp
        const waNumber = p.wa ? p.wa.toString().replace(/[^0-9]/g, '') : '';
        const waLink = waNumber ? `https://wa.me/${waNumber.startsWith('0') ? '62' + waNumber.slice(1) : waNumber}` : '#';
        const btnWA = waNumber ?
            `<a href="${waLink}" target="_blank" onclick="event.stopPropagation()" style="background:#25D366; color:white; padding:6px 12px; border-radius:8px; text-decoration:none; font-size:11px; font-weight:bold; display:inline-flex; align-items:center; gap:5px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">💬 Chat</a>` :
            `<span style="color:#cbd5e1; font-size:10px;">-</span>`;

        // 3. Logika Pendidikan
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

        // 4. Logika Badge Kaderisasi
        let htmlBadgeKader = "";
        const listJenjang = [["Guru", 8], ["Utama", 6], ["Madya", 4], ["Pratama", 2], ["Kader Perempuan", 10]];
        listJenjang.forEach(jenjang => {
            if (k[jenjang[1]] && k[jenjang[1]] !== "" && k[jenjang[1]] !== "-") {
                htmlBadgeKader += `<span class="badge badge-red" style="margin-bottom:2px; display:block; text-align:center;">${jenjang[0]} (${k[jenjang[1]]})</span>`;
            }
        });
        if (htmlBadgeKader === "") htmlBadgeKader = `<span class="badge badge-gray">Anggota</span>`;

        const originalIdx = databaseKader.indexOf(item);

        body.innerHTML += `
            <tr class="${rowClass}" onclick="openDetail(${originalIdx})">
                <td data-label="Foto">
                    <img src="${formatDriveUrl(p.foto)}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=random'" style="width:45px; height:45px; border-radius:10px; object-fit:cover;">
                </td>
                <td data-label="Identitas">
                    <strong>${p.nama || 'Tanpa Nama'}</strong>${badgeWarning}<br><small>${p.nik || '-'}</small>
                </td>
                <td data-label="Usia" style="text-align:center;">
                    ${ageInfo.age}<br><span class="badge badge-gray">${ageInfo.gen}</span>
                </td>
                <td data-label="Pendidikan">
                    ${infoPendidikan}
                </td>
                <td data-label="Kaderisasi">
                    ${htmlBadgeKader}
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
    const currentYear = new Date().getFullYear();
    
    let youth = 0;
    let madyaCount = 0;
    let needMadyaCount = 0; // Gabungan Butuh & Prioritas

    data.forEach(item => {
        const p = item.pribadi || {};
        const k = item.kaderisasi || [];

        // 1. Hitung Gen Z & Milenial
        if (p.tgl_lahir) {
            const ageInfo = calculateAge(p.tgl_lahir);
            if (ageInfo.gen === "Gen Z" || ageInfo.gen === "Millennial") {
                youth++;
            }
        }

        // 2. Hitung Kader Madya Existing
        const isMadya = k[4] && k[4] !== "-" && k[4] !== "";
        if (isMadya) {
            madyaCount++;
        }

        // 3. Hitung Butuh & Prioritas Madya
        // Logika: Punya Pratama tapi Belum Madya
        const hasPratama = k[2] && k[2] !== "" && k[2] !== "-";
        if (hasPratama && !isMadya) {
            needMadyaCount++;
        }
    });

    // Masukkan ke Tampilan
    document.getElementById('statTotal').innerText = total;
    
    // Gen Z & Milenial
    document.getElementById('statYoung').innerText = youth + " (" + Math.round((youth / total) * 100) + "%)";
    
    // Butuh & Prioritas Madya (Kuning/Orange)
    document.getElementById('statNeedMadya').innerText = needMadyaCount;
    
    // Total Kader Madya Existing
    const areaCard = document.getElementById('statArea');
    areaCard.innerText = madyaCount + " (" + Math.round((madyaCount / total) * 100) + "%)";
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
    const fKec = document.getElementById('fKec').value; // Sekarang ambil .value dari select
    const fDesa = document.getElementById('fDesa').value; // Sekarang ambil .value dari select
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

        let matchesKader = (fKader === "Semua");
        if (!matchesKader) {
            const mappingKader = { "Pratama": 2, "Madya": 4, "Utama": 6, "Guru": 8, "Perempuan": 10 };
            const targetIdx = mappingKader[fKader];
            const hasSertifikat = (kader[targetIdx] && kader[targetIdx] !== "" && kader[targetIdx] !== "-");
            matchesKader = (fKader === "Perempuan") ? (hasSertifikat && (p.jk === "P" || p.jk === "Perempuan")) : hasSertifikat;
        }

        const isMadya = kader[4] && kader[4] !== "" && kader[4] !== "-";
        
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
    const j = item.jabatan || [];
    const w = item.riwayat_kerja || [];
    const m = item.medsos || [];
    const org = item.organisasi || [];
    const ageInfo = calculateAge(p.tgl_lahir);

    let htmlContent = `
        <div style="text-align:center; margin-bottom:30px; background: linear-gradient(135deg, #fff1f2 0%, #ffffff 100%); padding: 40px 20px; border-radius: 0 0 50px 50px; margin: -30px -30px 30px -30px; border-bottom: 2px solid #fee2e2;">
            <div style="position: relative; display: inline-block;">
                <img src="${formatDriveUrl(p.foto)}" 
                     onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=D71920&color=fff&size=128'"
                     style="width:140px; height:140px; border-radius:50%; object-fit:cover; border: 6px solid white; box-shadow: 0 15px 35px rgba(215,25,32,0.2);">
                <div style="position:absolute; bottom:5px; right:5px; background:white; padding:5px; border-radius:50%; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
                    <img src="https://i.ibb.co.com/N2K0XRMW/logo-pdi.png" style="width:25px; height:auto;">
                </div>
            </div>
            <h2 style="margin-top:20px; color:#1e293b; font-size:26px; font-weight:800; letter-spacing:-0.5px;">${p.nama ? p.nama.toUpperCase() : '-'}</h2>
            <p style="color:#D71920; font-weight:800; font-size:14px; margin-top:5px;">ID KADER: ${p.kta || '-'}</p>
        </div>

        <div class="profile-section">
            <div class="section-title">Identitas Pribadi</div>
            <div class="data-grid">
                <div class="data-item"><label>NIK</label><span>${p.nik || '-'}</span></div>
                <div class="data-item"><label>Jenis Kelamin</label><span>${p.jk || '-'}</span></div>
                <div class="data-item"><label>Tempat, Tgl Lahir</label><span>${p.tmpt_lahir || '-'}, ${p.tgl_lahir || '-'}</span></div>
                <div class="data-item"><label>Usia</label><span>${ageInfo.age} (${ageInfo.gen})</span></div>
                <div class="data-item"><label>Agama</label><span>${p.agama || '-'}</span></div>
                <div class="data-item"><label>Pekerjaan Utama</label><span>${p.kerja_skrg || '-'}</span></div>
                <div class="data-item"><label>WhatsApp</label><span>${p.wa || '-'}</span></div>
                <div class="data-item"><label>Email</label><span>${p.email || '-'}</span></div>
                <div class="data-item" style="grid-column: span 2;"><label>Alamat Domisili</label><span>${p.alamat || '-'}, RT ${p.rt}/RW ${p.rw}, ${p.desa}, ${p.kec}, ${p.kota}</span></div>
            </div>
        </div>

        <div class="profile-section">
            <div class="section-title">Pendidikan Formal</div>
            <div class="data-grid">
                ${f[2] ? `<div class="data-item"><label>SD</label><span>${f[2]} (${f[3] || ''})</span></div>` : ''}
                ${f[4] ? `<div class="data-item"><label>SMP</label><span>${f[4]} (${f[5] || ''})</span></div>` : ''}
                ${f[6] ? `<div class="data-item"><label>SMA/SMK</label><span>${f[6]} (${f[8] || ''})</span></div>` : ''}
                ${f[9] ? `<div class="data-item"><label>Diploma (D1-D4)</label><span>${f[9]} (${f[10] || ''})</span></div>` : ''}
                ${f[11] ? `<div class="data-item"><label>Sarjana (S1)</label><span>${f[11]} - ${f[12] || ''} (${f[14] || ''})</span></div>` : ''}
                ${f[15] ? `<div class="data-item"><label>Magister (S2)</label><span>${f[15]} (${f[16] || ''})</span></div>` : ''}
                ${f[17] ? `<div class="data-item"><label>Doktor (S3)</label><span>${f[17]} (${f[18] || ''})</span></div>` : ''}
            </div>
        </div>

        <div class="profile-section">
            <div class="section-title">Riwayat Jabatan & Penugasan</div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${j.length > 0 ? j.map(jab => {
                    let kategori = jab[2] || "Penugasan";
                    let tingkat = jab[4] && jab[4] !== "-" ? jab[4].toUpperCase() : "";
                    let penugasanUtama = jab[5] && jab[5] !== "-" ? jab[5] : "";
                    let detailJabatan = jab[12] && jab[12] !== "-" ? jab[12] : "";
                    let namaJabatanLengkap = (penugasanUtama && detailJabatan) ? `${penugasanUtama} - ${detailJabatan}` : (penugasanUtama || detailJabatan || "-");
                    return `
                    <div style="background: #f1f5f9; padding:15px; border-radius:12px; border-left: 4px solid #D71920;">
                        <div style="font-size:10px; font-weight:800; color:#64748b; text-transform:uppercase;">${kategori} ${tingkat ? `(${tingkat})` : ''}</div>
                        <div style="font-size:15px; font-weight:700; color:#1e293b; margin-top:3px;">${namaJabatanLengkap}</div>
                        <div style="font-size:12px; color:#475569; margin-top:5px;">Periode: ${jab[8] || jab[14] || '-'}</div>
                    </div>`;
                }).join('') : '<p style="text-align:center; color:#94a3b8;">Belum ada riwayat jabatan.</p>'}
            </div>
        </div>

        <div class="profile-section">
            <div class="section-title">Kompetensi & Media Sosial</div>
            <div class="data-grid">
                <div class="data-item"><label>Kemampuan Bahasa</label><span>${(m[2]) ? 'Indonesia' : ''} ${(m[3]) ? ', Inggris' : ''}</span></div>
                <div class="data-item"><label>Skill Komputer</label><span>${m[8] || '-'}</span></div>
                <div class="data-item"><label>Facebook</label><span>${m[9] || '-'}</span></div>
                <div class="data-item"><label>Instagram</label><span>${m[10] || '-'}</span></div>
            </div>
        </div>

        <div class="profile-section" style="background: #fff; border: 2px solid #D71920; border-radius: 20px; padding: 20px; box-shadow: 0 10px 25px rgba(215,25,32,0.08); margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="font-size: 14px; font-weight: 800; color: #1e293b; text-transform: uppercase; margin: 0; display: flex; align-items: center; gap: 8px;">
                    <span style="background: #D71920; width: 4px; height: 18px; border-radius: 2px; display: inline-block;"></span>
                    Analisa Jenjang & Masa Tunggu
                </h3>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px; margin-bottom: 25px;">
                ${[
                    { label: 'PRATAMA', year: k[2], color: '#ef4444' },
                    { label: 'MADYA', year: k[4], color: '#dc2626' },
                    { label: 'UTAMA', year: k[6], color: '#b91c1c' },
                    { label: 'GURU', year: k[8], color: '#991b1b' },
                    { label: 'WANITA', year: k[10], color: '#db2777' }
                ].map(lvl => {
                    const cYear = new Date().getFullYear();
                    const isPratamaOnly = lvl.label === 'PRATAMA' && lvl.year && (!k[4] || k[4] === "" || k[4] === "-");
                    const waitTime = isPratamaOnly ? (cYear - parseInt(lvl.year)) : 0;
                    const isStagnan = waitTime > 5;
                    const cardBg = isStagnan ? '#fff1f2' : (lvl.year ? '#fff' : '#f8fafc');
                    const borderColor = isStagnan ? '#be123c' : (lvl.year ? lvl.color : '#f1f5f9');
                    
                    return `
                    <div style="text-align: center; padding: 15px 5px; border-radius: 15px; border: 2px solid ${borderColor}; background: ${cardBg}; position: relative; ${isStagnan ? 'box-shadow: 0 0 15px rgba(225, 29, 72, 0.2);' : ''}">
                        ${lvl.year ? `<div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: ${isStagnan ? '#be123c' : lvl.color}; color: white; font-size: 8px; padding: 2px 8px; border-radius: 10px; font-weight: 800; border: 2px solid #fff;">LULUS</div>` : ''}
                        <div style="font-size: 9px; font-weight: 800; color: ${lvl.year ? '#1e293b' : '#cbd5e1'};">${lvl.label}</div>
                        <div style="font-size: 14px; font-weight: 900; color: ${lvl.year ? (isStagnan ? '#be123c' : lvl.color) : '#cbd5e1'}; margin-top: 5px;">${lvl.year || '—'}</div>
                        ${isStagnan ? `<div style="font-size:7px; background:#be123c; color:white; font-weight:bold; margin-top:5px; padding: 2px 4px; border-radius: 4px;">STAGNAN ${waitTime} THN</div>` : ''}
                    </div>`;
                }).join('')}
            </div>
            
            <div style="background: ${(!k[4] || k[4] === "-") && k[2] ? '#be123c' : '#1e293b'}; border-radius: 16px; padding: 18px; display: flex; align-items: center; gap: 15px; color: white;">
                <div style="flex: 1;">
                    <div style="font-size: 10px; color: ${(!k[4] || k[4] === "-") && k[2] ? '#fecdd3' : '#94a3b8'}; text-transform: uppercase; font-weight: 800;">
                        ${(!k[4] || k[4] === "-") && k[2] ? '⚠️ PERINGATAN PRIORITAS:' : 'Rekomendasi Penugasan:'}
                    </div>
                    <div style="font-size: 14px; margin-top: 4px; font-weight: ${(!k[4] || k[4] === "-") && k[2] ? '700' : '400'};">
                        ${k[8] ? 'Ideolog Partai: Mentor/Pengajar.' : k[6] ? 'Strategis Nasional/Provinsi.' : k[4] ? 'Pimpinan Struktur/Legislatif.' : k[2] ? 'Kader ini sudah terlalu lama di tingkat Pratama. Wajib didorong ke Pelatihan Madya!' : 'Segera jadwalkan Pelatihan Pratama.'}
                    </div>
                </div>
            </div>
        </div>

        <div style="text-align:center; padding-top:20px;">
             <button onclick="window.print()" style="background:#1e293b; color:white; border:none; padding:10px 20px; border-radius:10px; font-weight:800; cursor:pointer;">CETAK PROFIL</button>
        </div>
    `;

    document.getElementById('modalInnerContent').innerHTML = htmlContent;
    document.getElementById('modalDetail').style.display = "block";
    document.getElementById('modalInnerContent').scrollTop = 0;
}

function closeDetail() {
    document.getElementById('modalDetail').style.display = "none";
}

// --- GLOBAL EVENT LISTENERS ---
window.onclick = function(event) {
    const modal = document.getElementById('modalDetail');
    if (event.target == modal) closeDetail();
}

document.addEventListener('keydown', function(event) {
    if (event.key === "Escape") closeDetail();
});

// Jalankan ini saat Kota dipilih
function updateKecamatanOptions() {
    const selectedKota = document.getElementById('fKota').value;
    const kecSelect = document.getElementById('fKec');
    const desaSelect = document.getElementById('fDesa');
    
    // Reset dropdown di bawahnya
    kecSelect.innerHTML = '<option value="Semua">Semua Kecamatan</option>';
    desaSelect.innerHTML = '<option value="Semua">Semua Kelurahan/Desa</option>';

    if (selectedKota !== "Semua") {
        // Ambil data yang kotanya cocok saja
        const filteredData = databaseKader.filter(item => 
            (item.pribadi.kab_kota === selectedKota || item.pribadi.kota === selectedKota)
        );
        // Ambil list kecamatan unik
        const uniqueKec = [...new Set(filteredData.map(item => item.pribadi.kec))].filter(Boolean).sort();
        uniqueKec.forEach(kec => {
            kecSelect.innerHTML += `<option value="${kec}">${kec}</option>`;
        });
    }
    applyFilters(); // Jalankan filter tabel
}

// Jalankan ini saat Kecamatan dipilih
function updateDesaOptions() {
    const selectedKota = document.getElementById('fKota').value;
    const selectedKec = document.getElementById('fKec').value;
    const desaSelect = document.getElementById('fDesa');

    desaSelect.innerHTML = '<option value="Semua">Semua Kelurahan/Desa</option>';

    if (selectedKec !== "Semua") {
        // Ambil data yang Kota DAN Kecamatannya cocok (SANGAT PENTING untuk kasus Jetis)
        const filteredData = databaseKader.filter(item => 
            (item.pribadi.kab_kota === selectedKota || item.pribadi.kota === selectedKota) && 
            item.pribadi.kec === selectedKec
        );
        const uniqueDesa = [...new Set(filteredData.map(item => item.pribadi.desa))].filter(Boolean).sort();
        uniqueDesa.forEach(desa => {
            desaSelect.innerHTML += `<option value="${desa}">${desa}</option>`;
        });
    }
    applyFilters();
}
