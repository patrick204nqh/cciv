import * as THREE from 'three';
import { buildHull } from './hull';
import { buildDeck } from './deck';
import { buildMasts } from './masts';
import { buildSails } from './sails';
import { buildRigging } from './rigging';
import { buildCannons } from './cannons';
import { buildDeckDetails } from './deckDetails';
import { buildBoats } from './boats';

export function createShip(): THREE.Group {
  const ship = new THREE.Group();
  buildHull(ship);
  buildDeck(ship);
  buildMasts(ship);
  buildSails(ship);
  buildRigging(ship);
  buildCannons(ship);
  buildDeckDetails(ship);
  buildBoats(ship);
  return ship;
}
