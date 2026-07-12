import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

type Props = {
  width?: number;
  height?: number;
  color?: string;
};

/** Open Doodles–inspired line art (CC0 spirit). Meditating figure. */
export function MeditatingDoodle({ width = 120, height = 120, color = '#1C1A17' }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Ellipse cx="80" cy="148" rx="42" ry="6" fill={color} opacity={0.12} />
      <Circle cx="80" cy="42" r="18" stroke={color} strokeWidth={3} />
      <Path
        d="M62 70C62 70 68 96 80 96C92 96 98 70 98 70"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M62 78C48 86 40 98 38 112"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M98 78C112 86 120 98 122 112"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M70 96C62 112 54 124 48 132"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M90 96C98 112 106 124 112 132"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M48 132C56 128 68 126 80 126C92 126 104 128 112 132"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path d="M72 40H88" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

/** Person immersed in a book. */
export function ReadingDoodle({ width = 120, height = 120, color = '#1C1A17' }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Ellipse cx="80" cy="148" rx="40" ry="6" fill={color} opacity={0.12} />
      <Circle cx="80" cy="36" r="16" stroke={color} strokeWidth={3} />
      <Path
        d="M64 58C64 58 68 88 80 90C92 88 96 58 96 58"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M56 100C56 100 68 92 80 92C92 92 104 100 104 100L98 128H62L56 100Z"
        stroke={color}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Path d="M80 92V128" stroke={color} strokeWidth={2.5} />
      <Path
        d="M50 78C42 86 38 98 40 110"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M110 78C118 86 122 98 120 110"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path d="M72 34H88" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

/** Person sitting thoughtfully. */
export function SittingDoodle({ width = 120, height = 120, color = '#1C1A17' }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Ellipse cx="80" cy="148" rx="38" ry="6" fill={color} opacity={0.12} />
      <Circle cx="72" cy="38" r="16" stroke={color} strokeWidth={3} />
      <Path
        d="M58 60C58 60 62 92 72 96C86 100 100 88 104 78"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M72 96C72 96 70 118 68 132"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M86 98C94 110 108 122 118 128"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M104 78C112 72 122 70 130 74"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path d="M64 36H80" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

/** Person holding a plant. */
export function PlantDoodle({ width = 120, height = 120, color = '#1C1A17' }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 160" fill="none">
      <Ellipse cx="80" cy="148" rx="40" ry="6" fill={color} opacity={0.12} />
      <Circle cx="70" cy="40" r="16" stroke={color} strokeWidth={3} />
      <Path
        d="M56 62C56 62 60 96 70 100C84 104 96 90 98 80"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M70 100C66 116 60 128 54 136"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M82 102C90 116 102 128 112 134"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M98 80C104 70 112 58 118 48"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M118 48C112 46 108 50 110 56C114 52 122 50 124 44C120 48 116 42 118 48Z"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <Path
        d="M112 40C108 34 114 28 120 32"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <Path d="M62 38H78" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

const ILLUSTRATIONS = [MeditatingDoodle, ReadingDoodle, SittingDoodle, PlantDoodle] as const;

function hashTitle(title: string): number {
  let h = 0;
  for (let i = 0; i < title.length; i++) {
    h = (h * 31 + title.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function HobbyBlockIllustration({
  title,
  index = 0,
  width = 120,
  height = 120,
  color = '#1C1A17',
}: {
  title: string;
  index?: number;
  width?: number;
  height?: number;
  color?: string;
}) {
  const pick = (hashTitle(title) + index) % ILLUSTRATIONS.length;
  const Comp = ILLUSTRATIONS[pick] ?? MeditatingDoodle;
  return <Comp width={width} height={height} color={color} />;
}
