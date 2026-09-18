@echo off
cd /d "%~dp0"
echo ============================================================
echo  Menyinkronkan database dengan Excel KOREKTOR_3
echo  (Database lama akan di-backup otomatis)
echo ============================================================
python import_excel.py
pause