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
            const listJenjang = k[2].toString().split("\n");
            htmlBadgeKader = `<div style="display: flex; flex-wrap: wrap; gap: 4px; justify-content: center;">`;
            listJenjang.forEach(jenjangText => {
                if(jenjangText.trim()) {
                    let bColor = "#fee2e2"; let tColor = "#D71920";
                    if(jenjangText.toUpperCase().includes("MADYA")) { bColor = "#1e293b"; tColor = "#fbbf24"; }
                    
                    htmlBadgeKader += `<span style="background:${bColor}; color:${tColor}; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:800; border:1px solid rgba(0,0,0,0.05); white-space:nowrap;">${jenjangText.trim().toUpperCase()}</span>`;
                }
            });
            htmlBadgeKader += `</div>`;
        } else {
            htmlBadgeKader = `<span class="badge badge-gray">ANGGOTA</span>`;
        }

        const waNumber = p.wa ? p.wa.toString().replace(/[^0-9]/g, '') : '';
        const waLink = waNumber ? `https://wa.me/${waNumber.startsWith('0') ? '62' + waNumber.slice(1) : waNumber}` : '#';

        const originalIdx = databaseKader.indexOf(item);

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

        const textJenis = k[2] ? k[2].toString().toLowerCase() : "";
        const isMadya = textJenis.includes("madya");
        const hasPratama = textJenis.includes("pratama");

        if (isMadya) {
            madyaCount++;
        } else if (hasPratama) {
            needMadyaCount++;
        }
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
        const jabatan = item.jabatan || [];

        const matchKota = fKota === "Semua" || (p.kab_kota === fKota) || (p.kota === fKota);
        const matchKec = fKec === "Semua" || (p.kec === fKec);
        const matchDesa = fDesa === "Semua" || (p.desa === fDesa);
        const matchesJK = fJK === "Semua" || p.jk === fJK;
        const matchesAgama = fAgama === "Semua" || p.agama === fAgama;
        const textFormal = formal.join(" ");
        const matchesEdu = fEdu === "Semua" || textFormal.includes(fEdu);
        const textKader = kader[2] ? kader[2].toString().toLowerCase() : "";
        const matchesKader = (fKader === "Semua") || textKader.includes(fKader.toLowerCase());

        const currentYear = new Date().getFullYear();
        const isMadya = textKader.includes("madya");
        const hasPratama = textKader.includes("pratama");
        const textTahun = kader[5] ? kader[5].toString() : "";
        const matchTahunPratama = textTahun.match(/1\.\s*(\d{4})/) || textTahun.match(/^(\d{4})/);
        const tahunPratama = matchTahunPratama ? parseInt(matchTahunPratama[1]) : 0;
        const masaTunggu = tahunPratama > 0 ? (currentYear - tahunPratama) : 0;

        let matchStatusMadya = true;
        if (fStatusMadya === "Sudah") matchStatusMadya = isMadya;
        else if (fStatusMadya === "Belum") matchStatusMadya = !isMadya;
        else if (fStatusMadya === "Prioritas") matchStatusMadya = (hasPratama && !isMadya && masaTunggu >= 5);

        const textJabatan = jabatan.map(j => j.join(" ")).join(" ").toLowerCase();
        const matchesTingkat = fTingkat === "Semua" || textJabatan.includes(fTingkat.toLowerCase());
        const matchesJenis = fJenis === "Semua" || textJabatan.includes(fJenis.toLowerCase());
        const matchesIT = fIT === "Semua" || (item.pribadi.it === fIT);
        const matchesBahasa = fBahasa === "Semua" || (item.pribadi.bahasa === fBahasa);

        return matchKota && matchKec && matchDesa && matchesJK && matchesAgama && matchesEdu && 
               matchesKader && matchesTingkat && matchesJenis && matchStatusMadya && matchesIT && matchesBahasa;
    });

    renderTable(filtered);
    updateStats(filtered);
}

function openDetail(originalIndex) {
    const data = databaseKader[originalIndex]; // Data mentah dari DB Admin
    if (!data) return;

    // --- PROSES MAPPING DATA (Agar sama dengan variabel rekap.html) ---
    const p = data.pribadi || {};
    const formal = data.formal || [];
    const kader = data.kaderisasi || [];
    const jabatan = data.jabatan || [];
    const medsos = data.medsos || [];

    // --- CLONE STRUKTUR HTML DARI REKAP.HTML ---
    let htmlContent = `
    <div class="hyper-premium-modal">
        <div class="header-form" style="text-align: center; margin-bottom: 10px; padding-top:15px;">
            <img src="https://i.ibb.co.com/N2K0XRMW/logo-pdi.png" alt="Logo" style="width: 45px; margin-bottom: 5px;">
            <h2 style="font-weight: 800; letter-spacing: -0.5px; margin:0; font-size:18px;">Final Review Admin</h2>
        </div>

        <div class="slider-wrapper" id="adminRekapSlider">
            
            <div class="rekap-card">
                <div class="section-title"><span>Profil Kader</span></div>
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${formatDriveUrl(p.foto)}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=D71920&color=fff'" 
                         style="width:120px; height:120px; border-radius:30px; object-fit:cover; border:5px solid white; box-shadow:0 15px 30px rgba(0,0,0,0.1); pointer-events:none;">
                </div>
                <div class="rekap-grid">
                    ${renderRow('Nama Lengkap', p.nama, true)}
                    ${renderRow('NIK', p.nik)}
                    ${renderRow('No. KTA', p.kta)}
                    ${renderRow('Tempat Lahir', p.tmp_lahir)}
                    ${renderRow('Tanggal Lahir', p.tgl_lahir)}
                    ${renderRow('Jenis Kelamin', p.jk)}
                    ${renderRow('Agama', p.agama)}
                    ${renderRow('WhatsApp', p.wa)}
                    ${renderRow('Email', p.email, true)}
                    ${renderRow('Alamat KTP', p.alamat, true)}
                    ${renderRow('Desa/Kel', p.desa)}
                    ${renderRow('Kecamatan', p.kec)}
                </div>
            </div>

            <div class="rekap-card">
                <div class="section-title"><span>Pendidikan</span></div>
                ${formal.map(f => `
                    <div class="data-box-premium">
                        <div class="rekap-label">${f[2]} - ${f[4] || ''}</div>
                        <div class="rekap-value">${f[3]}</div>
                        <div style="font-size:11px; color:#64748b; margin-top:4px;">Lulus: ${f[5]} | Status: ${f[7] || 'Lulus'}</div>
                    </div>
                `).join('') || '<p>Data Kosong</p>'}
            </div>

            <div class="rekap-card">
                <div class="section-title"><span>Kaderisasi</span></div>
                ${kader.map(k => `
                    <div class="data-box-premium" style="border-left-color: #1e293b;">
                        <div class="rekap-label">Kaderisasi ${k[2]}</div>
                        <div class="rekap-value">${k[3]}</div>
                        <div style="font-size:11px; color:#64748b;">Tahun: ${k[5]} | Lokasi: ${k[4]}</div>
                    </div>
                `).join('') || '<p>Data Kosong</p>'}
            </div>

            <div class="rekap-card">
                <div class="section-title"><span>Jabatan & Kerja</span></div>
                ${jabatan.map(j => `
                    <div class="data-box-premium" style="border-left-color: ${j[0] === 'TUGAS' ? '#fbbf24' : '#D71920'};">
                        <div class="rekap-label">${j[0] === 'TUGAS' ? 'Penugasan' : 'Struktur'}: ${j[5]}</div>
                        <div class="rekap-value">${j[4]}</div>
                        <div style="font-size:11px; color:#64748b;">Periode: ${j[8]}</div>
                    </div>
                `).join('') || '<p>Data Kosong</p>'}
            </div>

            <div class="rekap-card">
                <div class="section-title"><span>Skill & Medsos</span></div>
                <div class="rekap-grid">
                    ${renderRow('Bahasa', medsos[7])}
                    ${renderRow('Komputer', medsos[8])}
                    <div class="rekap-item-full rekap-item-premium">
                        <div class="rekap-label">Media Sosial</div>
                        <div style="font-size:12px; display:flex; gap:10px; flex-wrap:wrap; font-weight:700;">
                            <span>FB: ${medsos[9] || '-'}</span>
                            <span>IG: ${medsos[10] || '-'}</span>
                            <span>TT: ${medsos[11] || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <div class="nav-indicator">
            <span id="adminCardCounter">Kartu 1 dari 5</span>
        </div>

        <div style="padding: 10px 20px 20px; display: flex; gap: 10px;">
            <button onclick="closeDetail()" class="btn-final" style="background:#1e293b; flex:3;">TUTUP DETAIL</button>
            <button onclick="window.print()" class="btn-final" style="flex:1;">🖨️</button>
        </div>
    </div>`;

    document.getElementById('modalInnerContent').innerHTML = htmlContent;
    document.getElementById('modalDetail').style.display = "block";
    
    // Inisialisasi ulang fitur Drag & Counter
    initMouseDragAdmin('adminRekapSlider');
}

// Helper untuk Render baris agar identik dengan map(item => ...) di rekap.html
function renderRow(label, value, isFull = false) {
    return `
        <div class="rekap-item-premium ${isFull ? 'rekap-item-full' : ''}">
            <div class="rekap-label">${label}</div>
            <div class="rekap-value">${value || '-'}</div>
        </div>`;
}

// Inisialisasi Drag Scroll
function initMouseDragAdmin(id) {
    const slider = document.getElementById(id);
    let isDown = false; let startX; let scrollLeft;
    
    slider.addEventListener('scroll', () => {
        const index = Math.round(slider.scrollLeft / slider.offsetWidth) + 1;
        const total = slider.querySelectorAll('.rekap-card').length;
        document.getElementById('adminCardCounter').innerText = `Kartu ${index} dari ${total}`;
    });

    slider.addEventListener('mousedown', (e) => {
        isDown = true; slider.style.cursor = 'grabbing';
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });
    slider.addEventListener('mouseleave', () => isDown = false);
    slider.addEventListener('mouseup', () => { isDown = false; slider.style.cursor = 'grab'; });
    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const walk = (e.pageX - slider.offsetLeft - startX) * 2;
        slider.scrollLeft = scrollLeft - walk;
    });
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
