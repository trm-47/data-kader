const GAS_URL = "https://script.google.com/macros/s/AKfycbwAbaGgSWdlZ3AwtPk3Guwu-izM6AIsmf4CrW5WFFytVOQd9jHymA_4SQVU83EiFWBaZA/exec?action=read";

let BOS_DATA = [];

function login() {
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;

    if (user === "admin" && pass === "pdi123") {
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
    if (!data || data.error) {
        alert("Gagal mengambil data: " + (data ? data.error : "tidak ada data"));
        return;
    }

    BOS_DATA = data;
    renderKPI();
    renderTable();
}

function renderKPI() {
    const totalKader = BOS_DATA.length;
    const genZMilenial = BOS_DATA.filter(k => {
        const umur = parseInt(k.pribadi.umur);
        return umur >= 17 && umur <= 40;
    }).length;
    const rasioPerempuan = (BOS_DATA.filter(k => k.pribadi.jk === "Perempuan").length / totalKader * 100).toFixed(1);

    document.getElementById("total-kader").innerText = totalKader;
    document.getElementById("percent-genz-milenial").innerText = genZMilenial + " orang";
    document.getElementById("rasio-perempuan").innerText = rasioPerempuan + " %";

    let totalPratama = 0, totalMadya = 0, totalUtama = 0;
    BOS_DATA.forEach(k => {
        const kdr = k.kaderisasi;
        if (kdr[2] && kdr[2] !== "") totalPratama++;
        if (kdr[4] && kdr[4] !== "") totalMadya++;
        if (kdr[6] && kdr[6] !== "") totalUtama++;
    });

    document.getElementById("total-pratama").innerText = totalPratama;
    document.getElementById("total-madya").innerText = totalMadya;
    document.getElementById("total-utama").innerText = totalUtama;
}

function renderTable() {
    const tableBody = document.getElementById("kader-table-body");
    tableBody.innerHTML = "";

    BOS_DATA.forEach(k => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${k.pribadi.nama}</td>
            <td>${k.pribadi.nik}</td>
            <td>${k.pribadi.kota}</td>
            <td>${k.pribadi.kec}</td>
            <td>${k.pribadi.desa}</td>
            <td>${k.pribadi.jk}</td>
            <td>${k.pribadi.umur}</td>
            <td>${k.kaderisasi[2] || "-"}</td>
            <td>${k.kaderisasi[4] || "-"}</td>
            <td>${k.kaderisasi[6] || "-"}</td>
        `;

        row.addEventListener("click", () => showDetail(k));
        tableBody.appendChild(row);
    });
}

function showDetail(k) {
    const detailDiv = document.getElementById("detail-kader");
    detailDiv.innerHTML = `
        <h3>${k.pribadi.nama}</h3>
        <img src="${k.pribadi.foto}" width="150" />
        <p><b>NIK:</b> ${k.pribadi.nik}</p>
        <p><b>Alamat:</b> ${k.pribadi.alamat}, ${k.pribadi.desa}, ${k.pribadi.kec}, ${k.pribadi.kota}</p>
        <p><b>Umur:</b> ${k.pribadi.umur}</p>
        <p><b>Jenis Kelamin:</b> ${k.pribadi.jk}</p>
        <p><b>Pendidikan Terakhir:</b> ${k.formal[19] || "-"}</p>
        <p><b>Kaderisasi:</b> Pratama ${k.kaderisasi[2] || "-"}, Madya ${k.kaderisasi[4] || "-"}, Utama ${k.kaderisasi[6] || "-"}</p>
        <p><b>Jabatan:</b> ${k.jabatan.map(j => j[5]).join(", ") || "-"}</p>
    `;
}
