const API_URL = "https://script.google.com/macros/s/AKfycbyNwH-FsSlbZkBtZGtDGhquUd1RpnJSXhSKWYPA2Vyc2sLkF4YiT3pN-2a_AHXXYFxE/exec"; 
let masterData = [];

async function fetchData() {
    const updateLabel = document.getElementById('gsheet-update');
    const statusText = document.getElementById('status-text');
    const tbody = document.getElementById('main-table-body');

    try {
        const response = await fetch(API_URL);
        const resJson = await response.json();
        
        if (resJson.error) throw new Error(resJson.error);

        // Update Header & Status
        updateLabel.innerText = `Update: ${resJson.dataUpdate || 'Baru Saja'}`;
        statusText.innerText = "Online";
        statusText.className = "text-xs font-bold text-green-600 uppercase";
        
        masterData = resJson.data;
        
        // Inisialisasi Dropdown Filter
        setupDropdown('filter-wilayah', 'wilayah', 'Wilayah');
        setupDropdown('filter-apo', 'status_apo', 'APO');
        setupDropdown('filter-shipment', 'status_shipment', 'Shipment');

        // Jalankan Filter Pertama Kali (Menampilkan Dashboard & Tabel)
        applyFilters(); 
    } catch (e) {
        updateLabel.innerText = "Gagal Sinkron!";
        statusText.innerText = "Offline";
        statusText.className = "text-xs font-bold text-red-600 uppercase";
        tbody.innerHTML = `<tr><td colspan="6" class="p-10 text-center text-red-500 font-bold uppercase italic">Koneksi Error: Hubungi Administrator</td></tr>`;
        console.error(e);
    }
}

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
        const mSearch = (item.nama || "").toLowerCase().includes(sVal) || 
                        (item.toko || "").toLowerCase().includes(sVal) || 
                        (item.no_pengiriman || "").toLowerCase().includes(sVal);
        const mWil = wVal === "" || item.wilayah === wVal;
        const mApo = aVal === "" || item.status_apo === aVal;
        const mShip = shVal === "" || item.status_shipment === shVal;
        return mSearch && mWil && mApo && mShip;
    });

    // PENTING: Update Dashboard dulu baru Render Tabel
    updateDashboard(filtered);
    renderTable(filtered);
}

function updateDashboard(data) {
    const total = data.length;
    
    // Hitung berdasarkan status APO (Case Insensitive)
    const cNew = data.filter(i => String(i.status_apo).toUpperCase() === 'NEW').length;
    const cProses = data.filter(i => String(i.status_apo).toUpperCase() === 'PROSES').length;
    const cPacking = data.filter(i => String(i.status_apo).toUpperCase() === 'PACKING').length;

    // Update Angka di Card
    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-new').innerText = cNew;
    document.getElementById('stat-proses').innerText = cProses;
    document.getElementById('stat-packing').innerText = cPacking;

    // Hitung Persentase
    const calc = (n) => total > 0 ? ((n/total)*100).toFixed(1) + '%' : '0%';
    document.getElementById('perc-new').innerText = calc(cNew);
    document.getElementById('perc-proses').innerText = calc(cProses);
    document.getElementById('perc-packing').innerText = calc(cPacking);
    
    // Hitung Revenue
    const rev = data.reduce((acc, curr) => acc + (parseFloat(curr.revenue) || 0), 0);
    document.getElementById('stat-revenue').innerText = new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR', 
        maximumFractionDigits: 0 
    }).format(rev);
}

function renderTable(data) {
    const tbody = document.getElementById('main-table-body');
    tbody.innerHTML = '';
    const today = new Date();
    today.setHours(0,0,0,0);

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-10 text-center text-slate-400 font-bold uppercase italic">Data Tidak Ditemukan</td></tr>`;
        return;
    }

    data.forEach(item => {
        let slaStr = "-";
        let slaClass = "text-slate-400";

        if (item.jadwal_kirim) {
            const jadwal = new Date(item.jadwal_kirim);
            if (!isNaN(jadwal.getTime())) {
                jadwal.setHours(0,0,0,0);
                const diff = Math.ceil((jadwal - today) / (1000 * 60 * 60 * 24));
                
                if (diff < 0) {
                    slaStr = `${diff} Hr`;
                    slaClass = "text-red-600 font-black italic";
                } else if (diff === 0) {
                    slaStr = "HARI INI";
                    slaClass = "text-orange-500 font-black";
                } else {
                    slaStr = `+${diff} Hr`;
                    slaClass = "text-emerald-600 font-bold";
                }
            }
        }

        const badge = item.status_apo === 'NEW' ? 'bg-red-50 text-red-600' : 
                      item.status_apo === 'PROSES' ? 'bg-orange-50 text-orange-600' : 
                      'bg-emerald-50 text-emerald-600';

        tbody.insertAdjacentHTML('beforeend', `
            <tr class="hover:bg-slate-50 text-[11px] border-b border-slate-100 italic transition-all">
                <td class="px-6 py-4 font-black text-slate-800">
                    ${item.toko}<br>
                    <span class="text-[9px] text-blue-500 font-black uppercase tracking-tighter">${item.wilayah || 'LAINNYA'}</span>
                </td>
                <td class="px-6 py-4 font-semibold text-slate-600 uppercase">${item.nama || '-'}</td>
                <td class="px-6 py-4 text-center font-mono text-slate-400 italic">${item.no_pengiriman || '-'}</td>
                <td class="px-6 py-4 text-center">
                    <span class="px-2 py-0.5 rounded border font-black text-[9px] ${badge}">${item.status_apo || 'NEW'}</span>
                </td>
                <td class="px-6 py-4 font-bold text-slate-400 uppercase text-[9px] italic">${item.status_shipment || '-'}</td>
                <td class="px-6 py-4 text-center ${slaClass}">${slaStr}</td>
            </tr>
        `);
    });
}

// Listeners untuk Filter
document.getElementById('search-input').addEventListener('input', applyFilters);
document.getElementById('filter-wilayah').addEventListener('change', applyFilters);
document.getElementById('filter-apo').addEventListener('change', applyFilters);
document.getElementById('filter-shipment').addEventListener('change', applyFilters);

// Jalankan Fetch
fetchData();
