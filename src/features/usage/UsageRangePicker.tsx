import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { IconCalendar, IconChevronDown } from '@/components/ui/icons';
import { USAGE_RANGE_PRESETS } from './constants';
import type { UsageRange } from './types';
import styles from './UsageRangePicker.module.scss';

interface UsageRangePickerProps {
  value: UsageRange;
  triggerLabel: string;
  draftFrom: string;
  draftTo: string;
  customError?: string;
  applyDisabled: boolean;
  dateBounds: { min: string; max: string };
  onSelectPreset: (range: UsageRange) => void;
  onDraftFromChange: (value: string) => void;
  onDraftToChange: (value: string) => void;
  onApplyCustom: () => void;
}

export function UsageRangePicker({
  value,
  triggerLabel,
  draftFrom,
  draftTo,
  customError,
  applyDisabled,
  dateBounds,
  onSelectPreset,
  onDraftFromChange,
  onDraftToChange,
  onApplyCustom,
}: UsageRangePickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (wrapRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const selectPreset = useCallback(
    (preset: UsageRange) => {
      onSelectPreset(preset);
      setOpen(false);
    },
    [onSelectPreset]
  );

  const applyCustom = useCallback(() => {
    if (applyDisabled) return;
    onApplyCustom();
    setOpen(false);
  }, [applyDisabled, onApplyCustom]);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
      >
        <IconCalendar size={14} className={styles.triggerIcon} />
        <span className={styles.triggerText}>{triggerLabel}</span>
        <IconChevronDown size={14} className={styles.chevron} />
      </button>

      {open && (
        <div id={panelId} role="dialog" aria-label={t('usage.range_label')} className={styles.panel}>
          <div className={styles.presetGrid}>
            {USAGE_RANGE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`${styles.preset} ${value === preset ? styles.presetActive : ''}`.trim()}
                onClick={() => selectPreset(preset)}
                aria-pressed={value === preset}
              >
                {t(`usage.range_${preset}`)}
              </button>
            ))}
          </div>

          <div className={styles.divider} />

          <div className={styles.customRow}>
            <label className={styles.dateField}>
              <span>{t('usage.custom_from')}</span>
              <input
                type="date"
                value={draftFrom}
                min={dateBounds.min}
                max={dateBounds.max}
                onChange={(event) => onDraftFromChange(event.target.value)}
              />
            </label>
            <span className={styles.arrow} aria-hidden="true">
              →
            </span>
            <label className={styles.dateField}>
              <span>{t('usage.custom_to')}</span>
              <input
                type="date"
                value={draftTo}
                min={dateBounds.min}
                max={dateBounds.max}
                onChange={(event) => onDraftToChange(event.target.value)}
              />
            </label>
          </div>

          {customError && <div className={styles.customError}>{customError}</div>}
          <p className={styles.hint}>{t('usage.range_hint_step')}</p>

          <div className={styles.actions}>
            <Button type="button" variant="primary" size="sm" onClick={applyCustom} disabled={applyDisabled}>
              {t('usage.custom_apply')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
