import type { QuickliApiScenario, ExportableLIXIScenario } from '../types';
import { executeMath, makeId } from '../utils';

type LiabilityTypes = QuickliApiScenario['liabilities'][number]['loan_type'];
type BusinessLiabilityTypes =
  QuickliApiScenario['self_employed_income'][number]['business_liabilities'][number]['facility_type'];
type LIXILiabilityTypes = ExportableLIXIScenario['liability'][number]['type'];

const LIABILITY_TYPES_MAP: Record<LiabilityTypes, LIXILiabilityTypes> = {
  credit_card: 'Credit Card',
  overdraft: 'Overdraft',
  lease: 'Lease',
  car: 'Car Loan',
  personal: 'Personal Loan',
  other: 'Other',
  margin: 'Margin Loan',
};

const BUSINESS_LIABILITY_TYPES_MAP: Record<
  BusinessLiabilityTypes,
  LIXILiabilityTypes
> = {
  overdraft: 'Overdraft',
  lease: 'Lease',
  term_loan: 'Term Loan',
  credit_card: 'Credit Card',
  housing_loan: 'Amortising Home Loan',
  commercial_bill: 'Commercial Bill',
  line_of_credit: 'Line of Credit',
  other: 'Other',
};

function getLIXILiabilities(quickliApiScenario: QuickliApiScenario): {
  liability: ExportableLIXIScenario['liability'];
} {
  const liability: ExportableLIXIScenario['liability'] = [];

  // Personal liabilities
  quickliApiScenario.liabilities.forEach((l) => {
    const term =
      l.loan_type === 'credit_card'
        ? null
        : executeMath(l.remaining_term) || null;
    const interestRate =
      l.loan_type === 'credit_card' ? null : executeMath(l.rate) || null;
    liability.push({
      uniqueID: l.id,
      annualInterestRate: interestRate,
      creditLimit: executeMath(l.limit) || null,
      outstandingBalance: executeMath(l.limit) || null,
      type: LIABILITY_TYPES_MAP[l.loan_type],
      loanPurpose: {
        primaryPurpose: 'Personal',
      },
      remainingTerm: {
        duration: term,
        interestOnlyDuration: null,
        units: 'Years',
      },
      originalTerm: null,
      repayment: [
        {
          paymentType: 'Principal and Interest',
          repaymentAmount: executeMath(l.monthly_repayment) || null,
          repaymentFrequency: 'Monthly',
          taxDeductible: false,
        },
      ],
      percentOwned: {
        proportions: 'Equal',
        owner: quickliApiScenario.income.map((app) => {
          const proportionedOwnership = 100 / quickliApiScenario.income.length;
          return {
            percent: executeMath(proportionedOwnership.toFixed(2)),
            x_Party: app.id,
          };
        }),
      },
      security: [],
    });
  });

  // We need to handle HECS too

  quickliApiScenario.income.forEach((app) => {
    if (app.HECS) {
      liability.push({
        uniqueID: makeId(),
        annualInterestRate: null,
        creditLimit: null,
        outstandingBalance: executeMath(app.HECS_balance) || null,
        type: 'HECS-HELP',
        loanPurpose: {
          primaryPurpose: 'Personal',
        },
        remainingTerm: {
          duration: null,
          interestOnlyDuration: null,
          units: 'Years',
        },
        originalTerm: null,
        repayment: [
          {
            paymentType: 'Principal and Interest',
            repaymentAmount: executeMath(app.HECS_repayment) || null,
            repaymentFrequency: 'Monthly',
            taxDeductible: false,
          },
        ],
        percentOwned: {
          proportions: 'Specified',
          owner: [{ percent: 100, x_Party: app.id }],
        },
        security: [],
      });
    }
  });

  quickliApiScenario.existing_home_loans.forEach((loan) => {
    // Find security link that references this existing loan by ID
    const homeLoanLinkForLoan =
      quickliApiScenario.home_loan_security_links?.find(
        (link) => link.which_existing_home_loan_ids?.includes(loan.id),
      );
    liability.push({
      uniqueID: loan.id,
      annualInterestRate: executeMath(loan.actual_rate) || null,
      creditLimit: executeMath(loan.loan_amount) || null,
      outstandingBalance: executeMath(loan.loan_balance) || null,
      type: 'Mortgage Loan',
      loanPurpose: {
        primaryPurpose:
          loan.loan_type === 'owner_occupied'
            ? 'Owner Occupied'
            : 'Investment Residential',
      },
      remainingTerm: {
        duration: executeMath(loan.term) || null,
        interestOnlyDuration: executeMath(loan.interest_only_period) || null,
        units: 'Years',
      },
      originalTerm: null,
      repayment: [
        {
          paymentType: loan.interest_only_period
            ? 'Interest Only'
            : 'Principal and Interest',
          repaymentAmount: executeMath(loan.monthly_repayment) || null,
          repaymentFrequency: 'Monthly',
          taxDeductible:
            (loan.is_tax_deductible && loan.loan_type === 'investment') ||
            false,
        },
      ],
      percentOwned: {
        proportions: loan.loan_type === 'investment' ? 'Specified' : 'Equal',
        owner:
          loan.loan_type === 'investment'
            ? loan.applicant_tax_benefit
                ?.map((ownership, i) => ({
                  percent: executeMath(ownership),
                  x_Party: quickliApiScenario.income[i].id,
                }))
                .filter((o) => o.percent) || []
            : quickliApiScenario.income.map((app) => ({
                percent: 100 / quickliApiScenario.income.length,
                x_Party: app.id,
              })),
      },
      security:
        homeLoanLinkForLoan?.which_security_ids
          ?.map((secId) => ({ x_Security: secId })) ?? [],
    });
  });

  // Business liabilities
  quickliApiScenario.self_employed_income.forEach((semp) => {
    semp.business_liabilities.forEach((bl) => {
      liability.push({
        uniqueID: bl.id || makeId(),
        annualInterestRate: executeMath(bl.actual_rate) || null,
        creditLimit: executeMath(bl.limit) || null,
        outstandingBalance: executeMath(bl.limit) || null,
        type: BUSINESS_LIABILITY_TYPES_MAP[bl.facility_type],
        loanPurpose: {
          primaryPurpose: 'Business',
          x_Employer: semp.id,
        },
        remainingTerm: {
          duration: executeMath(bl.term) || null,
          interestOnlyDuration: executeMath(bl.interest_only_period) || null,
          units: 'Years',
        },
        originalTerm: null,
        repayment: [
          {
            paymentType: 'Principal and Interest',
            repaymentAmount: executeMath(bl.monthly_repayment) || null,
            repaymentFrequency: 'Monthly',
            taxDeductible: false,
          },
        ],
        security: [],
        percentOwned: {
          proportions: 'Not Specified',
          owner: [],
        },
      });
    });
  });

  return { liability };
}

export default getLIXILiabilities;
