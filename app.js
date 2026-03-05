const API_URL = "https://script.google.com/macros/s/AKfycbzmZgWuC1BEk2C57JIrFC_0aAtly8D93NHf-sN5mXYr5LjSDCHmCItwzUWOTX1YB87e/exec"; // Pastikan ini sudah diisi

let masterData = [];

async function fetchData() {
    const tbody = document.getElementById('main-table-body');
    const loading = document.getElementById('loading-state');
    
    loading.classList.remove('hidden');
    tbody.classList.add('hidden');

    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);

        masterData = data;
        
        // Inisialisasi Filter Dropdown secara dinamis dari data
        populateDropdown('filter-wilayah', 'wilayah');
        populateDropdown('filter-apo', 'status_apo');
        populateDropdown('filter-shipment', 'status_shipment');

        // Jalankan Filter Pertama Kali
        filterData();
        
        document.getElementById('last-update').innerText = `Update: ${new Date().toLocaleTimeString()} (Manual)`;
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-red-500">Gagal: ${error.message}</td></tr>`;
    } finally {
        loading.classList.add('hidden');
        tbody.classList.remove('hidden');
    }
}

// Fungsi Mengisi Dropdown secara otomatis dari data unik
function populateDropdown(elementId, key) {
    const select = document.getElementById(elementId);
    const uniqueValues = [...new Set(masterData.map(item => item[key]))].filter(Boolean).sort();
    
    const label = elementId.split('-')[1].toUpperCase();
    select.innerHTML = `<option value="">Semua ${label}</option>`;
    
    uniqueValues.forEach(val => {
        select.insertAdjacentHTML('beforeend', `<option value="${val}">${val}</option>`);
    });
}

function filterData() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const fWilayah = document.getElementById('filter-wilayah').value;
    const fApo = document.getElementById('filter-apo').value;
    const fShip = document.getElementById('filter-shipment').value;

    // Filter Data Utama
    const filtered = masterData.filter(item => {
        return (
            (item.nama.toLowerCase().includes(search) || item.toko.toLowerCase().includes(search) || item.no_pengiriman.toLowerCase().includes(search)) &&
            (fWilayah === "" || item.wilayah === fWilayah) &&
            (fApo === "" || item.status_apo === fApo) &&
            (fShip === "" || item.status_shipment === fShip)
        );
    });

    renderTable(filtered);
    updateStats(filtered); // Update angka statistik berdasarkan hasil filter
}

function updateStats(filteredData) {
    const total = filteredData.length;
    const proses = filteredData.filter(i => i.status_apo === 'PROSES' || i.status_apo === 'PACKING').length;
    const revenue = filteredData.reduce((sum, item) => sum + item.revenue, 0);

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-proses').innerText = proses;
    document.getElementById('stat-revenue').innerText = new Intl.NumberFormat('id-ID', { 
        style: 'currency', currency: 'IDR', maximumFractionDigits: 0 
    }).format(revenue);
}

function renderTable(data) {
    const tbody = document.getElementById('main-table-body');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-slate-400">Data tidak ditemukan.</td></tr>`;
        return;
    }

    data.forEach(item => {
        const apoClass = item.status_apo === 'NEW' ? 'bg-red-100 text-red-700' : 
                         (item.status_apo === 'PROSES' || item.status_apo === 'PACKING') ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700';

        tbody.insertAdjacentHTML('beforeend', `
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition text-sm">
                <td class="p-4">
                    <div class="font-bold text-slate-900">${item.toko}</div>
                    <div class="text-[10px] text-slate-400 uppercase font-bold">${item.wilayah}</div>
                </td>
                <td class="p-4 font-medium">${item.nama}</td>
                <td class="p-4 text-xs font-mono text-slate-500">${item.no_pengiriman}</td>
                <td class="p-4 text-center">
                    <span class="px-2 py-1 rounded-full text-[10px] font-bold ${apoClass}">${item.status_apo}</span>
                </td>
                <td class="p-4 text-xs">
                    <div class="flex items-center text-slate-600">
                        <span class="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                        ${item.status_shipment}
                    </div>
                </td>
            </tr>
        `);
    });
}

// Event Listeners
document.getElementById('search-input').addEventListener('input', filterData);
document.getElementById('filter-wilayah').addEventListener('change', filterData);
document.getElementById('filter-apo').addEventListener('change', filterData);
document.getElementById('filter-shipment').addEventListener('change', filterData);

fetchData();
