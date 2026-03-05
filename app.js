const API_URL = "https://script.google.com/macros/s/AKfycbylmkVBS7XlSLIJXt9YHtiBSWPycRYpQHqn5nUVxP92nG1-ejPFaf5W0fB4LdOzdAo/exec"; 
let masterData = [];

async function fetchData() {
    const updateLabel = document.getElementById('gsheet-update');
    const statusText = document.getElementById('status-text');
    try {
        const response = await fetch(API_URL);
        const resJson = await response.json();
        
        if (resJson.error) { alert(resJson.error); return; }

        updateLabel.innerText = `Data Update: ${resJson.dataUpdate}`;
        statusText.innerText = "Online";
        statusText.className = "text-xs font-bold text-green-600 uppercase italic";
        
        masterData = resJson.data;
        
        // Inisialisasi Dropdown (PENTING: Harus sama dengan key di JSON)
        setupDropdown('filter-wilayah', 'wilayah', 'Wilayah');
        setupDropdown('filter-am', 'am', 'AM');
        setupDropdown('filter-ac', 'ac', 'AC');
        setupDropdown('filter-apo', 'status_apo', 'APO');
        setupDropdown('filter-shipment', 'status_shipment', 'Shipment');

        applyFilters(); 
    } catch (e) {
        updateLabel.innerText = "Gagal Sinkron!";
        statusText.innerText = "Offline";
    }
}

function setupDropdown(id, key, label) {
    const dropdown = document.getElementById(id);
    if (!dropdown) return;
    const uniqueValues = [...new Set(masterData.map(item => item[key]))].filter(val => val && val !== "-").sort();
    dropdown.innerHTML = `<option value="">Semua ${label}</option>`;
    uniqueValues.forEach(val => {
        dropdown.insertAdjacentHTML('beforeend', `<option value="${val}">${val}</option>`);
    });
}

function applyFilters() {
    const sVal = document.getElementById('search-input').value.toLowerCase();
    const wVal = document.getElementById('filter-wilayah').value;
    const amVal = document.getElementById('filter-am').value;
    const acVal = document.getElementById('filter-ac').value;
    const aVal = document.getElementById('filter-apo').value;
    const shVal = document.getElementById('filter-shipment').value;

    const filtered = masterData.filter(item => {
        const mSearch = (item.nama || "").toLowerCase().includes(sVal) || 
                        (item.toko || "").toLowerCase().includes(sVal) || 
                        (item.no_pengiriman || "").toLowerCase().includes(sVal);
        const mWil = wVal === "" || item.wilayah === wVal;
        const mAm = amVal === "" || item.am === amVal;
        const mAc = acVal === "" || item.ac === acVal;
        const mApo = aVal === "" || item.status_apo === aVal;
        const mShip = shVal === "" || item.status_shipment === shVal;
        return mSearch && mWil && mAm && mAc && mApo && mShip;
    });

    updateDashboard(filtered);
    renderTable(filtered);
}

function renderTable(data) {
    const tbody = document.getElementById('main-table-body');
    tbody.innerHTML = '';
    const skrg = new Date(); skrg.setHours(0,0,0,0);

    data.forEach(item => {
        let slaStr = "-";
        let slaClass = "text-slate-400 font-bold";

        if (item.jadwal_kirim) {
            const jadwal = new Date(item.jadwal_kirim);
            if (!isNaN(jadwal.getTime())) {
                jadwal.setHours(0,0,0,0);
                const diff = Math.ceil((jadwal - skrg) / (1000 * 60 * 60 * 24));
                
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
                      item.status_apo === 'PROSES' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600';

        tbody.insertAdjacentHTML('beforeend', `
            <tr class="hover:bg-slate-50 text-[11px] border-b border-slate-100 transition-all">
                <td class="px-6 py-4 font-black text-slate-800">
                    ${item.toko}<br>
                    <span class="text-[9px] text-blue-500 font-black uppercase">${item.wilayah}</span>
                </td>
                <td class="px-6 py-4 font-semibold text-slate-600 uppercase">${item.nama}</td>
                <td class="px-6 py-4 text-center font-mono text-slate-400">${item.no_pengiriman}</td>
                <td class="px-6 py-4 text-center">
                    <span class="px-2 py-0.5 rounded border font-black text-[9px] ${badge}">${item.status_apo}</span>
                </td>
                <td class="px-6 py-4 font-bold text-slate-400 uppercase text-[10px]">${item.status_shipment}</td>
                <td class="px-6 py-4 text-center ${slaClass}">${slaStr}</td>
            </tr>
        `);
    });
}

function updateDashboard(data) {
    const total = data.length;
    const cNew = data.filter(i => i.status_apo === 'NEW').length;
    const cProses = data.filter(i => i.status_apo === 'PROSES').length;
    const cPacking = data.filter(i => i.status_apo === 'PACKING').length;

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-new').innerText = cNew;
    document.getElementById('stat-proses').innerText = cProses;
    document.getElementById('stat-packing').innerText = cPacking;

    const calc = (n) => total > 0 ? ((n/total)*100).toFixed(1) + '%' : '0%';
    document.getElementById('perc-new').innerText = calc(cNew);
    document.getElementById('perc-proses').innerText = calc(cProses);
    document.getElementById('perc-packing').innerText = calc(cPacking);
    
    const rev = data.reduce((acc, curr) => acc + curr.revenue, 0);
    document.getElementById('stat-revenue').innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(rev);
}

// Event Listeners
document.getElementById('search-input').addEventListener('input', applyFilters);
document.getElementById('filter-wilayah').addEventListener('change', applyFilters);
document.getElementById('filter-am').addEventListener('change', applyFilters);
document.getElementById('filter-ac').addEventListener('change', applyFilters);
document.getElementById('filter-apo').addEventListener('change', applyFilters);
document.getElementById('filter-shipment').addEventListener('change', applyFilters);

fetchData();
