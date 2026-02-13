const GAS_URL = "https://script.google.com/macros/s/AKfycbwAbaGgSWdlZ3AwtPk3Guwu-izM6AIsmf4CrW5WFFytVOQd9jHymA_4SQVU83EiFWBaZA/exec?action=read";

let BOS_DATA = [];

function login() {
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;

    if(user === "admin" && pass === "pdi123") {
        document.getElementById("login-section").style.display = "none";
        document.getElementById("dashboard-section").style.display = "block";
        loadData();
    } else {
        alert("Username / Password salah!");
    }
}

function loadData() {
    const script = document.createElement("script");
    script.src = GAS_URL + "&callback=handleData";
    document.body.appendChild(script);
}

function handleData(data) {
    if(!data || data.error) {
        alert("Gagal mengambil data: " + (data ? data.error : "tidak ada data"));
        return;
    }

    BOS_DATA = data;
    renderKPI();
    renderTable();
}

// --- Hitung usia & generasi ---
function calculateAge(tgl_lahir) {
    if(!tgl_lahir || tgl_lahir === "-") return {age:"-", gen:"-", rawAge:0};
    const parts = tgl_lahir.split("/");
    if(parts.length !== 3) return {age:"-", gen:"-", rawAge:0};
    const birth = new Date(parts[2], parts[1]-1, parts[0]);
    if(isNaN(birth)) return {age:"-", gen:"-", rawAge:0};

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if(m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

    let gen = "Lainnya";
    const y = birth.getFullYear();
    if(y >= 1997 && y <= 2012) gen="Gen Z";
    else if(y >= 1981 && y <= 1996) gen="Millennial";
    else if(y >= 1965 && y <= 1980) gen="Gen X";
    else if(y <= 1964) gen="Boomer";

    return {age: age + " Thn", gen: gen, rawAge: age};
}

// --- Render KPI ---
function renderKPI() {
    const total = BOS_DATA.length;
    let youth = 0;
    BOS_DATA.forEach(k => {
        const ageInfo = calculateAge(k.pribadi.tgl_lahir);
        if(ageInfo.gen === "Gen Z" || ageInfo.gen === "Millennial") youth++;
    });

    document.getElementById("total-kader").innerText = total;
    document.getElementById("percent-genz-milenial").innerText = youth + " orang";
}

// --- Render Table ---
function renderTable() {
    const tableBody = document.getElementById("kader-table-body");
    tableBody.innerHTML = "";

    BOS_DATA.slice().reverse().forEach((k,index)=>{
        const ageInfo = calculateAge(k.pribadi.tgl_lahir);

        // --- Badge Kader Lengkap ---
        const jenjangList = ["Pratama","Madya","Utama","Guru","Perempuan","Tema Khusus"];
        let badges = "";
        if(k.kaderisasi && k.kaderisasi.length > 2){
            jenjangList.forEach(j => {
                const match = k.kaderisasi.find(kdr => kdr && kdr.toLowerCase() === j.toLowerCase());
                if(match) badges += `<span class="badge badge-red" style="margin:2px; display:inline-block;">${j}</span>`;
            });
        }

        // --- Pendidikan Formal ---
        let pendidikan = "-";
        const formalOrder = [17,15,11,9,6,4,2]; // S3,S2,S1,D1-D3,SMA,SMP,SD
        for(let idx of formalOrder){
            if(k.formal[idx] && k.formal[idx] !== "-" && k.formal[idx].trim() !== ""){
                pendidikan = k.formal[idx];
                break;
            }
        }

        const row = document.createElement("tr");
        row.innerHTML = `
            <td><strong>${k.pribadi.nama}</strong><br><small>No. KTA: ${k.pribadi.kta || "-"}</small></td>
            <td style="text-align:center;">${ageInfo.age}</td>
            <td style="text-align:center;">${k.pribadi.jk}</td>
            <td>${pendidikan}</td>
            <td>${badges}</td>
        `;
        row.addEventListener("click",()=>showDetail(index));
        tableBody.appendChild(row);
    });
}

// --- Modal Detail ---
function showDetail(idx){
    const k = BOS_DATA[idx];
    const ageInfo = calculateAge(k.pribadi.tgl_lahir);

    // --- Kaderisasi Lengkap ---
    const jenjangList = ["Pratama","Madya","Utama","Guru","Perempuan","Tema Khusus"];
    let badges = "";
    if(k.kaderisasi && k.kaderisasi.length>2){
        jenjangList.forEach(j=>{
            const match = k.kaderisasi.find(kdr => kdr && kdr.toLowerCase() === j.toLowerCase());
            if(match) badges += `<span class="badge badge-red" style="margin:2px; display:inline-block;">${j}</span>`;
        });
    }

    const detailDiv = document.getElementById("detail-kader");
    detailDiv.innerHTML = `
        <h3>${k.pribadi.nama}</h3>
        <img src="${k.pribadi.foto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(k.pribadi.nama)}" width="150" style="border-radius:50%;" />
        <p><b>No. KTA:</b> ${k.pribadi.kta || "-"}</p>
        <p><b>Nama:</b> ${k.pribadi.nama}</p>
        <p><b>Jenis Kelamin:</b> ${k.pribadi.jk}</p>
        <p><b>Tempat, Tgl Lahir:</b> ${k.pribadi.tmpt_lahir || '-'}, ${k.pribadi.tgl_lahir || '-'}</p>
        <p><b>Alamat:</b> ${k.pribadi.alamat || '-'}, RT ${k.pribadi.rt || '-'}, RW ${k.pribadi.rw || '-'}, ${k.pribadi.desa || '-'}, ${k.pribadi.kec || '-'}, ${k.pribadi.kota || k.pribadi.kab_kota || '-'}</p>
        <p><b>Umur:</b> ${ageInfo.age} (${ageInfo.gen})</p>
        <p><b>Agama:</b> ${k.pribadi.agama || '-'}</p>
        <p><b>Email:</b> ${k.pribadi.email || '-'}</p>
        <p><b>No. WA:</b> ${k.pribadi.wa || '-'}</p>
        <p><b>Pendidikan Formal:</b> ${k.formal[19] || '-'}</p>
        <p><b>Pendidikan Kader:</b><br>${badges}</p>
    `;

    document.getElementById("modalDetail").style.display = "block";
}

// --- Tutup Modal ---
function closeDetail(){
    document.getElementById("modalDetail").style.display = "none";
}

window.onclick = function(event){
    const modal = document.getElementById("modalDetail");
    if(event.target == modal) closeDetail();
}
document.addEventListener('keydown', function(event){
    if(event.key === "Escape") closeDetail();
});
