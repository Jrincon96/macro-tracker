export const LB_PER_KG = 2.2046226218;
export const CM_PER_IN = 2.54;

export const lbToKg = (lb: number) => lb / LB_PER_KG;
export const kgToLb = (kg: number) => kg * LB_PER_KG;

export const ftInToCm = (ft: number, inches: number) => (ft * 12 + inches) * CM_PER_IN;
export function cmToFtIn(cm: number): { ft: number; in: number } {
  const totalIn = Math.round(cm / CM_PER_IN);
  return { ft: Math.floor(totalIn / 12), in: totalIn % 12 };
}

export const round1 = (n: number) => Math.round(n * 10) / 10;
