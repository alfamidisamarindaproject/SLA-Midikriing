const API_URL = "https://script.google.com/macros/s/AKfycbxrpSk9dCtJig1murEosB3soLnrNa35Do0kgX6CIhiXyJVqUSRrjLiCYz6H4EvHDnft/exec";

let masterData = [];

async function fetchData() {
    const tbody = document.getElementById('main-table-body');
    const updateInfo = document.getElementById('last-update'); // Pastikan ID ini ada di HTML

    try {
        const response = await fetch(API_URL);
        const resJson = await response.json();
        
        // Tampilkan info terakhir update dari GSheet
        if(updateInfo) updateInfo.innerText = `Data GSheet Terakhir Diupdate: ${resJson.lastEdit}`;
        
        masterData = resJson.data;
        applyFilters();
    } catch (e) {
        if(updateInfo) updateInfo.innerText = "Gagal terhubung ke GSheet";
        console.error(e);
    }
}

function renderTable(data) {
    const tbody = document.getElementById('main-table-body');
    tbody.innerHTML = '';

    const skrg = new Date();
    skrg.setHours(0,0,0,0);

    data.forEach(item => {
        let tglTampil = "-";
        let slaTampil = "-";
        let slaClass = "text-gray-400";

        if (item.jadwal_kirim) {
            const jadwal = new Date(item.jadwal_kirim);
            jadwal.setHours(0,0,0,0);
            
            // Format Indonesia: Tgl Bln Thn
            tglTampil = jadwal.toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'});
            
            // Hitung Selisih Hari
            const selisih = Math.ceil((jadwal - skrg) / (1000 * 60 * 60 * 24));
            
            if (selisih < 0) {
                slaTampil = `${selisih} Hari`;
                slaClass = "text-red-600 font-bold italic";
            } else if (selisih === 0) {
                slaTampil = "HARI INI";
                slaClass = "text-orange-500 font-bold";
            } else {
                slaTampil = `+${selisih} Hari`;
                slaClass = "text-green-600 font-bold";
            }
        }

        const apoBadge = item.status_apo === 'NEW' ? 'bg-red-100 text-red-700' : 
                         item.status_apo === 'PROSES' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700';

        // URUTAN BARIS: Toko/Wilayah, Penerima, No Pengiriman, Status APO, Shipment, Jadwal Kirim, SLA
        tbody.insertAdjacentHTML('beforeend', `
            <tr class="border-b text-xs hover:bg-gray-50">
                <td class="p-3">
                    <div class="font-bold">${item.toko}</div>
                    <div class="text-blue-600 text-[10px] font-bold">${item.wilayah}</div>
                </td>
                <td class="p-3 font-semibold text-gray-700">${item.nama}</td>
                <td class="p-3 text-gray-500 font-mono">${item.no_pengiriman}</td>
                <td class="p-3 text-center">
                    <span class="px-2 py-1 rounded-md text-[10px] font-black ${apoBadge}">${item.status_apo}</span>
                </td>
                <td class="p-3 font-bold text-gray-400 uppercase text-[10px]">${item.status_shipment}</td>
                <td class="p-3 text-center font-bold text-gray-600">${tglTampil}</td>
                <td class="p-3 text-center ${slaClass}">${slaTampil}</td>
            </tr>
        `);
    });
}
