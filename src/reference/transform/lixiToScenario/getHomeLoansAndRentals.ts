import type { LIXIScenarioContent, QuickliApiHomeLoan, QuickliApiScenario, QuickliApiSecurity } from '../types';

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

const COLOR_IDS: (
  | `link-light-color-${1 | 2 | 3 | 4 | 5 | 6}`
  | `link-dark-color-${1 | 2 | 3 | 4 | 5 | 6}`
)[] = [
  'link-light-color-1',
  'link-light-color-2',
  'link-light-color-3',
  'link-light-color-4',
  'link-light-color-5',
  'link-light-color-6',
  'link-dark-color-1',
  'link-dark-color-2',
  'link-dark-color-3',
  'link-dark-color-4',
  'link-dark-color-5',
  'link-dark-color-6',
];

function getHomeLoansAndSecurities(apiScenario: LIXIScenarioContent): {
  home_loans: QuickliApiScenario['home_loans'];
  securities: NonNullable<QuickliApiScenario['securities']>;
  home_loan_security_links: NonNullable<
    QuickliApiScenario['home_loan_security_links']
  >;
} {
  const newHomeLoans: QuickliApiScenario['home_loans'] = [];
  const newSecurities: QuickliApiScenario['securities'] = [];

  const apiLoanDetails = apiScenario.loanDetails;
  const apiLiabilities = apiScenario.liability;
  const apiRentalAssets = apiScenario.realEstateAsset;

  // Handling things in this order:
  // 1. Proposed loans
  // 2. Existing loans
  // 3. Rentals and set expenses
  // 4. Set the rental links + ownerships for existing loans

  const loanAndSecurityPairs: { [loanId: string]: string[] } = {};
  const loansIndexMap: { [loanId: string]: number } = {};
  const proposedLoansIds: string[] = [];

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

    let product_type: QuickliApiHomeLoan['product_type'] = 'variable_package';
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

    let newProposedLoanObject: QuickliApiHomeLoan = {
      id: apiLoanDetail.uniqueID,
      ignore: false,
      product_type,
      existing_or_proposed: 'proposed',
      loan_type: loanPurpose,
      loan_amount: amountRequested,
      term: totalTerm,
      interest_only_period: IOTerm,
      lvr,
      use_generic_rate: false,
      is_tax_deductible: taxDeductible,
    } as QuickliApiHomeLoan;

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
    const newIndex = newHomeLoans.push(newProposedLoanObject) - 1;
    loansIndexMap[apiLoanDetail.uniqueID] = newIndex;
    loanAndSecurityPairs[apiLoanDetail.uniqueID] = [];
    if (primaryRental)
      loanAndSecurityPairs[apiLoanDetail.uniqueID].push(primaryRental.uniqueID);
    proposedLoansIds.push(apiLoanDetail.uniqueID);
  });

  // 2.Existing loans
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

      const newExistingLoan: QuickliApiHomeLoan = {
        id: mortgage.uniqueID,
        existing_or_proposed: 'existing',
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
      const newIndex = newHomeLoans.push(newExistingLoan) - 1;
      loansIndexMap[mortgage.uniqueID] = newIndex;

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

  // 4. Still do the old rental linking, we'll need this
  newHomeLoans.forEach((loan) => {
    const newWhichRentals = Array(newSecurities.length).fill(false);
    if (loan.existing_or_proposed === 'proposed') {
      newSecurities.forEach((rental, rIndex) => {
        if (
          rental.transaction_type === 'purchasing' ||
          loanAndSecurityPairs[loan.id].includes(rental.id)
        ) {
          newWhichRentals[rIndex] = true;
        }
      });
    } else {
      newSecurities.forEach((rental, rIndex) => {
        if (loanAndSecurityPairs[loan.id].includes(rental.id)) {
          newWhichRentals[rIndex] = true;
        }
      });
    }
    loan.which_rentals = newWhichRentals;
  });

  // 5. do the new linking
  // Make a mutable copy so .shift() doesn't mutate the module-level constant
  const colorIds = [...COLOR_IDS];
  const isLoanHandled: Record<string, boolean> = {};
  const isSecurityHandled: Record<string, boolean> = {};

  const newHomeLoanSecurityLinks = newHomeLoans.reduce<
    NonNullable<QuickliApiScenario['home_loan_security_links']>
  >((acc, homeLoan) => {
    // current loan might be handled already, so skip
    if (isLoanHandled[homeLoan.id]) {
      return acc;
    }

    // find securities linked to home loan
    const securitiesLinkedToHl = newSecurities
      .map((sec, secIndex) =>
        homeLoan.which_rentals && homeLoan.which_rentals[secIndex]
          ? { index: secIndex, id: sec.id }
          : null,
      )
      .filter((index) => index !== null);

    // skip if all securities linked has been handled
    if (securitiesLinkedToHl.every((rental) => isSecurityHandled[rental.id])) {
      return acc;
    }

    // ALL checks done, now make an object to track the linkage
    const loanSecurityLink = {
      id: makeId(),
      which_home_loans: {} as Record<string, boolean>,
      which_securities: {} as Record<string, boolean>,
    };

    const allHomeLoansInvolved = newHomeLoans.filter((homeLoan) =>
      securitiesLinkedToHl.some(
        (linkedSecurity) =>
          homeLoan.which_rentals &&
          homeLoan.which_rentals[linkedSecurity.index],
      ),
    );
    // update tracker
    allHomeLoansInvolved.forEach((homeLoan) => {
      isLoanHandled[homeLoan.id] = true;
      loanSecurityLink.which_home_loans[homeLoan.id] = true;
    });

    const allRentalsInvolved = newSecurities.filter((_rental, rentalIndex) =>
      allHomeLoansInvolved.some(
        (homeLoan) =>
          homeLoan.which_rentals && homeLoan.which_rentals[rentalIndex],
      ),
    );
    // update tracker
    allRentalsInvolved.forEach((rental) => {
      isSecurityHandled[rental.id] = true;
      loanSecurityLink.which_securities[rental.id] = true;
    });

    return [
      ...acc,
      {
        id: loanSecurityLink.id,
        which_securities: newSecurities.map(
          (rental) => !!loanSecurityLink.which_securities[rental.id],
        ),
        which_home_loans: newHomeLoans.map(
          (homeLoan) => !!loanSecurityLink.which_home_loans[homeLoan.id],
        ),
        // get the first one and remove + default - but should be very very rare to exhaust all 12 security / loan link colors
        which_color_id: colorIds.shift() ?? 'link-dark-color-6',
      },
    ];
  }, []);

  return {
    home_loans: newHomeLoans,
    securities: newSecurities,
    home_loan_security_links: newHomeLoanSecurityLinks,
  };
}

export default getHomeLoansAndSecurities;
