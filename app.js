// GANTI DENGAN URL WEB APP HASIL DEPLOY TERBARU ANDA
const API_URL = "https://script.google.com/macros/s/AKfycbzmZgWuC1BEk2C57JIrFC_0aAtly8D93NHf-sN5mXYr5LjSDCHmCItwzUWOTX1YB87e/exec";

let masterData = [];

// Fungsi untuk mengambil data (Hanya berjalan saat dipanggil/klik tombol)
async function fetchData() {
    const tbody = document.getElementById('main-table-body');
    const loading = document.getElementById('loading-state');
    
    // Tampilkan loading, sembunyikan tabel
    loading.classList.remove('hidden');
    tbody.classList.add('hidden');

    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);

        masterData = data;
        
        populateWilayahFilter(masterData);
        updateStats(masterData);
        renderTable(masterData);
        
        // Update keterangan waktu terakhir sinkron
        document.getElementById('last-update').innerText = `Update Terakhir: ${new Date().toLocaleTimeString()} (Manual)`;
    } catch (error) {
        console.error("Gagal load data:", error);
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-red-500 font-bold">Data Gagal Dimuat: ${error.message}</td></tr>`;
    } finally {
        loading.classList.add('hidden');
        tbody.classList.remove('hidden');
    }
}

function renderTable(data) {
    const tbody = document.getElementById('main-table-body');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-slate-400 font-medium italic">Tidak ada antrean pesanan yang ditemukan.</td></tr>`;
        return;
    }

    data.forEach(item => {
        const apoClass = item.status_apo === 'NEW' ? 'bg-red-100 text-red-700' : 
                         (item.status_apo === 'PROSES' || item.status_apo === 'PACKING') ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700';

        tbody.insertAdjacentHTML('beforeend', `
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition text-sm">
                <td class="p-4">
                    <div class="font-bold text-slate-900">${item.toko}</div>
                    <div class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">${item.wilayah}</div>
                </td>
                <td class="p-4 font-medium">${item.nama}</td>
                <td class="p-4 text-xs font-mono text-slate-500">${item.no_pengiriman}</td>
                <td class="p-4 text-center">
                    <span class="px-2 py-1 rounded-full text-[10px] font-bold ${apoClass}">${item.status_apo}</span>
                </td>
                <td class="p-4">
                    <div class="flex items-center text-xs font-medium text-slate-700">
                        <span class="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
                        ${item.status_shipment}
                    </div>
                </td>
            </tr>
        `);
    });
}

function updateStats(data) {
    const total = data.length;
    const proses = data.filter(i => i.status_apo === 'PROSES' || i.status_apo === 'PACKING').length;
    const revenue = data.reduce((sum, item) => sum + item.revenue, 0);

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-proses').innerText = proses;
    document.getElementById('stat-revenue').innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(revenue);
}

function populateWilayahFilter(data) {
    const select = document.getElementById('filter-wilayah');
    const currentVal = select.value;
    const wilayahs = [...new Set(data.map(i => i.wilayah))].filter(Boolean).sort();
    
    select.innerHTML = '<option value="">Semua Wilayah</option>';
    wilayahs.forEach(w => {
        select.insertAdjacentHTML('beforeend', `<option value="${w}">${w}</option>`);
    });
    select.value = currentVal;
}

function filterData() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const wilayahTerm = document.getElementById('filter-wilayah').value;

    const filtered = masterData.filter(item => {
        const matchesSearch = item.nama.toLowerCase().includes(searchTerm) || 
                              item.toko.toLowerCase().includes(searchTerm) ||
                              item.no_pengiriman.toLowerCase().includes(searchTerm);
        const matchesWilayah = wilayahTerm === "" || item.wilayah === wilayahTerm;
        return matchesSearch && matchesWilayah;
    });
    renderTable(filtered);
}

// Event Listeners
document.getElementById('search-input').addEventListener('input', filterData);
document.getElementById('filter-wilayah').addEventListener('change', filterData);

// Ambil data pertama kali saat halaman dibuka
fetchData();

// AUTO REFRESH DIHAPUS
