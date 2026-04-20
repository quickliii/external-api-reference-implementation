import type { LIXIScenarioContent, QuickliApiScenario } from '../types';

import { executeMath, makeId, assert, LIXIFrequencyToMonthly } from '../utils';

type NonNullableLIXIExpenseDetails = NonNullable<
  LIXIScenarioContent['household'][number]['expenseDetails']
>;
type LIXILivingExpensesCategories = NonNullable<
  NonNullable<
    NonNullable<NonNullableLIXIExpenseDetails>['livingExpense']
  >[number]['category']
>;

type QuickliApiScenarioLivingExpensesCategories =
  | 'primary_residence'
  | 'phone_internet_media'
  | 'food_and_groceries'
  | 'recreation_and_holidays'
  | 'clothing_and_personal_care'
  | 'medical_and_health'
  | 'transport'
  | 'public_education'
  | 'higher_education_and_vocational_training'
  | 'childcare'
  | 'general_insurance'
  | 'other'
  | 'property_tax'
  | 'strata_fees_and_body_corporate_fees'
  | 'private_non_government_school_fees'
  | 'child_support_maintenance_payments'
  | 'private_health_insurance'
  | 'life_accident_illness_insurance'
  | 'secondary_residence_costs'
  | 'ongoing_rent'
  | 'other_non_hem';

const LIXI_TO_SAVED_LIVING_EXPENSES_MAP: Record<
  LIXILivingExpensesCategories,
  QuickliApiScenarioLivingExpensesCategories
> = {
  Childcare: 'childcare',
  'Public or Government Primary and Secondary Education': 'public_education',
  'Private Schooling and Tuition': 'private_non_government_school_fees',
  Other: 'other',
  Groceries: 'food_and_groceries',
  'Primary Residence Running Costs': 'primary_residence',
  'Investment Property Running Costs': 'secondary_residence_costs', // Special treatment
  'General Basic Insurances': 'general_insurance',
  'Health Insurance': 'private_health_insurance', // Being safe here....
  'Sickness and Personal Accident Insurance, Life Insurance':
    'life_accident_illness_insurance',
  'Body Corporate Fees, Strata Fees and Land Tax on Owner Occupied Principal Place of Residence':
    'strata_fees_and_body_corporate_fees',
  'Medical and health': 'medical_and_health',
  'Recreation and entertainment': 'recreation_and_holidays',
  'Clothing and personal care': 'clothing_and_personal_care',
  'Pet Care': 'clothing_and_personal_care',
  'Telephone, internet, pay TV and media streaming subscriptions':
    'phone_internet_media',
  Transport: 'transport',
  'Child Maintenance': 'child_support_maintenance_payments',
  Rent: 'ongoing_rent',
  'Property Tax': 'property_tax',

  // I think the rest here is what LIXI has as basic fields,
  // but LMG doesn't use these categories by default.
  // In LMG, i think these categories are used if someone added additional expenses.
  // Which to me means that this is almost like a non-mandatory expenses? TBC
  Education: 'public_education',
  'Higher Education, Vocational Training and Professional Fees':
    'higher_education_and_vocational_training',
  Insurance: 'general_insurance',
  'Investment property utilities, rates and related costs':
    'secondary_residence_costs', // Special treatment
  'Owner occupied property utilities, rates and related costs':
    'secondary_residence_costs',
  'Secondary Residence Running Costs': 'secondary_residence_costs',
  Board: 'ongoing_rent',
  'Child and Spousal Maintenance': 'child_support_maintenance_payments',
};

function getNewEmptyHousehold(
  id?: string,
): QuickliApiScenario['households'][number] {
  return {
    id: id || makeId(),
    status: 'single',
    num_dependants: 0,
    num_adults: 0,
    dependants_age: [],
    shared_with_households: [],
  };
}

function getNewEmptyLivingExpenses(
  id?: string,
): QuickliApiScenario['living_expenses'][number] {
  return {
    id: id || makeId(),
    primary_residence: 0,
    use_detailed_basic_expense: true,
    simple_basic_expense: 0,
  };
}

function getHouseholdsAndLivingExpenses(apiScenario: LIXIScenarioContent): {
  households: QuickliApiScenario['households'];
  living_expenses: QuickliApiScenario['living_expenses'];
} {
  const newLivingExpenses: QuickliApiScenario['living_expenses'] = [];
  const newHouseholds: QuickliApiScenario['households'] = [];

  const apiHouseholds = apiScenario.household;

  apiHouseholds.forEach((apiHousehold) => {
    const householdId = apiHousehold.uniqueID || makeId();

    const newHouseholdObject = getNewEmptyHousehold(householdId);
    const newLivingExpensesObject = getNewEmptyLivingExpenses(householdId);

    const applicantsInHousehold = apiScenario.personApplicant.filter(
      (p) => p.x_Household === apiHousehold.uniqueID,
    );

    // If somehow there is no applicant in this household,
    // what's the point then, might as well skip
    if (!applicantsInHousehold.length) return;

    // Household
    newHouseholdObject.num_dependants = apiHousehold.dependant?.length ?? 0;
    newHouseholdObject.num_adults = applicantsInHousehold.length;

    const apiApplicant = applicantsInHousehold[0];
    const { maritalStatus } = apiApplicant;

    if (applicantsInHousehold.length === 1) {
      const applicantStatusWithPartner: (typeof maritalStatus)[] = [
        'Married',
        'De Facto',
      ];
      newHouseholdObject.num_adults = applicantStatusWithPartner.includes(
        maritalStatus,
      )
        ? 2
        : 1;
      newHouseholdObject.status =
        maritalStatus === 'Married'
          ? 'married'
          : maritalStatus === 'De Facto'
            ? 'defacto'
            : 'single';
    } else {
      newHouseholdObject.status =
        maritalStatus === 'De Facto' ? 'defacto' : 'married';
      newHouseholdObject.num_adults = 2;
    }

    newHouseholdObject.dependants_age =
      apiHousehold.dependant?.map((d) => d.age || '') || [];

    // Postcode stuff
    const primaryApplicantInHousehold = applicantsInHousehold[0];
    assert(primaryApplicantInHousehold, 'No applicant found in household');
    let postcode: string | number = '';
    const applicantPostSettlementAddressId =
      primaryApplicantInHousehold.contact?.postSettlementAddress
        ?.x_ResidentialAddress;
    if (applicantPostSettlementAddressId) {
      const addressObject = apiScenario.address?.find(
        (addressObj) =>
          addressObj.uniqueID === applicantPostSettlementAddressId,
      );
      postcode =
        addressObject?.australianPostCode || addressObject?.postCode || '';
    }
    if (
      !postcode &&
      primaryApplicantInHousehold.contact?.postSettlementAddress?.postcode
    ) {
      postcode =
        primaryApplicantInHousehold.contact?.postSettlementAddress.postcode;
    }
    newHouseholdObject.postcode = postcode;

    // Living Expenses
    const allExpenseDetails = [
      ...(apiHousehold.expenseDetails?.livingExpense || []),
      ...(apiHousehold.expenseDetails?.OtherCommitment || []),
    ].filter((exp) => exp.category !== 'Other');

    allExpenseDetails.forEach((expense) => {
      const savedScenarioCategory =
        LIXI_TO_SAVED_LIVING_EXPENSES_MAP[expense.category];

      const amount = expense.amount || 0;
      const amountPerMonth = LIXIFrequencyToMonthly(amount, expense.frequency);

      const totalAmount =
        executeMath(newLivingExpensesObject[savedScenarioCategory]) +
        amountPerMonth;

      if (
        expense.category === 'Investment Property Running Costs' ||
        expense.category ===
          'Investment property utilities, rates and related costs'
      ) {
        // Investment property expenses are handled at the security level, skip here
      } else {
        newLivingExpensesObject[savedScenarioCategory] = totalAmount;
      }
    });

    const otherHEMComparableExpenses =
      apiHousehold.expenseDetails?.livingExpense?.filter(
        (exp) => exp.category === 'Other',
      );
    const otherNonHEMComparableExpenses =
      apiHousehold.expenseDetails?.OtherCommitment?.filter(
        (exp) => exp.category === 'Other',
      );

    otherHEMComparableExpenses?.forEach((expense) => {
      const amount = expense.amount || 0;
      const amountPerMonth = LIXIFrequencyToMonthly(amount, expense.frequency);
      const totalAmount =
        executeMath(newLivingExpensesObject.other) + amountPerMonth;
      newLivingExpensesObject.other = totalAmount;
    });
    otherNonHEMComparableExpenses?.forEach((expense) => {
      const amount = expense.amount || 0;
      const amountPerMonth = LIXIFrequencyToMonthly(amount, expense.frequency);
      const totalAmount =
        executeMath(newLivingExpensesObject.other_non_hem) + amountPerMonth;
      newLivingExpensesObject.other_non_hem = totalAmount;
    });

    if (apiHousehold.expenseDetails?.useNotionalRent) {
      newLivingExpensesObject.use_notional_rent = true;
    }

    newHouseholds.push(newHouseholdObject);
    newLivingExpenses.push(newLivingExpensesObject);
  });

  return {
    households: newHouseholds,
    living_expenses: newLivingExpenses,
  };
}

export default getHouseholdsAndLivingExpenses;
