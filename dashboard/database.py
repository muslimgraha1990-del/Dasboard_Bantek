import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bantek.db')

REGIONAL_ORDER = [
    'Regional 1', 'Regional 2', 'Regional 3', 'Regional 4', 'Regional 5',
    'Regional 6', 'Regional 7', 'Regional 4 Palmco', 'PT Swasta / PPKS',
]

SCHEMA = """
CREATE TABLE IF NOT EXISTS laporan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kode_laporan TEXT,
    no TEXT,
    regional TEXT NOT NULL,
    perusahaan TEXT,
    kebun TEXT NOT NULL,
    petugas TEXT,
    tanggal_kunjungan TEXT,
    kegiatan TEXT,
    draft_masuk TEXT,
    draft_korektor TEXT,
    korektor TEXT,
    revisi TEXT,
    cetak TEXT,
    sudah_dikirim TEXT,
    tahun TEXT,
    folder_laporan TEXT,
    catatan TEXT
);

CREATE TABLE IF NOT EXISTS korektor_assignment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    laporan_id INTEGER NOT NULL REFERENCES laporan(id) ON DELETE CASCADE,
    urutan INTEGER NOT NULL DEFAULT 0,
    nama TEXT NOT NULL,
    masuk TEXT,
    keluar TEXT
);

CREATE TABLE IF NOT EXISTS korektor_master (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS index_laporan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folder TEXT,
    tahun TEXT,
    kategori TEXT,
    sumber TEXT,
    jumlah_file TEXT,
    link TEXT
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);
"""


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_connection()
    conn.executescript(SCHEMA)
    conn.commit()
    conn.close()


def db_exists():
    return os.path.exists(DB_PATH)


def migrate_db():
    conn = get_connection()
    try:
        conn.executescript(SCHEMA)
        cols = [r['name'] for r in conn.execute("PRAGMA table_info(laporan)").fetchall()]
        if 'folder_laporan' not in cols:
            conn.execute("ALTER TABLE laporan ADD COLUMN folder_laporan TEXT")
        conn.commit()
    finally:
        conn.close()


def row_to_dict(row):
    return dict(row) if row is not None else None


def rows_to_dicts(rows):
    return [dict(r) for r in rows]
