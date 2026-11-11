import i18n from '@/i18n/config';
import {
  CircularProgress,
  type CircularProgressVariant,
} from './CircularProgress';

function coverageVariant(percent: number): CircularProgressVariant {
  if (percent >= 70) {
    return 'success';
  }
  if (percent >= 40) {
    return 'warning';
  }
  return 'danger';
}

export function CoverageRing({
  percent,
  size = 46,
  thickness = 10,
  label,
}: {
  percent: number;
  size?: number | string;
  thickness?: number;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <CircularProgress
      value={clamped}
      size={size}
      thickness={thickness}
      variant={coverageVariant(clamped)}
      label={label || i18n.t('knowledgeBase.coverageLabel', { value: clamped })}
    />
  );
}
