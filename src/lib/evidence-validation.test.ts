import { strict as assert } from 'node:assert';
import { missingReplenishmentIndustries } from './evidence-validation';

const industries = [{ id: 'termolar', name: 'TERMOLAR' }, { id: 'copatos', name: 'COPATOS' }, { id: 'quadrado', name: 'AO QUADRADO' }];

assert.deepEqual(missingReplenishmentIndustries(industries, 'termolar', ['termolar']), []);
assert.deepEqual(missingReplenishmentIndustries(industries, 'termolar', []), ['TERMOLAR']);
