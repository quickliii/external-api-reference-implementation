import type { LIXIScenarioContent, SaveableScenario } from '../types';

import { makeId, LIXIFrequencyToMonthly } from '../utils';
import financialInstitutionMap from '../financialInstitutionMap';

type LIXILiabilityTypes = NonNullable<
  LIXIScenarioContent['liability'][number]['type']
>;

type SaveableScenarioLiabilityTypes =
  SaveableScenario['liabilities'][number]['loan_type'];

const LIXI_TO_SAVED_LIABILITIES_MAP: Record<
  LIXILiabilityTypes,
  SaveableScenarioLiabilityTypes | null // This is to not include them into the liabilities
> = {
  'Amortising Home Loan': null,
  'Bank Guarantee': 'other',
  'Bridging Finance': 'other',
  'Buy Now Pay Later': 'other',
  'Car Loan': 'car',
  'Commercial Bill': 'other',
  'Contingent Liability': 'other',
  'Credit Card': 'credit_card',
  'Government Benefits Debt': 'other',
  'HECS-HELP': null,
  'Hire Purchase': 'lease',
  'Invoice Financing Loan': 'personal',
  Lease: 'lease',
  'Line of Credit': 'overdraft', // I assume this is unsecured
  'Line of Credit Home Loan': null,
  'Loan as Guarantor': null, // help
  'Margin Loan': 'margin',
  'Mortgage Loan': null,
  Other: 'other',
  'Other Loan': 'personal',
  'Outstanding Taxation': null,
  Overdraft: 'overdraft',
  'Personal Loan': 'personal',
  'Store Card': 'credit_card', // Same as CC?
  'Student Loan': null, // HECS?
  'Term Loan': 'personal',
  'Trade Finance Loan': 'personal',
};

function getLiabilityLenders(
  financialInstitution: string,
  otherFIName: string,
) {
  const startingNames = [otherFIName, financialInstitution];
  const filteredNames = startingNames.filter(
    (name) => name && name !== 'Other',
  );
  if (filteredNames.length === 0) return null;

  const quickliLenderNames = filteredNames.map(
    (name) => financialInstitutionMap[name],
  );

  // Lets just use the first one. Both is not wrong anyway
  return quickliLenderNames.find((name) => name !== 'Other') || 'Other';
}

function getLiabilities(apiScenario: LIXIScenarioContent): {
  liabilities: SaveableScenario['liabilities'];
} {
  const newLiabilities: SaveableScenario['liabilities'] = [];

  const apiLiabilities = apiScenario.liability;

  apiLiabilities
    .filter(
      (apiLiability) => apiLiability.loanPurpose?.primaryPurpose !== 'Business',
    )
    .forEach((apiLiability) => {
      const balance = apiLiability.outstandingBalance || 0;
      const limit = apiLiability.creditLimit || 0;
      const amount = Math.max(balance, limit);

      const { remainingTerm } = apiLiability;
      let term = 0;
      if (remainingTerm) {
        let unitToYearsMultiplier = 1;
        if (remainingTerm.units === 'Days') {
          unitToYearsMultiplier = 365;
        } else if (remainingTerm.units === 'Weeks') {
          unitToYearsMultiplier = 52;
        } else if (remainingTerm.units === 'Months') {
          unitToYearsMultiplier = 12;
        }
        term = (remainingTerm.duration || 0) / unitToYearsMultiplier;
      }

      // LMG has no term?

      const repayment = apiLiability.repayment?.[0].repaymentAmount || 0;
      const convertedRepayment = LIXIFrequencyToMonthly(
        repayment,
        apiLiability.repayment?.[0].repaymentFrequency || 'Monthly',
      );
      const rate = apiLiability.annualInterestRate || 0;
      const newType = apiLiability.type
        ? LIXI_TO_SAVED_LIABILITIES_MAP[apiLiability.type]
        : null;

      const financialInstitution =
        apiLiability.accountNumber?.financialInstitution || '';
      const otherFIName = apiLiability.accountNumber?.otherFIName || '';

      const lenderToUse = getLiabilityLenders(
        financialInstitution,
        otherFIName,
      );

      if (newType !== null) {
        newLiabilities.push({
          id: apiLiability.uniqueID || makeId(),
          loan_type: newType,
          limit: amount,
          remaining_term: term,
          rate,
          monthly_repayment: convertedRepayment,
          ignore: apiLiability.clearingFromThisLoan || false,
          ...(lenderToUse
            ? {
                lender: lenderToUse,
              }
            : {}),
        });
      }
    });

  return { liabilities: newLiabilities };
}

export default getLiabilities;
