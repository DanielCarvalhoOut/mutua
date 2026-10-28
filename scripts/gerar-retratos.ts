// Gera os retratos ilustrados das médicas fictícias em public/medicas/<id>.svg.
// Ilustração, e não foto, deixa claro que são pessoas de demonstração.
// Uso: npm run retratos

import { mkdirSync, writeFileSync } from 'node:fs';
import { createAvatar } from '@dicebear/core';
import * as lorelei from '@dicebear/lorelei';
import { MEDICAS } from '../src/adapters/mock/seed';

// Fundos tirados da paleta da marca, em tons claros.
const FUNDOS = ['f3dbe7', 'ead9f1', 'f5e0da', 'efd6dc', 'e6dcf0'];

mkdirSync('public/medicas', { recursive: true });

for (const [i, medica] of MEDICAS.entries()) {
  const svg = createAvatar(lorelei, {
    seed: medica.id,
    backgroundColor: [FUNDOS[i % FUNDOS.length]],
    beardProbability: 0,
    frecklesProbability: 25,
    glassesProbability: 25,
    earringsProbability: 60,
    hairAccessoriesProbability: 20,
  }).toString();
  writeFileSync(`public/medicas/${medica.id}.svg`, svg);
  console.log(`retrato gerado: ${medica.id}`);
}
