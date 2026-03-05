// GANTI DENGAN URL WEB APP ANDA
const API_URL = "https://script.google.com/macros/s/AKfycbz6lB6_X6ZDr3LfjNxBBfDiDepoP1-hc3dKcQ5YdW3-JtGXJrrl9WVI8XE88WuT7rA/exec"; 

let masterData = [];

async function fetchData() {
    const tableBody = document.getElementById('main-table-body');
    const updateLabel = document.getElementById('gsheet-update');

    try {
        const response = await fetch(API_URL);
        const result = await response.json();
        
        if (result.error) {
            tableBody.innerHTML = `<tr><td colspan="6" class="p-10 text-center text-red-500 font-bold uppercase italic">Error API: ${result.error}</td></tr>`;
            return;
        }

        masterData = result.data;
        updateLabel.innerText = `Update: ${result.dataUpdate || 'Just Now'}`;
        
        // Inisialisasi Filter Dropdown
        setupDropdown('filter-wilayah', 'wilayah', 'Wilayah');
        setupDropdown('filter-apo', 'status_apo', 'APO');
        setupDropdown('filter-shipment', 'status_shipment', 'Shipment');

        // Tampilkan Data
        applyFilters(); 

    } catch (e) {
        tableBody.innerHTML = `<tr><td colspan="6" class="p-10 text-center text-red-500 font-bold uppercase italic">Gagal menyambung ke server. Periksa URL API Anda.</td></tr>`;
        console.error("Fetch Error:", e);
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
    const shipVal = document.getElementById('filter-shipment').value;

    const filtered = masterData.filter(item => {
        const matchSearch = (item.nama || "").toLowerCase().includes(searchVal) || 
                            (item.toko || "").toLowerCase().includes(searchVal) || 
                            (item.no_pengiriman || "").toLowerCase().includes(searchVal);
        const matchWilayah = wilayahVal === "" || item.wilayah === wilayahVal;
        const matchApo = apoVal === "" || item.status_apo === apoVal;
        const matchShip = shipVal === "" || item.status_shipment === shipVal;
        
        return matchSearch && matchWilayah && matchApo && matchShip;
    });

    renderTable(filtered);
}

function renderTable(data) {
    const tbody = document.getElementById('main-table-body');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-20 text-center text-slate-300 font-bold uppercase italic">Data Tidak Ditemukan</td></tr>`;
        return;
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    data.forEach(item => {
        // Logika Hitung SLA (Berdasarkan jadwal_kirim yang dikirim kode.gs)
        let slaStr = "-";
        let slaClass = "text-slate-400 font-bold";

        if (item.jadwal_kirim) {
            const jadwal = new Date(item.jadwal_kirim);
            if (!isNaN(jadwal.getTime())) {
                jadwal.setHours(0,0,0,0);
                const diffTime = jadwal - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays < 0) {
                    slaStr = `${diffDays} Hr`;
                    slaClass = "text-red-600 font-black italic";
                } else if (diffDays === 0) {
                    slaStr = "HARI INI";
                    slaClass = "text-orange-500 font-black";
                } else {
                    slaStr = `+${diffDays} Hr`;
                    slaClass = "text-emerald-600 font-bold";
                }
            }
        }

        // Penentuan Warna Badge APO
        const badgeColor = item.status_apo === 'NEW' ? 'bg-red-50 text-red-600 border-red-100' : 
                           item.status_apo === 'PROSES' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                           'bg-emerald-50 text-emerald-600 border-emerald-100';

        tbody.insertAdjacentHTML('beforeend', `
            <tr class="hover:bg-slate-50 transition-all border-b border-slate-100">
                <td class="px-6 py-4 font-black text-slate-800">
                    ${item.toko}<br>
                    <span class="text-[9px] text-blue-500 font-black uppercase tracking-tighter">${item.wilayah || 'LAINNYA'}</span>
                </td>
                <td class="px-6 py-4 font-semibold text-slate-600 uppercase">${item.nama}</td>
                <td class="px-6 py-4 text-center font-mono text-slate-400">${item.no_pengiriman}</td>
                <td class="px-6 py-4 text-center">
                    <span class="px-2 py-0.5 rounded border font-black text-[9px] ${badgeColor}">${item.status_apo}</span>
                </td>
                <td class="px-6 py-4 font-bold text-slate-400 uppercase text-[9px]">${item.status_shipment}</td>
                <td class="px-6 py-4 text-center ${slaClass}">${slaStr}</td>
            </tr>
        `);
    });
}

// Event Listeners
document.getElementById('search-input').addEventListener('input', applyFilters);
document.getElementById('filter-wilayah').addEventListener('change', applyFilters);
document.getElementById('filter-apo').addEventListener('change', applyFilters);
document.getElementById('filter-shipment').addEventListener('change', applyFilters);

// Jalankan saat pertama kali buka
fetchData();
