import type { QuickliApiScenario, ExportableLIXIScenario } from '../types';

import getLIXIHousehold from './getLIXIHousehold';
import getLIXIIncome from './getLIXIIncome';
import getLIXILiabilities from './getLIXILiabilities';
import getLIXIRentalAndLoans from './getLIXIRentalAndLoans';

// NOTE: Production implementations may want to add runtime validation here
// (e.g. a Zod schema parse) to catch malformed output before it leaves this layer.

function convertScenarioToLixi(
  quickliApiScenario: QuickliApiScenario,
): ExportableLIXIScenario {
  return {
    ...getLIXIHousehold(quickliApiScenario),
    ...getLIXIIncome(quickliApiScenario),
    ...getLIXILiabilities(quickliApiScenario),
    ...getLIXIRentalAndLoans(quickliApiScenario),
  } satisfies ExportableLIXIScenario;
}

export default convertScenarioToLixi;
