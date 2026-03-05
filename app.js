const API_URL = "https://script.google.com/macros/s/AKfycbz5WJ12ONyEGCLHCReu1nppbpLHnXpXgFxzMl-xWYafgnP3tvJhwkIKeP7mXNdJJnd_/exec";

async function fetchData() {
    const updateLabel = document.getElementById('gsheet-update');
    try {
        const response = await fetch(API_URL);
        const res = await response.json();
        
        updateLabel.innerText = `GSheet Update: ${res.lastEdit}`;
        masterData = res.data;
        
        setupDropdown('filter-wilayah', 'wilayah', 'Wilayah');
        setupDropdown('filter-apo', 'status_apo', 'APO');
        setupDropdown('filter-shipment', 'status_shipment', 'Shipment');

        applyFilters();
    } catch (e) {
        updateLabel.innerText = "Error Koneksi!";
        console.error(e);
    }
}

function renderTable(data) {
    const tbody = document.getElementById('main-table-body');
    tbody.innerHTML = '';
    const skrg = new Date();
    skrg.setHours(0,0,0,0);

    data.forEach(item => {
        let tglStr = "-";
        let slaStr = "-";
        let slaStyle = "text-slate-400";

        if (item.jadwal_kirim) {
            const jadwal = new Date(item.jadwal_kirim);
            jadwal.setHours(0,0,0,0);
            
            tglStr = jadwal.toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'});
            const diff = Math.ceil((jadwal - skrg) / (1000 * 60 * 60 * 24));
            
            if (diff < 0) {
                slaStr = `${diff} Hr`;
                slaStyle = "text-red-600 font-black italic";
            } else if (diff === 0) {
                slaStr = "HARI INI";
                slaStyle = "text-orange-500 font-black";
            } else {
                slaStr = `+${diff} Hr`;
                slaStyle = "text-emerald-600 font-bold";
            }
        }

        const apoBadge = item.status_apo === 'NEW' ? 'bg-red-50 text-red-600' : 
                         item.status_apo === 'PROSES' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600';

        tbody.insertAdjacentHTML('beforeend', `
            <tr class="hover:bg-slate-50 text-[11px] border-b border-slate-100 transition-all">
                <td class="px-6 py-4 font-black text-slate-800">${item.toko}<br><span class="text-[9px] text-blue-500 italic font-black uppercase">${item.wilayah}</span></td>
                <td class="px-6 py-4 font-semibold text-slate-600 uppercase">${item.nama}</td>
                <td class="px-6 py-4 text-center font-mono text-slate-400">${item.no_pengiriman}</td>
                <td class="px-6 py-4 text-center"><span class="px-2 py-0.5 rounded border font-black text-[9px] ${apoBadge}">${item.status_apo}</span></td>
                <td class="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] italic">${item.status_shipment}</td>
                <td class="px-6 py-4 text-center font-bold text-slate-700">${tglStr}</td>
                <td class="px-6 py-4 text-center ${slaStyle}">${slaStr}</td>
            </tr>
        `);
    });
}
