const URL_GAS = "https://script.google.com/macros/s/AKfycbzBSsrPtfxQZu6cel7fSp7CpFUEOsw5D0cZpST6S8_ohXRZyH0BpKYXngmctCxX12DPyw/exec";
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
    return fileId ? `https://lh3.googleusercontent.com/u/0/d/${fileId}` : url;
}


function renderTable(data) {
    const body = document.getElementById('bodyKader');
    if (!body) return;
    body.innerHTML = "";

    if (!data || data.length === 0) {
        body.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:50px; color:#94a3b8; font-weight:700;">Data tidak ditemukan.</td></tr>';
        return;
    }

    // --- DIRECT LINKS ICON SOSMED ---
    const icons = {
        wa: "https://i.ibb.co.com/DgPcPB2m/facebook.png",
        fb: "https://i.ibb.co.com/MDtWd14P/instagram.png",
        ig: "https://i.ibb.co.com/yn2M52Vn/whatsapp.png",
        tt: "https://i.ibb.co.com/0pcvzQKD/tiktok.png",
        tw: "https://i.ibb.co.com/QFS9fF1c/youtube.png",
        yt: "https://i.ibb.co.com/PvLFcxKx/icons8-youtube-96.png"
    };

    data.forEach((item) => {
        if (!item || !item.pribadi) return;
        const p = item.pribadi;
        const f = item.formal || [];
        const k = item.kaderisasi || [];
        const ageInfo = calculateAge(p.tgl_lahir);

        // --- LOGIKA PRIORITAS ---
        const textJenisKader = k[2] ? k[2].toString().toLowerCase() : ""; 
        const textTahunKader = k[5] ? k[5].toString() : ""; 
        const matchPratama = textTahunKader.match(/1\.\s*(\d{4})/) || textTahunKader.match(/^(\d{4})/);
        const tahunPratama = matchPratama ? parseInt(matchPratama[1]) : null;
        
        let rowStyle = "";
        let badgeWarning = "";

        if (textJenisKader.includes("pratama") && !textJenisKader.includes("madya") && tahunPratama) {
            const currentYear = new Date().getFullYear();
            const masaTunggu = currentYear - tahunPratama;
            if (masaTunggu >= 5) {
                rowStyle = "background-color: #f1f5f9; border-left: 4px solid #64748b;"; 
                badgeWarning = `<div style="color:#475569; font-size:9px; font-weight:800; margin-top:4px; letter-spacing:0.5px;">● PRIORITAS MADYA (${masaTunggu} THN)</div>`;
            } else {
                rowStyle = "background-color: #f8fafc; border-left: 4px solid #e2e8f0;"; 
                badgeWarning = `<div style="color:#94a3b8; font-size:9px; font-weight:800; margin-top:4px; letter-spacing:0.5px;">● MASA TUNGGU (${masaTunggu} THN)</div>`;
            }
        }

        // --- BADGE KADERISASI (CENTERED BOX, LEFT TEXT) ---
        let htmlBadgeKader = "";
        if (k[2] && k[2].toString().trim() !== "" && k[2] !== "-") {
            const listJenjang = k[2].toString().split("\n");
            listJenjang.forEach(txt => {
                if(txt.trim()) {
                    htmlBadgeKader += `
                        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 3px solid #D71920; color: #334155; padding: 4px 10px; border-radius: 4px; font-size: 9px; font-weight: 800; margin: 0 auto 4px auto; width: fit-content; min-width: 95px; text-align: left; letter-spacing: 0.5px; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
                            ${txt.trim().toUpperCase()}
                        </div>`;
                }
            });
        } else {
            htmlBadgeKader = `<span style="color: #cbd5e1; font-size: 9px; font-weight: 700; letter-spacing: 1px;">ANGGOTA</span>`;
        }

        // --- PENDIDIKAN (LOGIKA ANTI-HILANG) ---
        let infoPendidikan = `<div style="font-size:10px; color:#cbd5e1; font-weight:700;">${(p.kec || '-').toUpperCase()}</div>`;
        const listEdu = [
            { label: "S3", idx: 17 }, { label: "S2", idx: 15 }, { label: "S1", idx: 11 },
            { label: "D1-D3", idx: 9 }, { label: "SMA/SMK", idx: 6 }, { label: "SMP", idx: 4 }, { label: "SD", idx: 2 }
        ];

        for (let edu of listEdu) {
            let rawData = f[edu.idx];
            if (rawData && rawData.toString().trim() !== "" && rawData.toString().trim() !== "-" && rawData.toString().trim().toLowerCase() !== "undefined") {
                let detail = (edu.label === "S1") ? (f[12] || f[11] || rawData) : rawData;
                infoPendidikan = `
                    <strong style="color:#334155; font-size:11px; display:block; line-height:1.2;">${edu.label}</strong>
                    <div style="font-size:10px; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:160px; font-weight:600;">
                        ${detail.toString().toUpperCase()}
                    </div>`;
                break;
            }
        }

        const originalIdx = databaseKader.indexOf(item);
        const waNumber = p.wa ? p.wa.toString().replace(/[^0-9]/g, '') : '';
        const waLink = waNumber ? `https://wa.me/${waNumber.startsWith('0') ? '62'+waNumber.slice(1) : waNumber}` : '#';

        // --- RENDER BARIS ---
        body.innerHTML += `
            <tr onclick="openDetail(${originalIdx})" style="cursor:pointer; border-bottom: 1px solid #f1f5f9; ${rowStyle}">
                <td style="width:65px; text-align:center; padding:12px 5px;">
                    <img src="${formatDriveUrl(p.foto)}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=f1f5f9&color=94a3b8'" style="width:42px; height:42px; border-radius:10px; object-fit:cover; border:1px solid #e2e8f0;">
                </td>
                <td style="padding:12px 5px;">
                    <div style="font-weight:800; font-size:13px; color:#1e293b; letter-spacing:-0.2px;">${(p.nama || 'Tanpa Nama').toUpperCase()}</div>
                    <div style="font-size:10px; color:#D71920; font-weight:700; letter-spacing:0.3px;">KTA: ${p.kta || '-'}</div>
                    ${badgeWarning}
                </td>
                <td style="text-align:center; width:75px; padding:12px 5px;">
                    <div style="font-weight:800; color:#1e293b; font-size:13px;">${ageInfo.age}</div>
                    <div style="font-size:9px; color:#94a3b8; font-weight:800; text-transform:uppercase;">${ageInfo.gen}</div>
                </td>
                <td style="padding:12px 5px; min-width:150px;">
                    ${infoPendidikan}
                </td>
                <td style="padding:12px 5px; width:150px; text-align:center;">
                    ${htmlBadgeKader}
                </td>
                <td style="text-align:center; width:100px; padding:12px 5px;">
                    ${waNumber ? `
                        <a href="${waLink}" target="_blank" onclick="event.stopPropagation()" style="
                            display: inline-flex;
                            align-items: center;
                            gap: 8px;
                            background: #ffffff;
                            border: 1px solid #e2e8f0;
                            border-left: 3px solid #16a34a;
                            color: #16a34a;
                            padding: 5px 10px;
                            border-radius: 4px;
                            text-decoration: none;
                            font-size: 9px;
                            font-weight: 800;
                            letter-spacing: 0.5px;
                            box-shadow: 0 1px 2px rgba(0,0,0,0.03);
                        ">
                            <img src="https://i.ibb.co.com/DgPcPB2m/facebook.png" style="width:14px; height:14px; object-fit:contain;"> CHAT
                        </a>` : `<span style="color:#e2e8f0;">-</span>`}
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

function formatTanggalIndo(isoString) {
    if (!isoString || isoString === "-") return "-";
    try {
        // Jika input sudah objek Date dari Google Sheets
        const date = (isoString instanceof Date) ? isoString : new Date(isoString);
        
        if (isNaN(date.getTime())) return isoString; 

        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        
        return `${d}-${m}-${y}`; 
    } catch (e) {
        return isoString;
    }
}

function openDetail(originalIndex) {
    const item = databaseKader[originalIndex];
    if (!item) return;

    // --- DATA MAPPING (TETAP SAMA) ---
    const p = item.pribadi || {};
    const f = item.formal || [];
    const k = item.kaderisasi || []; 
    const m = item.medsos || {};
    const jList = item.jabatan || [];
    const wList = item.pekerjaan || [];
    const oList = item.organisasi_lain || [];
    const ageInfo = calculateAge(p.tgl_lahir);
    const tglLahirFormat = (typeof formatTanggalIndo === 'function') ? formatTanggalIndo(p.tgl_lahir) : (p.tgl_lahir || "-");
    const textJenis = k[2] ? k[2].toString().split("\n") : [];
    const listLembaga = k[3] ? k[3].toString().split("\n") : []; 
    const listLokasi = k[4] ? k[4].toString().split("\n") : [];
    const listThn = k[5] ? k[5].toString().split("\n") : [];
    
    const getKaderData = (keyword) => {
        const idx = textJenis.findIndex(t => t.toLowerCase().includes(keyword.toLowerCase()));
        if (idx !== -1) {
            return {
                tahun: listThn[idx] ? listThn[idx].replace(/^\d+\.\s*/, "").trim() : "Aktif",
                lembaga: listLembaga[idx] ? listLembaga[idx].replace(/^\d+\.\s*/, "").trim() : "-",
                lokasi: listLokasi[idx] ? listLokasi[idx].replace(/^\d+\.\s*/, "").trim() : "-"
            };
        }
        return null;
    };

    // --- PREMIUM STEPPER RENDERER ---
    const renderKaderStep = (label, color) => {
        const data = getKaderData(label);
        const isActive = data !== null;
        return `
            <div style="flex:1; position:relative; padding: 0 5px;">
                <div style="width:22px; height:22px; border-radius:50%; background:${isActive ? color : '#f3f4f6'}; margin: 0 auto 8px; border: 3px solid #fff; box-shadow: 0 0 0 2px ${isActive ? color : '#e5e7eb'}; display:flex; align-items:center; justify-content:center; color:white; font-size:10px; z-index:2; position:relative;">
                    ${isActive ? '✓' : ''}
                </div>
                <div style="font-weight:800; font-size:10px; color:${isActive ? '#1f2937' : '#9ca3af'}; text-transform:uppercase; letter-spacing:0.5px;">${label}</div>
                <div style="min-height:40px; margin-top:5px;">
                    ${isActive ? `
                        <div style="color:${color}; font-weight:700; font-size:11px;">${data.tahun}</div>
                        <div style="color:#4b5563; font-size:9px; font-weight:600; line-height:1.1;">${data.lembaga}</div>
                    ` : '<div style="color:#d1d5db; font-size:14px;">•</div>'}
                </div>
            </div>
        `;
    };

    // --- MULAI RENDER HTML (HYPER PREMIUM) ---
    let htmlContent = `
    <div style="font-family:'Inter', sans-serif; background:#f4f7f6; color:#334155;">
        
        <div style="background: linear-gradient(135deg, #D71920 0%, #a50f15 100%); padding: 40px 25px; border-radius: 0 0 30px 30px; position: relative; overflow: hidden; box-shadow: 0 10px 20px rgba(215, 25, 32, 0.2);">
            <div style="position: absolute; top: -20px; right: -20px; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
            
            <div style="display: flex; align-items: center; gap: 25px; position: relative; z-index: 1;">
                <div style="position: relative;">
                    <img src="${formatDriveUrl(p.foto)}" 
                         onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=fff&color=D71920&size=128'"
                         style="width: 130px; height: 130px; border-radius: 25px; object-fit: cover; border: 4px solid #fff; box-shadow: 0 8px 20px rgba(0,0,0,0.15);">
                    <div style="position: absolute; bottom: -8px; right: -8px; background: #fff; width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        <img src="https://i.ibb.co.com/N2K0XRMW/logo-pdi.png" style="width: 24px;">
                    </div>
                </div>
                
                <div style="color: #fff;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">KADER AKTIF</span>
                        <span style="font-size: 13px; font-weight: 500; opacity: 0.9;">KTA: ${p.kta || '-'}</span>
                    </div>
                    <h2 style="margin: 0; font-size: 30px; font-weight: 900; letter-spacing: -0.5px;">${(p.nama || 'TANPA NAMA').toUpperCase()}</h2>
                    <div style="margin-top: 10px; font-size: 15px; opacity: 0.9; display: flex; align-items: center; gap: 15px;">
                        <span><i class="fa-solid fa-fingerprint"></i> ${p.nik || '-'}</span>
                        <span><i class="fa-solid fa-location-dot"></i> ${cap(p.kab_kota)}</span>
                    </div>
                </div>
            </div>
        </div>

        <div style="padding: 25px; display: flex; flex-direction: column; gap: 25px;">
            
            <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px;">
                <div style="background: #fff; padding: 25px; border-radius: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #edf2f7;">
                    <h3 style="margin-top:0; color:#D71920; font-size:16px; font-weight:800; display:flex; align-items:center; gap:10px; margin-bottom:20px;">
                        <i class="fa-solid fa-address-card"></i> IDENTITAS LENGKAP
                    </h3>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                        <div>
                            <label style="display:block; font-size:10px; font-weight:700; color:#94a3b8; margin-bottom:5px;">TTL</label>
                            <div style="font-weight:700; color:#1e293b; font-size:14px;">${cap(p.tmpt_lahir)}, ${tglLahirFormat}</div>
                        </div>
                        <div>
                            <label style="display:block; font-size:10px; font-weight:700; color:#94a3b8; margin-bottom:5px;">AGAMA / GENDER</label>
                            <div style="font-weight:700; color:#1e293b; font-size:14px;">${cap(p.agama)} / ${cap(p.jk)}</div>
                        </div>
                        <div>
                            <label style="display:block; font-size:10px; font-weight:700; color:#94a3b8; margin-bottom:5px;">PEKERJAAN / USIA</label>
                            <div style="font-weight:700; color:#1e293b; font-size:14px;">${cap(p.kerja_skrg)} (${ageInfo.age})</div>
                        </div>
                        <div>
                            <label style="display:block; font-size:10px; font-weight:700; color:#94a3b8; margin-bottom:5px;">WHATSAPP / EMAIL</label>
                            <div style="font-weight:700; color:#25d366; font-size:13px;">${p.wa || '-'} <br> <span style="color:#0284c7; font-size:11px;">${(p.email || '-').toLowerCase()}</span></div>
                        </div>
                    </div>
                    <div style="margin-top: 20px; padding-top: 15px; border-top: 1px dashed #e2e8f0;">
                        <label style="display:block; font-size:10px; font-weight:700; color:#94a3b8; margin-bottom:8px;">ALAMAT DOMISILI</label>
                        <div style="background:#f8fafc; padding:12px; border-radius:12px; border-left: 4px solid #cbd5e1; font-size:13px; line-height:1.5;">
                            <strong>${cap(p.alamat)}</strong>, RT ${p.rt}/RW ${p.rw}<br>
                            Kelurahan ${cap(p.desa)}, Kecamatan ${cap(p.kec)}, ${cap(p.kab_kota)}
                        </div>
                    </div>
                </div>

                <div style="background: #fff; padding: 25px; border-radius: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #edf2f7;">
                    <h3 style="margin-top:0; color:#D71920; font-size:16px; font-weight:800; display:flex; align-items:center; gap:10px; margin-bottom:20px;">
                        <i class="fa-solid fa-star"></i> SKILL & BAHASA
                    </h3>
                    <div style="margin-bottom:15px;">
                        <label style="display:block; font-size:10px; font-weight:700; color:#94a3b8; margin-bottom:5px;">SKILL KOMPUTER</label>
                        <div style="font-weight:600; color:#1e293b; font-size:13px;">${cap(m.komputer || '-')}</div>
                    </div>
                    <div>
                        <label style="display:block; font-size:10px; font-weight:700; color:#94a3b8; margin-bottom:5px;">PENGUASAAN BAHASA</label>
                        <div style="display:flex; flex-wrap:wrap; gap:5px; margin-top:5px;">
                            ${[
                                {key: m.bahasa_indo, label: "Indonesia"},
                                {key: m.bahasa_inggris, label: "Inggris"},
                                {key: m.bahasa_jawa, label: "Jawa"}
                            ].map(b => b.key === "Ya" ? `<span style="background:#f1f5f9; padding:4px 10px; border-radius:8px; font-size:11px; font-weight:700; color:#475569;">${b.label}</span>` : '').join('')}
                            <span style="background:#f1f5f9; padding:4px 10px; border-radius:8px; font-size:11px; font-weight:700; color:#475569;">${(m.bahasa_lain && m.bahasa_lain !== ", ") ? cap(m.bahasa_lain) : "-"}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div style="background: #fff; padding: 25px; border-radius: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #edf2f7; text-align:center;">
                <h3 style="margin-top:0; color:#D71920; font-size:16px; font-weight:800; margin-bottom:25px; text-align:left;">
                    <i class="fa-solid fa-diagram-project"></i> ANALISA JENJANG KADERISASI
                </h3>
                <div style="display: flex; justify-content: space-between; position: relative; margin-bottom: 20px;">
                    <div style="position: absolute; top: 11px; left: 5%; right: 5%; height: 2px; background: #f3f4f6; z-index: 1;"></div>
                    ${renderKaderStep('PRATAMA', '#ef4444')}
                    ${renderKaderStep('MADYA', '#dc2626')}
                    ${renderKaderStep('UTAMA', '#b91c1c')}
                    ${renderKaderStep('GURU', '#991b1b')}
                    ${renderKaderStep('WANITA', '#db2777')}
                    ${renderKaderStep('KHUSUS', '#1e293b')}
                </div>
            </div>

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="background: #fff; padding: 25px; border-radius: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #edf2f7;">
                    <h3 style="margin-top:0; color:#D71920; font-size:15px; font-weight:800; margin-bottom:15px; display:flex; align-items:center; gap:8px;">
                        <i class="fa-solid fa-sitemap"></i> STRUKTUR PARTAI
                    </h3>
                    ${jList.filter(r => String(r[2]).trim() === "Struktur Partai").map(r => `
                        <div style="background:#fff5f5; border-left:4px solid #D71920; padding:12px; border-radius:12px; margin-bottom:10px;">
                            <div style="font-weight:800; color:#b91c1c; font-size:13px;">${(r[5] || '-').toUpperCase()}</div>
                            <div style="font-size:12px; font-weight:600; color:#475569;">Jabatan: ${cap(r[4] || '-')}</div>
                            <div style="font-size:11px; color:#94a3b8; margin-top:4px;">
                                <i class="fa-solid fa-map-pin"></i> <b>${cap(r[7] || '-')}</b> | <i class="fa-solid fa-calendar"></i> ${r[8] || '-'}
                            </div>
                        </div>
                    `).join('') || '<div style="color:#cbd5e1; font-style:italic; font-size:12px; text-align:center; padding:20px;">Tidak ada data struktur</div>'}
                </div>

                <div style="background: #fff; padding: 25px; border-radius: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #edf2f7;">
                    <h3 style="margin-top:0; color:#0284c7; font-size:15px; font-weight:800; margin-bottom:15px; display:flex; align-items:center; gap:8px;">
                        <i class="fa-solid fa-briefcase"></i> PENUGASAN (LEGISLATIF/EKSEKUTIF)
                    </h3>
                    <div class="list-container">
                        ${jList.filter(r => String(r[2]).trim() === "Penugasan").map(r => `
                            <div style="border-left:4px solid #0284c7; padding:12px; margin-bottom:10px; background:#f0f9ff; border-radius:12px; font-size:12px;">
                                <strong style="color:#0284c7; font-size:13px;">${cap(r[12] || '-')}</strong><br>
                                <span style="font-weight:600; color:#475569;">Lembaga: ${cap(r[11] || '-')}</span><br>
                                <div style="margin-top:4px; color:#64748b;">
                                    <small>Wilayah: <b>${cap(r[13] || '-')}</b></small><br>
                                    <small>Periode: <b>${r[14] || '-'}</b></small>
                                </div>
                            </div>
                        `).join('') || '<div style="color:#cbd5e1; font-style:italic; font-size:12px; text-align:center; padding:20px;">Tidak ada data penugasan</div>'}
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="background: #fff; padding: 25px; border-radius: 24px; border: 1px solid #edf2f7;">
                    <h3 style="margin-top:0; color:#334155; font-size:14px; font-weight:800; margin-bottom:15px; border-bottom:2px solid #f1f5f9; padding-bottom:8px;">PENGALAMAN & ORGANISASI</h3>
                    <div style="font-size:12px; line-height:1.6;">
                        <div style="font-weight:800; color:#D71920; font-size:10px; letter-spacing:1px; margin-bottom:5px;">ORGANISASI EKSTERNAL</div>
                        ${oList.map(r => `<div style="margin-bottom:5px; padding-left:10px; border-left:2px solid #e2e8f0;">• ${cap(r[2])} <span style="color:#94a3b8;">(${cap(r[4])})</span></div>`).join('') || '-'}
                        <div style="font-weight:800; color:#D71920; font-size:10px; letter-spacing:1px; margin-top:15px; margin-bottom:5px;">RIWAYAT PEKERJAAN</div>
                        ${wList.map(r => `<div style="margin-bottom:5px; padding-left:10px; border-left:2px solid #e2e8f0;">• ${cap(r[4])} <br><small style="color:#64748b;">${cap(r[2])} (${r[5] || '-'})</small></div>`).join('') || '-'}
                    </div>
                </div>

                <div style="background: #fff; padding: 25px; border-radius: 24px; border: 1px solid #edf2f7;">
                    <h3 style="margin-top:0; color:#334155; font-size:14px; font-weight:800; margin-bottom:15px; border-bottom:2px solid #f1f5f9; padding-bottom:8px;">PENDIDIKAN FORMAL</h3>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${[
                            {l: "S3", n: f[17], t: f[18]}, {l: "S2", n: f[15], t: f[16]}, {l: "S1", n: f[11], t: f[14]},
                            {l: "DIPLOMA", n: f[9], t: f[10]}, {l: "SMA", n: f[6], t: f[8]}, {l: "SMP", n: f[4], t: f[5]}, {l: "SD", n: f[2], t: f[3]}
                        ].filter(e => e.n && e.n !== "-").map(e => `
                            <div style="display:flex; align-items:center; gap:10px;">
                                <div style="min-width:45px; font-size:9px; font-weight:900; background:#f8fafc; padding:3px 6px; border-radius:5px; color:#64748b; text-align:center;">${e.l}</div>
                                <div style="font-size:12px; font-weight:700; color:#1e293b;">${cap(e.n)} <span style="font-weight:400; color:#94a3b8;">(${e.t || '-'})</span></div>
                            </div>
                        `).join('') || '-'}
                    </div>
                </div>
            </div>

            <div style="background: #1e293b; padding: 20px; border-radius: 24px; text-align: center; color:#fff;">
                <div style="font-size:10px; font-weight:700; letter-spacing:2px; opacity:0.6; margin-bottom:15px;">MEDIA SOSIAL</div>
                <div style="display: flex; gap: 15px; justify-content: center;">
                ${renderMedsosIcoPremium('fb', m.fb)}
                ${renderMedsosIcoPremium('ig', m.ig)}
                ${renderMedsosIcoPremium('tt', m.tiktok)}
                ${renderMedsosIcoPremium('tw', m.twitter)}
                ${renderMedsosIcoPremium('yt', m.youtube)}}
                </div>
            </div>

            <div style="text-align:center; padding-bottom:20px;">
                <button onclick="window.print()" style="background:#D71920; color:white; border:none; padding:15px 40px; border-radius:15px; cursor:pointer; font-weight:800; font-size:14px; box-shadow:0 10px 20px rgba(215, 25, 32, 0.3); display:inline-flex; align-items:center; gap:10px;">
                    <i class="fa-solid fa-print"></i> CETAK DOKUMEN PROFIL
                </button>
            </div>
        </div>
    </div>
    `;

    const modalInner = document.getElementById('modalInnerContent');
    modalInner.innerHTML = htmlContent;
    document.getElementById('modalDetail').style.display = "block";
    modalInner.scrollTop = 0;
}

// Fungsi pembantu Icon Medsos Premium (SUDAH DISESUAIKAN KE IMGBB)
function renderMedsosIcoPremium(type, val) {
    if (!val || val === "-" || val === "" || val.toLowerCase() === "undefined") return '';

    // Mapping link icon sesuai koleksi ImgBB Bos
    const libIcons = {
        wa: "https://i.ibb.co.com/DgPcPB2m/facebook.png",
        fb: "https://i.ibb.co.com/MDtWd14P/instagram.png",
        ig: "https://i.ibb.co.com/yn2M52Vn/whatsapp.png",
        tt: "https://i.ibb.co.com/0pcvzQKD/tiktok.png",
        tw: "https://i.ibb.co.com/QFS9fF1c/youtube.png",
        yt: "https://i.ibb.co.com/PvLFcxKx/icons8-youtube-96.png"
    };

    const iconUrl = libIcons[type] || "";

    return `
        <a href="${val}" target="_blank" title="${type.toUpperCase()}" style="
            width: 44px; 
            height: 44px; 
            border-radius: 12px; 
            background: #ffffff; 
            border: 1px solid #e2e8f0;
            display: flex; 
            align-items: center; 
            justify-content: center; 
            text-decoration: none; 
            transition: 0.3s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        ">
            <img src="${iconUrl}" style="width:22px; height:22px; object-fit:contain;" onerror="this.style.display='none'">
        </a>
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
