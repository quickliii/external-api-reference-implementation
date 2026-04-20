import type { QuickliApiScenario, ExportableLIXIScenario } from '../types';
import { executeMath, sum } from '../utils';

const HOUSEHOLD_STATUS_MAP = {
  defacto: 'De Facto',
  single: 'Single',
  married: 'Married',
} as const;

const OTHER_INCOME_KEYS = [
  'pension',
  'annuities',
  'investment_income',
  'interest_income',
  'social_security',
  'child_maintenance',
  'family_tax_a',
  'family_tax_b',
  'parenting_payments',
  'carers_income',
  'other_taxed',
  'other_tax_free',
] as const;

const OTHER_INCOME_MAP = {
  pension: 'Private Pension',
  child_maintenance: 'Child Maintenance',
  annuities: 'Annuities',
  investment_income: 'Managed Investment',
  interest_income: 'Interest Income',
  social_security: 'Government Benefits',
  family_tax_a: 'Government Benefits',
  family_tax_b: 'Government Benefits',
  parenting_payments: 'Government Benefits',
  carers_income: 'Government Benefits',
  other_taxed: 'Other Income',
  other_tax_free: 'Other Income',
} as const;

function getLIXIIncome(quickliApiScenario: QuickliApiScenario): {
  personApplicant: ExportableLIXIScenario['personApplicant'];
  otherIncome: ExportableLIXIScenario['otherIncome'];
  relatedCompany: ExportableLIXIScenario['relatedCompany'];
} {
  const personApplicant: ExportableLIXIScenario['personApplicant'] = [];
  const otherIncome: ExportableLIXIScenario['otherIncome'] = [];
  const relatedCompany: ExportableLIXIScenario['relatedCompany'] = [];

  quickliApiScenario.income.forEach((app, appIndex) => {
    const applicantHouseholdId =
      quickliApiScenario.households[app.which_household].id;
    const household = quickliApiScenario.households[app.which_household];

    // PAYG incomes
    const paygEmploymentObject: ExportableLIXIScenario['personApplicant'][number]['employment'][number]['pay'] =
      {
        status: 'Primary',
        basis: 'Full Time',
        x_Employer: `${app.id}-payg`,
        essentialServiceProvider: false,
        isCompanyVehicleProvided: !!app.company_car,
        income: {
          bonusAmount:
            (app.use_simple_bonus ?? app.bonus_details?.use_simple_bonus)
              ? executeMath(
                  app.use_simple_bonus !== undefined
                    ? (app.recent_year_bonus ?? app.bonus_details?.bonus_income)
                    : app.bonus_details?.bonus_income,
                )
              : executeMath(
                  app.use_simple_bonus !== undefined
                    ? (app.recent_year_bonus ??
                        app.bonus_details?.recent_year_income)
                    : app.bonus_details?.recent_year_income,
                ),
          bonusFrequency: 'Yearly',
          previousYearBonusAmount:
            (app.use_simple_bonus ?? app.bonus_details?.use_simple_bonus)
              ? null
              : executeMath(
                  app.use_simple_bonus !== undefined
                    ? (app.previous_year_bonus ??
                        app.bonus_details?.previous_year_income)
                    : app.bonus_details?.previous_year_income,
                ),
          previousYearBonusFrequency: 'Yearly',
          carAllowanceAmount: executeMath(app.car_allowance),
          carAllowanceFrequency: 'Yearly',
          commissionAmount: executeMath(app.commission),
          commissionFrequency: 'Yearly',
          grossRegularOvertimeAmount: executeMath(app.overtime),
          grossRegularOvertimeFrequency: 'Yearly',
          grossSalaryAmount: executeMath(app.payg),
          grossSalaryFrequency: 'Yearly',
          netBonusAmount: null,
          netBonusFrequency: 'Yearly',
          netCarAllowanceAmount: null,
          netCarAllowanceFrequency: 'Yearly',
          netCommissionAmount: null,
          netCommissionFrequency: 'Yearly',
          netRegularOvertimeAmount: null,
          netRegularOvertimeFrequency: 'Yearly',
          netSalaryAmount: null,
          netSalaryFrequency: 'Yearly',
          netWorkAllowanceAmount: null,
          netWorkAllowanceFrequency: 'Yearly',
          netWorkersCompensationAmount: null,
          netWorkersCompensationFrequency: 'Yearly',
          workAllowanceAmount: null,
          workAllowanceFrequency: 'Yearly',
          workersCompensationAmount: null,
          workersCompensationFrequency: 'Yearly',
        },
      };

    const secondJob: ExportableLIXIScenario['personApplicant'][number]['employment'][number]['pay'] =
      {
        status: 'Secondary',
        basis: 'Part Time',
        x_Employer: `${app.id}-secondjob`,
        essentialServiceProvider: !!app.essential_worker_overtime,
        isCompanyVehicleProvided: !!app.company_car,
        income: {
          bonusAmount: null,
          bonusFrequency: 'Yearly',
          previousYearBonusAmount: null,
          previousYearBonusFrequency: 'Yearly',
          carAllowanceAmount: null,
          carAllowanceFrequency: null,
          commissionAmount: null,
          commissionFrequency: 'Yearly',
          grossRegularOvertimeAmount: executeMath(
            app.essential_worker_overtime,
          ),
          grossRegularOvertimeFrequency: 'Yearly',
          grossSalaryAmount: executeMath(app.second_job),
          grossSalaryFrequency: 'Yearly',
          netBonusAmount: null,
          netBonusFrequency: 'Yearly',
          netCarAllowanceAmount: null,
          netCarAllowanceFrequency: 'Yearly',
          netCommissionAmount: null,
          netCommissionFrequency: 'Yearly',
          netRegularOvertimeAmount: null,
          netRegularOvertimeFrequency: 'Yearly',
          netSalaryAmount: null,
          netSalaryFrequency: 'Yearly',
          netWorkAllowanceAmount: null,
          netWorkAllowanceFrequency: 'Yearly',
          netWorkersCompensationAmount: null,
          netWorkersCompensationFrequency: 'Yearly',
          workAllowanceAmount: null,
          workAllowanceFrequency: 'Yearly',
          workersCompensationAmount: null,
          workersCompensationFrequency: 'Yearly',
        },
      };
    const anySecondJob =
      executeMath(app.essential_worker_overtime) ||
      executeMath(app.casual) ||
      executeMath(app.second_job);

    const casualIncomeJob: ExportableLIXIScenario['personApplicant'][number]['employment'][number]['pay'] =
      {
        status: 'Secondary',
        basis: 'Casual',
        x_Employer: `${app.id}-casual`,
        essentialServiceProvider: !!app.essential_worker_overtime,
        isCompanyVehicleProvided: !!app.company_car,
        income: {
          bonusAmount: null,
          bonusFrequency: 'Yearly',
          previousYearBonusAmount: null,
          previousYearBonusFrequency: 'Yearly',
          carAllowanceAmount: null,
          carAllowanceFrequency: null,
          commissionAmount: null,
          commissionFrequency: 'Yearly',
          grossRegularOvertimeAmount: null,
          grossRegularOvertimeFrequency: 'Yearly',
          grossSalaryAmount: executeMath(app.casual),
          grossSalaryFrequency: 'Yearly',
          netBonusAmount: null,
          netBonusFrequency: 'Yearly',
          netCarAllowanceAmount: null,
          netCarAllowanceFrequency: 'Yearly',
          netCommissionAmount: null,
          netCommissionFrequency: 'Yearly',
          netRegularOvertimeAmount: null,
          netRegularOvertimeFrequency: 'Yearly',
          netSalaryAmount: null,
          netSalaryFrequency: 'Yearly',
          netWorkAllowanceAmount: null,
          netWorkAllowanceFrequency: 'Yearly',
          netWorkersCompensationAmount: null,
          netWorkersCompensationFrequency: 'Yearly',
          workAllowanceAmount: null,
          workAllowanceFrequency: 'Yearly',
          workersCompensationAmount: null,
          workersCompensationFrequency: 'Yearly',
        },
      };

    const anyCasualIncome = executeMath(app.casual);

    const foreignIncomeJob: ExportableLIXIScenario['personApplicant'][number]['employment'][number]['pay'] =
      {
        status: 'Secondary',
        basis: 'Part Time',
        x_Employer: `${app.id}-foreign`,
        essentialServiceProvider: false,
        isCompanyVehicleProvided: !!app.company_car,
        income: {
          bonusAmount: null,
          bonusFrequency: 'Yearly',
          previousYearBonusAmount: null,
          previousYearBonusFrequency: 'Yearly',
          carAllowanceAmount: null,
          carAllowanceFrequency: null,
          commissionAmount: null,
          commissionFrequency: 'Yearly',
          grossRegularOvertimeAmount: null,
          grossRegularOvertimeFrequency: 'Yearly',
          grossSalaryAmount: executeMath(app.foreign_income),
          grossSalaryFrequency: 'Yearly',
          netBonusAmount: null,
          netBonusFrequency: 'Yearly',
          netCarAllowanceAmount: null,
          netCarAllowanceFrequency: 'Yearly',
          netCommissionAmount: null,
          netCommissionFrequency: 'Yearly',
          netRegularOvertimeAmount: null,
          netRegularOvertimeFrequency: 'Yearly',
          netSalaryAmount: executeMath(app.net_foreign_income),
          netSalaryFrequency: 'Yearly',
          netWorkAllowanceAmount: null,
          netWorkAllowanceFrequency: 'Yearly',
          netWorkersCompensationAmount: null,
          netWorkersCompensationFrequency: 'Yearly',
          workAllowanceAmount: null,
          workAllowanceFrequency: 'Yearly',
          workersCompensationAmount: null,
          workersCompensationFrequency: 'Yearly',
        },
      };
    const anyForeignIncome =
      executeMath(app.foreign_income) || executeMath(app.net_foreign_income);

    // Temporarily....
    const taxFreeIncome = new Set([
      'social_security',
      'child_maintenance',
      'family_tax_a',
      'family_tax_b',
      'parenting_payments',
      'carers_income',
      'other_tax_free',
    ]);

    // Other incomes
    OTHER_INCOME_KEYS.forEach((key) => {
      const amount = executeMath(app[key]);
      if (amount) {
        otherIncome.push({
          amount,
          frequency: 'Yearly',
          description: key.split('_').join(' '),
          governmentBenefitsType:
            key === 'family_tax_a'
              ? 'Family Tax Benefit A'
              : key === 'family_tax_b'
                ? 'Family Tax Benefit B'
                : key === 'parenting_payments'
                  ? 'Parenting Payment'
                  : key === 'carers_income'
                    ? 'Carer Payment'
                    : null,
          isTaxable: !taxFreeIncome.has(key),
          netAmount: null,
          netAmountFrequency: null,
          type: OTHER_INCOME_MAP[key],
          percentOwned: {
            proportions: 'Specified',
            owner: [
              {
                percent: 100,
                x_Party: app.id,
              },
            ],
          },
        });
      }
    });

    const employment: ExportableLIXIScenario['personApplicant'][number]['employment'] =
      [
        {
          foreignedEmployed: null,
          payg: paygEmploymentObject,
          selfEmployed: null,
          pay: null,
        },
      ];

    if (anySecondJob) {
      employment.push({
        foreignedEmployed: null,
        payg: secondJob,
        selfEmployed: null,
        pay: null,
      });
    }

    if (anyCasualIncome) {
      employment.push({
        foreignedEmployed: null,
        payg: casualIncomeJob,
        selfEmployed: null,
        pay: null,
      });
    }

    if (anyForeignIncome) {
      employment.push({
        foreignedEmployed: foreignIncomeJob,
        payg: null,
        selfEmployed: null,
        pay: null,
      });
    }

    // SEMP
    // Lets do this by only searching for specifically this applicant...
    quickliApiScenario.self_employed_income.forEach((selfEmployed) => {
      const ownershipRatio =
        executeMath(selfEmployed.applicant_ownership[appIndex]) / 100;
      if (ownershipRatio) {
        employment.push({
          foreignedEmployed: null,
          payg: null,
          selfEmployed: {
            businessIncomeRecent: getLIXIYearDetails(
              ownershipRatio,
              selfEmployed.most_recent_year_details,
            ),
            businessIncomePrior: getLIXIYearDetails(
              ownershipRatio,
              selfEmployed.previous_year_details,
            ),
            businessIncomePrevious: null,
            x_Employer: selfEmployed.id,
          },
          pay: null,
        });
      }
      if (
        !relatedCompany.some((company) => company.uniqueID === selfEmployed.id)
      ) {
        const businessStructureMap = {
          sole_trader: 'Sole Trader',
          trust: 'Trust',
          company: 'Company',
          partnership: 'Partnership',
        } as const;
        relatedCompany.push({
          uniqueID: selfEmployed.id,
          companyName: selfEmployed.name || null,
          businessStructure: businessStructureMap[selfEmployed.entity_type],
          shareHolder: selfEmployed.applicant_ownership
            .map((ownership, i) => ({
              percentOwned: executeMath(ownership),
              x_Shareholder: quickliApiScenario.income[i].id,
            }))
            .filter((shareholder) => !!shareholder.percentOwned),
        });
      }
    });

    const personName = app.name?.split(' ');
    const firstName =
      personName && personName.length === 1 ? null : personName?.[0] || null;
    const surname = personName?.[personName.length - 1] || null;

    personApplicant.push({
      uniqueID: app.id,
      x_Household: applicantHouseholdId,
      personName: {
        firstName,
        middleNames: null,
        surname,
      },
      contact: {
        postSettlementAddress: {
          x_ResidentialAddress: household.id,
          postcode: household.postcode?.toString() || null,
        },
      },
      employment,
      maritalStatus: HOUSEHOLD_STATUS_MAP[household.status],
    });
  });

  return { personApplicant, otherIncome, relatedCompany };
}

function getLIXIYearDetails(
  ownershipRatio: number,
  yearDetails: QuickliApiScenario['self_employed_income'][number]['most_recent_year_details'],
): NonNullable<
  ExportableLIXIScenario['personApplicant'][number]['employment'][number]['selfEmployed']
>['businessIncomeRecent'] {
  const sumSalary = sum(
    yearDetails.personal_wages_before_tax.map((wage) => executeMath(wage)),
  );
  const wagesAreActuallyEmpty = yearDetails.personal_wages_before_tax.every(
    (w) => w === '' || w === null || w === undefined,
  );

  return {
    profitBeforeTax:
      executeMath(yearDetails.net_profit_before_tax) * ownershipRatio,
    startDate: yearDetails.year_ended?.toString() || null,
    addback: {
      allowances: null,
      amortisationOfGoodwill: null,
      bonus: null,
      carExpense: null,
      carryForwardLosses: null,
      depreciation: executeMath(yearDetails.depreciation) * ownershipRatio,
      interest: executeMath(yearDetails.interest) * ownershipRatio,
      lease: executeMath(yearDetails.lease_hp) * ownershipRatio,
      nonCashBenefits: null,
      nonRecurringIncome:
        executeMath(yearDetails.non_recurring_income) * ownershipRatio,
      instantAssetWriteOff:
        executeMath(yearDetails.instant_asset_write_off) * ownershipRatio,
      nonRecurringExpenses:
        executeMath(yearDetails.non_recurring_expenses) * ownershipRatio,
      salary: wagesAreActuallyEmpty ? null : sumSalary * ownershipRatio,
      superannuationExcess:
        executeMath(yearDetails.super_above_compulsory) * ownershipRatio,
      otherAddback: [
        {
          description: 'Other',
          amount: executeMath(yearDetails.other) * ownershipRatio,
        },
      ],
    },
  };
}

export default getLIXIIncome;
