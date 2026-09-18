let currentPage = 1;
let perPage = 12;
let editingId = null;
let confirmCallback = null;
let isLoggedIn = false;

const REGIONALS = [
    'Regional 1', 'Regional 2', 'Regional 3', 'Regional 4', 'Regional 5',
    'Regional 6', 'Regional 7', 'Regional 4 Palmco', 'PT Swasta / PPKS'
];

function toast(msg, isError = false) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast' + (isError ? ' error' : '');
    t.style.display = 'block';
    setTimeout(() => { t.style.display = 'none'; }, 3200);
}

async function fetchJSON(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) {
        let msg = 'Terjadi kesalahan';
        try { const d = await res.json(); msg = d.message || d.error || msg; } catch (e) {}
        throw new Error(msg);
    }
    return res.json();
}

// ---------------- LOGIN STATE ----------------
async function checkAuth() {
    const st = await fetchJSON('/api/status');
    setLoggedIn(st.logged_in);
    return st.logged_in;
}

function setLoggedIn(status) {
    isLoggedIn = status;
    const pill = document.getElementById('loginPill');
    const toggleBtn = document.getElementById('loginToggleBtn');
    const lockMsg = document.getElementById('lockMsg');
    const lockLoginBtn = document.getElementById('lockLoginBtn');
    const banner = document.getElementById('lockBanner');

    if (status) {
        pill.textContent = 'Sudah Login';
        pill.className = 'login-pill in';
        toggleBtn.textContent = 'Logout';
        banner.style.display = 'none';
        enableForm(true);
    } else {
        pill.textContent = 'Belum Login';
        pill.className = 'login-pill out';
        toggleBtn.textContent = 'Login untuk Edit';
        banner.style.display = 'flex';
        lockMsg.textContent = '🔒 Terkunci. Login untuk menambah / mengubah data.';
        lockLoginBtn.onclick = showLoginModal;
        enableForm(false);
    }
    updateSidebarUser(status);
}

function updateSidebarUser(loggedIn) {
    const el = document.getElementById('sideUserStatus');
    if (!el) return;
    if (loggedIn) {
        el.innerHTML = '<i class="fa fa-circle text-success"></i> Online';
    } else {
        el.innerHTML = '<i class="fa fa-circle text-muted"></i> Belum Login';
    }
}

function showView(name) {
    document.querySelectorAll('.view').forEach(v => {
        v.classList.toggle('hidden', v.id !== 'view-' + name);
    });
    document.querySelectorAll('.sidebar-menu li[data-view]').forEach(li => {
        li.classList.toggle('active', li.dataset.view === name);
    });
    window.scrollTo(0, 0);
}

function initSidebar() {
    document.querySelectorAll('.sidebar-menu li.treeview > a').forEach(a => {
        a.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const li = this.parentElement;
            const wasOpen = li.classList.contains('open');
            li.classList.toggle('open');
            if (!wasOpen) {
                const level = li.parentElement;
                level.querySelectorAll(':scope > li.treeview.open').forEach(sib => {
                    if (sib !== li) sib.classList.remove('open');
                });
            }
        });
    });
    document.querySelectorAll('.sidebar-menu li[data-view] > a').forEach(a => {
        a.addEventListener('click', function(e) {
            e.preventDefault();
            showView(this.parentElement.dataset.view);
        });
    });
    const toggle = document.getElementById('sidebarToggle');
    if (toggle) {
        toggle.addEventListener('click', function() {
            document.body.classList.toggle('sidebar-collapsed');
        });
    }
    const runSideSearch = function() {
        const input = document.getElementById('sideSearch');
        const q = input ? input.value.trim() : '';
        showView('daftar');
        if (q) document.getElementById('listSearch').value = q;
        loadList(1);
    };
    const sideInput = document.getElementById('sideSearch');
    const sideBtn = document.getElementById('sideSearchBtn');
    if (sideBtn) sideBtn.addEventListener('click', runSideSearch);
    if (sideInput) sideInput.addEventListener('keydown', e => { if (e.key === 'Enter') runSideSearch(); });
}

function enableForm(enabled) {
    const ids = ['fKebun', 'fKode', 'fPerusahaan', 'fPetugas', 'fTglKunjungan', 'fKegiatan',
                 'fKorektor', 'fSudahDikirim', 'fFolder', 'fCatatan',
                 'fDraftMasuk', 'fDraftKorektor', 'fRevisi', 'fCetak'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.disabled = !enabled; });
    document.getElementById('fRegional').disabled = !enabled;
    document.getElementById('fTahun').disabled = !enabled;
    document.getElementById('fStatus').disabled = !enabled;
    document.getElementById('saveBtn').disabled = !enabled;
    document.getElementById('addKorektorBtn').disabled = !enabled;
    document.getElementById('changePwBtn').disabled = !enabled;
    const addBtn = document.getElementById('addAssignmentBtn');
    if (addBtn) addBtn.disabled = !enabled;
}

function toggleLogin() {
    if (isLoggedIn) logout(); else showLoginModal();
}

function showLoginModal() {
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginModal').classList.add('show');
    setTimeout(() => document.getElementById('loginPassword').focus(), 100);
}
function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('show');
}
async function submitLogin() {
    const password = document.getElementById('loginPassword').value;
    try {
        await fetchJSON('/api/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password })
        });
        document.getElementById('loginModal').classList.remove('show');
        setLoggedIn(true);
        toast('Login berhasil');
        loadList(currentPage);
    } catch (e) {
        document.getElementById('loginError').style.display = 'block';
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginPassword').focus();
    }
}
async function logout() {
    try { await fetchJSON('/api/logout', { method: 'POST' }); } catch (e) {}
    setLoggedIn(false);
    resetForm();
    toast('Anda telah logout');
    loadList(currentPage);
}
document.getElementById('loginPassword').addEventListener('keydown', e => { if (e.key === 'Enter') submitLogin(); });

// ---------------- AUTO DETECT from sentence ----------------
const YEAR_RE = /\b(19|20)\d{2}\b/;
const REGIONAL_PATTERNS = [
    { re: /regional\s*4\s*(palmco|p\b)/i, val: 'Regional 4 Palmco' },
    { re: /regional\s*4\b/i, val: 'Regional 4' },
    { re: /regional\s*7\b/i, val: 'Regional 7' },
    { re: /regional\s*6\b/i, val: 'Regional 6' },
    { re: /regional\s*5\b/i, val: 'Regional 5' },
    { re: /regional\s*3\b/i, val: 'Regional 3' },
    { re: /regional\s*2\b/i, val: 'Regional 2' },
    { re: /regional\s*1\b/i, val: 'Regional 1' },
    { re: /palmco|\br4p\b|regional.*4.*palmco/i, val: 'Regional 4 Palmco' },
    { re: /swasta|ppks/i, val: 'PT Swasta / PPKS' },
];

function detectFromSentence() {
    const text = document.getElementById('fKegiatan').value || '';
    // Tahun
    const m = text.match(YEAR_RE);
    if (m) { document.getElementById('fTahun').value = m[0]; }
    // Regional
    for (const p of REGIONAL_PATTERNS) {
        if (p.re.test(text)) { document.getElementById('fRegional').value = p.val; break; }
    }
}

// ---------------- LIST ----------------
async function populateFilters() {
    const regSelect = document.getElementById('listRegional');
    REGIONALS.forEach(r => { const o = document.createElement('option'); o.value = r; o.textContent = r; regSelect.appendChild(o); });
    let years = [];
    try { years = await fetchJSON('/api/tahun_list'); } catch (e) {}
    const tSelect = document.getElementById('listTahun');
    const idxSelect = document.getElementById('idxTahun');
    const dashSelect = document.getElementById('dashYear');
    const tahunDl = document.getElementById('tahunOptions');
    const yearOptions = years.map(y => `<option value="${y}">${y}</option>`).join('');
    if (tSelect) tSelect.insertAdjacentHTML('beforeend', yearOptions);
    if (idxSelect) idxSelect.insertAdjacentHTML('beforeend', yearOptions);
    if (dashSelect) dashSelect.innerHTML = '<option value="">Semua Tahun</option>' + yearOptions;
    if (tahunDl) tahunDl.innerHTML = years.map(y => `<option value="${y}">`).join('');
    const fReg = document.getElementById('fRegional');
    REGIONALS.forEach(r => { const o = document.createElement('option'); o.value = r; o.textContent = r; fReg.appendChild(o); });
}

function badge(s) {
    return `<span class="badge ${s === 'SELESAI' ? 'badge-selesai' : 'badge-proses'}">${esc(s)}</span>`;
}

function truncate(s, n) {
    s = String(s == null ? '' : s);
    return esc(s.length > n ? s.slice(0, n - 1) + '…' : s);
}

function getFilterParams() {
    const params = new URLSearchParams();
    const reg = document.getElementById('listRegional').value;
    const tahun = document.getElementById('listTahun').value;
    const status = document.getElementById('listStatus').value;
    const search = document.getElementById('listSearch').value;
    if (reg) params.set('regional', reg);
    if (tahun) params.set('tahun', tahun);
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    params.set('per_page', perPage);
    return params;
}

async function loadList(page = 1) {
    currentPage = page;
    const tbody = document.getElementById('listBody');
    try {
        const params = getFilterParams();
        params.set('page', page);
        const data = await fetchJSON('/api/detail?' + params.toString());
        if (data.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:24px;color:#6c757d">Tidak ada data</td></tr>';
            document.getElementById('listPagination').innerHTML = '';
            return;
        }
        let html = '';
        for (const d of data.data) {
            const detailBtn = `<button class="btn btn-outline btn-sm" onclick="showDetail(${d.id})" title="Lihat detail">Detail</button>`;
            const editBtn = isLoggedIn ? `<button class="btn btn-warn btn-sm" onclick="editRecord(${d.id})">Edit</button>` : '';
            const delBtn = isLoggedIn ? `<button class="btn btn-red btn-sm" onclick="confirmDelete(${d.id}, '${esc(d.kebun || '').replace(/'/g, "\\'")}')">Hapus</button>` : '';
            const dur = (d.durasi_hari != null && d.durasi_hari !== '') ? d.durasi_hari : '-';
            html += `<tr>
                <td class="kode-cell">${esc(d.kode_laporan) || '&nbsp;'}</td><td>${esc(d.regional)}</td><td>${esc(d.kebun)}</td>
                <td title="${esc(d.kegiatan || '')}">${truncate(d.kegiatan, 28)}</td><td>${d.tahun || ''}</td>
                <td title="${esc(d.tanggal_kunjungan || '')}">${truncate(d.tanggal_kunjungan, 18) || '&nbsp;'}</td><td>${dur}</td>
                <td>${badge(d.status)}</td><td title="${esc(d.korektor || '')}">${truncate(d.korektor, 16)}</td>
                <td style="white-space:nowrap">${detailBtn}${editBtn}${delBtn}</td>
            </tr>`;
        }
        tbody.innerHTML = html;

        let pag = '';
        pag += `<button onclick="loadList(${Math.max(1, page - 1)})" ${page <= 1 ? 'disabled' : ''}>&laquo;</button>`;
        const sp = Math.max(1, page - 2), ep = Math.min(data.total_pages, page + 2);
        for (let p = sp; p <= ep; p++) pag += `<button class="${p === page ? 'active' : ''}" onclick="loadList(${p})">${p}</button>`;
        pag += `<button onclick="loadList(${Math.min(data.total_pages, page + 1)})" ${page >= data.total_pages ? 'disabled' : ''}>&raquo;</button>`;
        pag += `<span class="page-info">${page}/${data.total_pages} (${data.total})</span>`;
        document.getElementById('listPagination').innerHTML = pag;
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:24px;color:#f87171">${esc(e.message)}</td></tr>`;
    }
}
function resetList() {
    document.getElementById('listRegional').value = '';
    document.getElementById('listTahun').value = '';
    document.getElementById('listStatus').value = '';
    document.getElementById('listSearch').value = '';
    loadList(1);
}
document.getElementById('listSearch').addEventListener('keydown', e => { if (e.key === 'Enter') loadList(1); });

// ---------------- FORM ----------------
function toggleDetail() {
    const head = document.getElementById('detailToggle');
    const body = document.getElementById('detailBody');
    const open = body.classList.toggle('open');
    head.classList.toggle('open', open);
}
function toggleSettings() {
    const head = document.getElementById('settingsToggle');
    const body = document.getElementById('settingsBody');
    const open = body.classList.toggle('open');
    head.classList.toggle('open', open);
}
function resetForm() {
    editingId = null;
    const ids = ['fKebun', 'fKode', 'fPerusahaan', 'fPetugas', 'fTglKunjungan', 'fKegiatan',
                 'fKorektor', 'fSudahDikirim', 'fFolder', 'fCatatan',
                 'fDraftMasuk', 'fDraftKorektor', 'fRevisi', 'fCetak'];
    ids.forEach(id => document.getElementById(id).value = '');
    document.getElementById('fTahun').value = String(new Date().getFullYear());
    document.getElementById('fRegional').value = 'Regional 1';
    document.getElementById('fStatus').value = 'PROSES';
    document.getElementById('assignmentBody').innerHTML = '';
}

async function editRecord(id) {
    if (!isLoggedIn) { showLoginModal(); return; }
    try {
        const d = await fetchJSON('/api/laporan/' + id);
        editingId = id;
        document.getElementById('fKegiatan').value = d.kegiatan || '';
        document.getElementById('fRegional').value = d.regional;
        document.getElementById('fTahun').value = d.tahun || String(new Date().getFullYear());
        document.getElementById('fKebun').value = d.kebun;
        document.getElementById('fKode').value = d.kode_laporan || '';
        document.getElementById('fStatus').value = d.status;
        document.getElementById('fPerusahaan').value = d.perusahaan || '';
        document.getElementById('fKorektor').value = d.korektor || '';
        document.getElementById('fPetugas').value = d.petugas || '';
        document.getElementById('fTglKunjungan').value = d.tanggal_kunjungan || '';
        document.getElementById('fDraftMasuk').value = d.draft_masuk || '';
        document.getElementById('fDraftKorektor').value = d.draft_korektor || '';
        document.getElementById('fRevisi').value = d.revisi || '';
        document.getElementById('fCetak').value = d.cetak || '';
        document.getElementById('fSudahDikirim').value = d.sudah_dikirim || '';
        document.getElementById('fFolder').value = d.folder_laporan || '';
        document.getElementById('fCatatan').value = d.catatan || '';
        renderAssignments([]);
        try {
            const assigns = await fetchJSON('/api/laporan/' + id + '/korektor_assignment');
            renderAssignments(assigns);
        } catch (e) {}
        toast('Mode edit: ' + d.kebun);
    } catch (e) { toast(e.message, true); }
}

function collectForm() {
    const status = document.getElementById('fStatus').value;
    let sudahDikirim = document.getElementById('fSudahDikirim').value;
    if (status === 'SELESAI') {
        if (!sudahDikirim) sudahDikirim = '✓';
    } else {
        sudahDikirim = '';
    }
    return {
        kode_laporan: document.getElementById('fKode').value,
        regional: document.getElementById('fRegional').value,
        kebun: document.getElementById('fKebun').value,
        perusahaan: document.getElementById('fPerusahaan').value,
        petugas: document.getElementById('fPetugas').value,
        tanggal_kunjungan: document.getElementById('fTglKunjungan').value,
        draft_masuk: document.getElementById('fDraftMasuk').value,
        draft_korektor: document.getElementById('fDraftKorektor').value,
        revisi: document.getElementById('fRevisi').value,
        cetak: document.getElementById('fCetak').value,
        kegiatan: document.getElementById('fKegiatan').value,
        tahun: document.getElementById('fTahun').value,
        korektor: document.getElementById('fKorektor').value,
        sudah_dikirim: sudahDikirim,
        folder_laporan: document.getElementById('fFolder').value,
        catatan: document.getElementById('fCatatan').value,
        status: status,
    };
}

async function saveForm() {
    if (!isLoggedIn) { showLoginModal(); return; }
    const payload = collectForm();
    if (!payload.kegiatan && !payload.kebun) {
        toast('Isi kalimat kegiatan atau kebun/lokasi', true);
        return;
    }
    try {
        let targetId = editingId;
        if (editingId) {
            await fetchJSON('/api/laporan/' + editingId, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            toast('Data berhasil diperbarui');
        } else {
            const res = await fetchJSON('/api/laporan', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            targetId = res.id;
            toast('Laporan baru ditambahkan');
        }
        const items = collectAssignments();
        if (targetId && items.length) {
            await fetchJSON('/api/laporan/' + targetId + '/korektor_assignment', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items })
            });
        }
        resetForm();
        await Promise.all([loadList(currentPage), loadAllDashboard()]);
        loadKorektorList();
    } catch (e) { toast(e.message, true); }
}

// ---------------- DELETE ----------------
function confirmDelete(id, kebun) {
    if (!isLoggedIn) { showLoginModal(); return; }
    document.getElementById('confirmTitle').textContent = 'Hapus Laporan';
    document.getElementById('confirmMessage').textContent = 'Yakin hapus "' + kebun + '"? Tindakan tidak bisa dibatalkan.';
    document.getElementById('confirmOkBtn').textContent = 'Ya, Hapus';
    document.getElementById('confirmModal').classList.add('show');
    confirmCallback = async () => {
        try {
            await fetchJSON('/api/laporan/' + id, { method: 'DELETE' });
            toast('Laporan dihapus');
            await Promise.all([loadList(currentPage), loadAllDashboard()]);
        } catch (e) { toast(e.message, true); }
        closeConfirm();
    };
}
function closeConfirm() { document.getElementById('confirmModal').classList.remove('show'); confirmCallback = null; }
document.getElementById('confirmOkBtn').addEventListener('click', () => { if (confirmCallback) confirmCallback(); });

// ---------------- KOREKTOR TAHAP (ASSIGNMENT) ----------------
function assignmentRowHtml(a) {
    const name = (a && a.nama) ? a.nama : '';
    const masuk = (a && a.masuk) ? a.masuk : '';
    const keluar = (a && a.keluar) ? a.keluar : '';
    return `<div class="assignment-row" style="display:flex;gap:6px;margin-bottom:5px">
        <input type="text" class="a-nama" placeholder="Nama" value="${name.replace(/"/g, '&quot;')}" style="flex:1.4;padding:6px 8px;border-radius:4px;border:1px solid #ced4da;background:#ffffff;color:#212529;font-size:0.74rem">
        <input type="text" class="a-masuk" placeholder="Masuk" value="${masuk}" style="flex:1;padding:6px 8px;border-radius:4px;border:1px solid #ced4da;background:#ffffff;color:#212529;font-size:0.74rem">
        <input type="text" class="a-keluar" placeholder="Keluar" value="${keluar}" style="flex:1;padding:6px 8px;border-radius:4px;border:1px solid #ced4da;background:#ffffff;color:#212529;font-size:0.74rem">
        <button class="btn btn-red btn-sm" onclick="this.parentNode.remove()">×</button>
    </div>`;
}
function renderAssignments(items) {
    const body = document.getElementById('assignmentBody');
    body.innerHTML = '';
    (items || []).forEach(a => { body.insertAdjacentHTML('beforeend', assignmentRowHtml(a)); });
}
function addAssignmentRow() {
    if (!isLoggedIn) { showLoginModal(); return; }
    const input = document.getElementById('newAssignmentNama');
    const name = input.value.trim();
    if (!name) { toast('Masukkan nama korektor', true); return; }
    document.getElementById('assignmentBody').insertAdjacentHTML('beforeend', assignmentRowHtml({ nama: name }));
    input.value = '';
}
function collectAssignments() {
    const rows = document.querySelectorAll('#assignmentBody .assignment-row');
    const items = [];
    rows.forEach(r => {
        const nama = r.querySelector('.a-nama').value.trim();
        if (!nama) return;
        items.push({
            nama: nama,
            masuk: r.querySelector('.a-masuk').value.trim(),
            keluar: r.querySelector('.a-keluar').value.trim(),
        });
    });
    return items;
}

// ---------------- EXPORT ----------------
function exportExcel() {
    const params = getFilterParams();
    window.location = '/api/export?' + params.toString();
}

// ---------------- INDEX FOLDER LAPORAN ----------------
let idxPage = 1;
const idxPerPage = 25;
async function loadIndex(page = 1) {
    idxPage = page;
    const params = new URLSearchParams();
    const th = document.getElementById('idxTahun').value;
    const kat = document.getElementById('idxKategori').value;
    const q = document.getElementById('idxSearch').value;
    if (th) params.set('tahun', th);
    if (kat) params.set('kategori', kat);
    if (q) params.set('search', q);
    const tbody = document.getElementById('idxBody');
    try {
        const data = await fetchJSON('/api/index_laporan?' + params.toString());
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:18px;color:#6c757d">Tidak ada folder</td></tr>';
            document.getElementById('idxPagination').innerHTML = '';
            return;
        }
        const totalPages = Math.ceil(data.length / idxPerPage);
        const slice = data.slice((page - 1) * idxPerPage, page * idxPerPage);
        let html = '';
        for (const d of slice) {
            const link = d.link ? `<a href="${d.link}" target="_blank" rel="noopener" style="color:#007bff">Buka</a>` : '';
            html += `<tr><td title="${(d.folder || '').replace(/"/g, '&quot;')}">${d.folder || ''}</td><td>${d.tahun || ''}</td><td>${d.jumlah_file || ''}</td><td style="text-align:center">${link}</td></tr>`;
        }
        tbody.innerHTML = html;
        let pag = `<button onclick="loadIndex(${Math.max(1, page - 1)})" ${page <= 1 ? 'disabled' : ''}>&laquo;</button>`;
        for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) {
            pag += `<button class="${p === page ? 'active' : ''}" onclick="loadIndex(${p})">${p}</button>`;
        }
        pag += `<button onclick="loadIndex(${Math.min(totalPages, page + 1)})" ${page >= totalPages ? 'disabled' : ''}>&raquo;</button>`;
        pag += `<span class="page-info">${page}/${totalPages} (${data.length})</span>`;
        document.getElementById('idxPagination').innerHTML = pag;
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:18px;color:#f87171">${e.message}</td></tr>`;
    }
}

// ---------------- KOREKTOR ----------------
async function loadKorektorList() {
    const c = document.getElementById('korektorList');
    try {
        const data = await fetchJSON('/api/korektor_master');
        if (data.length === 0) { c.innerHTML = '<div style="color:#6c757d;font-size:0.8rem">Belum ada korektor.</div>'; return; }
        let html = '';
        for (const k of data) {
            const acts = isLoggedIn ? `<button class="btn btn-dark btn-sm" onclick="editKorektor(${k.id}, '${k.nama.replace(/'/g, "\\'")}')">Edit</button>
                <button class="btn btn-red btn-sm" onclick="confirmDeleteKorektor(${k.id}, '${k.nama.replace(/'/g, "\\'")}')">Hapus</button>` : '';
            html += `<div class="korektor-line"><span class="name">${k.nama}</span>${acts}</div>`;
        }
        c.innerHTML = html;
    } catch (e) { c.innerHTML = '<div style="color:#6c757d;font-size:0.8rem">' + e.message + '</div>'; }
}
async function addKorektor() {
    if (!isLoggedIn) { showLoginModal(); return; }
    const name = document.getElementById('newKorektorName').value.trim();
    if (!name) { toast('Masukkan nama korektor', true); return; }
    try {
        await fetchJSON('/api/korektor_master', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nama: name })
        });
        document.getElementById('newKorektorName').value = '';
        toast('Korektor ditambahkan');
        loadKorektorList();
    } catch (e) { toast(e.message, true); }
}
function editKorektor(id, name) {
    const nn = prompt('Ubah nama korektor:', name);
    if (nn && nn.trim()) {
        (async () => {
            try {
                await fetchJSON('/api/korektor_master/' + id, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nama: nn.trim() })
                });
                toast('Korektor diperbarui');
                loadKorektorList();
            } catch (e) { toast(e.message, true); }
        })();
    }
}
function confirmDeleteKorektor(id, name) {
    if (!isLoggedIn) { showLoginModal(); return; }
    document.getElementById('confirmTitle').textContent = 'Hapus Korektor';
    document.getElementById('confirmMessage').textContent = 'Yakin hapus korektor "' + name + '" dari master?';
    document.getElementById('confirmOkBtn').textContent = 'Ya, Hapus';
    document.getElementById('confirmModal').classList.add('show');
    confirmCallback = async () => {
        try {
            await fetchJSON('/api/korektor_master/' + id, { method: 'DELETE' });
            toast('Korektor dihapus');
            loadKorektorList();
        } catch (e) { toast(e.message, true); }
        closeConfirm();
    };
}

// ---------------- PASSWORD ----------------
async function changePassword() {
    if (!isLoggedIn) { showLoginModal(); return; }
    const old = document.getElementById('pOld').value;
    const nw = document.getElementById('pNew').value;
    const nw2 = document.getElementById('pNew2').value;
    if (nw !== nw2) { toast('Password baru tidak sama', true); return; }
    try {
        await fetchJSON('/api/change_password', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ old_password: old, new_password: nw })
        });
        toast('Password berhasil diubah');
        document.getElementById('pOld').value = '';
        document.getElementById('pNew').value = '';
        document.getElementById('pNew2').value = '';
    } catch (e) { toast(e.message, true); }
}

// ---------------- INIT ----------------
document.addEventListener('DOMContentLoaded', async function() {
    initSidebar();
    await checkAuth();
    populateFilters();
    document.getElementById('fKegiatan').addEventListener('input', detectFromSentence);
    document.getElementById('idxSearch').addEventListener('keydown', e => { if (e.key === 'Enter') loadIndex(1); });
    loadKorektorOptions();
    await Promise.all([loadAllDashboard(), loadList(1), loadKorektorList(), loadIndex(1)]);
    setInterval(() => { if (typeof loadSyncStatus === 'function') loadSyncStatus(); }, 60000);
});
