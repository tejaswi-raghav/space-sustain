/** Transparent concept math. Never present this as a building-specific feasibility study. */
export type SolarAssumptions = {
  usableRoofFraction: number;
  shadingLossFraction: number;
  annualIrradianceKwhM2: number;
  moduleEfficiency: number;
  performanceRatio: number;
};
export const DEFAULT_SOLAR_ASSUMPTIONS: SolarAssumptions = {
  usableRoofFraction: 0.6,
  shadingLossFraction: 0.15,
  annualIrradianceKwhM2: 1950,
  moduleEfficiency: 0.2,
  performanceRatio: 0.78,
};
export function calculateSolar(roofAreaM2: number, assumptions: SolarAssumptions) {
  const usableAreaM2 = Math.max(0, roofAreaM2) * assumptions.usableRoofFraction;
  const nameplateKw = usableAreaM2 * assumptions.moduleEfficiency; // 1 kW/m² reference irradiance.
  const annualKwh = usableAreaM2 * assumptions.annualIrradianceKwhM2 * assumptions.moduleEfficiency * assumptions.performanceRatio * (1 - assumptions.shadingLossFraction);
  return { usableAreaM2, nameplateKw, annualKwh, annualMwh: annualKwh / 1000 };
}
