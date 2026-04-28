// Runtime schema metadata derived from the TypeScript interfaces in types.ts.
// Used by the JSON tree view to show field types.

export type FieldSchema = {
  type: string;
  fields?: Record<string, FieldSchema>;
  items?: FieldSchema;
};

// -- shorthand helpers --
const sn: FieldSchema = { type: 'number?' };
const s: FieldSchema = { type: 'string' };
const n: FieldSchema = { type: 'number' };
const b: FieldSchema = { type: 'bool' };

// ---- v3 Scenario schema ---------------------------------------------------

const householdSchema: FieldSchema = {
  type: 'QuickliApiHousehold',
  fields: {
    id: s,
    postcode: sn,
    status: { type: "'single' | 'married' | 'defacto'" },
    shared_with_households: { type: 'number[]' },
    num_adults: n,
    num_dependants: n,
    dependants_age: { type: '(string | number)[]' },
    dependants_dob: { type: '(string | Date)[]' },
    dependants_mode: { type: "('age' | 'dob')[]" },
  },
};

const incomeSchema: FieldSchema = {
  type: 'QuickliApiIncome',
  fields: {
    id: s, name: s, which_household: n,
    payg: sn, casual: sn, commission: sn,
    use_simple_bonus: b, recent_year_bonus: sn, previous_year_bonus: sn,
    bonus_details: {
      type: 'object',
      fields: { use_simple_bonus: b, bonus_income: sn, recent_year_income: sn, previous_year_income: sn },
    },
    overtime: sn, essential_worker_overtime: sn,
    foreign_income: sn, net_foreign_income: sn,
    investment_income: sn, interest_income: sn, annuities: sn,
    car_allowance: sn, company_car: b,
    second_job: sn, other_taxed: sn,
    social_security: sn, family_tax_a: sn, family_tax_b: sn,
    parenting_payments: sn, carers_income: sn, pension: sn,
    child_maintenance: sn, other_tax_free: sn,
    HECS: b, HECS_balance: sn, override_HECS_repayment: b, HECS_repayment: sn,
  },
};

const liabilitySchema: FieldSchema = {
  type: 'QuickliApiLiability',
  fields: {
    id: s,
    loan_type: { type: "'credit_card' | 'overdraft' | 'lease' | 'car' | 'personal' | 'margin' | 'other'" },
    limit: sn, monthly_repayment: sn, rate: sn, remaining_term: sn,
    ignore: b, lender: s,
  },
};

const homeLoanBaseFields: Record<string, FieldSchema> = {
  id: s, ignore: b,
  product_type: { type: "'variable_package' | 'fixed_rate_N_year'" },
  loan_type: s,
  loan_amount: sn, actual_rate: sn, term: sn, interest_only_period: sn,
  applicant_tax_benefit: { type: 'number?[]' },
  which_rentals: { type: 'bool[]' },
  is_tax_deductible: b,
  resi_or_commercial: { type: "'residential' | 'commercial'" },
  ownership_modes: { type: "Record<string, 'auto' | 'manual'>" },
};

const proposedHomeLoanSchema: FieldSchema = {
  type: 'QuickliApiProposedHomeLoan',
  fields: {
    ...homeLoanBaseFields,
    lvr: sn, lvr_behavior: s, override_rates: b, use_generic_rate: b,
    lender_apps_only_product_name: s,
  },
};

const existingHomeLoanSchema: FieldSchema = {
  type: 'QuickliApiExistingHomeLoan',
  fields: {
    ...homeLoanBaseFields,
    lender: s, loan_balance: sn, monthly_repayment: sn,
  },
};

const securitySchema: FieldSchema = {
  type: 'QuickliApiSecurity',
  fields: {
    id: s, address: s, postcode: sn,
    property_purpose: { type: "'investment' | 'owner_occupied'" },
    rental_type: { type: "'residential' | 'commercial' | 'short_term' | 'boarder'" },
    property_type: { type: "'house' | 'apartment' | 'land' | 'other'" },
    transaction_type: { type: "'owns_outright' | 'purchasing' | 'owns_with_mortgage'" },
    value: sn, weekly_rental_income: sn, monthly_rental_expense: sn,
    applicant_ownership: { type: 'number?[]' },
    use_rental_yield: b, rental_yield: sn,
  },
};

const securityLinkSchema: FieldSchema = {
  type: 'QuickliApiHomeLoanSecurityLink',
  fields: {
    id: s,
    which_security_ids: { type: 'string[]' },
    which_proposed_home_loan_ids: { type: 'string[]' },
    which_existing_home_loan_ids: { type: 'string[]' },
  },
};

const selfEmployedDetailsSchema: FieldSchema = {
  type: 'QuickliApiSelfEmployedDetails',
  fields: {
    year_ended: n, net_profit_before_tax: sn,
    non_recurring_income: sn, non_recurring_expenses: sn,
    interest: sn, depreciation: sn, instant_asset_write_off: sn,
    super_above_compulsory: sn, lease_hp: sn, other: sn,
    personal_wages_before_tax: { type: 'number?[]' },
  },
};

const selfEmployedBusinessLiabilitySchema: FieldSchema = {
  type: 'QuickliApiSelfEmployedBusinessLiability',
  fields: {
    id: s,
    facility_type: { type: "'overdraft' | 'lease' | 'term_loan' | 'credit_card' | 'housing_loan' | 'commercial_bill' | 'line_of_credit' | 'other'" },
    limit: sn, term: sn, interest_only_period: sn, actual_rate: sn, monthly_repayment: sn,
  },
};

const selfEmployedIncomeSchema: FieldSchema = {
  type: 'QuickliApiSelfEmployedIncome',
  fields: {
    id: s, name: s,
    entity_type: { type: "'company' | 'sole_trader' | 'partnership' | 'trust'" },
    calculation_method: { type: "'lender_default' | 'always_average' | 'use_most_recent_year'" },
    most_recent_year_details: selfEmployedDetailsSchema,
    previous_year_details: selfEmployedDetailsSchema,
    applicant_ownership: { type: 'number?[]' },
    business_liabilities: { type: 'QuickliApiSelfEmployedBusinessLiability[]', items: selfEmployedBusinessLiabilitySchema },
  },
};

const livingExpensesSchema: FieldSchema = {
  type: 'QuickliApiLivingExpenses',
  fields: {
    id: s, simple_basic_expense: sn, use_detailed_basic_expense: b,
    primary_residence: sn, phone_internet_media: sn, food_and_groceries: sn,
    recreation_and_holidays: sn, clothing_and_personal_care: sn,
    medical_and_health: sn, transport: sn, public_education: sn,
    higher_education_and_vocational_training: sn, childcare: sn,
    general_insurance: sn, other_insurance: sn, other: sn,
    property_tax: sn, strata_fees_and_body_corporate_fees: sn,
    private_non_government_school_fees: sn, child_support_maintenance_payments: sn,
    private_health_insurance: sn, life_accident_illness_insurance: sn,
    secondary_residence_costs: sn, use_notional_rent: b, ongoing_rent: sn, other_non_hem: sn,
  },
};

export const scenarioSchema: FieldSchema = {
  type: 'object',
  fields: {
    scenario: {
      type: 'QuickliApiScenario',
      fields: {
        households: { type: 'QuickliApiHousehold[]', items: householdSchema },
        income: { type: 'QuickliApiIncome[]', items: incomeSchema },
        securities: { type: 'QuickliApiSecurity[]', items: securitySchema },
        home_loan_security_links: { type: 'QuickliApiHomeLoanSecurityLink[]', items: securityLinkSchema },
        self_employed_income: { type: 'QuickliApiSelfEmployedIncome[]', items: selfEmployedIncomeSchema },
        proposed_home_loans: { type: 'QuickliApiProposedHomeLoan[]', items: proposedHomeLoanSchema },
        existing_home_loans: { type: 'QuickliApiExistingHomeLoan[]', items: existingHomeLoanSchema },
        liabilities: { type: 'QuickliApiLiability[]', items: liabilitySchema },
        living_expenses: { type: 'QuickliApiLivingExpenses[]', items: livingExpensesSchema },
        additional_info: { type: 'object' },
      },
    },
  },
};

// ---- v2 LIXI schema -------------------------------------------------------

const lixiFreq: FieldSchema = { type: 'LIXIFrequency' };

const exportableOwnerSchema: FieldSchema = {
  type: 'ExportableOwner',
  fields: { percent: n, x_Party: s },
};

const percentOwnedSchema: FieldSchema = {
  type: 'ExportablePercentOwned',
  fields: {
    proportions: { type: "'Equal' | 'Not Specified' | 'Specified'" },
    owner: { type: 'ExportableOwner[]', items: exportableOwnerSchema },
  },
};

const lixiHouseholdSchema: FieldSchema = {
  type: 'ExportableHousehold',
  fields: {
    uniqueID: s,
    dependant: { type: '{ age }[]', items: { type: 'object', fields: { age: n } } },
    expenseDetails: {
      type: 'object',
      fields: {
        livingExpense: {
          type: 'ExportableHouseholdExpenseDetail[]',
          items: { type: 'ExportableHouseholdExpenseDetail', fields: { amount: n, category: { type: 'LIXILivingExpenseCategory' }, frequency: lixiFreq } },
        },
        OtherCommitment: {
          type: 'ExportableHouseholdExpenseDetail[]',
          items: { type: 'ExportableHouseholdExpenseDetail', fields: { amount: n, category: { type: 'LIXILivingExpenseCategory' }, frequency: lixiFreq } },
        },
        useNotionalRent: b,
      },
    },
  },
};

const lixiEmploymentIncomeSchema: FieldSchema = {
  type: 'ExportableEmploymentIncome',
  fields: {
    grossSalaryAmount: n, grossSalaryFrequency: lixiFreq,
    bonusAmount: n, bonusFrequency: lixiFreq,
    previousYearBonusAmount: n, previousYearBonusFrequency: lixiFreq,
    commissionAmount: n, commissionFrequency: lixiFreq,
    carAllowanceAmount: n, carAllowanceFrequency: lixiFreq,
    grossRegularOvertimeAmount: n, grossRegularOvertimeFrequency: lixiFreq,
    workAllowanceAmount: n, workAllowanceFrequency: lixiFreq,
    workersCompensationAmount: n, workersCompensationFrequency: lixiFreq,
    netSalaryAmount: n, netSalaryFrequency: lixiFreq,
    netBonusAmount: n, netBonusFrequency: lixiFreq,
    netCommissionAmount: n, netCommissionFrequency: lixiFreq,
    netCarAllowanceAmount: n, netCarAllowanceFrequency: lixiFreq,
    netRegularOvertimeAmount: n, netRegularOvertimeFrequency: lixiFreq,
    netWorkAllowanceAmount: n, netWorkAllowanceFrequency: lixiFreq,
    netWorkersCompensationAmount: n, netWorkersCompensationFrequency: lixiFreq,
  },
};

const lixiEmploymentSchema: FieldSchema = {
  type: 'ExportableEmployment',
  fields: {
    status: { type: "'Primary' | 'Secondary' | 'Previous'" },
    basis: { type: "'Casual' | 'Commission Only' | 'Contract' | 'Full Time' | 'Part Time'" },
    x_Employer: s,
    essentialServiceProvider: b, isCompanyVehicleProvided: b,
    income: lixiEmploymentIncomeSchema,
  },
};

const lixiSelfEmployedAddbackSchema: FieldSchema = {
  type: 'ExportableSelfEmployedAddback',
  fields: {
    allowances: n, amortisationOfGoodwill: n, bonus: n, carExpense: n,
    carryForwardLosses: n, depreciation: n, interest: n, lease: n,
    nonCashBenefits: n, nonRecurringIncome: n, nonRecurringExpenses: n,
    instantAssetWriteOff: n, salary: n, superannuationExcess: n,
    otherAddback: { type: '{ description, amount }[]' },
  },
};

const lixiSelfEmployedYearSchema: FieldSchema = {
  type: 'ExportableSelfEmployedYearDetail',
  fields: {
    profitBeforeTax: n, startDate: s,
    addback: lixiSelfEmployedAddbackSchema,
  },
};

const lixiPersonApplicantSchema: FieldSchema = {
  type: 'ExportablePersonApplicant',
  fields: {
    uniqueID: s, x_Household: s,
    maritalStatus: { type: "'De Facto' | 'Married' | 'Single'" },
    personName: { type: 'object', fields: { firstName: s, middleNames: s, surname: s } },
    contact: {
      type: 'object',
      fields: {
        postSettlementAddress: { type: 'object', fields: { x_ResidentialAddress: s, postcode: s } },
      },
    },
    employment: {
      type: 'ExportableEmployment[]',
      items: {
        type: 'object',
        fields: {
          pay: lixiEmploymentSchema,
          payg: lixiEmploymentSchema,
          foreignedEmployed: lixiEmploymentSchema,
          selfEmployed: {
            type: 'object',
            fields: {
              businessIncomeRecent: lixiSelfEmployedYearSchema,
              businessIncomePrevious: lixiSelfEmployedYearSchema,
              businessIncomePrior: lixiSelfEmployedYearSchema,
              x_Employer: s,
            },
          },
        },
      },
    },
  },
};

const lixiLiabilitySchema: FieldSchema = {
  type: 'ExportableLiability',
  fields: {
    uniqueID: s, annualInterestRate: n, creditLimit: n, outstandingBalance: n,
    type: { type: 'LIXILiabilityType' },
    loanPurpose: { type: 'object', fields: { primaryPurpose: { type: 'LIXILoanPrimaryPurpose' }, x_Employer: s } },
    remainingTerm: { type: 'object', fields: { duration: n, interestOnlyDuration: n, units: { type: "'Days' | 'Months' | 'Weeks' | 'Years'" } } },
    originalTerm: { type: 'object', fields: { interestTypeDuration: n, interestTypeUnits: { type: "'Days' | 'Months' | 'Weeks' | 'Years'" }, totalTermDuration: n, totalTermUnits: { type: "'Days' | 'Months' | 'Weeks' | 'Years'" } } },
    repayment: {
      type: 'ExportableLiabilityRepayment[]',
      items: {
        type: 'ExportableLiabilityRepayment',
        fields: { paymentType: { type: 'ExportablePaymentType' }, repaymentAmount: n, repaymentFrequency: lixiFreq, taxDeductible: b },
      },
    },
    percentOwned: percentOwnedSchema,
    security: { type: '{ x_Security }[]', items: { type: 'object', fields: { x_Security: s } } },
  },
};

const lixiLoanDetailsSchema: FieldSchema = {
  type: 'ExportableLoanDetails',
  fields: {
    uniqueID: s, amountRequested: n, amountToBeFinanced: n, lvr: n,
    loanType: { type: 'ExportableLoanType' },
    taxDeductible: b,
    borrowers: percentOwnedSchema,
    loanPurpose: { type: 'object', fields: { primaryPurpose: { type: 'LIXILoanPrimaryPurpose' } } },
    term: {
      type: 'ExportableLoanDetailsTerm',
      fields: {
        interestType: { type: "'Fixed' | 'Variable'" },
        interestTypeDuration: n, interestTypeUnits: { type: "'Days' | 'Months' | 'Weeks' | 'Years'" },
        paymentType: { type: 'ExportablePaymentType' },
        paymentTypeDuration: n, paymentTypeUnits: { type: "'Days' | 'Months' | 'Weeks' | 'Years'" },
        totalTermDuration: n, totalTermType: { type: "'Amortisation Term' | 'Total Term'" }, totalTermUnits: { type: "'Days' | 'Months' | 'Weeks' | 'Years'" },
      },
    },
  },
};

const lixiOtherIncomeSchema: FieldSchema = {
  type: 'ExportableOtherIncome',
  fields: {
    amount: n, description: s, frequency: lixiFreq,
    governmentBenefitsType: { type: 'ExportableGovernmentBenefitsType' },
    isTaxable: b, netAmount: n, netAmountFrequency: lixiFreq,
    type: { type: 'LIXIOtherIncomeType' },
    percentOwned: percentOwnedSchema,
  },
};

const lixiRealEstateSchema: FieldSchema = {
  type: 'ExportableRealEstateAsset',
  fields: {
    uniqueID: s,
    primaryPurpose: { type: "'Business' | 'Investment' | 'Owner Occupied'" },
    primarySecurity: b,
    primaryUsage: { type: "'Commercial' | 'Industrial' | 'Residential' | 'Rural'" },
    toBeSold: b, toBeUsedAsSecurity: b,
    transaction: { type: "'Owns' | 'Owns Existing Mortgage' | 'Purchasing' | 'Sold' | 'Transfer'" },
    commercial: { type: 'object', fields: { type: { type: 'ExportableCommercialType' } } },
    estimatedValue: { type: 'object', fields: { value: n } },
    propertyType: { type: 'object', fields: { propertyTypeName: { type: "'House' | 'Apartment' | 'Vacant Land'" } } },
    percentOwned: percentOwnedSchema,
    rentalIncome: {
      type: 'ExportableRentalIncome[]',
      items: { type: 'ExportableRentalIncome', fields: { frequency: lixiFreq, guaranteedRent: b, rentalAmount: n, uniqueID: s, xOwner: s, shortTermRentalAccommodation: b } },
    },
    futureRentalIncome: {
      type: 'ExportableFutureRentalIncome[]',
      items: { type: 'ExportableFutureRentalIncome', fields: { grossRentalAmount: n, grossRentalFrequency: lixiFreq, netRentalAmount: n, netRentalFrequency: lixiFreq, xOwner: s } },
    },
    propertyExpense: {
      type: 'ExportablePropertyExpense[]',
      items: { type: 'ExportablePropertyExpense', fields: { amount: n, category: { type: 'ExportablePropertyExpenseCategory' }, frequency: lixiFreq } },
    },
  },
};

const lixiRelatedCompanySchema: FieldSchema = {
  type: 'ExportableRelatedCompany',
  fields: {
    uniqueID: s,
    businessStructure: { type: "'Company' | 'Partnership' | 'Sole Trader' | 'Trust'" },
    companyName: s,
    shareHolder: { type: '{ percentOwned, x_Shareholder }[]', items: { type: 'object', fields: { percentOwned: n, x_Shareholder: s } } },
  },
};

export const lixiSchema: FieldSchema = {
  type: 'object',
  fields: {
    content: {
      type: 'object',
      fields: {
        application: {
          type: 'ExportableLIXIScenario',
          fields: {
            household: { type: 'ExportableHousehold[]', items: lixiHouseholdSchema },
            address: { type: 'ExportableAddress[]', items: { type: 'ExportableAddress', fields: { uniqueID: s, postCode: s, australianPostCode: s, fullAddress: s } } },
            liability: { type: 'ExportableLiability[]', items: lixiLiabilitySchema },
            loanDetails: { type: 'ExportableLoanDetails[]', items: lixiLoanDetailsSchema },
            otherIncome: { type: 'ExportableOtherIncome[]', items: lixiOtherIncomeSchema },
            personApplicant: { type: 'ExportablePersonApplicant[]', items: lixiPersonApplicantSchema },
            realEstateAsset: { type: 'ExportableRealEstateAsset[]', items: lixiRealEstateSchema },
            relatedCompany: { type: 'ExportableRelatedCompany[]', items: lixiRelatedCompanySchema },
          },
        },
      },
    },
  },
};
