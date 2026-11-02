export type DistrictId = 'al-quoz' | 'dubai-silicon-oasis' | 'business-bay' | 'dubai-marina' | 'expo-city' | 'jebel-ali';
export type SceneId = DistrictId | 'downtown' | 'orbit';
export type LayerId = 'solar' | 'heat' | 'vegetation' | 'growth';

export type District = {
  id: DistrictId;
  name: string;
  short: string;
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  pitch: number;
  focus: string;
  description: string;
};

export const DISTRICTS: District[] = [
  { id: 'al-quoz', name: 'Al Quoz', short: 'AQZ', latitude: 25.134, longitude: 55.236, altitude: 1550, heading: 18, pitch: -41, focus: 'INDUSTRIAL ROOFS', description: 'Explore large industrial roof forms and hypothetical cool-roof or solar interventions.' },
  { id: 'dubai-silicon-oasis', name: 'Dubai Silicon Oasis', short: 'DSO', latitude: 25.1242, longitude: 55.3811, altitude: 1450, heading: 42, pitch: -43, focus: 'INNOVATION DISTRICT', description: 'Inspect mapped building footprints around a mixed-use technology district.' },
  { id: 'business-bay', name: 'Business Bay', short: 'BBY', latitude: 25.185, longitude: 55.272, altitude: 1600, heading: 22, pitch: -39, focus: 'DENSE URBAN CORE', description: 'Compare a dense skyline with the baseline and proposed planning layers.' },
  { id: 'dubai-marina', name: 'Dubai Marina', short: 'MAR', latitude: 25.0805, longitude: 55.143, altitude: 1600, heading: 26, pitch: -38, focus: 'COASTAL URBANISM', description: 'Navigate a coastal high-rise district and inspect the mapped roof geometry.' },
  { id: 'expo-city', name: 'Expo City Dubai', short: 'EXP', latitude: 24.965, longitude: 55.151, altitude: 1500, heading: 20, pitch: -43, focus: 'FUTURE DISTRICT', description: 'Test illustrative infrastructure and vegetation overlays in a master-planned area.' },
  { id: 'jebel-ali', name: 'Jebel Ali', short: 'JAL', latitude: 24.985, longitude: 55.0907, altitude: 1700, heading: 25, pitch: -40, focus: 'LOGISTICS LANDSCAPE', description: 'Study a free-zone building snapshot and compare roof intervention concepts.' },
];

export const DOWNTOWN = { latitude: 25.1922, longitude: 55.2814, altitude: 1750, heading: 24, pitch: -42 };
export const DUBAI_ORBIT = { latitude: 25.20, longitude: 55.28, altitude: 12_500_000, heading: 0, pitch: -90 };
export const LAYERS: { id: LayerId; label: string; code: string; description: string; color: string }[] = [
  { id: 'solar', label: 'Solar opportunity', code: 'SOL', description: 'Sample roof highlighting based on mapped footprint area.', color: '#70e8ed' },
  { id: 'heat', label: 'Urban heat', code: 'UHI', description: 'Illustrative heat zones; no measured temperature layer.', color: '#e7a47d' },
  { id: 'vegetation', label: 'Vegetation', code: 'VEG', description: 'Illustrative planting zones; no observed NDVI layer.', color: '#8ed9b8' },
  { id: 'growth', label: 'Urban growth', code: 'GRW', description: 'Illustrative study boundary; no change detection result.', color: '#a9b9df' },
];
export function districtById(id: DistrictId) { return DISTRICTS.find((district) => district.id === id)!; }
