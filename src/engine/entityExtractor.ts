/**
 * High-Precision Local Entity & Safety Hazard Extractor
 * Zero API quota, sub-millisecond execution, deterministic protection
 */

export interface ExtractedEntities {
  device?: string;
  os?: string;
  application?: string;
  issue_type?: string;
}

export interface ExtractionResult {
  safety_hazard: boolean;
  hazard_reason?: string;
  entities: ExtractedEntities;
  operational_summary: string;
}

export function extractEntitiesAndSafety(query: string): ExtractionResult {
  const q = query.toLowerCase();

  // 1. Safety Hazard Detection (Physical, electrical, fire risks)
  const isSmoke = /\b(smoke|smoking|fumes|smelling like smoke)\b/i.test(q);
  const isFire = /\b(fire|flame|flames|blaze|spark|sparks|sparking)\b/i.test(q);
  const isBurning = /\b(burning|burn smell|burnt|burning smell)\b/i.test(q);
  const isBatterySwelling = /\b(battery swelling|swollen battery|bulging|expanding battery|battery is hot|battery hot to touch)\b/i.test(q);
  const isElectrical = /\b(shock|electric shock|sparks flying|explosion|power surge damage)\b/i.test(q);

  const safety_hazard = isSmoke || isFire || isBurning || isBatterySwelling || isElectrical;
  let hazard_reason: string | undefined;
  if (safety_hazard) {
    if (isSmoke || isBurning) hazard_reason = 'Smoke or burning odor detected. Potential electrical or server room hazard.';
    else if (isBatterySwelling) hazard_reason = 'Lithium-ion battery swelling / thermal runaway risk. Halt use immediately.';
    else if (isFire || isElectrical) hazard_reason = 'Active fire, sparking, or electrical shock risk. Escalate to facilities & depot immediately.';
  }

  // 2. Hardware Device Identification
  let device: string | undefined;
  if (/\b(macbook\s*pro|macbook\s*air|macbook|mac\b|imac)/i.test(q)) device = 'Apple MacBook';
  else if (/\b(thinkpad|lenovo\s*thinkpad|lenovo)/i.test(q)) device = 'Lenovo ThinkPad';
  else if (/\b(dell\s*xps|dell\s*latitude|dell)/i.test(q)) device = 'Dell Latitude';
  else if (/\b(surface\s*pro|surface\s*laptop|microsoft\s*surface)/i.test(q)) device = 'Microsoft Surface';
  else if (/\b(iphone|ipad)/i.test(q)) device = 'Apple iOS Device';
  else if (/\b(printer|laserjet|copier|office printer)/i.test(q)) device = 'Office Network Printer';
  else if (/\b(dock|docking\s*station|thunderbolt)/i.test(q)) device = 'Thunderbolt Docking Station';
  else if (/\b(monitor|external display|second screen)/i.test(q)) device = 'External Display Monitor';
  else if (/\b(laptop|notebook)/i.test(q)) device = 'Corporate Laptop';
  else if (/\b(pc|desktop|workstation)/i.test(q)) device = 'Desktop Workstation';

  // 3. Operating System Identification
  let os: string | undefined;
  if (/\b(macos|mac\s*os|osx|ventura|sonoma|sequoia)/i.test(q)) os = 'macOS';
  else if (/\b(windows\s*11|win\s*11)/i.test(q)) os = 'Windows 11';
  else if (/\b(windows\s*10|win\s*10)/i.test(q)) os = 'Windows 10';
  else if (/\b(windows|win)/i.test(q)) os = 'Windows';
  else if (/\b(ubuntu|linux|debian|fedora|centos)/i.test(q)) os = 'Linux';
  else if (/\b(ios|ipados)/i.test(q)) os = 'iOS';
  else if (/\b(android)/i.test(q)) os = 'Android';

  // 4. Software Application Identification
  let application: string | undefined;
  if (/\b(zoom|zoom\s*meeting)/i.test(q)) application = 'Zoom';
  else if (/\b(slack)/i.test(q)) application = 'Slack';
  else if (/\b(excel|spreadsheet|workbook)/i.test(q)) application = 'Microsoft Excel';
  else if (/\b(outlook|mail\s*client)/i.test(q)) application = 'Microsoft Outlook';
  else if (/\b(teams|ms\s*teams)/i.test(q)) application = 'Microsoft Teams';
  else if (/\b(vpn|globalprotect|anyconnect|cisco\s*vpn|wireguard)/i.test(q)) application = 'GlobalProtect VPN';
  else if (/\b(print\s*spooler|spooler|print\s*queue)/i.test(q)) application = 'Windows Print Spooler';
  else if (/\b(chrome|google\s*chrome)/i.test(q)) application = 'Google Chrome';
  else if (/\b(okta|sso|authenticator|mfa|2fa)/i.test(q)) application = 'Okta / MFA Authenticator';
  else if (/\b(onedrive|sharepoint|google\s*drive)/i.test(q)) application = 'Cloud Storage';

  // 5. Issue Type Classification
  let issue_type: string = 'General IT Inquiry';
  if (safety_hazard) issue_type = 'Physical / Thermal Hazard';
  else if (/\b(battery|drain|drains|dying fast|charge)\b/i.test(q)) issue_type = 'Battery Health / Rapid Depletion';
  else if (/\b(screen\s*rec|recording\s*permission|share\s*screen|screen\s*share)\b/i.test(q)) issue_type = 'Screen Recording Privacy Permissions';
  else if (/\b(password|forgot\s*password|reset\s*password|locked\s*out|login|sign\s*in)\b/i.test(q)) issue_type = 'Authentication / Password Reset';
  else if (/\b(vpn|cannot\s*connect\s*to\s*vpn|remote\s*access)\b/i.test(q)) issue_type = 'VPN Connection Failure';
  else if (/\b(spooler|print\s*queue|queue\s*stuck|cannot\s*print)\b/i.test(q)) issue_type = 'Stuck Print Spooler Service';
  else if (/\b(excel|formula|corrupt|workbook\s*freeze)\b/i.test(q)) issue_type = 'Spreadsheet Application Crash';
  else if (/\b(wifi|wi-fi|internet|dns|disconnects)\b/i.test(q)) issue_type = 'Network / Wi-Fi Disconnection';

  const operational_summary = safety_hazard
    ? `CRITICAL: ${hazard_reason || 'Physical hazard reported.'} Immediate technician safety response required.`
    : `User reports ${issue_type}${device ? ` on ${device}` : ''}${os ? ` (${os})` : ''}${application ? ` related to ${application}` : ''}.`;

  return {
    safety_hazard,
    hazard_reason,
    entities: {
      device,
      os,
      application,
      issue_type,
    },
    operational_summary,
  };
}
