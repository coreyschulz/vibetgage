import { Header } from '@/components/layout';
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui';
import { Card, StatCard } from '@/components/ui';
import { CurrencyInput, PercentInput } from '@/components/ui';
import { Select } from '@/components/ui';
import { Slider } from '@/components/ui';
import { PaymentPieChart, AmortizationChart, TaxBenefitChart, ItemizationComparisonChart, BuydownChart } from '@/components/charts';
import { useMortgageCalculator, useTaxBenefit, useBuydownCalculator } from '@/hooks';
import { formatCurrency, formatPercent, formatMonthsDuration } from '@/lib/formatters';
import { generateYearlySummary, analyzeFrontLoadedInterest } from '@/lib/amortization';
import { getPaymentBreakdown } from '@/lib/mortgage';
import { LOAN_TERM_OPTIONS } from '@/types/mortgage';
import { FILING_STATUS_LABELS, type FilingStatus } from '@/types/tax';
import { COMMON_TAX_RATES } from '@/constants/taxRules';

function App() {

  // Core mortgage calculator
  const { inputs, results, schedule, updateInput } = useMortgageCalculator();

  // Tax benefit calculator
  const { profile, taxBenefits, updateProfile } = useTaxBenefit(
    schedule,
    inputs.loanAmount
  );

  // Buydown calculator
  const buydown = useBuydownCalculator(
    inputs.loanAmount,
    inputs.interestRate,
    inputs.loanTermMonths
  );

  // Derived data
  const paymentBreakdown = getPaymentBreakdown(inputs);
  const yearlySummaries = generateYearlySummary(schedule);
  const frontLoadedAnalysis = analyzeFrontLoadedInterest(schedule);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultTab="calculator">
          <TabList className="mb-8">
            <Tab value="calculator">Mortgage Calculator</Tab>
            <Tab value="amortization">Amortization</Tab>
            <Tab value="tax">Tax Benefits</Tab>
            <Tab value="buydown">Rate Buydown</Tab>
          </TabList>

          {/* Mortgage Calculator Tab */}
          <TabPanel value="calculator">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Input Form */}
              <Card title="Loan Details" className="lg:col-span-1">
                <div className="space-y-4">
                  <CurrencyInput
                    label="Home Price"
                    value={inputs.homePrice}
                    onChange={(v) => updateInput('homePrice', v)}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <CurrencyInput
                      label="Down Payment"
                      value={inputs.downPayment}
                      onChange={(v) => updateInput('downPayment', v)}
                    />
                    <PercentInput
                      label="Down %"
                      value={inputs.downPaymentPercent}
                      onChange={(v) => updateInput('downPaymentPercent', v)}
                    />
                  </div>

                  <PercentInput
                    label="Interest Rate"
                    value={inputs.interestRate}
                    onChange={(v) => updateInput('interestRate', v)}
                  />

                  <Select
                    label="Loan Term"
                    value={inputs.loanTermMonths}
                    onChange={(e) => updateInput('loanTermMonths', parseInt(e.target.value))}
                    options={LOAN_TERM_OPTIONS.map((opt) => ({
                      value: opt.months,
                      label: opt.label,
                    }))}
                  />

                  <PercentInput
                    label="Property Tax Rate"
                    value={inputs.propertyTaxRate}
                    onChange={(v) => updateInput('propertyTaxRate', v)}
                  />

                  <CurrencyInput
                    label="Annual Home Insurance"
                    value={inputs.homeInsurance}
                    onChange={(v) => updateInput('homeInsurance', v)}
                  />

                  <CurrencyInput
                    label="Monthly HOA"
                    value={inputs.hoaFees}
                    onChange={(v) => updateInput('hoaFees', v)}
                  />
                </div>
              </Card>

              {/* Results */}
              <div className="lg:col-span-2 space-y-6">
                {/* Key Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    label="Monthly Payment"
                    value={formatCurrency(results.totalMonthlyPayment)}
                    subvalue="PITI + PMI"
                  />
                  <StatCard
                    label="Principal & Interest"
                    value={formatCurrency(results.monthlyPrincipalAndInterest)}
                  />
                  <StatCard
                    label="Total Interest"
                    value={formatCurrency(results.totalInterestPaid)}
                    subvalue="Over loan life"
                  />
                  <StatCard
                    label="Loan Amount"
                    value={formatCurrency(inputs.loanAmount)}
                    subvalue={`${formatPercent(results.loanToValueRatio * 100, 0)} LTV`}
                  />
                </div>

                {/* Payment Breakdown */}
                <Card title="Monthly Payment Breakdown">
                  <PaymentPieChart breakdown={paymentBreakdown} />
                </Card>

                {/* PMI Info (if applicable) */}
                {results.monthlyPMI > 0 && (
                  <Card title="PMI Information" className="bg-warning-50 border-warning-200">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-warning-700">Monthly PMI</p>
                        <p className="text-xl font-bold text-warning-800">
                          {formatCurrency(results.monthlyPMI)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-warning-700">PMI Drops Off</p>
                        <p className="text-xl font-bold text-warning-800">
                          {results.pmiDropOffMonth
                            ? `Month ${results.pmiDropOffMonth}`
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-warning-700">Total PMI Paid</p>
                        <p className="text-xl font-bold text-warning-800">
                          {formatCurrency(results.totalPMIPaid)}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabPanel>

          {/* Amortization Tab */}
          <TabPanel value="amortization">
            <div className="space-y-6">
              {/* Front-loaded Interest Insight */}
              <Card className="bg-primary-50 border-primary-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-900">Front-Loaded Interest</h3>
                    <p className="text-primary-700 mt-1">
                      In the first half of your loan, you'll pay{' '}
                      <strong>{formatCurrency(frontLoadedAnalysis.firstHalfInterest)}</strong> in interest,
                      which is <strong>{frontLoadedAnalysis.ratio.toFixed(1)}x more</strong> than the{' '}
                      <strong>{formatCurrency(frontLoadedAnalysis.secondHalfInterest)}</strong> in the second half.
                      This is why mortgage interest tax deductions are most valuable early in the loan.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Cumulative Chart */}
              <Card title="Cumulative Principal vs Interest">
                <AmortizationChart yearlySummaries={yearlySummaries} showBalance />
              </Card>

              {/* Yearly Summary Table */}
              <Card title="Yearly Summary">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Year</th>
                        <th className="text-right py-2 px-4">Principal</th>
                        <th className="text-right py-2 px-4">Interest</th>
                        <th className="text-right py-2 px-4">Total Paid</th>
                        <th className="text-right py-2 px-4">Balance</th>
                        <th className="text-right py-2 px-4">Principal %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearlySummaries.slice(0, 10).map((year) => (
                        <tr key={year.year} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">{year.year}</td>
                          <td className="text-right py-2 px-4 text-success-600">
                            {formatCurrency(year.principalPaid)}
                          </td>
                          <td className="text-right py-2 px-4 text-warning-600">
                            {formatCurrency(year.interestPaid)}
                          </td>
                          <td className="text-right py-2 px-4">
                            {formatCurrency(year.totalPaid)}
                          </td>
                          <td className="text-right py-2 px-4">
                            {formatCurrency(year.endingBalance)}
                          </td>
                          <td className="text-right py-2 px-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                year.principalPercent > 50
                                  ? 'bg-success-100 text-success-700'
                                  : 'bg-warning-100 text-warning-700'
                              }`}
                            >
                              {year.principalPercent.toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {yearlySummaries.length > 10 && (
                    <p className="text-center text-gray-500 py-4">
                      Showing first 10 years of {yearlySummaries.length} total years
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </TabPanel>

          {/* Tax Benefits Tab */}
          <TabPanel value="tax">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tax Profile Form */}
              <Card title="Your Tax Situation" className="lg:col-span-1">
                <div className="space-y-4">
                  <Select
                    label="Filing Status"
                    value={profile.filingStatus}
                    onChange={(e) => updateProfile('filingStatus', e.target.value as FilingStatus)}
                    options={Object.entries(FILING_STATUS_LABELS).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                  />

                  <CurrencyInput
                    label="Annual Household Income"
                    value={profile.annualIncome}
                    onChange={(v) => updateProfile('annualIncome', v)}
                  />

                  <Select
                    label="Marginal Tax Rate"
                    value={profile.marginalTaxRateOverride ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateProfile(
                        'marginalTaxRateOverride',
                        val ? parseFloat(val) : undefined
                      );
                    }}
                    options={[
                      { value: '', label: 'Auto (based on income)' },
                      ...COMMON_TAX_RATES.map((r) => ({
                        value: r.rate,
                        label: r.label,
                      })),
                    ]}
                  />

                  <PercentInput
                    label="State Tax Rate"
                    value={profile.stateTaxRate * 100}
                    onChange={(v) => updateProfile('stateTaxRate', v / 100)}
                  />

                  <CurrencyInput
                    label="State & Local Taxes (SALT)"
                    value={profile.stateAndLocalTaxes}
                    onChange={(v) => updateProfile('stateAndLocalTaxes', v)}
                  />

                  <CurrencyInput
                    label="Charitable Contributions"
                    value={profile.charitableContributions}
                    onChange={(v) => updateProfile('charitableContributions', v)}
                  />

                  <CurrencyInput
                    label="Other Itemized Deductions"
                    value={profile.otherItemizedDeductions}
                    onChange={(v) => updateProfile('otherItemizedDeductions', v)}
                  />
                </div>
              </Card>

              {/* Tax Results */}
              <div className="lg:col-span-2 space-y-6">
                {taxBenefits && (
                  <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatCard
                        label="Total Tax Savings"
                        value={formatCurrency(taxBenefits.totalTaxSavings)}
                        subvalue={`Over ${taxBenefits.yearsOfItemization} years`}
                        trend="up"
                      />
                      <StatCard
                        label="First Year Savings"
                        value={formatCurrency(taxBenefits.yearlyBreakdown[0]?.totalTaxSavings || 0)}
                      />
                      <StatCard
                        label="Effective Rate (Yr 1)"
                        value={formatPercent(taxBenefits.firstYearEffectiveRate)}
                        subvalue={`vs ${formatPercent(inputs.interestRate)} nominal`}
                        trend="down"
                      />
                      <StatCard
                        label="Itemization Ends"
                        value={taxBenefits.breakEvenYear ? `Year ${taxBenefits.breakEvenYear}` : 'Never'}
                        subvalue={taxBenefits.breakEvenYear ? 'Standard better after' : 'Always itemize'}
                      />
                    </div>

                    {/* Tax Benefit Chart */}
                    <Card title="Interest & Tax Savings Over Time">
                      <TaxBenefitChart
                        yearlyData={taxBenefits.yearlyBreakdown}
                        breakEvenYear={taxBenefits.breakEvenYear}
                      />
                    </Card>

                    {/* Itemization Comparison */}
                    <Card title="Itemized vs Standard Deduction">
                      <ItemizationComparisonChart yearlyData={taxBenefits.yearlyBreakdown} />
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <strong>Year 1:</strong> Your itemized deductions of{' '}
                          <strong>{formatCurrency(taxBenefits.yearlyBreakdown[0]?.totalItemizedDeductions || 0)}</strong>{' '}
                          {(taxBenefits.yearlyBreakdown[0]?.shouldItemize) ? 'exceed' : 'are less than'} the standard deduction of{' '}
                          <strong>{formatCurrency(taxBenefits.yearlyBreakdown[0]?.standardDeduction || 0)}</strong>.
                          {taxBenefits.yearlyBreakdown[0]?.shouldItemize
                            ? ` You save an additional ${formatCurrency(taxBenefits.yearlyBreakdown[0]?.totalTaxSavings || 0)} by itemizing.`
                            : ' Taking the standard deduction is better for you.'}
                        </p>
                      </div>
                    </Card>
                  </>
                )}
              </div>
            </div>
          </TabPanel>

          {/* Rate Buydown Tab */}
          <TabPanel value="buydown">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Buydown Inputs */}
              <Card title="Buydown Configuration" className="lg:col-span-1">
                <div className="space-y-6">
                  <div>
                    <Slider
                      label="Discount Points"
                      value={buydown.numberOfPoints}
                      onChange={buydown.setNumberOfPoints}
                      min={0}
                      max={4}
                      step={0.5}
                      valueFormat={(v) => `${v} point${v !== 1 ? 's' : ''}`}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Cost: {formatCurrency(buydown.selectedScenario.pointsCostDollars)}
                    </p>
                  </div>

                  <PercentInput
                    label="Rate Reduction per Point"
                    value={buydown.rateReductionPerPoint}
                    onChange={buydown.setRateReductionPerPoint}
                  />

                  <Slider
                    label="Expected Ownership"
                    value={buydown.expectedOwnershipYears}
                    onChange={buydown.setExpectedOwnershipYears}
                    min={1}
                    max={30}
                    step={1}
                    valueFormat={(v) => `${v} year${v !== 1 ? 's' : ''}`}
                  />

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isRefinance"
                      checked={buydown.isRefinance}
                      onChange={(e) => buydown.setIsRefinance(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="isRefinance" className="text-sm text-gray-700">
                      This is a refinance (affects points tax deduction)
                    </label>
                  </div>

                  <Select
                    label="Marginal Tax Rate"
                    value={buydown.marginalTaxRate}
                    onChange={(e) => buydown.setMarginalTaxRate(parseFloat(e.target.value))}
                    options={COMMON_TAX_RATES.map((r) => ({
                      value: r.rate,
                      label: r.label,
                    }))}
                  />
                </div>
              </Card>

              {/* Buydown Results */}
              <div className="lg:col-span-2 space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    label="New Rate"
                    value={formatPercent(buydown.selectedScenario.boughtDownRate)}
                    subvalue={`-${formatPercent(buydown.selectedScenario.rateReduction)}`}
                    trend="down"
                  />
                  <StatCard
                    label="Monthly Savings"
                    value={formatCurrency(buydown.selectedScenario.monthlySavings)}
                  />
                  <StatCard
                    label="Break-Even"
                    value={formatMonthsDuration(buydown.selectedScenario.breakEvenMonths)}
                    trend={
                      buydown.selectedScenario.breakEvenYears <= buydown.expectedOwnershipYears
                        ? 'up'
                        : 'down'
                    }
                  />
                  <StatCard
                    label="Lifetime Savings"
                    value={formatCurrency(buydown.selectedScenario.netSavingsOverLife)}
                    trend={buydown.selectedScenario.netSavingsOverLife > 0 ? 'up' : 'down'}
                  />
                </div>

                {/* Recommendation */}
                <Card
                  className={`${
                    buydown.comparison.optimalScenario.numberOfPoints === buydown.numberOfPoints
                      ? 'bg-success-50 border-success-200'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        buydown.comparison.optimalScenario.numberOfPoints === buydown.numberOfPoints
                          ? 'bg-success-100'
                          : 'bg-gray-200'
                      }`}
                    >
                      <svg
                        className={`w-5 h-5 ${
                          buydown.comparison.optimalScenario.numberOfPoints === buydown.numberOfPoints
                            ? 'text-success-600'
                            : 'text-gray-500'
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Recommendation</h4>
                      <p className="text-sm text-gray-600 mt-1">{buydown.comparison.recommendation}</p>
                    </div>
                  </div>
                </Card>

                {/* Scenario Comparison Chart */}
                <Card title="Cumulative Net Savings Over Time">
                  <p className="text-sm text-gray-500 mb-4">
                    Shows net savings (monthly savings minus upfront cost) for each points scenario
                  </p>
                  <BuydownChart
                    scenarios={buydown.comparison.scenarios}
                    expectedOwnershipYears={buydown.expectedOwnershipYears}
                    highlightedPoints={buydown.numberOfPoints}
                  />
                </Card>

                {/* Comparison Table */}
                <Card title="All Scenarios Comparison">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3">Points</th>
                          <th className="text-right py-2 px-3">Cost</th>
                          <th className="text-right py-2 px-3">Rate</th>
                          <th className="text-right py-2 px-3">Monthly</th>
                          <th className="text-right py-2 px-3">Break-Even</th>
                          <th className="text-right py-2 px-3">Net at {buydown.expectedOwnershipYears}yr</th>
                        </tr>
                      </thead>
                      <tbody>
                        {buydown.comparison.scenarios.map((scenario) => {
                          const netAtOwnership =
                            scenario.monthlySavings * buydown.expectedOwnershipYears * 12 -
                            scenario.pointsCostDollars;
                          const isSelected = scenario.numberOfPoints === buydown.numberOfPoints;
                          const isOptimal =
                            scenario.numberOfPoints === buydown.comparison.optimalScenario.numberOfPoints;

                          return (
                            <tr
                              key={scenario.numberOfPoints}
                              className={`border-b ${isSelected ? 'bg-primary-50' : ''} ${
                                isOptimal ? 'font-medium' : ''
                              }`}
                            >
                              <td className="py-2 px-3">
                                {scenario.numberOfPoints}
                                {isOptimal && (
                                  <span className="ml-2 text-xs bg-success-100 text-success-700 px-1.5 py-0.5 rounded">
                                    Best
                                  </span>
                                )}
                              </td>
                              <td className="text-right py-2 px-3">
                                {formatCurrency(scenario.pointsCostDollars)}
                              </td>
                              <td className="text-right py-2 px-3">
                                {formatPercent(scenario.boughtDownRate)}
                              </td>
                              <td className="text-right py-2 px-3">
                                {formatCurrency(scenario.boughtDownMonthlyPayment)}
                              </td>
                              <td className="text-right py-2 px-3">
                                {scenario.numberOfPoints === 0
                                  ? '-'
                                  : formatMonthsDuration(scenario.breakEvenMonths)}
                              </td>
                              <td
                                className={`text-right py-2 px-3 ${
                                  netAtOwnership > 0 ? 'text-success-600' : 'text-danger-600'
                                }`}
                              >
                                {formatCurrency(netAtOwnership)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          </TabPanel>
        </Tabs>
      </main>

      <footer className="mt-12 py-6 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Vibetgage uses 2025 tax rules. Consult a tax professional for personalized advice.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
