document.getElementById('processBtn').addEventListener('click', processUrls);

let dataCsv = [];
let strukturCsv = [];

function processUrls() {
    const dataUrl = document.getElementById('dataUrl').value.trim();
    const strukturUrl = document.getElementById('strukturUrl').value.trim();

    if (!dataUrl || !strukturUrl) {
        alert("Silakan masukkan kedua Link CSV (Data dan Struktur) terlebih dahulu.");
        return;
    }

    const loadingText = document.getElementById('loadingText');
    const processBtn = document.getElementById('processBtn');
    
    processBtn.disabled = true;
    loadingText.classList.remove('hidden');

    // Mengambil data CSV dari URL Sheet "Data"
    Papa.parse(dataUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            dataCsv = results.data;
            
            // Mengambil data CSV dari URL Sheet "Struktur"
            Papa.parse(strukturUrl, {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: function(resStruktur) {
                    strukturCsv = resStruktur.data;
                    
                    filterAndRenderData();
                    
                    processBtn.disabled = false;
                    loadingText.classList.add('hidden');
                },
                error: function(err) {
                    alert("Gagal mengambil data Struktur. Pastikan link sudah benar dan disetting 'Publish to the web' sebagai CSV.");
                    processBtn.disabled = false;
                    loadingText.classList.add('hidden');
                }
            });
        },
        error: function(err) {
            alert("Gagal mengambil Data. Pastikan link sudah benar dan disetting 'Publish to the web' sebagai CSV.");
            processBtn.disabled = false;
            loadingText.classList.add('hidden');
        }
    });
}

// Konversi string "DD/MM/YYYY HH:mm" ke Object Date
function parseDateString(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.trim().split(' ');
    const dateParts = parts[0].split('/');
    if (dateParts.length === 3) {
        return new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
    }
    return null;
}

function filterAndRenderData() {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(today.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);

    // Membuat Map untuk file struktur (menyimpan Wilayah, AC, dan AM)
    const strukturMap = {};
    strukturCsv.forEach(row => {
        if (row['KD TOKO']) {
            strukturMap[row['KD TOKO'].trim()] = {
                wilayah: row['WILAYAH'] || '-',
                ac: row['AC'] || '-',
                am: row['AM'] || '-'
            };
        }
    });

    // Filter Data (Belum diterima & 2 hari terakhir)
    const filteredData = dataCsv.filter(row => {
        const shipmentStatus = row['SHIPMENT STATUS'] ? row['SHIPMENT STATUS'].trim().toUpperCase() : '';
        const sendDateStr = row['SEND DATE TO STORE'] || row['JADWAL KIRIM'];
        
        const isNotDelivered = shipmentStatus !== 'SUDAH DI TERIMA OLEH CUSTOMER' && shipmentStatus !== '';

        const orderDate = parseDateString(sendDateStr);
        let isWithin2Days = false;

        if (orderDate) {
            isWithin2Days = (orderDate >= twoDaysAgo && orderDate <= today);
        }

        return isNotDelivered && isWithin2Days;
    });

    renderTable(filteredData, strukturMap);
}

function renderTable(data, strukturMap) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; 
    
    document.getElementById('countData').innerText = data.length;
    document.getElementById('resultsArea').classList.remove('hidden');

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="py-4 text-center text-gray-500">Semua pesanan dalam 2 hari terakhir sudah terkirim / Tidak ada data.</td></tr>';
        return;
    }

    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = "border-b hover:bg-gray-50";

        const kodeToko = row['KODE TOKO'] ? row['KODE TOKO'].trim() : '-';
        
        // Ambil info dari map struktur
        const infoStruktur = strukturMap[kodeToko] || { wilayah: 'Tidak ditemukan', ac: '-', am: '-' };

        tr.innerHTML = `
            <td class="py-2 px-3">${kodeToko}</td>
            <td class="py-2 px-3">${row['TOKO'] || '-'}</td>
            <td class="py-2 px-3">${infoStruktur.wilayah}</td>
            <td class="py-2 px-3 font-semibold text-blue-700">${infoStruktur.ac}</td>
            <td class="py-2 px-3 font-semibold text-green-700">${infoStruktur.am}</td>
            <td class="py-2 px-3">${row['NO PENGIRIMAN'] || '-'}</td>
            <td class="py-2 px-3">${row['SEND DATE TO STORE'] || row['JADWAL KIRIM'] || '-'}</td>
            <td class="py-2 px-3 text-red-600 font-semibold">${row['SHIPMENT STATUS'] || '-'}</td>
        `;
        tableBody.appendChild(tr);
    });
}
