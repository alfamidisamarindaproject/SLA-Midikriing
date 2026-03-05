document.getElementById('processBtn').addEventListener('click', processFiles);

let dataCsv = [];
let strukturCsv = [];

function processFiles() {
    const dataFileInput = document.getElementById('dataFile').files[0];
    const strukturFileInput = document.getElementById('strukturFile').files[0];

    if (!dataFileInput) {
        alert("Silakan upload File Data terlebih dahulu.");
        return;
    }

    // Parsing File Data
    Papa.parse(dataFileInput, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            dataCsv = results.data;
            
            // Jika ada file struktur, parsing juga. Jika tidak, langsung render.
            if (strukturFileInput) {
                Papa.parse(strukturFileInput, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function(resStruktur) {
                        strukturCsv = resStruktur.data;
                        filterAndRenderData();
                    }
                });
            } else {
                filterAndRenderData();
            }
        }
    });
}

// Fungsi untuk konversi string "DD/MM/YYYY HH:mm" ke Object Date JavaScript
function parseDateString(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.trim().split(' ');
    const dateParts = parts[0].split('/');
    if (dateParts.length === 3) {
        // Javascript Date: YYYY, MM (0-11 index), DD
        return new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
    }
    return null;
}

function filterAndRenderData() {
    // Menentukan rentang tanggal (Hari ini dan 2 Hari yang lalu)
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(today.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);

    // Membuat Map untuk file struktur (Kode Toko -> Wilayah)
    const strukturMap = {};
    strukturCsv.forEach(row => {
        if (row['KD TOKO']) {
            strukturMap[row['KD TOKO'].trim()] = row['WILAYAH'];
        }
    });

    // Filter Data
    const filteredData = dataCsv.filter(row => {
        const shipmentStatus = row['SHIPMENT STATUS'] ? row['SHIPMENT STATUS'].trim().toUpperCase() : '';
        const sendDateStr = row['SEND DATE TO STORE'] || row['JADWAL KIRIM'];
        
        // 1. Cek apakah barang belum terkirim (Status BUKAN "SUDAH DI TERIMA OLEH CUSTOMER")
        const isNotDelivered = shipmentStatus !== 'SUDAH DI TERIMA OLEH CUSTOMER' && shipmentStatus !== '';

        // 2. Cek apakah tanggal berada di 2 hari kebelakang
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
    tableBody.innerHTML = ''; // Kosongkan tabel
    
    document.getElementById('countData').innerText = data.length;
    document.getElementById('resultsArea').classList.remove('hidden');

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="py-4 text-center text-gray-500">Tidak ada data yang sesuai kriteria (belum terkirim 2 hari terakhir).</td></tr>';
        return;
    }

    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = "border-b hover:bg-gray-50";

        const kodeToko = row['KODE TOKO'] ? row['KODE TOKO'].trim() : '-';
        const wilayah = strukturMap[kodeToko] || 'Tidak ditemukan';

        tr.innerHTML = `
            <td class="py-2 px-4">${kodeToko}</td>
            <td class="py-2 px-4">${row['TOKO'] || '-'}</td>
            <td class="py-2 px-4">${wilayah}</td>
            <td class="py-2 px-4">${row['NO PENGIRIMAN'] || '-'}</td>
            <td class="py-2 px-4">${row['NAMA PENERIMA'] || '-'}</td>
            <td class="py-2 px-4">${row['SEND DATE TO STORE'] || row['JADWAL KIRIM'] || '-'}</td>
            <td class="py-2 px-4 text-red-600 font-semibold">${row['SHIPMENT STATUS'] || '-'}</td>
        `;
        tableBody.appendChild(tr);
    });
}
