@echo off
cd /d "%~dp0"
echo ============================================================
echo  Monitoring Laporan Bantuan Teknis - Menjalankan Dashboard
echo ============================================================
if not exist bantek.db (
    echo Database belum ada, membangun dari Excel...
    python init_db.py
)
python app.py
pause
