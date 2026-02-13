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

    // --- PEMETAAN DATA BERDASARKAN STEP 1 - 6 ---
    const p = item.pribadi || {};        // Step 1: Identitas
    const f = item.formal || [];         // Step 2: Pendidikan
    const k = item.kaderisasi || [];     // Step 3: Kaderisasi Partai
    const j = item.jabatan || [];        // Step 4: Jabatan & Penugasan
    const rj = item.riwayat_kerja || []; // Step 5: Pekerjaan & Ormas
    const ms = item.medsos || [];        // Step 6: Skill & Sosmed

    // --- LOGIKA ANALISA KADERISASI ---
    const listJenis = k[2] ? String(k[2]).split("\n") : [];
    const listPenyel = k[3] ? String(k[3]).split("\n") : [];
    const listLokasi = k[4] ? String(k[4]).split("\n") : [];
    const listTahun = k[5] ? String(k[5]).split("\n") : [];
    
    const isPratama = listJenis.some(v => v.toUpperCase().includes("PRATAMA"));
    const isMadya = listJenis.some(v => v.toUpperCase().includes("MADYA"));

    let htmlContent = `
        <div style="font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b;">
            
            <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 50px 25px; border-radius: 0 0 40px 40px; text-align: center; margin: -30px -30px 25px -30px; color: white;">
                <img src="${formatDriveUrl(p.foto)}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=D71920&color=fff&size=150'"
                     style="width:130px; height:130px; border-radius:30px; object-fit:cover; border: 4px solid #D71920; box-shadow: 0 15px 30px rgba(0,0,0,0.4); margin-bottom:20px;">
                <h1 style="font-size: 24px; font-weight: 900; margin: 0; letter-spacing: 0.5px;">${(p.nama || '-').toUpperCase()}</h1>
                <div style="font-size: 12px; color: #fbbf24; font-weight: 700; margin-top: 8px; opacity: 0.9;">
                    NIK: ${p.nik || '-'} • KTA: ${p.kta || '-'}
                </div>
            </div>

            <div style="background: white; border-radius: 25px; padding: 25px; border: 2px solid #D71920; box-shadow: 0 10px 25px rgba(215,25,32,0.1); margin-bottom: 20px;">
                <div style="font-weight: 900; color: #D71920; font-size: 14px; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">🎖️</span> PENDIDIKAN KADERISASI PARTAI
                </div>
                <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
                    ${listJenis.length > 0 && listJenis[0] !== "" ? listJenis.map((val, idx) => `
                        <div style="background: #fff1f2; padding: 15px; border-radius: 15px; border-left: 5px solid #D71920;">
                            <div style="font-weight: 800; color: #b91c1c; font-size: 13px;">${val.trim().toUpperCase()}</div>
                            <div style="font-size: 11px; color: #4b5563; margin-top: 4px;">
                                <b>Penyelenggara:</b> ${listPenyel[idx] || '-'}<br>
                                <b>Lokasi:</b> ${listLokasi[idx] || '-'} • <b>Tahun:</b> ${listTahun[idx] || '-'}
                            </div>
                        </div>
                    `).join('') : '<div style="color:#94a3b8; font-size:12px; font-style:italic;">Belum mengikuti kaderisasi berjenjang.</div>'}
                </div>
            </div>

            <div style="background: white; border-radius: 25px; padding: 25px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                <div style="font-weight: 800; color: #64748b; font-size: 12px; margin-bottom: 15px; text-transform: uppercase;">📍 Detil Identitas Pribadi</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 12px;">
                    <div><label style="color:#94a3b8; font-weight:700;">JENIS KELAMIN</label><div style="font-weight:700;">${p.jk || '-'}</div></div>
                    <div><label style="color:#94a3b8; font-weight:700;">AGAMA</label><div style="font-weight:700;">${p.agama || '-'}</div></div>
                    <div><label style="color:#94a3b8; font-weight:700;">TEMPAT LAHIR</label><div style="font-weight:700;">${p.tmpt_lahir || '-'}</div></div>
                    <div><label style="color:#94a3b8; font-weight:700;">TGL LAHIR</label><div style="font-weight:700;">${p.tgl_lahir || '-'}</div></div>
                    <div><label style="color:#94a3b8; font-weight:700;">STATUS NIKAH</label><div style="font-weight:700;">${p.status_nikah || '-'}</div></div>
                    <div><label style="color:#94a3b8; font-weight:700;">WHATSAPP</label><div style="font-weight:700;">${p.wa || '-'}</div></div>
                    <div style="grid-column: span 2;"><label style="color:#94a3b8; font-weight:700;">EMAIL</label><div style="font-weight:700;">${p.email || '-'}</div></div>
                    <div style="grid-column: span 2;"><label style="color:#94a3b8; font-weight:700;">ALAMAT LENGKAP</label><div style="font-weight:700; line-height:1.4;">${p.alamat || '-'}, RT${p.rt}/RW${p.rw}, ${p.desa}, ${p.kec}, ${p.kota}</div></div>
                </div>
            </div>

            <div style="background: white; border-radius: 25px; padding: 25px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                <div style="font-weight: 800; color: #64748b; font-size: 12px; margin-bottom: 15px; text-transform: uppercase;">🎓 Riwayat Pendidikan Formal</div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${[
                        {label: 'SD', nama: f[2], lulus: f[3]},
                        {label: 'SMP', nama: f[4], lulus: f[5]},
                        {label: 'SMA/SMK', nama: f[6], lulus: f[8]},
                        {label: 'DIPLOMA', nama: f[9], lulus: f[10]},
                        {label: 'SARJANA (S1)', nama: f[11], lulus: f[14], prodi: f[12]},
                        {label: 'MAGISTER (S2)', nama: f[15], lulus: f[16]},
                        {label: 'DOKTOR (S3)', nama: f[17], lulus: f[18]}
                    ].filter(item => item.nama && item.nama !== '-').map(edu => `
                        <div style="background: #f8fafc; padding: 12px; border-radius: 12px;">
                            <div style="font-size: 9px; font-weight: 900; color: #D71920;">${edu.label}</div>
                            <div style="font-weight: 700; font-size: 13px;">${edu.nama} ${edu.prodi ? '<small>('+edu.prodi+')</small>' : ''}</div>
                            <div style="font-size: 10px; color: #64748b;">Lulus Tahun: ${edu.lulus}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div style="background: white; border-radius: 25px; padding: 25px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                <div style="font-weight: 800; color: #64748b; font-size: 12px; margin-bottom: 15px; text-transform: uppercase;">🚩 STRUKTUR & PENUGASAN PARTAI</div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${j.length > 0 ? j.map(row => `
                        <div style="background: #f1f5f9; padding: 15px; border-radius: 15px; border-left: 5px solid #1e293b;">
                            <div style="font-weight: 800; font-size: 13px;">${row[5] || row[12]}</div>
                            <div style="font-size: 11px; color: #475569;">${row[4] || row[10]}</div>
                            <div style="font-size: 11px; font-weight: 700; color: #D71920; margin-top: 5px;">Periode: ${row[8] || row[14]}</div>
                        </div>
                    `).join('') : '<div style="font-size:12px; color:#94a3b8;">Tidak ada riwayat penugasan.</div>'}
                </div>
            </div>

            <div style="background: white; border-radius: 25px; padding: 25px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                <div style="font-weight: 800; color: #64748b; font-size: 12px; margin-bottom: 15px; text-transform: uppercase;">💼 RIWAYAT PEKERJAAN & ORGANISASI</div>
                <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px dashed #e2e8f0;">
                    <label style="font-size: 10px; color: #94a3b8; font-weight: 800;">PEKERJAAN SEKARANG:</label>
                    <div style="font-weight: 700; font-size: 13px; color: #1e293b;">${p.kerja_skrg || '-'}</div>
                </div>
                <div style="font-size: 11px; line-height: 1.6;">
                    <b style="color: #1e293b;">Organisasi Kemasyarakatan:</b><br>
                    ${rj.length > 0 ? rj.map(o => `• <b>${o[2]}</b> sebagai ${o[4]} (${o[5]})`).join('<br>') : '-'}
                </div>
            </div>

            <div style="background: #0f172a; border-radius: 25px; padding: 25px; color: white; margin-bottom: 30px;">
                <div style="color: #fbbf24; font-weight: 900; font-size: 14px; margin-bottom: 20px;">🌐 KOMPETENSI & MEDIA SOSIAL</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 12px;">
                        <label style="font-size: 8px; color: #94a3b8; display: block; margin-bottom: 4px;">BAHASA</label>
                        <span style="font-size: 12px; font-weight: 700;">${p.bahasa || '-'}</span>
                    </div>
                    <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 12px;">
                        <label style="font-size: 8px; color: #94a3b8; display: block; margin-bottom: 4px;">SKILL KOMPUTER</label>
                        <span style="font-size: 12px; font-weight: 700;">${ms[8] || '-'}</span>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px; font-size: 12px;">
                    <div style="display: flex; justify-content: space-between; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px;">
                        <span style="color:#94a3b8;">Facebook</span> <b>${ms[9] || '-'}</b>
                    </div>
                    <div style="display: flex; justify-content: space-between; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px;">
                        <span style="color:#94a3b8;">Instagram</span> <b>${ms[10] || '-'}</b>
                    </div>
                    <div style="display: flex; justify-content: space-between; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px;">
                        <span style="color:#94a3b8;">TikTok</span> <b>${ms[11] || '-'}</b>
                    </div>
                </div>
            </div>

            <button onclick="window.print()" style="width: 100%; background: #D71920; color: white; border: none; padding: 20px; border-radius: 20px; font-weight: 900; cursor: pointer; font-size: 15px; box-shadow: 0 10px 20px rgba(215,25,32,0.3);">
                🖨️ CETAK DOSSIER LENGKAP
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
