import type { SaveableScenario, ExportableLIXIScenario } from '../types';

import getLIXIHousehold from './getLIXIHousehold';
import getLIXIIncome from './getLIXIIncome';
import getLIXILiabilities from './getLIXILiabilities';
import getLIXIRentalAndLoans from './getLIXIRentalAndLoans';

// NOTE: Production implementations may want to add runtime validation here
// (e.g. a Zod schema parse) to catch malformed output before it leaves this layer.

function convertScenarioToLixi(
  saveableScenario: SaveableScenario,
): ExportableLIXIScenario {
  return {
    ...getLIXIHousehold(saveableScenario),
    ...getLIXIIncome(saveableScenario),
    ...getLIXILiabilities(saveableScenario),
    ...getLIXIRentalAndLoans(saveableScenario),
  } satisfies ExportableLIXIScenario;
}

export default convertScenarioToLixi;
