/// <reference path="./types.ts" />

/**
 * CONFIGURATION AND CONSTANTS
 */
const versionCheckUrl = 'https://api.github.com/repos/luejerry/html-mangareader/contents/version';
/**
 * Key for which app data is stored in LocalStorage
 */
const storageKey = 'mangareader-config';
/**
 * Max number of pages to load at once, if `dynamicImageLoading` is enabled in `config.ini`
 */
const maxLoadedImages = 20;
/**
 * Max number of navbar previews to load at once, if `dynamicImageLoading` is enabled in
 * `config.ini`
 */
const maxLoadedPreviews = 60;

const loadingPlaceholder =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8HwYAAloBV80ot9EAAAAASUVORK5CYII=';

const smartFit: { [K in FitSizes]: FitDimensions } = {
  size0: {
    portrait: {
      width: 720,
      height: 1024,
    },
    landscape: {
      height: 1024,
    },
  },
  size1: {
    portrait: {
      width: 1080,
      height: 1440,
    },
    landscape: {
      height: 1280,
    },
  },
};

const INTERSECT_MARGIN: Record<Direction, string> = {
  vertical: '-45% 0px -45% 0px',
  horizontal: '0px -45% 0px -45%',
  'horizontal-rtl': '0px -45% 0px -45%',
};
