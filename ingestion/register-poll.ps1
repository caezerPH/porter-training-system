# Registers a Windows Scheduled Task that runs poll.ps1 every 15 minutes.
# Run once:  powershell -NoProfile -ExecutionPolicy Bypass -File register-poll.ps1
# Remove:    Unregister-ScheduledTask -TaskName "EZAI-Porter-Poll" -Confirm:$false
#
# Runs as the current user while logged on. To run unattended (logged off), edit the
# task in Task Scheduler -> "Run whether user is logged on or not" (stores credentials).

$dir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$taskName = "EZAI-Porter-Poll"

$action = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$dir\poll.ps1`""

# Fire shortly after registration, then repeat every 15 minutes indefinitely.
$trigger = New-ScheduledTaskTrigger -Once -At ((Get-Date).AddMinutes(2)) `
  -RepetitionInterval (New-TimeSpan -Minutes 15)

$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable `
  -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 30)

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger `
  -Settings $settings -Description "Polls GHL -> Supabase (contacts + calls) every 15 min" -Force

Write-Host "Registered scheduled task '$taskName' (every 15 min)."
