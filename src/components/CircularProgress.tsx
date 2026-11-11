import type { CSSProperties } from 'react';
import i18n from '@/i18n/config';
import styles from './CircularProgress.module.scss';

export type CircularProgressVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral';

export interface CircularProgressProps {
  value: number;
  size?: number | string;
  thickness?: number;
  variant?: CircularProgressVariant;
  label?: string;
  showValue?: boolean;
  className?: string;
}

const VIEWBOX_SIZE = 100;

const VARIANT_COLORS: Record<
  CircularProgressVariant,
  { progress: string; track: string }
> = {
  success: {
    progress: 'var(--borderFocus)',
    track: 'var(--backgroundLightSuccess)',
  },
  warning: {
    progress: 'var(--buttonWarningDefault)',
    track: 'var(--backgroundLightWarning)',
  },
  danger: {
    progress: 'var(--buttonDangerDefault)',
    track: 'var(--backgroundLightDanger)',
  },
  neutral: {
    progress: 'var(--iconBaseSecondary)',
    track: 'var(--backgroundTertiaryDefault)',
  },
};

export function CircularProgress({
  value,
  size = 46,
  thickness = 10,
  variant = 'success',
  label,
  showValue = true,
  className,
}: CircularProgressProps) {
  const normalizedValue = Math.max(0, Math.min(100, value));
  const normalizedThickness = Math.max(2, Math.min(40, thickness));
  const radius = (VIEWBOX_SIZE - normalizedThickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - normalizedValue / 100);
  const colors = VARIANT_COLORS[variant];
  const style: CSSProperties = {
    width: size,
    height: typeof size === 'number' ? size : undefined,
    aspectRatio: '1 / 1',
  };

  return (
    <span className={`${styles.root} ${className || ''}`.trim()} style={style}>
      <svg
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        role='img'
        aria-label={
          label ||
          i18n.t('knowledgeBase.progressLabel', {
            value: Math.round(normalizedValue),
          })
        }
      >
        <circle
          cx='50'
          cy='50'
          r={radius}
          fill='none'
          stroke={colors.track}
          strokeWidth={normalizedThickness}
        />
        <circle
          className={styles.value}
          cx='50'
          cy='50'
          r={radius}
          fill='none'
          stroke={colors.progress}
          strokeWidth={normalizedThickness}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap='round'
        />
        {showValue && (
          <text
            className={styles.text}
            x='50'
            y='50'
            textAnchor='middle'
            dominantBaseline='central'
          >
            {Math.round(normalizedValue)}%
          </text>
        )}
      </svg>
    </span>
  );
}
