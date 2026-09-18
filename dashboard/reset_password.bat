@echo off
cd /d "%~dp0"
echo ============================================================
echo  Reset Password Admin Dashboard Monitoring Bantek
echo ============================================================
python init_db.py --reset-password
pause