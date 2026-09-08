/**
 * Client-Side & Local Copilot Synthesis Engine
 * Provides instant, zero-latency CLI commands, employee replies,
 * and escalation handover notes for IT technicians.
 */

import { Action, TicketResolution } from '../types';

export function generateClientSideCopilot(
  promptType: 'commands' | 'customer_reply' | 'escalation_note',
  result: TicketResolution,
  isEscalated: boolean
): string {
  const q = (result.query || '').toLowerCase();
  const cat = result.category;
  const urg = result.urgency;

  if (promptType === 'commands') {
    // 1. Zoom / macOS Permissions / TCC
    if (/zoom|screen\s*rec|macos|mac|tcc|monterey|ventura|sonoma|sequoia/i.test(q)) {
      return `### macOS Terminal Diagnostic & Permissions Reset

1. **Reset Screen Capture Privacy Permissions (TCC)**
\`\`\`bash
tccutil reset ScreenCapture us.zoom.xos
\`\`\`

2. **Directly Launch macOS Privacy & Security Settings**
\`\`\`bash
open "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"
\`\`\`

3. **Purge Corrupted Application Caches**
\`\`\`bash
rm -rf ~/Library/Caches/us.zoom.xos ~/Library/Logs/zoom*
\`\`\`

4. **Verify Active Process & Architecture**
\`\`\`bash
pgrep -fl "zoom" && uname -m
\`\`\``;
    }

    // 2. Print Spooler / Stuck Queue
    if (/print|spooler|queue|paper|stuck/i.test(q)) {
      return `### Windows PowerShell Print Spooler Recovery (Run as Administrator)

1. **Force Terminate Hung Print Spooler Service**
\`\`\`powershell
Stop-Service -Name "Spooler" -Force
\`\`\`

2. **Purge Corrupted Spooler Files**
\`\`\`powershell
Remove-Item -Path "$env:SystemRoot\\System32\\spool\\PRINTERS\\*" -Force -Recurse -ErrorAction SilentlyContinue
\`\`\`

3. **Restart Print Spooler and Confirm Running State**
\`\`\`powershell
Start-Service -Name "Spooler"
Get-Service -Name "Spooler" | Select-Object Name, Status, StartType
\`\`\`

4. **Inspect Printer Port Status**
\`\`\`powershell
Get-PrinterPort | Where-Object { $_.Description -match "TCP" }
\`\`\``;
    }

    // 3. BitLocker / TPM / BIOS
    if (/bitlocker|recovery\s*key|tpm|bios|firmware/i.test(q)) {
      return `### Windows PowerShell BitLocker & TPM Diagnostics (Admin)

1. **Check BitLocker Encryption & Protection Status**
\`\`\`powershell
manage-bde -status C:
\`\`\`

2. **Verify Hardware TPM Ready & Activated State**
\`\`\`powershell
Get-Tpm
\`\`\`

3. **Backup Key Protectors to Active Directory / Azure AD**
\`\`\`powershell
(Get-BitLockerVolume -MountPoint "C:").KeyProtector | Format-Table KeyProtectorId, KeyProtectorType
\`\`\`

4. **Suspend BitLocker for Clean Firmware Updates (Re-enables on next boot)**
\`\`\`powershell
Suspend-BitLocker -MountPoint "C:" -RebootCount 1
\`\`\``;
    }

    // 4. VPN / Network / Wi-Fi / DNS
    if (/vpn|wifi|network|dns|disconnect|timeout|gateway|dhcp|ip/i.test(q)) {
      return `### Network & VPN Connectivity Diagnostics

1. **Flush & Re-register Windows DNS Cache**
\`\`\`powershell
Clear-DnsClientCache
ipconfig /flushdns
\`\`\`

2. **Release and Renew DHCP Lease**
\`\`\`powershell
ipconfig /release
ipconfig /renew
\`\`\`

3. **Test Enterprise VPN Gateway Latency & Port Reachability**
\`\`\`powershell
Test-NetConnection -ComputerName vpn.corporate.com -Port 443
\`\`\`

4. **macOS Flush DNS & Reset mDNSResponder**
\`\`\`bash
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
\`\`\``;
    }

    // 5. Memory / WSL2 / Docker / High RAM
    if (/memory|vmmem|docker|wsl|ram|freeze|freezing/i.test(q)) {
      return `### WSL2 & Docker Host Resource Recovery

1. **Gracefully Terminate All Running WSL2 Virtual Machines**
\`\`\`powershell
wsl --shutdown
\`\`\`

2. **Cap WSL2 Memory Consumption via .wslconfig (4GB limit)**
\`\`\`powershell
Set-Content "$env:USERPROFILE\\.wslconfig" "[wsl2]\`nmemory=4GB\`nprocessors=2\`nswap=2GB"
\`\`\`

3. **Prune Dangling Docker Images & Volumes**
\`\`\`powershell
docker system prune -af --volumes
\`\`\`

4. **Query Top 5 Memory Consuming Windows Processes**
\`\`\`powershell
Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 5 Name, @{Name="RAM (MB)";Expression={[math]::Round($_.WorkingSet/1MB,2)}}
\`\`\``;
    }

    // 6. Audio / Teams / Microphone
    if (/headset|audio|microphone|mic|teams|sound/i.test(q)) {
      return `### Windows Audio Endpoint & Driver Diagnostics

1. **Query Plugged-In Audio Devices**
\`\`\`powershell
Get-PnpDevice -Class "AudioEndpoint" | Where-Object { $_.Status -eq "OK" } | Format-Table FriendlyName, InstanceId
\`\`\`

2. **Restart Windows Audio Services**
\`\`\`powershell
Restart-Service -Name "AudioSrv" -Force
Restart-Service -Name "AudioEndpointBuilder" -Force
\`\`\`

3. **Open Sound Control Panel Applet**
\`\`\`powershell
mmsys.cpl
\`\`\``;
    }

    // 7. Battery / Power
    if (/battery|drain|power|charge|plugged/i.test(q)) {
      return `### Hardware Battery Health Analysis

1. **Generate Detailed Windows Battery Health Report**
\`\`\`powershell
powercfg /batteryreport /output "$env:USERPROFILE\\Desktop\\battery-report.html"
Start-Process "$env:USERPROFILE\\Desktop\\battery-report.html"
\`\`\`

2. **macOS Battery Cycle Count & Capacity Report**
\`\`\`bash
system_profiler SPPowerDataType | grep -E "Condition|Cycle Count|Maximum Capacity|State of Charge"
\`\`\``;
    }

    // Default general diagnostic commands
    return `### Tier-1 System Diagnostics

1. **Query Host System & Operating System Info**
\`\`\`powershell
Get-ComputerInfo | Select-Object OsName, OsVersion, WindowsVersion, TotalPhysicalMemory
\`\`\`

2. **Test External Connectivity & Gateway Ping**
\`\`\`powershell
Test-NetConnection -ComputerName 8.8.8.8 -InformationLevel Detailed
\`\`\`

3. **Inspect Top CPU-Intensive Processes**
\`\`\`powershell
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5 Name, CPU, Id
\`\`\``;
  }

  if (promptType === 'customer_reply') {
    if (isEscalated) {
      return `Hello,

Thank you for contacting Corporate IT Support regarding your ticket: "${result.query}".

Your ticket has been logged and escalated to our Tier-2 Engineering team for direct review (Incident Priority: ${urg}). Because this request involves physical hardware safety, elevated security authorizations, or non-standard diagnostics, an IT engineer has been assigned to inspect and handle this manually.

A technician will contact you directly via Microsoft Teams or email within our SLA window. If you are experiencing an urgent safety concern (such as smoke, sparks, or swelling batteries), please immediately disconnect the device from power and keep it in an isolated area.

Reference Ticket ID: ${result.ticket_id}
Escalation Status: Assigned to Tier-2 Engineering Queue

Best regards,
Corporate IT Service Desk`;
    }

    return `Hello,

Thank you for reaching out to Corporate IT Support regarding: "${result.query}".

We have identified the following verified solution from our enterprise knowledge base:

${result.answer}

If you encounter any difficulty following these instructions or if the symptom persists, please reply directly to this ticket for further assistance.

Ticket ID: ${result.ticket_id}
Resolution Status: Auto-Resolved

Best regards,
Corporate IT Helpdesk`;
  }

  if (promptType === 'escalation_note') {
    return `### Tier-2 Escalation Handover Note

- **Ticket Reference ID**: ${result.ticket_id}
- **Affected User / System Query**: "${result.query}"
- **Domain Category**: ${cat}
- **Assigned Urgency Tier**: ${urg}
- **Autonomous Policy Decision**: ${result.action}
- **Escalation Reason**: ${result.reason}
- **Safety Hazard Flag**: ${result.safety_hazard ? 'CRITICAL SAFETY HAZARD (Immediate onsite depot dispatch required)' : 'No physical hazard detected'}
- **Confidence Metric**: Grounded similarity ${Math.round(result.retrieval_confidence * 100)}%
- **Recommended Technician Action**:
  1. Review system telemetry logs and verify affected hardware serial / asset tag.
  2. ${result.safety_hazard ? 'Do not power on device. Quarantine battery/dock unit and supply spare loaner.' : 'Initiate remote session or contact user directly via Teams.'}
  3. Execute remediation checklist and update ticket work notes upon completion.`;
  }

  return `Copilot briefing for ticket ${result.ticket_id}: Category ${cat}, Urgency ${urg}. Proceed with standard triage.`;
}
