import { HomeDashboardScreen } from '@/components/home/HomeDashboardScreen';
import { FLOATING_TAB_BAR_HEIGHT_WITH_ASK } from '@/components/navigation/tabBarLayout';

export function ActiveRoadmapTab() {
  return <HomeDashboardScreen contentBottomInset={FLOATING_TAB_BAR_HEIGHT_WITH_ASK + 24} />;
}
