# EZAI / Porter — polling runner.
# Syncs GHL contacts (training reports) + backfills Voice-AI calls, recordings and
# scorecards into Supabase. Idempotent (upsert by id; skips recordings already stored),
# so it is safe to run on a schedule. Output is appended to poll.log.
#
# Run once manually:   powershell -NoProfile -ExecutionPolicy Bypass -File poll.ps1
# Scheduled every 15m: see register-poll.ps1

$ErrorActionPreference = "Continue"
$dir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $dir
$log = Join-Path $dir "poll.log"
$ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Add-Content $log "`n===== [$ts] poll start ====="

# 1. Contacts (training reports) -> public.contacts
& node "$dir\sync-contacts.js" *>> $log

# 2. Voice-AI calls + recordings + parsed scorecards -> public.calls
& node "$dir\backfill.js" *>> $log

$tsEnd = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content $log "===== [$tsEnd] poll end ====="
