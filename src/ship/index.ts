import { createModel } from '../model/factory';
import { ccivConfig } from '../models/ship/config';

export function createShip() {
  return createModel(ccivConfig);
}
