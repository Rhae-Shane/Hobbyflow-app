import { MultiSelectChips } from '@/components/onboarding/MultiSelectChips';
import { OtherInput } from '@/components/onboarding/OtherInput';
import type { PreferenceDataKey, WizardStep } from '@/lib/preferencesWizardSteps';
import { getOptionsForDataKey } from '@/lib/preferencesWizardSteps';

type Props = {
  step: WizardStep & { dataKey: PreferenceDataKey };
  selected: string[];
  otherText: string;
  onSelectionChange: (dataKey: PreferenceDataKey, value: string[]) => void;
  onOtherTextChange: (value: string) => void;
  onAddOther: () => void;
};

export function PreferenceDataStep({
  step,
  selected,
  otherText,
  onSelectionChange,
  onOtherTextChange,
  onAddOther,
}: Props) {
  const { dataKey } = step;

  return (
    <>
      <MultiSelectChips
        layout={step.chipLayout ?? 'wrap'}
        minSelection={step.minSelection}
        options={getOptionsForDataKey(dataKey)}
        selected={selected}
        onChange={(value) => onSelectionChange(dataKey, value)}
      />
      <OtherInput
        placeholder={step.otherPlaceholder ?? 'Other (optional)'}
        showAddButton={step.showOtherAddButton}
        value={otherText}
        onAdd={onAddOther}
        onChange={onOtherTextChange}
      />
    </>
  );
}
