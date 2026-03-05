const API_URL = "https://script.google.com/macros/s/AKfycbxDHC7ieUuz3R2etY0JbEHwiXF1rY7Y0U118bXfWTmFmkowcltGPWuqgDuUppYmNwa4/exec"; // Masukkan URL Web App Anda

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

        // Inisialisasi Pilihan Filter
        setupDropdown('filter-wilayah', 'wilayah', 'Wilayah');
        setupDropdown('filter-apo', 'status_apo', 'Status APO');
        setupDropdown('filter-shipment', 'status_shipment', 'Shipment');

        // Jalankan filter pertama kali
        applyFilters();
        
        document.getElementById('last-update').innerText = `Sinkron Terakhir: ${new Date().toLocaleTimeString()}`;
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-red-500 font-bold italic">Gagal: ${e.message}</td></tr>`;
    } finally {
        loading.classList.add('hidden');
        tbody.classList.remove('hidden');
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
    const searchVal = document.getElementById('search-input').value.toLowerCase();
    const wilayahVal = document.getElementById('filter-wilayah').value;
    const apoVal = document.getElementById('filter-apo').value;
    const shipmentVal = document.getElementById('filter-shipment').value;

    // Saring data berdasarkan input
    const filteredData = masterData.filter(item => {
        const matchSearch = item.nama.toLowerCase().includes(searchVal) || item.toko.toLowerCase().includes(searchVal) || item.no_pengiriman.toLowerCase().includes(searchVal);
        const matchWilayah = wilayahVal === "" || item.wilayah === wilayahVal;
        const matchApo = apoVal === "" || item.status_apo === apoVal;
        const matchShipment = shipmentVal === "" || item.status_shipment === shipmentVal;

        return matchSearch && matchWilayah && matchApo && matchShipment;
    });

    // PENTING: Update statistik dan tabel berdasarkan HASIL FILTER
    updateDashboard(filteredData);
    renderTable(filteredData);
}

function updateDashboard(data) {
    const total = data.length;
    const countNew = data.filter(i => i.status_apo === 'NEW').length;
    const countProses = data.filter(i => i.status_apo === 'PROSES').length;
    const countPacking = data.filter(i => i.status_apo === 'PACKING').length;
    const totalRev = data.reduce((acc, curr) => acc + curr.revenue, 0);

    // Update elemen HTML
    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-new').innerText = countNew;
    document.getElementById('stat-proses').innerText = countProses;
    document.getElementById('stat-packing').innerText = countPacking;
    document.getElementById('stat-revenue').innerText = new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', maximumFractionDigits: 0
    }).format(totalRev);
}

function renderTable(data) {
    const tbody = document.getElementById('main-table-body');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-slate-300 italic font-medium">Data tidak ditemukan.</td></tr>`;
        return;
    }

    data.forEach(item => {
        const apoClass = item.status_apo === 'NEW' ? 'bg-red-50 text-red-600 border-red-200' : 
                         item.status_apo === 'PROSES' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200';

        tbody.insertAdjacentHTML('beforeend', `
            <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100 text-sm">
                <td class="px-6 py-4">
                    <div class="font-bold text-slate-800">${item.toko}</div>
                    <div class="text-[9px] text-blue-500 font-black uppercase tracking-widest">${item.wilayah}</div>
                </td>
                <td class="px-6 py-4 font-semibold text-slate-600">${item.nama}</td>
                <td class="px-6 py-4 font-mono text-xs text-slate-400">${item.no_pengiriman}</td>
                <td class="px-6 py-4 text-center">
                    <span class="px-3 py-1 rounded-lg text-[10px] font-black border ${apoClass}">${item.status_apo}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center text-[11px] font-bold text-slate-500 uppercase">
                        <span class="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span>
                        ${item.status_shipment}
                    </div>
                </td>
            </tr>
        `);
    });
}

// Pasang Event Listeners agar filter langsung jalan saat diubah
document.getElementById('search-input').addEventListener('input', applyFilters);
document.getElementById('filter-wilayah').addEventListener('change', applyFilters);
document.getElementById('filter-apo').addEventListener('change', applyFilters);
document.getElementById('filter-shipment').addEventListener('change', applyFilters);

// Panggil pertama kali
fetchData();
