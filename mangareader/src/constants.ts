/// <reference path="./types.ts" />

/**
 * CONFIGURATION AND CONSTANTS
 */
const versionCheckUrl = 'https://api.github.com/repos/luejerry/html-mangareader/contents/version';
const storageKey = 'mangareader-config';
const maxLoadedImages = 50;
const loadingPlaceholder =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8HwYAAloBV80ot9EAAAAASUVORK5CYII=';

const defaultConfig: LocalConfig = {
  smoothScroll: true,
  darkMode: false,
  seamless: false,
};

const ORIENTATION = {
  portrait: 'portrait',
  square: 'square',
  landscape: 'landscape',
} as const;

const smartFit: { [K in FitSizes]: FitDimensions } = {
  size0: {
    portrait: {
      width: 720,
      height: 1024,
    },
    landscape: {
      height: 800,
    },
  },
  size1: {
    portrait: {
      width: 1080,
      height: 1440,
    },
    landscape: {
      height: 1080,
    },
  },
};

const INTERSECT_MARGIN: Record<Direction, string> = {
  vertical: '-45% 0px -45% 0px',
  horizontal: '0px -45% 0px -45%',
  'horizontal-rtl': '0px -45% 0px -45%',
};
