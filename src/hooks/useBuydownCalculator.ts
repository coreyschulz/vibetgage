import { useState, useMemo } from 'react';
import type { BuydownInputs, BuydownScenario, BuydownComparison } from '@/types/buydown';
import { DEFAULT_BUYDOWN_INPUTS, POINTS_OPTIONS } from '@/types/buydown';
import { buildBuydownScenario, buildBuydownComparison } from '@/lib/buydown';

interface UseBuydownCalculatorReturn {
  // Selected scenario inputs
  numberOfPoints: number;
  setNumberOfPoints: (points: number) => void;
  rateReductionPerPoint: number;
  setRateReductionPerPoint: (reduction: number) => void;
  isRefinance: boolean;
  setIsRefinance: (isRefi: boolean) => void;
  expectedOwnershipYears: number;
  setExpectedOwnershipYears: (years: number) => void;
  marginalTaxRate: number;
  setMarginalTaxRate: (rate: number) => void;

  // Calculated results
  selectedScenario: BuydownScenario;
  comparison: BuydownComparison;
}

export function useBuydownCalculator(
  loanAmount: number,
  baseInterestRate: number,
  loanTermMonths: number,
  initialSettings: Partial<BuydownInputs> = {}
): UseBuydownCalculatorReturn {
  const [numberOfPoints, setNumberOfPoints] = useState(
    initialSettings.numberOfPoints ?? DEFAULT_BUYDOWN_INPUTS.numberOfPoints ?? 1
  );
  const [rateReductionPerPoint, setRateReductionPerPoint] = useState(
    initialSettings.rateReductionPerPoint ?? DEFAULT_BUYDOWN_INPUTS.rateReductionPerPoint ?? 0.25
  );
  const [isRefinance, setIsRefinance] = useState(
    initialSettings.isRefinance ?? DEFAULT_BUYDOWN_INPUTS.isRefinance ?? false
  );
  const [expectedOwnershipYears, setExpectedOwnershipYears] = useState(
    initialSettings.expectedOwnershipYears ?? DEFAULT_BUYDOWN_INPUTS.expectedOwnershipYears ?? 7
  );
  const [marginalTaxRate, setMarginalTaxRate] = useState(
    initialSettings.marginalTaxRate ?? DEFAULT_BUYDOWN_INPUTS.marginalTaxRate ?? 0.24
  );

  const selectedScenario = useMemo(
    () =>
      buildBuydownScenario({
        loanAmount,
        baseInterestRate,
        loanTermMonths,
        numberOfPoints,
        rateReductionPerPoint,
        isRefinance,
        expectedOwnershipYears,
        marginalTaxRate,
      }),
    [
      loanAmount,
      baseInterestRate,
      loanTermMonths,
      numberOfPoints,
      rateReductionPerPoint,
      isRefinance,
      expectedOwnershipYears,
      marginalTaxRate,
    ]
  );

  const comparison = useMemo(
    () =>
      buildBuydownComparison(
        {
          loanAmount,
          baseInterestRate,
          loanTermMonths,
          rateReductionPerPoint,
          isRefinance,
          expectedOwnershipYears,
          marginalTaxRate,
        },
        [...POINTS_OPTIONS]
      ),
    [
      loanAmount,
      baseInterestRate,
      loanTermMonths,
      rateReductionPerPoint,
      isRefinance,
      expectedOwnershipYears,
      marginalTaxRate,
    ]
  );

  return {
    numberOfPoints,
    setNumberOfPoints,
    rateReductionPerPoint,
    setRateReductionPerPoint,
    isRefinance,
    setIsRefinance,
    expectedOwnershipYears,
    setExpectedOwnershipYears,
    marginalTaxRate,
    setMarginalTaxRate,
    selectedScenario,
    comparison,
  };
}
