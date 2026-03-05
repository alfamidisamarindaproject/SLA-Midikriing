const API_URL = "https://script.google.com/macros/s/AKfycbz900YuDdYRQkJx2F29hiVPDPHVJjJZQid4T11Am7kBQPVOm3xs0ravbRnersx4s58l/exec"; 

let masterData = [];

async function fetchData() {
    const tbody = document.getElementById('main-table-body');
    const loading = document.getElementById('loading-state');
    loading.classList.remove('hidden');
    tbody.classList.add('hidden');

    try {
        const response = await fetch(API_URL);
        masterData = await response.json();
        
        setupDropdown('filter-wilayah', 'wilayah', 'Wilayah');
        setupDropdown('filter-apo', 'status_apo', 'APO');
        setupDropdown('filter-shipment', 'status_shipment', 'Shipment');

        applyFilters();
        document.getElementById('last-update').innerText = `Terakhir Update: ${new Date().toLocaleTimeString()}`;
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-10 text-center text-red-500">Error: ${e.message}</td></tr>`;
    } finally {
        loading.classList.add('hidden');
        tbody.classList.remove('hidden');
    }
}

function setupDropdown(id, key, label) {
    const dropdown = document.getElementById(id);
    const uniqueValues = [...new Set(masterData.map(item => item[key]))].filter(Boolean).sort();
    dropdown.innerHTML = `<option value="">Semua ${label}</option>`;
    uniqueValues.forEach(val => dropdown.insertAdjacentHTML('beforeend', `<option value="${val}">${val}</option>`));
}

function applyFilters() {
    const sSearch = document.getElementById('search-input').value.toLowerCase();
    const sWilayah = document.getElementById('filter-wilayah').value;
    const sApo = document.getElementById('filter-apo').value;
    const sShip = document.getElementById('filter-shipment').value;

    const filtered = masterData.filter(item => {
        const matchSearch = item.nama.toLowerCase().includes(sSearch) || item.toko.toLowerCase().includes(sSearch) || item.no_pengiriman.toLowerCase().includes(sSearch);
        const matchWilayah = sWilayah === "" || item.wilayah === sWilayah;
        const matchApo = sApo === "" || item.status_apo === sApo;
        const matchShip = sShip === "" || item.status_shipment === sShip;
        return matchSearch && matchWilayah && matchApo && matchShip;
    });

    updateDashboard(filtered);
    renderTable(filtered);
}

function updateDashboard(data) {
    document.getElementById('stat-total').innerText = data.length;
    document.getElementById('stat-new').innerText = data.filter(i => i.status_apo === 'NEW').length;
    document.getElementById('stat-proses').innerText = data.filter(i => i.status_apo === 'PROSES').length;
    document.getElementById('stat-packing').innerText = data.filter(i => i.status_apo === 'PACKING').length;
    const totalRev = data.reduce((acc, curr) => acc + curr.revenue, 0);
    document.getElementById('stat-revenue').innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalRev);
}

function renderTable(data) {
    const tbody = document.getElementById('main-table-body');
    tbody.innerHTML = '';

    data.forEach(item => {
        // Logika SLA
        const jadwal = item.jadwal_kirim ? new Date(item.jadwal_kirim) : null;
        const hariIni = new Date();
        hariIni.setHours(0,0,0,0);
        
        let slaText = "-";
        let slaClass = "text-slate-400";

        if(jadwal) {
            jadwal.setHours(0,0,0,0);
            const diffTime = jadwal - hariIni;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if(diffDays < 0) {
                slaText = `${diffDays} Hr`;
                slaClass = "text-red-600 font-black";
            } else if (diffDays === 0) {
                slaText = "Hari Ini";
                slaClass = "text-orange-500 font-bold";
            } else {
                slaText = `+${diffDays} Hr`;
                slaClass = "text-emerald-600";
            }
        }

        const tglKirim = jadwal ? jadwal.toLocaleDateString('id-ID', {day:'2-digit', month:'short'}) : "-";
        const apoBadge = item.status_apo === 'NEW' ? 'bg-red-50 text-red-600 border-red-100' : 
                         item.status_apo === 'PROSES' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100';

        // URUTAN ROW: Toko/Wilayah, Penerima, No Pengiriman, Status APO, Shipment, Jadwal, SLA
        tbody.insertAdjacentHTML('beforeend', `
            <tr class="hover:bg-slate-50 transition-colors border-b border-slate-50 text-xs">
                <td class="px-6 py-4">
                    <div class="font-bold text-slate-800">${item.toko}</div>
                    <div class="text-[9px] text-blue-500 font-black uppercase tracking-tighter">${item.wilayah}</div>
                </td>
                <td class="px-6 py-4 font-semibold text-slate-600">${item.nama}</td>
                <td class="px-6 py-4 font-mono text-[10px] text-slate-400">${item.no_pengiriman}</td>
                <td class="px-6 py-4 text-center">
                    <span class="px-2 py-0.5 rounded border font-black text-[9px] ${apoBadge}">${item.status_apo}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center font-bold text-slate-500 text-[10px]">
                        <span class="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></span>
                        ${item.status_shipment}
                    </div>
                </td>
                <td class="px-6 py-4 font-bold text-slate-600">${tglKirim}</td>
                <td class="px-6 py-4 text-center ${slaClass}">${slaText}</td>
            </tr>
        `);
    });
}

// Listeners
['search-input', 'filter-wilayah', 'filter-apo', 'filter-shipment'].forEach(id => {
    document.getElementById(id).addEventListener('input', applyFilters);
    document.getElementById(id).addEventListener('change', applyFilters);
});

fetchData();
