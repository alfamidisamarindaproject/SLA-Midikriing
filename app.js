const API_URL = "https://script.google.com/macros/s/AKfycbx0n0qpANHFbT-xkVE5sUssFwtz3XP6jQjlegMH1IMRWieM7wcM-dBv5HtnubG4Hkc2/exec"; 

let masterData = [];

async function fetchData() {
    const updateLabel = document.getElementById('gsheet-update');
    const tbody = document.getElementById('main-table-body');

    try {
        const response = await fetch(API_URL);
        const resJson = await response.json();
        
        if (resJson.error) throw new Error(resJson.error);

        updateLabel.innerText = `GSheet Update: ${resJson.lastEdit}`;
        masterData = resJson.data;
        
        // Memanggil fungsi setupDropdown yang didefinisikan di bawah
        setupDropdown('filter-wilayah', 'wilayah', 'Wilayah');
        setupDropdown('filter-apo', 'status_apo', 'APO');
        setupDropdown('filter-shipment', 'status_shipment', 'Shipment');

        applyFilters(); 
    } catch (e) {
        updateLabel.innerText = "Error Sinkronisasi!";
        tbody.innerHTML = `<tr><td colspan="7" class="p-10 text-center text-red-500 font-bold uppercase italic">Error: ${e.message}</td></tr>`;
    }
}

// SOLUSI: Fungsi pembuat dropdown otomatis
function setupDropdown(id, key, label) {
    const dropdown = document.getElementById(id);
    if (!dropdown) return;

    const uniqueValues = [...new Set(masterData.map(item => item[key]))].filter(Boolean).sort();
    dropdown.innerHTML = `<option value="">Semua ${label}</option>`;
    uniqueValues.forEach(val => {
        dropdown.insertAdjacentHTML('beforeend', `<option value="${val}">${val}</option>`);
    });
}

function applyFilters() {
    const sVal = document.getElementById('search-input').value.toLowerCase();
    const wVal = document.getElementById('filter-wilayah').value;
    const aVal = document.getElementById('filter-apo').value;
    const shVal = document.getElementById('filter-shipment').value;

    const filtered = masterData.filter(item => {
        const mSearch = item.nama.toLowerCase().includes(sVal) || 
                        item.toko.toLowerCase().includes(sVal) || 
                        item.no_pengiriman.toLowerCase().includes(sVal);
        const mWil = wVal === "" || item.wilayah === wVal;
        const mApo = aVal === "" || item.status_apo === aVal;
        const mShip = shVal === "" || item.status_shipment === shVal;
        return mSearch && mWil && mApo && mShip;
    });

    updateDashboard(filtered);
    renderTable(filtered);
}

function updateDashboard(data) {
    document.getElementById('stat-total').innerText = data.length;
    document.getElementById('stat-new').innerText = data.filter(i => i.status_apo === 'NEW').length;
    document.getElementById('stat-proses').innerText = data.filter(i => i.status_apo === 'PROSES').length;
    document.getElementById('stat-packing').innerText = data.filter(i => i.status_apo === 'PACKING').length;
    
    const rev = data.reduce((acc, curr) => acc + curr.revenue, 0);
    document.getElementById('stat-revenue').innerText = new Intl.NumberFormat('id-ID', { 
        style: 'currency', currency: 'IDR', maximumFractionDigits: 0 
    }).format(rev);
}

function renderTable(data) {
    const tbody = document.getElementById('main-table-body');
    tbody.innerHTML = '';
    const hariIni = new Date();
    hariIni.setHours(0,0,0,0);

    data.forEach(item => {
        let tglFormat = "-";
        let slaText = "-";
        let slaClass = "text-slate-400";

        if (item.jadwal_kirim) {
            const jadwal = new Date(item.jadwal_kirim);
            jadwal.setHours(0,0,0,0);
            tglFormat = jadwal.toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'});
            
            const diff = Math.ceil((jadwal - hariIni) / (1000 * 60 * 60 * 24));
            if (diff < 0) {
                slaText = `${diff} Hr`;
                slaClass = "text-red-600 font-black italic";
            } else if (diff === 0) {
                slaText = "HARI INI";
                slaClass = "text-orange-500 font-black";
            } else {
                slaText = `+${diff} Hr`;
                slaClass = "text-emerald-600 font-bold";
            }
        }

        const apoBadge = item.status_apo === 'NEW' ? 'bg-red-50 text-red-600' : 
                         item.status_apo === 'PROSES' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600';

        tbody.insertAdjacentHTML('beforeend', `
            <tr class="hover:bg-slate-50 transition-colors text-[11px] border-b border-slate-100">
                <td class="px-6 py-4 font-black text-slate-800">${item.toko}<br><span class="text-[9px] text-blue-500 italic font-black uppercase">${item.wilayah}</span></td>
                <td class="px-6 py-4 font-semibold text-slate-600 uppercase">${item.nama}</td>
                <td class="px-6 py-4 text-center font-mono text-slate-400 italic">${item.no_pengiriman}</td>
                <td class="px-6 py-4 text-center"><span class="px-2 py-0.5 rounded border font-black text-[9px] ${apoBadge}">${item.status_apo}</span></td>
                <td class="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] italic">${item.status_shipment}</td>
                <td class="px-6 py-4 text-center font-bold text-slate-700">${tglFormat}</td>
                <td class="px-6 py-4 text-center ${slaClass}">${slaText}</td>
            </tr>
        `);
    });
}

// Event Listeners
document.getElementById('search-input').addEventListener('input', applyFilters);
document.getElementById('filter-wilayah').addEventListener('change', applyFilters);
document.getElementById('filter-apo').addEventListener('change', applyFilters);
document.getElementById('filter-shipment').addEventListener('change', applyFilters);

// Jalankan fetch pertama kali
fetchData();
