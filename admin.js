const URL_GAS = "https://script.google.com/macros/s/AKfycbwqEVG-YKsNFk3xXWyeCk8Cl1CWMvemxX4sjo-zcgC14Le-kdZxD4n_7i72AsLOl9MC4w/exec";
let databaseKader = [];

// --- INITIALIZATION ---
window.onload = fetchData;

// --- DATA FETCHING ---
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
    if (idParam) { fileId = idParam.split("&")[0]; }
    if (!fileId && url.includes("/d/")) {
        fileId = url.split("/d/")[1].split("/")[0];
    }
    // Perbaikan di sini: Menggunakan template literal yang benar
    return fileId ? `https://lh3.googleusercontent.com/u/0/d/${fileId}` : url;
}


function renderTable(data) {
    const body = document.getElementById('bodyKader');
    if (!body) return;
    body.innerHTML = "";

    if (!data || data.length === 0) {
        body.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:50px;">Data tidak ditemukan.</td></tr>';
        return;
    }

    // --- PERBAIKAN UTAMA ---
    // Hapus .reverse() di sini karena data sudah dibalik saat fetchData
    const displayData = data; 

    displayData.forEach((item) => {
        if (!item || !item.pribadi) return;
        const p = item.pribadi;
        const f = item.formal || [];
        const k = item.kaderisasi || [];
        const ageInfo = calculateAge(p.tgl_lahir);

        // --- LOGIKA KADERISASI ---
        const textJenisKader = k[2] ? k[2].toString().toLowerCase() : ""; 
        const textTahunKader = k[5] ? k[5].toString() : ""; 

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

        // Mencari index asli di databaseKader agar saat buka Modal Detail datanya tidak tertukar
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

// --- FUNGSI HELPER: CAPITALIZE EACH WORD (KECUALI SINGKATAN) ---
const cap = (str) => {
    if (!str || str === "-") return "-";
    const exceptions = ["NIK", "KTA", "KTP", "RT", "RW", "DPRD", "DPP", "DPD", "DPC", "PAC", "S1", "S2", "S3", "D3", "D4", "PT", "CV", "TNI", "POLRI", "DIY", "UGM", "PDI", "PERJUANGAN"];
    return str.toString().split(' ').map(word => {
        if (exceptions.includes(word.toUpperCase())) return word.toUpperCase();
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
};

// --- FUNGSI UNTUK MERENDER BULATAN KADERISASI ---
function renderStep(label, year, color) {
    const isActive = year && year !== "" && year !== "-";
    const opacity = isActive ? "1" : "0.3";
    const border = isActive ? `2px solid ${color}` : "2px dashed #ccc";
    const bg = isActive ? color : "transparent";
    const textColor = isActive ? "white" : "#999";

    return `
        <div style="flex: 1; opacity: ${opacity};">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${bg}; border: ${border}; color: ${textColor}; display: flex; align-items: center; justify-content: center; margin: 0 auto; font-weight: bold; font-size: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                ${isActive ? '✓' : ''}
            </div>
            <div style="font-size: 10px; font-weight: bold; margin-top: 5px; color: ${isActive ? '#333' : '#ccc'}">${label}</div>
            <div style="font-size: 9px; color: ${color}; font-weight: bold;">${year || '-'}</div>
        </div>
    `;
}

// --- FUNGSI UTAMA: OPEN DETAIL (VERSI FINAL KALIBRASI PRESISI) ---
function openDetail(originalIndex) {
        const item = databaseKader[originalIndex];
    if (!item) return;

    const p = item.pribadi || {};
    const f = item.formal || [];
    const k = item.kaderisasi || []; // k[3]=Penyelenggara, k[4]=Lokasi, k[5]=Tahun
    const m = item.medsos || {};
    const jList = item.jabatan || [];
    const wList = item.pekerjaan || [];
    const oList = item.organisasi_lain || [];
    const ageInfo = calculateAge(p.tgl_lahir);

    // --- LOGIKA DATA KADERISASI (LEMBAGA & LOKASI DI BAWAH JENJANG) ---
    const textJenis = k[2] ? k[2].toString().split("\n") : [];
    const listLembaga = k[3] ? k[3].toString().split("\n") : []; // Tambahan Penyelenggara
    const listLokasi = k[4] ? k[4].toString().split("\n") : [];
    const listThn = k[5] ? k[5].toString().split("\n") : [];
    
    const getKaderData = (keyword) => {
        const idx = textJenis.findIndex(t => t.toLowerCase().includes(keyword.toLowerCase()));
        if (idx !== -1) {
            const thn = listThn[idx] ? listThn[idx].replace(/^\d+\.\s*/, "").trim() : "Aktif";
            const lem = listLembaga[idx] ? listLembaga[idx].replace(/^\d+\.\s*/, "").trim() : "-";
            const lok = listLokasi[idx] ? listLokasi[idx].replace(/^\d+\.\s*/, "").trim() : "-";
            return { tahun: thn, lembaga: lem, lokasi: lok };
        }
        return null;
    };

    const renderKaderStep = (label, color) => {
        const data = getKaderData(label);
        const isActive = data !== null;
        return `
            <div style="flex:1; padding: 0 5px;">
                <div style="width:15px; height:15px; border-radius:50%; background:${isActive ? color : '#e5e7eb'}; margin: 0 auto 5px; border: 2px solid #fff; box-shadow: 0 0 0 1px ${isActive ? color : '#ccc'};"></div>
                <div style="font-weight:bold; font-size:10px; color:${isActive ? '#333' : '#999'}; text-transform:uppercase;">${label}</div>
                <div style="font-size:9px; line-height:1.2; margin-top:4px;">
                    ${isActive ? `
                        <span style="color:${color}; font-weight:bold;">${data.tahun}</span><br>
                        <span style="color:#444; font-size:8px; font-weight:bold;">${data.lembaga}</span><br>
                        <span style="color:#666; font-style:italic;">${data.lokasi}</span>
                    ` : '<span style="color:#ccc;">-</span>'}
                </div>
            </div>
        `;
    };

    let htmlContent = `
        <div class="modal-header-fancy">
            <div class="header-main-info">
                <div class="photo-container">
                    <img src="${formatDriveUrl(p.foto)}" 
                         onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=D71920&color=fff&size=128'"
                         class="profile-pic-large">
                    <div class="logo-overlay"><img src="https://i.ibb.co.com/N2K0XRMW/logo-pdi.png"></div>
                </div>
                <div class="name-container">
                    <h2>${(p.nama || 'TANPA NAMA').toUpperCase()}</h2>
                    <span class="kta-badge">ID KADER: ${p.kta || '-'} | NIK: ${p.nik || '-'}</span>
                    <div class="location-sub">📍 ${cap(p.desa)}, ${cap(p.kec)}, ${cap(p.kab_kota)}</div>
                </div>
            </div>
        </div>

        <div class="modal-body-fancy">
            <div class="fancy-grid">
                <div class="fancy-card">
                    <div class="card-title">IDENTITAS PRIBADI</div>
                    <div class="data-row"><label>Nama Lengkap</label><span>${cap(p.nama)}</span></div>
                    <div class="data-row"><label>Jenis Kelamin</label><span>${cap(p.jk)}</span></div>
                    <div class="data-row"><label>Agama</label><span>${cap(p.agama)}</span></div>
                    <div class="data-row"><label>TTL</label><span>${cap(p.tmpt_lahir)}, ${p.tgl_lahir}</span></div>
                    <div class="data-row"><label>Usia</label><span>${p.umur || ageInfo.age} (${ageInfo.gen})</span></div>
                    <div class="data-row"><label>WhatsApp</label><span style="color:#25d366; font-weight:bold;">${p.wa || '-'}</span></div>
                    <div class="data-row"><label>Alamat</label><span>${cap(p.alamat)}, RT ${p.rt}/RW ${p.rw}</span></div>
                    <div class="data-row"><label>Kerja Sekarang</label><span>${cap(p.kerja_skrg)}</span></div>
                </div>

                <div class="fancy-card">
                    <div class="card-title">KOMPETENSI & SKILL</div>
                    <div class="data-row"><label>Skill Komputer</label><span>${cap(m.komputer)}</span></div>
                    <div class="data-row"><label>Bahasa</label>
                        <span>
                            ${m.bahasa_indo === "Ya" ? "Indonesia, " : ""}
                            ${m.bahasa_inggris === "Ya" ? "Inggris, " : ""}
                            ${m.bahasa_jawa === "Ya" ? "Jawa, " : ""}
                            ${(m.bahasa_lain && m.bahasa_lain !== ", ") ? cap(m.bahasa_lain) : "-"}
                        </span>
                    </div>
                </div>
            </div>

            <div class="fancy-card highlight-card">
                <div class="card-title">ANALISA JENJANG KADERISASI</div>
                <div class="stepper-wrapper" style="display: flex; justify-content: space-around; text-align: center; margin-top: 10px;">
                    ${renderKaderStep('PRATAMA', '#ef4444')}
                    ${renderKaderStep('MADYA', '#dc2626')}
                    ${renderKaderStep('UTAMA', '#b91c1c')}
                </div>
                <div class="stepper-wrapper" style="display: flex; justify-content: space-around; text-align: center; margin-top: 15px; border-top: 1px dashed #fca5a5; padding-top: 15px;">
                    ${renderKaderStep('GURU', '#991b1b')}
                    ${renderKaderStep('WANITA', '#db2777')}
                    ${renderKaderStep('KHUSUS', '#1e293b')}
                </div>
            </div>

            <div class="fancy-grid">
                <div class="fancy-card">
                    <div class="card-title">STRUKTUR PARTAI & WILAYAH</div>
                    <div class="list-container">
                        ${jList.filter(r => r[2] === "Struktur Partai").map(r => {
    // Koordinat H (Wilayah) biasanya r[7], koordinat I (Periode) r[8]
    // Jika masih kosong, kita coba ambil cadangan kolom sekitarnya
    const wilayah = r[7] || r[6] || "-"; 
    const periode = r[8] || r[9] || "-";
    
    return `
        <div style="border-left:3px solid #D71920; padding:8px; margin-bottom:8px; background:#fff5f5; font-size:12px;">
            <strong style="color:#D71920;">${(r[5] || r[4] || '-').toUpperCase()}</strong><br>
            <span>Jabatan: ${cap(r[5] ? r[4] : r[3])}</span><br>
            <small>📍 Wilayah: <b>${cap(wilayah)}</b></small> | <small>📅 Periode: ${periode}</small>
        </div>
    `;
}).join('') || '<small>-</small>'}
                    </div>
                </div>
                <div class="fancy-card">
                    <div class="card-title">PENUGASAN (LEGISLATIF/EKSEKUTIF)</div>
                    <div class="list-container">
                        ${jList.filter(r => r[2] === "Penugasan").map(r => `
                            <div style="border-left:3px solid #0284c7; padding:8px; margin-bottom:8px; background:#f0f9ff; font-size:12px;">
                                <strong style="color:#0284c7;">${cap(r[12] || '-')}</strong><br>
                                <span>Lembaga: ${cap(r[11] || r[10])}</span><br>
                                <small>📍 Dapil: <b>${cap(r[13] || '-')}</b></small> | <small>📅 Periode: ${r[14] || '-'}</small>
                            </div>
                        `).join('') || '<small>-</small>'}
                    </div>
                </div>
            </div>

            <div class="fancy-grid">
                <div class="fancy-card">
                    <div class="card-title">RIWAYAT ORGANISASI & KERJA</div>
                    <div class="list-container" style="font-size:11px;">
                        <small style="font-weight:bold; color:#D71920;">ORGANISASI LUAR</small>
                        ${oList.map(r => `<div>• ${cap(r[2])} (${cap(r[4])}) <br><small>Tahun: ${r[5] || '-'}</small></div>`).join('') || '<div>-</div>'}
                        <br>
                        <small style="font-weight:bold; color:#D71920;">PENGALAMAN KERJA</small>
                        ${wList.map(r => `<div>• ${cap(r[4])} di ${cap(r[2])} <br><small>Tahun: ${r[5] || '-'}</small></div>`).join('') || '<div>-</div>'}
                    </div>
                </div>
                <div class="fancy-card">
                    <div class="card-title">PENDIDIKAN FORMAL</div>
                    <div class="list-container" style="font-size:11px;">
                        ${[
                            {l: "S3", n: f[17], t: f[18]}, {l: "S2", n: f[15], t: f[16]}, {l: "S1", n: f[11], t: f[14]},
                            {l: "DIPLOMA", n: f[9], t: f[10]}, {l: "SMA", n: f[6], t: f[8]}, {l: "SMP", n: f[4], t: f[5]}, {l: "SD", n: f[2], t: f[3]}
                        ].filter(e => e.n && e.n !== "-").map(e => `
                            <div style="border-bottom:1px solid #eee; padding:2px 0;"><strong>${e.l}</strong>: ${cap(e.n)} <small>(${e.t || '-'})</small></div>
                        `).join('') || '-'}
                    </div>
                </div>
            </div>

            <div class="fancy-card">
                <div class="card-title">MEDIA SOSIAL RESMI</div>
                <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; padding: 10px;">
                    ${renderMedsosIcon('facebook', m.fb, '#1877F2')}
                    ${renderMedsosIcon('instagram', m.ig, '#E4405F')}
                    ${renderMedsosIcon('tiktok', m.tiktok, '#000000')}
                    ${renderMedsosIcon('twitter', m.twitter, '#1DA1F2')}
                    ${renderMedsosIcon('youtube', m.youtube, '#FF0000')}
                </div>
            </div>
        </div>
        <div class="modal-footer" style="padding:15px; text-align:right;">
            <button onclick="window.print()" style="background:#D71920; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:bold;">CETAK PROFIL KADER</button>
        </div>
    `;

    document.getElementById('modalInnerContent').innerHTML = htmlContent;
    document.getElementById('modalDetail').style.display = "block";
    document.getElementById('modalInnerContent').scrollTop = 0;
}

// --- FUNGSI IKON MEDSOS (POWERED BY FONT AWESOME 6) ---
function renderMedsosIcon(icon, val, color) {
    if (!val || val === "-" || val === "") return "";
    
    let iconClass = icon;
    if (icon === 'facebook') iconClass = 'facebook-f';
    if (icon === 'twitter') iconClass = 'x-twitter';

    return `
        <div style="text-align:center; min-width: 50px;">
            <div style="width:40px; height:40px; border-radius:50%; background:${color}; color:white; display:flex; align-items:center; justify-content:center; margin: 0 auto 5px; font-size:18px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <i class="fa-brands fa-${iconClass}" aria-hidden="true"></i>
            </div>
            <small style="font-size:10px; font-weight:bold; display:block; color:#333;">${val}</small>
        </div>
    `;
}

// 1. Fungsi tutup manual (dipanggil tombol silang)
function closeDetail() {
    const modal = document.getElementById('modalDetail'); // Pastikan ID sesuai
    if (modal) {
        modal.style.display = "none";
    }
}

// 2. Event Listener: Klik Luar Area
window.addEventListener('click', function(event) {
    const modal = document.getElementById('modalDetail');
    if (event.target === modal) {
        closeDetail();
    }
});

// 3. Event Listener: Tombol ESC
window.addEventListener('keydown', function(event) {
    if (event.key === "Escape") {
        closeDetail();
    }
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
