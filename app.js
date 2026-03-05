const API_URL = "https://script.google.com/macros/s/AKfycbz7c3kgfD1dbI0itN02_9iK1GjTgahtPTFJ5W-nr5Imv8nDUPc7WoPNr9jf7VGyy1U/exec"; 

let masterData = [];

async function fetchData() {
    const updateLabel = document.getElementById('gsheet-update');
    const tbody = document.getElementById('main-table-body');

    try {
        const response = await fetch(API_URL);
        const resJson = await response.json();
        
        if (resJson.error) throw new Error(resJson.error);

        updateLabel.innerText = `GSheet Update: ${resJson.lastEdit}`;
        masterData = resJson.data;
        
        setupDropdown('filter-wilayah', 'wilayah', 'Wilayah');
        setupDropdown('filter-apo', 'status_apo', 'APO');
        setupDropdown('filter-shipment', 'status_shipment', 'Shipment');

        renderTable(masterData);
    } catch (e) {
        updateLabel.innerText = "Gagal Sinkronisasi!";
        tbody.innerHTML = `<tr><td colspan="7" class="p-10 text-center text-red-500 font-bold uppercase italic">Error: ${e.message}</td></tr>`;
    }
}

function renderTable(data) {
    const tbody = document.getElementById('main-table-body');
    tbody.innerHTML = '';

    const hariIni = new Date();
    hariIni.setHours(0,0,0,0);

    data.forEach(item => {
        let tglFormat = "-";
        let slaText = "-";
        let slaClass = "text-slate-400";

        if (item.jadwal_kirim) {
            const jadwal = new Date(item.jadwal_kirim);
            jadwal.setHours(0,0,0,0);
            
            // Format Indonesia (Tgl Bln Thn)
            tglFormat = jadwal.toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'});
            
            // Hitung SLA
            const diffTime = jadwal - hariIni;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
                slaText = `${diffDays} Hari`;
                slaClass = "text-red-600 font-black italic";
            } else if (diffDays === 0) {
                slaText = "HARI INI";
                slaClass = "text-orange-500 font-black";
            } else {
                slaText = `+${diffDays} Hari`;
                slaClass = "text-emerald-600 font-bold";
            }
        }

        const apoBadge = item.status_apo === 'NEW' ? 'bg-red-50 text-red-600 border-red-100' : 
                         item.status_apo === 'PROSES' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                         'bg-emerald-50 text-emerald-600 border-emerald-100';

        tbody.insertAdjacentHTML('beforeend', `
            <tr class="hover:bg-slate-50 transition-colors text-[11px] border-b border-slate-100">
                <td class="px-6 py-4">
                    <div class="font-black text-slate-800">${item.toko}</div>
                    <div class="text-[9px] text-blue-500 font-black uppercase italic">${item.wilayah}</div>
                </td>
                <td class="px-6 py-4 font-semibold text-slate-600 uppercase">${item.nama}</td>
                <td class="px-6 py-4 text-center font-mono text-slate-400 italic">${item.no_pengiriman}</td>
                <td class="px-6 py-4 text-center">
                    <span class="px-2 py-0.5 rounded border font-black text-[9px] ${apoBadge}">${item.status_apo}</span>
                </td>
                <td class="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] italic">${item.status_shipment}</td>
                <td class="px-6 py-4 text-center font-bold text-slate-700">${tglFormat}</td>
                <td class="px-6 py-4 text-center ${slaClass}">${slaText}</td>
            </tr>
        `);
    });
}
// Panggil fetchData() di akhir file
fetchData();
