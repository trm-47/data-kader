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

// --- MODAL DETAIL LOGIC ---
function openDetail(originalIndex) {
    const item = databaseKader[originalIndex];
    if (!item) return;

    const p = item.pribadi || {};
    const f = item.formal || [];
    const k = item.kaderisasi || [];
    const j = item.jabatan || [];
    const rj = item.riwayat_kerja || [];
    const ms = item.medsos || [];
    const org = item.organisasi || [];

    // --- LOGIKA ANALISA JENJANG ---
    const listThnKader = k[5] ? k[5].toString().split("\n") : [];
    const getYearKader = (no) => {
        const found = listThnKader.find(t => t.trim().startsWith(no + "."));
        return found ? found.replace(no + ".", "").trim() : null;
    };
    const thnPratama = getYearKader("1");
    const thnMadya = getYearKader("2");

    let htmlContent = `
        <div style="text-align:center; margin-bottom:30px; background: linear-gradient(135deg, #fff1f2 0%, #ffffff 100%); padding: 50px 20px; border-radius: 0 0 50px 50px; margin: -30px -30px 40px -30px; border-bottom: 2px solid #fee2e2; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
            <div style="position: relative; display: inline-block;">
                <img src="${formatDriveUrl(p.foto)}" 
                     onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=D71920&color=fff&size=128'"
                     style="width:150px; height:150px; border-radius:50%; object-fit:cover; border: 6px solid white; box-shadow: 0 15px 35px rgba(215,25,32,0.25);">
                <div style="position: absolute; bottom: 5px; right: 5px; background: #059669; color: white; width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; font-size: 18px;">✓</div>
            </div>
            <h2 style="margin-top:25px; color:#1e293b; font-size:28px; font-weight:800; letter-spacing:-0.5px;">${p.nama ? p.nama.toUpperCase() : '-'}</h2>
            <div style="display: inline-block; background: rgba(215,25,32,0.1); color: #D71920; padding: 6px 16px; border-radius: 20px; font-weight: 800; font-size: 13px; margin-top: 5px;">
                ID KADER: ${p.kta || '-'}
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
            <div style="background: white; padding: 20px; border-radius: 20px; border: 1px solid #f1f5f9; box-shadow: 0 10px 20px rgba(0,0,0,0.02); text-align: center;">
                <small style="color: #64748b; font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">Kader Pratama</small>
                <div style="font-size: 18px; font-weight: 800; margin-top: 5px; color: ${thnPratama ? '#059669' : '#cbd5e1'};">
                    ${thnPratama ? '✅ LULUS ' + thnPratama : '未 LULUS'}
                </div>
            </div>
            <div style="background: white; padding: 20px; border-radius: 20px; border: 1px solid #f1f5f9; box-shadow: 0 10px 20px rgba(0,0,0,0.02); text-align: center;">
                <small style="color: #64748b; font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">Kader Madya</small>
                <div style="font-size: 18px; font-weight: 800; margin-top: 5px; color: ${thnMadya ? '#059669' : '#D71920'};">
                    ${thnMadya ? '✅ LULUS ' + thnMadya : '⏳ BELUM'}
                </div>
            </div>
        </div>

        <div class="profile-section" style="background: white; padding: 25px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.03); margin-bottom: 25px; border: 1px solid #f1f5f9;">
            <div class="section-title">📍 Identitas & Kontak Pribadi</div>
            <div class="data-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="data-item"><label>NIK</label><span>${p.nik || '-'}</span></div>
                <div class="data-item"><label>Email</label><span>${p.email || '-'}</span></div>
                <div class="data-item"><label>Tempat, Tgl Lahir</label><span>${p.tmpt_lahir || '-'}, ${p.tgl_lahir || '-'}</span></div>
                <div class="data-item"><label>WhatsApp</label><span>${p.wa || '-'}</span></div>
                <div class="data-item" style="grid-column: span 2;"><label>Alamat Lengkap</label><span>${p.alamat || '-'}, RT ${p.rt}/RW ${p.rw}, Kel. ${p.desa}, Kec. ${p.kec}, ${p.kota}</span></div>
            </div>
        </div>

        <div class="profile-section" style="background: white; padding: 25px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.03); margin-bottom: 25px; border: 1px solid #f1f5f9;">
            <div class="section-title">🎓 Riwayat Pendidikan Formal</div>
            <div class="data-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="data-item"><label>Jenjang Terakhir</label><span style="color:#D71920;">${f[19] || '-'}</span></div>
                <div class="data-item"><label>SMA/SMK</label><span>${f[6] || '-'} (${f[8] || '-'})</span></div>
                <div class="data-item" style="grid-column: span 2;"><label>Perguruan Tinggi</label><span>${f[11] || '-'} ${f[12] ? ' - ' + f[12] : ''} (${f[14] || '-'})</span></div>
            </div>
        </div>

        <div class="profile-section" style="background: #1e293b; padding: 25px; border-radius: 24px; color: white; margin-bottom: 25px;">
            <div class="section-title" style="color: #fbbf24; border-bottom: 1px solid rgba(255,255,255,0.1);">📜 Sertifikasi Kaderisasi Partai</div>
            <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 15px;">
                ${k[2] ? k[2].split("\n").map((val, idx) => `
                    <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; border-left: 4px solid #D71920;">
                        <div style="font-weight: 800; font-size: 15px;">${val}</div>
                        <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
                            ${k[3].split("\n")[idx] || '-'} • Tahun ${k[5].split("\n")[idx] || '-'}
                        </div>
                    </div>
                `).join('') : '<div style="color:#64748b">Belum ada riwayat kaderisasi</div>'}
            </div>
        </div>

        <div class="profile-section" style="background: white; padding: 25px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.03); margin-bottom: 25px; border: 1px solid #f1f5f9;">
            <div class="section-title">🚩 Jabatan Partai & Pengalaman</div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${j.length > 0 ? j.map(row => `
                    <div style="display: flex; align-items: flex-start; gap: 12px; padding: 12px; background: #f8fafc; border-radius: 12px;">
                        <div style="background: #D71920; color: white; padding: 5px 10px; border-radius: 8px; font-size: 10px; font-weight: 800;">${row[2] === 'Struktur Partai' ? 'STRUKTUR' : 'TUGAS'}</div>
                        <div>
                            <div style="font-weight: 700; font-size: 14px; color: #1e293b;">${row[5] || row[12]}</div>
                            <div style="font-size: 12px; color: #64748b;">${row[4] || row[10]} | ${row[8] || row[14]}</div>
                        </div>
                    </div>
                `).join('') : '<div style="color:#64748b">Tidak ada data jabatan</div>'}
            </div>
        </div>

        <div class="profile-section" style="background: white; padding: 25px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.03); margin-bottom: 40px; border: 1px solid #f1f5f9;">
            <div class="section-title">📱 Kompetensi & Media Sosial</div>
            <div class="data-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                <div class="data-item"><label>Pekerjaan Sekarang</label><span>${p.kerja_skrg || '-'}</span></div>
                <div class="data-item"><label>Skill Komputer</label><span>${ms[8] || '-'}</span></div>
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                ${ms[9] && ms[9] !== '-' ? `<div style="background:#1877F2; color:white; padding:8px 15px; border-radius:12px; font-size:12px; font-weight:700;">Facebook: ${ms[9]}</div>` : ''}
                ${ms[10] && ms[10] !== '-' ? `<div style="background:linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); color:white; padding:8px 15px; border-radius:12px; font-size:12px; font-weight:700;">Instagram: ${ms[10]}</div>` : ''}
                ${ms[11] && ms[11] !== '-' ? `<div style="background:black; color:white; padding:8px 15px; border-radius:12px; font-size:12px; font-weight:700;">TikTok: ${ms[11]}</div>` : ''}
            </div>
        </div>

        <div style="text-align:center; padding-bottom: 40px;">
             <button onclick="window.print()" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color:white; border:none; padding:18px 40px; border-radius:20px; font-weight:800; cursor:pointer; box-shadow: 0 10px 20px rgba(0,0,0,0.15); display: inline-flex; align-items: center; gap: 10px; transition: all 0.3s;">
                <span>🖨️</span> CETAK DOSSIER KADER
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
