import { KbDocument, KbChunk } from '../types';

export const RAW_KB_DOCUMENTS: KbDocument[] = [
  // --- Account & Access ---
  {
    kb_id: 'KB-ACC-001',
    category: 'Account & Access',
    issue: 'Self-Service Password Reset (SSPR)',
    question: 'How do I reset my forgotten Windows or corporate domain password?',
    resolution: 'Visit https://identity.company.internal/reset on any device or click "Forgot Password" on the Windows lock screen. Complete MFA verification via Okta/Authenticator, then enter a new 14+ character passphrase that has not been used in your last 10 passwords. Changes take 2 minutes to propagate across all corporate systems.',
    tags: ['password', 'reset', 'sspr', 'okta', 'login', 'account']
  },
  {
    kb_id: 'KB-ACC-002',
    category: 'Account & Access',
    issue: 'MFA / Multi-Factor Push Notification Failure',
    question: 'Why am I not receiving MFA push notifications on my phone to log in?',
    resolution: 'Ensure your phone is connected to cellular data or Wi-Fi and that Battery Saver mode has not restricted your Authenticator app. If push notifications do not appear, open the Authenticator app manually and enter the 6-digit rolling code into the login prompt. If your device was recently upgraded, submit a temporary bypass code request to the IT Service Desk.',
    tags: ['mfa', 'push', 'authenticator', '2fa', 'security', 'login']
  },
  {
    kb_id: 'KB-ACC-003',
    category: 'Account & Access',
    issue: 'Account Locked Out from Multiple Failed Attempts',
    question: 'My Windows corporate account is locked after typing the wrong password.',
    resolution: 'Accounts automatically unlock after a 15-minute cooldown period provided no additional invalid attempts occur. If you are actively blocked from working, verify that other mobile devices or cached credentials (such as Outlook on phone or mapped network drives) are not spamming old passwords in the background. Contact IT Service Desk for an immediate administrative unlock.',
    tags: ['locked', 'lockout', 'bad password', 'cooldown', 'account']
  },
  {
    kb_id: 'KB-ACC-004',
    category: 'Account & Access',
    issue: 'Corporate Domain Password Expiration Notice',
    question: 'My password is about to expire or has expired and I am working remotely.',
    resolution: 'Connect to the corporate VPN before your password expires. Press Ctrl+Alt+Del (or macOS equivalent lock options) and select "Change Password". If your password has already lapsed and VPN blocks your credentials, access the web-based self-service portal at https://sso.company.internal to complete the update without active VPN.',
    tags: ['expired', 'expiration', 'remote', 'vpn', 'domain']
  },
  {
    kb_id: 'KB-ACC-005',
    category: 'Account & Access',
    issue: 'Shared Mailbox Access and Permission Request',
    question: 'How do I request read or send-as access to a department shared mailbox in Outlook?',
    resolution: 'Submit an Access Request ticket with your department manager approval in ServiceNow. Once granted by Identity Management, restart Outlook. In Outlook desktop, go to File > Account Settings > More Settings > Advanced > Add and enter the shared mailbox address. It will appear under your folder navigation pane within 30 minutes.',
    tags: ['shared mailbox', 'outlook', 'permissions', 'email', 'send-as']
  },
  {
    kb_id: 'KB-ACC-006',
    category: 'Account & Access',
    issue: 'Temporary Local Admin Rights Request',
    question: 'How do I run a developer installer that requires local administrator elevation?',
    resolution: 'Corporate policy restricts permanent local administrator privileges. Launch the "MakeMeAdmin" utility installed in your taskbar tray, click "Request Elevation", and provide a legitimate business justification. Your account will receive temporary local administrative privileges on your assigned laptop for 60 minutes.',
    tags: ['admin', 'elevation', 'privileges', 'makemeadmin', 'installer', 'uac']
  },

  // --- Network ---
  {
    kb_id: 'KB-NET-001',
    category: 'Network',
    issue: 'Corporate VPN Keeps Disconnecting or Timing Out',
    question: 'My Cisco AnyConnect / GlobalProtect VPN disconnects every few minutes.',
    resolution: 'First, test your local home Wi-Fi stability by connecting directly via Ethernet cable or rebooting your home router. In your VPN client settings, toggle from SSL to IPsec/IKEv2 mode if permitted by your ISP. Ensure you do not have split-tunneling disabled by third-party personal antivirus firewalls. Flush DNS by running "ipconfig /flushdns" in Command Prompt.',
    tags: ['vpn', 'cisco', 'globalprotect', 'disconnect', 'timeout', 'remote']
  },
  {
    kb_id: 'KB-NET-002',
    category: 'Network',
    issue: 'Guest Wi-Fi Connection and Captive Portal',
    question: 'How do visitors or personal devices connect to the Guest Wi-Fi network?',
    resolution: 'Connect to SSID "Corp-Guest". A captive portal browser window should automatically open; if it does not, open a browser and navigate to http://neverssl.com. Accept the terms of service and enter a sponsor employee email address. An authorization link valid for 24 hours will be delivered to the sponsor for one-click approval.',
    tags: ['wifi', 'guest', 'visitor', 'captive portal', 'wireless', 'network']
  },
  {
    kb_id: 'KB-NET-003',
    category: 'Network',
    issue: 'Corporate Wi-Fi 802.1X Certificate Authentication',
    question: 'My laptop cannot connect to "Corp-Secure" Wi-Fi and says certificate invalid.',
    resolution: 'Corporate Wi-Fi requires a valid machine certificate deployed through Microsoft Intune / Jamf. Connect temporarily to "Corp-Guest", open Company Portal (or Self Service on Mac), and trigger a device compliance sync. Ensure your device system clock is synchronized to internet time; a clock drift greater than 5 minutes causes 802.1X certificate handshake rejections.',
    tags: ['wifi', '802.1x', 'certificate', 'intune', 'wireless', 'corp-secure']
  },
  {
    kb_id: 'KB-NET-004',
    category: 'Network',
    issue: 'Internal Website DNS Resolution Failure',
    question: 'Internal intranet and staging servers return DNS lookup failed errors.',
    resolution: 'When connected to corporate VPN or office Wi-Fi, verify that custom public DNS (such as 8.8.8.8 or 1.1.1.1) is not hardcoded on your network adapter properties. In Windows Network Settings, verify IPv4 DNS is set to "Obtain DNS server address automatically". Run "ipconfig /flushdns" and restart your browser session.',
    tags: ['dns', 'resolution', 'intranet', 'lookup', 'internal site']
  },
  {
    kb_id: 'KB-NET-005',
    category: 'Network',
    issue: 'Office Desk Ethernet Port Patch Request',
    question: 'The RJ-45 Ethernet jack on my desk is unpatched with no link lights.',
    resolution: 'Note the alphanumeric port identifier stamped on the physical wall/desk faceplate (e.g. 2F-D14-04). Submit an infrastructure ticket citing your desk location and port ID. Network operations will patch the jack to the appropriate switch VLAN within 4 business hours. Use Corp-Secure Wi-Fi in the interim.',
    tags: ['ethernet', 'port', 'jack', 'rj45', 'cable', 'vlan', 'desk']
  },
  {
    kb_id: 'KB-NET-006',
    category: 'Network',
    issue: 'Remote Desktop Protocol (RDP) High Latency or Freezing',
    question: 'Remote Desktop connection to my office workstation is lagging or sluggish.',
    resolution: 'In your Remote Desktop Connection options, navigate to the Experience tab and switch the connection speed dropdown to "Low-speed broadband (256 kbps - 2 Mbps)". This disables desktop background wallpaper, menu animations, and font smoothing. Also uncheck "Printers" under Local Resources to prevent unnecessary background print queue synchronization.',
    tags: ['rdp', 'remote desktop', 'lag', 'latency', 'freeze', 'slow']
  },

  // --- Hardware ---
  {
    kb_id: 'KB-HW-001',
    category: 'Hardware',
    issue: 'Laptop Battery Drains Rapidly or Loses Charge',
    question: 'My corporate laptop battery drains completely in less than 90 minutes.',
    resolution: 'Check Task Manager for rogue background processes consuming high CPU or discrete GPU resources. Run a battery health diagnostic: open Command Prompt as admin and type "powercfg /batteryreport /output C:\\battery.html". Review the full charge capacity versus design capacity. If capacity has degraded below 65%, IT will order a replacement battery or swap your unit.',
    tags: ['battery', 'drain', 'laptop', 'power', 'charge', 'hardware']
  },
  {
    kb_id: 'KB-HW-002',
    category: 'Hardware',
    issue: 'Laptop Will Not Turn On (Hard Power Reset)',
    question: 'My laptop screen remains black and power light will not engage when pressed.',
    resolution: 'Perform a hardware power drain: disconnect the USB-C charger, docking station, and all peripherals. Press and hold down the physical power button continuously for a full 30 seconds. Release the button, wait 5 seconds, reconnect only the OEM AC power adapter, and press the power button once. If charging LED does not illuminate amber or white, the motherboard or power adapter requires depot service.',
    tags: ['power', 'laptop', 'turn on', 'black screen', 'hard reset', 'hardware']
  },
  {
    kb_id: 'KB-HW-003',
    category: 'Hardware',
    issue: 'External Monitor No Signal / Display Not Detected',
    question: 'My secondary desk monitor shows "No Cable Connected" or "No Signal".',
    resolution: 'Power cycle the monitor by unplugging its power cord for 15 seconds. Ensure the video cable (HDMI or DisplayPort) is firmly seated in the dock. Press Windows Key + P and verify "Extend" is selected rather than "PC screen only". In Windows Settings > System > Display, click the "Detect" button. If using macOS, open System Settings > Displays and hold the Option key to click "Detect Displays".',
    tags: ['monitor', 'display', 'screen', 'hdmi', 'displayport', 'no signal']
  },
  {
    kb_id: 'KB-HW-004',
    category: 'Hardware',
    issue: 'USB-C Docking Station Peripheral Disconnects',
    question: 'Keyboard, mouse, and ethernet randomly disconnect from the desk dock.',
    resolution: 'Firmware updates for Dell WD19 and HP G5 docks resolve USB negotiation drops. Disconnect all peripherals and laptop, unplug dock power for 60 seconds, and reconnect. Install the latest dock firmware via Dell Command Update or HP Image Assistant. Always plug the USB-C dock into the laptop Thunderbolt/Power Delivery port marked with a lightning or plug icon.',
    tags: ['dock', 'usb-c', 'docking station', 'peripherals', 'disconnect', 'dell', 'hp']
  },
  {
    kb_id: 'KB-HW-005',
    category: 'Hardware',
    issue: 'Network Printer Offline or Clearing Print Spooler',
    question: 'My print jobs are stuck in queue and the office printer status says Offline.',
    resolution: 'To clear a frozen print spooler: open Command Prompt as administrator and run "net stop spooler", then delete all temporary queue files in "C:\\Windows\\System32\\spool\\PRINTERS", and run "net start spooler". If printing to a shared office MFP, verify you have PaperCut or badge-release active on your user profile.',
    tags: ['printer', 'print', 'spooler', 'offline', 'papercut', 'queue']
  },
  {
    kb_id: 'KB-HW-006',
    category: 'Hardware',
    issue: 'Headset Microphone Muted or Low Input Volume',
    question: 'Coworkers cannot hear me on Teams or Zoom calls using my USB headset.',
    resolution: 'Verify the physical inline mute toggle switch on the headset cord is not illuminated red. Open Windows Sound Settings > Input and ensure the headset is set as both "Default device" and "Default communication device". In Windows Privacy settings, ensure "Allow desktop apps to access your microphone" is toggled ON. Test your voice in Teams Settings > Devices > Make a test call.',
    tags: ['microphone', 'headset', 'audio', 'sound', 'mute', 'teams', 'zoom']
  },
  {
    kb_id: 'KB-HW-007',
    category: 'Hardware',
    issue: 'Physical Safety: Burning Smell, Sparks, or Swollen Battery',
    question: 'My laptop smells like burning plastic, is smoking, or the chassis has bulged.',
    resolution: 'CRITICAL SAFETY HAZARD: Immediately disconnect the charger and power down the device if safe to do so. Place the laptop on a non-flammable surface away from papers or fabrics. Do NOT attempt to charge or carry the device. Evacuate the immediate area if smoke or sparks appear, alert facilities/safety officers, and notify IT hardware depot for safe lithium-ion disposal.',
    tags: ['smoke', 'fire', 'spark', 'smell', 'hot', 'swollen', 'battery', 'safety', 'danger']
  },

  // --- Software ---
  {
    kb_id: 'KB-SW-001',
    category: 'Software',
    issue: 'Installing Approved Software via Company Self-Service Portal',
    question: 'How do I install software like VS Code, Docker, or Figma without IT admin credentials?',
    resolution: 'All pre-approved corporate software packages are deployed via Company Portal (Windows) or Jamf Self Service (macOS). Open the Start Menu, launch "Company Portal", search for the requested software in the Catalog, and click Install. Applications install silently with elevated administrative rights in the background without requiring ticket approval.',
    tags: ['software', 'install', 'company portal', 'self service', 'catalog', 'admin']
  },
  {
    kb_id: 'KB-SW-002',
    category: 'Software',
    issue: 'Microsoft Excel Crashing on Opening Macro Workbook',
    question: 'Excel closes immediately or crashes when opening an .xlsm macro workbook.',
    resolution: 'Open Excel in Safe Mode: hold the Ctrl key while launching Excel from the Start menu, then open the file. If it opens successfully, disable conflicting COM Add-ins via File > Options > Add-ins > COM Add-ins. If the file came from an internet download or email, right-click the file in File Explorer, select Properties, and check the "Unblock" security checkbox at the bottom.',
    tags: ['excel', 'crash', 'macro', 'xlsm', 'safe mode', 'add-ins']
  },
  {
    kb_id: 'KB-SW-003',
    category: 'Software',
    issue: 'Clearing Web Browser Cache and Stored Cookies',
    question: 'Web applications or corporate portals are displaying outdated pages or rendering bugs.',
    resolution: 'In Google Chrome or Microsoft Edge, press Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac). Set time range to "All time", check "Cookies and other site data" and "Cached images and files", then click Clear Data. Close all browser windows completely and relaunch. For single-tab hard refresh without clearing everything, press Ctrl+F5.',
    tags: ['browser', 'cache', 'cookies', 'chrome', 'edge', 'refresh', 'web']
  },
  {
    kb_id: 'KB-SW-004',
    category: 'Software',
    issue: 'macOS Screen Recording and Screen Share Permissions',
    question: 'I cannot share my screen in Microsoft Teams, Zoom, or Google Meet on my Mac.',
    resolution: 'macOS requires explicit OS-level security authorization. Go to Apple menu > System Settings > Privacy & Security > Screen & System Audio Recording. Ensure Microsoft Teams / Zoom is toggled ON. You must fully quit and reopen the meeting application for permission changes to take effect.',
    tags: ['screen share', 'macos', 'permissions', 'zoom', 'teams', 'privacy']
  },
  {
    kb_id: 'KB-SW-005',
    category: 'Software',
    issue: 'Adobe Acrobat Reader Invalid Digital Signature',
    question: 'Adobe PDF Reader shows "At least one signature has problems" on signed contracts.',
    resolution: 'Open Adobe Acrobat, go to Edit > Preferences > Signatures. Under "Verification", click More, and check "Automatically verify signatures when the document is opened". Under Trust Anchor, ensure the Corporate Root CA certificate is imported into Windows Trusted Root Authorities. Restart Acrobat to re-verify the certificate trust chain.',
    tags: ['adobe', 'acrobat', 'pdf', 'signature', 'digital signature', 'certificate']
  },
  {
    kb_id: 'KB-SW-006',
    category: 'Software',
    issue: 'Endpoint Security Agent (CrowdStrike / SentinelOne) High CPU',
    question: 'My computer fan is loud and a security agent is consuming 90% CPU.',
    resolution: 'Security agents periodically perform on-demand scans of newly modified developer folders or virtual environments (e.g. node_modules, Python venvs, Docker containers). Open an IT ticket requesting directory exclusions for your local software development repository. Do not attempt to terminate the Falcon/SentinelOne service as tamper protection will flag an alert.',
    tags: ['antivirus', 'crowdstrike', 'cpu', 'fan', 'slow', 'security agent', 'falcon']
  },
  {
    kb_id: 'KB-SW-007',
    category: 'Software',
    issue: 'OneDrive / SharePoint Cloud Sync Conflict',
    question: 'OneDrive shows a red X badge and file sync conflict error.',
    resolution: 'Click the OneDrive cloud icon in your system tray, open the sync conflict notification, and choose whether to keep your local copy, the server copy, or combine both as separate filenames. If sync remains frozen, reset the OneDrive engine by pressing Win+R, typing "%localappdata%\\Microsoft\\OneDrive\\onedrive.exe /reset", and pressing Enter.',
    tags: ['onedrive', 'sharepoint', 'sync', 'conflict', 'cloud', 'files']
  },

  // --- Productivity ---
  {
    kb_id: 'KB-PRD-001',
    category: 'Productivity',
    issue: 'Outlook Calendar Synchronization Delay',
    question: 'Meetings accepted on my mobile phone do not show on desktop Outlook.',
    resolution: 'In desktop Outlook, click Send / Receive > Update Folder. If synchronization is still delayed, go to File > Account Settings > Account Settings > double click your email account > uncheck "Use Cached Exchange Mode" to run in direct online mode, or slide the cache slider to "All". Restart Outlook.',
    tags: ['outlook', 'calendar', 'sync', 'meeting', 'exchange']
  },
  {
    kb_id: 'KB-PRD-002',
    category: 'Productivity',
    issue: 'Microsoft Teams Desktop Notifications Not Alerting',
    question: 'I am missing Teams direct messages because pop-up banner notifications do not appear.',
    resolution: 'In Teams, click Settings (three dots) > Notifications and ensure "Missed activity emails" and "Chat notifications" are set to Banner. In Windows Settings > System > Focus Assist, verify Focus Assist is turned OFF (or set to Priority Only) and that Windows Notifications for Microsoft Teams are toggled ON.',
    tags: ['teams', 'notifications', 'pop-up', 'banner', 'focus assist', 'alerts']
  },
  {
    kb_id: 'KB-PRD-003',
    category: 'Productivity',
    issue: 'Slack Notification Mute and Do-Not-Disturb Schedule',
    question: 'How do I automatically silence Slack notifications during focused work or after hours?',
    resolution: 'In Slack, click your profile avatar in the sidebar, select "Pause notifications", and choose "Set a notification schedule". Configure your working hours (e.g., Weekdays 9:00 AM to 6:00 PM). Outside this schedule, Slack will automatically suppress mobile and desktop alerts while displaying a crescent moon icon to colleagues.',
    tags: ['slack', 'dnd', 'notifications', 'mute', 'schedule', 'focus']
  },
  {
    kb_id: 'KB-PRD-004',
    category: 'Productivity',
    issue: 'Corporate Email Signature Branding Setup',
    question: 'How do I apply the company standard branded HTML signature with logo?',
    resolution: 'Download the official marketing HTML template from the intranet portal at https://brand.company.internal/email-signatures. Open Outlook desktop > File > Options > Mail > Signatures. Create a new signature named "Default Corporate", paste the formatted template, and replace the placeholder fields with your name, department, and phone number. Set it as default for new messages.',
    tags: ['email', 'signature', 'outlook', 'branding', 'template', 'logo']
  },
  {
    kb_id: 'KB-PRD-005',
    category: 'Productivity',
    issue: 'Conference Meeting Room AV Screen Casting',
    question: 'How do I wireless cast my laptop display to the conference room TV screen?',
    resolution: 'Ensure your laptop is connected to "Corp-Secure" Wi-Fi. In the conference room, turn on the TV and observe the 4-digit AirPlay/Miracast code on the room display. On Windows, press Win+K to open the Cast menu and click the room name. On Mac, open Control Center > Screen Mirroring. Enter the 4-digit PIN when prompted.',
    tags: ['meeting room', 'tv', 'casting', 'airplay', 'miracast', 'conference', 'screen']
  },

  // --- Facility ---
  {
    kb_id: 'KB-FAC-001',
    category: 'Facility',
    issue: 'Desk Ergonomic Assessment and Equipment Request',
    question: 'How do I request a sit-stand desk converter or ergonomic chair for back pain?',
    resolution: 'Log in to the Facilities Service Portal under "Ergonomic & Workplace Requests". Complete the self-evaluation checklist regarding monitor height and lumbar posture. Requests for specialized ergonomic chairs, vertical mice, or motorized standing desks require approval from your manager and HR Benefits, and are typically delivered within 5 business days.',
    tags: ['ergonomic', 'desk', 'chair', 'standing desk', 'facilities', 'back pain']
  },
  {
    kb_id: 'KB-FAC-002',
    category: 'Facility',
    issue: 'Office Climate Control / HVAC Thermostat Adjustment',
    question: 'Our department office zone is excessively cold or hot.',
    resolution: 'Office floor temperatures are managed via automated building automation systems set to standard 70°F - 72°F (21°C - 22°C). Individual wall thermostats are locked or read-only sensor probes. If a floor zone feels extreme, submit a Facilities temperature ticket noting the building, floor, and nearest pillar/quadrant number for Facilities engineering to balance the VAV dampers.',
    tags: ['temperature', 'cold', 'hot', 'hvac', 'ac', 'heating', 'thermostat', 'facility']
  },
  {
    kb_id: 'KB-FAC-003',
    category: 'Facility',
    issue: 'Whiteboard Supplies and Office Stationery Restock',
    question: 'Meeting rooms on our floor are out of dry-erase whiteboard markers and erasers.',
    resolution: 'Each floor maintains a central supply closet near the print station (room code typically 1234*). Extra whiteboard markers, magnetic erasers, cleaning spray, sticky notes, and printer paper reams are freely available there. If supplies in the closet are depleted, ping the Facilities floor coordinator.',
    tags: ['whiteboard', 'markers', 'stationery', 'supplies', 'meeting room', 'facility']
  },
  {
    kb_id: 'KB-FAC-004',
    category: 'Facility',
    issue: 'Employee Physical Access Badge Lost or Deactivated',
    question: 'I lost my plastic badge or it no longer beeps to unlock office turnstiles.',
    resolution: 'Report lost badges immediately to Security Desk at ext. 4357 so the RFID chip can be deactivated. Visit the Security Reception on Floor 1 with government-issued photo ID (driver license or passport) to obtain a replacement badge. A temporary single-day visitor badge can be issued in 5 minutes.',
    tags: ['badge', 'access', 'card', 'rfid', 'door', 'lost', 'turnstile', 'security']
  },
  {
    kb_id: 'KB-FAC-005',
    category: 'Facility',
    issue: 'Server Room Physical Escort and Access Authorization',
    question: 'How do external contractors or technicians enter the data center server room?',
    resolution: 'The server room is classified as a Tier 3 secure restricted zone. Access requires an approved change management ticket signed by IT Infrastructure and Security. All personnel entering must sign the physical visitor log at reception, be accompanied by a badged IT escort at all times, and wear cleanroom boot covers.',
    tags: ['server room', 'data center', 'access', 'escort', 'contractor', 'security']
  },

  // --- Internet-Researched Enterprise IT Articles ---
  {
    kb_id: 'KB-ACC-007',
    category: 'Account & Access',
    issue: 'Okta FastPass & Device Trust Certificate Registration Failure',
    question: 'Why does Okta FastPass say "Device could not be verified" or fail passwordless biometric sign-in?',
    resolution: 'Okta FastPass requires a client certificate signed by your corporate MDM (Jamf or Intune). First, open Okta Verify > Settings > Account and click "Re-enroll biometric". If the failure persists, verify that your corporate root CA certificate is trusted in macOS Keychain or Windows Certificate Store. Run "certlm.msc" on Windows or check Jamf Self Service to reinstall the "Okta CA Device Identity Profile".',
    tags: ['okta', 'fastpass', 'device trust', 'certificate', 'passwordless', 'biometrics', 'mdm'],
    source_url: 'https://help.okta.com/en-us/content/topics/miscellaneous/okta-verify-faq.htm',
    is_web_researched: true,
    date_added: '2026-09-08'
  },
  {
    kb_id: 'KB-ACC-008',
    category: 'Account & Access',
    issue: 'Microsoft Entra ID / Intune Conditional Access Device Compliance Quarantine',
    question: 'My laptop says "You cannot access this right now - Your device is not compliant with your organization\'s policies".',
    resolution: 'Open Company Portal app (Windows) or Company Portal (macOS) and click "Check Access" or "Verify Compliance". Common triggers: missing OS security update (minimum macOS Sonoma or Windows 11 build 22631+), BitLocker encryption disabled, or antivirus definitions older than 7 days. Once the OS update or reboot is completed, re-run Company Portal sync; quarantine releases within 5 minutes.',
    tags: ['entra', 'intune', 'compliance', 'conditional access', 'quarantine', 'company portal', 'blocked'],
    source_url: 'https://learn.microsoft.com/en-us/mem/intune/user-help/check-for-device-updates',
    is_web_researched: true,
    date_added: '2026-09-08'
  },
  {
    kb_id: 'KB-NET-007',
    category: 'Network',
    issue: 'Windows 11 Wi-Fi 7 / 802.11be WPA3 Enterprise Roaming Connection Drops',
    question: 'My laptop frequently disconnects from the corporate office Wi-Fi or shows "Can\'t connect to this network".',
    resolution: 'Modern Wi-Fi 7 / 6E Intel AX211/BE200 chips can experience 6GHz band roaming conflicts with older 802.11r/k access points. Open Device Manager > Network Adapters > Intel Wi-Fi > Advanced. Set "802.11n/ac/ax/be Wireless Mode" to 802.11ax fallback, or change "Roaming Aggressiveness" to "3. Medium". Ensure Intel Wi-Fi Driver package 23.60+ is installed from Company Portal.',
    tags: ['wifi', 'roaming', 'intel', 'wpa3', 'disconnect', 'wifi7', 'network', 'driver'],
    source_url: 'https://www.intel.com/content/www/us/en/support/articles/000005585/wireless.html',
    is_web_researched: true,
    date_added: '2026-09-08'
  },
  {
    kb_id: 'KB-NET-008',
    category: 'Network',
    issue: 'Zscaler / Cloudflare WARP Zero Trust Client MTU Packet Fragmentation',
    question: 'Webpages time out, SSH hangs on connection, or large file uploads fail when Zscaler/WARP VPN is on.',
    resolution: 'Zero Trust tunnel encapsulation adds packet headers that exceed standard 1500-byte MTU limits, causing silent black-hole packet drops. In Windows PowerShell (admin), run: "netsh interface ipv4 show subinterfaces" then "netsh interface ipv4 set subinterface \\"Zscaler\\" mtu=1360 store=persistent". On macOS, open Terminal and run "sudo ifconfig utun3 mtu 1360". Restart your browser.',
    tags: ['zscaler', 'warp', 'mtu', 'packet loss', 'ssh hang', 'zero trust', 'timeout'],
    source_url: 'https://help.zscaler.com/client-connector/configuring-mtu-size',
    is_web_researched: true,
    date_added: '2026-09-08'
  },
  {
    kb_id: 'KB-HW-008',
    category: 'Hardware',
    issue: 'BitLocker Recovery Key Prompt Triggered after BIOS / Firmware Patch',
    question: 'Blue screen asking for a 48-digit BitLocker recovery key after rebooting my Windows laptop.',
    resolution: 'A recent BIOS/UEFI firmware or TPM update invalidated the Platform Configuration Registers (PCR) hash. Do NOT attempt to format the disk. Sign in to https://myaccount.microsoft.com/device-list or https://aka.ms/myrecoverykey on your mobile phone with your corporate credentials to retrieve your 48-digit numerical recovery key. Once in Windows, open PowerShell as admin and run "manage-bde -protectors -enable C:" to rebind TPM keys.',
    tags: ['bitlocker', 'recovery key', 'tpm', 'bios', 'blue screen', 'encryption', 'pcr'],
    source_url: 'https://support.microsoft.com/en-us/windows/finding-your-bitlocker-recovery-key-in-windows-6b71f343-0567-9096-3574-b7c1a526ee77',
    is_web_researched: true,
    date_added: '2026-09-08'
  },
  {
    kb_id: 'KB-HW-009',
    category: 'Hardware',
    issue: 'Apple Silicon MacBook Dual External Display MST Limitation & DisplayLink Workaround',
    question: 'My M1/M2/M3 base MacBook only mirrors the second external monitor on my USB-C dual-display dock.',
    resolution: 'Base Apple Silicon chips (M1, M2, M3 non-Pro/Max) only natively support one external display over Thunderbolt/HDMI and do not support DisplayPort Multi-Stream Transport (MST) daisy chaining. To run two independent external displays, connect the second monitor through a DisplayLink-certified adapter or dock and install the official "DisplayLink Manager" app for macOS from Company Portal, granting Screen Recording permissions in System Settings.',
    tags: ['macbook', 'apple silicon', 'dual monitor', 'displaylink', 'mst', 'dock', 'mirroring', 'm2', 'm3'],
    source_url: 'https://support.displaylink.com/knowledgebase/articles/1932214-displaylink-manager-app-for-macos-introduction',
    is_web_researched: true,
    date_added: '2026-09-08'
  },
  {
    kb_id: 'KB-SW-008',
    category: 'Software',
    issue: 'CrowdStrike Falcon Sensor Channel File 291 Recovery & Safe Mode Remediation',
    question: 'Windows workstation blue screens with SYSTEM_THREAD_EXCEPTION_NOT_HANDLED (csagent.sys).',
    resolution: 'Boot Windows into Safe Mode or Windows Recovery Environment (WinRE) Command Prompt. Navigate to "C:\\Windows\\System32\\drivers\\CrowdStrike". Locate and delete the file matching "C-00000291*.sys" (e.g. `del C-00000291*.sys`). Reboot normally. The CrowdStrike agent will automatically download the updated channel file from the cloud with no further blue screens.',
    tags: ['crowdstrike', 'falcon', 'bsod', 'csagent.sys', 'blue screen', 'safe mode', 'recovery'],
    source_url: 'https://www.crowdstrike.com/blog/statement-on-falcon-content-update-for-windows-hosts/',
    is_web_researched: true,
    date_added: '2026-09-08'
  },
  {
    kb_id: 'KB-SW-009',
    category: 'Software',
    issue: 'Docker Desktop WSL2 vmmem Unbounded RAM Consumption & .wslconfig Capping',
    question: 'vmmemWSL process is consuming 95% of my host RAM and freezing Windows.',
    resolution: 'WSL2 dynamically allocates up to 50% of host RAM by default and does not always release cached page buffers back to Windows. Create a configuration file at "C:\\Users\\<YourUsername>\\.wslconfig" with the contents:\n[wsl2]\nmemory=6GB\nprocessors=4\nautoProxy=true\nThen open PowerShell and run "wsl --shutdown" to apply limits permanently.',
    tags: ['docker', 'wsl2', 'vmmem', 'ram', 'memory leak', 'wslconfig', 'slow', 'freeze'],
    source_url: 'https://learn.microsoft.com/en-us/windows/wsl/wsl-config#configure-global-options-with-wslconfig',
    is_web_researched: true,
    date_added: '2026-09-08'
  },
  {
    kb_id: 'KB-SW-010',
    category: 'Software',
    issue: 'macOS Sequoia Local Network Privacy Prompt Suppressing Internal Dev Tools & SSH',
    question: 'SSH connections to local servers, curl to local Docker ports, or printing fails on macOS Sequoia 15.',
    resolution: 'macOS 15 Sequoia introduced a strict "Local Network" permission sandbox for all apps and CLI terminals. Open System Settings > Privacy & Security > Local Network. Ensure Terminal, iTerm2, VS Code, and your VPN client toggles are switched to ON. If a CLI binary is not listed, run `sudo pkill -HUP mDNSResponder` or reset network permissions via `tccutil reset LocalNetwork`.',
    tags: ['macos', 'sequoia', 'local network', 'privacy', 'ssh', 'terminal', 'blocked', 'docker'],
    source_url: 'https://support.apple.com/guide/mac-help/control-access-to-your-local-network-mchl9d3d3446/mac',
    is_web_researched: true,
    date_added: '2026-09-08'
  },
  {
    kb_id: 'KB-SW-011',
    category: 'Software',
    issue: 'New Microsoft Outlook for Windows Missing Shared Mailboxes & Offline PST Archive Access',
    question: 'Switching to the "New Outlook" toggle caused my shared department mailboxes and PST archives to disappear.',
    resolution: 'The "New Outlook for Windows" is a progressive web-based client that does not yet support local PST archive files or legacy COM add-ins. To restore access: toggle the "New Outlook" switch in the top-right corner to OFF to return to Classic Outlook 365. For shared mailboxes in New Outlook, right-click "Folders" in the left sidebar > click "Add shared folder or mailbox" > type the shared mailbox address.',
    tags: ['outlook', 'new outlook', 'shared mailbox', 'pst', 'archive', 'missing', 'email'],
    source_url: 'https://support.microsoft.com/en-us/office/open-and-use-a-shared-mailbox-in-outlook-d94a8e9e-2176-4243-99d6-2449e2e0434e',
    is_web_researched: true,
    date_added: '2026-09-08'
  },
  {
    kb_id: 'KB-PRD-006',
    category: 'Productivity',
    issue: 'Zoom Workplace & Microsoft Teams Simultaneous Microphone Echo Cancellation Conflict',
    question: 'Colleagues report loud audio echo or stuttering when I switch between Zoom and Teams calls.',
    resolution: 'Running both Zoom and Microsoft Teams concurrently locks the audio core DSP device in exclusive mode. Quit Teams or Zoom completely from the system tray (right-click > Quit) when not in use. In your active client (e.g. Zoom), navigate to Settings > Audio > Advanced and set "Signal processing by Windows audio device drivers" to "Off (Raw audio)". Disable "Exclusive Mode" in Windows Sound Control Panel.',
    tags: ['zoom', 'teams', 'audio', 'echo', 'microphone', 'sound', 'stutter', 'meeting'],
    source_url: 'https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0065099',
    is_web_researched: true,
    date_added: '2026-09-08'
  },
  {
    kb_id: 'KB-PRD-007',
    category: 'Productivity',
    issue: 'Slack Desktop Hardware Acceleration Crash & GPU Cache Corrupt Purge',
    question: 'Slack Desktop opens to a blank black window or crashes whenever huddles/screenshares start.',
    resolution: 'Corrupt GPU shader caches in Electron commonly cause black screens. First, launch Slack from Command Prompt/Terminal with hardware acceleration disabled: `slack.exe --disable-gpu` (Windows) or `/Applications/Slack.app/Contents/MacOS/Slack --disable-gpu` (macOS). Once opened, go to Help > Troubleshooting > Clear Cache and Restart. In Slack Preferences > Advanced, uncheck "Hardware acceleration".',
    tags: ['slack', 'crash', 'black screen', 'hardware acceleration', 'gpu', 'huddle', 'cache'],
    source_url: 'https://slack.com/help/articles/205138367-Troubleshoot-Slack-for-desktop',
    is_web_researched: true,
    date_added: '2026-09-08'
  }
];

/**
 * Word-based chunker reproducing Phase 2a chunking logic:
 * Target words: 60, overlap: 15
 */
export function buildChunksFromKb(kbDocs: KbDocument[], chunkSize = 60, overlap = 15): KbChunk[] {
  const chunks: KbChunk[] = [];

  for (const doc of kbDocs) {
    const fullText = `Category: ${doc.category} | Issue: ${doc.issue}\nQ: ${doc.question}\nA: ${doc.resolution}`;
    const words = fullText.split(/\s+/).filter(Boolean);

    if (words.length <= chunkSize) {
      chunks.push({
        chunk_id: `${doc.kb_id}_0`,
        kb_id: doc.kb_id,
        category: doc.category,
        issue: doc.issue,
        tags: doc.tags.join(', '),
        chunk_index: 0,
        text: fullText,
      });
    } else {
      let start = 0;
      let chunkIdx = 0;
      while (start < words.length) {
        const end = start + chunkSize;
        const chunkWords = words.slice(start, end);
        const chunkText = chunkWords.join(' ');
        chunks.push({
          chunk_id: `${doc.kb_id}_${chunkIdx}`,
          kb_id: doc.kb_id,
          category: doc.category,
          issue: doc.issue,
          tags: doc.tags.join(', '),
          chunk_index: chunkIdx,
          text: chunkText,
        });
        chunkIdx++;
        if (end >= words.length) break;
        start = end - overlap;
      }
    }
  }

  return chunks;
}

export const PRECOMPUTED_CHUNKS: KbChunk[] = buildChunksFromKb(RAW_KB_DOCUMENTS);
