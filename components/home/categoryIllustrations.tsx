import type { ComponentType } from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

export type DoodleProps = {
  width?: number;
  height?: number;
  color?: string;
};

type Doodle = ComponentType<DoodleProps>;

function Ground({ color }: { color: string }) {
  return <Ellipse cx="80" cy="148" rx="40" ry="6" fill={color} opacity={0.12} />;
}

/** Home pool + category: wellness / empty states */
export function MeditatingDoodle({ width = 120, height = 120, color = '#1C1A17' }: DoodleProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Ground color={color} />
      <Circle cx="80" cy="42" r="18" stroke={color} strokeWidth={3} />
      <Path d="M62 70C62 70 68 96 80 96C92 96 98 70 98 70" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M62 78C48 86 40 98 38 112" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M98 78C112 86 120 98 122 112" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M70 96C62 112 54 124 48 132" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M90 96C98 112 106 124 112 132" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M48 132C56 128 68 126 80 126C92 126 104 128 112 132" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M72 40H88" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

export function ReadingDoodle({ width = 120, height = 120, color = '#1C1A17' }: DoodleProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Ground color={color} />
      <Circle cx="80" cy="36" r="16" stroke={color} strokeWidth={3} />
      <Path d="M64 58C64 58 68 88 80 90C92 88 96 58 96 58" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M56 100C56 100 68 92 80 92C92 92 104 100 104 100L98 128H62L56 100Z" stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M80 92V128" stroke={color} strokeWidth={2.5} />
      <Path d="M50 78C42 86 38 98 40 110" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M110 78C118 86 122 98 120 110" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M72 34H88" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

export function SittingDoodle({ width = 120, height = 120, color = '#1C1A17' }: DoodleProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Ground color={color} />
      <Circle cx="72" cy="38" r="16" stroke={color} strokeWidth={3} />
      <Path d="M58 60C58 60 62 92 72 96C86 100 100 88 104 78" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M72 96C72 96 70 118 68 132" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M86 98C94 110 108 122 118 128" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M104 78C112 72 122 70 130 74" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M64 36H80" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

export function PlantDoodle({ width = 120, height = 120, color = '#1C1A17' }: DoodleProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Ground color={color} />
      <Circle cx="70" cy="40" r="16" stroke={color} strokeWidth={3} />
      <Path d="M56 62C56 62 60 96 70 100C84 104 96 90 98 80" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M70 100C66 116 60 128 54 136" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M82 102C90 116 102 128 112 134" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M98 80C104 70 112 58 118 48" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M118 48C112 46 108 50 110 56C114 52 122 50 124 44C120 48 116 42 118 48Z" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
      <Path d="M112 40C108 34 114 28 120 32" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M62 38H78" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

/** Home pool: runner (sports) */
export function RunningDoodle({ width = 120, height = 120, color = '#1C1A17' }: DoodleProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Ground color={color} />
      <Circle cx="92" cy="34" r="14" stroke={color} strokeWidth={3} />
      <Path d="M84 52C78 68 70 82 62 92" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M62 92C54 104 42 118 34 128" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M70 78C86 74 104 70 118 78" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M86 70C96 86 108 108 114 128" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M70 78C62 90 58 104 60 118" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M28 132H48" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M104 132H132" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

/** Home pool: camera (photography) */
export function CameraDoodle({ width = 120, height = 120, color = '#1C1A17' }: DoodleProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Ground color={color} />
      <Path d="M42 64H58L66 52H94L102 64H118C124 64 128 68 128 74V116C128 122 124 126 118 126H42C36 126 32 122 32 116V74C32 68 36 64 42 64Z" stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Circle cx="80" cy="92" r="22" stroke={color} strokeWidth={3} />
      <Circle cx="80" cy="92" r="10" stroke={color} strokeWidth={2.5} />
      <Circle cx="112" cy="76" r="4" fill={color} />
    </Svg>
  );
}

function MusicDoodle({ width = 120, height = 120, color = '#1C1A17' }: DoodleProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Ground color={color} />
      <Circle cx="56" cy="112" r="18" stroke={color} strokeWidth={3} />
      <Circle cx="108" cy="100" r="16" stroke={color} strokeWidth={3} />
      <Path d="M74 112V44L124 32V100" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M74 60L124 48" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

function CookingDoodle({ width = 120, height = 120, color = '#1C1A17' }: DoodleProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Ground color={color} />
      <Path d="M48 88H112C116 88 120 96 118 108C114 128 100 136 80 136C60 136 46 128 42 108C40 96 44 88 48 88Z" stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M56 88C56 72 66 60 80 60C94 60 104 72 104 88" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M80 48V60" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M64 52L68 60" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M96 52L92 60" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Ellipse cx="80" cy="108" rx="18" ry="8" stroke={color} strokeWidth={2.5} />
    </Svg>
  );
}

function ArtsDoodle({ width = 120, height = 120, color = '#1C1A17' }: DoodleProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Ground color={color} />
      <Path d="M48 120L72 40L88 48L64 128Z" stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M72 40C78 28 96 30 98 44C100 56 86 58 80 50" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Circle cx="108" cy="100" r="10" stroke={color} strokeWidth={2.5} />
      <Circle cx="124" cy="84" r="8" stroke={color} strokeWidth={2.5} />
      <Circle cx="118" cy="116" r="7" stroke={color} strokeWidth={2.5} />
    </Svg>
  );
}

function GamesDoodle({ width = 120, height = 120, color = '#1C1A17' }: DoodleProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Ground color={color} />
      <Rect x="44" y="48" width="52" height="72" rx="6" stroke={color} strokeWidth={3} />
      <Rect x="64" y="40" width="52" height="72" rx="6" stroke={color} strokeWidth={3} />
      <Path d="M80 58L90 72L80 86L70 72Z" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
      <Circle cx="90" cy="96" r="4" fill={color} />
    </Svg>
  );
}

function CollectingDoodle({ width = 120, height = 120, color = '#1C1A17' }: DoodleProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Ground color={color} />
      <Path d="M40 72L80 52L120 72V120L80 140L40 120V72Z" stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M40 72L80 92L120 72" stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M80 92V140" stroke={color} strokeWidth={3} />
      <Path d="M64 40H96V56H64V40Z" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
    </Svg>
  );
}

function TechDoodle({ width = 120, height = 120, color = '#1C1A17' }: DoodleProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Ground color={color} />
      <Circle cx="80" cy="78" r="28" stroke={color} strokeWidth={3} />
      <Circle cx="80" cy="78" r="12" stroke={color} strokeWidth={2.5} />
      <Path d="M80 40V50" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M80 106V118" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M42 78H52" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M108 78H118" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M54 52L60 58" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M100 98L106 104" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M106 52L100 58" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M60 98L54 104" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

function PerformingDoodle({ width = 120, height = 120, color = '#1C1A17' }: DoodleProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Ground color={color} />
      <Circle cx="80" cy="48" r="16" stroke={color} strokeWidth={3} />
      <Path d="M64 70C64 70 70 100 80 104C90 100 96 70 96 70" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M56 84C48 90 44 100 44 110" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M104 84C112 90 116 100 116 110" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M70 104C66 118 62 128 58 136" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M90 104C94 118 98 128 102 136" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Ellipse cx="80" cy="78" rx="10" ry="14" stroke={color} strokeWidth={2.5} />
      <Path d="M80 92V112" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

function WaterDoodle({ width = 120, height = 120, color = '#1C1A17' }: DoodleProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Ground color={color} />
      <Path d="M36 100C48 88 60 88 72 100C84 112 96 112 108 100C120 88 132 88 140 96" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M36 118C48 106 60 106 72 118C84 130 96 130 108 118C120 106 132 106 140 114" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M70 48C70 48 56 70 56 86C56 98 66 108 80 108C94 108 104 98 104 86C104 70 90 48 90 48" stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Circle cx="74" cy="82" r="3" fill={color} />
    </Svg>
  );
}

function WinterDoodle({ width = 120, height = 120, color = '#1C1A17' }: DoodleProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Ground color={color} />
      <Path d="M80 36V124" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M44 80H116" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M54 54L106 106" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M106 54L54 106" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M80 36L68 48M80 36L92 48" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M80 124L68 112M80 124L92 112" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M44 80L56 68M44 80L56 92" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M116 80L104 68M116 80L104 92" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

function PetDoodle({ width = 120, height = 120, color = '#1C1A17' }: DoodleProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Ground color={color} />
      <Circle cx="88" cy="70" r="28" stroke={color} strokeWidth={3} />
      <Path d="M66 50C60 36 48 34 44 44C40 54 50 62 60 60" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M110 50C116 36 128 34 132 44C136 54 126 62 116 60" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Circle cx="78" cy="68" r="3" fill={color} />
      <Circle cx="98" cy="68" r="3" fill={color} />
      <Path d="M84 80C86 84 90 84 92 80" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M70 100C70 118 88 128 108 118" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M52 108C44 112 40 120 42 128" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

function TravelDoodle({ width = 120, height = 120, color = '#1C1A17' }: DoodleProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Ground color={color} />
      <Path d="M36 96L124 64L132 72L68 108L60 128L52 124L58 108L36 96Z" stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M68 108L100 88" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M48 56C56 44 72 40 84 48" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M100 40C112 36 124 42 128 52" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

function DiyDoodle({ width = 120, height = 120, color = '#1C1A17' }: DoodleProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Ground color={color} />
      <Path d="M52 48C52 48 68 52 76 68L108 120C112 126 108 132 100 128L68 96C52 88 48 72 48 72" stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M52 48L40 36M60 44L52 28" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M96 56L128 88" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M112 52L132 72L120 84L100 64Z" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
    </Svg>
  );
}

function SocialDoodle({ width = 120, height = 120, color = '#1C1A17' }: DoodleProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Ground color={color} />
      <Circle cx="56" cy="48" r="14" stroke={color} strokeWidth={3} />
      <Circle cx="104" cy="48" r="14" stroke={color} strokeWidth={3} />
      <Path d="M36 96C36 76 44 68 56 68C68 68 76 76 76 96" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M84 96C84 76 92 68 104 68C116 68 124 76 124 96" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Circle cx="80" cy="100" r="12" stroke={color} strokeWidth={3} />
      <Path d="M62 136C62 120 70 114 80 114C90 114 98 120 98 136" stroke={color} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

function AutoDoodle({ width = 120, height = 120, color = '#1C1A17' }: DoodleProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Ground color={color} />
      <Path d="M40 100L48 72C50 66 56 62 62 62H98C104 62 110 66 112 72L120 100" stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M32 100H128" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Path d="M40 100V112H52V100M108 100V112H120V100" stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Circle cx="56" cy="116" r="10" stroke={color} strokeWidth={3} />
      <Circle cx="104" cy="116" r="10" stroke={color} strokeWidth={3} />
      <Path d="M70 74H96" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

/** 6 doodles reused on home when no category key is available */
export const HOME_ILLUSTRATION_POOL = [
  MeditatingDoodle,
  ReadingDoodle,
  SittingDoodle,
  PlantDoodle,
  RunningDoodle,
  CameraDoodle,
] as const;

/** Unique illustration per hobby_category.illustration_key */
export const CATEGORY_ILLUSTRATIONS: Record<string, Doodle> = {
  'sports-fitness': RunningDoodle,
  'outdoor-nature': PlantDoodle,
  'arts-crafts': ArtsDoodle,
  music: MusicDoodle,
  collecting: CollectingDoodle,
  'games-puzzles': GamesDoodle,
  'cooking-food': CookingDoodle,
  'writing-literature': ReadingDoodle,
  'technology-science': TechDoodle,
  'performing-arts': PerformingDoodle,
  'water-sports': WaterDoodle,
  'winter-sports': WinterDoodle,
  'animal-pet': PetDoodle,
  'travel-exploration': TravelDoodle,
  'diy-home': DiyDoodle,
  'social-community': SocialDoodle,
  'mind-body-wellness': MeditatingDoodle,
  'photography-visual': CameraDoodle,
  'automotive-mechanical': AutoDoodle,
  miscellaneous: SittingDoodle,
};

export const CATEGORY_ILLUSTRATION_KEYS = Object.keys(CATEGORY_ILLUSTRATIONS);
