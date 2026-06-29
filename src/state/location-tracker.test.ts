import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StateStore } from './store';
import { LocationTracker } from './location-tracker';
import { createDefaultState } from './defaults';

describe('LocationTracker', () => {
  let store: StateStore;
  let tracker: LocationTracker;

  beforeEach(() => {
    store = new StateStore(createDefaultState());
    tracker = new LocationTracker(store);
    tracker.start();
  });

  it('marks location dirty when environment changes', () => {
    expect(store.get('dirtyLocations')).toEqual([]);
    store.set('locations.north-sea.environment.fog.color', '#ff0000');
    expect(store.get('dirtyLocations')).toEqual(['north-sea']);
  });

  it('marks location dirty when instances change', () => {
    expect(store.get('dirtyLocations')).toEqual([]);
    store.set('instances.ship.transform.position', [10, 20, 30]);
    expect(store.get('dirtyLocations')).toEqual(['north-sea']);
  });

  it('does not add duplicate dirty locations', () => {
    expect(store.get('dirtyLocations')).toEqual([]);
    store.set('locations.north-sea.environment.fog.color', '#ff0000');
    store.set('instances.ship.transform.position', [10, 20, 30]);
    expect(store.get('dirtyLocations')).toEqual(['north-sea']);
  });

  it('cleans up subscription on stop()', () => {
    const spy = vi.spyOn(store, 'subscribe');
    tracker.stop();
    store.set('locations.north-sea.environment.fog.color', '#ff0000');
    expect(store.get('dirtyLocations')).toEqual([]);
  });

  it('handles activeLocation changes correctly', () => {
    // Setup a second location
    const initialState = createDefaultState();
    const northEnv = initialState.locations['north-sea'].environment;
    initialState.locations['south-sea'] = {
      environment: structuredClone(northEnv),
      instances: {},
    };
    store = new StateStore(initialState);
    tracker = new LocationTracker(store);
    tracker.start();

    store.set('activeLocation', 'south-sea');
    expect(store.get('dirtyLocations')).toEqual([]);

    store.set('locations.south-sea.environment.fog.color', '#00ff00'); // Change in south-sea
    expect(store.get('dirtyLocations')).toEqual(['south-sea']);

    store.set('activeLocation', 'north-sea');
    store.set('locations.north-sea.environment.sky.gradientBottom', '#0000ff'); // Change in north-sea
    expect(store.get('dirtyLocations')).toEqual(['south-sea', 'north-sea']);
  });
});
