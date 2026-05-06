const compactNumberFormatter = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

function getFractionDigits(value: number): number {
  if (value >= 1000) {
    return 0;
  }

  if (value >= 100) {
    return 1;
  }

  if (value >= 10) {
    return 2;
  }

  return value >= 1 ? 2 : 3;
}

function formatNumericValue(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1000) {
    return compactNumberFormatter.format(value);
  }

  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: getFractionDigits(Math.abs(value)),
  });
}

export function formatChaos(value: number, compact = false): string {
  return `${formatNumericValue(value, compact)}c`;
}

export function formatChaosLabel(value: number, compact = false): string {
  return `${formatNumericValue(value, compact)} Chaos`;
}

export function formatWholeChaos(value: number): string {
  return Math.round(value).toLocaleString();
}

export function formatDivine(value: number, compact = false): string {
  return `${formatNumericValue(value, compact)} div`;
}
