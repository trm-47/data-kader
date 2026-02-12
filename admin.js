    const URL_GAS = "https://script.google.com/macros/s/AKfycbzQA3fNn9ZcnXqfGL0yBA2SqFVx9MAQjLniltAkb5_0SHA2OGKTSXp3xpgVRVb6X7fq7g/exec";
    let databaseKader = [];

    async function fetchData() {
try {
        console.log("Memulai penarikan data...");
        const response = await fetch(URL_GAS + "?action=read");
        const data = await response.json();
        
        console.log("Data diterima:", data); // Cek di Inspect Element > Console

        if (data.error) {
            throw new Error(data.error);
        }

        databaseKader = data;
        renderTable(data);
        updateStats(data);
    } catch (error) {
        console.error("Error Detail:", error);
        document.getElementById('bodyKader').innerHTML = `
            <tr><td colspan="5" style="text-align:center; color:red; padding:20px;">
                Gagal memuat data: ${error.message}<br>
                <small>Pastikan Deployment GAS sudah benar dan "Anyone" bisa akses.</small>
            </td></tr>`;
    }
}

function calculateAge(birthDateString) {
    // 1. Jika kosong, langsung balikkan strip
    if (!birthDateString || birthDateString === "-") {
        return { age: "-", gen: "-", rawAge: 0 };
    }

    try {
        let birthDate;

        // 2. Cek apakah ini sudah objek Date (bawaan Google Apps Script)
        if (birthDateString instanceof Date) {
            birthDate = birthDateString;
        } else {
            // 3. Jika string, coba bersihkan dan konversi
            // Menangani format Indonesia dd/mm/yyyy jika ada
            if (typeof birthDateString === 'string' && birthDateString.includes('/')) {
                const parts = birthDateString.split('/');
                if (parts.length === 3) {
                    // Cek jika formatnya dd/mm/yyyy
                    if (parts[2].length === 4) {
                        birthDate = new Date(parts[2], parts[1] - 1, parts[0]);
                    }
                }
            }
            
            // Jika cara di atas gagal, gunakan cara standar browser
            if (!birthDate || isNaN(birthDate.getTime())) {
                birthDate = new Date(birthDateString);
            }
        }

        // 4. Validasi akhir: Jika tetap tidak bisa dibaca sebagai tanggal
        if (isNaN(birthDate.getTime())) {
            return { age: "-", gen: "-", rawAge: 0 };
        }

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        
        // Koreksi jika belum ulang tahun di tahun ini
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

        // --- 1. LOGIKA EARLY WARNING (STAGNAN) ---
        // Cek: Sudah Pratama (k[2]) tapi belum Madya (k[4])
        const isStagnan = (k[2] && k[2] !== "" && k[2] !== "-" && (!k[4] || k[4] === "" || k[4] === "-"));
        const rowClass = isStagnan ? "warning-row" : "";
        const badgeWarning = isStagnan ? '<br><span class="warning-badge">⚠️ BUTUH MADYA</span>' : '';

        // --- 2. LOGIKA WHATSAPP DIRECT ---
        const waNumber = p.wa ? p.wa.toString().replace(/[^0-9]/g, '') : '';
        const waLink = waNumber ? `https://wa.me/${waNumber.startsWith('0') ? '62' + waNumber.slice(1) : waNumber}` : '#';
        const btnWA = waNumber ? 
            `<a href="${waLink}" target="_blank" onclick="event.stopPropagation()" style="background:#25D366; color:white; padding:6px 12px; border-radius:8px; text-decoration:none; font-size:11px; font-weight:bold; display:inline-flex; align-items:center; gap:5px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">💬 Chat</a>` : 
            `<span style="color:#cbd5e1; font-size:10px;">-</span>`;

        // --- 3. LOGIKA PENDIDIKAN FORMAL TERTINGGI ---
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

        // --- 4. LOGIKA BADGE KADERISASI ---
        let htmlBadgeKader = "";
        const listJenjang = [ ["Guru", 8], ["Utama", 6], ["Madya", 4], ["Pratama", 2], ["Kader Perempuan", 10] ];
        listJenjang.forEach(jenjang => {
            if (k[jenjang[1]] && k[jenjang[1]] !== "" && k[jenjang[1]] !== "-") {
                htmlBadgeKader += `<span class="badge badge-red" style="margin-bottom:2px; display:block; text-align:center;">${jenjang[0]} (${k[jenjang[1]]})</span>`;
            }
        });
        if (htmlBadgeKader === "") htmlBadgeKader = `<span class="badge badge-gray">Anggota</span>`;

        const originalIdx = databaseKader.indexOf(item);
        
        // --- 5. RENDER FINAL ROW ---
        body.innerHTML += `
            <tr class="${rowClass}" onclick="openDetail(${originalIdx})" style="cursor:pointer;">
                <td data-label="Foto">
                    <img src="${formatDriveUrl(p.foto)}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=random'" style="width:45px; height:45px; border-radius:10px; object-fit:cover;">
                </td>
                <td data-label="Identitas">
                    <strong>${p.nama || 'Tanpa Nama'}</strong>${badgeWarning}<br><small>${p.nik || '-'}</small>
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
    let totalAge = 0;
    let youth = 0;
    let madyaCount = 0; // Variabel baru untuk Kader Madya
    let countAge = 0;

    data.forEach(item => {
        // 1. Hitung Usia & Generasi
        if (item.pribadi && item.pribadi.tgl_lahir) {
            const ageInfo = calculateAge(item.pribadi.tgl_lahir);
            if (ageInfo.rawAge > 0) {
                totalAge += ageInfo.rawAge;
                countAge++;
                if (ageInfo.gen === "Gen Z" || ageInfo.gen === "Millennial") youth++;
            }
        }

        // 2. Hitung Kader Madya (Cek Kolom Kaderisasi Index 4)
        const k = item.kaderisasi || [];
        if (k[4] && k[4] !== "-" && k[4] !== "") {
            madyaCount++;
        }
    });

    // Update Tampilan Stats
    document.getElementById('statTotal').innerText = total;
    document.getElementById('statAge').innerText = countAge > 0 ? Math.round(totalAge / countAge) + " Thn" : "-";
    document.getElementById('statYoung').innerText = Math.round((youth / total) * 100) + "%";
    
    // GANTI MELEK DIGITAL MENJADI KADER MADYA
    const areaCard = document.getElementById('statArea');
    areaCard.previousElementSibling.innerText = "Kader Madya"; // Ubah Label
    areaCard.innerText = madyaCount + " (" + Math.round((madyaCount / total) * 100) + "%)"; // Tampilkan Jumlah & Persen
}

    // FUNGSI APPLY FILTER (DISEMPURNAKAN)

function formatDriveUrl(url) {
    if (!url || !url.includes("drive.google.com")) return url;
    // Mencari ID file dari link Google Drive
    const parts = url.split("id=");
    let fileId = parts.length > 1 ? parts[1] : url.split("/d/")[1]?.split("/")[0];
    
    if (fileId) {
        // Link thumbnail langsung (lebih cepat & stabil)
        return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
    return url;
}

function doSearch() {
    const val = document.getElementById('quickSearch').value.toLowerCase();
    
    // Kita cari baris di dalam tabel yang saat ini tampil (hasil filter)
    const rows = document.querySelectorAll('#bodyKader tr');
    
    rows.forEach(row => {
        // Jika baris berisi teks "Data tidak ditemukan", abaikan
        if (row.cells.length < 2) return; 

        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(val) ? "" : "none";
    });
}

function openDetail(originalIndex) {
    const item = databaseKader[originalIndex];
    if (!item) return;

    const p = item.pribadi || {};
    const f = item.formal || [];
    const k = item.kaderisasi || [];
    const j = item.jabatan || [];
    const w = item.riwayat_kerja || [];
    const m = item.medsos || [];
    const org = item.organisasi || [];
    const ageInfo = calculateAge(p.tgl_lahir);

    // --- TEMPLATE DETAIL HYPER-PREMIUM ---
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
            <p style="color:var(--primary-red); font-weight:800; font-size:14px; margin-top:5px;">ID KADER: ${p.kta || '-'}</p>
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

        <div class="profile-section">
            <div class="section-title">Pendidikan Formal</div>
            <div class="data-grid">
                ${f[2] ? `<div class="data-item"><label>SD</label><span>${f[2]} (${f[3] || ''})</span></div>` : ''}
                ${f[4] ? `<div class="data-item"><label>SMP</label><span>${f[4]} (${f[5] || ''})</span></div>` : ''}
                ${f[6] ? `<div class="data-item"><label>SMA/SMK</label><span>${f[6]} (${f[8] || ''})</span></div>` : ''}
                ${f[9] ? `<div class="data-item"><label>Diploma (D1-D4)</label><span>${f[9]} (${f[10] || ''})</span></div>` : ''}
                ${f[11] ? `<div class="data-item"><label>Sarjana (S1)</label><span>${f[11]} - ${f[12] || ''} (${f[14] || ''})</span></div>` : ''}
                ${f[15] ? `<div class="data-item"><label>Magister (S2)</label><span>${f[15]} (${f[16] || ''})</span></div>` : ''}
                ${f[17] ? `<div class="data-item"><label>Doktor (S3)</label><span>${f[17]} (${f[18] || ''})</span></div>` : ''}
            </div>
        </div>

<div class="profile-section" style="background: #fff; border: 2px solid #D71920; border-radius: 20px; padding: 20px; box-shadow: 0 10px 25px rgba(215,25,32,0.08); margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="font-size: 14px; font-weight: 800; color: #1e293b; text-transform: uppercase; margin: 0; display: flex; align-items: center; gap: 8px;">
                    <span style="background: #D71920; width: 4px; height: 18px; border-radius: 2px; display: inline-block;"></span>
                    Analisa Jenjang Kaderisasi
                </h3>
                <span style="background: #D71920; color: white; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 800; letter-spacing: 1px;">HASIL SCAN</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px; margin-bottom: 25px;">
                ${[
                    { label: 'PRATAMA', year: k[2], color: '#ef4444' },
                    { label: 'MADYA', year: k[4], color: '#dc2626' },
                    { label: 'UTAMA', year: k[6], color: '#b91c1c' },
                    { label: 'GURU', year: k[8], color: '#991b1b' },
                    { label: 'WANITA', year: k[10], color: '#db2777' }
                ].map(lvl => `
                    <div style="text-align: center; padding: 15px 5px; border-radius: 15px; border: 2px solid ${lvl.year ? lvl.color : '#f1f5f9'}; background: ${lvl.year ? '#fff' : '#f8fafc'}; position: relative; transition: 0.3s;">
                        ${lvl.year ? `<div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: ${lvl.color}; color: white; font-size: 8px; padding: 2px 8px; border-radius: 10px; font-weight: 800; border: 2px solid #fff;">LULUS</div>` : ''}
                        <div style="font-size: 9px; font-weight: 800; color: ${lvl.year ? '#1e293b' : '#cbd5e1'}; letter-spacing: 0.5px;">${lvl.label}</div>
                        <div style="font-size: 14px; font-weight: 900; color: ${lvl.year ? lvl.color : '#cbd5e1'}; margin-top: 5px;">${lvl.year || '—'}</div>
                    </div>
                `).join('')}
            </div>

            <div style="background: #1e293b; border-radius: 16px; padding: 18px; display: flex; align-items: center; gap: 15px; position: relative; overflow: hidden;">
                <div style="position: absolute; right: -10px; bottom: -10px; font-size: 60px; opacity: 0.1; transform: rotate(-15deg);">✊</div>
                
                <div style="background: rgba(255,255,255,0.1); width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px;">
                    ${k[6] || k[8] ? '🏆' : k[2] ? '🛡️' : '📝'}
                </div>
                
                <div style="flex: 1;">
                    <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Rekomendasi Penugasan:</div>
                    <div style="font-size: 14px; font-weight: 600; color: #ffffff; margin-top: 4px; line-height: 1.4;">
                        ${k[8] ? 'Ideolog Partai: Layak menjadi Mentor/Pengajar Kaderisasi.' :
                          k[6] ? 'Kader Utama: Siap untuk Penugasan Strategis Nasional/Provinsi.' :
                          k[4] ? 'Kader Madya: Potensi Pimpinan Struktur & Anggota Legislatif.' :
                          k[2] ? 'Kader Pratama: Penguatan Militansi di Basis Massa & Ranting.' :
                          'Kader Baru: Prioritaskan mengikuti Pelatihan Pratama secepatnya.'}
                    </div>
                </div>
            </div>
        </div>

<div class="profile-section">
            <div class="section-title">Riwayat Jabatan & Penugasan</div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${j.length > 0 ? j.map(jab => {
                    // Mapping Kolom:
                    // jab[2] = Kategori (Struktural/Legislatif/Eksekutif)
                    // jab[4] = Tingkatan (DPP/DPD/DPC)
                    // jab[5] = Penugasan Utama (Kolom F)
                    // jab[12] = Detail Jabatan / Jabatan Spesifik (Kolom M)
                    // jab[8] / jab[14] = Periode

                    let kategori = jab[2] || "Penugasan";
                    let tingkat = jab[4] && jab[4] !== "-" ? jab[4].toUpperCase() : "";
                    
                    // Gabungkan Penugasan Utama (F) dengan Detail Jabatan (M)
                    let penugasanUtama = jab[5] && jab[5] !== "-" ? jab[5] : "";
                    let detailJabatan = jab[12] && jab[12] !== "-" ? jab[12] : "";
                    
                    // Logic Tampilan: Jika keduanya ada, gabungkan dengan tanda " - "
                    let namaJabatanLengkap = (penugasanUtama && detailJabatan) 
                        ? `${penugasanUtama} - ${detailJabatan}` 
                        : (penugasanUtama || detailJabatan || "-");

                    return `
                    <div style="background: #f1f5f9; padding:15px; border-radius:12px; border-left: 4px solid var(--primary-red);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="flex: 1;">
                                <div style="font-size:10px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">
                                    ${kategori} ${tingkat ? `(${tingkat})` : ''}
                                </div>
                                <div style="font-size:15px; font-weight:700; color:#1e293b; margin-top:3px; line-height:1.4;">
                                    ${namaJabatanLengkap}
                                </div>
                                <div style="font-size:12px; color:#475569; margin-top:5px; font-weight: 600;">
                                    Periode: ${jab[8] || jab[14] || '-'}
                                </div>
                            </div>
                        </div>
                        ${jab[13] && jab[13] !== "-" ? `<div style="font-size:11px; color:#64748b; margin-top:8px; padding-top:8px; border-top:1px solid #e2e8f0;"><b>Lokasi:</b> ${jab[13]}</div>` : ''}
                    </div>
                    `;
                }).join('') : '<p style="color:#94a3b8; font-style:italic; font-size:13px; text-align:center; padding:20px;">Belum ada riwayat jabatan/penugasan.</p>'}
            </div>
        </div>

        <div class="profile-section">
            <div class="section-title">Pengalaman Kerja & Organisasi Lain</div>
            <div class="data-grid" style="margin-bottom:15px;">
                ${w.length > 0 ? w.map(pk => `
                    <div style="background:#fff; border:1px solid #e2e8f0; padding:10px; border-radius:10px;">
                        <small style="color:#94a3b8; font-weight:800;">PEKERJAAN</small><br>
                        <strong>${pk[3]}</strong> di ${pk[2]}<br><small>${pk[4]}</small>
                    </div>
                `).join('') : ''}
                ${org.length > 0 ? org.map(o => `
                    <div style="background:#fff; border:1px solid #e2e8f0; padding:10px; border-radius:10px;">
                        <small style="color:#94a3b8; font-weight:800;">ORGANISASI</small><br>
                        <strong>${o[4]}</strong> - ${o[2]}<br><small>${o[5]}</small>
                    </div>
                `).join('') : ''}
            </div>
        </div>

        <div class="profile-section">
            <div class="section-title">Kompetensi & Media Sosial</div>
            <div class="data-grid">
                <div class="data-item"><label>Kemampuan Bahasa</label><span>${(item.medsos && item.medsos[2]) ? 'Indonesia' : ''} ${(item.medsos && item.medsos[3]) ? ', Inggris' : ''}</span></div>
                <div class="data-item"><label>Skill Komputer</label><span>${m[8] || '-'}</span></div>
                <div class="data-item"><label>Facebook</label><span>${m[9] || '-'}</span></div>
                <div class="data-item"><label>Instagram</label><span>${m[10] || '-'}</span></div>
                <div class="data-item"><label>TikTok</label><span>${m[11] || '-'}</span></div>
                <div class="data-item"><label>X / Twitter</label><span>${m[12] || '-'}</span></div>
                <div class="data-item"><label>YouTube</label><span>${m[13] || '-'}</span></div>
            </div>
        </div>

        <div style="text-align:center; padding-top:20px;">
             <button onclick="window.print()" style="background:#1e293b; color:white; border:none; padding:10px 20px; border-radius:10px; font-weight:800; cursor:pointer; font-size:12px;">CETAK PROFIL</button>
        </div>
    `;

    document.getElementById('modalInnerContent').innerHTML = htmlContent;
    document.getElementById('modalDetail').style.display = "block";
    document.getElementById('modalInnerContent').scrollTop = 0;
}

    function closeDetail() { document.getElementById('modalDetail').style.display = "none"; }
    
    window.onload = fetchData;

    function toggleFilter() {
    const body = document.getElementById('filterBody');
    const icon = document.getElementById('filterIcon');
    body.classList.toggle('active');
    icon.innerText = body.classList.contains('active') ? '▲' : '▼';
}

function resetFilters() {
    // 1. Reset semua dropdown (select)
    document.querySelectorAll('.filter-body select').forEach(s => s.value = 'Semua');
    
    // 2. Reset semua kotak ketikan (input) di dalam filter (Kecamatan & Desa)
    document.querySelectorAll('.filter-body input').forEach(i => i.value = '');
    
    // 3. Reset kotak pencarian utama (ID-nya harus quickSearch)
    const qs = document.getElementById('quickSearch');
    if(qs) qs.value = '';

    // 4. Jalankan applyFilters agar tabel balik ke data awal
    applyFilters();
}

function applyFilters() {
    // Ambil value dari input filter wilayah
    const fKota = document.getElementById('fKota').value;
    const fKec = document.getElementById('fKec').value.toLowerCase().trim();
    const fDesa = document.getElementById('fDesa').value.toLowerCase().trim();
    
    // Ambil value filter lainnya
    const fJK = document.getElementById('fJK').value;
    const fAgama = document.getElementById('fAgama').value;
    const fEdu = document.getElementById('fPendidikan').value;
    const fKader = document.getElementById('fKader').value;
    const fTingkat = document.getElementById('fTingkat').value;
    const fJenis = document.getElementById('fJenisTugas').value;
    const fBahasa = document.getElementById('fBahasa').value;
    const fIT = document.getElementById('fIT').value;

    const filtered = databaseKader.filter(item => {
        const p = item.pribadi || {};
        const formal = item.formal || [];
        const kader = item.kaderisasi || []; 
        const medsos = item.medsos || [];    
        const jabatan = item.jabatan || [];  

        // --- KOREKSI FILTER WILAYAH ---
        // 1. Filter Kota (Exact Match)
        const matchKota = fKota === "Semua" || (p.kab_kota && p.kab_kota === fKota) || (p.kota && p.kota === fKota);
        
        // 2. Filter Kecamatan (Partial Match agar lebih user-friendly)
        const matchKec = fKec === "" || (p.kec && p.kec.toLowerCase().includes(fKec));
        
        // 3. Filter Desa/Kelurahan (Partial Match)
        const matchDesa = fDesa === "" || (p.desa && p.desa.toLowerCase().includes(fDesa));

        // --- FILTER LAINNYA (Tetap sesuai kode awal Anda) ---
        let matchesKader = false;
        if (fKader === "Semua") {
            matchesKader = true;
        } else {
            const mappingKader = { "Pratama": 2, "Madya": 4, "Utama": 6, "Guru": 8, "Perempuan": 10 };
            const targetIdx = mappingKader[fKader];
            const hasSertifikat = (kader[targetIdx] && kader[targetIdx] !== "" && kader[targetIdx] !== "-");
            if (fKader === "Perempuan") {
                matchesKader = hasSertifikat && (p.jk === "P" || p.jk === "Perempuan");
            } else {
                matchesKader = hasSertifikat;
            }
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

        // Gabungkan semua kondisi (termasuk wilayah)
        return matchKota && matchKec && matchDesa && matchesJK && matchesAgama && matchesEdu && matchesKader && matchesTingkat && matchesJenis && matchesBahasa && matchesIT;
    });

    renderTable(filtered);
    updateStats(filtered);
}
    // 1. Fungsi Tutup Modal Dasar
function closeDetail() {
    document.getElementById('modalDetail').style.display = "none";
}

// 2. Klik di luar area (Overlay) untuk menutup
window.onclick = function(event) {
    const modal = document.getElementById('modalDetail');
    if (event.target == modal) {
        closeDetail();
    }
}

// 3. Tekan tombol ESC untuk menutup
document.addEventListener('keydown', function(event) {
    if (event.key === "Escape") {
        closeDetail();
    }
});
