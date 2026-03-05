// 1. KONFIGURASI: Masukkan URL Web App dari Deploy Google Apps Script Anda di sini
const API_URL = "https://script.google.com/macros/s/AKfycbzQcYjz8AyYQJ5oyVDr6YvGaOlWzJhYqGaskUhu8gfcsyGDpOxy-lvn8XaFNUu9m6HM/exec";

let masterData = [];

async function fetchData() {
    toggleLoading(true);
    try {
        const response = await fetch(API_URL);
        masterData = await response.json();
        
        populateWilayahFilter(masterData);
        renderTable(masterData);
        updateStats(masterData);
        
        document.getElementById('last-update').innerText = `Terakhir update: ${new Date().toLocaleTimeString()}`;
    } catch (error) {
        alert("Gagal mengambil data. Pastikan URL API benar dan sudah di-deploy sebagai 'Anyone'.");
        console.error(error);
    } finally {
        toggleLoading(false);
    }
}

function renderTable(data) {
    const tbody = document.getElementById('main-table-body');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-slate-400 italic">Tidak ada data pesanan belum terkirim.</td></tr>`;
        return;
    }

    data.forEach(item => {
        // Logika warna status
        const apoClass = item.status_apo === 'NEW' ? 'bg-red-100 text-red-700' : 
                         item.status_apo === 'PROSES' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700';

        const row = `
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
                <td class="p-4">
                    <div class="font-bold text-slate-900">${item.toko}</div>
                    <div class="text-xs text-slate-500 uppercase tracking-wider">${item.wilayah}</div>
                </td>
                <td class="p-4 font-medium">${item.nama}</td>
                <td class="p-4 text-sm font-mono text-slate-500">${item.no_pengiriman}</td>
                <td class="p-4 text-center">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${apoClass}">${item.status_apo}</span>
                </td>
                <td class="p-4 text-sm">
                    <div class="flex items-center">
                        <span class="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                        ${item.status_shipment}
                    </div>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

function updateStats(data) {
    const total = data.length;
    const proses = data.filter(i => i.status_apo === 'PROSES').length;
    const dikirim = data.filter(i => i.status_shipment.includes('DI KIRIM')).length;
    const revenue = data.reduce((sum, item) => sum + (Number(item.revenue) || 0), 0);

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-proses').innerText = proses;
    document.getElementById('stat-dikirim').innerText = dikirim;
    document.getElementById('stat-revenue').innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(revenue);
}

function populateWilayahFilter(data) {
    const select = document.getElementById('filter-wilayah');
    const wilayahs = [...new Set(data.map(i => i.wilayah))].sort();
    
    // Simpan nilai lama agar tidak reset saat refresh
    const currentVal = select.value;
    select.innerHTML = '<option value="">Semua Wilayah</option>';
    wilayahs.forEach(w => {
        select.insertAdjacentHTML('beforeend', `<option value="${w}">${w}</option>`);
    });
    select.value = currentVal;
}

// Fitur Pencarian & Filter
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

function toggleLoading(isLoading) {
    document.getElementById('loading-state').classList.toggle('hidden', !isLoading);
    document.getElementById('main-table-body').classList.toggle('hidden', isLoading);
}

// Event Listeners
document.getElementById('search-input').addEventListener('input', filterData);
document.getElementById('filter-wilayah').addEventListener('change', filterData);

// Inisialisasi awal
fetchData();

// Auto refresh setiap 5 menit
setInterval(fetchData, 300000);
