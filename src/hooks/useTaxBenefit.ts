import { useState, useMemo, useCallback } from 'react';
import type { TaxProfile, TaxBenefitSummary } from '@/types/tax';
import { DEFAULT_TAX_PROFILE } from '@/types/tax';
import type { AmortizationSchedule } from '@/types/amortization';
import { calculateTaxBenefits } from '@/lib/taxBenefit';

interface UseTaxBenefitReturn {
  profile: TaxProfile;
  taxBenefits: TaxBenefitSummary | null;
  updateProfile: <K extends keyof TaxProfile>(key: K, value: TaxProfile[K]) => void;
  setProfile: (profile: TaxProfile) => void;
  resetToDefaults: () => void;
}

export function useTaxBenefit(
  schedule: AmortizationSchedule | null,
  loanAmount: number,
  initialProfile: Partial<TaxProfile> = {}
): UseTaxBenefitReturn {
  const [profile, setProfileState] = useState<TaxProfile>({
    ...DEFAULT_TAX_PROFILE,
    ...initialProfile,
  });

  const updateProfile = useCallback(<K extends keyof TaxProfile>(
    key: K,
    value: TaxProfile[K]
  ) => {
    setProfileState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setProfile = useCallback((newProfile: TaxProfile) => {
    setProfileState(newProfile);
  }, []);

  const resetToDefaults = useCallback(() => {
    setProfileState(DEFAULT_TAX_PROFILE);
  }, []);

  const taxBenefits = useMemo(() => {
    if (!schedule || schedule.payments.length === 0) {
      return null;
    }
    return calculateTaxBenefits(schedule, loanAmount, profile);
  }, [schedule, loanAmount, profile]);

  return {
    profile,
    taxBenefits,
    updateProfile,
    setProfile,
    resetToDefaults,
  };
}
