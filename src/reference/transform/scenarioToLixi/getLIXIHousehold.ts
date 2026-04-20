import type { QuickliApiScenario, ExportableLIXIScenario } from '../types';
import { executeMath, resolveDependantAge } from '../utils';

const QUICKLI_API_EXPENSES_CATEGORIES = [
  'simple_basic_expense',
  'primary_residence',
  'phone_internet_media',
  'food_and_groceries',
  'recreation_and_holidays',
  'clothing_and_personal_care',
  'medical_and_health',
  'transport',
  'public_education',
  'higher_education_and_vocational_training',
  'childcare',
  'general_insurance',
  'other_insurance',
  'other',
  'property_tax',
  'strata_fees_and_body_corporate_fees',
  'private_non_government_school_fees',
  'child_support_maintenance_payments',
  'private_health_insurance',
  'life_accident_illness_insurance',
  'secondary_residence_costs',
  'ongoing_rent',
  'other_non_hem',
] as const;

const QUICKLI_API_TO_LIXI_CATEGORIES = {
  simple_basic_expense: null,
  primary_residence: 'Primary Residence Running Costs',
  phone_internet_media:
    'Telephone, internet, pay TV and media streaming subscriptions',
  food_and_groceries: 'Groceries',
  recreation_and_holidays: 'Recreation and entertainment',
  clothing_and_personal_care: 'Clothing and personal care',
  medical_and_health: 'Medical and health',
  transport: 'Transport',
  public_education: 'Public or Government Primary and Secondary Education',
  higher_education_and_vocational_training:
    'Higher Education, Vocational Training and Professional Fees',
  childcare: 'Childcare',
  general_insurance: 'General Basic Insurances',
  other_insurance: null,
  other: 'Other',
  property_tax: 'Property Tax',
  strata_fees_and_body_corporate_fees:
    'Body Corporate Fees, Strata Fees and Land Tax on Owner Occupied Principal Place of Residence',
  private_non_government_school_fees: 'Private Schooling and Tuition',
  child_support_maintenance_payments: 'Child Maintenance',
  private_health_insurance: 'Health Insurance',
  life_accident_illness_insurance:
    'Sickness and Personal Accident Insurance, Life Insurance',
  secondary_residence_costs: 'Secondary Residence Running Costs',
  ongoing_rent: 'Rent',
  other_non_hem: 'Other',
} as const;

function getLIXIHousehold(quickliApiScenario: QuickliApiScenario): {
  household: ExportableLIXIScenario['household'];
} {
  const LIXIHousehold: ExportableLIXIScenario['household'] = [];

  quickliApiScenario.households.forEach((savedHousehold, i) => {
    const newLIXIHousehold: ExportableLIXIScenario['household'][number] = {
      uniqueID: savedHousehold.id,
      dependant: [],
      expenseDetails: {
        livingExpense: [],
        OtherCommitment: [],
      },
    };
    newLIXIHousehold.dependant = savedHousehold.dependants_age
      ? savedHousehold.dependants_age.map((age, idx) => {
          const mode = savedHousehold.dependants_mode?.[idx] ?? 'age';
          if (mode === 'dob') {
            const dob = savedHousehold.dependants_dob?.[idx];
            return { age: Math.floor(resolveDependantAge(dob, age, 'dob')) };
          }
          const isAgeZero = age === '0' || age === 0;
          return { age: isAgeZero ? 0 : executeMath(age) || null };
        })
      : Array(savedHousehold.num_dependants).map((_) => ({ age: null }));

    const savedLivingExpenses = quickliApiScenario.living_expenses[i];
    const otherCommitmentList = new Set([
      'strata_fees_and_body_corporate_fees',
      'private_non_government_school_fees',
      'child_support_maintenance_payments',
      'private_health_insurance',
      'life_accident_illness_insurance',
      'secondary_residence_costs',
      'ongoing_rent',
      'other_non_hem',
    ]);
    QUICKLI_API_EXPENSES_CATEGORIES.forEach((category) => {
      const amount = executeMath(savedLivingExpenses[category]);
      const LIXICategory = QUICKLI_API_TO_LIXI_CATEGORIES[category];

      if (amount && LIXICategory !== null) {
        if (otherCommitmentList.has(category)) {
          newLIXIHousehold.expenseDetails.OtherCommitment.push({
            category: LIXICategory,
            amount,
            frequency: 'Monthly',
          });
        } else {
          newLIXIHousehold.expenseDetails.livingExpense.push({
            category: LIXICategory,
            amount,
            frequency: 'Monthly',
          });
        }
      }

    });

    if (savedLivingExpenses.use_notional_rent) {
      newLIXIHousehold.expenseDetails.useNotionalRent = true;
    }

    LIXIHousehold.push(newLIXIHousehold);
  });

  return { household: LIXIHousehold };
}

export default getLIXIHousehold;
