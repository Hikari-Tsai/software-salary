export type SalaryAnchor = {
  year: number;
  median: number;
  p75: number;
};

const roundToOneDecimal = (value: number) => Math.round(value * 10) / 10;

export function interpolateSalary(anchors: SalaryAnchor[], year: number) {
  if (anchors.length === 0) return { median: 0, p75: 0 };
  if (year <= anchors[0].year) return { median: anchors[0].median, p75: anchors[0].p75 };

  const last = anchors[anchors.length - 1];
  if (year >= last.year) return { median: last.median, p75: last.p75 };

  const rightIndex = anchors.findIndex((anchor) => anchor.year >= year);
  const left = anchors[rightIndex - 1];
  const right = anchors[rightIndex];
  const progress = (year - left.year) / (right.year - left.year);

  return {
    median: roundToOneDecimal(left.median + (right.median - left.median) * progress),
    p75: roundToOneDecimal(left.p75 + (right.p75 - left.p75) * progress),
  };
}
