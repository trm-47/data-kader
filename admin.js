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


// --- CORE RENDERING (VERSI HYPER PREMIUM & CLEAN) ---
function renderTable(data) {
    const body = document.getElementById('bodyKader');
    if (!body) return;
    
    // 1. BERSIHKAN BODY (Cegah tampilan dobel)
    body.innerHTML = "";

    if (!data || data.length === 0) {
        body.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:50px; color:#64748b;">Data tidak ditemukan.</td></tr>';
        return;
    }

    // Urutkan dari yang terbaru masuk
    const displayData = [...data].reverse();

    displayData.forEach((item) => {
        if (!item || !item.pribadi) return;
        
        const p = item.pribadi;
        const f = item.formal || [];
        const k = item.kaderisasi || [];
        const ageInfo = calculateAge(p.tgl_lahir);

        // --- LOGIKA BADGE KADERISASI (BIAR KECIL BERJEJER) ---
        let htmlBadgeKader = "";
        if (k[2] && k[2] !== "" && k[2] !== "-") {
            // Pecah berdasarkan baris baru, bersihkan, dan tampilkan berjejer (inline-block)
            const listJenjang = k[2].toString().split("\n");
            htmlBadgeKader = `<div style="display: flex; flex-wrap: wrap; gap: 4px; justify-content: center;">`;
            listJenjang.forEach(jenjangText => {
                if(jenjangText.trim()) {
                    // Warna otomatis: Pratama (Merah), Madya (Emas/Dark), Lainnya (Gray)
                    let bColor = "#fee2e2"; let tColor = "#D71920";
                    if(jenjangText.toUpperCase().includes("MADYA")) { bColor = "#1e293b"; tColor = "#fbbf24"; }
                    
                    htmlBadgeKader += `<span style="background:${bColor}; color:${tColor}; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:800; border:1px solid rgba(0,0,0,0.05); white-space:nowrap;">${jenjangText.trim().toUpperCase()}</span>`;
                }
            });
            htmlBadgeKader += `</div>`;
        } else {
            htmlBadgeKader = `<span class="badge badge-gray">ANGGOTA</span>`;
        }

        // --- WHATSAPP LOGIC ---
        const waNumber = p.wa ? p.wa.toString().replace(/[^0-9]/g, '') : '';
        const waLink = waNumber ? `https://wa.me/${waNumber.startsWith('0') ? '62' + waNumber.slice(1) : waNumber}` : '#';

        const originalIdx = databaseKader.indexOf(item);

        // --- RENDER ROW ---
        const tr = document.createElement('tr');
        tr.onclick = () => openDetail(originalIdx);
        tr.innerHTML = `
            <td data-label="Foto">
                <img src="${formatDriveUrl(p.foto)}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=D71920&color=fff'" style="width:45px; height:45px; border-radius:12px; object-fit:cover; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
            </td>
            <td data-label="Identitas">
                <div style="font-weight:800; color:#1e293b; font-size:14px;">${p.nama || 'TANPA NAMA'}</div>
                <div style="font-size:10px; color:#D71920; font-weight:700; letter-spacing:0.5px;">KTA: ${p.kta || '-'}</div>
            </td>
            <td data-label="Usia" style="text-align:center;">
                <div style="font-weight:700;">${ageInfo.age}</div>
                <div style="font-size:10px; color:#64748b;">${ageInfo.gen}</div>
            </td>
            <td data-label="Wilayah">
                <div style="font-weight:600; font-size:12px;">${p.kec || '-'}</div>
                <div style="font-size:10px; color:#94a3b8;">${p.desa || '-'}</div>
            </td>
            <td data-label="Kaderisasi">
                ${htmlBadgeKader}
            </td>
            <td data-label="Aksi" style="text-align:center;">
                ${waNumber ? `<a href="${waLink}" target="_blank" onclick="event.stopPropagation()" style="background:#25D366; color:white; width:32px; height:32px; border-radius:10px; display:inline-flex; align-items:center; justify-content:center; text-decoration:none; box-shadow:0 4px 8px rgba(37,211,102,0.3);">💬</a>` : '-'}
            </td>
        `;
        body.appendChild(tr);
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
    const rj = item.riwayat_kerja || [];
    const ms = item.medsos || [];

    // --- LOGIKA ANALISA KADERISASI (DATA PRIORITAS) ---
    const listJenis = k[2] ? String(k[2]).split("\n") : [];
    const listPenyel = k[3] ? String(k[3]).split("\n") : [];
    const listTahun = k[5] ? String(k[5]).split("\n") : [];
    const isPratama = listJenis.some(v => v.toUpperCase().includes("PRATAMA"));
    const isMadya = listJenis.some(v => v.toUpperCase().includes("MADYA"));
    
    let labelPrioritas = "";
    let shadowKader = "rgba(215, 25, 32, 0.1) 0px 20px 40px";
    
    if (isPratama && !isMadya) {
        const idxP = listJenis.findIndex(v => v.toUpperCase().includes("PRATAMA"));
        const thnP = parseInt(listTahun[idxP]);
        const masaTunggu = thnP ? (new Date().getFullYear() - thnP) : 0;
        if (masaTunggu >= 5) {
            labelPrioritas = `<div style="background: #fbbf24; color: #000; padding: 6px 15px; border-radius: 50px; font-size: 10px; font-weight: 900; margin-bottom: 15px; display: inline-block; box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4); animation: pulse 2s infinite;">🔥 PRIORITAS MADYA: WAITING ${masaTunggu} YEARS</div>`;
            shadowKader = "rgba(251, 191, 36, 0.2) 0px 20px 50px";
        }
    }

    let htmlContent = `
        <div style="font-family: 'Inter', sans-serif; color: #1e293b; background: #fcfcfc;">
            
            <div style="position: relative; background: #0f172a; padding: 60px 20px 80px 20px; border-radius: 0 0 50px 50px; text-align: center; overflow: hidden; margin: -30px -30px 0 -30px;">
                <div style="position: absolute; top: -100px; right: -100px; width: 300px; height: 300px; background: radial-gradient(circle, rgba(215,25,32,0.15) 0%, rgba(0,0,0,0) 70%); border-radius: 50%;"></div>
                
                <div style="position: relative; display: inline-block;">
                    <img src="${formatDriveUrl(p.foto)}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=D71920&color=fff&size=200'"
                         style="width:150px; height:150px; border-radius:35% 65% 61% 39% / 30% 28% 72% 70%; object-fit:cover; border: 6px solid #fff; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
                    <div style="position: absolute; bottom: 10px; right: 10px; background: #25D366; width: 35px; height: 35px; border-radius: 50%; border: 3px solid #0f172a; display: flex; align-items: center; justify-content: center; font-size: 18px;">💬</div>
                </div>

                <h1 style="color: #fff; margin-top: 25px; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 5px;">${(p.nama || 'UNDEFINED').toUpperCase()}</h1>
                <div style="display: flex; justify-content: center; gap: 15px; align-items: center;">
                    <span style="color: #94a3b8; font-size: 12px; font-weight: 600; letter-spacing: 2px;">KTA: ${p.kta || '-'}</span>
                    <span style="width: 4px; height: 4px; background: #475569; border-radius: 50%;"></span>
                    <span style="color: #94a3b8; font-size: 12px; font-weight: 600; letter-spacing: 2px;">NIK: ${p.nik || '-'}</span>
                </div>
            </div>

            <div style="margin: -40px 10px 30px 10px; position: relative; z-index: 100;">
                <div style="background: #fff; padding: 30px; border-radius: 30px; box-shadow: ${shadowKader}; border: 1px solid rgba(215, 25, 32, 0.1); text-align: center;">
                    ${labelPrioritas}
                    <div style="text-align: left; font-weight: 900; font-size: 14px; color: #D71920; margin-bottom: 20px; letter-spacing: 1px; display: flex; align-items: center; gap: 10px;">
                        <span style="background: #D71920; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 6px; color: #fff; font-size: 12px;">★</span>
                        SERTIFIKASI KADERISASI UTAMA
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        ${listJenis.length > 0 && listJenis[0] !== "" ? listJenis.map((val, idx) => `
                            <div style="background: linear-gradient(145deg, #ffffff, #f9f9f9); border: 2px solid ${val.toUpperCase().includes('MADYA') ? '#fbbf24' : '#f1f5f9'}; padding: 18px; border-radius: 20px; position: relative; overflow: hidden; transition: all 0.3s ease;">
                                ${val.toUpperCase().includes('MADYA') ? '<div style="position:absolute; top:-10px; right:-10px; font-size:40px; opacity:0.05;">🏆</div>' : ''}
                                <div style="color: ${val.toUpperCase().includes('MADYA') ? '#b45309' : '#1e293b'}; font-weight: 900; font-size: 14px; margin-bottom: 8px;">${val.trim().toUpperCase()}</div>
                                <div style="font-size: 10px; font-weight: 700; color: #64748b; line-height: 1.5;">
                                    🏛️ ${listPenyel[idx] || '-'}<br>
                                    📅 ANGKATAN TAHUN ${listTahun[idx] || '-'}
                                </div>
                            </div>
                        `).join('') : '<div style="grid-column: span 2; padding: 20px; color: #94a3b8; font-style: italic; background: #f8fafc; border-radius: 15px;">Data kaderisasi belum tercatat dalam sistem</div>'}
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr; gap: 20px; padding: 0 10px;">
                
                <div style="background: #fff; padding: 25px; border-radius: 30px; border: 1px solid #f1f5f9; box-shadow: 0 10px 25px rgba(0,0,0,0.02);">
                    <div style="font-weight: 800; color: #1e293b; margin-bottom: 20px; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b;">Informasi Identitas</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div><label style="display:block; color:#94a3b8; font-size:9px; font-weight:800; margin-bottom:4px;">GENDER</label><span style="font-weight:700; font-size:13px;">${p.jk || '-'}</span></div>
                        <div><label style="display:block; color:#94a3b8; font-size:9px; font-weight:800; margin-bottom:4px;">AGAMA</label><span style="font-weight:700; font-size:13px;">${p.agama || '-'}</span></div>
                        <div style="grid-column: span 2;"><label style="display:block; color:#94a3b8; font-size:9px; font-weight:800; margin-bottom:4px;">TEMPAT, TGL LAHIR</label><span style="font-weight:700; font-size:13px;">${p.tmpt_lahir || '-'}, ${p.tgl_lahir || '-'}</span></div>
                        <div style="grid-column: span 2;"><label style="display:block; color:#94a3b8; font-size:9px; font-weight:800; margin-bottom:4px;">ALAMAT DOMISILI</label><span style="font-weight:700; font-size:13px; line-height:1.4;">${p.alamat || '-'}, RT${p.rt}/RW${p.rw}, ${p.desa}, ${p.kec}, ${p.kota}</span></div>
                    </div>
                </div>

                <div style="background: #fff; padding: 25px; border-radius: 30px; border: 1px solid #f1f5f9; box-shadow: 0 10px 25px rgba(0,0,0,0.02);">
                    <div style="font-weight: 800; color: #64748b; margin-bottom: 20px; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px;">Pendidikan Formal</div>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        ${[
                            {j: 'S3', n: f[17], t: f[18]},
                            {j: 'S2', n: f[15], t: f[16]},
                            {j: 'S1', n: f[11], t: f[14], d: f[12]},
                            {j: 'SMA', n: f[6], t: f[8]}
                        ].filter(e => e.n && e.n !== '-').map(e => `
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <div style="background: #f1f5f9; width: 35px; height: 35px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 10px; color: #475569;">${e.j}</div>
                                <div>
                                    <div style="font-weight: 700; font-size: 13px; color: #1e293b;">${e.n} ${e.d ? '<span style="color:#94a3b8; font-weight:400;">— '+e.d+'</span>' : ''}</div>
                                    <div style="font-size: 10px; color: #94a3b8;">Tahun Lulus: ${e.t}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="background: #fff; padding: 25px; border-radius: 30px; border: 1px solid #f1f5f9; box-shadow: 0 10px 25px rgba(0,0,0,0.02);">
                    <div style="font-weight: 800; color: #64748b; margin-bottom: 20px; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px;">Struktur & Penugasan</div>
                    <div style="display: grid; gap: 12px;">
                        ${j.length > 0 ? j.map(row => `
                            <div style="background: #f8fafc; padding: 15px; border-radius: 20px; display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #D71920;">
                                <div>
                                    <div style="font-weight: 800; font-size: 12px; color: #1e293b;">${row[5] || row[12]}</div>
                                    <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${row[4] || row[10]}</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 10px; font-weight: 900; color: #D71920;">${row[8] || row[14]}</div>
                                </div>
                            </div>
                        `).join('') : '<div style="font-size:12px; color:#94a3b8;">Tidak ada riwayat penugasan partai</div>'}
                    </div>
                </div>

                <div style="background: #fff; padding: 25px; border-radius: 30px; border: 1px solid #f1f5f9; box-shadow: 0 10px 25px rgba(0,0,0,0.02);">
                    <div style="font-weight: 800; color: #64748b; margin-bottom: 15px; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px;">Karier & Sosial</div>
                    <div style="background: #1e293b; color: #fff; padding: 15px; border-radius: 18px; margin-bottom: 15px;">
                        <label style="font-size: 9px; opacity: 0.6; display: block; margin-bottom: 4px; font-weight: 700;">OCCUPATION</label>
                        <div style="font-weight: 700; font-size: 14px;">${p.kerja_skrg || '-'}</div>
                    </div>
                    <div style="font-size: 11px; color: #475569; line-height: 1.7;">
                        <b style="color:#D71920;">Riwayat Ormas:</b><br>
                        ${rj.length > 0 ? rj.map(o => `• <b>${o[2]}</b> (${o[4]})`).join('<br>') : '-'}
                    </div>
                </div>

                <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 30px; border-radius: 40px; color: #fff; margin-bottom: 30px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <span style="font-weight: 900; font-size: 14px; color: #fbbf24; letter-spacing: 1px;">DIGITAL ASSETS</span>
                        <div style="background: rgba(255,255,255,0.1); padding: 5px 12px; border-radius: 10px; font-size: 10px; font-weight: 700;">IT: ${ms[8] || '-'}</div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                        <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1);">
                            <label style="font-size: 8px; color: #94a3b8; display: block; margin-bottom: 5px;">LANGUAGES</label>
                            <div style="font-weight: 700; font-size: 12px;">${p.bahasa || '-'}</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1);">
                            <label style="font-size: 8px; color: #94a3b8; display: block; margin-bottom: 5px;">FB ACCOUNT</label>
                            <div style="font-weight: 700; font-size: 12px;">${ms[9] || '-'}</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <div style="flex: 1; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 15px; text-align: center; font-size: 11px; font-weight: 700; border: 1px solid rgba(255,255,255,0.1);">IG: ${ms[10] || '-'}</div>
                        <div style="flex: 1; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 15px; text-align: center; font-size: 11px; font-weight: 700; border: 1px solid rgba(255,255,255,0.1);">TT: ${ms[11] || '-'}</div>
                    </div>
                </div>

            </div>

            <div style="padding: 0 10px 40px 10px;">
                <button onclick="window.print()" style="width: 100%; background: #D71920; color: #fff; border: none; padding: 22px; border-radius: 25px; font-weight: 900; font-size: 16px; letter-spacing: 1px; cursor: pointer; box-shadow: 0 15px 35px rgba(215, 25, 32, 0.4);">
                    DOWNLOAD DOSSIER LENGKAP
                </button>
            </div>
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
