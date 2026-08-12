/** Central registry for modules not yet shipped. Toggle here to re-enable portal nav items. */
export const PORTAL_MODULE_FLAGS = {
  attendance: false,
  leave: false,
  timesheets: false,
  requests: false,
  payslips: true,
  documents: false,
} as const;

export type PortalModuleKey = keyof typeof PORTAL_MODULE_FLAGS;

const PORTAL_MODULE_HREFS: Record<PortalModuleKey, string> = {
  attendance: "/portal/attendance",
  leave: "/portal/leave",
  timesheets: "/portal/timesheets",
  requests: "/portal/requests",
  payslips: "/portal/payslips",
  documents: "/portal/documents",
};

export function isPortalModuleEnabled(href: string): boolean {
  for (const [key, enabled] of Object.entries(PORTAL_MODULE_FLAGS)) {
    if (!enabled && PORTAL_MODULE_HREFS[key as PortalModuleKey] === href) {
      return false;
    }
  }
  return true;
}

export function portalModuleUnavailableMessage(href: string): string {
  const labels: Record<string, string> = {
    "/portal/attendance": "Attendance",
    "/portal/leave": "Leave",
    "/portal/timesheets": "Timesheets",
    "/portal/requests": "My Requests",
    "/portal/payslips": "Payslips",
    "/portal/documents": "Documents",
  };
  return `${labels[href] ?? "This module"} is not yet available. It will appear in navigation when released.`;
}
