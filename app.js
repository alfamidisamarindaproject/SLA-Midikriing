const API_URL = "https://script.google.com/macros/s/AKfycbyCTZbuO1QrQ8u3NfcfLS4-lVcH_rrcnpF7pIiRxUPhOk3vdzMKp6SSVZyooHYyvSQs/exec"; 
let masterData = [];

async function fetchData() {
    const tableBody = document.getElementById('main-table-body');
    const updateLabel = document.getElementById('gsheet-update');

    try {
        const response = await fetch(API_URL);
        const json = await response.json();
        
        if (json.error) {
            tableBody.innerHTML = `<tr><td colspan="6" class="p-10 text-center text-red-500 font-bold uppercase tracking-widest italic">Error: ${json.error}</td></tr>`;
            return;
        }

        masterData = json.data;
        updateLabel.innerText = `Data Update: ${json.dataUpdate}`;
        
        // Refresh Filter Dropdown
        setupDropdown('filter-wilayah', 'wilayah', 'Wilayah');
        setupDropdown('filter-apo', 'status_apo', 'APO');
        setupDropdown('filter-shipment', 'status_shipment', 'Shipment');

        applyFilters(); 
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="6" class="p-10 text-center text-red-500 font-bold uppercase tracking-widest italic">Gagal Menghubungkan ke API. Periksa URL Deployment Anda.</td></tr>`;
        console.error(err);
    }
}

function setupDropdown(id, key, label) {
    const dropdown = document.getElementById(id);
    const uniqueValues = [...new Set(masterData.map(item => item[key]))].filter(Boolean).sort();
    dropdown.innerHTML = `<option value="">Semua ${label}</option>`;
    uniqueValues.forEach(val => {
        dropdown.insertAdjacentHTML('beforeend', `<option value="${val}">${val}</option>`);
    });
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
    const revenue = data.reduce((acc, curr) => acc + curr.revenue, 0);

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-new').innerText = cNew;
    document.getElementById('stat-proses').innerText = cProses;
    document.getElementById('stat-packing').innerText = cPacking;
    
    const getP = (n) => total > 0 ? ((n/total)*100).toFixed(1) + '%' : '0%';
    document.getElementById('perc-new').innerText = getP(cNew);
    document.getElementById('perc-proses').innerText = getP(cProses);
    document.getElementById('perc-packing').innerText = getP(cPacking);
    
    document.getElementById('stat-revenue').innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(revenue);
}

function renderTable(data) {
    const tbody = document.getElementById('main-table-body');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-20 text-center font-bold text-slate-300 uppercase tracking-widest italic">Tidak Ada Data Ditemukan</td></tr>`;
        return;
    }

    const today = new Date(); 
    today.setHours(0,0,0,0);

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
            <tr class="hover:bg-slate-50 transition-all">
                <td class="px-6 py-4 font-black text-slate-800">
                    ${item.toko}<br><span class="text-[9px] text-blue-500 font-black uppercase tracking-widest">${item.wilayah}</span>
                </td>
                <td class="px-6 py-4 font-semibold text-slate-600 uppercase">${item.nama}</td>
                <td class="px-6 py-4 text-center font-mono text-slate-400">${item.no_pengiriman}</td>
                <td class="px-6 py-4 text-center">
                    <span class="px-3 py-1 rounded-full border font-black text-[9px] ${badge}">${item.status_apo}</span>
                </td>
                <td class="px-6 py-4 font-bold text-slate-400 uppercase text-[9px]">${item.status_shipment}</td>
                <td class="px-6 py-4 text-center ${slaClass}">${slaStr}</td>
            </tr>
        `);
    });
}

// Listeners
document.getElementById('search-input').addEventListener('input', applyFilters);
document.getElementById('filter-wilayah').addEventListener('change', applyFilters);
document.getElementById('filter-apo').addEventListener('change', applyFilters);
document.getElementById('filter-shipment').addEventListener('change', applyFilters);

fetchData();
