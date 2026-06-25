import * as THREE from 'three';
import { createCCIVShip } from './cciv/ship';

export function createShip(): THREE.Group {
  return createCCIVShip();
}
