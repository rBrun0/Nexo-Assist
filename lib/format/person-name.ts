export function getFirstName(name: string) {
  const first = name.trim().split(/\s+/)[0];
  return first || name;
}

export function getInitials(name: string, max = 2) {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, max)
    .toUpperCase();
}
