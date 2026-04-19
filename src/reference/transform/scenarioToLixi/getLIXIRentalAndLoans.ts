import type { SaveableScenario, ExportableLIXIScenario } from '../types';
import { executeMath } from '../utils';

const transactionMapping = {
  owns_outright: 'Owns',
  owns_with_mortgage: 'Owns Existing Mortgage',
  purchasing: 'Purchasing',
} as const;

const propertyTypeMap = {
  land: 'Vacant Land',
  apartment: 'Apartment',
  house: 'House',
} as const;

function getLIXIRentalAndLoans(saveableScenario: SaveableScenario): {
  realEstateAsset: ExportableLIXIScenario['realEstateAsset'];
  loanDetails: ExportableLIXIScenario['loanDetails'];
  address: ExportableLIXIScenario['address'];
} {
  const realEstateAsset: ExportableLIXIScenario['realEstateAsset'] = [];
  const loanDetails: ExportableLIXIScenario['loanDetails'] = [];
  const address: ExportableLIXIScenario['address'] = [];

  // Proposed loans
  saveableScenario.home_loans.forEach((loan) => {
    if (loan.existing_or_proposed === 'proposed') {
      loanDetails.push({
        uniqueID: loan.id,
        amountRequested: executeMath(loan.loan_amount) || null,
        amountToBeFinanced: null,
        lvr: executeMath(loan.lvr) || null,
        loanType: 'Mortgage Loan',
        taxDeductible:
          loan.loan_type === 'investment' && !!loan.is_tax_deductible,
        borrowers: {
          proportions:
            loan.loan_type === 'owner_occupied' ? 'Equal' : 'Specified',
          owner:
            loan.loan_type === 'investment'
              ? loan.applicant_tax_benefit
                  ?.map((ownership, i) => ({
                    percent: executeMath(ownership),
                    x_Party: saveableScenario.income[i].id,
                  }))
                  .filter((o) => o.percent) || []
              : saveableScenario.income.map((app) => ({
                  percent: 100 / saveableScenario.income.length,
                  x_Party: app.id,
                })) || [],
        },
        loanPurpose: {
          primaryPurpose:
            loan.loan_type === 'owner_occupied'
              ? 'Owner Occupied'
              : 'Investment Residential',
        },
        term: {
          interestType: loan.interest_only_period ? 'Fixed' : 'Variable',
          interestTypeDuration: executeMath(loan.interest_only_period) || null,
          interestTypeUnits: 'Years',
          paymentType: loan.interest_only_period
            ? 'Interest Only'
            : 'Principal and Interest',
          paymentTypeDuration: loan.interest_only_period
            ? executeMath(loan.interest_only_period)
            : executeMath(loan.term),
          paymentTypeUnits: 'Years',
          totalTermDuration: executeMath(loan.term),
          totalTermType: loan.interest_only_period
            ? 'Total Term'
            : 'Amortisation Term',
          totalTermUnits: 'Years',
        },
      });
    }
  });

  saveableScenario.securities?.forEach((sec, index) => {
    const propertyPurpose = sec.property_purpose ?? 'owner_occupied';

    const secPrimaryPurpose =
      propertyPurpose === 'owner_occupied'
        ? 'Owner Occupied'
        : propertyPurpose === 'investment' && sec.rental_type === 'commercial'
          ? 'Business'
          : 'Investment';

    const homeLoanLinkForSec = saveableScenario.home_loan_security_links?.find(
      (link) => !!link.which_securities?.[index],
    );

    realEstateAsset.push({
      primaryPurpose: secPrimaryPurpose,
      primarySecurity:
        sec.transaction_type === 'purchasing' &&
        saveableScenario.home_loans.some(
          (l) =>
            l.existing_or_proposed === 'proposed' &&
            l.loan_type === 'investment',
        ),
      primaryUsage:
        secPrimaryPurpose === 'Business' && sec.rental_type === 'commercial'
          ? 'Commercial'
          : 'Residential',
      toBeSold: null,
      toBeUsedAsSecurity: homeLoanLinkForSec?.which_securities?.[index] ?? null,
      transaction: transactionMapping[sec.transaction_type ?? 'purchasing'],
      uniqueID: sec.id,
      commercial: null,
      estimatedValue: {
        value: executeMath(sec.value) || null,
      },
      futureRentalIncome:
        sec.transaction_type === 'purchasing'
          ? sec.applicant_ownership
              .map((ownership, i) => ({
                grossRentalAmount:
                  (executeMath(sec.weekly_rental_income) *
                    executeMath(ownership)) /
                  100,
                grossRentalFrequency: 'Weekly' as const,
                netRentalAmount: null,
                netRentalFrequency: 'Weekly' as const,
                xOwner: saveableScenario.income[i].id,
                ...(sec.rental_type === 'boarder'
                  ? { boarderIncome: true }
                  : {}),
              }))
              .filter((r) => !!r.grossRentalAmount)
          : [],
      percentOwned: {
        proportions:
          sec.property_purpose === 'owner_occupied' &&
          sec.rental_type !== 'boarder' &&
          sec.rental_type !== 'short_term'
            ? 'Equal'
            : 'Specified',
        owner:
          sec.property_purpose === 'owner_occupied' &&
          sec.rental_type !== 'boarder' &&
          sec.rental_type !== 'short_term'
            ? sec.applicant_ownership
                .map((_ownership, i) => ({
                  percent: 100 / saveableScenario.income.length,
                  x_Party: saveableScenario.income[i].id,
                }))
                .filter((o) => o.percent)
            : sec.applicant_ownership
                .map((ownership, i) => ({
                  percent: executeMath(ownership),
                  x_Party: saveableScenario.income[i].id,
                }))
                .filter((o) => o.percent),
      },
      propertyExpense: [
        {
          amount: executeMath(sec.monthly_rental_expense) || null,
          category: 'Running Costs',
          frequency: 'Monthly',
        },
      ],

      rentalIncome:
        sec.transaction_type !== 'purchasing'
          ? sec.applicant_ownership
              .map((ownership, i) => ({
                frequency: 'Weekly' as const,
                guaranteedRent: null,
                shortTermRentalAccommodation:
                  sec.rental_type === 'short_term' || null,
                rentalAmount:
                  executeMath(
                    (
                      executeMath(sec.weekly_rental_income) *
                      (executeMath(ownership) / 100)
                    ).toFixed(2),
                  ) || null,
                uniqueID: sec.id,
                xOwner: saveableScenario.income[i].id,
                ...(sec.rental_type === 'boarder'
                  ? { boarderIncome: true }
                  : {}),
              }))
              .filter((r) => !!r.rentalAmount)
          : [],
      propertyType: {
        propertyTypeName:
          propertyTypeMap[sec.property_type as keyof typeof propertyTypeMap] ??
          'House',
      },
    });
    address.push({
      uniqueID: sec.id,
      australianPostCode: sec.postcode?.toString() || null,
      fullAddress: sec.address || null,
    });
  });

  return { realEstateAsset, loanDetails, address };
}

export default getLIXIRentalAndLoans;
