// Model definition registry — each code-defined model registers here.
// To add a model: import its definition and add to the map.
import type { ModelDefinition } from '../types';
import ship from './ship/model';

export const modelDefinitions: Record<string, ModelDefinition> = {
  ship,
};
