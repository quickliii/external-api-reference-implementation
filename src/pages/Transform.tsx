import { useState, useRef, useEffect } from 'react';
import { TransformPanel } from '../components/TransformPanel';
import { lixiToScenario, scenarioToLixi } from '../reference/transform';
import { scenarioSchema, lixiSchema } from '../reference/transform/schema';
import type { LIXIEnvelope, QuickliApiScenario } from '../reference/transform/types';

type TransformSource = 'lixi' | 'scenario';
type Status = 'idle' | 'transforming' | 'synced' | 'error';

const STATUS_DISPLAY: Record<Status, { dot: string; label: string }> = {
  idle: { dot: 'bg-slate-400 dark:bg-slate-500 opacity-40', label: 'Ready' },
  transforming: { dot: 'bg-slate-400 dark:bg-slate-500 animate-pulse', label: 'Transforming...' },
  synced: { dot: 'bg-emerald-400', label: 'Synced' },
  error: { dot: 'bg-red-400', label: 'Error' },
};

type Example = {
  label: string;
  description: string;
  source: TransformSource;
  data: object;
};

const EXAMPLES: Example[] = [
  {
    label: 'Minimal v3 scenario',
    description: 'Bare-bones structure with only required fields',
    source: 'scenario',
    data: {
      scenario: {
        households: [{ id: 'hh-1', status: 'single', shared_with_households: [], num_adults: 1, num_dependants: 0 }],
        income: [{ id: 'inc-1', which_household: 0, payg: 80000 }],
        living_expenses: [{ id: 'hh-1', primary_residence: 0, use_detailed_basic_expense: true, simple_basic_expense: 0 }],
        liabilities: [],
        proposed_home_loans: [],
        existing_home_loans: [],
        self_employed_income: [],
      },
    },
  },
  {
    label: 'Minimal — all sections',
    description: 'One entry in every array: liability, self-employed, existing + proposed loan',
    source: 'scenario',
    data: {
      scenario: {
        households: [{ id: 'hh-1', status: 'single', shared_with_households: [], num_adults: 1, num_dependants: 0 }],
        income: [{ id: 'inc-1', which_household: 0, payg: 80000 }],
        living_expenses: [{ id: 'hh-1', primary_residence: 0, use_detailed_basic_expense: true, simple_basic_expense: 0 }],
        liabilities: [{ id: 'lia-1', loan_type: 'credit_card', limit: 10000, monthly_repayment: 250, rate: 21.99 }],
        self_employed_income: [{
          id: 'se-1',
          entity_type: 'sole_trader',
          calculation_method: 'lender_default',
          most_recent_year_details: { net_profit_before_tax: 95000, personal_wages_before_tax: [0] },
          previous_year_details: { net_profit_before_tax: 85000, personal_wages_before_tax: [0] },
          applicant_ownership: [100],
          business_liabilities: [{ id: 'bl-1', facility_type: 'overdraft', limit: 20000, actual_rate: 8.5, monthly_repayment: 400 }],
        }],
        existing_home_loans: [
          { id: 'hl-1', product_type: 'variable_package', loan_type: 'owner_occupied', loan_amount: 500000, loan_balance: 450000, actual_rate: 6.2, term: 28 },
        ],
        proposed_home_loans: [
          { id: 'hl-2', product_type: 'variable_package', loan_type: 'owner_occupied', loan_amount: 600000, term: 30, lvr: 80 },
        ],
        securities: [{ id: 'sec-1', property_purpose: 'owner_occupied', property_type: 'house', transaction_type: 'owns_with_mortgage', value: 750000, applicant_ownership: [100] }],
        home_loan_security_links: [{ id: 'link-1', which_security_ids: ['sec-1'], which_existing_home_loan_ids: ['hl-1'], which_proposed_home_loan_ids: [] }],
      },
    },
  },
  {
    label: 'Single PAYG employee',
    description: 'Salary + bonus, credit card, investment property',
    source: 'lixi',
    data: {
      content: {
        application: {
          household: [{ uniqueID: 'hh-1', dependant: [{ age: 4 }, { age: 7 }], expenseDetails: { livingExpense: [{ category: 'Groceries', amount: 800, frequency: 'Monthly' }, { category: 'Transport', amount: 200, frequency: 'Monthly' }], OtherCommitment: [] } }],
          personApplicant: [{ uniqueID: 'app-1', x_Household: 'hh-1', maritalStatus: 'Married', personName: { firstName: 'Jane', surname: 'Smith' }, employment: [{ payg: { status: 'Primary', basis: 'Full Time', income: { grossSalaryAmount: 120000, grossSalaryFrequency: 'Yearly', bonusAmount: 10000, bonusFrequency: 'Yearly' } } }] }],
          liability: [{ uniqueID: 'l-1', type: 'Credit Card', creditLimit: 10000, outstandingBalance: 3500, annualInterestRate: 21.99, repayment: [{ repaymentAmount: 250, repaymentFrequency: 'Monthly' }], percentOwned: { owner: [{ x_Party: 'app-1', percent: 100 }] } }],
          realEstateAsset: [{ uniqueID: 'sec-1', transaction: 'Owns Existing Mortgage', primaryPurpose: 'Investment', propertyType: { propertyTypeName: 'Apartment' }, estimatedValue: { value: 650000 }, rentalIncome: [{ rentalAmount: 550, frequency: 'Weekly' }], percentOwned: { owner: [{ x_Party: 'app-1', percent: 100 }] } }],
          loanDetails: [{ uniqueID: 'loan-1', amountRequested: 500000, term: { interestType: 'Variable', totalTermDuration: 30, totalTermUnits: 'Years' }, borrowers: { owner: [{ x_Party: 'app-1', percent: 100 }] }, loanPurpose: { primaryPurpose: 'Owner Occupied' } }],
          address: [], otherIncome: [], relatedCompany: [],
        },
      },
    },
  },
  {
    label: 'Dual income couple',
    description: 'Two PAYG applicants, home loan, car loan',
    source: 'lixi',
    data: {
      content: {
        application: {
          household: [{ uniqueID: 'hh-1', dependant: [], expenseDetails: { livingExpense: [{ category: 'Groceries', amount: 1200, frequency: 'Monthly' }, { category: 'Transport', amount: 400, frequency: 'Monthly' }, { category: 'Insurance', amount: 150, frequency: 'Monthly' }], OtherCommitment: [] } }],
          personApplicant: [
            { uniqueID: 'app-1', x_Household: 'hh-1', maritalStatus: 'Married', personName: { firstName: 'Tom', surname: 'Chen' }, employment: [{ payg: { status: 'Primary', basis: 'Full Time', income: { grossSalaryAmount: 95000, grossSalaryFrequency: 'Yearly' } } }] },
            { uniqueID: 'app-2', x_Household: 'hh-1', maritalStatus: 'Married', personName: { firstName: 'Lisa', surname: 'Chen' }, employment: [{ payg: { status: 'Primary', basis: 'Full Time', income: { grossSalaryAmount: 85000, grossSalaryFrequency: 'Yearly', grossRegularOvertimeAmount: 8000, grossRegularOvertimeFrequency: 'Yearly' } } }] },
          ],
          realEstateAsset: [{ uniqueID: 'sec-1', transaction: 'Purchasing', primaryPurpose: 'Owner Occupied', propertyType: { propertyTypeName: 'House' }, estimatedValue: { value: 850000 }, percentOwned: { owner: [{ x_Party: 'app-1', percent: 50 }, { x_Party: 'app-2', percent: 50 }] } }],
          liability: [{ uniqueID: 'l-1', type: 'Car Loan', outstandingBalance: 18000, annualInterestRate: 7.5, repayment: [{ repaymentAmount: 450, repaymentFrequency: 'Monthly' }], remainingTerm: { duration: 4, units: 'Years' }, percentOwned: { owner: [{ x_Party: 'app-1', percent: 100 }] } }],
          loanDetails: [{ uniqueID: 'loan-1', amountRequested: 680000, term: { interestType: 'Variable', totalTermDuration: 30, totalTermUnits: 'Years' }, borrowers: { owner: [{ x_Party: 'app-1', percent: 50 }, { x_Party: 'app-2', percent: 50 }] }, loanPurpose: { primaryPurpose: 'Owner Occupied' } }],
          address: [], otherIncome: [], relatedCompany: [],
        },
      },
    },
  },
  {
    label: 'Two singles, one household',
    description: 'Two single applicants sharing a household with separate incomes',
    source: 'lixi',
    data: {
      content: {
        application: {
          household: [
            { uniqueID: 'hh-1', dependant: [], expenseDetails: { livingExpense: [{ category: 'Groceries', amount: 500, frequency: 'Monthly' }], OtherCommitment: [] } },
            { uniqueID: 'hh-2', dependant: [], expenseDetails: { livingExpense: [{ category: 'Groceries', amount: 400, frequency: 'Monthly' }], OtherCommitment: [] } },
          ],
          personApplicant: [
            { uniqueID: 'app-1', x_Household: 'hh-1', maritalStatus: 'Single', personName: { firstName: 'Alex', surname: 'Brown' }, employment: [{ payg: { status: 'Primary', basis: 'Full Time', income: { grossSalaryAmount: 90000, grossSalaryFrequency: 'Yearly' } } }] },
            { uniqueID: 'app-2', x_Household: 'hh-2', maritalStatus: 'Single', personName: { firstName: 'Jordan', surname: 'Lee' }, employment: [{ payg: { status: 'Primary', basis: 'Full Time', income: { grossSalaryAmount: 75000, grossSalaryFrequency: 'Yearly' } } }] },
          ],
          loanDetails: [{ uniqueID: 'loan-1', amountRequested: 550000, term: { interestType: 'Variable', totalTermDuration: 30, totalTermUnits: 'Years' }, borrowers: { owner: [{ x_Party: 'app-1', percent: 50 }, { x_Party: 'app-2', percent: 50 }] }, loanPurpose: { primaryPurpose: 'Owner Occupied' } }],
          realEstateAsset: [], liability: [], address: [], otherIncome: [], relatedCompany: [],
        },
      },
    },
  },
  {
    label: 'Self-employed borrower',
    description: 'Sole trader with business income, personal loan, HECS',
    source: 'lixi',
    data: {
      content: {
        application: {
          household: [{ uniqueID: 'hh-1', dependant: [{ age: 3 }], expenseDetails: { livingExpense: [{ category: 'Groceries', amount: 600, frequency: 'Monthly' }, { category: 'Childcare', amount: 250, frequency: 'Weekly' }], OtherCommitment: [] } }],
          personApplicant: [{ uniqueID: 'app-1', x_Household: 'hh-1', maritalStatus: 'Single', personName: { firstName: 'Sam', surname: 'Patel' }, employment: [{ selfEmployed: { x_Employer: 'co-1', businessIncomeRecent: { profitBeforeTax: 110000, startDate: '2024-07-01', addback: { depreciation: 8000, interest: 5000, salary: 0 } }, businessIncomePrior: { profitBeforeTax: 95000, startDate: '2023-07-01', addback: { depreciation: 7500, interest: 4500, salary: 0 } } } }] }],
          liability: [
            { uniqueID: 'l-1', type: 'Personal Loan', outstandingBalance: 12000, annualInterestRate: 9.99, repayment: [{ repaymentAmount: 350, repaymentFrequency: 'Monthly' }], remainingTerm: { duration: 3, units: 'Years' }, percentOwned: { owner: [{ x_Party: 'app-1', percent: 100 }] } },
            { uniqueID: 'l-2', type: 'HECS-HELP', outstandingBalance: 28000, percentOwned: { owner: [{ x_Party: 'app-1', percent: 100 }] } },
          ],
          otherIncome: [{ type: 'Dividends', amount: 3200, frequency: 'Yearly', percentOwned: { owner: [{ x_Party: 'app-1', percent: 100 }] } }],
          loanDetails: [{ uniqueID: 'loan-1', amountRequested: 450000, term: { interestType: 'Variable', totalTermDuration: 30, totalTermUnits: 'Years' }, borrowers: { owner: [{ x_Party: 'app-1', percent: 100 }] }, loanPurpose: { primaryPurpose: 'Owner Occupied' } }],
          realEstateAsset: [],
          address: [],
          relatedCompany: [{ uniqueID: 'co-1', companyName: 'Patel Digital Pty Ltd', businessStructure: 'Sole Trader', shareHolder: [{ x_Shareholder: 'app-1', percentOwned: 100 }] }],
        },
      },
    },
  },
  {
    label: 'Property investor',
    description: 'Multiple investment properties, rental income, interest-only loans',
    source: 'lixi',
    data: {
      content: {
        application: {
          household: [{ uniqueID: 'hh-1', dependant: [], expenseDetails: { livingExpense: [{ category: 'Groceries', amount: 900, frequency: 'Monthly' }, { category: 'General Basic Insurances', amount: 300, frequency: 'Monthly' }], OtherCommitment: [] } }],
          personApplicant: [{ uniqueID: 'app-1', x_Household: 'hh-1', maritalStatus: 'Single', personName: { firstName: 'Rachel', surname: 'Nguyen' }, employment: [{ payg: { status: 'Primary', basis: 'Full Time', income: { grossSalaryAmount: 145000, grossSalaryFrequency: 'Yearly' } } }] }],
          realEstateAsset: [
            { uniqueID: 'sec-1', transaction: 'Owns Existing Mortgage', primaryPurpose: 'Owner Occupied', propertyType: { propertyTypeName: 'House' }, estimatedValue: { value: 1100000 }, percentOwned: { owner: [{ x_Party: 'app-1', percent: 100 }] } },
            { uniqueID: 'sec-2', transaction: 'Owns Existing Mortgage', primaryPurpose: 'Investment', propertyType: { propertyTypeName: 'Apartment' }, estimatedValue: { value: 520000 }, rentalIncome: [{ rentalAmount: 480, frequency: 'Weekly' }], percentOwned: { owner: [{ x_Party: 'app-1', percent: 100 }] } },
            { uniqueID: 'sec-3', transaction: 'Owns Existing Mortgage', primaryPurpose: 'Investment', propertyType: { propertyTypeName: 'House' }, estimatedValue: { value: 680000 }, rentalIncome: [{ rentalAmount: 620, frequency: 'Weekly' }], percentOwned: { owner: [{ x_Party: 'app-1', percent: 100 }] } },
          ],
          liability: [
            { uniqueID: 'l-1', type: 'Credit Card', creditLimit: 15000, outstandingBalance: 2000, annualInterestRate: 20.99, repayment: [{ repaymentAmount: 300, repaymentFrequency: 'Monthly' }], percentOwned: { owner: [{ x_Party: 'app-1', percent: 100 }] } },
            { uniqueID: 'l-2', type: 'Mortgage Loan', creditLimit: 720000, outstandingBalance: 720000, annualInterestRate: 6.15, repayment: [{ repaymentAmount: 4400, repaymentFrequency: 'Monthly' }], remainingTerm: { duration: 27, units: 'Years' }, security: [{ x_RealEstateAsset: 'sec-1' }], percentOwned: { owner: [{ x_Party: 'app-1', percent: 100 }] } },
            { uniqueID: 'l-3', type: 'Mortgage Loan', creditLimit: 390000, outstandingBalance: 390000, annualInterestRate: 6.49, repayment: [{ repaymentAmount: 2110, repaymentFrequency: 'Monthly' }], remainingTerm: { duration: 25, units: 'Years' }, loanPurpose: { primaryPurpose: 'Investment Residential' }, security: [{ x_RealEstateAsset: 'sec-2' }], percentOwned: { owner: [{ x_Party: 'app-1', percent: 100 }] } },
            { uniqueID: 'l-4', type: 'Mortgage Loan', creditLimit: 510000, outstandingBalance: 510000, annualInterestRate: 6.29, repayment: [{ repaymentAmount: 2680, repaymentFrequency: 'Monthly' }], remainingTerm: { duration: 22, units: 'Years' }, loanPurpose: { primaryPurpose: 'Investment Residential' }, security: [{ x_RealEstateAsset: 'sec-3' }], percentOwned: { owner: [{ x_Party: 'app-1', percent: 100 }] } },
          ],
          address: [],
          loanDetails: [{ uniqueID: 'loan-1', amountRequested: 400000, term: { interestType: 'Variable', totalTermDuration: 30, totalTermUnits: 'Years' }, borrowers: { owner: [{ x_Party: 'app-1', percent: 100 }] }, loanPurpose: { primaryPurpose: 'Investment Residential' } }], otherIncome: [], relatedCompany: [],
        },
      },
    },
  },
  {
    label: 'Cross-collateralised',
    description: 'Cross-linked securities, dual income, mixed OO + investment with overlapping loan-security links',
    source: 'scenario',
    data: {
      scenario: {
        households: [{ id: 'hh-1', status: 'married', shared_with_households: [], num_adults: 2, num_dependants: 2 }],
        income: [
          { id: 'inc-1', which_household: 0, payg: 155000, bonus: 12000 },
          { id: 'inc-2', which_household: 0, payg: 90000, overtime: 5000 },
        ],
        living_expenses: [{ id: 'hh-1', primary_residence: 0, use_detailed_basic_expense: true, simple_basic_expense: 0 }],
        liabilities: [
          { id: 'lia-1', loan_type: 'credit_card', limit: 12000, monthly_repayment: 300, rate: 21.99 },
          { id: 'lia-2', loan_type: 'car', limit: 15000, monthly_repayment: 420, rate: 7.5 },
        ],
        self_employed_income: [],
        existing_home_loans: [
          { id: 'ehl-1', product_type: 'variable_package', loan_type: 'owner_occupied', loan_amount: 700000, loan_balance: 520000, actual_rate: 5.99, term: 24, monthly_repayment: 3800 },
          { id: 'ehl-2', product_type: 'variable_package', loan_type: 'investment', loan_amount: 750000, loan_balance: 620000, actual_rate: 6.29, term: 26, monthly_repayment: 4100, applicant_tax_benefit: [100] },
        ],
        proposed_home_loans: [
          { id: 'phl-1', product_type: 'variable_package', loan_type: 'owner_occupied', loan_amount: 960000, term: 30, lvr: 80 },
          { id: 'phl-2', product_type: 'fixed_rate_3_year', loan_type: 'investment', loan_amount: 520000, term: 30, lvr: 80, interest_only_period: 3, applicant_tax_benefit: [100] },
        ],
        securities: [
          { id: 'sec-1', property_purpose: 'owner_occupied', property_type: 'house', transaction_type: 'owns_with_mortgage', value: 950000, applicant_ownership: [50, 50] },
          { id: 'sec-2', property_purpose: 'investment', property_type: 'apartment', transaction_type: 'owns_with_mortgage', value: 520000, weekly_rental_income: 450, applicant_ownership: [100] },
          { id: 'sec-3', property_purpose: 'investment', property_type: 'house', transaction_type: 'owns_with_mortgage', value: 680000, weekly_rental_income: 580, applicant_ownership: [100] },
          { id: 'sec-4', property_purpose: 'owner_occupied', property_type: 'house', transaction_type: 'purchasing', value: 1200000, applicant_ownership: [50, 50] },
          { id: 'sec-5', property_purpose: 'investment', property_type: 'apartment', transaction_type: 'purchasing', value: 650000, weekly_rental_income: 520, applicant_ownership: [100] },
        ],
        home_loan_security_links: [
          { id: 'link-1', which_security_ids: ['sec-1'], which_existing_home_loan_ids: ['ehl-1'], which_proposed_home_loan_ids: ['phl-1'] },
          { id: 'link-2', which_security_ids: ['sec-2', 'sec-3'], which_existing_home_loan_ids: ['ehl-2'], which_proposed_home_loan_ids: [] },
          { id: 'link-3', which_security_ids: ['sec-4'], which_existing_home_loan_ids: [], which_proposed_home_loan_ids: ['phl-1'] },
          { id: 'link-4', which_security_ids: ['sec-5'], which_existing_home_loan_ids: [], which_proposed_home_loan_ids: ['phl-2'] },
        ],
      },
    },
  },
];

export function Transform({ onTryInExplorer }: { onTryInExplorer: (body: string) => void }) {
  const [lixiValue, setLixiValue] = useState('');
  const [scenarioValue, setScenarioValue] = useState('');
  const [source, setSource] = useState<TransformSource>('lixi');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [exampleMenuOpen, setExampleMenuOpen] = useState(false);
  const [activeExampleLabel, setActiveExampleLabel] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (!exampleMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setExampleMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [exampleMenuOpen]);

  const runTransform = (value: string, src: TransformSource) => {
    if (!value.trim()) {
      setStatus('idle');
      setError(null);
      return;
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(value) as Record<string, unknown>;
    } catch (e) {
      setStatus('error');
      setError(`Invalid JSON: ${(e as Error).message}`);
      return;
    }

    const result = src === 'lixi'
      ? lixiToScenario(parsed as LIXIEnvelope)
      : scenarioToLixi(parsed as unknown as QuickliApiScenario);

    if (result.success) {
      if (src === 'lixi') {
        setScenarioValue(JSON.stringify(result.data, null, 2));
      } else {
        setLixiValue(JSON.stringify(result.data, null, 2));
      }
      setError(null);
      setStatus('synced');
    } else {
      setError(result.errors.join(', '));
      setStatus('error');
    }
  };

  const handleEdit = (value: string, src: TransformSource) => {
    if (src === 'lixi') setLixiValue(value);
    else setScenarioValue(value);

    setSource(src);
    setActiveExampleLabel(null);
    setStatus('transforming');
    setError(null);

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runTransform(value, src), 150);
  };

  const toggleSource = () => {
    const newSource = source === 'lixi' ? 'scenario' : 'lixi';
    const value = newSource === 'lixi' ? lixiValue : scenarioValue;
    if (value.trim()) {
      handleEdit(value, newSource);
    } else {
      setSource(newSource);
    }
  };

  const loadExample = (example: Example) => {
    const json = JSON.stringify(example.data, null, 2);
    if (example.source === 'lixi') {
      setLixiValue(json);
      setSource('lixi');
      handleEdit(json, 'lixi');
    } else {
      setScenarioValue(json);
      setSource('scenario');
      handleEdit(json, 'scenario');
    }
    setActiveExampleLabel(example.label);
    setExampleMenuOpen(false);
  };

  const { dot, label } = STATUS_DISPLAY[status];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 dark:bg-navy-800/50 border-b border-slate-200 dark:border-navy-600/50">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">v2 ↔ v3 Transform</span>
        <span className="text-xs text-slate-500 dark:text-slate-400 flex-1">Paste or edit on either side — the other updates instantly</span>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
          {label}
        </div>
        <button
          onClick={() => {
            const val = source === 'lixi' ? lixiValue : scenarioValue;
            try {
              const formatted = JSON.stringify(JSON.parse(val), null, 2);
              if (source === 'lixi') setLixiValue(formatted);
              else setScenarioValue(formatted);
            } catch { /* not valid JSON */ }
          }}
          className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-navy-500 hover:border-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          Format
        </button>
        <button
          onClick={() => {
            if (source === 'lixi') handleEdit('', 'lixi');
            else handleEdit('', 'scenario');
          }}
          className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-navy-500 hover:border-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          Clear
        </button>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setExampleMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-navy-500 hover:border-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            Examples
            <svg className={`w-3 h-3 transition-transform ${exampleMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {exampleMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-lg bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 shadow-lg overflow-hidden">
              {EXAMPLES.map((example, i) => (
                <button
                  key={i}
                  onClick={() => loadExample(example)}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-navy-700/50 transition-colors border-b border-slate-100 dark:border-navy-600/50 last:border-b-0"
                >
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200">{example.label}</div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{example.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-[1fr_48px_1fr] overflow-hidden">
        <TransformPanel
          label="v2 format (LIXI)"
          badge="v2"
          badgeColor="bg-amber-500/12 text-amber-400"
          value={lixiValue}
          onChange={(v) => handleEdit(v, 'lixi')}
          onToggleEdit={toggleSource}
          isSource={source === 'lixi'}
          placeholder="Paste your v2 (LIXI) payload here..."
          schema={lixiSchema}
        />
        <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-navy-800/50 border-x border-slate-200 dark:border-navy-600/50 gap-2">
          <button
            onClick={toggleSource}
            className={`w-8 h-8 rounded-full bg-brand-400 text-navy-900 flex items-center justify-center text-base shadow-sm hover:bg-brand-500 transition-all ${source === 'scenario' ? 'scale-x-[-1]' : ''}`}
          >
            →
          </button>
        </div>
        <TransformPanel
          label="v3 format (Scenario)"
          badge="v3"
          badgeColor="bg-emerald-500/12 text-emerald-400"
          value={scenarioValue}
          onChange={(v) => handleEdit(v, 'scenario')}
          onToggleEdit={toggleSource}
          isSource={source === 'scenario'}
          placeholder="Paste your v3 (Scenario) payload here..."
          schema={scenarioSchema}
        />
      </div>

      {scenarioValue.trim() ? (
        <div className="flex justify-end px-5 py-2 border-t border-slate-200 dark:border-navy-600/50 bg-slate-50 dark:bg-navy-800/50">
          <button
            onClick={() => {
              try {
                onTryInExplorer(JSON.stringify({ ...JSON.parse(scenarioValue), description: activeExampleLabel ?? 'Transformed from LIXI' }, null, 2));
              } catch {
                setError('Cannot send to Explorer — the output is not valid JSON');
              }
            }}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-400 text-navy-900 shadow-sm hover:bg-brand-500 transition-colors"
          >
            Try in Explorer →
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-red-500/[0.08] border-t border-slate-200 dark:border-navy-600/50 text-xs text-red-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" /> {error}
        </div>
      ) : null}
    </div>
  );
}
