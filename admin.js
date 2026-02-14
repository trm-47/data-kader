const URL_GAS = "https://script.google.com/macros/s/AKfycbzihYwId9oi6UFtd7ZHK8QOM0UlgiTQKZ7lcyETciaAJnX-QCKZUbaG2CPdZCESFGZp_Q/exec";
let databaseKader = [];

// --- INITIALIZATION ---
window.onload = fetchData;

async function fetchData() {
    try {
        console.log("Memulai penarikan data...");
        const response = await fetch(URL_GAS + "?action=read");
        const data = await response.json();

        if (data.error) throw new Error(data.error);

        // BALIK DATA DI SINI: Supaya MASTER tetap terbaru di atas
        databaseKader = data.reverse(); 
        
        renderTable(databaseKader);
        updateStats(databaseKader);
    } catch (error) {
        console.error("Error Detail:", error);
        document.getElementById('bodyKader').innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; color:red; padding:20px;">
                    Gagal memuat data: ${error.message}
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
    if (idParam) {
        fileId = idParam.split("&")[0];
    }

    if (!fileId && url.includes("/d/")) {
        fileId = url.split("/d/")[1].split("/")[0];
    }

    if (fileId) {
        return `https://lh3.googleusercontent.com/d/${fileId}`;
    }

    return url;
}


// --- CORE RENDERING ---
// --- CORE RENDERING (VERSI PERBAIKAN) ---
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

        // --- LOGIKA KADERISASI ---
        const textJenisKader = k[2] ? k[2].toString().toLowerCase() : ""; 
        const textTahunKader = k[5] ? k[5].toString() : ""; 

        // Ambil tahun Pratama
        const matchPratama = textTahunKader.match(/1\.\s*(\d{4})/) || textTahunKader.match(/^(\d{4})/);
        const tahunPratama = matchPratama ? parseInt(matchPratama[1]) : null;
        
        const isMadya = textJenisKader.includes("madya");
        const hasPratama = textJenisKader.includes("pratama");
        
        let rowClass = "";
        let badgeWarning = "";

        if (hasPratama && !isMadya && tahunPratama) {
            const currentYear = new Date().getFullYear();
            const masaTunggu = currentYear - tahunPratama;

            if (masaTunggu >= 5) {
                rowClass = "urgent-row"; 
                badgeWarning = `<br><span class="urgent-badge">🚨 PRIORITAS MADYA (${masaTunggu} Thn)</span>`;
            } else {
                rowClass = "warning-row"; 
                badgeWarning = `<br><span class="warning-badge">⚠️ MASA TUNGGU (${masaTunggu} Thn)</span>`;
            }
        }

        let htmlBadgeKader = "";
        if (k[2] && k[2] !== "" && k[2] !== "-") {
            const listJenjang = k[2].toString().split("\n");
            listJenjang.forEach(jenjangText => {
                if(jenjangText.trim()) {
                    htmlBadgeKader += `<span class="badge badge-red" style="margin-bottom:2px; display:block; text-align:center;">${jenjangText.trim()}</span>`;
                }
            });
        } else {
            htmlBadgeKader = `<span class="badge badge-gray">Anggota</span>`;
        }

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

        // --- RENDER BARIS ---
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
    let youth = 0;
    let madyaCount = 0;
    let needMadyaCount = 0; 

    data.forEach(item => {
        const p = item.pribadi || {};
        const k = item.kaderisasi || [];

        if (p.tgl_lahir) {
            const ageInfo = calculateAge(p.tgl_lahir);
            if (ageInfo.gen === "Gen Z" || ageInfo.gen === "Millennial") {
                youth++;
            }
        }

        // --- MODIFIKASI STATS (START) ---
        const textJenis = k[2] ? k[2].toString().toLowerCase() : "";
        const isMadya = textJenis.includes("madya");
        const hasPratama = textJenis.includes("pratama");

        if (isMadya) {
            madyaCount++;
        } else if (hasPratama) {
            needMadyaCount++;
        }
        // --- MODIFIKASI STATS (END) ---
    });

    document.getElementById('statTotal').innerText = total;
    document.getElementById('statYoung').innerText = youth + " (" + Math.round((youth / total) * 100) + "%)";
    document.getElementById('statNeedMadya').innerText = needMadyaCount;
    
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

        // Filter Kaderisasi Dasar
        let matchesKader = (fKader === "Semua");
        const textKader = kader[2] ? kader[2].toString().toLowerCase() : "";
        if (!matchesKader) {
            matchesKader = textKader.includes(fKader.toLowerCase());
        }

        // --- MODIFIKASI KHUSUS LOGIKA FILTER MADYA ---
        const currentYear = new Date().getFullYear();
        const isMadya = textKader.includes("madya");
        const hasPratama = textKader.includes("pratama");
        
        const textTahun = kader[5] ? kader[5].toString() : "";
        const matchPratama = textTahun.match(/1\.\s*(\d{4})/);
        const tahunPratama = matchPratama ? parseInt(matchPratama[1]) : 0;
        const masaTunggu = tahunPratama > 0 ? (currentYear - tahunPratama) : 0;

        let matchStatusMadya = true;
        if (fStatusMadya === "Sudah") {
            matchStatusMadya = isMadya;
        } else if (fStatusMadya === "Belum") {
            matchStatusMadya = !isMadya;
        } else if (fStatusMadya === "Prioritas") {
            matchStatusMadya = (hasPratama && !isMadya && masaTunggu > 5);
        }
        
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
    const m = item.medsos || [];
    const ageInfo = calculateAge(p.tgl_lahir);

    // --- MODIFIKASI MODAL ANALISA (START) ---
    const listThn = k[5] ? k[5].toString().split("\n") : [];
    const getYear = (no) => {
        const found = listThn.find(t => t.trim().startsWith(no + "."));
        return found ? found.replace(no + ".", "").trim() : null;
    };

    const thnPratama = getYear("1");
    const thnMadya = getYear("2");
    const thnUtama = getYear("3");
    const thnGuru = getYear("4");
    const thnWanita = getYear("5");

    const listAnalisa = [
        { label: 'PRATAMA', year: thnPratama, color: '#ef4444' },
        { label: 'MADYA', year: thnMadya, color: '#dc2626' },
        { label: 'UTAMA', year: thnUtama, color: '#b91c1c' },
        { label: 'GURU', year: thnGuru, color: '#991b1b' },
        { label: 'WANITA', year: thnWanita, color: '#db2777' }
    ];
    // --- MODIFIKASI MODAL ANALISA (END) ---

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

        <div class="profile-section" style="background: #fff; border: 2px solid #D71920; border-radius: 20px; padding: 20px; box-shadow: 0 10px 25px rgba(215,25,32,0.08); margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="font-size: 14px; font-weight: 800; color: #1e293b; text-transform: uppercase; margin: 0; display: flex; align-items: center; gap: 8px;">
                    <span style="background: #D71920; width: 4px; height: 18px; border-radius: 2px; display: inline-block;"></span>
                    Analisa Jenjang & Masa Tunggu
                </h3>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px; margin-bottom: 25px;">
                ${listAnalisa.map(lvl => {
                    const cYear = new Date().getFullYear();
                    const isPratamaOnly = lvl.label === 'PRATAMA' && lvl.year && !thnMadya;
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
            
            <div style="background: ${!thnMadya && thnPratama ? '#be123c' : '#1e293b'}; border-radius: 16px; padding: 18px; display: flex; align-items: center; gap: 15px; color: white;">
                <div style="flex: 1;">
                    <div style="font-size: 10px; color: ${!thnMadya && thnPratama ? '#fecdd3' : '#94a3b8'}; text-transform: uppercase; font-weight: 800;">
                        ${!thnMadya && thnPratama ? '⚠️ PERINGATAN PRIORITAS:' : 'Rekomendasi Penugasan:'}
                    </div>
                    <div style="font-size: 14px; margin-top: 4px; font-weight: ${!thnMadya && thnPratama ? '700' : '400'};">
                        ${thnGuru ? 'Ideolog Partai: Mentor/Pengajar.' : thnUtama ? 'Strategis Nasional/Provinsi.' : thnMadya ? 'Pimpinan Struktur/Legislatif.' : thnPratama ? 'Kader ini sudah terlalu lama di tingkat Pratama. Wajib didorong ke Pelatihan Madya!' : 'Segera jadwalkan Pelatihan Pratama.'}
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

function updateKecamatanOptions() {
    const selectedKota = document.getElementById('fKota').value;
    const kecSelect = document.getElementById('fKec');
    const desaSelect = document.getElementById('fDesa');
    
    kecSelect.innerHTML = '<option value="Semua">Semua Kecamatan</option>';
    desaSelect.innerHTML = '<option value="Semua">Semua Kelurahan/Desa</option>';

    if (selectedKota !== "Semua") {
        const filteredData = databaseKader.filter(item => 
            (item.pribadi.kab_kota === selectedKota || item.pribadi.kota === selectedKota)
        );
        const uniqueKec = [...new Set(filteredData.map(item => item.pribadi.kec))].filter(Boolean).sort();
        uniqueKec.forEach(kec => {
            kecSelect.innerHTML += `<option value="${kec}">${kec}</option>`;
        });
    }
    applyFilters();
}

function updateDesaOptions() {
    const selectedKota = document.getElementById('fKota').value;
    const selectedKec = document.getElementById('fKec').value;
    const desaSelect = document.getElementById('fDesa');

    desaSelect.innerHTML = '<option value="Semua">Semua Kelurahan/Desa</option>';

    if (selectedKec !== "Semua") {
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

bos tolong, kenapa dia isi 5 jenjang kaderisasi kok di tabel cuma muncul 2 ya?
