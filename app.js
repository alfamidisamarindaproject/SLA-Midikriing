const API_URL = "https://script.google.com/macros/s/AKfycbz6lB6_X6ZDr3LfjNxBBfDiDepoP1-hc3dKcQ5YdW3-JtGXJrrl9WVI8XE88WuT7rA/exec"; 
let masterData = [];

async function fetchData() {
    try {
        const response = await fetch(API_URL);
        const res = await response.json();
        
        if (res.error) throw new Error(res.error);

        masterData = res.data;
        document.getElementById('gsheet-update').innerText = `Update: ${res.dataUpdate}`;
        
        setupDropdown('filter-wilayah', 'wilayah', 'Wilayah');
        setupDropdown('filter-apo', 'status_apo', 'APO');
        setupDropdown('filter-shipment', 'status_shipment', 'Shipment');
        applyFilters(); 
    } catch (e) {
        document.getElementById('main-table-body').innerHTML = `<tr><td colspan="6" class="p-10 text-center text-red-500 font-bold uppercase italic">Gagal Memuat Data. Cek URL API.</td></tr>`;
    }
}

function setupDropdown(id, key, label) {
    const dropdown = document.getElementById(id);
    const values = [...new Set(masterData.map(item => item[key]))].filter(Boolean).sort();
    dropdown.innerHTML = `<option value="">Semua ${label}</option>`;
    values.forEach(v => dropdown.insertAdjacentHTML('beforeend', `<option value="${v}">${v}</option>`));
}

function applyFilters() {
    const s = document.getElementById('search-input').value.toLowerCase();
    const w = document.getElementById('filter-wilayah').value;
    const a = document.getElementById('filter-apo').value;
    const sh = document.getElementById('filter-shipment').value;

    const filtered = masterData.filter(i => {
        return (i.nama.toLowerCase().includes(s) || i.toko.toLowerCase().includes(s) || i.no_pengiriman.toLowerCase().includes(s)) &&
               (w === "" || i.wilayah === w) &&
               (a === "" || i.status_apo === a) &&
               (sh === "" || i.status_shipment === sh);
    });
    renderTable(filtered);
}

function renderTable(data) {
    const tbody = document.getElementById('main-table-body');
    tbody.innerHTML = '';
    const today = new Date(); today.setHours(0,0,0,0);

    data.forEach(item => {
        let slaStr = "-", slaClass = "text-slate-400";
        if (item.jadwal_kirim) {
            const jadwal = new Date(item.jadwal_kirim);
            jadwal.setHours(0,0,0,0);
            const diff = Math.ceil((jadwal - today) / (1000 * 60 * 60 * 24));
            
            if (diff < 0) { slaStr = `${diff} Hr`; slaClass = "text-red-600 font-black"; }
            else if (diff === 0) { slaStr = "HARI INI"; slaClass = "text-orange-500 font-black"; }
            else { slaStr = `+${diff} Hr`; slaClass = "text-emerald-600 font-bold"; }
        }

        const badge = item.status_apo === 'NEW' ? 'bg-red-50 text-red-600' : (item.status_apo === 'PROSES' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600');

        tbody.insertAdjacentHTML('beforeend', `
            <tr class="hover:bg-slate-50">
                <td class="px-6 py-4 font-black text-slate-800">${item.toko}<br><span class="text-[9px] text-blue-500 uppercase tracking-tighter font-black">${item.wilayah}</span></td>
                <td class="px-6 py-4 font-semibold text-slate-600 uppercase">${item.nama}</td>
                <td class="px-6 py-4 text-center font-mono text-slate-400">${item.no_pengiriman}</td>
                <td class="px-6 py-4 text-center"><span class="px-2 py-0.5 rounded border font-black text-[9px] ${badge}">${item.status_apo}</span></td>
                <td class="px-6 py-4 font-bold text-slate-400 uppercase text-[9px]">${item.status_shipment}</td>
                <td class="px-6 py-4 text-center ${slaClass}">${slaStr}</td>
            </tr>
        `);
    });
}

document.getElementById('search-input').addEventListener('input', applyFilters);
document.getElementById('filter-wilayah').addEventListener('change', applyFilters);
document.getElementById('filter-apo').addEventListener('change', applyFilters);
document.getElementById('filter-shipment').addEventListener('change', applyFilters);

fetchData();
