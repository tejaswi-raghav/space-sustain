import type { Metadata } from 'next';
import MissionControl from '@/components/MissionControl';
export const metadata: Metadata = { title: 'Dubai Twin Mission Control — SpaceSustain', description: 'Explore Dubai districts, mapped 3D buildings, rooftop solar assumptions, and illustrative planning scenarios.' };
export default function MissionControlPage() { return <MissionControl />; }
