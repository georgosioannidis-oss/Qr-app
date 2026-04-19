QR MENU — PRINT AGENT (STANDALONE)
==================================

This folder is all a restaurant needs on a kitchen PC. It does NOT contain the
full QR Menu website — only a small script that talks to your live site and
prints station tickets.

REQUIREMENTS
------------
  • Node.js 18 or newer (https://nodejs.org)

WINDOWS — SIMPLEST WAY (NO TYPING COMMANDS EACH TIME)
------------------------------------------------------
  The script needs four pieces of info (your live site, a shared password,
  your venue slug, which station this PC is). Easiest: put them in a .cmd file.

  1) Unzip this folder somewhere (e.g. Desktop\qr-menu-print-agent).
  2) Copy START-PRINT-AGENT.example.cmd → START-PRINT-AGENT.cmd
  3) Right-click START-PRINT-AGENT.cmd → Edit, change ONLY the four lines under
     "EDIT BELOW", save.
  4) Open Command Prompt in this folder, run:  npm install   (once per PC)
  5) Double-click START-PRINT-AGENT.cmd whenever the kitchen PC should print.

  (START-PRINT-AGENT.cmd is ignored by git if you use the repo — so secrets
   are not committed by mistake.)

SERVER (ONE-TIME, HOSTING)
--------------------------
  Set on the Next.js server the same secret you will use on every print PC:

    PRINT_AGENT_API_SECRET=<long random string>

  Redeploy or restart the app after adding it. There is no per-PC token in the
  dashboard — only this shared secret plus your venue slug.

ONE-TIME SETUP ON EACH PC
-------------------------
  1. Unzip this folder anywhere (e.g. Desktop\qr-menu-print-agent).
  2. Open a terminal in this folder.
  3. Run:

       npm install

RUN THE AGENT (VALUES YOU SET ONCE — GOOD FOR STARTUP SHORTCUTS)
----------------------------------------------------------------
  You need your public site root, the server secret, your venue slug (same as
  in the dashboard URL /your-slug/dashboard), and the station for this PC.

  Linux / Mac (example — kitchen station):

    export PRINT_AGENT_BASE_URL="https://your-site.com"
    export PRINT_AGENT_API_SECRET="same-as-server-env"
    export PRINT_AGENT_RESTAURANT_SLUG="your-venue-slug"
    export PRINT_AGENT_STATION="kitchen"
    export PRINT_AGENT_PDF_DIR="$HOME/print-agent-pdfs"

    npm start

  Station must be exactly one of:  bar   cold-kitchen   kitchen

  Windows PowerShell:

    $env:PRINT_AGENT_BASE_URL="https://your-site.com"
    $env:PRINT_AGENT_API_SECRET="same-as-server-env"
    $env:PRINT_AGENT_RESTAURANT_SLUG="your-venue-slug"
    $env:PRINT_AGENT_STATION="kitchen"
    $env:PRINT_AGENT_PDF_DIR="$env:USERPROFILE\print-agent-pdfs"

    npm start

  Windows Startup folder: create a .cmd that cd's here, sets the same set
  variables, then runs npm start.

  • PRINT_AGENT_BASE_URL = site root only (no /dashboard/... path).
  • If PRINT_COMMAND is not set, PDFs are saved to PRINT_AGENT_PDF_DIR only
    (good for testing). To print automatically, set PRINT_COMMAND (see your
    host’s .env.example).

OPTIONAL
--------
  PRINT_AGENT_POLL_MS   — milliseconds between checks (default 5000)
  PRINT_AGENT_FONT_PATH — path to a .ttf font for Greek / special characters
  PRINT_COMMAND         — shell command to send each PDF to the printer;
                          use {file} where the PDF path should go.
