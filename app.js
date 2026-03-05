// GANTI DENGAN URL WEB APP ANDA
const API_URL = "https://script.google.com/macros/s/AKfycbyodqjlUtAxHpIUi5S9sw5G8dc_kvLqnkJ7TlSUgHJDOEBashqQuxslfklPpaTdyiBG/exec";

let masterData = [];

async function fetchData() {
    const tbody = document.getElementById('main-table-body');
    const loading = document.getElementById('loading-state');
    
    loading.classList.remove('hidden');
    tbody.classList.add('hidden');

    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        if (data.error) {
            alert("Error: " + data.error);
            return;
        }

        masterData = data;
        
        populateWilayahFilter(masterData);
        updateStats(masterData);
        renderTable(masterData);
        
        document.getElementById('last-update').innerText = `Terakhir update: ${new Date().toLocaleTimeString()}`;
    } catch (error) {
        console.error("Gagal load data:", error);
        tbody.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-red-500">Gagal mengambil data dari Google Sheets. Periksa koneksi atau URL API.</td></tr>`;
    } finally {
        loading.classList.add('hidden');
        tbody.classList.remove('hidden');
    }
}

function renderTable(data) {
    const tbody = document.getElementById('main-table-body');
    tbody.innerHTML = '';

    data.forEach(item => {
        const apoClass = item.status_apo === 'NEW' ? 'bg-red-100 text-red-700' : 
                         item.status_apo === 'PROSES' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700';

        const row = `
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition text-sm">
                <td class="p-4">
                    <div class="font-bold text-slate-900">${item.toko}</div>
                    <div class="text-xs text-slate-500 uppercase">${item.wilayah}</div>
                </td>
                <td class="p-4 font-medium">${item.nama}</td>
                <td class="p-4 text-xs font-mono text-slate-500">${item.no_pengiriman}</td>
                <td class="p-4 text-center">
                    <span class="px-2 py-1 rounded-full text-[10px] font-bold ${apoClass}">${item.status_apo}</span>
                </td>
                <td class="p-4">
                    <div class="flex items-center text-xs">
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
    const proses = data.filter(i => i.status_apo === 'PROSES' || i.status_apo === 'PACKING').length;
    const revenue = data.reduce((sum, item) => sum + item.revenue, 0);

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-proses').innerText = proses;
    document.getElementById('stat-revenue').innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(revenue);
}

function populateWilayahFilter(data) {
    const select = document.getElementById('filter-wilayah');
    const currentVal = select.value;
    const wilayahs = [...new Set(data.map(i => i.wilayah))].sort();
    
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

document.getElementById('search-input').addEventListener('input', filterData);
document.getElementById('filter-wilayah').addEventListener('change', filterData);

fetchData();
