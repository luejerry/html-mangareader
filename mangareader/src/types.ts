interface Window {
  zenscroll: any;
  pauseZenscroll: boolean;
}

/**
 * User configuration loaded from the config.ini file
 */
interface ConfigIni {
  disableNavButtons?: boolean;
  disableNavBar?: boolean;
  dynamicImageLoading?: boolean;
}

type SemVer = `${number}.${number}.${number}`;

interface LocalConfig {
  smoothScroll?: boolean;
  darkMode?: boolean;
  seamless?: boolean;
  scaling?: Scaling;
  direction?: Direction;
}

type ScreenClamp = 'none' | 'shrink' | 'fit';

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

type Orientation = keyof FitDimensions;

type Direction = 'vertical' | 'horizontal' | 'horizontal-rtl';

type Scaling =
  | 'none'
  | 'fit_width'
  | 'fit_height'
  | 'shrink'
  | 'shrink_width'
  | 'shrink_height'
  | `smart_${FitSizes}`;

interface ScrubberState {
  screenHeight: number;
  previewHeight: number;
  markerHeight: number;
  visiblePageIndex: number;
  previewPageIndex: number;
  viewDirection: Direction;
}
