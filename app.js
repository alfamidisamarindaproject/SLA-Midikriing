const API_URL = "https://script.google.com/macros/s/AKfycby6zSTiRXwkE8RsNySzIC7Vns_pIeWYgbMVs4KInex4bFBQNxIjayaKLoi-qP6lqe8/exec"; 

let masterData = [];

async function fetchData() {
    const tbody = document.getElementById('main-table-body');
    tbody.innerHTML = '<tr><td colspan="7" class="p-10 text-center font-bold text-blue-500 animate-pulse uppercase tracking-widest">Sinkronisasi Data...</td></tr>';

    try {
        const response = await fetch(API_URL);
        masterData = await response.json();
        
        setupDropdown('filter-wilayah', 'wilayah', 'Wilayah');
        setupDropdown('filter-apo', 'status_apo', 'APO');
        setupDropdown('filter-shipment', 'status_shipment', 'Shipment');

        applyFilters();
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-10 text-center text-red-500">Error: ${e.message}</td></tr>`;
    }
}

function setupDropdown(id, key, label) {
    const dropdown = document.getElementById(id);
    const uniqueValues = [...new Set(masterData.map(item => item[key]))].filter(Boolean).sort();
    dropdown.innerHTML = `<option value="">Semua ${label}</option>`;
    uniqueValues.forEach(val => dropdown.insertAdjacentHTML('beforeend', `<option value="${val}">${val}</option>`));
}

function applyFilters() {
    const searchVal = document.getElementById('search-input').value.toLowerCase();
    const wilVal = document.getElementById('filter-wilayah').value;
    const apoVal = document.getElementById('filter-apo').value;
    const shipVal = document.getElementById('filter-shipment').value;

    const filtered = masterData.filter(item => {
        const matchSearch = item.nama.toLowerCase().includes(searchVal) || 
                            item.toko.toLowerCase().includes(searchVal) || 
                            item.no_pengiriman.toLowerCase().includes(searchVal);
        const matchWil = wilVal === "" || item.wilayah === wilVal;
        const matchApo = apoVal === "" || item.status_apo === apoVal;
        const matchShip = shipVal === "" || item.status_shipment === shipVal;
        return matchSearch && matchWil && matchApo && matchShip;
    });

    updateDashboard(filtered);
    renderTable(filtered);
}

function updateDashboard(data) {
    document.getElementById('stat-total').innerText = data.length;
    document.getElementById('stat-new').innerText = data.filter(i => i.status_apo === 'NEW').length;
    document.getElementById('stat-proses').innerText = data.filter(i => i.status_apo === 'PROSES').length;
    document.getElementById('stat-packing').innerText = data.filter(i => i.status_apo === 'PACKING').length;
    const rev = data.reduce((acc, curr) => acc + curr.revenue, 0);
    document.getElementById('stat-revenue').innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(rev);
}

function renderTable(data) {
    const tbody = document.getElementById('main-table-body');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="p-10 text-center text-slate-400 uppercase font-bold italic">Data Tidak Ditemukan</td></tr>';
        return;
    }

    data.forEach(item => {
        // Logika Hitung SLA
        const hariIni = new Date();
        hariIni.setHours(0,0,0,0);
        
        let tglKirimText = "-";
        let slaText = "-";
        let slaClass = "text-slate-300";

        if (item.jadwal_kirim) {
            const jadwal = new Date(item.jadwal_kirim);
            jadwal.setHours(0,0,0,0);
            
            // Format tampilan Tanggal
            tglKirimText = jadwal.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            
            // Hitung Selisih
            const diffTime = jadwal - hariIni;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
                slaText = `${diffDays} Hr`;
                slaClass = "text-red-600 font-black italic";
            } else if (diffDays === 0) {
                slaText = "HARI INI";
                slaClass = "text-orange-500 font-black";
            } else {
                slaText = `+${diffDays} Hr`;
                slaClass = "text-emerald-600 font-bold";
            }
        }

        const apoBadge = item.status_apo === 'NEW' ? 'bg-red-50 text-red-600 border-red-100' : 
                         item.status_apo === 'PROSES' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100';

        tbody.insertAdjacentHTML('beforeend', `
            <tr class="hover:bg-slate-50 transition-colors text-[11px] border-b border-slate-50">
                <td class="px-6 py-4">
                    <div class="font-bold text-slate-800">${item.toko}</div>
                    <div class="text-[9px] text-blue-500 font-black uppercase tracking-tighter">${item.wilayah}</div>
                </td>
                <td class="px-6 py-4 font-semibold text-slate-600 uppercase">${item.nama}</td>
                <td class="px-6 py-4 text-center font-mono text-slate-400">${item.no_pengiriman}</td>
                <td class="px-6 py-4 text-center">
                    <span class="px-2 py-0.5 rounded border font-black text-[9px] ${apoBadge}">${item.status_apo}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center font-bold text-slate-400 text-[10px]">
                        <span class="w-1 h-1 rounded-full bg-slate-300 mr-2"></span>
                        ${item.status_shipment}
                    </div>
                </td>
                <td class="px-6 py-4 text-center font-bold text-slate-700">${tglKirimText}</td>
                <td class="px-6 py-4 text-center ${slaClass}">${slaText}</td>
            </tr>
        `);
    });
}

// Event Listeners
document.getElementById('search-input').addEventListener('input', applyFilters);
document.getElementById('filter-wilayah').addEventListener('change', applyFilters);
document.getElementById('filter-apo').addEventListener('change', applyFilters);
document.getElementById('filter-shipment').addEventListener('change', applyFilters);

fetchData();
