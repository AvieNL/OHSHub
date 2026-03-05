/** Formats a full name from optional first_name, tussenvoegsel and last_name parts. */
export function fmtFullName(u: {
  first_name: string | null;
  tussenvoegsel: string | null;
  last_name: string | null;
}): string {
  return [u.first_name, u.tussenvoegsel, u.last_name].filter(Boolean).join(' ');
}
