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

    // --- MAPPING DATA BERDASARKAN STRUKTUR HTML STEP 1-6 ---
    const p = item.pribadi || {};        // Step 1: Identitas + Alamat + Domisili
    const f = item.formal || [];         // Step 2: Pendidikan (Array of objects)
    const k = item.kaderisasi || [];     // Step 3: Pendidikan Kader (Array of objects)
    const j = item.jabatan || [];        // Step 4: Struktur & Penugasan (Array of objects)
    const rj = item.riwayat_kerja || []; // Step 5: Pekerjaan (Array of objects)
    const ms = item.medsos || [];        // Step 6: Organisasi Lain, Bahasa, Komputer, Sosmed

    // --- LOGIKA PRIORITAS KADERISASI (Visual Focus) ---
    // Mengambil data pendidikan kader terakhir untuk badge utama
    const lastKader = (Array.isArray(k) && k.length > 0) ? k[k.length - 1] : null;
    const badgeColor = lastKader && String(lastKader[2]).toUpperCase().includes("MADYA") ? "#fbbf24" : "#D71920";

    let htmlContent = `
        <div style="font-family: 'Inter', sans-serif; background: #f4f7f9; color: #1e293b; padding-bottom: 40px;">
            
            <div style="background: #0f172a; padding: 60px 20px; border-radius: 0 0 40px 40px; text-align: center; color: white; position: relative; overflow: hidden; margin: -30px -30px 20px -30px;">
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: url('https://i.ibb.co.com/N2K0XRMW/logo-pdi.png') no-repeat center; opacity: 0.05; background-size: contain;"></div>
                
                <img src="${formatDriveUrl(p.foto)}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=D71920&color=fff&size=150'"
                     style="width:140px; height:140px; border-radius:30px; border: 4px solid #fff; box-shadow: 0 15px 35px rgba(0,0,0,0.5); object-fit: cover; position: relative; z-index: 1;">
                
                <h1 style="font-size: 26px; font-weight: 900; margin: 20px 0 5px 0; letter-spacing: -0.5px;">${(p.nama || 'DATA KADER').toUpperCase()}</h1>
                <div style="font-size: 13px; color: #94a3b8; font-weight: 600; letter-spacing: 1px;">KTA: ${p.kta || '-'} | NIK: ${p.nik || '-'}</div>
            </div>

            <div style="margin: -50px 15px 25px 15px; position: relative; z-index: 10;">
                <div style="background: white; border-radius: 25px; padding: 25px; border-top: 5px solid ${badgeColor}; box-shadow: 0 15px 30px rgba(0,0,0,0.08);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <span style="font-weight: 900; font-size: 12px; color: ${badgeColor}; letter-spacing: 1.5px; text-transform: uppercase;">Sertifikasi Kaderisasi</span>
                        <span style="background: ${badgeColor}; color: ${badgeColor === '#fbbf24' ? '#000' : '#fff'}; padding: 4px 12px; border-radius: 50px; font-size: 10px; font-weight: 900;">OFFICIAL KADER</span>
                    </div>
                    
                    <div style="display: grid; gap: 12px;">
                        ${Array.isArray(k) && k.length > 0 ? k.map(val => `
                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 18px; display: flex; gap: 15px; align-items: center;">
                                <div style="font-size: 24px;">🎖️</div>
                                <div>
                                    <div style="font-weight: 800; font-size: 14px; color: #0f172a;">${String(val[2]).toUpperCase()}</div>
                                    <div style="font-size: 11px; color: #64748b;">${val[3]} | ${val[4]} (${val[5]})</div>
                                </div>
                            </div>
                        `).join('') : '<div style="text-align:center; padding: 20px; color:#94a3b8; font-style:italic;">Data kaderisasi belum diinput</div>'}
                    </div>
                </div>
            </div>

            <div style="padding: 0 15px; display: grid; gap: 20px;">

                <div style="background: white; border-radius: 25px; padding: 25px; border: 1px solid #e2e8f0;">
                    <h3 style="font-size: 13px; font-weight: 800; color: #64748b; margin-bottom: 20px; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">📍 Identitas & Domisili</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 12px;">
                        <div><label style="color:#94a3b8; font-weight:700; display:block; font-size:10px;">GENDER / AGAMA</label><b>${p.jk || '-'} / ${p.agama || '-'}</b></div>
                        <div><label style="color:#94a3b8; font-weight:700; display:block; font-size:10px;">TGL LAHIR</label><b>${p.tmpt_lahir || '-'}, ${p.tgl_lahir || '-'}</b></div>
                        <div style="grid-column: span 2;"><label style="color:#94a3b8; font-weight:700; display:block; font-size:10px;">ALAMAT LENGKAP</label><b style="line-height:1.4;">${p.alamat || '-'}, RT ${p.rt}/RW ${p.rw}, ${p.desa}, ${p.kec}, ${p.kota}</b></div>
                        <div><label style="color:#94a3b8; font-weight:700; display:block; font-size:10px;">WHATSAPP</label><b>${p.wa || '-'}</b></div>
                        <div><label style="color:#94a3b8; font-weight:700; display:block; font-size:10px;">EMAIL</label><b>${p.email || '-'}</b></div>
                    </div>
                </div>

                <div style="background: white; border-radius: 25px; padding: 25px; border: 1px solid #e2e8f0;">
                    <h3 style="font-size: 13px; font-weight: 800; color: #64748b; margin-bottom: 20px; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">🎓 Pendidikan Formal</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${Array.isArray(f) ? f.map(edu => `
                            <div style="border-left: 3px solid #D71920; padding-left: 15px;">
                                <div style="font-weight: 800; font-size: 13px;">${edu[2]}</div>
                                <div style="font-size: 11px; color: #64748b;">${edu[3]} (${edu[4]} - ${edu[5]})</div>
                            </div>
                        `).join('') : '-'}
                    </div>
                </div>

                <div style="background: white; border-radius: 25px; padding: 25px; border: 1px solid #e2e8f0;">
                    <h3 style="font-size: 13px; font-weight: 800; color: #64748b; margin-bottom: 20px; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">🚩 Jabatan & Penugasan</h3>
                    <div style="display: grid; gap: 15px;">
                        ${Array.isArray(j) ? j.map(jb => `
                            <div style="background: #fff5f5; padding: 15px; border-radius: 15px;">
                                <div style="font-weight: 800; font-size: 12px; color: #D71920;">${jb[5] || jb[12]}</div>
                                <div style="font-size: 10px; color: #1e293b;">${jb[4] || jb[10]} | Periode: ${jb[8] || jb[14]}</div>
                            </div>
                        `).join('') : '-'}
                    </div>
                </div>

                <div style="background: white; border-radius: 25px; padding: 25px; border: 1px solid #e2e8f0;">
                    <h3 style="font-size: 13px; font-weight: 800; color: #64748b; margin-bottom: 20px; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">💼 Karier & Organisasi Lain</h3>
                    <div style="margin-bottom: 15px;">
                        <label style="font-size: 9px; font-weight: 800; color: #94a3b8;">PEKERJAAN SAAT INI:</label>
                        <div style="font-weight: 800; font-size: 14px; color: #1e293b;">${p.kerja_skrg || '-'}</div>
                    </div>
                    <div style="font-size: 11px; line-height: 1.6;">
                        <b style="color:#D71920;">Organisasi Kemasyarakatan:</b><br>
                        ${Array.isArray(ms) && Array.isArray(ms[7]) ? ms[7].map(o => `• ${o[2]} (${o[4]})`).join('<br>') : '-'}
                    </div>
                </div>

                <div style="background: #0f172a; border-radius: 30px; padding: 30px; color: white;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                        <div>
                            <label style="font-size: 8px; color: #94a3b8; font-weight: 800; letter-spacing: 1px;">BAHASA</label>
                            <div style="font-weight: 700; font-size: 12px; color: #fbbf24;">${p.bahasa || '-'}</div>
                        </div>
                        <div>
                            <label style="font-size: 8px; color: #94a3b8; font-weight: 800; letter-spacing: 1px;">KOMPUTER</label>
                            <div style="font-weight: 700; font-size: 12px; color: #fbbf24;">${ms[8] || '-'}</div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <div style="flex:1; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 15px; text-align: center;">
                            <div style="font-size: 10px; font-weight: 800;">FB</div>
                            <div style="font-size: 10px; opacity: 0.6;">${ms[9] || '-'}</div>
                        </div>
                        <div style="flex:1; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 15px; text-align: center;">
                            <div style="font-size: 10px; font-weight: 800;">IG</div>
                            <div style="font-size: 10px; opacity: 0.6;">${ms[10] || '-'}</div>
                        </div>
                        <div style="flex:1; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 15px; text-align: center;">
                            <div style="font-size: 10px; font-weight: 800;">TT</div>
                            <div style="font-size: 10px; opacity: 0.6;">${ms[11] || '-'}</div>
                        </div>
                    </div>
                </div>

            </div>

            <div style="padding: 20px 15px;">
                <button onclick="window.print()" style="width: 100%; background: #D71920; color: white; border: none; padding: 20px; border-radius: 20px; font-weight: 900; font-size: 14px; box-shadow: 0 10px 20px rgba(215,25,32,0.3);">
                    CETAK PROFIL PARIPURNA
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
