let charts = {};

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
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(document.getElementById(id), config);
}

async function loadSummary() {
    const d = await fetchJSON('/api/summary');
    document.getElementById('totalValue').textContent = d.total;
    document.getElementById('selesaiValue').textContent = d.selesai;
    document.getElementById('prosesValue').textContent = d.proses;
    document.getElementById('persenValue').textContent = d.persen_selesai + '%';
    document.getElementById('selesaiSub').textContent = d.persen_selesai + '%';
    document.getElementById('prosesSub').textContent = (100 - d.persen_selesai) + '%';
}

async function loadRegionalChart() {
    const data = await fetchJSON('/api/regional');
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
    const d = await fetchJSON('/api/summary');
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
    const data = await fetchJSON('/api/kegiatan');
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
    const data = await fetchJSON('/api/korektor');
    newChart('chartKorektor', {
        type: 'bar',
        data: {
            labels: data.slice(0, 12).map(d => shortLabel(d.korektor)),
            datasets: [{ label: 'Laporan', data: data.slice(0, 12).map(d => d.total), backgroundColor: '#a78bfa', borderRadius: 4 }]
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

async function loadKorektorRegionalChart() {
    const data = await fetchJSON('/api/korektor');
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
    const data = await fetchJSON('/api/matriks_status');
    const years = ['2024', '2025', '2026'];
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

async function loadProgressBars() {
    const data = await fetchJSON('/api/regional');
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
    await Promise.all([
        loadSummary(), loadRegionalChart(), loadStatusChart(), loadTahunChart(),
        loadKegiatanChart(), loadKorektorChart(), loadKorektorRegionalChart(),
        loadSelesaiTahunRegionalChart(), loadProgressBars()
    ]);
}

async function refreshData() {
    await Promise.all([loadAllDashboard(), loadList(1)]);
}
