import { useState, useMemo, useCallback } from 'react';
import type { MortgageInputs, MortgageResults } from '@/types/mortgage';
import { DEFAULT_MORTGAGE_INPUTS } from '@/types/mortgage';
import { calculateMortgageResults, syncMortgageInputs } from '@/lib/mortgage';
import { generateAmortizationSchedule } from '@/lib/amortization';
import type { AmortizationSchedule } from '@/types/amortization';

interface UseMortgageCalculatorReturn {
  inputs: MortgageInputs;
  results: MortgageResults;
  schedule: AmortizationSchedule;
  updateInput: <K extends keyof MortgageInputs>(key: K, value: MortgageInputs[K]) => void;
  setInputs: (inputs: MortgageInputs) => void;
  resetToDefaults: () => void;
}

export function useMortgageCalculator(
  initialInputs: Partial<MortgageInputs> = {}
): UseMortgageCalculatorReturn {
  const [inputs, setInputsState] = useState<MortgageInputs>({
    ...DEFAULT_MORTGAGE_INPUTS,
    ...initialInputs,
  });

  const updateInput = useCallback(<K extends keyof MortgageInputs>(
    key: K,
    value: MortgageInputs[K]
  ) => {
    setInputsState((prev) => {
      const updated = { ...prev, [key]: value };

      // Sync related fields for home price / down payment changes
      if (key === 'homePrice' || key === 'downPayment' || key === 'downPaymentPercent') {
        const synced = syncMortgageInputs(updated, key as 'homePrice' | 'downPayment' | 'downPaymentPercent');
        return { ...updated, ...synced };
      }

      return updated;
    });
  }, []);

  const setInputs = useCallback((newInputs: MortgageInputs) => {
    setInputsState(newInputs);
  }, []);

  const resetToDefaults = useCallback(() => {
    setInputsState(DEFAULT_MORTGAGE_INPUTS);
  }, []);

  const results = useMemo(
    () => calculateMortgageResults(inputs),
    [inputs]
  );

  const schedule = useMemo(
    () => generateAmortizationSchedule(
      inputs.loanAmount,
      inputs.interestRate,
      inputs.loanTermMonths,
      inputs.startDate
    ),
    [inputs.loanAmount, inputs.interestRate, inputs.loanTermMonths, inputs.startDate]
  );

  return {
    inputs,
    results,
    schedule,
    updateInput,
    setInputs,
    resetToDefaults,
  };
}
