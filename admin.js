const URL_GAS = "https://script.google.com/macros/s/AKfycbxSY27rCXb--XTVhH5vFUbI_08ADYoUZwHhhdEmuuu4yIGrKSWpHA5bvp8k8B-r5azHYw/exec";
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

function openDetail(originalIndex) {
    const item = databaseKader[originalIndex];
    if (!item) return;

    const p = item.pribadi || {};
    const f = item.formal || [];
    const k = item.kaderisasi || [];
    const j = item.jabatan || [];
    const ageInfo = calculateAge(p.tgl_lahir);

    // --- LOGIKA ANALISA TAHUN ---
    const textJenis = k[2] ? k[2].toString().split("\n") : [];
    const listThn = k[5] ? k[5].toString().split("\n") : [];

    const getKaderData = (keyword) => {
        const idx = textJenis.findIndex(t => t.toLowerCase().includes(keyword.toLowerCase()));
        if (idx !== -1) {
            const foundYear = listThn[idx] ? listThn[idx].replace(/^\d+\.\s*/, "").trim() : null;
            return foundYear || "Aktif";
        }
        return null;
    };

    const thnPratama = getKaderData("Pratama");
    const thnMadya = getKaderData("Madya");
    const thnUtama = getKaderData("Utama");
    const thnGuru = getKaderData("Guru");
    const thnPerempuan = getKaderData("Perempuan");
    const thnKhusus = getKaderData("Khusus");

    let htmlContent = `
        <div class="modal-header-fancy">
            <div class="header-main-info">
                <div class="photo-container">
                    <img src="${formatDriveUrl(p.foto)}" 
                         onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=D71920&color=fff&size=128'"
                         class="profile-pic-large">
                    <div class="logo-overlay">
                        <img src="https://i.ibb.co.com/N2K0XRMW/logo-pdi.png">
                    </div>
                </div>
                <div class="name-container">
                    <h2>${(p.nama || 'Tanpa Nama').toUpperCase()}</h2>
                    <span class="kta-badge">ID KADER: ${p.kta || '-'}</span>
                    <div class="location-sub">📍 ${p.desa || '-'}, ${p.kec || '-'}, ${p.kab_kota || '-'}</div>
                </div>
            </div>
        </div>

        <div class="modal-body-fancy">
            <div class="fancy-grid">
                <div class="fancy-card">
                    <div class="card-title">Identitas Pribadi</div>
                    <div class="data-row"><label>NIK</label><span>${p.nik || '-'}</span></div>
                    <div class="data-row"><label>Tempat, Tgl Lahir</label><span>${p.tmpt_lahir || '-'}, ${p.tgl_lahir || '-'}</span></div>
                    <div class="data-row"><label>Usia / Gen</label><span>${ageInfo.age} (${ageInfo.gen})</span></div>
                    <div class="data-row"><label>Agama</label><span>${p.agama || '-'}</span></div>
                </div>

                <div class="fancy-card">
                    <div class="card-title">Kontak & Alamat</div>
                    <div class="data-row"><label>WhatsApp</label><span class="highlight-wa">💬 ${p.wa || '-'}</span></div>
                    <div class="data-row"><label>Email</label><span>${p.email || '-'}</span></div>
                    <div class="data-row"><label>Domisili</label><span>${p.alamat || '-'}</span></div>
                    <div class="data-row"><label>Pekerjaan</label><span>${p.kerja_skrg || '-'}</span></div>
                </div>
            </div>

            <div class="fancy-card highlight-card">
                <div class="card-title">Analisa Jenjang & Spesialisasi Kader</div>
                <div class="stepper-wrapper" style="display: flex; justify-content: space-around; text-align: center; margin: 15px 0;">
                    ${renderStep('PRATAMA', thnPratama, '#ef4444')}
                    ${renderStep('MADYA', thnMadya, '#dc2626')}
                    ${renderStep('UTAMA', thnUtama, '#b91c1c')}
                </div>
                <div class="stepper-wrapper" style="display: flex; justify-content: space-around; text-align: center; border-top: 1px dashed #fca5a5; padding-top: 15px;">
                    ${renderStep('GURU', thnGuru, '#991b1b')}
                    ${renderStep('PEREMPUAN', thnPerempuan, '#db2777')}
                    ${renderStep('KHUSUS', thnKhusus, '#1e293b')}
                </div>
                <div class="rekomendasi-box" style="margin-top:15px; padding:10px; background:#fff1f2; border-radius:8px; border-left:4px solid #D71920;">
                    <strong>💡 Status Analisa:</strong>
                    <p style="margin:5px 0 0 0; font-size:12px;">
                        ${thnGuru ? 'Kader telah mencapai kualifikasi <strong>Guru Kader</strong>.' : 
                         (!thnMadya && thnPratama ? 'Kader <strong>Prioritas</strong> untuk didorong Pelatihan Madya.' : 
                         'Pantau terus keaktifan kader dalam penugasan partai.')}
                    </p>
                </div>
            </div>

            <div class="fancy-grid">
                <div class="fancy-card">
                    <div class="card-title">Pendidikan Formal</div>
                    <div class="list-container">
                        ${(() => {
                            const eduMapping = [
                                { label: "S3", inst: f[17], info: f[18], thn: f[19] },
                                { label: "S2", inst: f[15], info: f[16], thn: "" },
                                { label: "S1", inst: f[11], info: f[12], thn: f[14] },
                                { label: "D1-D4", inst: f[9], thn: f[10] },
                                { label: "SMA", inst: f[6], info: f[7], thn: f[8] }
                            ];
                            const validEdu = eduMapping.filter(e => e.inst && e.inst !== "-" && e.inst !== "");
                            return validEdu.length > 0 ? validEdu.map(e => `
                                <div style="margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:5px;">
                                    <small style="color:#D71920; font-weight:bold;">${e.label}</small><br>
                                    <strong>${e.inst}</strong>
                                    ${e.info && e.info !== "-" ? `<br><small style="color:#666;">${e.info}</small>` : ''}
                                </div>`).join('') : '<span class="empty-text">Data tidak tersedia</span>';
                        })()}
                    </div>
                </div>

                <div class="fancy-card">
                    <div class="card-title">Media Sosial Resmi</div>
                    <div class="medsos-grid-internal" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        ${(() => {
                            const platform = [
                                { label: 'FB', key: 'fb', color: '#1877F2', base: 'https://fb.com/', svg: '<svg style="width:14px;height:14px" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/></svg>' },
                                { label: 'IG', key: 'ig', color: '#E4405F', base: 'https://instagram.com/', svg: '<svg style="width:14px;height:14px" viewBox="0 0 24 24"><path fill="currentColor" d="M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z"/></svg>' },
                                { label: 'TikTok', key: 'tiktok', color: '#000', base: 'https://tiktok.com/@', svg: '<svg style="width:14px;height:14px" viewBox="0 0 24 24"><path fill="currentColor" d="M17.71,6.15C16.46,5.32 15.64,3.9 15.54,2.27H12.43V17.07C12.43,18.62 11.17,19.87 9.62,19.87C8.07,19.87 6.81,18.62 6.81,17.07C6.81,15.52 8.07,14.26 9.62,14.26C10.22,14.26 10.77,14.45 11.23,14.77V11.6C10.74,11.33 10.19,11.17 9.62,11.17C6.36,11.17 3.7,13.83 3.7,17.09C3.7,20.35 6.36,23.01 9.62,23.01C12.88,23.01 15.54,20.35 15.54,17.09V8.92C16.85,9.85 18.45,10.4 20.18,10.4V7.29C19.24,7.29 18.38,6.86 17.71,6.15Z"/></svg>' }
                            ];

                            const mAktif = platform.map(plt => {
                                // Perbaikan: Ambil dari item.medsos atau p
                                let val = (item.medsos && item.medsos[plt.key]) ? item.medsos[plt.key] : p[plt.key];
                                return { ...plt, val: val };
                            }).filter(m => m.val && m.val !== "-" && m.val !== "");

                            return mAktif.length > 0 ? mAktif.map(m => {
                                let cleanUser = m.val.toString().trim().replace('@', '');
                                let finalLink = m.val.toString().startsWith('http') ? m.val : (m.base + cleanUser);
                                return `
                                    <a href="${finalLink}" target="_blank" style="display:flex; align-items:center; gap:5px; padding:8px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; text-decoration:none;">
                                        <span style="color:${m.color}">${m.svg}</span>
                                        <span style="font-size:10px; font-weight:bold; color:#333; overflow:hidden; text-overflow:ellipsis;">${m.val}</span>
                                    </a>`;
                            }).join('') : '<small style="grid-column:span 2; color:#94a3b8;">Tidak ada medsos</small>';
                        })()}
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer" style="padding:15px; text-align:right;">
            <button onclick="window.print()" style="background:#1e293b; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:bold;">CETAK PROFIL</button>
        </div>
    `;

    document.getElementById('modalInnerContent').innerHTML = htmlContent;
    document.getElementById('modalDetail').style.display = "block";
    document.getElementById('modalInnerContent').scrollTop = 0;
}

// Helper untuk Stepper Kaderisasi
function renderStep(label, year, color) {
    const isActive = year ? 'active' : 'inactive';
    return `
        <div class="step-item ${isActive}">
            <div class="step-circle" style="background: ${year ? color : '#e2e8f0'}">
                ${year ? '✓' : ''}
            </div>
            <div class="step-label">${label}</div>
            <div class="step-year">${year || '—'}</div>
        </div>
    `;
}

// ... akhir dari fungsi openDetail() ...

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
