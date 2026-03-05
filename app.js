const API_URL = "https://script.google.com/macros/s/AKfycbxFQe4102qUozonXFcXOmGeyiIf1Da46sWZH3H4ittZ1A4qg5xApiAduEWmJFEsb_0B/exec"; 
let masterData = [];

async function fetchData() {
    const updateLabel = document.getElementById('gsheet-update');
    try {
        const response = await fetch(API_URL);
        const resJson = await response.json();
        updateLabel.innerText = `Data Update: ${resJson.dataUpdate}`;
        masterData = resJson.data;
        
        setupDropdown('filter-wilayah', 'wilayah', 'Wilayah');
        setupDropdown('filter-apo', 'status_apo', 'APO');
        setupDropdown('filter-shipment', 'status_shipment', 'Shipment');
        applyFilters(); 
    } catch (e) {
        updateLabel.innerText = "Gagal Sinkronisasi!";
    }
}

function updateDashboard(data) {
    const total = data.length;
    const cNew = data.filter(i => i.status_apo === 'NEW').length;
    const cProses = data.filter(i => i.status_apo === 'PROSES').length;
    const cPacking = data.filter(i => i.status_apo === 'PACKING').length;

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-new').innerText = cNew;
    document.getElementById('stat-proses').innerText = cProses;
    document.getElementById('stat-packing').innerText = cPacking;

    // Menampilkan Persentase
    const calc = (n) => total > 0 ? ((n/total)*100).toFixed(1) + '%' : '0%';
    document.getElementById('perc-new').innerText = calc(cNew);
    document.getElementById('perc-proses').innerText = calc(cProses);
    document.getElementById('perc-packing').innerText = calc(cPacking);
    
    const rev = data.reduce((acc, curr) => acc + curr.revenue, 0);
    document.getElementById('stat-revenue').innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(rev);
}

function renderTable(data) {
    const tbody = document.getElementById('main-table-body');
    tbody.innerHTML = '';
    const hariIni = new Date();
    hariIni.setHours(0,0,0,0);

    data.forEach(item => {
        let tglStr = "-";
        let slaStr = "-";
        let slaClass = "text-slate-400";

        if (item.jadwal_kirim) {
            const jadwal = new Date(item.jadwal_kirim);
            if (!isNaN(jadwal.getTime())) {
                jadwal.setHours(0,0,0,0);
                tglStr = jadwal.toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'});
                
                const diff = Math.ceil((jadwal - hariIni) / (1000 * 60 * 60 * 24));
                if (diff < 0) {
                    slaStr = `${diff} Hr`;
                    slaClass = "text-red-600 font-black italic";
                } else if (diff === 0) {
                    slaStr = "HARI INI";
                    slaClass = "text-orange-500 font-black";
                } else {
                    slaStr = `+${diff} Hr`;
                    slaClass = "text-emerald-600 font-bold";
                }
            }
        }

        const apoBadge = item.status_apo === 'NEW' ? 'bg-red-50 text-red-600' : 
                         item.status_apo === 'PROSES' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600';

        tbody.insertAdjacentHTML('beforeend', `
            <tr class="hover:bg-slate-50 text-[11px] border-b border-slate-100">
                <td class="px-6 py-4 font-black text-slate-800">${item.toko}<br><span class="text-[9px] text-blue-500 italic font-black uppercase">${item.wilayah}</span></td>
                <td class="px-6 py-4 font-semibold text-slate-600 uppercase">${item.nama}</td>
                <td class="px-6 py-4 text-center font-mono text-slate-400 italic">${item.no_pengiriman}</td>
                <td class="px-6 py-4 text-center"><span class="px-2 py-0.5 rounded border font-black text-[9px] ${apoBadge}">${item.status_apo}</span></td>
                <td class="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] italic">${item.status_shipment}</td>
                <td class="px-6 py-4 text-center font-bold text-slate-700">${tglStr}</td>
                <td class="px-6 py-4 text-center ${slaClass}">${slaStr}</td>
            </tr>
        `);
    });
}
// ... fungsi applyFilters & setupDropdown sama dengan sebelumnya ...
fetchData();
