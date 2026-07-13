import type { ComponentType } from 'react';
import {
  CameraDoodle,
  CATEGORY_ILLUSTRATIONS,
  HOME_ILLUSTRATION_POOL,
  MeditatingDoodle,
  PlantDoodle,
  ReadingDoodle,
  RunningDoodle,
  SittingDoodle,
  type DoodleProps,
} from '@/components/home/categoryIllustrations';

type Doodle = ComponentType<DoodleProps>;

const Arts = CATEGORY_ILLUSTRATIONS['arts-crafts']!;
const Music = CATEGORY_ILLUSTRATIONS.music!;
const Games = CATEGORY_ILLUSTRATIONS['games-puzzles']!;
const Cooking = CATEGORY_ILLUSTRATIONS['cooking-food']!;
const Tech = CATEGORY_ILLUSTRATIONS['technology-science']!;
const Social = CATEGORY_ILLUSTRATIONS['social-community']!;
const Travel = CATEGORY_ILLUSTRATIONS['travel-exploration']!;

function hashPick(label: string): Doodle {
  let h = 0;
  for (let i = 0; i < label.length; i++) {
    h = (h * 31 + label.charCodeAt(i)) | 0;
  }
  return HOME_ILLUSTRATION_POOL[Math.abs(h) % HOME_ILLUSTRATION_POOL.length]!;
}

/**
 * Preference option → Open Doodles–style icon for the left side of each row.
 */
const OPTION_ICONS: Record<string, Doodle> = {
  'Working professional': Tech,
  Student: ReadingDoodle,
  'Parent / caregiver': Social,
  'Creative professional': Arts,
  'Retired or semi-retired': MeditatingDoodle,
  'Freelancer / self-employed': CameraDoodle,
  'Shift worker': RunningDoodle,

  'Under 18': Games,
  '18–24': Travel,
  '25–34': SittingDoodle,
  '35–44': PlantDoodle,
  '45–54': ReadingDoodle,
  '55–64': MeditatingDoodle,
  '65+': PlantDoodle,
  'Prefer not to say': SittingDoodle,

  'Pick up a brand-new hobby': PlantDoodle,
  'Get back into a hobby I paused': Travel,
  'Level up skills I already have': RunningDoodle,
  'Make better use of spare time': Tech,
  'Relax and de-stress': MeditatingDoodle,
  'Connect with others through hobbies': Social,
  'Build a creative outlet': Arts,
  'Compete or perform': RunningDoodle,

  'None — no adjustments needed': SittingDoodle,
  'Vision impairment / low vision': CameraDoodle,
  Blindness: CameraDoodle,
  'Hearing impairment / deafness': Music,
  'Motor or dexterity limitations': Tech,
  'Chronic pain or fatigue': MeditatingDoodle,
  'ADHD / attention differences': Games,
  'Autism / sensory sensitivity': PlantDoodle,
  'Dyslexia / reading differences': ReadingDoodle,
  'Anxiety in high-pressure practice': MeditatingDoodle,

  'Strong visual memory': CameraDoodle,
  'Learn well by listening': Music,
  'Learn well by doing': RunningDoodle,
  'Good at breaking down steps': Tech,
  'High stamina for practice': RunningDoodle,
  'Strong focus for long sessions': ReadingDoodle,
  'Creative problem-solving': Arts,
  'Good with patterns and systems': Games,

  'At home only': SittingDoodle,
  'Small space / apartment': PlantDoodle,
  'Need quiet practice': MeditatingDoodle,
  'Can practice outdoors': Travel,
  'Travel often': Travel,
  'Share space with others': Social,

  'Free resources only': PlantDoodle,
  'Low budget': SittingDoodle,
  'Moderate budget': Cooking,
  'Will invest in gear or courses': Tech,

  Video: CameraDoodle,
  Audio: Music,
  Text: ReadingDoodle,
  'Daily tasks': RunningDoodle,
};

export function getOptionIcon(option: string): Doodle {
  return OPTION_ICONS[option] ?? hashPick(option);
}

export const PromptBrandDoodle = PlantDoodle;
