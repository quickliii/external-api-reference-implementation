import type {
  LIXIScenarioContent,
  QuickliApiProposedHomeLoan,
  QuickliApiExistingHomeLoan,
  QuickliApiScenario,
  QuickliApiSecurity,
  HomeLoanProductType,
} from '../types';

import { makeId, sum, LIXIFrequencyToMonthly } from '../utils';

type FixedProductType =
  | 'fixed_rate_1_year'
  | 'fixed_rate_2_year'
  | 'fixed_rate_3_year'
  | 'fixed_rate_4_year'
  | 'fixed_rate_5_year'
  | 'fixed_rate_7_year'
  | 'fixed_rate_10_year';

function getTermUnitToYearMultiplier(
  unit: 'Days' | 'Months' | 'Weeks' | 'Years',
): number {
  if (unit === 'Days') {
    return 365;
  }
  if (unit === 'Weeks') {
    return 52;
  }
  if (unit === 'Months') {
    return 12;
  }
  return 1;
}

function getHomeLoansAndSecurities(apiScenario: LIXIScenarioContent): {
  proposed_home_loans: QuickliApiScenario['proposed_home_loans'];
  existing_home_loans: QuickliApiScenario['existing_home_loans'];
  securities: NonNullable<QuickliApiScenario['securities']>;
  home_loan_security_links: NonNullable<
    QuickliApiScenario['home_loan_security_links']
  >;
} {
  const newProposedLoans: QuickliApiProposedHomeLoan[] = [];
  const newExistingLoans: QuickliApiExistingHomeLoan[] = [];
  const newSecurities: QuickliApiSecurity[] = [];

  const apiLoanDetails = apiScenario.loanDetails;
  const apiLiabilities = apiScenario.liability;
  const apiRentalAssets = apiScenario.realEstateAsset;

  // Handling things in this order:
  // 1. Proposed loans
  // 2. Existing loans
  // 3. Rentals and set expenses
  // 4. Set the rental links + ownerships for existing loans

  const loanAndSecurityPairs: { [loanId: string]: string[] } = {};

  const applicantIndexMap = apiScenario.personApplicant.reduce(
    (mapObject, app, index) => ({ ...mapObject, [app.uniqueID]: index }),
    {},
  ) as { [key: string]: number };

  // 1. Proposed loans
  apiLoanDetails.forEach((apiLoanDetail) => {
    const amountRequested = apiLoanDetail.amountRequested || 0;
    let loanPurpose = 'owner_occupied';
    const taxDeductible =
      apiLoanDetail.taxDeductible === 'Yes' ||
      apiLoanDetail.taxDeductible === true;

    const primaryRental = apiRentalAssets.find(
      (asset) =>
        asset.transaction === 'Purchasing' && !!asset.toBeUsedAsSecurity,
    );

    if (
      apiLoanDetail.loanPurpose?.primaryPurpose === 'Investment Residential' ||
      apiLoanDetail.loanPurpose?.primaryPurpose ===
        'Investment Non Residential' ||
      primaryRental?.primaryPurpose === 'Investment'
    ) {
      loanPurpose = 'investment';
    }

    const termValue = apiLoanDetail.term?.totalTermDuration || 0;
    const termUnit = apiLoanDetail.term?.totalTermUnits || 'Years';

    const interestType = apiLoanDetail.term?.interestType || 'Variable';

    let IOTermValue = 0;
    let IOTermUnit: 'Days' | 'Months' | 'Weeks' | 'Years' = 'Years';

    if (interestType === 'Fixed') {
      IOTermValue =
        apiLoanDetail.term?.paymentType === 'Interest Only'
          ? apiLoanDetail.term?.paymentTypeDuration || 0
          : 0;
      IOTermUnit = apiLoanDetail.term?.paymentTypeUnits || 'Years';
    } else {
      IOTermValue = apiLoanDetail.term?.interestTypeDuration || 0;
      IOTermUnit = apiLoanDetail.term?.interestTypeUnits || 'Years';
    }

    const totalTerm = termValue / getTermUnitToYearMultiplier(termUnit);
    const IOTerm = IOTermValue / getTermUnitToYearMultiplier(IOTermUnit);

    const lvr = apiLoanDetail.lvr || 80;

    let product_type: HomeLoanProductType = 'variable_package';
    if (interestType === 'Fixed') {
      const fixedYearsMap: Record<number, FixedProductType> = {
        1: 'fixed_rate_1_year',
        2: 'fixed_rate_2_year',
        3: 'fixed_rate_3_year',
        4: 'fixed_rate_4_year',
        5: 'fixed_rate_5_year',
        7: 'fixed_rate_7_year',
        10: 'fixed_rate_10_year',
      } as const;

      const fixedTermValue = apiLoanDetail.term?.interestTypeDuration || 0;
      const fixedTermUnit = apiLoanDetail.term?.interestTypeUnits || 'Years';
      const fixedTerm =
        fixedTermValue / getTermUnitToYearMultiplier(fixedTermUnit);
      const fixedTermInYears = Math.ceil(fixedTerm);

      if (fixedTermInYears) {
        if (fixedTermInYears > 7) {
          product_type = 'fixed_rate_10_year';
        } else if (fixedTermInYears > 5) {
          product_type = 'fixed_rate_7_year';
        } else {
          product_type = fixedYearsMap[fixedTermInYears] || 'variable_package';
        }
      }
    }

    let newProposedLoanObject: QuickliApiProposedHomeLoan = {
      id: apiLoanDetail.uniqueID,
      ignore: false,
      product_type,
      loan_type: loanPurpose,
      loan_amount: amountRequested,
      term: totalTerm,
      interest_only_period: IOTerm,
      lvr,
      use_generic_rate: false,
      is_tax_deductible: taxDeductible,
    };

    const { borrowers } = apiLoanDetail;
    if (loanPurpose === 'investment' && !!borrowers) {
      const appTaxBenefit: number[] = Array(
        Object.keys(applicantIndexMap).length,
      ).fill(0);

      apiLoanDetail.borrowers?.owner?.forEach((o) => {
        const ownerId = o.x_Party;
        const index = applicantIndexMap[ownerId];
        appTaxBenefit[index] = o.percent || 0;
      });
      newProposedLoanObject = {
        ...newProposedLoanObject,
        applicant_tax_benefit: appTaxBenefit,
      };
    }
    newProposedLoans.push(newProposedLoanObject);
    loanAndSecurityPairs[apiLoanDetail.uniqueID] = [];
    if (primaryRental)
      loanAndSecurityPairs[apiLoanDetail.uniqueID].push(primaryRental.uniqueID);
  });

  // 2. Existing loans
  apiLiabilities
    .filter((apiLiability) => apiLiability.type === 'Mortgage Loan')
    .forEach((mortgage) => {
      const balance = mortgage.outstandingBalance || 0;
      const limit = mortgage.creditLimit || 0;

      const { remainingTerm, originalTerm } = mortgage;
      let term = 0;
      let interestOnlyTerm = 0;
      if (remainingTerm) {
        const termMultiplier = getTermUnitToYearMultiplier(
          remainingTerm.units || 'Years',
        );
        term = (remainingTerm.duration || 0) * termMultiplier;
        interestOnlyTerm =
          (remainingTerm.interestOnlyDuration || 0) * termMultiplier;
      } else if (originalTerm) {
        interestOnlyTerm =
          (originalTerm.interestTypeDuration || 0) *
          getTermUnitToYearMultiplier(
            originalTerm.interestTypeUnits || 'Years',
          );
        const totalTerm =
          (originalTerm.totalTermDuration || 0) *
          getTermUnitToYearMultiplier(originalTerm.totalTermUnits || 'Years');

        term = Math.max(0, totalTerm - interestOnlyTerm);
      }

      const repayment = mortgage.repayment?.[0].repaymentAmount || 0;
      const convertedRepayment = LIXIFrequencyToMonthly(
        repayment,
        mortgage.repayment?.[0].repaymentFrequency || 'Monthly',
      );
      const rate = mortgage.annualInterestRate || 0;

      const { percentOwned } = mortgage;
      const ownership: number[] = Array(
        Object.keys(applicantIndexMap).length,
      ).fill(0);

      if (percentOwned) {
        percentOwned.owner?.forEach((o) => {
          const ownerId = o.x_Party;
          const index = applicantIndexMap[ownerId];
          ownership[index] = o.percent || 0;
        });
      }

      const newExistingLoan: QuickliApiExistingHomeLoan = {
        id: mortgage.uniqueID,
        loan_type:
          mortgage.loanPurpose?.primaryPurpose === 'Investment Residential' ||
          mortgage.loanPurpose?.primaryPurpose === 'Investment Non Residential'
            ? 'investment'
            : 'owner_occupied',
        loan_amount: limit,
        loan_balance: balance,
        term,
        actual_rate: rate,
        interest_only_period: interestOnlyTerm,
        monthly_repayment: convertedRepayment,
        product_type: 'variable_package',
        lender: '',
        applicant_tax_benefit: ownership,
        is_tax_deductible: !!mortgage.repayment?.some((r) => r.taxDeductible),
        ignore: mortgage.clearingFromThisLoan || false,
      };
      newExistingLoans.push(newExistingLoan);

      const { security } = mortgage;
      const securityPairs: string[] = [];
      if (security) {
        security.forEach((s) => securityPairs.push(s.x_Security));

        const oneOfSecurityIsInvestment = security.some((s) => {
          const invProperty = apiRentalAssets.find(
            (asset) => asset.uniqueID === s.x_Security,
          );
          return invProperty?.primaryPurpose === 'Investment';
        });

        if (oneOfSecurityIsInvestment) newExistingLoan.loan_type = 'investment';
      }
      loanAndSecurityPairs[mortgage.uniqueID] = securityPairs;
    });

  // 3. Securities time
  apiRentalAssets.forEach((apiRentalAsset) => {
    const { rentalIncome, futureRentalIncome } = apiRentalAsset;
    if (
      (rentalIncome || futureRentalIncome) &&
      apiRentalAsset.transaction !== 'Sold'
    ) {
      const { percentOwned } = apiRentalAsset;
      const ownership: number[] = Array(
        Object.keys(applicantIndexMap).length,
      ).fill(0);

      if (percentOwned) {
        percentOwned.owner?.forEach((o) => {
          const ownerId = o.x_Party;
          const index = applicantIndexMap[ownerId];
          ownership[index] = o.percent || 0;
        });
      }

      const isNewProperty = futureRentalIncome && futureRentalIncome.length > 0;

      let totalWeeklyIncome = 0;
      if (isNewProperty) {
        totalWeeklyIncome = sum(
          futureRentalIncome.map(
            (ri) =>
              (LIXIFrequencyToMonthly(
                ri.grossRentalAmount || 0,
                ri.grossRentalFrequency || 'Weekly',
              ) *
                12) /
              52,
          ),
        );
      } else if (rentalIncome && rentalIncome.length > 0) {
        totalWeeklyIncome = sum(
          rentalIncome.map(
            (ri) =>
              (LIXIFrequencyToMonthly(
                ri.rentalAmount || 0,
                ri.frequency || 'Weekly',
              ) *
                12) /
              52,
          ),
        );
      }

      const transactionType =
        apiRentalAsset.transaction === 'Transfer'
          ? 'Purchasing'
          : apiRentalAsset.transaction || 'Purchasing';
      const transactionMap = {
        Purchasing: 'purchasing',
        Owns: 'owns_outright',
        'Owns Existing Mortgage': 'owns_with_mortgage',
        Transfer: 'purchasing',
      } as const;

      const propertyType =
        apiRentalAsset.propertyType?.propertyTypeName ?? 'House';

      const propertyTypeMap = {
        House: 'house',
        Apartment: 'apartment',
        'Vacant Land': 'land',
      } as const;

      const propertyTypeNormalized = Object.keys(propertyTypeMap).includes(
        propertyType,
      )
        ? (propertyType as 'House' | 'Apartment' | 'Vacant Land')
        : propertyType.toLowerCase().includes('land')
          ? 'Vacant Land'
          : propertyType.toLowerCase().includes('apartment')
            ? 'Apartment'
            : 'House';

      const totalExpense =
        sum(
          apiRentalAsset.propertyExpense?.map((e) =>
            LIXIFrequencyToMonthly(e.amount || 0, e.frequency || 'Monthly'),
          ) ?? [],
        ) || 0;

      const primaryPurpose = apiRentalAsset.primaryPurpose ?? 'Owner Occupied';
      const { primaryUsage } = apiRentalAsset;
      const propertyPurpose: 'investment' | 'owner_occupied' =
        totalWeeklyIncome > 0 ||
        totalExpense > 0 ||
        primaryPurpose === 'Investment'
          ? 'investment'
          : 'owner_occupied';

      const isShortTerm = rentalIncome?.some(
        (rental) =>
          rental.shortTermRentalAccommodation === 'Yes' ||
          rental.shortTermRentalAccommodation === true,
      );
      const isBusiness = primaryPurpose === 'Business';
      const isBoarder = rentalIncome?.some(
        (r) => r.boarderIncome === 'Yes' || r.boarderIncome === true,
      );
      const rentalType:
        | 'residential'
        | 'commercial'
        | 'short_term'
        | 'boarder' = isShortTerm
        ? 'short_term'
        : isBoarder
          ? 'boarder'
          : isBusiness || primaryUsage === 'Commercial'
            ? 'commercial'
            : 'residential';

      const propertyAddressObject = apiScenario.address?.find(
        (address) => address.uniqueID === apiRentalAsset.uniqueID,
      );

      const newSecurityObject: QuickliApiSecurity = {
        id: apiRentalAsset.uniqueID,
        address: propertyAddressObject?.fullAddress || '',
        postcode:
          propertyAddressObject?.australianPostCode ||
          propertyAddressObject?.postCode,

        transaction_type: transactionMap[transactionType],
        property_purpose: propertyPurpose,
        property_type: propertyTypeMap[propertyTypeNormalized],
        rental_type: rentalType,

        value: apiRentalAsset.estimatedValue?.value || 0,
        weekly_rental_income: totalWeeklyIncome,
        monthly_rental_expense: totalExpense,
        applicant_ownership: ownership,
      };
      newSecurities.push(newSecurityObject);
    }
  });

  // 4. Build which_rentals internally for linking (still needed for grouping)
  // We need a combined list of all loans for the grouping algorithm
  type LoanWithRentals = { id: string; which_rentals: boolean[]; isProposed: boolean };
  const allLoansForLinking: LoanWithRentals[] = [];

  newProposedLoans.forEach((loan) => {
    const whichRentals = newSecurities.map((rental) =>
      rental.transaction_type === 'purchasing' ||
      (loanAndSecurityPairs[loan.id] ?? []).includes(rental.id),
    );
    loan.which_rentals = whichRentals;
    allLoansForLinking.push({ id: loan.id, which_rentals: whichRentals, isProposed: true });
  });

  newExistingLoans.forEach((loan) => {
    const whichRentals = newSecurities.map((rental) =>
      (loanAndSecurityPairs[loan.id] ?? []).includes(rental.id),
    );
    loan.which_rentals = whichRentals;
    allLoansForLinking.push({ id: loan.id, which_rentals: whichRentals, isProposed: false });
  });

  // 5. Build ID-based security links
  const isLoanHandled: Record<string, boolean> = {};
  const isSecurityHandled: Record<string, boolean> = {};

  const newHomeLoanSecurityLinks = allLoansForLinking.reduce<
    NonNullable<QuickliApiScenario['home_loan_security_links']>
  >((acc, loanEntry) => {
    if (isLoanHandled[loanEntry.id]) {
      return acc;
    }

    // find securities linked to home loan
    const securitiesLinkedToHl = newSecurities
      .map((sec, secIndex) =>
        loanEntry.which_rentals[secIndex]
          ? { index: secIndex, id: sec.id }
          : null,
      )
      .filter((index) => index !== null);

    // skip if all securities linked have been handled
    if (securitiesLinkedToHl.every((rental) => isSecurityHandled[rental.id])) {
      return acc;
    }

    // ALL checks done, now collect all loans and securities in this group
    const allLoansInvolved = allLoansForLinking.filter((entry) =>
      securitiesLinkedToHl.some(
        (linkedSecurity) => entry.which_rentals[linkedSecurity.index],
      ),
    );
    allLoansInvolved.forEach((entry) => {
      isLoanHandled[entry.id] = true;
    });

    const allSecuritiesInvolved = newSecurities.filter((_sec, secIndex) =>
      allLoansInvolved.some((entry) => entry.which_rentals[secIndex]),
    );
    allSecuritiesInvolved.forEach((sec) => {
      isSecurityHandled[sec.id] = true;
    });

    // Build ID-based link
    const which_security_ids = allSecuritiesInvolved.map((sec) => sec.id);
    const which_proposed_home_loan_ids = allLoansInvolved
      .filter((entry) => entry.isProposed)
      .map((entry) => entry.id);
    const which_existing_home_loan_ids = allLoansInvolved
      .filter((entry) => !entry.isProposed)
      .map((entry) => entry.id);

    return [
      ...acc,
      {
        id: makeId(),
        which_security_ids,
        which_proposed_home_loan_ids,
        which_existing_home_loan_ids,
      },
    ];
  }, []);

  return {
    proposed_home_loans: newProposedLoans,
    existing_home_loans: newExistingLoans,
    securities: newSecurities,
    home_loan_security_links: newHomeLoanSecurityLinks,
  };
}

export default getHomeLoansAndSecurities;
