import heroFlagshipImg from '@/src/assets/images/hero_flagship_superbike_1794636799761.jpg';
import sportsCrimsonImg from '@/src/assets/images/bike_sports_crimson_1794636800889.jpg';
import commuterClassicImg from '@/src/assets/images/bike_commuter_classic_1794636800924.jpg';
import nakedStreetfighterImg from '@/src/assets/images/bike_naked_streetfighter_1794636801104.jpg';
import touringAdventureImg from '@/src/assets/images/bike_touring_adventure_1794636801276.jpg';
import cruiserClassicImg from '@/src/assets/images/bike_cruiser_classic_1794636801699.jpg';
import electricUrbanImg from '@/src/assets/images/bike_electric_urban_1794636801658.jpg';
import racingTrackImg from '@/src/assets/images/bike_racing_track_1794636802323.jpg';

const IMAGE_REGISTRY: Record<string, string> = {
  '/src/assets/images/hero_flagship_superbike_1794636799761.jpg': heroFlagshipImg,
  '/src/assets/images/bike_sports_crimson_1794636800889.jpg': sportsCrimsonImg,
  '/src/assets/images/bike_commuter_classic_1794636800924.jpg': commuterClassicImg,
  '/src/assets/images/bike_naked_streetfighter_1794636801104.jpg': nakedStreetfighterImg,
  '/src/assets/images/bike_touring_adventure_1794636801276.jpg': touringAdventureImg,
  '/src/assets/images/bike_cruiser_classic_1794636801699.jpg': cruiserClassicImg,
  '/src/assets/images/bike_electric_urban_1794636801658.jpg': electricUrbanImg,
  '/src/assets/images/bike_racing_track_1794636802323.jpg': racingTrackImg,
};

export const BUNDLED_IMAGE_OPTIONS = [
  { label: 'Hero Flagship Superbike', value: '/src/assets/images/hero_flagship_superbike_1794636799761.jpg' },
  { label: 'Sports Crimson Fairing', value: '/src/assets/images/bike_sports_crimson_1794636800889.jpg' },
  { label: 'Classic Commuter 125cc', value: '/src/assets/images/bike_commuter_classic_1794636800924.jpg' },
  { label: 'Naked Streetfighter', value: '/src/assets/images/bike_naked_streetfighter_1794636801104.jpg' },
  { label: 'Adventure Touring', value: '/src/assets/images/bike_touring_adventure_1794636801276.jpg' },
  { label: 'Cafe Cruiser', value: '/src/assets/images/bike_cruiser_classic_1794636801699.jpg' },
  { label: 'Electric Urban Scooter', value: '/src/assets/images/bike_electric_urban_1794636801658.jpg' },
  { label: 'Track Racing Superbike', value: '/src/assets/images/bike_racing_track_1794636802323.jpg' },
];

export { heroFlagshipImg };

export function resolveBikeImage(url?: string | null): string {
  if (!url) return sportsCrimsonImg;
  const trimmed = url.trim();
  if (IMAGE_REGISTRY[trimmed]) {
    return IMAGE_REGISTRY[trimmed];
  }
  return trimmed;
}
