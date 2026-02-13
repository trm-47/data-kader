const GAS_URL = "https://script.google.com/macros/s/AKfycbwAbaGgSWdlZ3AwtPk3Guwu-izM6AIsmf4CrW5WFFytVOQd9jHymA_4SQVU83EiFWBaZA/exec";

let BOS_DATA = [];

// ================= LOGIN =================

function login(){
    const u = document.getElementById("username").value;
    const p = document.getElementById("password").value;

    if(u === "dpd" && p === "bos2026"){
        document.getElementById("loginScreen").style.display="none";
        document.getElementById("mainApp").style.display="block";
        loadData();
    } else {
        alert("Login gagal");
    }
}

function logout(){
    location.reload();
}

// ================= LOAD DATA =================

async function loadData(){
    try{
        const res = await fetch(GAS_URL);
        const data = await res.json();
        BOS_DATA = data;

        renderKPI();
        renderTable();

    }catch(err){
        alert("Gagal mengambil data");
        console.error(err);
    }
}

// ================= KPI =================

function renderKPI(){

    const total = BOS_DATA.length;

    let perempuan = 0;
    let pratama = 0;
    let madya = 0;
    let utama = 0;
    let young = 0;

    BOS_DATA.forEach(d => {
        const p = d.pribadi;
        const k = d.kaderisasi;

        if(p.jk === "Perempuan") perempuan++;

        const umur = parseInt(p.umur);
        if(umur <= 43) young++;

        if(k[2]) pratama++;  // pt
        if(k[4]) madya++;    // mt
        if(k[6]) utama++;    // ut
    });

    document.getElementById("kpiTotal").innerText = total;
    document.getElementById("kpiYoung").innerText = total ? Math.round((young/total)*100)+"%" : "0%";
    document.getElementById("kpiPratama").innerText = pratama;
    document.getElementById("kpiMadya").innerText = madya;
    document.getElementById("kpiUtama").innerText = utama;
    document.getElementById("kpiPerempuan").innerText = total ? Math.round((perempuan/total)*100)+"%" : "0%";
}

// ================= TABLE =================

function renderTable(){
    const tbody = document.getElementById("tableBody");
    tbody.innerHTML="";

    BOS_DATA.forEach((d,i)=>{
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${d.pribadi.nama}</td>
            <td>${d.pribadi.umur}</td>
            <td>${d.pribadi.kota}</td>
            <td>${getJenjang(d.kaderisasi)}</td>
            <td>${getJabatan(d.jabatan)}</td>
        `;

        tr.onclick = ()=> openDrawer(d);

        tbody.appendChild(tr);
    });
}

function getJenjang(k){
    if(k[6]) return "Utama";
    if(k[4]) return "Madya";
    if(k[2]) return "Pratama";
    return "-";
}

function getJabatan(j){
    if(!j || j.length===0) return "-";
    return j[0][5] || "-";
}

// ================= SEARCH =================

function searchTable(){
    const val = document.getElementById("searchInput").value.toLowerCase();
    const rows = document.querySelectorAll("#tableBody tr");

    rows.forEach(r=>{
        r.style.display = r.innerText.toLowerCase().includes(val) ? "" : "none";
    });
}

// ================= DRAWER =================

function openDrawer(d){
    const div = document.getElementById("drawerContent");

    div.innerHTML = `
        <h2>${d.pribadi.nama}</h2>
        <img src="${d.pribadi.foto}" style="width:120px;border-radius:10px;margin-bottom:15px;">
        <p><b>NIK:</b> ${d.pribadi.nik}</p>
        <p><b>KTA:</b> ${d.pribadi.kta}</p>
        <p><b>Usia:</b> ${d.pribadi.umur}</p>
        <p><b>Alamat:</b> ${d.pribadi.alamat}, ${d.pribadi.desa}, ${d.pribadi.kec}, ${d.pribadi.kota}</p>
        <p><b>Pekerjaan:</b> ${d.pribadi.kerja_skrg}</p>
        <p><b>Email:</b> ${d.pribadi.email}</p>
        <hr>
        <h3>Kaderisasi</h3>
        <p>Pratama: ${d.kaderisasi[2] || "-"}</p>
        <p>Madya: ${d.kaderisasi[4] || "-"}</p>
        <p>Utama: ${d.kaderisasi[6] || "-"}</p>
    `;

    document.getElementById("drawer").classList.add("active");
}

function closeDrawer(){
    document.getElementById("drawer").classList.remove("active");
}

// ================= EXPORT PDF =================

async function exportPDF(){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    await html2canvas(document.body).then(canvas=>{
        const img = canvas.toDataURL("image/png");
        doc.addImage(img,'PNG',10,10,190,0);
        doc.save("Executive_Dashboard_DPD_DIY.pdf");
    });
}
