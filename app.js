// GANTI DENGAN URL WEB APP ANDA
const API_URL = "https://script.google.com/macros/s/AKfycbxrpSk9dCtJig1murEosB3soLnrNa35Do0kgX6CIhiXyJVqUSRrjLiCYz6H4EvHDnft/exec"; 

let masterData = [];

async function fetchData() {
    const tbody = document.getElementById('main-table-body');
    const loading = document.getElementById('loading-state');
    const gsheetText = document.getElementById('gsheet-update');

    try {
        const response = await fetch(API_URL);
        const resJson = await response.json();
        
        // Update informasi kapan GSheet terakhir diedit
        if (resJson.lastEdit) {
            gsheetText.innerText = `Update GSheet: ${resJson.lastEdit}`;
        }

        masterData = resJson.data;
        
        // Setup Filter Dropdown secara otomatis
        setupDropdown('filter-wilayah', 'wilayah', 'Wilayah');
        setupDropdown('filter-apo', 'status_apo', 'APO');
        setupDropdown('filter-shipment', 'status_shipment', 'Shipment');

        loading.classList.add('hidden');
        applyFilters();
    } catch (e) {
        gsheetText.innerText = "Koneksi Terputus!";
        tbody.innerHTML = `<tr><td colspan="7" class="p-10 text-center text-red-500 font-bold italic uppercase">Gagal memuat data. Periksa URL Deployment Apps Script Anda.</td></tr>`;
        loading.classList.add('hidden');
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
    const wilVal = document.getElementById('filter-wilayah').value;
    const apoVal = document.getElementById('filter-apo').value;
    const shipVal = document.getElementById('filter-shipment').value;

    const filtered = masterData.filter(item => {
        const matchSearch = item.nama.toLowerCase().includes(searchVal) || 
                            item.toko.toLowerCase().includes(searchVal) || 
                            item.no_pengiriman.toLowerCase().includes(searchVal);
        const matchWil = wilVal === "" || item.wilayah === wilVal;
        const matchApo = apoVal === "" || item.status_apo === apoVal;
        const matchShip = shipVal === "" || item.status_shipment === shipVal;
        return matchSearch && matchWil && matchApo && matchShip;
    });

    updateDashboard(filtered);
    renderTable(filtered);
}

function updateDashboard(data) {
    document.getElementById('stat-total').innerText = data.length;
    document.getElementById('stat-new').innerText = data.filter(i => i.status_apo === 'NEW').length;
    
    const rev = data.reduce((acc, curr) => acc + curr.revenue, 0);
    document.getElementById('stat-revenue').innerText = new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR', 
        maximumFractionDigits: 0 
    }).format(rev);
}

function renderTable(data) {
    const tbody = document.getElementById('main-table-body');
    tbody.innerHTML = '';

    const hariIni = new Date();
    hariIni.setHours(0,0,0,0);

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="p-10 text-center text-slate-400 uppercase italic font-bold">Data tidak ditemukan</td></tr>';
        return;
    }

    data.forEach(item => {
        let tglFormat = "-";
        let slaText = "-";
        let slaColor = "text-slate-400";

        if (item.jadwal_kirim) {
            const jadwal = new Date(item.jadwal_kirim);
            jadwal.setHours(0,0,0,0);
            
            // Format Tampilan: 25 Mar 2026
            tglFormat = jadwal.toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'});
            
            // Hitung SLA
            const diffTime = jadwal - hariIni;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
                slaText = `${diffDays} Hari`;
                slaColor = "text-red-600 font-black italic";
            } else if (diffDays === 0) {
                slaText = "HARI INI";
                slaColor = "text-orange-500 font-black";
            } else {
                slaText = `+${diffDays} Hari`;
                slaColor = "text-emerald-600 font-bold";
            }
        }

        const apoBadge = item.status_apo === 'NEW' ? 'bg-red-50 text-red-600 border-red-200' : 
                         item.status_apo === 'PROSES' ? 'bg-orange-50 text-orange-600 border-orange-200' : 
                         'bg-emerald-50 text-emerald-600 border-emerald-200';

        // URUTAN ROW: Toko/Wilayah, Penerima, No Pengiriman, Status APO, Shipment, Jadwal Kirim, SLA
        tbody.insertAdjacentHTML('beforeend', `
            <tr class="hover:bg-slate-50 transition-colors text-[11px] border-b border-slate-100">
                <td class="px-6 py-4">
                    <div class="font-black text-slate-800">${item.toko}</div>
                    <div class="text-[9px] text-blue-500 font-black uppercase italic">${item.wilayah}</div>
                </td>
                <td class="px-6 py-4 font-semibold text-slate-600 uppercase">${item.nama}</td>
                <td class="px-6 py-4 font-mono text-slate-400 text-center">${item.no_pengiriman}</td>
                <td class="px-6 py-4 text-center">
                    <span class="px-2 py-0.5 rounded border font-black text-[9px] ${apoBadge}">${item.status_apo}</span>
                </td>
                <td class="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] italic">
                    ${item.status_shipment}
                </td>
                <td class="px-6 py-4 text-center font-bold text-slate-700">${tglFormat}</td>
                <td class="px-6 py-4 text-center ${slaColor}">${slaText}</td>
            </tr>
        `);
    });
}

// Event Listeners
document.getElementById('search-input').addEventListener('input', applyFilters);
document.getElementById('filter-wilayah').addEventListener('change', applyFilters);
document.getElementById('filter-apo').addEventListener('change', applyFilters);
document.getElementById('filter-shipment').addEventListener('change', applyFilters);

// Jalankan Fetch pertama kali
fetchData();
