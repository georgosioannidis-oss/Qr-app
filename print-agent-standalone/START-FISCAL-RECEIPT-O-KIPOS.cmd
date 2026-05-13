@echo off
REM QR Menu Fiscal Receipt Printer for O-Kipos
REM Prints Greek fiscal receipts (PHM compliant) for every new payment.
REM 1) Place this file in your print-agent-standalone folder (next to print-agent.mjs).
REM 2) In the print-agent-standalone folder, run "npm install" once in a terminal.
REM 3) Double-click this file to start. Leave the window open.
REM 4) Fiscal receipts will be sent to your PowerOn printer.

REM ---------- Pre-filled from server — no editing needed ----------
set "PRINT_AGENT_API_SECRET=fHt+Oz12X7yywZf/Y34nQpyFVMzZ2AN4ZnE+nuDRwIOrlDUOKvJ4tfACj3koMDR0"
set "PRINT_AGENT_BASE_URL=https://scannorder.ink"
set "PRINT_AGENT_RESTAURANT_SLUG=o-kipos"
set "PRINT_AGENT_STATION=fiscal"

REM ---------- Configure these for your setup ----------
REM For USB/COM printer, set COM port (e.g. COM3). For network printer, set IP and port.
REM set "PRINT_AGENT_RAW_HOST=192.168.1.100"
REM set "PRINT_AGENT_RAW_PORT=9100"

REM For Windows print command, uncomment and set printer name:
REM set "PRINT_COMMAND=powershell -Command "Get-Content '{file}' | Out-Printer -Name 'PowerOn USB Printer'""

REM PDF directory for debug output
set "PRINT_AGENT_PDF_DIR=%USERPROFILE%\o-kipos-fiscal-receipts"

REM Polling interval in milliseconds (default 5000 = 5 seconds)
set "PRINT_AGENT_POLL_MS=5000"

echo.
echo Starting fiscal receipt printer for O-Kipos...
echo Receipts will be saved to: %PRINT_AGENT_PDF_DIR%
echo.
echo When ready, press ENTER to start polling for fiscal print jobs.
echo Close this window to stop.
echo.
pause

node "%~dp0print-agent.mjs"
pause
