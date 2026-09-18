import os
import threading

import gspread
from oauth2client.service_account import ServiceAccountCredentials

from flask import current_app

GOOGLE_SHEET_NAME = "Monitoring Pengiriman Mitra Karya 2023"
SCOPE = ["https://spreadsheets.google.com/feeds",
         "https://www.googleapis.com/auth/drive"]

_DEFAULT_CREDS = '/home/MonitoringLaporanBantek/Dasboard_Bantek/dashboard/credentials.json'


def get_creds_path():
    env = os.environ.get('GOOGLE_CREDS_PATH')
    if env:
        return env
    local = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'credentials.json')
    if os.path.exists(local):
        return local
    return _DEFAULT_CREDS


CREDS_PATH = get_creds_path()


def status_of(sudah_dikirim):
    return 'SELESAI' if sudah_dikirim and str(sudah_dikirim).strip() != '' else 'PROSES'


def sync_ke_google_sheets(data_row):
    creds = ServiceAccountCredentials.from_json_keyfile_name(CREDS_PATH, SCOPE)
    client = gspread.authorize(creds)
    sheet = client.open(GOOGLE_SHEET_NAME).sheet1
    sheet.append_row(data_row)


def build_gsheet_row(data):
    assignments = data.get('assignments') or []
    row = [
        data.get('regional', ''),
        data.get('no', ''),
        data.get('perusahaan', ''),
        data.get('kebun', ''),
        data.get('petugas', ''),
        data.get('tanggal_kunjungan', ''),
        data.get('kegiatan', ''),
        data.get('draft_masuk', ''),
        data.get('draft_korektor', ''),
        data.get('korektor', ''),
    ]
    for a in assignments[:8]:
        row.append(a.get('masuk', ''))
        row.append(a.get('keluar', ''))
    for _ in range(8 - min(len(assignments), 8)):
        row.extend(['', ''])
    row.extend([
        data.get('revisi', ''),
        data.get('cetak', ''),
        data.get('sudah_dikirim', ''),
        status_of(data.get('sudah_dikirim')),
        data.get('tahun', ''),
        data.get('folder_laporan', ''),
        data.get('catatan', ''),
    ])
    return row


def _log(msg):
    try:
        current_app.logger.info('[GSync] ' + msg)
    except Exception:
        print('[GSync] ' + msg)


def try_sync_gsheets(data):
    if not os.path.exists(CREDS_PATH):
        _log('credentials.json tidak ditemukan di %s - sync dilewati' % CREDS_PATH)
        return
    row = build_gsheet_row(data)

    def worker():
        try:
            sync_ke_google_sheets(row)
            _log('OK %d kolom -> %s' % (len(row), GOOGLE_SHEET_NAME))
        except Exception as e:
            _log('Gagal Sync ke Google Sheets: %s' % e)

    threading.Thread(target=worker, daemon=True).start()