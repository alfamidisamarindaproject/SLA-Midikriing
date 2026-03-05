const API_URL = "https://script.google.com/macros/s/AKfycbzwhfe9nVCiATs2lqSeiT5ohj2Ac65TKdySUycVMr_3zveuvcqvMdmAjuJKvSrNIbB9/exec"; // Masukkan URL Web App Anda

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

        // Isi Dropdown secara dinamis
        fillDropdown('filter-wilayah', 'wilayah', 'Semua Wilayah');
        fillDropdown('filter-apo', 'status_apo', 'Semua APO');
        fillDropdown('filter-shipment', 'status_shipment', 'Semua Shipment');

        // Jalankan filter & kalkulasi stats pertama kali
        applyAllFilters();
        
        document.getElementById('last-update').innerText = `Sinkron terakhir: ${new Date().toLocaleTimeString()}`;
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-red-500 font-bold italic">Koneksi Gagal: ${e.message}</td></tr>`;
    } finally {
        loading.classList.add('hidden');
        tbody.classList.remove('hidden');
    }
}

function fillDropdown(id, key, label) {
    const dropdown = document.getElementById(id);
    const uniqueValues = [...new Set(masterData.map(item => item[key]))].filter(Boolean).sort();
    
    dropdown.innerHTML = `<option value="">${label}</option>`;
    uniqueValues.forEach(val => {
        dropdown.insertAdjacentHTML('beforeend', `<option value="${val}">${val}</option>`);
    });
}

function applyAllFilters() {
    const searchVal = document.getElementById('search-input').value.toLowerCase();
    const wilayahVal = document.getElementById('filter-wilayah').value;
    const apoVal = document.getElementById('filter-apo').value;
    const shipmentVal = document.getElementById('filter-shipment').value;

    // Filter Data
    const filteredResults = masterData.filter(item => {
        const matchSearch = item.nama.toLowerCase().includes(searchVal) || item.toko.toLowerCase().includes(searchVal) || item.no_pengiriman.toLowerCase().includes(searchVal);
        const matchWilayah = wilayahVal === "" || item.wilayah === wilayahVal;
        const matchApo = apoVal === "" || item.status_apo === apoVal;
        const matchShipment = shipmentVal === "" || item.status_shipment === shipmentVal;

        return matchSearch && matchWilayah && matchApo && matchShipment;
    });

    // Render Tabel & Update Stats
    renderTable(filteredResults);
    calculateStats(filteredResults);
}

function calculateStats(data) {
    const total = data.length;
    const countNew = data.filter(i => i.status_apo === 'NEW').length;
    const countProses = data.filter(i => i.status_apo === 'PROSES').length;
    const countPacking = data.filter(i => i.status_apo === 'PACKING').length;
    const totalRevenue = data.reduce((acc, curr) => acc + curr.revenue, 0);

    // Update Tampilan Angka (Dinamis Berdasarkan Filter)
    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-new').innerText = countNew;
    document.getElementById('stat-proses').innerText = countProses;
    document.getElementById('stat-packing').innerText = countPacking;
    document.getElementById('stat-revenue').innerText = new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', maximumFractionDigits: 0
    }).format(totalRevenue);
}

function renderTable(data) {
    const tbody = document.getElementById('main-table-body');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-gray-300 italic font-medium">Data tidak ditemukan untuk kriteria ini.</td></tr>`;
        return;
    }

    data.forEach(item => {
        const apoClass = item.status_apo === 'NEW' ? 'bg-red-50 text-red-600 border-red-200' : 
                         item.status_apo === 'PROSES' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200';

        tbody.insertAdjacentHTML('beforeend', `
            <tr class="hover:bg-gray-50/80 transition-all border-b border-gray-50">
                <td class="px-6 py-4">
                    <div class="font-bold text-gray-800">${item.toko}</div>
                    <div class="text-[9px] text-blue-500 font-black uppercase tracking-widest">${item.wilayah}</div>
                </td>
                <td class="px-6 py-4 font-semibold text-gray-600">${item.nama}</td>
                <td class="px-6 py-4 font-mono text-xs text-gray-400 uppercase tracking-tighter">${item.no_pengiriman}</td>
                <td class="px-6 py-4 text-center">
                    <span class="px-3 py-1 rounded-full text-[10px] font-black border ${apoClass}">${item.status_apo}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center text-[11px] font-bold text-gray-500">
                        <span class="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 shadow-sm"></span>
                        ${item.status_shipment}
                    </div>
                </td>
            </tr>
        `);
    });
}

// Tambahkan Listener ke semua input (untuk filter real-time)
['search-input', 'filter-wilayah', 'filter-apo', 'filter-shipment'].forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('input', applyAllFilters);
    el.addEventListener('change', applyAllFilters);
});

// Jalankan saat load pertama
fetchData();
