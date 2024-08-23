import { writable } from 'svelte/store';

import defaults from './defaults';

export const image = writable();

export const gl = writable();
export const program = writable();

export const texture = writable();
export const planeMesh = writable();

export const brightness = writable(defaults.brightness);
export const highlights = writable(defaults.highlights);
export const shadows = writable(defaults.shadows);
export const contrast = writable(defaults.contrast);
export const saturation = writable(defaults.saturation);
export const grain = writable(defaults.grain);
