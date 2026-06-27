import { describe, it, expect, vi } from 'vitest';
import { StateStore } from './store';
import { createDefaultState } from './defaults';

describe('StateStore', () => {
  it('returns current state via get()', () => {
    const store = new StateStore(createDefaultState());
    expect(store.get('activeLocation')).toBe('north-sea');
  });

  it('sets a value and notifies subscribers', () => {
    const store = new StateStore(createDefaultState());
    const fn = vi.fn();
    store.subscribe('activeLocation', fn);
    store.set('activeLocation', 'caribbean');
    expect(fn).toHaveBeenCalledWith('caribbean', 'activeLocation');
  });

  it('sets a nested dotted path', () => {
    const store = new StateStore(createDefaultState());
    const fn = vi.fn();
    store.subscribe('environment.sky.gradientTop', fn);
    store.set('environment.sky.gradientTop', '#ff0000');
    expect(fn).toHaveBeenCalledWith('#ff0000', 'environment.sky.gradientTop');
  });

  it('notifies subscribers on parent paths', () => {
    const store = new StateStore(createDefaultState());
    const fn = vi.fn();
    store.subscribe('instances.ship.transform', fn);
    store.set('instances.ship.transform.position', [10, 0, 0]);
    expect(fn).toHaveBeenCalled();
  });

  it('takes a snapshot', () => {
    const store = new StateStore(createDefaultState());
    const snap = store.snapshot();
    expect(snap.activeLocation).toBe('north-sea');
  });

  it('restores a snapshot', () => {
    const store = new StateStore(createDefaultState());
    store.set('activeLocation', 'caribbean');
    const snap = store.snapshot();
    snap.activeLocation = 'north-sea';
    store.restore(snap);
    expect(store.get('activeLocation')).toBe('north-sea');
  });

  it('unsubscribes', () => {
    const store = new StateStore(createDefaultState());
    const fn = vi.fn();
    const unsub = store.subscribe('activeLocation', fn);
    unsub();
    store.set('activeLocation', 'caribbean');
    expect(fn).not.toHaveBeenCalled();
  });
});
