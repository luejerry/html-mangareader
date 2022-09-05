interface Window {
  zenscroll: any;
  pauseZenscroll: boolean;
}

type SemVer = `${number}.${number}.${number}`;

interface LocalConfig {
  smoothScroll: boolean;
  darkMode: boolean;
  seamless: boolean;
}

type FitSizes = 'size0' | 'size1';

interface FitDimensions {
  portrait: {
    width: number;
    height: number;
  };
  landscape: {
    height: number;
    width?: number;
  };
}
