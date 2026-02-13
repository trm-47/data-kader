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
    // 1. Ambil semua nilai dari dropdown HTML
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

    // 2. Proses penyaringan data
    const filtered = databaseKader.filter(item => {
        const p = item.pribadi || {};
        const formal = item.formal || [];
        const kader = item.kaderisasi || [];
        const jabatan = item.jabatan || [];

        // --- FILTER WILAYAH (RIGID) ---
        const matchKota = fKota === "Semua" || (p.kab_kota === fKota) || (p.kota === fKota);
        const matchKec = fKec === "Semua" || (p.kec === fKec);
        const matchDesa = fDesa === "Semua" || (p.desa === fDesa);

        // --- FILTER IDENTITAS ---
        const matchesJK = fJK === "Semua" || p.jk === fJK;
        const matchesAgama = fAgama === "Semua" || p.agama === fAgama;
        
        // --- FILTER PENDIDIKAN ---
        // Mencocokkan teks pendidikan di kolom formal
        const textFormal = formal.join(" ");
        const matchesEdu = fEdu === "Semua" || textFormal.includes(fEdu);

        // --- FILTER KADERISASI DASAR ---
        const textKader = kader[2] ? kader[2].toString().toLowerCase() : "";
        const matchesKader = (fKader === "Semua") || textKader.includes(fKader.toLowerCase());

        // --- LOGIKA KHUSUS MADYA & PRIORITAS ---
        const currentYear = new Date().getFullYear();
        const isMadya = textKader.includes("madya");
        const hasPratama = textKader.includes("pratama");
        
        const textTahun = kader[5] ? kader[5].toString() : "";
        const matchTahunPratama = textTahun.match(/1\.\s*(\d{4})/) || textTahun.match(/^(\d{4})/);
        const tahunPratama = matchTahunPratama ? parseInt(matchTahunPratama[1]) : 0;
        const masaTunggu = tahunPratama > 0 ? (currentYear - tahunPratama) : 0;

        let matchStatusMadya = true;
        if (fStatusMadya === "Sudah") {
            matchStatusMadya = isMadya;
        } else if (fStatusMadya === "Belum") {
            matchStatusMadya = !isMadya;
        } else if (fStatusMadya === "Prioritas") {
            matchStatusMadya = (hasPratama && !isMadya && masaTunggu >= 5);
        }

        // --- FILTER STRUKTUR & TUGAS ---
        const textJabatan = jabatan.map(j => j.join(" ")).join(" ").toLowerCase();
        const matchesTingkat = fTingkat === "Semua" || textJabatan.includes(fTingkat.toLowerCase());
        const matchesJenis = fJenis === "Semua" || textJabatan.includes(fJenis.toLowerCase());
        
        // --- FILTER IT & BAHASA ---
        const matchesIT = fIT === "Semua" || (item.pribadi.it === fIT);
        const matchesBahasa = fBahasa === "Semua" || (item.pribadi.bahasa === fBahasa);

        // KEMBALIKAN HASIL AKHIR (Harus True Semua)
        return matchKota && matchKec && matchDesa && 
               matchesJK && matchesAgama && matchesEdu && 
               matchesKader && matchesTingkat && matchesJenis && 
               matchStatusMadya && matchesIT && matchesBahasa;
    });

    // 3. Render ulang tabel & Statistik
    renderTable(filtered);
    updateStats(filtered);
}

// --- MODAL DETAIL LOGIC ---
function openDetail(originalIndex) {
    const item = databaseKader[originalIndex];
    if (!item) return;

    const p = item.pribadi || {};
    const f = item.formal || [];       // Step 2
    const k = item.kaderisasi || [];   // Step 3 (Penting!)
    const j = item.jabatan || [];      // Step 4
    const rj = item.riwayat_kerja || [];// Step 5
    const ms = item.medsos || [];      // Step 6
    const org = item.organisasi || []; // Step 6 (Organisasi Lain)
    
    // --- LOGIKA ANALISA KADERISASI ---
    const listJenis = k[2] ? k[2].split("\n") : [];
    const listThnKader = k[5] ? k[5].split("\n") : [];
    
    const getYearKader = (no) => {
        const found = listThnKader.find(t => t.trim().startsWith(no + "."));
        return found ? found.replace(no + ".", "").trim() : null;
    };

    const thnPratama = getYearKader("1");
    const thnMadya = getYearKader("2");

    // --- RENDER HTML ---
    let htmlContent = `
        <div style="text-align:center; margin-bottom:30px; background: linear-gradient(135deg, #fff1f2 0%, #ffffff 100%); padding: 40px 20px; border-radius: 0 0 50px 50px; margin: -30px -30px 30px -30px; border-bottom: 2px solid #fee2e2;">
            <img src="${formatDriveUrl(p.foto)}" 
                 onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=D71920&color=fff&size=128'"
                 style="width:140px; height:140px; border-radius:50%; object-fit:cover; border: 6px solid white; box-shadow: 0 15px 35px rgba(215,25,32,0.2);">
            <h2 style="margin-top:20px; color:#1e293b; font-size:26px; font-weight:800;">${p.nama ? p.nama.toUpperCase() : '-'}</h2>
            <p style="color:#D71920; font-weight:800; font-size:14px;">ID KADER: ${p.kta || '-'}</p>
        </div>

        <div class="profile-section" style="background: #fff; border: 2px solid #D71920; border-radius: 20px; padding: 20px; box-shadow: 0 10px 25px rgba(215,25,32,0.08);">
            <div class="section-title">📊 Analisa Jenjang Kaderisasi</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
                <div style="padding:15px; background:#f8fafc; border-radius:12px; text-align:center;">
                    <small style="color:#64748b; font-weight:700;">STATUS PRATAMA</small>
                    <div style="font-size:18px; font-weight:800; color:${thnPratama ? '#059669' : '#94a3b8'};">
                        ${thnPratama ? '✅ LULUS (' + thnPratama + ')' : '❌ BELUM'}
                    </div>
                </div>
                <div style="padding:15px; background:#f8fafc; border-radius:12px; text-align:center;">
                    <small style="color:#64748b; font-weight:700;">STATUS MADYA</small>
                    <div style="font-size:18px; font-weight:800; color:${thnMadya ? '#059669' : '#ef4444'};">
                        ${thnMadya ? '✅ LULUS (' + thnMadya + ')' : '❌ BELUM'}
                    </div>
                </div>
            </div>
        </div>

        <div class="profile-section">
            <div class="section-title">📍 Identitas & Kontak</div>
            <div class="data-grid">
                <div class="data-item"><label>NIK</label><span>${p.nik || '-'}</span></div>
                <div class="data-item"><label>Tempat, Tgl Lahir</label><span>${p.tmpt_lahir || '-'}, ${p.tgl_lahir || '-'}</span></div>
                <div class="data-item"><label>WhatsApp</label><span>${p.wa || '-'}</span></div>
                <div class="data-item"><label>Email</label><span>${p.email || '-'}</span></div>
                <div class="data-item" style="grid-column: span 2;"><label>Alamat</label><span>${p.alamat || '-'}, RT ${p.rt}/RW ${p.rw}, ${p.desa}, ${p.kec}, ${p.kota}</span></div>
            </div>
        </div>

        <div class="profile-section">
            <div class="section-title">🎓 Pendidikan Formal</div>
            <div class="data-grid">
                <div class="data-item"><label>Terakhir</label><span>${f[19] || '-'}</span></div>
                <div class="data-item"><label>SMA/SMK</label><span>${f[6] || '-'} (${f[8] || ''})</span></div>
                <div class="data-item" style="grid-column: span 2;"><label>Perguruan Tinggi</label><span>${f[11] || '-'} ${f[12] ? '- ' + f[12] : ''} (${f[14] || ''})</span></div>
            </div>
        </div>

        <div class="profile-section">
            <div class="section-title">📜 Riwayat Kaderisasi Partai</div>
            <div style="font-size: 13px; line-height: 1.6;">
                ${k[2] ? k[2].split("\n").map((val, idx) => {
                    const penyelenggara = k[3].split("\n")[idx] || "";
                    const tahun = k[5].split("\n")[idx] || "";
                    return `<div style="margin-bottom:8px; padding-bottom:8px; border-bottom:1px dashed #eee;">
                                <strong>${val}</strong><br>
                                <span style="color:#64748b;">${penyelenggara} (${tahun})</span>
                            </div>`;
                }).join('') : "-"}
            </div>
        </div>

        <div class="profile-section">
            <div class="section-title">🚩 Jabatan & Penugasan</div>
            <div style="display:flex; flex-direction:column; gap:8px;">
                ${j.length > 0 ? j.map(row => `
                    <div style="padding:8px; background:#f8fafc; border-left:3px solid #D71920; border-radius:4px;">
                        <div style="font-weight:700;">${row[2] === 'Struktur Partai' ? row[5] : row[12]}</div>
                        <small style="color:#64748b;">${row[4] || row[10]} | ${row[8] || row[14]}</small>
                    </div>
                `).join('') : "-"}
            </div>
        </div>

        <div class="profile-section">
            <div class="section-title">💼 Pekerjaan & Organisasi Luar</div>
            <div class="data-grid">
                <div class="data-item" style="grid-column: span 2;"><label>Riwayat Kerja</label><span>${rj.length > 0 ? rj.map(r => `${r[3]} di ${r[2]}`).join(", ") : "-"}</span></div>
                <div class="data-item" style="grid-column: span 2;"><label>Organisasi</label><span>${org.length > 0 ? org.map(o => o[2]).join(", ") : "-"}</span></div>
            </div>
        </div>

        <div class="profile-section">
            <div class="section-title">📱 Kompetensi & Medsos</div>
            <div class="data-grid">
                <div class="data-item"><label>Skill Komputer</label><span>${ms[8] || '-'}</span></div>
                <div class="data-item" style="display:flex; gap:10px; flex-wrap:wrap;">
                    ${ms[9] && ms[9] !== '-' ? `<span class="badge-medsos">FB</span>` : ''}
                    ${ms[10] && ms[10] !== '-' ? `<span class="badge-medsos">IG</span>` : ''}
                    ${ms[11] && ms[11] !== '-' ? `<span class="badge-medsos">TT</span>` : ''}
                </div>
            </div>
        </div>

        <div style="text-align:center; padding-top:20px;">
             <button onclick="window.print()" style="background:#1e293b; color:white; border:none; padding:12px 25px; border-radius:10px; font-weight:800; cursor:pointer;">
                🖨️ CETAK PROFIL
             </button>
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
    
    // Reset dropdown di bawahnya
    kecSelect.innerHTML = '<option value="Semua">Semua Kecamatan</option>';
    desaSelect.innerHTML = '<option value="Semua">Semua Kelurahan/Desa</option>';

    if (selectedKota !== "Semua") {
        // Ambil data yang kotanya cocok saja
        const filteredData = databaseKader.filter(item => 
            (item.pribadi.kab_kota === selectedKota || item.pribadi.kota === selectedKota)
        );
        // Ambil daftar kecamatan unik
        const uniqueKec = [...new Set(filteredData.map(item => item.pribadi.kec))].filter(Boolean).sort();
        uniqueKec.forEach(kec => {
            kecSelect.innerHTML += `<option value="${kec}">${kec}</option>`;
        });
    }
    applyFilters(); // Langsung filter tabel
}

function updateDesaOptions() {
    const selectedKota = document.getElementById('fKota').value;
    const selectedKec = document.getElementById('fKec').value;
    const desaSelect = document.getElementById('fDesa');

    desaSelect.innerHTML = '<option value="Semua">Semua Kelurahan/Desa</option>';

    if (selectedKec !== "Semua") {
        // Kunci berdasarkan KOTA dan KECAMATAN agar rigid
        const filteredData = databaseKader.filter(item => 
            (item.pribadi.kab_kota === selectedKota || item.pribadi.kota === selectedKota) && 
            item.pribadi.kec === selectedKec
        );
        const uniqueDesa = [...new Set(filteredData.map(item => item.pribadi.desa))].filter(Boolean).sort();
        uniqueDesa.forEach(desa => {
            desaSelect.innerHTML += `<option value="${desa}">${desa}</option>`;
        });
    }
    applyFilters(); // Langsung filter tabel
}
