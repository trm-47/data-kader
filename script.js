/* ==========================================
    1. THEME ENGINE & INITIALIZER
   ========================================== */
(function() {
    const savedTheme = localStorage.getItem('kader_theme'); 
    if (savedTheme === 'premium') {
        const link = document.createElement('link');
        link.id = 'premium-theme-link';
        link.rel = 'stylesheet'; link.href = 'premium.css'; 
        document.head.appendChild(link);
    }
})();

/* ==========================================
    2. DATA WILAYAH DIY (Didefinisikan di awal)
   ========================================== */
const dataDIY = {
    "Bantul": {
        "Bambanglipuro": ["Mulyodadi", "Sidomulyo", "Sumbermulyo"],
        "Banguntapan": ["Banguntapan", "Baturetno", "Jambidan", "Potrosari", "Singosaren", "Tamanan", "Wirokerten", "Jagalan"],
        "Bantul": ["Bantul", "Ringinharjo", "Sabdodadi", "Trirenggo"],
        "Dlingo": ["Dlingo", "Jatimulyo", "Mangunan", "Muntuk", "Terong", "Temuwuh"],
        "Imogiri": ["Girirejo", "Imogiri", "Karangtalun", "Karangtengah", "Kebonagung", "Selopamioro", "Sriharjo", "Wukirsari"],
        "Jetis": ["Canden", "Patalan", "Sumberagung", "Trimulyo"],
        "Kasihan": ["Bangunjiwo", "Ngestiharjo", "Tamantirto", "Tirtonirmolo"],
        "Kretek": ["Donotirto", "Parangtritis", "Tirtohargo", "Tirtomulyo", "Tirtosari"],
        "Pajangan": ["Sendangsari", "Triwidadi", "Guwosari"],
        "Pandak": ["Caturharjo", "Gilangharjo", "Triharjo", "Wijirejo"],
        "Piyungan": ["Sitimulyo", "Srimartani", "Srimulyo"],
        "Pleret": ["Bawuran", "Pleret", "Segoroyoso", "Wonokromo", "Wonolelo"],
        "Pundong": ["Panjangrejo", "Seloharjo", "Srihardono"],
        "Sanden": ["Gadingsari", "Gadingharjo", "Murtigading", "Srigading"],
        "Sedayu": ["Argodadi", "Argomulyo", "Argorejo", "Argosari"],
        "Sewon": ["Bangunharjo", "Panggungharjo", "Pendowoharjo", "Timbulharjo"],
        "Srandakan": ["Poncosari", "Trimurti"]
    },
    "Yogyakarta": {
        "Danurejan": ["Bausasran", "Tegal Panggung", "Suryatmajan"],
        "Gedongtengen": ["Pringgokusuman", "Sosromenduran"],
        "Gondokusuman": ["Baciro", "Demangan", "Klitren", "Kotabaru", "Terban"],
        "Gondomanan": ["Ngupasan", "Prawirodirjan"],
        "Jetis": ["Bumijo", "Cokrodiningratan", "Gowongan"],
        "Kotagede": ["Prenggan", "Purbayan", "Rejowinangun"],
        "Kraton": ["Panembahan", "Kadipaten", "Patehan"],
        "Mantrijeron": ["Gedongkiwo", "Mantrijeron", "Suryodiningratan"],
        "Mergansan": ["Brontokusuman", "Keparakan", "Wirogunan"],
        "Ngampilan": ["Ngampilan", "Notoprajan"],
        "Pakualaman": ["Gunungketur", "Purwokinanti"],
        "Tegalrejo": ["Bener", "Kricak", "Karangwaru", "Tegalrejo"],
        "Umbulharjo": ["Giwangan", "Muja Muju", "Pandeyan", "Sorosutan", "Tahunan", "Warungboto", "Semaki"],
        "Wirobrajan": ["Pakuncen", "Patangpuluhan", "Wirobrajan"]
    },
    "Sleman": {
        "Berbah": ["Jogotirto", "Kalitirto", "Sendangtirto", "Tegaltirto"],
        "Cangkringan": ["Argomulyo", "Glagaharjo", "Kepuharjo", "Wukirsari", "Umbulharjo"],
        "Depok": ["Caturtunggal", "Condongcatur", "Maguwoharjo"],
        "Gamping": ["Ambarketawang", "Balecatur", "Banyuraden", "Nogotirto", "Trihanggo"],
        "Godean": ["Sidoagung", "Sidoarum", "Sidokarto", "Sidomulyo", "Sidorejo", "Sidosari", "Sidoluhur"],
        "Kalasan": ["Purwomartani", "Selomartani", "Tirtomartani", "Tamanmartani"],
        "Minggir": ["Sendangagung", "Sendangmulyo", "Sendangrejo", "Sendangsari", "Sendangadi"],
        "Mlati": ["Sendangadi", "Sinduadi", "Sumberadi", "Tlogoadi", "Tirtoadi"],
        "Moyudan": ["Sumberagung", "Sumberarum", "Sumberrahayu", "Sumbersari"],
        "Ngaglik": ["Donoharjo", "Minomartani", "Sardonoharjo", "Sariharjo", "Sinduharjo", "Sukoharjo"],
        "Ngemplak": ["Bimomartani", "Sindumartani", "Umbulmartani", "Wedomartani", "Widodomartani"],
        "Pakem": ["Candibinangun", "Hargobinangun", "Harjobinangun", "Pakembinangun", "Purwobinangun"],
        "Prambanan": ["Bokoharjo", "Gayamharjo", "Madurejo", "Sambirejo", "Sumberharjo", "Wukirharjo"],
        "Seyegan": ["Margoagung", "Margodadi", "Margokaton", "Margoluwih", "Margomulyo"],
        "Sleman": ["Caturharjo", "Pandowoharjo", "Tridadi", "Triharjo", "Trimulyo"],
        "Tempel": ["Banyurejo", "Lumbungrejo", "Margorejo", "Merodikorejo", "Pondokrejo", "Sumberejo", "Tambakrejo"],
        "Turi": ["Bangunkerto", "Donokerto", "Girikerto", "Wonokerto"]
    },
    "Gunungkidul": {
        "Wonosari": ["Baleharjo", "Kepek", "Piyaman", "Selang", "Wonosari"],
        "Karangmojo": ["Bejiharjo", "Karangmojo", "Wiladeg"],
        "Playen": ["Banaran", "Bleberan", "Logandeng", "Playen"],
        "Semanu": ["Candi", "Dadapan", "Semanu"],
        "Ngawen": ["Beji", "Jurangjero"],
        "Ponjong": ["Bedoyo", "Ponjong"],
        "Rongkop": ["Bohol", "Karangwuni"],
        "Semin": ["Bulurejo", "Semin"],
        "Tepus": ["Purwodadi", "Tepus"]
    },
    "Kulon Progo": {
        "Wates": ["Bendungan", "Triharjo", "Wates"],
        "Sentolo": ["Sentolo", "Sukoreno", "Tuksono"],
        "Galur": ["Brosot", "Pandowan"],
        "Lendah": ["Ngentakrejo", "Sidorejo"],
        "Kokap": ["Hargomulyo", "Hargotirto"],
        "Girimulyo": ["Giripurwo", "Jatimulyo"],
        "Nanggulan": ["Donomulyo", "Tanjungharjo"],
        "Samigaluh": ["Gerbosari", "Ngargosari"]
    }
};

/* ==========================================
    3. FUNGSI HELPER WILAYAH
   ========================================== */
function updateKecamatan() {
    const kabSel = document.getElementById("kab_kota").value;
    const kecDropdown = document.getElementById("kecamatan");
    const kelDropdown = document.getElementById("kelurahan");
    
    kecDropdown.innerHTML = '<option value="">-- Pilih Kecamatan --</option>';
    kelDropdown.innerHTML = '<option value="">-- Pilih Kelurahan --</option>';
    
    if (kabSel && dataDIY[kabSel]) {
        Object.keys(dataDIY[kabSel]).sort().forEach(kec => {
            let opt = document.createElement("option");
            opt.value = kec;
            opt.text = kec;
            kecDropdown.add(opt);
        });
    }
}

function updateKelurahan() {
    const kabSel = document.getElementById("kab_kota").value;
    const kecSel = document.getElementById("kecamatan").value;
    const kelDropdown = document.getElementById("kelurahan");
    
    kelDropdown.innerHTML = '<option value="">-- Pilih Kelurahan --</option>';
    
    if (kabSel && kecSel && dataDIY[kabSel][kecSel]) {
        dataDIY[kabSel][kecSel].sort().forEach(kel => {
            let opt = document.createElement("option");
            opt.value = kel;
            opt.text = kel;
            kelDropdown.add(opt);
        });
    }
}

/* ==========================================
    4. HANDLER FOTO
   ========================================== */
const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function() {
        const preview = document.getElementById('photoPreview');
        if(preview) preview.innerHTML = `<img src="${reader.result}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        let existing = JSON.parse(localStorage.getItem('kaderData')) || {};
        existing.foto = reader.result;
        localStorage.setItem('kaderData', JSON.stringify(existing));
    }
    reader.readAsDataURL(file);
};

document.addEventListener('change', (e) => {
    if (e.target.id === 'inputCamera' || e.target.id === 'inputGallery') handlePhoto(e);
});

/* ==========================================
    5. LOGIKA SAVE STEP 1
   ========================================== */
function saveStep1() {
    const genderEl = document.querySelector('input[name="jenis_kelamin"]:checked');
    const fields = ['nama_lengkap', 'tempat_lahir', 'tanggal_lahir', 'agama', 'nik', 'no_kta', 'alamat', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kab_kota', 'pekerjaan', 'kontak'];
    
    let dataStep1 = { 
        jenis_kelamin: genderEl ? genderEl.value : '' 
    };

    fields.forEach(f => {
        const el = document.getElementById(f);
        dataStep1[f] = el ? el.value.trim() : '';
    });

    const requiredFields = fields.filter(f => f !== 'no_kta');
    if (requiredFields.some(f => !dataStep1[f]) || !dataStep1.jenis_kelamin) {
        alert("⚠️ Mohon lengkapi semua data wajib termasuk Agama."); 
        return;
    }

    let existing = JSON.parse(localStorage.getItem('kaderData')) || {};
    localStorage.setItem('kaderData', JSON.stringify({ ...existing, ...dataStep1 }));
    window.location.href = 'step2.html';
}

/* ==========================================
    6. RENDER ENGINE & ADD DATA FUNCTIONS (Diringkas)
   ========================================== */
function deleteItem(key, index, callbackName) {
    let data = JSON.parse(localStorage.getItem('kaderData'));
    data[key].splice(index, 1);
    localStorage.setItem('kaderData', JSON.stringify(data));
    if (callbackName && typeof window[callbackName] === 'function') window[callbackName]();
}

function renderList(id, key, template) {
    const el = document.getElementById(id);
    if(!el) return;
    const data = JSON.parse(localStorage.getItem('kaderData')) || {};
    const list = data[key] || [];
    el.innerHTML = list.map((item, index) => template(item, index)).join('');
}

const premiumTemplate = (title, subtitle, key, index, callbackName) => `
    <div style="background:rgba(215, 25, 32, 0.05); padding:12px; margin-bottom:8px; border-left:4px solid #D71920; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
        <div style="font-size:13px;">
            <strong style="color:#D71920; display:block;">${title}</strong>
            <small style="color:#64748b;">${subtitle}</small>
        </div>
        <button onclick="deleteItem('${key}', ${index}, '${callbackName}')" style="color:#ef4444; border:none; background:none; font-size:20px; cursor:pointer; padding:0 10px;">&times;</button>
    </div>
`;

const renderPendidikan = () => renderList('pendidikanList', 'riwayat_pendidikan', (item, index) => premiumTemplate(`${item.jenjang}: ${item.nama}`, `${item.tahun} | ${item.kota}`, 'riwayat_pendidikan', index, 'renderPendidikan'));
const renderKader = () => renderList('kaderList', 'riwayat_kader', (item, index) => premiumTemplate(`Kader ${item.jenis}`, `${item.penyelenggara} (${item.tahun})`, 'riwayat_kader', index, 'renderKader'));
const renderJabatan = () => renderList('jabatanList', 'riwayat_jabatan_partai', (item, index) => premiumTemplate(item.jabatan, `${item.tingkatan} | ${item.periode}`, 'riwayat_jabatan_partai', index, 'renderJabatan'));
const renderPekerjaan = () => renderList('pekerjaanList', 'riwayat_pekerjaan', (item, index) => premiumTemplate(item.perusahaan, `${item.jabatan} (${item.masa_kerja})`, 'riwayat_pekerjaan', index, 'renderPekerjaan'));
const renderOrganisasi = () => renderList('orgList', 'riwayat_organisasi', (item, index) => premiumTemplate(item.nama, `${item.jabatan} | ${item.periode}`, 'riwayat_organisasi', index, 'renderOrganisasi'));
const renderPenugasan = () => renderList('tugasList', 'riwayat_penugasan', (item, index) => premiumTemplate(item.jabatan, `${item.jenis} - ${item.lokasi} (${item.periode})`, 'riwayat_penugasan', index, 'renderPenugasan'));

function saveToLocal(key, obj) {
    let data = JSON.parse(localStorage.getItem('kaderData')) || {};
    let list = data[key] || [];
    list.push(obj);
    data[key] = list;
    localStorage.setItem('kaderData', JSON.stringify(data));
}

function addPendidikan() {
    const jenjang = document.getElementById('jenjang')?.value;
    const ptJenjangs = ['D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3'];
    const nama = ptJenjangs.includes(jenjang) ? document.getElementById('nama_pt')?.value : document.getElementById('nama_sekolah')?.value;
    const tahun = document.getElementById('tahun_lulus')?.value;
    if(!jenjang || !nama || !tahun) return alert("Lengkapi data!");
    saveToLocal('riwayat_pendidikan', { jenjang, nama, tahun, kota: document.getElementById('kota_sekolah')?.value || '-' });
    renderPendidikan();
}

function addPendidikanKader() {
    const jenis = document.getElementById('jenis_kader')?.value;
    const penyelenggara = document.getElementById('penyelenggara')?.value;
    const tahun = document.getElementById('tahun_kader')?.value;
    if(!jenis || !penyelenggara) return alert("Lengkapi data kader!");
    saveToLocal('riwayat_kader', { jenis, penyelenggara, tahun });
    renderKader();
}

function addJabatanPartai() {
    const tingkatan = document.getElementById('tingkatan_partai')?.value;
    let jabatan = document.getElementById('jabatan_partai')?.value;
    const bidang = document.getElementById('bidang_jabatan')?.value;
    const periode = document.getElementById('periode_partai')?.value;
    if(!tingkatan || !jabatan) return alert("Lengkapi data jabatan!");
    if(bidang) jabatan = `${jabatan} ${bidang}`;
    saveToLocal('riwayat_jabatan_partai', { tingkatan, jabatan, periode });
    renderJabatan();
}

function addPenugasanPartai() {
    const jenis = document.getElementById('tugas_jenis')?.value;
    const lembaga = document.getElementById('tugas_lembaga')?.value;
    const jabatan = document.getElementById('tugas_jabatan')?.value;
    const lokasi = document.getElementById('tugas_lokasi')?.value;
    const periode = document.getElementById('tugas_periode')?.value;
    if(!jenis || !jabatan) return alert("Lengkapi data penugasan!");
    const dataTugas = {
        jenis: jenis === 'Legislatif' ? `Legislatif (${lembaga})` : jenis,
        jabatan: jabatan, lokasi: lokasi, periode: periode
    };
    saveToLocal('riwayat_penugasan', dataTugas);
    renderPenugasan();
}

function addPekerjaan() {
    const perusahaan = document.getElementById('nama_perusahaan')?.value;
    const jabatan = document.getElementById('jabatan_kerja')?.value;
    const masa = document.getElementById('masa_kerja')?.value;
    if(!perusahaan || !jabatan) return alert("Lengkapi data kerja!");
    saveToLocal('riwayat_pekerjaan', { perusahaan: perusahaan, jabatan: jabatan, masa_kerja: masa });
    document.getElementById('nama_perusahaan').value = '';
    document.getElementById('jabatan_kerja').value = '';
    document.getElementById('masa_kerja').value = '';
    renderPekerjaan();
}

function addOrganisasi() {
    const nama = document.getElementById('org_nama')?.value;
    const tingkat = document.getElementById('org_tingkat')?.value;
    const jabatan = document.getElementById('org_jabatan')?.value;
    const periode = document.getElementById('org_periode')?.value;
    if(!nama || !jabatan) return alert("Lengkapi data organisasi!");
    const namaLengkap = tingkat ? `${nama} (${tingkat})` : nama;
    saveToLocal('riwayat_organisasi', { nama: namaLengkap, jabatan: jabatan, periode: periode || '-' });
    if(document.getElementById('org_nama')) document.getElementById('org_nama').value = '';
    if(document.getElementById('org_jabatan')) document.getElementById('org_jabatan').value = '';
    if(document.getElementById('org_periode')) document.getElementById('org_periode').value = '';
    renderOrganisasi();
}

/* ==========================================
    7. PERBAIKAN NAVIGASI STEP 6
   ========================================== */
function goToReview() {
    try {
        let data = JSON.parse(localStorage.getItem('kaderData')) || {};
        const checkboxes = document.querySelectorAll('input[name="bahasa"]:checked');
        data.kompetensi_bahasa = Array.from(checkboxes).map(cb => cb.value).join(', ') || '-';
        data.bahasa_lainnya_input = document.getElementById('bahasa_lainnya')?.value || '';
        data.kemampuan_komputer = document.getElementById('komputer')?.value || '-';
        data.media_sosial = {
            facebook: document.getElementById('medsos_fb')?.value.trim() || '-',
            instagram: document.getElementById('medsos_ig')?.value.trim() || '-',
            tiktok: document.getElementById('medsos_tiktok')?.value.trim() || '-',
            twitter_x: document.getElementById('medsos_twitter')?.value.trim() || '-',
            youtube: document.getElementById('medsos_youtube')?.value.trim() || '-',
            linkedin: document.getElementById('medsos_linkedin')?.value.trim() || '-'
        };
        localStorage.setItem('kaderData', JSON.stringify(data));
        window.location.href = 'rekap.html';
    } catch (error) { alert("Gagal menyimpan data Step 6, Bos."); }
}
function saveStep6() { goToReview(); }

/* ==========================================
    8. INITIAL LOAD & SUBMIT DATA
   ========================================== */
window.addEventListener('load', () => {
    const saved = JSON.parse(localStorage.getItem('kaderData')) || {};
    ['nama_lengkap', 'tempat_lahir', 'tanggal_lahir', 'nik', 'no_kta', 'alamat', 'rt', 'rw', 'pekerjaan', 'kontak', 'agama'].forEach(f => {
        const el = document.getElementById(f); if(el) el.value = saved[f] || '';
    });
    if (saved.jenis_kelamin) {
        const genderEl = document.querySelector(`input[name="jenis_kelamin"][value="${saved.jenis_kelamin}"]`);
        if (genderEl) genderEl.checked = true;
    }
    if(saved.kab_kota) {
        const kabEl = document.getElementById('kab_kota');
        if(kabEl) {
            kabEl.value = saved.kab_kota; updateKecamatan();
            if(saved.kecamatan) {
                const kecEl = document.getElementById('kecamatan');
                if(kecEl) { kecEl.value = saved.kecamatan; updateKelurahan();
                    if(saved.kelurahan) { const kelEl = document.getElementById('kelurahan'); if(kelEl) kelEl.value = saved.kelurahan; }
                }
            }
        }
    }
    if(saved.media_sosial) {
        if(document.getElementById('medsos_fb')) document.getElementById('medsos_fb').value = saved.media_sosial.facebook || '';
        if(document.getElementById('medsos_ig')) document.getElementById('medsos_ig').value = saved.media_sosial.instagram || '';
        if(document.getElementById('medsos_tiktok')) document.getElementById('medsos_tiktok').value = saved.media_sosial.tiktok || '';
    }
    renderPendidikan(); renderKader(); renderJabatan(); renderPekerjaan(); renderOrganisasi(); renderPenugasan();
});

async function submitSeluruhData() {
    const data = JSON.parse(localStorage.getItem('kaderData'));
    if(!data) return alert("Data kosong!");
    const btn = document.querySelector('.btn-final');
    btn.disabled = true; btn.innerHTML = "⏳ MENGIRIM...";
    const URL_API = 'https://script.google.com/macros/s/AKfycbysCjLQBPyogM4c7_ohGuggfm7JwjOBQo1BS4fG4axFbldk8W5JNAFF9VVLyZx-Jo-i2A/exec';
    try {
        await fetch(URL_API, { method: 'POST', mode: 'no-cors', body: JSON.stringify(data) });
        alert("MERDEKA! Data Terkirim."); localStorage.clear(); window.location.href = 'finish.html';
    } catch (e) { alert("Gagal!"); btn.disabled = false; btn.innerHTML = "KIRIM SEKARANG"; }
}

function hitungUmur(tanggalLahir) {
    if (!tanggalLahir) return "-";
    const hariIni = new Date();
    const tglLahir = new Date(tanggalLahir);
    let umur = hariIni.getFullYear() - tglLahir.getFullYear();
    const bulan = hariIni.getMonth() - tglLahir.getMonth();
    if (bulan < 0 || (bulan === 0 && hariIni.getDate() < tglLahir.getDate())) { umur--; }
    return umur + " Tahun";
}
