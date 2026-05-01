import type { LIXIScenarioContent, QuickliApiScenario } from '../types';

import getHomeLoansAndSecurities from './getHomeLoansAndRentals';
import getHouseholdsAndLivingExpenses from './getHouseholdsAndLivingExpenses';
import getIncomes from './getIncomes';
import getLiabilities from './getLiabilities';

function convertLixiToScenario(
  apiScenario: LIXIScenarioContent,
): QuickliApiScenario {
  const { households, living_expenses } =
    getHouseholdsAndLivingExpenses(apiScenario);

  const { liabilities } = getLiabilities(apiScenario);
  const { proposed_home_loans, existing_home_loans, securities, home_loan_security_links } =
    getHomeLoansAndSecurities(apiScenario);
  const { income, self_employed_income } = getIncomes(apiScenario);
  return {
    households,
    income,
    living_expenses,
    liabilities,
    self_employed_income,
    securities,
    home_loan_security_links,
    proposed_home_loans,
    existing_home_loans,
    additional_info: {
      useDependantAges: households.some(
        (h) => !!h.dependants_age && h.dependants_age.some(Boolean),
      ),
    },
  };
}

export default convertLixiToScenario;
