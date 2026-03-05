const API_URL = "https://script.google.com/macros/s/AKfycbzm5AyDavaq_xRZB5r9PS6yp8-UrdjUebU5vRid0C-GE_93FdmzySCnfvyLy3zSqv2i/exec"; // Masukkan URL Web App Anda

let masterData = [];

async function fetchData() {
    const tbody = document.getElementById('main-table-body');
    const loading = document.getElementById('loading-state');
    loading.classList.remove('hidden');
    tbody.classList.add('hidden');

    try {
        const response = await fetch(API_URL);
        masterData = await response.json();
        if (masterData.error) throw new Error(masterData.error);

        setupDropdown('filter-wilayah', 'wilayah', 'Wilayah');
        setupDropdown('filter-apo', 'status_apo', 'Status APO');
        setupDropdown('filter-shipment', 'status_shipment', 'Shipment');

        applyFilters();
        document.getElementById('last-update').innerText = `Sinkron Terakhir: ${new Date().toLocaleTimeString()}`;
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-10 text-center text-red-500 font-bold">Gagal: ${e.message}</td></tr>`;
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
    const searchVal = document.getElementById('search-input').value.toLowerCase();
    const wilayahVal = document.getElementById('filter-wilayah').value;
    const apoVal = document.getElementById('filter-apo').value;
    const shipmentVal = document.getElementById('filter-shipment').value;

    const filteredData = masterData.filter(item => {
        const matchSearch = item.nama.toLowerCase().includes(searchVal) || item.toko.toLowerCase().includes(searchVal) || item.no_pengiriman.toLowerCase().includes(searchVal);
        const matchWilayah = wilayahVal === "" || item.wilayah === wilayahVal;
        const matchApo = apoVal === "" || item.status_apo === apoVal;
        const matchShipment = shipmentVal === "" || item.status_shipment === shipmentVal;
        return matchSearch && matchWilayah && matchApo && matchShipment;
    });

    updateDashboard(filteredData);
    renderTable(filteredData);
}

function updateDashboard(data) {
    document.getElementById('stat-total').innerText = data.length;
    document.getElementById('stat-new').innerText = data.filter(i => i.status_apo === 'NEW').length;
    document.getElementById('stat-proses').innerText = data.filter(i => i.status_apo === 'PROSES').length;
    document.getElementById('stat-packing').innerText = data.filter(i => i.status_apo === 'PACKING').length;
    const totalRev = data.reduce((acc, curr) => acc + curr.revenue, 0);
    document.getElementById('stat-revenue').innerText = new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', maximumFractionDigits: 0
    }).format(totalRev);
}

// Fungsi Hitung Selisih Hari (SLA)
function calculateSLA(dateStr) {
    if (!dateStr) return { days: 0, class: 'text-gray-400' };
    
    const jadwal = new Date(dateStr);
    const hariIni = new Date();
    hariIni.setHours(0, 0, 0, 0);
    jadwal.setHours(0, 0, 0, 0);

    const diffTime = jadwal - hariIni;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { days: diffDays, class: 'text-red-600 font-black' }; // Terlambat
    if (diffDays === 0) return { days: 'Hari Ini', class: 'text-orange-500 font-bold' };
    return { days: `+${diffDays}`, class: 'text-emerald-600' }; // Masih ada waktu
}

function renderTable(data) {
    const tbody = document.getElementById('main-table-body');
    tbody.innerHTML = '';

    data.forEach(item => {
        const sla = calculateSLA(item.jadwal_kirim);
        const apoClass = item.status_apo === 'NEW' ? 'bg-red-50 text-red-600 border-red-200' : 
                         item.status_apo === 'PROSES' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200';

        const tglFormat = item.jadwal_kirim ? new Date(item.jadwal_kirim).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

        tbody.insertAdjacentHTML('beforeend', `
            <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100 text-xs">
                <td class="px-6 py-4">
                    <div class="font-bold text-slate-800">${item.toko}</div>
                    <div class="text-[9px] text-blue-500 font-black uppercase tracking-widest">${item.wilayah}</div>
                </td>
                <td class="px-6 py-4 font-semibold text-slate-600">${item.nama}</td>
                <td class="px-6 py-4 text-slate-500 font-medium">${tglFormat}</td>
                <td class="px-6 py-4 text-center ${sla.class}">${sla.days} Hari</td>
                <td class="px-6 py-4 text-center">
                    <span class="px-3 py-1 rounded-lg text-[10px] font-black border ${apoClass}">${item.status_apo}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center font-bold text-slate-500 uppercase">
                        <span class="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span>
                        ${item.status_shipment}
                    </div>
                </td>
            </tr>
        `);
    });
}

['search-input', 'filter-wilayah', 'filter-apo', 'filter-shipment'].forEach(id => {
    document.getElementById(id).addEventListener('input', applyFilters);
    document.getElementById(id).addEventListener('change', applyFilters);
});

fetchData();
