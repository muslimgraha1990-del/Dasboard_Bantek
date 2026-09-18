import getpass
import os
import sys

from werkzeug.security import generate_password_hash

from database import init_db, get_connection, db_exists
from import_excel import load_from_excel, rebuild_db, EXCEL_PATH


def set_password(force=False):
    conn = get_connection()
    row = conn.execute("SELECT value FROM settings WHERE key='admin_password_hash'").fetchone()
    if row and row['value'] and not force:
        print("Password admin sudah ter-set sebelumnya. Lewati.")
        conn.close()
        return False

    while True:
        pw1 = getpass.getpass("Masukkan password admin (untuk akses menu data): ")
        if pw1.strip() == '':
            print("Password tidak boleh kosong.")
            continue
        pw2 = getpass.getpass("Ulangi password admin: ")
        if pw1 != pw2:
            print("Password tidak sama. Coba lagi.")
            continue
        break

    hashed = generate_password_hash(pw1)
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('admin_password_hash', ?)",
        (hashed,)
    )
    conn.commit()
    conn.close()
    print("Password admin berhasil diset.")
    return True


def main():
    force = '--reset-password' in sys.argv

    if force:
        print("=" * 60)
        print("RESET PASSWORD ADMIN")
        print("=" * 60)
        init_db()
        set_password(force=True)
        print("\nPassword admin berhasil di-reset.")
        print("Jalankan: python app.py")
        return

    print("=" * 60)
    print("Membangun database monitoring bantuan teknis...")
    print("=" * 60)

    already_exists = db_exists()

    init_db()

    if already_exists:
        conn = get_connection()
        count = conn.execute("SELECT COUNT(*) AS c FROM laporan").fetchone()['c']
        conn.close()
        print("Database sudah ada. Jumlah laporan saat ini: %d" % count)
        print("Import data Excel dilewati (agar data yang sudah diedit tidak tertimpa).")
    else:
        print("\nMembaca data dari Excel (%s)..." % os.path.basename(EXCEL_PATH))
        records, assignments, index_records, korektor_master = load_from_excel(EXCEL_PATH)

        lookup = {}
        for a in assignments:
            lookup.setdefault((a['regional'], a['no']), []).extend(a['items'])
        for r in records:
            r['kode_laporan'] = ''

        print("  Ditemukan %d record laporan dan %d korektor master." % (len(records), len(korektor_master)))
        inserted = rebuild_db(records, lookup, index_records, korektor_master)
        print("  Berhasil import %d laporan ke SQLite." % inserted)

    print("\nMenyetel password admin...")
    set_password()

    print("\nSelesai! Database siap digunakan.")
    print("Jalankan: python app.py")
    print("Akses dashboard: http://localhost:5000/")


if __name__ == '__main__':
    main()