import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { theme } from '@/constants/theme';

type IconProps = {
  size?: number;
  color?: string;
};

const DEFAULT_ICON = theme.colors.text;

export function SparkleIcon({ size = 22, color = DEFAULT_ICON }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5L13.6 8.4L19.5 10L13.6 11.6L12 17.5L10.4 11.6L4.5 10L10.4 8.4L12 2.5Z"
        fill={color}
      />
      <Path
        d="M18.5 14.5L19.2 17.1L21.8 17.8L19.2 18.5L18.5 21.1L17.8 18.5L15.2 17.8L17.8 17.1L18.5 14.5Z"
        fill={color}
        opacity={0.7}
      />
    </Svg>
  );
}


export function AtomIcon({ size = 22, color = DEFAULT_ICON }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="2" fill={color} />
      {/* Three orbital ellipses at 0°, 60°, −60° */}
      <Path
        d="M12 7.2C16.2 7.2 19.6 9.35 19.6 12C19.6 14.65 16.2 16.8 12 16.8C7.8 16.8 4.4 14.65 4.4 12C4.4 9.35 7.8 7.2 12 7.2Z"
        stroke={color}
        strokeWidth={1.55}
      />
      <Path
        d="M12 7.2C16.2 7.2 19.6 9.35 19.6 12C19.6 14.65 16.2 16.8 12 16.8C7.8 16.8 4.4 14.65 4.4 12C4.4 9.35 7.8 7.2 12 7.2Z"
        stroke={color}
        strokeWidth={1.55}
        transform="rotate(60 12 12)"
      />
      <Path
        d="M12 7.2C16.2 7.2 19.6 9.35 19.6 12C19.6 14.65 16.2 16.8 12 16.8C7.8 16.8 4.4 14.65 4.4 12C4.4 9.35 7.8 7.2 12 7.2Z"
        stroke={color}
        strokeWidth={1.55}
        transform="rotate(-60 12 12)"
      />
    </Svg>
  );
}

export function SendIcon({ size = 20, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 4L12 16"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <Path
        d="M6.5 10.5L12 4L17.5 10.5"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PlusIcon({ size = 16, color = DEFAULT_ICON }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5V19" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M5 12H19" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

export function HistoryIcon({ size = 16, color = DEFAULT_ICON }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.25" stroke={color} strokeWidth={2} />
      <Path
        d="M12 8V12.4L14.8 14.2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CloseIcon({ size = 14, color = DEFAULT_ICON }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6L18 18" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M18 6L6 18" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

export function LessonsIcon({ size = 22, color = DEFAULT_ICON }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6.5C4 5.67157 4.67157 5 5.5 5H11V18.5H5.5C4.67157 18.5 4 17.8284 4 17V6.5Z"
        stroke={color}
        strokeWidth={1.8}
      />
      <Path
        d="M20 6.5C20 5.67157 19.3284 5 18.5 5H13V18.5H18.5C19.3284 18.5 20 17.8284 20 17V6.5Z"
        stroke={color}
        strokeWidth={1.8}
      />
      <Path d="M13 5H11V18.5H13V5Z" fill={color} opacity={0.25} />
    </Svg>
  );
}

export function FeedbackIcon({ size = 22, color = DEFAULT_ICON }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 6.5C5 5.67157 5.67157 5 6.5 5H17.5C18.3284 5 19 5.67157 19 6.5V14.5C19 15.3284 18.3284 16 17.5 16H10L6.5 19V16H6.5C5.67157 16 5 15.3284 5 14.5V6.5Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M8.5 9H15.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M8.5 12H13" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function ChatBubbleIcon({ size = 22, color = DEFAULT_ICON }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 18.5L4.5 20.5V7.5C4.5 6.11929 5.61929 5 7 5H17C18.3807 5 19.5 6.11929 19.5 7.5V14C19.5 15.3807 18.3807 16.5 17 16.5H8L6 18.5Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TrashIcon({ size = 16, color = '#A14A3A' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 7H19" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M9 7V5.5C9 4.67157 9.67157 4 10.5 4H13.5C14.3284 4 15 4.67157 15 5.5V7" stroke={color} strokeWidth={1.8} />
      <Path
        d="M7.5 7L8.2 18.2C8.27 19.23 9.12 20 10.15 20H13.85C14.88 20 15.73 19.23 15.8 18.2L16.5 7"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function HomeTabIcon({ size = 22, color = DEFAULT_ICON }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 10.5L12 4L19.5 10.5V19C19.5 19.8284 18.8284 20.5 18 20.5H6C5.17157 20.5 4.5 19.8284 4.5 19V10.5Z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinejoin="round"
      />
      <Path d="M10 20.5V13.5H14V20.5" stroke={color} strokeWidth={1.9} strokeLinejoin="round" />
    </Svg>
  );
}

export function FeedTabIcon({ size = 22, color = DEFAULT_ICON, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="7.25" stroke={color} strokeWidth={1.9} fill={filled ? color : 'none'} fillOpacity={filled ? 0.18 : 0} />
      <Circle cx="12" cy="12" r="2.4" fill={color} />
    </Svg>
  );
}

export function GenerateTabIcon({ size = 22, color = DEFAULT_ICON }: IconProps) {
  return <SparkleIcon size={size} color={color} />;
}

export function CoursesTabIcon({ size = 22, color = DEFAULT_ICON }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4.5" y="5" width="15" height="14" rx="2.5" stroke={color} strokeWidth={1.9} />
      <Path d="M8 9H16" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
      <Path d="M8 12.5H16" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
      <Path d="M8 16H13" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
    </Svg>
  );
}

/** Map / path mark for Explore Module tab. */
export function ExploreTabIcon({ size = 22, color = DEFAULT_ICON }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 7.5L9.5 5.5L14.5 7.5L19.5 5.5V16.5L14.5 18.5L9.5 16.5L4.5 18.5V7.5Z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinejoin="round"
      />
      <Path d="M9.5 5.5V16.5" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
      <Path d="M14.5 7.5V18.5" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 18, color = DEFAULT_ICON }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.5 5.5L16 12L9.5 18.5"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ProfileTabIcon({ size = 22, color = DEFAULT_ICON }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="9" r="3.25" stroke={color} strokeWidth={1.9} />
      <Path
        d="M5.5 18.5C6.7 15.9 8.9 14.5 12 14.5C15.1 14.5 17.3 15.9 18.5 18.5"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
      />
    </Svg>
  );
}
