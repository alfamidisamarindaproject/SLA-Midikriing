const API_URL = "https://script.google.com/macros/s/AKfycbx2K81E_U9sZKt0YDcPv8zdiJ06TdXIUgI-fBqU-JGtqWfCct3Tyn8oSUFZFzfvBF0X/exec"; // Masukkan URL Web App Anda

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
        
        // Isi pilihan dropdown secara otomatis dari data
        initDropdowns();
        
        // Jalankan fungsi filter (akan merender tabel & angka statistik pertama kali)
        applyFilters();
        
        document.getElementById('last-update').innerText = `Terakhir Sinkron: ${new Date().toLocaleTimeString()}`;
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-red-500 font-bold">Gagal memuat data: ${error.message}</td></tr>`;
    } finally {
        loading.classList.add('hidden');
        tbody.classList.remove('hidden');
    }
}

function initDropdowns() {
    const createOption = (id, key, label) => {
        const el = document.getElementById(id);
        const values = [...new Set(masterData.map(item => item[key]))].filter(Boolean).sort();
        el.innerHTML = `<option value="">Semua ${label}</option>`;
        values.forEach(v => el.insertAdjacentHTML('beforeend', `<option value="${v}">${v}</option>`));
    };

    createOption('filter-wilayah', 'wilayah', 'Wilayah');
    createOption('filter-apo', 'status_apo', 'Status APO');
    createOption('filter-shipment', 'status_shipment', 'Shipment');
}

function applyFilters() {
    const sSearch = document.getElementById('search-input').value.toLowerCase();
    const sWilayah = document.getElementById('filter-wilayah').value;
    const sApo = document.getElementById('filter-apo').value;
    const sShip = document.getElementById('filter-shipment').value;

    // Proses Penyaringan
    const filtered = masterData.filter(item => {
        const matchSearch = item.nama.toLowerCase().includes(sSearch) || 
                            item.toko.toLowerCase().includes(sSearch) || 
                            item.no_pengiriman.toLowerCase().includes(sSearch);
        const matchWilayah = sWilayah === "" || item.wilayah === sWilayah;
        const matchApo = sApo === "" || item.status_apo === sApo;
        const matchShip = sShip === "" || item.status_shipment === sShip;

        return matchSearch && matchWilayah && matchApo && matchShip;
    });

    renderTable(filtered);
    updateStats(filtered);
}

function updateStats(data) {
    const total = data.length;
    const proses = data.filter(i => ["PROSES", "PACKING"].includes(i.status_apo.toUpperCase())).length;
    const revenue = data.reduce((sum, i) => sum + i.revenue, 0);

    // Animasi angka sederhana
    document.getElementById('stat-total').innerText = total.toLocaleString('id-ID');
    document.getElementById('stat-proses').innerText = proses.toLocaleString('id-ID');
    document.getElementById('stat-revenue').innerText = new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', maximumFractionDigits: 0
    }).format(revenue);
}

function renderTable(data) {
    const tbody = document.getElementById('main-table-body');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-gray-400 italic">Data tidak ditemukan untuk filter ini.</td></tr>`;
        return;
    }

    data.forEach(item => {
        const apoColor = item.status_apo === 'NEW' ? 'bg-red-100 text-red-700' : 
                         ['PROSES', 'PACKING'].includes(item.status_apo) ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700';

        tbody.insertAdjacentHTML('beforeend', `
            <tr class="hover:bg-blue-50/30 transition-colors">
                <td class="p-5">
                    <div class="font-bold text-gray-900">${item.toko}</div>
                    <div class="text-[10px] text-blue-500 font-black uppercase tracking-widest">${item.wilayah}</div>
                </td>
                <td class="p-5 font-semibold text-gray-700">${item.nama}</td>
                <td class="p-5 font-mono text-xs text-gray-400">${item.no_pengiriman}</td>
                <td class="p-5 text-center">
                    <span class="px-3 py-1 rounded-lg text-[10px] font-black ${apoColor}">${item.status_apo}</span>
                </td>
                <td class="p-5">
                    <div class="flex items-center text-xs font-bold text-gray-600">
                        <span class="w-2 h-2 rounded-full bg-green-500 mr-2 shadow-sm"></span>
                        ${item.status_shipment}
                    </div>
                </td>
            </tr>
        `);
    });
}

// Tambahkan listener ke semua input filter
['search-input', 'filter-wilayah', 'filter-apo', 'filter-shipment'].forEach(id => {
    document.getElementById(id).addEventListener('input', applyFilters);
    document.getElementById(id).addEventListener('change', applyFilters);
});

// Jalankan saat pertama kali dibuka
fetchData();
