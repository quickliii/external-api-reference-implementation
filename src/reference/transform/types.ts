// ---------------------------------------------------------------------------
// Transform module types -- plain TS interfaces extracted from Zod schemas.
// Zero npm dependencies. This is a standalone Vite+React project.
// ---------------------------------------------------------------------------

// ---- Utility types --------------------------------------------------------

export type SmartNumber = string | number | null | undefined;

// ---- Transform result (discriminated union) --------------------------------

export interface TransformSuccess {
  success: true;
  data: Record<string, unknown>;
}

export interface TransformError {
  success: false;
  errors: string[];
}

export type TransformResult = TransformSuccess | TransformError;

// ---- LIXI string-literal unions -------------------------------------------

export type LIXIFrequency =
  | 'Days'
  | 'Daily'
  | 'Fortnightly'
  | 'Half Yearly'
  | 'Monthly'
  | 'Months'
  | 'One Off'
  | 'Quarterly'
  | 'Seasonal'
  | 'Weekly'
  | 'Weeks'
  | 'Years'
  | 'Yearly';

export type LIXILivingExpenseCategory =
  | 'Body Corporate Fees, Strata Fees and Land Tax on Owner Occupied Principal Place of Residence'
  | 'Childcare'
  | 'Clothing and personal care'
  | 'Education'
  | 'General Basic Insurances'
  | 'Groceries'
  | 'Health Insurance'
  | 'Higher Education, Vocational Training and Professional Fees'
  | 'Insurance'
  | 'Investment Property Running Costs'
  | 'Investment property utilities, rates and related costs'
  | 'Medical and health'
  | 'Other'
  | 'Owner occupied property utilities, rates and related costs'
  | 'Pet Care'
  | 'Primary Residence Running Costs'
  | 'Private Schooling and Tuition'
  | 'Property Tax'
  | 'Public or Government Primary and Secondary Education'
  | 'Recreation and entertainment'
  | 'Secondary Residence Running Costs'
  | 'Sickness and Personal Accident Insurance, Life Insurance'
  | 'Telephone, internet, pay TV and media streaming subscriptions'
  | 'Transport'
  | 'Board'
  | 'Child and Spousal Maintenance'
  | 'Child Maintenance'
  | 'Rent';

export type LIXILiabilityType =
  | 'Amortising Home Loan'
  | 'Bank Guarantee'
  | 'Bridging Finance'
  | 'Buy Now Pay Later'
  | 'Car Loan'
  | 'Commercial Bill'
  | 'Contingent Liability'
  | 'Credit Card'
  | 'Government Benefits Debt'
  | 'HECS-HELP'
  | 'Hire Purchase'
  | 'Invoice Financing Loan'
  | 'Lease'
  | 'Line of Credit'
  | 'Line of Credit Home Loan'
  | 'Loan as Guarantor'
  | 'Margin Loan'
  | 'Mortgage Loan'
  | 'Other'
  | 'Other Loan'
  | 'Outstanding Taxation'
  | 'Overdraft'
  | 'Personal Loan'
  | 'Store Card'
  | 'Student Loan'
  | 'Term Loan'
  | 'Trade Finance Loan';

export type LIXIOtherIncomeType =
  | 'Annuities'
  | 'Child Maintenance'
  | 'Dividends'
  | 'Foreign Sourced'
  | 'Government Benefits'
  | 'Interest Income'
  | 'Managed Investment'
  | 'Other Income'
  | 'Private Pension'
  | 'Rental Income'
  | 'Salary Sacrifice Contribution'
  | 'Super Concessional Contribution'
  | 'Super Excess Concessional Contribution'
  | 'Super Non Concessional Contribution'
  | 'Superannuation'
  | 'Workers Compensation';

export type LIXIShortFrequencyUnit = 'Days' | 'Months' | 'Weeks' | 'Years';

export type LIXIMaritalStatus = 'De Facto' | 'Married' | 'Single';

export type LIXILoanPrimaryPurpose =
  | 'Business'
  | 'Investment Non Residential'
  | 'Investment Residential'
  | 'Owner Occupied'
  | 'Personal';

export type LIXIProportions = 'Equal' | 'Not Specified' | 'Specified';

// ---- LIXI sub-types (input) -----------------------------------------------

export interface LIXIEmploymentIncome {
  bonusAmount?: number | null;
  bonusFrequency?: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  previousYearBonusAmount?: number | null;
  previousYearBonusFrequency?: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  carAllowanceAmount?: number | null;
  carAllowanceFrequency?: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  commissionAmount?: number | null;
  commissionFrequency?: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  grossRegularOvertimeAmount?: number | null;
  grossRegularOvertimeFrequency?: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  grossSalaryAmount?: number | null;
  grossSalaryFrequency?: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  netBonusAmount?: number | null;
  netBonusFrequency?: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  netCarAllowanceAmount?: number | null;
  netCarAllowanceFrequency?: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  netCommissionAmount?: number | null;
  netCommissionFrequency?: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  netRegularOvertimeAmount?: number | null;
  netRegularOvertimeFrequency?: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  netSalaryAmount?: number | null;
  netSalaryFrequency?: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  netWorkAllowanceAmount?: number | null;
  netWorkAllowanceFrequency?: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  netWorkersCompensationAmount?: number | null;
  netWorkersCompensationFrequency?: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  workAllowanceAmount?: number | null;
  workAllowanceFrequency?: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  workersCompensationAmount?: number | null;
  workersCompensationFrequency?: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
}

export interface LIXIEmploymentPay {
  status?: 'Primary' | 'Secondary' | 'Previous' | null;
  basis?: 'Casual' | 'Commission Only' | 'Contract' | 'Full Time' | 'Part Time' | 'Seasonal' | 'Temporary' | null;
  x_Employer?: string | null;
  essentialServiceProvider?: boolean | 'Yes' | 'No';
  isCompanyVehicleProvided?: boolean | 'Yes' | 'No';
  income?: LIXIEmploymentIncome | null;
}

export interface LIXISelfEmployedAddback {
  allowances?: number | null;
  amortisationOfGoodwill?: number | null;
  bonus?: number | null;
  carExpense?: number | null;
  carryForwardLosses?: number | null;
  depreciation?: number | null;
  interest?: number | null;
  lease?: number | null;
  nonCashBenefits?: number | null;
  nonRecurringIncome?: number | null;
  nonRecurringExpenses?: number | null;
  instantAssetWriteOff?: number | null;
  salary?: number | null;
  superannuationExcess?: number | null;
  otherAddback?: Array<{ description?: string | null; amount?: number | null }> | null;
}

export interface LIXISelfEmployedYearDetail {
  profitBeforeTax?: number | null;
  startDate?: string | null;
  addback?: LIXISelfEmployedAddback | null;
}

export interface LIXIOwner {
  percent?: number;
  x_Party: string;
}

export interface LIXIPercentOwned {
  proportions?: string;
  owner?: LIXIOwner[];
}

// ---- LIXIScenarioContent (input to lixiToScenario) ------------------------

export interface LIXIAddress {
  uniqueID: string;
  postCode?: string | number | null;
  australianPostCode?: string | number | null;
  fullAddress?: string | null;
}

export interface LIXIDependant {
  age?: number;
}

export interface LIXIExpenseDetail {
  amount?: number;
  category: LIXILivingExpenseCategory;
  frequency: LIXIFrequency;
}

export interface LIXIHouseholdExpenseDetails {
  livingExpense?: LIXIExpenseDetail[];
  OtherCommitment?: LIXIExpenseDetail[];
  useNotionalRent?: boolean | null;
}

export interface LIXIHousehold {
  uniqueID: string;
  dependant?: LIXIDependant[];
  expenseDetails?: LIXIHouseholdExpenseDetails;
}

export interface LIXIPostSettlementAddress {
  x_ResidentialAddress?: string;
  postcode?: string | number;
}

export interface LIXIPersonContact {
  postSettlementAddress?: LIXIPostSettlementAddress;
}

export interface LIXIPersonName {
  firstName?: string;
  middleNames?: string;
  surname?: string;
}

export interface LIXISelfEmployed {
  businessIncomeRecent?: LIXISelfEmployedYearDetail;
  businessIncomePrior?: LIXISelfEmployedYearDetail;
  businessIncomePrevious?: LIXISelfEmployedYearDetail;
  x_Employer?: string | null;
}

export interface LIXIEmployment {
  pay?: LIXIEmploymentPay;
  payg?: LIXIEmploymentPay;
  selfEmployed?: LIXISelfEmployed;
  foreignedEmployed?: LIXIEmploymentPay;
}

export interface LIXIPersonApplicant {
  uniqueID: string;
  x_Household: string;
  maritalStatus: LIXIMaritalStatus;
  personName?: LIXIPersonName;
  contact?: LIXIPersonContact;
  employment?: LIXIEmployment[];
}

export interface LIXILiabilityAccountNumber {
  financialInstitution?: string | null;
  otherFIName?: string | null;
}

export interface LIXILiabilityLoanPurpose {
  primaryPurpose?: LIXILoanPrimaryPurpose;
  x_Employer?: string | null;
}

export interface LIXIRemainingTerm {
  duration?: number | null;
  interestOnlyDuration?: number | null;
  units?: LIXIShortFrequencyUnit | null;
}

export interface LIXIOriginalTerm {
  interestTypeDuration?: number | null;
  interestTypeUnits?: LIXIShortFrequencyUnit | null;
  totalTermDuration?: number | null;
  totalTermUnits?: LIXIShortFrequencyUnit | null;
}

export interface LIXIRepayment {
  repaymentAmount?: number | null;
  repaymentFrequency?: LIXIFrequency;
  paymentType?: string;
  taxDeductible?: boolean | null | 'Yes' | 'No';
}

export interface LIXISecurity {
  x_Security: string;
}

export interface LIXILiability {
  uniqueID: string;
  accountNumber?: LIXILiabilityAccountNumber | null;
  annualInterestRate?: number | null;
  clearingFromThisLoan?: boolean | null;
  creditLimit?: number | null;
  outstandingBalance?: number | null;
  type?: LIXILiabilityType | null;
  loanPurpose?: LIXILiabilityLoanPurpose;
  remainingTerm?: LIXIRemainingTerm | null;
  originalTerm?: LIXIOriginalTerm | null;
  repayment?: LIXIRepayment[];
  percentOwned?: LIXIPercentOwned;
  security?: LIXISecurity[];
}

export interface LIXILoanTerm {
  interestType?: 'Fixed' | 'Variable';
  interestTypeDuration?: number;
  interestTypeUnits?: LIXIShortFrequencyUnit;
  paymentType?: string;
  paymentTypeDuration?: number;
  paymentTypeUnits?: LIXIShortFrequencyUnit;
  totalTermDuration?: number;
  totalTermUnits?: LIXIShortFrequencyUnit;
}

export interface LIXILoanBorrowers {
  proportions?: string;
  owner?: LIXIOwner[];
}

export interface LIXILoanPurpose {
  primaryPurpose?: string;
}

export interface LIXILoanDetails {
  uniqueID: string;
  amountRequested?: number;
  lvr?: number;
  taxDeductible?: boolean | 'Yes' | 'No';
  borrowers?: LIXILoanBorrowers;
  loanPurpose?: LIXILoanPurpose;
  term?: LIXILoanTerm;
}

export interface LIXIRentalIncome {
  rentalAmount?: number;
  frequency?: LIXIFrequency;
  shortTermRentalAccommodation?: boolean | 'Yes' | 'No';
  boarderIncome?: boolean | 'Yes' | 'No';
  uniqueID?: string;
  xOwner?: string;
}

export interface LIXIFutureRentalIncome {
  grossRentalAmount?: number;
  grossRentalFrequency?: LIXIFrequency;
  xOwner?: string;
}

export interface LIXIPropertyExpense {
  amount?: number;
  frequency?: LIXIFrequency;
  category?: string;
}

export interface LIXIRealEstateAsset {
  uniqueID: string;
  transaction?: 'Owns' | 'Owns Existing Mortgage' | 'Purchasing' | 'Sold' | 'Transfer';
  primaryPurpose?: 'Business' | 'Investment' | 'Owner Occupied';
  primaryUsage?: string;
  toBeUsedAsSecurity?: boolean;
  propertyType?: { propertyTypeName?: string };
  estimatedValue?: { value?: number };
  rentalIncome?: LIXIRentalIncome[];
  futureRentalIncome?: LIXIFutureRentalIncome[];
  percentOwned?: LIXIPercentOwned;
  propertyExpense?: LIXIPropertyExpense[];
}

export interface LIXIOtherIncome {
  amount?: number;
  frequency?: LIXIFrequency;
  type?: LIXIOtherIncomeType;
  governmentBenefitsType?: string;
  isTaxable?: boolean | 'Yes' | 'No';
  percentOwned?: LIXIPercentOwned;
}

export interface LIXIShareHolder {
  percentOwned?: number;
  x_Shareholder?: string;
}

export interface LIXIRelatedCompany {
  uniqueID: string;
  companyName?: string;
  businessStructure?: 'Company' | 'Partnership' | 'Sole Trader' | 'Trust';
  shareHolder?: LIXIShareHolder[];
}

export type LIXIEnvelope = {
  content: { application: LIXIScenarioContent };
};

export interface LIXIScenarioContent {
  title?: string;
  address?: LIXIAddress[];
  household: LIXIHousehold[];
  personApplicant: LIXIPersonApplicant[];
  liability: LIXILiability[];
  loanDetails: LIXILoanDetails[];
  realEstateAsset: LIXIRealEstateAsset[];
  otherIncome: LIXIOtherIncome[];
  relatedCompany?: LIXIRelatedCompany[];
}

// ---- Saveable types (output of lixiToScenario) ----------------------------

export interface SaveableHousehold {
  id: string;
  postcode?: SmartNumber;
  status: 'single' | 'married' | 'defacto';
  shared_with_households: number[];
  num_adults: number;
  num_dependants: number | '' | '0';
  dependants_age?: (string | number)[];
  dependants_dob?: (string | Date | null)[];
  dependants_mode?: ('age' | 'dob')[];
}

export interface SaveableIncome {
  id: string;
  name?: string;
  which_household: number;
  payg?: SmartNumber;
  casual?: SmartNumber;
  commission?: SmartNumber;
  use_simple_bonus?: boolean;
  recent_year_bonus?: SmartNumber;
  previous_year_bonus?: SmartNumber;
  bonus_details?: {
    use_simple_bonus: boolean;
    bonus_income?: SmartNumber;
    recent_year_income?: SmartNumber;
    previous_year_income?: SmartNumber;
  };
  overtime?: SmartNumber;
  essential_worker_overtime?: SmartNumber;
  foreign_income?: SmartNumber;
  net_foreign_income?: SmartNumber;
  investment_income?: SmartNumber;
  interest_income?: SmartNumber;
  annuities?: SmartNumber;
  car_allowance?: SmartNumber;
  company_car?: boolean;
  second_job?: SmartNumber;
  other_taxed?: SmartNumber;
  social_security?: SmartNumber;
  family_tax_a?: SmartNumber;
  family_tax_b?: SmartNumber;
  parenting_payments?: SmartNumber;
  carers_income?: SmartNumber;
  pension?: SmartNumber;
  child_maintenance?: SmartNumber;
  other_tax_free?: SmartNumber;
  HECS?: boolean;
  HECS_balance?: SmartNumber;
  override_HECS_repayment?: boolean;
  HECS_repayment?: SmartNumber;
}

export interface SaveableLiability {
  id: string;
  loan_type: 'credit_card' | 'overdraft' | 'lease' | 'car' | 'personal' | 'margin' | 'other';
  limit?: SmartNumber;
  monthly_repayment?: SmartNumber;
  rate?: SmartNumber;
  remaining_term?: SmartNumber;
  ignore?: boolean;
  lender?: string;
}

export interface SaveableHomeLoan {
  id: string;
  ignore?: boolean;
  product_type:
    | 'variable_package'
    | 'fixed_rate_1_year'
    | 'fixed_rate_2_year'
    | 'fixed_rate_3_year'
    | 'fixed_rate_4_year'
    | 'fixed_rate_5_year'
    | 'fixed_rate_7_year'
    | 'fixed_rate_10_year';
  existing_or_proposed: 'existing' | 'proposed';
  loan_type: string;
  loan_amount?: SmartNumber;
  actual_rate?: SmartNumber;
  term?: SmartNumber;
  interest_only_period?: SmartNumber;
  lvr?: SmartNumber;
  use_generic_rate?: boolean;
  is_tax_deductible?: boolean;
  applicant_tax_benefit?: SmartNumber[];
  which_rentals?: (boolean | undefined)[];
  lender?: string;
  loan_balance?: SmartNumber;
  monthly_repayment?: SmartNumber;
}

export interface SaveableSecurity {
  id: string;
  address?: string;
  postcode?: SmartNumber;
  property_purpose?: 'investment' | 'owner_occupied';
  rental_type?: 'residential' | 'commercial' | 'short_term' | 'boarder' | null;
  property_type?: 'house' | 'apartment' | 'land' | 'other' | null;
  transaction_type?: 'owns_outright' | 'purchasing' | 'owns_with_mortgage';
  value?: SmartNumber;
  weekly_rental_income?: SmartNumber;
  monthly_rental_expense?: SmartNumber;
  applicant_ownership: SmartNumber[];
  use_rental_yield?: boolean;
  rental_yield?: SmartNumber;
}

export interface SaveableHomeLoanSecurityLink {
  id: string;
  which_securities: boolean[];
  which_home_loans: boolean[];
  which_color_id?: string;
}

export interface SaveableSelfEmployedDetails {
  year_ended?: number | '' | null;
  net_profit_before_tax?: SmartNumber;
  non_recurring_income?: SmartNumber;
  non_recurring_expenses?: SmartNumber;
  interest?: SmartNumber;
  depreciation?: SmartNumber;
  instant_asset_write_off?: SmartNumber;
  super_above_compulsory?: SmartNumber;
  lease_hp?: SmartNumber;
  other?: SmartNumber;
  personal_wages_before_tax: SmartNumber[];
}

export interface SaveableSelfEmployedBusinessLiability {
  id: string;
  facility_type:
    | 'overdraft'
    | 'lease'
    | 'term_loan'
    | 'credit_card'
    | 'housing_loan'
    | 'commercial_bill'
    | 'line_of_credit'
    | 'other';
  limit?: SmartNumber;
  term?: SmartNumber;
  interest_only_period?: SmartNumber;
  actual_rate?: SmartNumber;
  monthly_repayment?: SmartNumber;
}

export interface SaveableSelfEmployedIncome {
  id: string;
  name?: string;
  entity_type: 'company' | 'sole_trader' | 'partnership' | 'trust';
  calculation_method: 'lender_default' | 'always_average' | 'use_most_recent_year';
  most_recent_year_details: SaveableSelfEmployedDetails;
  previous_year_details: SaveableSelfEmployedDetails;
  applicant_ownership: SmartNumber[];
  business_liabilities: SaveableSelfEmployedBusinessLiability[];
}

export interface SaveableLivingExpenses {
  id: string;
  simple_basic_expense?: SmartNumber;
  use_detailed_basic_expense?: boolean;
  primary_residence?: SmartNumber;
  phone_internet_media?: SmartNumber;
  food_and_groceries?: SmartNumber;
  recreation_and_holidays?: SmartNumber;
  clothing_and_personal_care?: SmartNumber;
  medical_and_health?: SmartNumber;
  transport?: SmartNumber;
  public_education?: SmartNumber;
  higher_education_and_vocational_training?: SmartNumber;
  childcare?: SmartNumber;
  general_insurance?: SmartNumber;
  other_insurance?: SmartNumber;
  other?: SmartNumber;
  property_tax?: SmartNumber;
  strata_fees_and_body_corporate_fees?: SmartNumber;
  private_non_government_school_fees?: SmartNumber;
  child_support_maintenance_payments?: SmartNumber;
  private_health_insurance?: SmartNumber;
  life_accident_illness_insurance?: SmartNumber;
  secondary_residence_costs?: SmartNumber;
  use_notional_rent?: boolean;
  ongoing_rent?: SmartNumber;
  other_non_hem?: SmartNumber;
}

export interface SaveableScenario {
  households: SaveableHousehold[];
  income: SaveableIncome[];
  securities?: SaveableSecurity[];
  home_loan_security_links?: SaveableHomeLoanSecurityLink[];
  self_employed_income: SaveableSelfEmployedIncome[];
  home_loans: SaveableHomeLoan[];
  liabilities: SaveableLiability[];
  living_expenses: SaveableLivingExpenses[];
  additional_info?: {
    useDependantAges?: boolean;
    isStreamlinedRefinance?: boolean;
    refinancedLoanRepayments?: Array<{
      id: string;
      linked_to?: SmartNumber;
      monthly_repayment?: SmartNumber;
    }>;
    [key: string]: unknown;
  };
}

// ---- Exportable LIXI types (output of scenarioToLixi) ---------------------

export type ExportableFrequency =
  | 'Daily'
  | 'Fortnightly'
  | 'Half Yearly'
  | 'Monthly'
  | 'One Off'
  | 'Quarterly'
  | 'Seasonal'
  | 'Weekly'
  | 'Yearly';

export type ExportableShortFrequencyUnit = 'Days' | 'Months' | 'Weeks' | 'Years';

export type ExportablePaymentType =
  | 'Interest Capitalised'
  | 'Interest Only'
  | 'Interest Partially Capitalised'
  | 'Prepaid Interest'
  | 'Principal and Interest'
  | 'Principal Interest Fees';

export type ExportableLoanType =
  | 'Amortising Home Loan'
  | 'Bank Guarantee'
  | 'Bridging Finance'
  | 'Chattel Mortgage'
  | 'Commercial Bill'
  | 'Commercial Hire Purchase'
  | 'Credit Card'
  | 'Finance Lease'
  | 'Invoice Financing Loan'
  | 'Lease'
  | 'Line of Credit'
  | 'Line of Credit Home Loan'
  | 'Margin Loan'
  | 'Mortgage Loan'
  | 'Novated Lease'
  | 'Operating Lease'
  | 'Other Loan'
  | 'Overdraft'
  | 'Personal Loan'
  | 'Reverse Mortgage'
  | 'Term Loan'
  | 'Trade Finance Loan';

export type ExportableGovernmentBenefitsType =
  | 'Abstudy'
  | 'Age Pension'
  | 'Austudy'
  | 'Carer Allowance'
  | 'Carer Payment'
  | 'Child Support'
  | 'Crisis Payment'
  | 'Disability Support Pension'
  | 'Family Allowance'
  | 'Family Tax Benefit A'
  | 'Family Tax Benefit B'
  | 'Government Benefit Supplements'
  | 'Mobility Allowance'
  | 'Other'
  | 'Parenting Payment'
  | 'Service Pension'
  | 'Widows Allowance'
  | 'Youth Allowance';

export type ExportableEmploymentBasis =
  | 'Casual'
  | 'Commission Only'
  | 'Contract'
  | 'Full Time'
  | 'Part Time'
  | 'Seasonal'
  | 'Temporary';

export type ExportableEmploymentStatus = 'Primary' | 'Secondary' | 'Previous';

export type ExportablePropertyTypeName = 'House' | 'Apartment' | 'Vacant Land';

export type ExportableCommercialType =
  | 'Block of Units or Flats'
  | 'Factory'
  | 'Multiple Dwelling Development'
  | 'Non Specialised Commercial'
  | 'Offices'
  | 'Other'
  | 'Professional Chambers'
  | 'Residential Commercial'
  | 'Retail'
  | 'Retirement Village'
  | 'Vacant Land'
  | 'Warehouse';

export type ExportablePrimaryUsage = 'Commercial' | 'Industrial' | 'Residential' | 'Rural';

export type ExportableTransaction = 'Owns' | 'Owns Existing Mortgage' | 'Purchasing' | 'Sold' | 'Transfer';

export type ExportablePropertyExpenseCategory =
  | 'Body Corporate Fees, Strata Fees and Land Tax'
  | 'Interest Expense'
  | 'Running Costs';

export type ExportableTotalTermType = 'Amortisation Term' | 'Total Term';

export interface ExportableOwner {
  percent: number;
  x_Party: string;
}

export interface ExportablePercentOwned {
  proportions: LIXIProportions;
  owner: ExportableOwner[];
}

export interface ExportableHouseholdExpenseDetail {
  amount: number | null;
  category: LIXILivingExpenseCategory;
  frequency: ExportableFrequency;
}

export interface ExportableHousehold {
  uniqueID: string;
  dependant: Array<{ age: number | null }>;
  expenseDetails: {
    livingExpense: Array<ExportableHouseholdExpenseDetail | null>;
    OtherCommitment: Array<ExportableHouseholdExpenseDetail | null>;
    useNotionalRent?: boolean | null;
  };
}

export interface ExportableAddress {
  uniqueID: string;
  postCode?: string | null;
  australianPostCode?: string | null;
  fullAddress?: string | null;
}

export interface ExportableLiabilityRepayment {
  paymentType: ExportablePaymentType;
  repaymentAmount: number | null;
  repaymentFrequency: ExportableFrequency;
  taxDeductible: boolean;
}

export interface ExportableLiability {
  uniqueID: string;
  annualInterestRate: number | null;
  creditLimit: number | null;
  outstandingBalance: number | null;
  type: LIXILiabilityType;
  loanPurpose: {
    primaryPurpose: LIXILoanPrimaryPurpose;
    x_Employer?: string | null;
  };
  remainingTerm: {
    duration: number | null;
    interestOnlyDuration: number | null;
    units: ExportableShortFrequencyUnit | null;
  };
  originalTerm: {
    interestTypeDuration: number | null;
    interestTypeUnits: ExportableShortFrequencyUnit | null;
    totalTermDuration: number | null;
    totalTermUnits: ExportableShortFrequencyUnit | null;
  } | null;
  repayment: ExportableLiabilityRepayment[];
  percentOwned: ExportablePercentOwned;
  security: Array<{ x_Security: string }>;
}

export interface ExportableLoanDetailsTerm {
  interestType: 'Fixed' | 'Variable' | null;
  interestTypeDuration: number | null;
  interestTypeUnits: ExportableShortFrequencyUnit | null;
  paymentType: ExportablePaymentType;
  paymentTypeDuration: number | null;
  paymentTypeUnits: ExportableShortFrequencyUnit | null;
  totalTermDuration: number | null;
  totalTermType: ExportableTotalTermType | null;
  totalTermUnits: ExportableShortFrequencyUnit | null;
}

export interface ExportableLoanDetails {
  uniqueID: string;
  amountRequested: number | null;
  amountToBeFinanced: number | null;
  lvr: number | null;
  loanType: ExportableLoanType;
  taxDeductible: boolean;
  borrowers: ExportablePercentOwned;
  loanPurpose: {
    primaryPurpose: LIXILoanPrimaryPurpose;
  };
  term: ExportableLoanDetailsTerm;
}

export interface ExportableOtherIncome {
  amount: number;
  description: string;
  frequency: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  governmentBenefitsType: ExportableGovernmentBenefitsType | null;
  isTaxable: boolean;
  netAmount: number | null;
  netAmountFrequency: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  type: LIXIOtherIncomeType | null;
  percentOwned: ExportablePercentOwned;
}

export interface ExportableEmploymentIncome {
  bonusAmount: number | null;
  bonusFrequency: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  previousYearBonusAmount: number | null;
  previousYearBonusFrequency: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  carAllowanceAmount: number | null;
  carAllowanceFrequency: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  commissionAmount: number | null;
  commissionFrequency: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  grossRegularOvertimeAmount: number | null;
  grossRegularOvertimeFrequency: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  grossSalaryAmount: number | null;
  grossSalaryFrequency: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  netBonusAmount: number | null;
  netBonusFrequency: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  netCarAllowanceAmount: number | null;
  netCarAllowanceFrequency: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  netCommissionAmount: number | null;
  netCommissionFrequency: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  netRegularOvertimeAmount: number | null;
  netRegularOvertimeFrequency: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  netSalaryAmount: number | null;
  netSalaryFrequency: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  netWorkAllowanceAmount: number | null;
  netWorkAllowanceFrequency: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  netWorkersCompensationAmount: number | null;
  netWorkersCompensationFrequency: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  workAllowanceAmount: number | null;
  workAllowanceFrequency: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
  workersCompensationAmount: number | null;
  workersCompensationFrequency: 'Fortnightly' | 'Monthly' | 'Weekly' | 'Yearly' | null;
}

export interface ExportableSelfEmployedAddback {
  allowances: number | null;
  amortisationOfGoodwill: number | null;
  bonus: number | null;
  carExpense: number | null;
  carryForwardLosses: number | null;
  depreciation: number | null;
  interest: number | null;
  lease: number | null;
  nonCashBenefits: number | null;
  nonRecurringIncome: number | null;
  nonRecurringExpenses: number | null;
  instantAssetWriteOff: number | null;
  salary: number | null;
  superannuationExcess: number | null;
  otherAddback: Array<{ description: string | null; amount: number | null }> | null;
}

export interface ExportableSelfEmployedYearDetail {
  profitBeforeTax: number | null;
  startDate: string | null;
  addback: ExportableSelfEmployedAddback | null;
}

export interface ExportableEmployment {
  status: ExportableEmploymentStatus | null;
  basis: ExportableEmploymentBasis | null;
  x_Employer?: string | null;
  essentialServiceProvider: boolean;
  isCompanyVehicleProvided: boolean;
  income: ExportableEmploymentIncome | null;
}

export interface ExportablePersonApplicant {
  uniqueID: string;
  x_Household: string;
  personName: {
    firstName: string | null;
    middleNames: string | null;
    surname: string | null;
  };
  contact: {
    postSettlementAddress: {
      x_ResidentialAddress: string;
      postcode: string | null;
    };
  };
  employment: Array<{
    foreignedEmployed: ExportableEmployment | null;
    payg?: ExportableEmployment | null;
    pay: ExportableEmployment | null;
    selfEmployed: {
      businessIncomePrevious: ExportableSelfEmployedYearDetail | null;
      businessIncomePrior: ExportableSelfEmployedYearDetail | null;
      businessIncomeRecent: ExportableSelfEmployedYearDetail | null;
      x_Employer?: string | null;
    } | null;
  }>;
  maritalStatus: LIXIMaritalStatus;
}

export interface ExportableRentalIncome {
  frequency: ExportableFrequency;
  guaranteedRent: boolean | null;
  rentalAmount: number | null;
  uniqueID: string;
  xOwner: string;
  shortTermRentalAccommodation: boolean | null;
}

export interface ExportableFutureRentalIncome {
  grossRentalAmount: number | null;
  grossRentalFrequency: ExportableFrequency;
  netRentalAmount: number | null;
  netRentalFrequency: ExportableFrequency;
  xOwner: string;
}

export interface ExportablePropertyExpense {
  amount: number | null;
  category: ExportablePropertyExpenseCategory;
  frequency: ExportableFrequency;
}

export interface ExportableRealEstateAsset {
  primaryPurpose: 'Business' | 'Investment' | 'Owner Occupied';
  primarySecurity: boolean;
  primaryUsage: ExportablePrimaryUsage | null;
  toBeSold: boolean | null;
  toBeUsedAsSecurity: boolean | null;
  transaction: ExportableTransaction;
  uniqueID: string;
  commercial: { type: ExportableCommercialType } | null;
  estimatedValue: { value: number | null };
  futureRentalIncome: ExportableFutureRentalIncome[];
  percentOwned: ExportablePercentOwned;
  propertyExpense: ExportablePropertyExpense[];
  rentalIncome: ExportableRentalIncome[];
  propertyType: { propertyTypeName: ExportablePropertyTypeName };
}

export interface ExportableRelatedCompany {
  uniqueID: string;
  businessStructure: 'Company' | 'Partnership' | 'Sole Trader' | 'Trust';
  companyName: string | null;
  shareHolder: Array<{
    percentOwned: number | null;
    x_Shareholder: string;
  }>;
}

export interface ExportableLIXIScenario {
  household: ExportableHousehold[];
  address: ExportableAddress[];
  liability: ExportableLiability[];
  loanDetails: ExportableLoanDetails[];
  otherIncome: ExportableOtherIncome[];
  personApplicant: ExportablePersonApplicant[];
  realEstateAsset: ExportableRealEstateAsset[];
  relatedCompany: ExportableRelatedCompany[];
}
