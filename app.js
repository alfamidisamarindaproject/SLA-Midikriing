const API_URL = "https://script.google.com/macros/s/AKfycbzrmhJ2rEGYVUpXz7rY-zR3TffAPJpt8vG5wF2yNRRXg4UkncrOUdIJPj-Y3J8o1gJR/exec"; 
let masterData = [];

async function fetchData() {
    try {
        const response = await fetch(API_URL);
        const res = await response.json();
        
        document.getElementById('gsheet-update').innerText = `Data Update: ${res.dataUpdate}`;
        document.getElementById('status-text').innerText = "Online";
        document.getElementById('status-text').classList.replace('text-slate-400', 'text-green-600');
        
        masterData = res.data;
        
        setupDropdown('filter-wilayah', 'wilayah', 'Wilayah');
        setupDropdown('filter-apo', 'status_apo', 'APO');
        setupDropdown('filter-shipment', 'status_shipment', 'Shipment');

        applyFilters(); 
    } catch (e) {
        document.getElementById('gsheet-update').innerText = "Gagal Sinkron!";
        console.error(e);
    }
}

function setupDropdown(id, key, label) {
    const dropdown = document.getElementById(id);
    const values = [...new Set(masterData.map(item => item[key]))].filter(Boolean).sort();
    dropdown.innerHTML = `<option value="">Semua ${label}</option>`;
    values.forEach(v => dropdown.insertAdjacentHTML('beforeend', `<option value="${v}">${v}</option>`));
}

function applyFilters() {
    const s = document.getElementById('search-input').value.toLowerCase();
    const w = document.getElementById('filter-wilayah').value;
    const a = document.getElementById('filter-apo').value;
    const sh = document.getElementById('filter-shipment').value;

    const filtered = masterData.filter(i => {
        return (i.nama.toLowerCase().includes(s) || i.toko.toLowerCase().includes(s) || i.no_pengiriman.toLowerCase().includes(s)) &&
               (w === "" || i.wilayah === w) &&
               (a === "" || i.status_apo === a) &&
               (sh === "" || i.status_shipment === sh);
    });

    updateDashboard(filtered);
    renderTable(filtered);
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

    const getPerc = (n) => total > 0 ? ((n/total)*100).toFixed(1) + '%' : '0%';
    document.getElementById('perc-new').innerText = getPerc(cNew);
    document.getElementById('perc-proses').innerText = getPerc(cProses);
    document.getElementById('perc-packing').innerText = getPerc(cPacking);
    
    const rev = data.reduce((acc, curr) => acc + curr.revenue, 0);
    document.getElementById('stat-revenue').innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(rev);
}

function renderTable(data) {
    const tbody = document.getElementById('main-table-body');
    tbody.innerHTML = '';
    const today = new Date(); today.setHours(0,0,0,0);

    data.forEach(item => {
        let slaStr = "-", slaClass = "text-slate-400";
        if (item.jadwal_kirim) {
            const jadwal = new Date(item.jadwal_kirim);
            jadwal.setHours(0,0,0,0);
            const diff = Math.ceil((jadwal - today) / (1000 * 60 * 60 * 24));
            
            if (diff < 0) { slaStr = `${diff} Hr`; slaClass = "text-red-600 font-black"; }
            else if (diff === 0) { slaStr = "HARI INI"; slaClass = "text-orange-500 font-black"; }
            else { slaStr = `+${diff} Hr`; slaClass = "text-emerald-600 font-bold"; }
        }

        const badge = item.status_apo === 'NEW' ? 'bg-red-50 text-red-600' : (item.status_apo === 'PROSES' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600');

        tbody.insertAdjacentHTML('beforeend', `
            <tr class="hover:bg-slate-50 border-b border-slate-100">
                <td class="px-6 py-4 font-black text-slate-800">${item.toko}<br><span class="text-[9px] text-blue-500 uppercase">${item.wilayah}</span></td>
                <td class="px-6 py-4 font-semibold text-slate-600 uppercase">${item.nama}</td>
                <td class="px-6 py-4 text-center font-mono text-slate-400">${item.no_pengiriman}</td>
                <td class="px-6 py-4 text-center"><span class="px-2 py-0.5 rounded border font-black text-[9px] ${badge}">${item.status_apo}</span></td>
                <td class="px-6 py-4 font-bold text-slate-400 uppercase text-[10px]">${item.status_shipment}</td>
                <td class="px-6 py-4 text-center ${slaClass}">${slaStr}</td>
            </tr>
        `);
    });
}

document.getElementById('search-input').addEventListener('input', applyFilters);
document.getElementById('filter-wilayah').addEventListener('change', applyFilters);
document.getElementById('filter-apo').addEventListener('change', applyFilters);
document.getElementById('filter-shipment').addEventListener('change', applyFilters);

fetchData();
