export type EndpointTemplate = {
  label: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body: string;
};

const sampleScenario = {
  households: [{ id: 'household-1', num_adults: 1, status: 'single', shared_with_households: [], num_dependants: 0, postcode: 2000 }],
  income: [{ id: 'income-1', which_household: 0, payg: 100000 }],
  self_employed_income: [],
  proposed_home_loans: [{ id: 'hl-1', loan_type: 'owner_occupied', product_type: 'variable_package', loan_amount: 500000, term: 30, interest_only_period: 0, lvr: 71.43 }],
  existing_home_loans: [],
  liabilities: [],
  living_expenses: [{ id: 'household-1', simple_basic_expense: 0, use_detailed_basic_expense: false }],
  securities: [{ id: 'sec-1', property_purpose: 'owner_occupied', property_type: 'house', value: 700000, postcode: 2000, applicant_ownership: [100] }],
};

const createScenarioBody = {
  description: 'Test scenario',
  scenario: sampleScenario,
};

export const ENDPOINTS: EndpointTemplate[] = [
  { label: 'Health', method: 'GET', path: '/api/v3/health', body: '' },
  { label: 'Who Am I', method: 'GET', path: '/api/v3/whoami', body: '' },
  { label: 'Create Scenario', method: 'POST', path: '/api/v3/scenarios', body: JSON.stringify(createScenarioBody, null, 2) },
  { label: 'Get Scenario', method: 'GET', path: '/api/v3/scenarios/{scenarioId}', body: '' },
  { label: 'Update Scenario', method: 'PUT', path: '/api/v3/scenarios/{scenarioId}', body: JSON.stringify({ ...createScenarioBody, description: 'Updated scenario' }, null, 2) },
  { label: 'List Scenarios', method: 'GET', path: '/api/v3/scenarios', body: '' },
];
