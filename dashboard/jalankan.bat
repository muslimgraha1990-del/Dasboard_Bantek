@echo off
cd /d "%~dp0"
echo ============================================================
echo  Monitoring Laporan Bantuan Teknis - Menjalankan Dashboard
echo ============================================================
echo.
echo  Alat bantu:
echo    reset_password.bat   - reset password admin
echo    sync_excel.bat       - sinkron ulang database dari Excel
echo.
echo ============================================================
if not exist bantek.db (
    echo Database belum ada, membangun dari Excel...
    python init_db.py
)
python app.py
pause
