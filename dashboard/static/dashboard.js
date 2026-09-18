let charts = {};
let dashYear = '';
function dashParams() { return dashYear ? '?tahun=' + encodeURIComponent(dashYear) : ''; }
async function setDashYear(y) { dashYear = y; await loadAllDashboard(); }

const REGIONAL_ORDER = [
    'Regional 1', 'Regional 2', 'Regional 3', 'Regional 4', 'Regional 5',
    'Regional 6', 'Regional 7', 'Regional 4 Palmco', 'PT Swasta / PPKS'
];

async function fetchJSON(url) {
    const res = await fetch(url);
    return res.json();
}

function shortLabel(r) {
    return r.replace('Regional ', 'R').replace('PT Swasta / PPKS', 'SW');
}

function newChart(id, config) {
    if (typeof Chart === 'undefined') {
        const el = document.getElementById(id);
        if (el && el.parentElement) {
            el.parentElement.innerHTML = '<div style="color:#dc3545;font-size:0.75rem;padding-top:50px;text-align:center">Chart.js tidak tersedia.</div>';
        }
        return;
    }
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(document.getElementById(id), config);
}

async function loadSummary() {
    const d = await fetchJSON('/api/summary' + dashParams());
    document.getElementById('totalValue').textContent = d.total;
    document.getElementById('selesaiValue').textContent = d.selesai;
    document.getElementById('prosesValue').textContent = d.proses;
    document.getElementById('persenValue').textContent = d.persen_selesai + '%';
    document.getElementById('selesaiSub').textContent = d.persen_selesai + '%';
    document.getElementById('prosesSub').textContent = (100 - d.persen_selesai) + '%';
}

async function loadRegionalChart() {
    const data = await fetchJSON('/api/regional' + dashParams());
    newChart('chartRegional', {
        type: 'bar',
        data: {
            labels: data.map(d => shortLabel(d.regional)),
            datasets: [
                { label: 'Selesai', data: data.map(d => d.selesai), backgroundColor: '#34d399', borderRadius: 4 },
                { label: 'Proses', data: data.map(d => d.proses), backgroundColor: '#fbbf24', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#6c757d', font: { size: 10 }, usePointStyle: true } } },
            scales: {
                x: { stacked: true, ticks: { color: '#6c757d', font: { size: 9 } }, grid: { color: '#e9ecef' } },
                y: { stacked: true, ticks: { color: '#6c757d', font: { size: 9 } }, grid: { color: '#e9ecef' }, beginAtZero: true }
            }
        }
    });
}

async function loadStatusChart() {
    const d = await fetchJSON('/api/summary' + dashParams());
    newChart('chartStatus', {
        type: 'doughnut',
        data: {
            labels: ['Selesai', 'Proses'],
            datasets: [{ data: [d.selesai, d.proses], backgroundColor: ['#34d399', '#fbbf24'], borderColor: ['#064e3b', '#92400e'], borderWidth: 3 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '60%',
            plugins: {
                legend: { position: 'bottom', labels: { color: '#6c757d', font: { size: 11 }, usePointStyle: true } },
                tooltip: { callbacks: { label: ctx => ctx.label + ': ' + ctx.raw + ' (' + Math.round(ctx.raw / d.total * 100) + '%)' } }
            }
        }
    });
}

async function loadTahunChart() {
    const data = await fetchJSON('/api/tahun');
    newChart('chartTahun', {
        type: 'line',
        data: {
            labels: data.map(d => d.tahun),
            datasets: [
                { label: 'Total', data: data.map(d => d.total), borderColor: '#38bdf8', tension: 0.3, pointRadius: 4, borderWidth: 2 },
                { label: 'Selesai', data: data.map(d => d.selesai), borderColor: '#34d399', tension: 0.3, pointRadius: 4, borderWidth: 2 },
                { label: 'Proses', data: data.map(d => d.proses), borderColor: '#fbbf24', tension: 0.3, pointRadius: 4, borderWidth: 2 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#6c757d', font: { size: 10 }, usePointStyle: true } } },
            scales: {
                x: { ticks: { color: '#6c757d', font: { size: 9 } }, grid: { color: '#e9ecef' } },
                y: { ticks: { color: '#6c757d', font: { size: 9 } }, grid: { color: '#e9ecef' }, beginAtZero: true }
            }
        }
    });
}

async function loadKegiatanChart() {
    const data = await fetchJSON('/api/kegiatan' + dashParams());
    newChart('chartKegiatan', {
        type: 'bar',
        data: {
            labels: data.map(d => shortLabel(d.kegiatan)),
            datasets: [{ label: 'Jumlah', data: data.map(d => d.count), backgroundColor: '#38bdf8', borderRadius: 4 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#6c757d', font: { size: 9 } }, grid: { color: '#e9ecef' }, beginAtZero: true },
                y: { ticks: { color: '#6c757d', font: { size: 9 } }, grid: { color: '#e9ecef' } }
            }
        }
    });
}

async function loadKorektorChart() {
    const data = await fetchJSON('/api/korektor' + dashParams());
    newChart('chartKorektor', {
        type: 'bar',
        data: {
            labels: data.slice(0, 12).map(d => shortLabel(d.korektor)),
            datasets: [
                { label: 'Selesai', data: data.slice(0, 12).map(d => d.selesai), backgroundColor: '#34d399', borderRadius: 4 },
                { label: 'Proses', data: data.slice(0, 12).map(d => d.proses), backgroundColor: '#fbbf24', borderRadius: 4 }
            ]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#6c757d', font: { size: 9 }, usePointStyle: true, boxWidth: 8 } } },
            scales: {
                x: { stacked: true, ticks: { color: '#6c757d', font: { size: 9 } }, grid: { color: '#e9ecef' }, beginAtZero: true },
                y: { stacked: true, ticks: { color: '#6c757d', font: { size: 9 } }, grid: { color: '#e9ecef' } }
            }
        }
    });
}

async function loadKorektorRegionalChart() {
    const data = await fetchJSON('/api/korektor' + dashParams());
    const top = data.slice(0, 10);
    const labels = top.map(d => shortLabel(d.korektor));
    const datasets = REGIONAL_ORDER.map((r, i) => {
        const palette = ['#38bdf8', '#34d399', '#fbbf24', '#a78bfa', '#fb7185', '#22d3ee', '#a3e635', '#f472b6', '#c084fc'];
        return {
            label: shortLabel(r),
            data: top.map(d => d.regional[r] || 0),
            backgroundColor: palette[i % palette.length],
            borderRadius: 3
        };
    });
    newChart('chartKorektorRegional', {
        type: 'bar',
        data: { labels, datasets },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#6c757d', font: { size: 9 }, usePointStyle: true, boxWidth: 10 } } },
            scales: {
                x: { stacked: true, ticks: { color: '#6c757d', font: { size: 9 } }, grid: { color: '#e9ecef' } },
                y: { stacked: true, ticks: { color: '#6c757d', font: { size: 9 } }, grid: { color: '#e9ecef' }, beginAtZero: true }
            }
        }
    });
}

async function loadSelesaiTahunRegionalChart() {
    const data = await fetchJSON('/api/matriks_status' + dashParams());
    const years = (data.length ? Object.keys(data[0]).filter(k => /^\d{4}$/.test(k)).sort() : []);
    const regions = data.map(d => d.regional);
    const palette = ['#38bdf8', '#34d399', '#fbbf24', '#a78bfa', '#fb7185', '#22d3ee', '#a3e635', '#f472b6', '#c084fc'];
    const datasets = years.map((yr, i) => ({
        label: yr,
        data: data.map(d => d[yr] || 0),
        backgroundColor: palette[i % palette.length],
        borderRadius: 4
    }));
    newChart('chartSelesaiTahunRegional', {
        type: 'bar',
        data: {
            labels: regions.map(shortLabel),
            datasets
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Selesai per Tahun', color: '#343a40', font: { size: 11 } },
                legend: { labels: { color: '#6c757d', font: { size: 10 }, usePointStyle: true } }
            },
            scales: {
                x: { ticks: { color: '#6c757d', font: { size: 9 } }, grid: { color: '#e9ecef' } },
                y: { ticks: { color: '#6c757d', font: { size: 9 } }, grid: { color: '#e9ecef' }, beginAtZero: true }
            }
        }
    });
}

function progressColor(p) {
    if (p >= 75) return '#34d399';
    if (p >= 50) return '#38bdf8';
    if (p >= 25) return '#fbbf24';
    return '#f87171';
}

async function loadTahapChart() {
    const data = await fetchJSON('/api/tahap' + dashParams());
    const stages = ['Draft Masuk', 'Dikoreksi', 'Direvisi', 'Dicetak', 'Dikirim'];
    const palette = ['#93c5fd', '#38bdf8', '#fbbf24', '#fb923c', '#34d399'];
    newChart('chartTahap', {
        type: 'bar',
        data: {
            labels: data.map(d => shortLabel(d.regional)),
            datasets: stages.map((s, i) => ({
                label: s,
                data: data.map(d => d[s] || 0),
                backgroundColor: palette[i],
                borderRadius: 3
            }))
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#6c757d', font: { size: 9 }, usePointStyle: true, boxWidth: 8 } } },
            scales: {
                x: { stacked: true, ticks: { color: '#6c757d', font: { size: 9 } }, grid: { color: '#e9ecef' } },
                y: { stacked: true, ticks: { color: '#6c757d', font: { size: 9 } }, grid: { color: '#e9ecef' }, beginAtZero: true }
            }
        }
    });
}

async function loadMatriks() {
    const data = await fetchJSON('/api/matriks_status' + dashParams());
    const head = document.getElementById('matriksHead');
    const tbody = document.getElementById('matriksBody');
    const years = (data.length ? Object.keys(data[0]).filter(k => /^\d{4}$/.test(k)).sort() : []);
    if (head) {
        head.innerHTML = '<th>Regional</th>' + years.map(y => `<th>${y}</th>`).join('') + '<th>Total</th>';
    }
    const sums = { 'total': { s: 0, t: 0 } };
    years.forEach(y => { sums[y] = { s: 0, t: 0 }; });
    function pctCls(p) { return p >= 75 ? 'text-ok' : (p >= 25 ? 'text-warn' : 'text-bad'); }

    let html = '';
    for (const d of data) {
        sums['total'].s += d['total']; sums['total'].t += d['total_total'];
        for (const y of years) {
            sums[y].s += d[y]; sums[y].t += d[y + '_total'];
        }
        html += `<tr>
            <td>${esc(d.regional)}</td>`;
        for (const y of years) {
            const p = d[y + '_persen'];
            html += `<td><b>${d[y]} / ${d[y + '_total']}</b> <span class="mat-pct ${pctCls(p)}">${p}%</span></td>`;
        }
        html += `<td><b>${d['total']} / ${d['total_total']}</b></td></tr>`;
    }
    html += `<tr class="mat-total"><td><b>TOTAL</b></td>`;
    for (const y of years) {
        const s = sums[y].s, t = sums[y].t;
        const p = t ? Math.round(s / t * 100) : 0;
        html += `<td><b>${s} / ${t}</b> <span class="mat-pct ${pctCls(p)}">${p}%</span></td>`;
    }
    html += `<td><b>${sums['total'].s} / ${sums['total'].t}</b></td></tr>`;

    tbody.innerHTML = html;
}

async function loadSyncStatus() {
    const el = document.getElementById('syncBadge');
    if (!el) return;
    try {
        const d = await fetchJSON('/api/sync_status');
        if (!d.exists) { el.textContent = 'File Excel tidak ditemukan'; el.style.background = '#dc3545'; el.style.color = '#fff'; return; }
        if (d.excel_newer) {
            el.textContent = '⚠ Excel lebih baru dari DB — klik Sync';
            el.style.background = '#fff3cd'; el.style.color = '#856404';
        } else if (d.match) {
            el.textContent = '✓ Sinkron dengan Excel';
            el.style.background = '#d4edda'; el.style.color = '#155724';
        } else {
            el.textContent = '⚠ Data DB berbeda dari Excel';
            el.style.background = '#ffb3b3'; el.style.color = '#58151c';
        }
    } catch (e) { el.textContent = 'Gagal cek sinkron'; }
}

async function syncFromExcel() {
    if (!isLoggedIn) { showLoginModal(); return; }
    if (!confirm('Sync dari Excel akan MENIMPA seluruh data database dengan isi file Excel terbaru. Lanjutkan?')) return;
    const el = document.getElementById('syncBadge');
    const old = el.textContent;
    el.textContent = 'Menyinkronkan...';
    try {
        const res = await fetchJSON('/api/sync_excel', { method: 'POST' });
        toast('Sync selesai: ' + res.result.inserted + ' laporan diimport. Backup: ' + (res.result.backup || '-'));
        await Promise.all([loadAllDashboard(), loadList(currentPage), loadIndex(idxPage), loadKorektorList()]);
        loadSyncStatus();
    } catch (e) {
        el.textContent = old;
        toast(e.message, true);
    }
}

async function loadKorektorOptions() {
    const dl = document.getElementById('korektorOptions');
    if (!dl) return;
    try {
        const names = await fetchJSON('/api/korektor_names');
        dl.innerHTML = names.map(n => `<option value="${esc(n)}">`).join('');
    } catch (e) {}
}

function esc(v) {
    return String(v == null ? '' : v)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function showDetail(id) {
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('detailContent');
    if (!modal || !content) return;
    content.innerHTML = '<div style="color:#6c757d">Memuat...</div>';
    modal.classList.add('show');
    try {
        const [d, assigns] = await Promise.all([
            fetchJSON('/api/laporan/' + id),
            fetchJSON('/api/laporan/' + id + '/korektor_assignment')
        ]);
        const folder = d.folder_laporan
            ? `<a href="${esc(d.folder_laporan)}" target="_blank" rel="noopener" style="color:#007bff">${esc(d.folder_laporan)}</a>`
            : '';
        const rows = [
            ['Kode', d.kode_laporan], ['Regional', d.regional], ['Perusahaan', d.perusahaan],
            ['Kebun/Lokasi', d.kebun], ['Petugas', d.petugas], ['Tanggal Kunjungan', d.tanggal_kunjungan],
            ['Kegiatan', d.kegiatan], ['Tahun', d.tahun], ['Status', d.status],
            ['Korektor', d.korektor], ['Draft Masuk', d.draft_masuk], ['Draft Korektor', d.draft_korektor],
            ['Durasi ke Korektor (hari)', (d.durasi_hari != null && d.durasi_hari !== '') ? d.durasi_hari : '-'],
            ['Revisi', d.revisi], ['Cetak', d.cetak], ['Sudah Dikirim', d.sudah_dikirim],
            ['Folder Laporan', folder], ['Catatan', d.catatan]
        ];
        let html = '<table class="data-table"><tbody>';
        for (const [k, v] of rows) {
            html += `<tr><td style="width:38%;font-weight:700;color:#495057">${esc(k)}</td><td>${v || '&nbsp;'}</td></tr>`;
        }
        html += '</tbody></table>';
        if (assigns && assigns.length) {
            html += '<div style="margin-top:12px;font-weight:800;color:#343a40;text-transform:uppercase;font-size:0.7rem;letter-spacing:.5px">Tahap Koreksi</div>';
            html += '<table class="data-table"><thead><tr><th>No</th><th>Korektor</th><th>Masuk</th><th>Keluar</th></tr></thead><tbody>';
            assigns.forEach((a, i) => {
                html += `<tr><td>${i + 1}</td><td>${esc(a.nama)}</td><td>${esc(a.masuk)}</td><td>${esc(a.keluar)}</td></tr>`;
            });
            html += '</tbody></table>';
        }
        content.innerHTML = html;
        document.getElementById('detailTitle').textContent = 'Detail: ' + (d.kebun || d.kode_laporan || id);
    } catch (e) {
        content.innerHTML = `<div style="color:#dc3545">${esc(e.message)}</div>`;
    }
}

function closeDetail() {
    const modal = document.getElementById('detailModal');
    if (modal) modal.classList.remove('show');
}

async function loadProgressBars() {
    const data = await fetchJSON('/api/regional' + dashParams());
    const c = document.getElementById('progressBars');
    let html = '';
    for (const d of data) {
        const col = progressColor(d.persen);
        html += `<div class="progress-row">
            <div class="progress-label">${shortLabel(d.regional)}</div>
            <div class="progress-bg"><div class="progress-fill" style="width:${d.persen}%;background:${col}">${d.persen > 6 ? d.persen + '%' : ''}</div></div>
            <div style="min-width:52px;text-align:right;color:#6c757d">${d.selesai}/${d.total}</div>
        </div>`;
    }
    c.innerHTML = html;
}

async function loadAllDashboard() {
    try {
        await Promise.all([
            loadSummary(), loadRegionalChart(), loadStatusChart(), loadTahunChart(),
            loadKegiatanChart(), loadKorektorChart(), loadKorektorRegionalChart(),
            loadSelesaiTahunRegionalChart(), loadTahapChart(), loadMatriks(),
            loadProgressBars(), loadSyncStatus()
        ]);
    } catch (e) {
        if (typeof toast === 'function') toast('Gagal memuat dashboard: ' + e.message, true);
    }
}

async function refreshData() {
    await Promise.all([loadAllDashboard(), loadList(1)]);
}
