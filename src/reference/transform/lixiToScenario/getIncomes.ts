import type { LIXIScenarioContent, QuickliApiScenario } from '../types';

import { makeId, sum, assert, LIXIFrequencyToMonthly } from '../utils';

type LIXIOtherIncomeTypes = NonNullable<
  LIXIScenarioContent['otherIncome'][number]['type']
>;

type LIXIEmploymentIncomeType = NonNullable<
  LIXIScenarioContent['personApplicant'][number]['employment']
>;

type LIXILiabilityTypes = NonNullable<
  LIXIScenarioContent['liability'][number]['type']
>;

type LIXISelfEmployedDetails = NonNullable<
  LIXIEmploymentIncomeType[number]['selfEmployed']
>['businessIncomeRecent'];

type QuickliApiSEMPYearDetail =
  QuickliApiScenario['self_employed_income'][number]['most_recent_year_details'];
type QuickliApiBusinessLiabilityTypes =
  QuickliApiScenario['self_employed_income'][number]['business_liabilities'][number]['facility_type'];

const LIXI_TO_QUICKLI_API_INCOME_MAP: Record<
  LIXIOtherIncomeTypes,
  keyof QuickliApiScenario['income'][number] | null
> = {
  Annuities: 'annuities',
  'Child Maintenance': 'child_maintenance',
  Dividends: 'investment_income',
  'Foreign Sourced': null,
  'Government Benefits': 'social_security', // Lets do this for now
  'Interest Income': 'interest_income',
  'Managed Investment': 'investment_income',
  'Other Income': 'other_taxed',
  'Private Pension': 'pension',
  'Rental Income': null, // Should be done in other places
  'Salary Sacrifice Contribution': null,
  'Super Concessional Contribution': 'annuities',
  'Super Excess Concessional Contribution': 'annuities',
  'Super Non Concessional Contribution': 'annuities',
  Superannuation: 'annuities',
  'Workers Compensation': 'other_tax_free',
} as const;

const SEMP_FIELDS_TO_MERGE = [
  'net_profit_before_tax',
  'non_recurring_income',
  'non_recurring_expenses',
  'interest',
  'depreciation',
  'super_above_compulsory',
  'lease_hp',
  'other',
  'personal_wages_before_tax',
] satisfies (keyof QuickliApiSEMPYearDetail)[];

const BUSINESS_LIABILITY_TYPES_MAP: Partial<
  Record<LIXILiabilityTypes, QuickliApiBusinessLiabilityTypes>
> = {
  Overdraft: 'overdraft',
  Lease: 'lease',
  'Term Loan': 'term_loan',
  'Credit Card': 'credit_card',
  'Amortising Home Loan': 'housing_loan',
  'Commercial Bill': 'commercial_bill',
  'Line of Credit': 'line_of_credit',
  Other: 'other',
};

function LIXIFrequencyToAnnual(
  ...params: Parameters<typeof LIXIFrequencyToMonthly>
): number {
  return LIXIFrequencyToMonthly(...params) * 12;
}

function mergeValues(values: (string | number | null | undefined)[]): string {
  const filteredValues = values
    .filter((v) => !!v)
    .map((v) => {
      assert(typeof v === 'string' || typeof v === 'number');
      return typeof v === 'number' ? v.toString() : v;
    });
  return filteredValues.join('+');
}

function mergeYearDetails(
  yearDetails: QuickliApiSEMPYearDetail[],
): QuickliApiSEMPYearDetail {
  if (yearDetails.length === 0) throw new Error('mergeYearDetails: no year details provided');
  if (yearDetails.length === 1) return yearDetails[0];

  const mergedYearDetails = {} as QuickliApiSEMPYearDetail;

  SEMP_FIELDS_TO_MERGE.forEach((field) => {
    if (field === 'personal_wages_before_tax') {
      const fieldValues = yearDetails.map((yd) => yd.personal_wages_before_tax);
      const newWages =
        [] as QuickliApiSEMPYearDetail['personal_wages_before_tax'];
      const wagesSample = fieldValues[0];

      wagesSample.forEach((_, appIndex) => {
        const applicantWagesAcrossEntities = fieldValues.map(
          (wagesInYear) => wagesInYear[appIndex],
        );
        newWages.push(mergeValues(applicantWagesAcrossEntities));
      });
      mergedYearDetails.personal_wages_before_tax = newWages;
    } else {
      const fieldValues = yearDetails.map((yd) => yd[field]);

      // If all values are not available, skip the field entirely
      if (fieldValues.every((v) => !v)) return;
      mergedYearDetails[field] = mergeValues(fieldValues);
    }
  });

  return mergedYearDetails;
}

/**
 * The point of this function is to basically
 * merge entities with the same ID, which can happen
 * when two applicants own the same company.
 */
function validateSEMPEntities(
  selfEmployedIncomes: QuickliApiScenario['self_employed_income'],
): QuickliApiScenario['self_employed_income'] {
  if (!selfEmployedIncomes.length || selfEmployedIncomes.length === 1)
    return selfEmployedIncomes;

  const sempEntitiesById = selfEmployedIncomes.reduce(
    (acc, sempEntity) => {
      const sempId = sempEntity.id;
      const accumulatedSEMP = acc[sempId] || [];
      accumulatedSEMP.push(sempEntity);

      return { ...acc, [sempId]: accumulatedSEMP };
    },
    {} as { [key: string]: QuickliApiScenario['self_employed_income'] },
  );

  const validatedSEMPEntities: QuickliApiScenario['self_employed_income'] = [];

  Object.keys(sempEntitiesById).forEach((sempId) => {
    const groupedSEMP = sempEntitiesById[sempId];

    if (!groupedSEMP.length) {
      return;
    }
    if (groupedSEMP.length === 1) {
      validatedSEMPEntities.push(groupedSEMP[0]);
      return;
    }

    const newMostRecentYearDetails = mergeYearDetails(
      groupedSEMP.map((semp) => semp.most_recent_year_details),
    );
    const newPreviousYearDetails = mergeYearDetails(
      groupedSEMP.map((semp) => semp.previous_year_details),
    );
    const primarySEMP = groupedSEMP[0];

    validatedSEMPEntities.push({
      ...primarySEMP,
      most_recent_year_details: newMostRecentYearDetails,
      previous_year_details: newPreviousYearDetails,
    });
  });

  return validatedSEMPEntities;
}

function getIncomes(apiScenario: LIXIScenarioContent): {
  income: QuickliApiScenario['income'];
  self_employed_income: QuickliApiScenario['self_employed_income'];
} {
  const newIncomes: QuickliApiScenario['income'] = [];
  const newSEMPIncome: QuickliApiScenario['self_employed_income'] = [];

  // Personal incomes TODOs:
  // 1. Employment income (pay / PAYG)
  // 2. Foreign income
  // 2. Self-employed income
  // 3. Other income

  const apiApplicants = apiScenario.personApplicant;
  const householdIds = apiScenario.household.map((h) => h.uniqueID);

  const applicantIndexMap = apiScenario.personApplicant.reduce(
    (mapObject, app, index) => ({ ...mapObject, [app.uniqueID]: index }),
    {},
  ) as { [key: string]: number };

  const allHECSLiabilities = apiScenario.liability.filter(
    (l) => l.type === 'HECS-HELP',
  );

  apiApplicants.forEach((apiApplicant) => {
    const appId = apiApplicant.uniqueID;
    const appHouseholdIndex = householdIds.indexOf(apiApplicant.x_Household);

    const applicantNameDetails = apiScenario.personApplicant.find(
      (app) => app.uniqueID === appId,
    )?.personName;

    let applicantName = '';
    if (applicantNameDetails) {
      applicantName = [
        applicantNameDetails.firstName,
        applicantNameDetails.middleNames,
        applicantNameDetails.surname,
      ]
        .filter(Boolean)
        .join(' ');
    }

    assert(appId && appHouseholdIndex !== -1);
    const appIncomeObject: QuickliApiScenario['income'][number] = {
      id: appId,
      name: applicantName,
      which_household: appHouseholdIndex,
    };

    const employmentItems = apiApplicant.employment;

    // Employment income
    if (employmentItems) {
      const employmentIncomes = {
        payg: [] as number[],
        second_job: [] as number[],
        casual: [] as number[],
        recent_year_bonus: [] as number[],
        previous_year_bonus: [] as number[],
        overtime: [] as number[],
        allowance: [] as number[],
        commission: [] as number[],
        essential_overtime: [] as number[],
        foreign_income: [] as number[],
        net_foreign_income: [] as number[],
      };

      let firstJob = true;
      employmentItems.forEach((job) => {
        if (
          !job.selfEmployed &&
          !job.foreignedEmployed &&
          (!!job.pay || !!job.payg)
        ) {
          const jobDetails = job.pay ? job.pay : job.payg;
          assert(jobDetails);

          if (jobDetails.status !== 'Previous') {
            const annualSalary = LIXIFrequencyToAnnual(
              jobDetails.income?.grossSalaryAmount || 0,
              jobDetails.income?.grossSalaryFrequency || 'Yearly',
            );
            const annualBonus = LIXIFrequencyToAnnual(
              jobDetails.income?.bonusAmount || 0,
              jobDetails.income?.bonusFrequency || 'Yearly',
            );
            const annualPreviousYearBonus = LIXIFrequencyToAnnual(
              jobDetails.income?.previousYearBonusAmount || 0,
              jobDetails.income?.previousYearBonusFrequency || 'Yearly',
            );
            const annualCommission = LIXIFrequencyToAnnual(
              jobDetails.income?.commissionAmount || 0,
              jobDetails.income?.commissionFrequency || 'Yearly',
            );
            const annualOvertime = LIXIFrequencyToAnnual(
              jobDetails.income?.grossRegularOvertimeAmount || 0,
              jobDetails.income?.grossRegularOvertimeFrequency || 'Yearly',
            );
            const annualCarAllowance = LIXIFrequencyToAnnual(
              jobDetails.income?.carAllowanceAmount || 0,
              jobDetails.income?.carAllowanceFrequency || 'Yearly',
            );
            const annualWorkAllowance = LIXIFrequencyToAnnual(
              jobDetails.income?.workAllowanceAmount || 0,
              jobDetails.income?.workAllowanceFrequency || 'Yearly',
            );

            if (
              jobDetails.basis === 'Full Time' ||
              jobDetails.status === 'Primary'
            ) {
              if (firstJob) {
                employmentIncomes.payg.push(annualSalary);
                firstJob = false;
              } else {
                employmentIncomes.second_job.push(annualSalary);
              }
            } else if (
              jobDetails.basis === 'Part Time' ||
              jobDetails.basis === 'Contract' ||
              jobDetails.basis === 'Temporary'
            ) {
              employmentIncomes.second_job.push(annualSalary);
            } else if (
              jobDetails.basis === 'Casual' ||
              jobDetails.basis === 'Seasonal' ||
              jobDetails.basis === 'Commission Only'
            ) {
              employmentIncomes.casual.push(annualSalary);
            } else {
              employmentIncomes.second_job.push(annualSalary);
            }

            if (
              jobDetails.essentialServiceProvider === true ||
              jobDetails.essentialServiceProvider === 'Yes'
            ) {
              employmentIncomes.essential_overtime.push(annualOvertime);
            } else employmentIncomes.overtime.push(annualOvertime);

            employmentIncomes.recent_year_bonus.push(annualBonus);
            employmentIncomes.previous_year_bonus.push(annualPreviousYearBonus);
            employmentIncomes.commission.push(annualCommission);
            employmentIncomes.allowance.push(annualCarAllowance + annualWorkAllowance);
          }
        } else if (job.selfEmployed) {
          const mostRecentYear =
            job.selfEmployed.businessIncomeRecent ||
            job.selfEmployed.businessIncomePrior;

          const previousYear = job.selfEmployed.businessIncomeRecent
            ? job.selfEmployed.businessIncomePrior
            : job.selfEmployed.businessIncomePrevious;

          const ownership: number[] = Array(
            Object.keys(applicantIndexMap).length,
          ).fill(0);

          const entityData = apiScenario.relatedCompany?.find(
            (selfEmployedEntity) =>
              selfEmployedEntity.uniqueID === job.selfEmployed?.x_Employer,
          );
          const shareHolder = entityData?.shareHolder;

          if (shareHolder) {
            shareHolder.forEach((owner) => {
              const percentOwned = owner?.percentOwned;
              const ownerId = owner?.x_Shareholder;
              if (
                percentOwned &&
                ownerId &&
                applicantIndexMap[ownerId] !== undefined
              ) {
                const appIndex = applicantIndexMap[ownerId];
                ownership[appIndex] = percentOwned;
              }
            });
          } else {
            const appIndex = applicantIndexMap[appId];
            ownership[appIndex] = 100;
          }

          const entityTypeMap = {
            Company: 'company',
            Partnership: 'partnership',
            Trust: 'trust',
            'Sole Trader': 'sole_trader',
          } as const;

          const newSEMP: QuickliApiScenario['self_employed_income'][number] = {
            id: job.selfEmployed.x_Employer || makeId(6),
            name: entityData?.companyName || '',
            applicant_ownership: ownership,

            most_recent_year_details: getSelfEmployedDetails(
              mostRecentYear,
              Object.keys(applicantIndexMap).length,
              applicantIndexMap[appId],
            ),
            previous_year_details: getSelfEmployedDetails(
              previousYear,
              Object.keys(applicantIndexMap).length,
              applicantIndexMap[appId],
            ),
            business_liabilities: apiScenario.liability
              .filter(
                (bl) =>
                  bl.loanPurpose?.primaryPurpose === 'Business' &&
                  bl.loanPurpose?.x_Employer === job.selfEmployed?.x_Employer &&
                  BUSINESS_LIABILITY_TYPES_MAP[bl.type as LIXILiabilityTypes],
              )
              .map((bl) => ({
                id: bl.uniqueID || makeId(6),
                facility_type:
                  BUSINESS_LIABILITY_TYPES_MAP[bl.type as LIXILiabilityTypes]!,
                limit: Math.max(
                  bl.creditLimit || 0,
                  bl.outstandingBalance || 0,
                ),
                term: LIXIFrequencyToAnnual(
                  bl.remainingTerm?.duration || 0,
                  bl.remainingTerm?.units || 'Years',
                ),
                interest_only_period: LIXIFrequencyToAnnual(
                  bl.remainingTerm?.interestOnlyDuration || 0,
                  bl.remainingTerm?.units || 'Years',
                ),
                actual_rate: bl.annualInterestRate,
                monthly_repayment: bl.repayment?.[0]?.repaymentAmount || null,
              })),
            calculation_method: 'lender_default',
            entity_type: entityData?.businessStructure
              ? entityTypeMap[entityData.businessStructure]
              : 'sole_trader',
          };

          newSEMPIncome.push(newSEMP);
        } else if (
          job.foreignedEmployed &&
          job.foreignedEmployed.status !== 'Previous'
        ) {
          const annualForeignSalary = LIXIFrequencyToAnnual(
            job.foreignedEmployed.income?.grossSalaryAmount || 0,
            job.foreignedEmployed.income?.grossSalaryFrequency || 'Yearly',
          );
          const annualNetForeignSalary = LIXIFrequencyToAnnual(
            job.foreignedEmployed.income?.netSalaryAmount || 0,
            job.foreignedEmployed.income?.netSalaryFrequency || 'Yearly',
          );
          employmentIncomes.foreign_income.push(annualForeignSalary);
          employmentIncomes.net_foreign_income.push(annualNetForeignSalary);
        }
      });

      appIncomeObject.payg = employmentIncomes.payg.join('+');
      appIncomeObject.second_job = employmentIncomes.second_job.join('+');
      appIncomeObject.casual = employmentIncomes.casual.join('+');
      appIncomeObject.recent_year_bonus =
        employmentIncomes.recent_year_bonus.join('+');
      appIncomeObject.previous_year_bonus =
        employmentIncomes.previous_year_bonus.join('+');
      appIncomeObject.overtime = employmentIncomes.overtime.join('+');
      appIncomeObject.car_allowance = employmentIncomes.allowance.join('+');
      appIncomeObject.commission = employmentIncomes.commission.join('+');
      appIncomeObject.essential_worker_overtime =
        employmentIncomes.essential_overtime.join('+');
      appIncomeObject.foreign_income = employmentIncomes.foreign_income.join('+');
      appIncomeObject.net_foreign_income =
        employmentIncomes.net_foreign_income.join('+');
    }

    // Skip foreign income for now

    // Other incomes
    const otherIncomes = apiScenario.otherIncome;

    if (otherIncomes) {
      const otherIncomeAccumulator = {
        annuities: [] as number[],
        child_maintenance: [] as number[],
        investment_income: [] as number[],
        interest_income: [] as number[],
        other_taxed: [] as number[],
        pension: [] as number[],
        social_security: [] as number[],
        other_tax_free: [] as number[],
        family_tax_a: [] as number[],
        family_tax_b: [] as number[],
        parenting_payments: [] as number[],
        carers_income: [] as number[],
      };

      otherIncomes.forEach((income) => {
        const amount = LIXIFrequencyToAnnual(
          income.amount || 0,
          income.frequency || 'Yearly',
        );

        const incomeType = income.type as LIXIOtherIncomeTypes;
        let newType = LIXI_TO_QUICKLI_API_INCOME_MAP[incomeType] as
          | keyof typeof otherIncomeAccumulator
          | null;

        if (newType === 'social_security') {
          if (income.governmentBenefitsType === 'Family Tax Benefit A') {
            newType = 'family_tax_a';
          } else if (income.governmentBenefitsType === 'Family Tax Benefit B') {
            newType = 'family_tax_b';
          } else if (
            income.governmentBenefitsType === 'Carer Allowance' ||
            income.governmentBenefitsType === 'Carer Payment'
          ) {
            newType = 'carers_income';
          } else if (income.governmentBenefitsType === 'Parenting Payment') {
            newType = 'parenting_payments';
          }
        }

        const { percentOwned } = income;
        if (percentOwned && newType !== null) {
          const applicantOwnData = percentOwned.owner?.find(
            (o) => o.x_Party === appId,
          );
          const ownershipPercent = (applicantOwnData?.percent || 0) / 100;

          if (ownershipPercent !== 0) {
            const newAmount = amount * ownershipPercent;
            const isNonTaxable = !income.isTaxable || income.isTaxable === 'No';
            if (newType === 'other_taxed' && isNonTaxable) {
              otherIncomeAccumulator.other_tax_free.push(newAmount);
            } else otherIncomeAccumulator[newType].push(newAmount);
          }
        }
      });

      appIncomeObject.annuities = otherIncomeAccumulator.annuities.join('+');
      appIncomeObject.child_maintenance =
        otherIncomeAccumulator.child_maintenance.join('+');
      appIncomeObject.investment_income =
        otherIncomeAccumulator.investment_income.join('+');
      appIncomeObject.interest_income = otherIncomeAccumulator.interest_income.join('+');
      appIncomeObject.other_taxed = otherIncomeAccumulator.other_taxed.join('+');
      appIncomeObject.pension = otherIncomeAccumulator.pension.join('+');
      appIncomeObject.social_security = otherIncomeAccumulator.social_security.join('+');
      appIncomeObject.other_tax_free = otherIncomeAccumulator.other_tax_free.join('+');
      appIncomeObject.family_tax_a = otherIncomeAccumulator.family_tax_a.join('+');
      appIncomeObject.family_tax_b = otherIncomeAccumulator.family_tax_b.join('+');
      appIncomeObject.parenting_payments =
        otherIncomeAccumulator.parenting_payments.join('+');
      appIncomeObject.carers_income = otherIncomeAccumulator.carers_income.join('+');
    }

    // Handle HECS here
    allHECSLiabilities.forEach((hecs) => {
      let hecsBalance: string | number = hecs.outstandingBalance || 0;
      const { percentOwned } = hecs;
      const allOwners = percentOwned?.owner;

      if (percentOwned && allOwners) {
        const applicantOwnData = allOwners.find((o) => o.x_Party === appId);
        const totalOwnershipAmount = sum(allOwners.map((o) => o.percent || 0));
        if (
          applicantOwnData &&
          !!applicantOwnData.percent &&
          !!totalOwnershipAmount
        ) {
          hecsBalance *= totalOwnershipAmount / 100;
          appIncomeObject.HECS = true;
          appIncomeObject.HECS_balance = hecsBalance;
          appIncomeObject.HECS_repayment =
            sum(hecs.repayment?.map((r) => r.repaymentAmount || 0) ?? []) || null;

          if (appIncomeObject.HECS_repayment) {
            appIncomeObject.override_HECS_repayment = true;
          }
        }
      }
    });

    const isCompanyVehicleProvided = employmentItems?.some(
      (job) =>
        job.pay?.isCompanyVehicleProvided || job.payg?.isCompanyVehicleProvided,
    );
    if (isCompanyVehicleProvided) {
      appIncomeObject.company_car = true;
    }

    newIncomes.push(appIncomeObject);
  });

  return {
    income: newIncomes,
    self_employed_income: validateSEMPEntities(newSEMPIncome),
  };
}

function getSelfEmployedDetails(
  apiSelfEmployedDetails: LIXISelfEmployedDetails,
  numberOfApps: number,
  applicantIndex: number,
): QuickliApiSEMPYearDetail {
  const personalWagesBeforeTax = Array(numberOfApps).fill('') as (
    | number
    | string
  )[];
  let newSEMPDetails = {
    net_profit_before_tax: 0,
    personal_wages_before_tax: personalWagesBeforeTax,
  } as QuickliApiSEMPYearDetail;

  if (!apiSelfEmployedDetails) return newSEMPDetails;

  newSEMPDetails.net_profit_before_tax =
    apiSelfEmployedDetails.profitBeforeTax || 0;

  const { startDate } = apiSelfEmployedDetails;
  if (startDate) {
    const newDateYear = new Date(startDate).getFullYear();
    if (newDateYear && !Number.isNaN(newDateYear)) {
      newSEMPDetails.year_ended = newDateYear;
    }
  }

  const addbacks = apiSelfEmployedDetails.addback;

  if (addbacks) {
    const addbackMapping = {
      allowances: 'other',
      amortisationOfGoodwill: 'other',
      bonus: null,
      carExpense: 'other',
      carryForwardLosses: null,
      depreciation: 'depreciation',
      interest: 'interest',
      lease: 'lease_hp',
      nonCashBenefits: null,
      nonRecurringIncome: 'non_recurring_income',
      nonRecurringExpenses: 'non_recurring_expenses',
      instantAssetWriteOff: 'instant_asset_write_off',
      salary: 'personal_wages_before_tax',
      superannuationExcess: 'super_above_compulsory',
    };

    const newAddbacks = {
      non_recurring_income: [] as number[],
      non_recurring_expenses: [] as number[],
      instant_asset_write_off: [] as number[],
      interest: [] as number[],
      depreciation: [] as number[],
      super_above_compulsory: [] as number[],
      lease_hp: [] as number[],
      other: [] as number[],
      personal_wages_before_tax: personalWagesBeforeTax,
    };

    Object.entries(addbacks).forEach(([key, value]) => {
      if (key === 'otherAddback' && typeof value !== 'number') {
        (value as Array<{ description?: string | null; amount?: number | null }>)?.forEach((v) => newAddbacks.other.push(v.amount || 0));
      } else if (key === 'salary') {
        if (typeof value === 'number') {
          newAddbacks.personal_wages_before_tax[applicantIndex] = value;
        }
      } else {
        const keyType = key as keyof typeof addbackMapping;
        const addbackType = addbackMapping[keyType] as keyof typeof newAddbacks;
        if (
          newAddbacks[addbackType] &&
          addbackType !== null &&
          typeof value === 'number'
        ) {
          newAddbacks[addbackType].push(value);
        }
      }
    });

    Object.keys(newAddbacks).forEach((key) => {
      const addbackKey = key as keyof typeof newAddbacks;
      const addbackValues = newAddbacks[addbackKey];

      if (addbackKey !== 'personal_wages_before_tax' && addbackValues.length) {
        newSEMPDetails = {
          ...newSEMPDetails,
          [addbackKey]: addbackValues.join('+'),
        };
      }
    });
  }

  return newSEMPDetails;
}

export default getIncomes;
