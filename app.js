const API_URL = "https://script.google.com/macros/s/AKfycby98QrROx7vZ4wgb8nHqdGPyy07ROfSdt2vfMwRhi447_bbDlXlgldTUwmAORSCglhv/exec"; 
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
        updateLabel.innerText = `Sync: ${resJson.dataUpdate || 'Baru Saja'}`;
        statusText.innerText = "Online";
        statusText.className = "text-xs font-extrabold text-green-500 uppercase italic";
        
        masterData = resJson.data;
        
        // Inisialisasi Dropdown Filter
        setupDropdown('filter-wilayah', 'wilayah', 'Wilayah');
        setupDropdown('filter-apo', 'status_apo', 'APO');
        setupDropdown('filter-shipment', 'status_shipment', 'Shipment');

        // Jalankan Filter Pertama Kali
        applyFilters(); 
    } catch (e) {
        updateLabel.innerText = "Gagal Sinkron!";
        statusText.innerText = "Offline";
        statusText.className = "text-xs font-extrabold text-red-500 uppercase italic";
        tbody.innerHTML = `<tr><td colspan="6" class="p-20 text-center text-red-500 font-bold uppercase italic tracking-widest text-xs">Koneksi Error: Hubungi Administrator</td></tr>`;
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

    updateDashboard(filtered);
    renderTable(filtered);
}

function updateDashboard(data) {
    const total = data.length;
    
    // Hitung status (Case Insensitive)
    const cNew = data.filter(i => String(i.status_apo).toUpperCase() === 'NEW').length;
    const cProses = data.filter(i => String(i.status_apo).toUpperCase() === 'PROSES').length;
    const cPacking = data.filter(i => String(i.status_apo).toUpperCase() === 'PACKING').length;

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-new').innerText = cNew;
    document.getElementById('stat-proses').innerText = cProses;
    document.getElementById('stat-packing').innerText = cPacking;

    const calc = (n) => total > 0 ? ((n/total)*100).toFixed(1) + '%' : '0%';
    document.getElementById('perc-new').innerText = calc(cNew);
    document.getElementById('perc-proses').innerText = calc(cProses);
    document.getElementById('perc-packing').innerText = calc(cPacking);
    
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
        tbody.innerHTML = `<tr><td colspan="6" class="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Data Tidak Ditemukan</td></tr>`;
        return;
    }

    data.forEach(item => {
        let slaStr = "-";
        let slaClass = "text-slate-400";

        // Logika SLA
        if (item.jadwal_kirim) {
            const jadwal = new Date(item.jadwal_kirim);
            if (!isNaN(jadwal.getTime())) {
                jadwal.setHours(0,0,0,0);
                const diff = Math.ceil((jadwal - today) / (1000 * 60 * 60 * 24));
                
                if (diff < 0) {
                    slaStr = `${diff} HR`;
                    slaClass = "text-red-600 font-black italic underline decoration-red-200 decoration-2";
                } else if (diff === 0) {
                    slaStr = "HARI INI";
                    slaClass = "text-orange-500 font-black bg-orange-50 px-2 py-1 rounded-md";
                } else {
                    slaStr = `+${diff} HR`;
                    slaClass = "text-emerald-600 font-extrabold";
                }
            }
        }

        // Color Badge Status APO
        const badge = item.status_apo === 'NEW' ? 'bg-red-50 text-red-600 border-red-100' : 
                      item.status_apo === 'PROSES' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                      'bg-emerald-50 text-emerald-600 border-emerald-100';

        // Template baris dengan atribut data-label untuk responsif mobile
        tbody.insertAdjacentHTML('beforeend', `
            <tr class="transition-all duration-200">
                <td data-label="Toko & Wilayah" class="px-8 py-5">
                    <div class="flex flex-col">
                        <span class="font-extrabold text-slate-800 text-sm leading-tight">${item.toko}</span>
                        <span class="text-[9px] text-blue-600 font-black uppercase tracking-widest mt-0.5">${item.wilayah || 'LAINNYA'}</span>
                    </div>
                </td>
                <td data-label="Penerima" class="px-8 py-5">
                    <span class="font-bold text-slate-600 uppercase text-[11px] tracking-tight">${item.nama || '-'}</span>
                </td>
                <td data-label="No Pengiriman" class="px-8 py-5 text-center">
                    <span class="font-mono text-slate-400 font-bold text-[10px] bg-slate-50 px-2 py-1 rounded border border-slate-100">${item.no_pengiriman || '-'}</span>
                </td>
                <td data-label="Status APO" class="px-8 py-5 text-center">
                    <span class="px-3 py-1 rounded-full border text-[9px] font-black tracking-widest ${badge}">
                        ${item.status_apo || 'NEW'}
                    </span>
                </td>
                <td data-label="Status Shipment" class="px-8 py-5">
                    <span class="text-[10px] font-bold text-slate-400 uppercase italic leading-tight">${item.status_shipment || '-'}</span>
                </td>
                <td data-label="SLA" class="px-8 py-5 text-center">
                    <span class="${slaClass} text-xs tracking-tighter">${slaStr}</span>
                </td>
            </tr>
        `);
    });
}

// Listeners
document.getElementById('search-input').addEventListener('input', applyFilters);
document.getElementById('filter-wilayah').addEventListener('change', applyFilters);
document.getElementById('filter-apo').addEventListener('change', applyFilters);
document.getElementById('filter-shipment').addEventListener('change', applyFilters);

// Start
fetchData();
