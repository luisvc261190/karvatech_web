echo off
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
echo.
echo ================================================
echo  Backend KARVATECH listo. Ejecuta:
echo    uvicorn main:app --reload --port 8000
echo ================================================