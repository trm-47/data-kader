const GAS_URL = "https://script.google.com/macros/s/AKfycbwAbaGgSWdlZ3AwtPk3Guwu-izM6AIsmf4CrW5WFFytVOQd9jHymA_4SQVU83EiFWBaZA/exec?action=read";
let BOS_DATA = [];

// langsung load data saat halaman dibuka
window.onload = loadData;

function loadData() {
    const script = document.createElement("script");
    script.src = GAS_URL + "&callback=handleData";
    document.body.appendChild(script);
}

function handleData(data) {
    if (!data || data.error) {
        alert("Gagal mengambil data: " + (data ? data.error : "tidak ada data"));
        return;
    }

    BOS_DATA = data;
    renderTable();
}

function calculateAge(birthDateString) {
    if (!birthDateString) return "-";
    const parts = birthDateString.includes('/') ? birthDateString.split('/') : birthDateString.split('-');
    let birth;
    if(parts.length>=3){
        birth = new Date(parts[2], parts[1]-1, parts[0]);
    } else {
        birth = new Date(birthDateString);
    }
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if(m<0 || (m===0 && today.getDate()<birth.getDate())) age--;
    return age;
}

function renderTable() {
    const tableBody = document.getElementById("kader-table-body");
    tableBody.innerHTML = "";

    BOS_DATA.forEach(k => {
        const row = document.createElement("tr");

        // Pendidikan formal (ambil yang terakhir ada)
        let pendidikanFormal = "-";
        for(let i=k.formal.length-1; i>=0; i--){
            if(k.formal[i] && k.formal[i]!="-"){ pendidikanFormal = k.formal[i]; break; }
        }

        // Pendidikan kader lengkap
        let pendidikanKader = [];
        if(k.kaderisasi[2] && k.kaderisasi[2]!="-") pendidikanKader.push(`<span class="badge badge-pratama">Pratama</span>`);
        if(k.kaderisasi[4] && k.kaderisasi[4]!="-") pendidikanKader.push(`<span class="badge badge-madya">Madya</span>`);
        if(k.kaderisasi[6] && k.kaderisasi[6]!="-") pendidikanKader.push(`<span class="badge badge-utama">Utama</span>`);
        if(k.kaderisasi[7] && k.kaderisasi[7]!="-") pendidikanKader.push(`<span class="badge badge-guru">Guru</span>`);
        if(k.kaderisasi[8] && k.kaderisasi[8]!="-") pendidikanKader.push(`<span class="badge badge-perempuan">Perempuan</span>`);
        if(k.kaderisasi[9] && k.kaderisasi[9]!="-") pendidikanKader.push(`<span class="badge badge-tema">Tema Khusus</span>`);

        row.innerHTML = `
            <td>${k.pribadi.nama} <br><small>No.KTA: ${k.pribadi.kta || "-"}</small></td>
            <td>${calculateAge(k.pribadi.tgl_lahir)}</td>
            <td>${k.pribadi.jk}</td>
            <td>${pendidikanFormal}</td>
            <td>${pendidikanKader.join(" ")}</td>
        `;

        row.addEventListener("click", () => showDetail(k));
        tableBody.appendChild(row);
    });
}

function showDetail(k) {
    const detailDiv = document.getElementById("detail-kader");
    detailDiv.innerHTML = `
        <h3>${k.pribadi.nama} (No.KTA: ${k.pribadi.kta || "-"})</h3>
        <img src="${k.pribadi.foto || 'https://ui-avatars.com/api/?name='+encodeURIComponent(k.pribadi.nama)}" width="150" style="border-radius:50%; margin-bottom:15px;" />
        <p><b>Nama:</b> ${k.pribadi.nama}</p>
        <p><b>JK:</b> ${k.pribadi.jk}</p>
        <p><b>Tempat, Tgl Lahir:</b> ${k.pribadi.tmpt_lahir || "-"}, ${k.pribadi.tgl_lahir || "-"}</p>
        <p><b>Alamat:</b> ${k.pribadi.alamat || "-"}, RT ${k.pribadi.rt || "-"} / RW ${k.pribadi.rw || "-"}, ${k.pribadi.desa || "-"}, ${k.pribadi.kec || "-"}, ${k.pribadi.kota || "-"}</p>
        <p><b>Umur:</b> ${calculateAge(k.pribadi.tgl_lahir)}</p>
        <p><b>Agama:</b> ${k.pribadi.agama || "-"}</p>
        <p><b>Email:</b> ${k.pribadi.email || "-"}</p>
        <p><b>No. WA:</b> ${k.pribadi.wa || "-"}</p>
        <p><b>Pendidikan Formal:</b> ${k.formal.filter(f=>f && f!="-").join(", ") || "-"}</p>
        <p><b>Pendidikan Kader:</b> Pratama: ${k.kaderisasi[2]||"-"}, Madya: ${k.kaderisasi[4]||"-"}, Utama: ${k.kaderisasi[6]||"-"}, Guru: ${k.kaderisasi[7]||"-"}, Perempuan: ${k.kaderisasi[8]||"-"}, Tema Khusus: ${k.kaderisasi[9]||"-"}</p>
    `;
    document.getElementById("modalDetail").style.display = "block";
}

function closeDetail() {
    document.getElementById("modalDetail").style.display = "none";
}

// klik luar modal untuk close
window.onclick = function(event){
    const modal = document.getElementById("modalDetail");
    if(event.target==modal) closeDetail();
}
