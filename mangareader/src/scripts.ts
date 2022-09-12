/// <reference path="./types.ts" />
/// <reference path="./utils.ts" />
/// <reference path="./constants.ts" />

(function () {
  /**
   * GLOBAL VARIABLES
   */

  const pages = Array.from(document.getElementsByClassName('page'));
  const images = Array.from(document.getElementsByClassName('image')) as HTMLImageElement[];
  const originalWidthBtn = document.getElementById('btn-original-width') as HTMLButtonElement;
  const shrinkSizeBtn = document.getElementById('btn-shrink-size') as HTMLButtonElement;
  const shrinkWidthBtn = document.getElementById('btn-shrink-width') as HTMLButtonElement;
  const shrinkHeightBtn = document.getElementById('btn-shrink-height') as HTMLButtonElement;
  const fitWidthBtn = document.getElementById('btn-fit-width') as HTMLButtonElement;
  const fitHeightBtn = document.getElementById('btn-fit-height') as HTMLButtonElement;
  const smartFitBtns = Array.from(
    document.getElementsByClassName('btn-smart-fit'),
  ) as HTMLButtonElement[];
  const directionRadioBtns = Array.from(
    document.getElementsByName('view-direction'),
  ) as HTMLInputElement[];
  const smoothScrollCheckbox = document.getElementById('input-smooth-scroll') as HTMLInputElement;
  const darkModeCheckbox = document.getElementById('input-dark-mode') as HTMLInputElement;
  const seamlessCheckbox = document.getElementById('input-seamless') as HTMLInputElement;
  const scrubberIconDiv = document.getElementById('scrubber-icon') as HTMLDivElement;
  const scrubberContainerDiv = document.getElementById('scrubber-container') as HTMLDivElement;
  const scrubberDiv = document.getElementById('scrubber') as HTMLDivElement;
  const scrubberPreviewDiv = document.getElementById('scrubber-preview') as HTMLDivElement;
  const scrubberMarker = document.getElementById('scrubber-marker') as HTMLDivElement;
  const scrubberMarkerActive = document.getElementById('scrubber-marker-active') as HTMLDivElement;
  let scrubberImages: HTMLImageElement[]; // Array of images, set in `setupScrubber()`

  const animationDispatcher = createAnimationDispatcher();

  let intersectObserver: IntersectionObserver;
  let visiblePage: HTMLElement | null;
  let configIni: ConfigIni = {};
  // Used by scrubber
  const scrubberState: ScrubberState = {
    screenHeight: 0,
    previewHeight: 0,
    markerHeight: 0,
    visiblePageIndex: 0,
    previewPageIndex: 0,
    viewDirection: 'vertical',
  };

  /**
   * Read local `config.ini` file which is encoded in base64 in the `body[data-config]` attribute.
   * @returns Parsed config object, or empty object if valid config not found.
   */
  function load_config_ini(): ConfigIni {
    try {
      return JSON.parse(atob(document.body.dataset.config || '')) as ConfigIni;
    } catch (e) {
      console.error('Failed to parse config.ini', e);
      return {};
    }
  }

  /**
   * Setup tasks to be run when the user scrolls to a new page.
   */
  function setupIntersectionObserver(threshold: number, rootMargin: string): IntersectionObserver {
    const throttledUpdateLoadedImages = throttle(updateLoadedImages, 1000);
    const observer = onIntersectChange(
      (target: HTMLElement) => {
        visiblePage = target;
        if (target.dataset.index == null) {
          return;
        }
        // Update the URL hash as user scrolls.
        const url = new URL(location.href);
        url.hash = target.id;
        history.replaceState(null, '', url.toString());

        // Update the scrubber marker as user scrolls.
        scrubberState.visiblePageIndex = parseInt(target.dataset.index, 10);
        setScrubberMarkerActive(scrubberState.visiblePageIndex);
        if (configIni.dynamicImageLoading) {
          throttledUpdateLoadedImages(
            images,
            scrubberState.visiblePageIndex,
            maxLoadedImages,
            'pageloader',
          );
        }
      },
      { threshold, rootMargin },
    );
    for (const page of pages) {
      observer.observe(page);
    }
    return observer;
  }

  /**
   * Load and unload images as the visible page changes with scrolling.
   * @param imgs Images to load/unload.
   * @param visiblePageIndex Index of currently visible page. Images within a distance of this page
   * are loaded, and images outside this distance are unloaded. A null value unloads all images.
   * @param maxLoad Maximum number of images to be loaded at once.
   * @param tag Task identifier, to distinguish separate usages from each other in the animation
   * scheduler.
   */
  function updateLoadedImages(
    imgs: HTMLImageElement[],
    visiblePageIndex: number | null,
    maxLoad: number,
    tag: string,
  ): void {
    animationDispatcher.addTask(tag, () => {
      const maxDistance = maxLoad / 2;
      for (const [i, img] of imgs.entries()) {
        if (visiblePageIndex == null) {
          img.src = loadingPlaceholder;
        } else if (
          (!img.src || img.src === loadingPlaceholder) &&
          Math.max(visiblePageIndex - maxDistance, 0) <= i &&
          i <= visiblePageIndex + maxDistance
        ) {
          img.src = img.dataset.src || loadingPlaceholder;
        } else if (
          img.src !== loadingPlaceholder &&
          (i < visiblePageIndex - maxDistance || visiblePageIndex + maxDistance < i)
        ) {
          img.src = loadingPlaceholder;
        }
      }
    });
  }

  const imagesMeta = images.map((image) => {
    const ratio = image.width / image.height;
    return {
      image,
      orientation: ratio > 1 ? 'landscape' : 'portrait',
    };
  });

  /**
   * Read the configuration stored in browser LocalStorage. Unlike `config.ini` these settings can
   * be changed directly from the UI.
   *
   * Note that some browser security policies may forbid LocalStorage access, in which case this
   * function will return an empty object.
   *
   * @returns Parsed configuration file, or empty object if valid config not found or cannot be
   * accessed.
   */
  function readConfig(): LocalConfig {
    let config: LocalConfig = {};
    try {
      // Unfortunately Edge does not allow localStorage access for file:// urls
      const serializedConfig: string | null = localStorage.getItem(storageKey);
      config = JSON.parse(serializedConfig || '{}');
    } catch (err) {
      console.error(err);
    }
    return config;
  }

  /**
   * Update configuration to browser LocalStorage. Note that some browser security policies may
   * forbid LocalStorage access, in which case this function will do nothing.
   * @param config Configuration key-value pairs to update. Update is merged with existing config.
   */
  function writeConfig(config: Partial<LocalConfig>): void {
    const oldConfig = readConfig();
    const newConfig = { ...oldConfig, ...config };
    try {
      localStorage.setItem(storageKey, JSON.stringify(newConfig));
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Do initial setup of the page based on configuration settings.
   */
  async function loadSettings(): Promise<void> {
    configIni = load_config_ini();
    const config = readConfig();
    initShowNavPref(configIni);
    initScalingMode(config);
    // Need to wait for page to render, otherwise intersection observer fires before viewport
    // moves to the initial URL hash for the opened image
    await asyncTimeout(0);
    setupDirection(config);
    setupZenscroll(config);
    setupDarkMode(config);
    setupSeamless(config);
    setupScrubber(configIni);
  }

  /**
   * Hide the navigation buttons if `disable-nav = yes` in `config.ini`.
   */
  function initShowNavPref(config: ConfigIni): void {
    if (config.disableNavButtons) {
      document.body.classList.add('disable-nav');
    }
  }

  /**
   * Apply the user's last selected image scaling preference. Defaults to original size.
   */
  function initScalingMode(config: LocalConfig): void {
    const scaling = config.scaling || 'none';
    switch (scaling) {
      case 'none':
        return handleOriginalSize();
      case 'fit_width':
        return handleFitWidth();
      case 'fit_height':
        return handleFitHeight();
      case 'shrink':
        return handleShrinkSize();
      case 'shrink_width':
        return handleShrinkWidth();
      case 'shrink_height':
        return handleShrinkHeight();
      case 'smart_size0':
        return smartFitImages(smartFit.size0);
      case 'smart_size1':
        return smartFitImages(smartFit.size1);
    }
  }

  /**
   * Apply the user's last selected layout direction preference. Defaults to vertical direction.
   */
  async function setupDirection(config: LocalConfig): Promise<void> {
    const direction = config.direction || 'vertical';
    const directionRadioBtn = directionRadioBtns.find((button) => button.value === direction);
    if (!directionRadioBtn) {
      return;
    }
    directionRadioBtn.checked = true;
    setDirection(direction);
    // HACK: on initial page load, browser auto scrolls to the beginning of the page after some
    // unspecified delay.
    // For RTL layout, viewport must be scrolled to the end initially but must be delayed until
    // after the browser scrolls. The timing is determined experimentally
    if (direction === 'horizontal-rtl') {
      await asyncTimeout(100);
      pages[0]?.scrollIntoView({ inline: 'end' });
    }
  }

  /**
   * Apply the user's last selected smooth scroll preference.
   */
  function setupZenscroll(config: LocalConfig): void {
    window.zenscroll.setup(170);
    if (config.smoothScroll) {
      smoothScrollCheckbox.checked = true;
    } else {
      window.pauseZenscroll = true;
    }
  }

  /**
   * Apply the user's last selected dark mode preference.
   */
  function setupDarkMode(config: LocalConfig): void {
    darkModeCheckbox.checked = config.darkMode ?? false;
    // Setting `checked` does not fire the `change` event, so we must dispatch it manually
    if (config.darkMode) {
      const change = new Event('change', { cancelable: true });
      darkModeCheckbox.dispatchEvent(change);
    }
  }

  /**
   * Apply the user's last selected collapse spacing preference.
   */
  function setupSeamless(config: LocalConfig): void {
    seamlessCheckbox.checked = config.seamless ?? false;
    if (config.seamless) {
      const change = new Event('change', { cancelable: true });
      seamlessCheckbox.dispatchEvent(change);
    }
  }

  /**
   * @returns Width of the browser viewport in pixels.
   */
  function getWidth(): number {
    return document.documentElement.clientWidth;
  }

  /**
   * @returns Height of the browser viewport in pixels.
   */
  function getHeight(): number {
    return document.documentElement.clientHeight;
  }

  function getImageHeightAttribute(img: HTMLImageElement): number {
    return parseInt(img.getAttribute('height') || '-1', 10);
  }

  function getImageWidthAttribute(img: HTMLImageElement): number {
    return parseInt(img.getAttribute('width') || '-1', 10);
  }

  /**
   * @returns Rescaled height of an image if sized to `width`, preserving aspect ratio.
   */
  function widthToRatioHeight(img: HTMLImageElement, width: number): number {
    return (width / getImageWidthAttribute(img)) * getImageHeightAttribute(img);
  }

  /**
   * @returns Rescaled width of an image if sized to `height`, preserving aspect ratio.
   */
  function heightToRatioWidth(img: HTMLImageElement, height: number): number {
    return (height / getImageHeightAttribute(img)) * getImageWidthAttribute(img);
  }

  function handleOriginalSize(): void {
    setImagesWidth('none', getWidth());
    writeConfig({ scaling: 'none' });
  }

  function handleShrinkSize(): void {
    setImagesDimensions('shrink', getWidth(), getHeight());
    writeConfig({ scaling: 'shrink' });
  }

  function handleFitWidth(): void {
    setImagesWidth('fit', getWidth());
    writeConfig({ scaling: 'fit_width' });
  }

  function handleFitHeight(): void {
    setImagesHeight('fit', getHeight());
    writeConfig({ scaling: 'fit_height' });
  }

  function handleShrinkWidth(): void {
    setImagesWidth('shrink', getWidth());
    writeConfig({ scaling: 'shrink_width' });
  }

  function handleShrinkHeight(): void {
    setImagesHeight('shrink', getHeight());
    writeConfig({ scaling: 'shrink_height' });
  }

  function handleSmartWidth(event: Event) {
    if (event.target instanceof HTMLElement) {
      const key = event.target.dataset.fitKey as FitSizes | undefined;
      if (key) {
        smartFitImages(smartFit[key]);
        writeConfig({ scaling: `smart_${key}` });
      }
    }
  }

  function setImagesWidth(fitMode: ScreenClamp, width: number) {
    for (const img of images) {
      switch (fitMode) {
        case 'fit':
          Object.assign(img.style, {
            width: `${width}px`,
            height: `${widthToRatioHeight(img, width)}px`,
          });
          break;
        case 'shrink':
          const maxWidth = Math.min(getImageWidthAttribute(img), width);
          Object.assign(img.style, {
            width: `${maxWidth}px`,
            height: `${widthToRatioHeight(img, maxWidth)}px`,
          });
          break;
        default:
          Object.assign(img.style, {
            width: null,
            height: null,
          });
      }
    }
    visiblePage?.scrollIntoView();
  }

  function setImagesHeight(fitMode: ScreenClamp, height: number) {
    for (const img of images) {
      switch (fitMode) {
        case 'fit':
          Object.assign(img.style, {
            height: `${height}px`,
            width: `${heightToRatioWidth(img, height)}px`,
          });
          break;
        case 'shrink':
          const maxHeight = Math.min(getImageHeightAttribute(img), height);
          Object.assign(img.style, {
            width: `${heightToRatioWidth(img, maxHeight)}px`,
            height: `${maxHeight}px`,
          });
          break;
        default:
          Object.assign(img.style, {
            width: null,
            height: null,
          });
      }
    }
    visiblePage?.scrollIntoView({ inline: 'center' });
  }

  function setImagesDimensions(fitMode: ScreenClamp, width: number, height: number) {
    for (const img of images) {
      switch (fitMode) {
        case 'fit':
          // Not implemented
          break;
        case 'shrink':
          clampImageSize(img, height, width);
          break;
        default:
          Object.assign(img.style, {
            width: null,
            height: null,
          });
      }
    }
    visiblePage?.scrollIntoView();
  }

  function clampImageSize(img: HTMLImageElement, height: number, width: number) {
    const scaledWidth = heightToRatioWidth(img, height);
    const scaledHeight = widthToRatioHeight(img, width);
    if (getImageHeightAttribute(img) <= height && getImageWidthAttribute(img) <= width) {
      Object.assign(img.style, {
        width: null,
        height: null,
      });
    } else if (scaledWidth > width) {
      Object.assign(img.style, {
        width: `${width}px`,
        height: `${scaledHeight}px`,
      });
    } else if (scaledHeight > height) {
      Object.assign(img.style, {
        width: `${scaledWidth}px`,
        height: `${height}px`,
      });
    }
  }

  function smartFitImages(fitMode: FitDimensions): void {
    const screenWidth = getWidth();
    const screenHeight = getHeight();
    for (const { image: img, orientation: orient } of imagesMeta) {
      switch (orient) {
        case ORIENTATION.portrait:
          const maxHeight = Math.min(getImageHeightAttribute(img), fitMode.portrait.height);
          Object.assign(img.style, {
            width: `${heightToRatioWidth(img, maxHeight)}px`,
            height: `${maxHeight}px`,
          });
          break;
        case ORIENTATION.landscape:
          clampImageSize(img, screenHeight, screenWidth);
          break;
      }
    }
    visiblePage?.scrollIntoView({ inline: 'center' });
  }

  function setDirection(direction: Direction): void {
    scrubberState.viewDirection = direction;
    // intersection observer must be recreated to change the root margin
    intersectObserver?.disconnect();
    document.body.classList.remove('vertical', 'horizontal', 'horizontal-rtl');
    document.body.classList.add(direction);
    switch (direction) {
      case 'horizontal':
      case 'horizontal-rtl':
        handleFitHeight();
      case 'vertical':
        visiblePage?.scrollIntoView({ inline: 'center' });
    }
    intersectObserver = setupIntersectionObserver(0, INTERSECT_MARGIN[direction]);
    writeConfig({
      direction: direction,
    });
  }

  function handleViewDirection(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }
    const direction = event.target.value as Direction;
    if (!direction) {
      return;
    }
    setDirection(direction);
  }

  function handleSmoothScroll(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }
    window.pauseZenscroll = !event.target.checked;
    writeConfig({
      smoothScroll: event.target.checked,
    });
  }

  function handleDarkMode(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }
    const darkModeEnabled = event.target.checked;
    if (darkModeEnabled) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    writeConfig({
      darkMode: darkModeEnabled,
    });
  }

  function handleSeamless(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }
    const seamlessEnabled = event.target.checked;
    if (seamlessEnabled) {
      document.body.classList.add('seamless');
    } else {
      document.body.classList.remove('seamless');
    }
    writeConfig({
      seamless: seamlessEnabled,
    });
    visiblePage?.scrollIntoView({ inline: 'center' });
  }

  function handleHorizontalScroll(event: WheelEvent): void {
    if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey || !event.deltaY) {
      return;
    }
    switch (scrubberState.viewDirection) {
      case 'horizontal':
        event.preventDefault();
        window.scrollBy({ left: event.deltaY });
        return;
      case 'horizontal-rtl':
        event.preventDefault();
        window.scrollBy({ left: -event.deltaY });
        return;
    }
  }

  function setupListeners(): void {
    originalWidthBtn.addEventListener('click', handleOriginalSize);
    shrinkSizeBtn.addEventListener('click', handleShrinkSize);
    shrinkWidthBtn.addEventListener('click', handleShrinkWidth);
    shrinkHeightBtn.addEventListener('click', handleShrinkHeight);
    fitWidthBtn.addEventListener('click', handleFitWidth);
    fitHeightBtn.addEventListener('click', handleFitHeight);

    for (const button of smartFitBtns) {
      button.addEventListener('click', handleSmartWidth);
    }
    for (const button of directionRadioBtns) {
      button.addEventListener('input', handleViewDirection);
    }

    smoothScrollCheckbox.addEventListener('change', handleSmoothScroll);
    darkModeCheckbox.addEventListener('change', handleDarkMode);
    seamlessCheckbox.addEventListener('change', handleSeamless);

    document.addEventListener('wheel', handleHorizontalScroll, { passive: false });
  }

  function setupScrubberPreview(): HTMLImageElement[] {
    const previewImages = images.map((img, i) => {
      const previewImage = document.createElement('img');
      previewImage.loading = 'lazy';
      previewImage.classList.add('scrubber-preview-image');
      previewImage.dataset.index = `${i}`;
      if (configIni.dynamicImageLoading) {
        previewImage.src = loadingPlaceholder;
      } else {
        previewImage.src = img.dataset.thumbnail || loadingPlaceholder;
      }
      previewImage.dataset.src = `${img.dataset.thumbnail}`;
      previewImage.addEventListener('error', async (event) => {
        previewImage.src = loadingPlaceholder;
        await asyncTimeout(2000);
        previewImage.src = previewImage.dataset.src || loadingPlaceholder;
      });
      previewImage.style.width = `${heightToRatioWidth(img, 180)}px`;
      return previewImage;
    });
    scrubberPreviewDiv.append(...previewImages);
    return previewImages;
  }

  function computeMarkerY(cursorY: number): number {
    return Math.max(
      0,
      Math.min(
        cursorY - scrubberState.markerHeight / 2,
        scrubberState.screenHeight - scrubberState.markerHeight,
      ),
    );
  }

  function setScrubberMarkerActive(activeIndex: number): void {
    const activeY =
      ((activeIndex + 0.5) / images.length) * scrubberState.screenHeight -
      scrubberState.markerHeight / 2;
    scrubberMarkerActive.style.transform = `translateY(${activeY}px)`;
    scrubberMarkerActive.innerText = `${activeIndex + 1}`;
  }

  function setupScrubber(configIni: ConfigIni): void {
    if (configIni.disableNavBar) {
      scrubberIconDiv.style.display = 'none';
      scrubberContainerDiv.style.display = 'none';
      return;
    }
    let prevImage: HTMLImageElement;

    const setPreviewScroll = (cursorY: number) => {
      const cursorYRatio = cursorY / scrubberState.screenHeight;
      scrubberPreviewDiv.style.transform = `translateY(${
        -cursorYRatio * scrubberState.previewHeight + cursorY
      }px)`;
    };

    const setMarkerPosition = (cursorY: number) => {
      const markerYPos = computeMarkerY(cursorY);
      scrubberMarker.style.transform = `translateY(${markerYPos}px)`;
    };

    const setMarkerText = (text: string) => {
      scrubberMarker.innerText = text;
    };

    const debouncedUpdateLoadedImages = debounce(updateLoadedImages, 0);

    let scrubberActivated = false;
    scrubberDiv.addEventListener('mouseenter', () => {
      if (!scrubberActivated) {
        scrubberImages = setupScrubberPreview();
        scrubberActivated = true;
      }
      scrubberState.screenHeight = document.documentElement.clientHeight;
      // We can't style this as 100vh because it doesn't account for horizontal scrollbar
      scrubberState.previewHeight = scrubberPreviewDiv.offsetHeight;
      scrubberState.markerHeight = scrubberMarker.offsetHeight;

      setScrubberMarkerActive(scrubberState.visiblePageIndex);
      scrubberDiv.style.height = `${scrubberState.screenHeight}px`;
      scrubberContainerDiv.style.opacity = '1';
    });

    scrubberDiv.addEventListener('mouseleave', () => {
      scrubberContainerDiv.style.opacity = '0';
      if (configIni.dynamicImageLoading) {
        updateLoadedImages(scrubberImages, null, maxLoadedPreviews, 'scrubber');
      }
    });

    scrubberDiv.addEventListener('mousemove', (event) => {
      const cursorY = event.clientY;
      const cursorYRatio = cursorY / scrubberState.screenHeight;
      scrubberState.previewPageIndex = Math.floor(cursorYRatio * images.length);
      if (configIni.dynamicImageLoading) {
        debouncedUpdateLoadedImages(
          scrubberImages,
          scrubberState.previewPageIndex,
          maxLoadedPreviews,
          'scrubber',
        );
      }
      const image = scrubberImages[scrubberState.previewPageIndex];
      if (!image) {
        return;
      }
      if (event.buttons & 1) {
        // Allow left click drag scrubbing
        if (scrubberState.previewPageIndex !== scrubberState.visiblePageIndex) {
          images[scrubberState.previewPageIndex]?.scrollIntoView({ inline: 'center' });
        }
      }
      animationDispatcher.addTask('mousemove', () => {
        setMarkerPosition(cursorY);
        setMarkerText(`${scrubberState.previewPageIndex + 1}`);
        setPreviewScroll(cursorY);
        if (prevImage !== image) {
          image.classList.add('hovered');
          if (prevImage) {
            prevImage.classList.remove('hovered');
          }
          prevImage = image;
        }
      });
    });
    scrubberDiv.addEventListener('click', (event) => {
      const cursorYRatio = event.clientY / scrubberState.screenHeight;
      const imageIndex = Math.floor(cursorYRatio * images.length);
      images[imageIndex]?.scrollIntoView({ inline: 'center' });
    });
  }

  async function checkVersion(): Promise<void> {
    const response = await fetch(versionCheckUrl, { method: 'GET', mode: 'cors' }).then((r) =>
      r.json(),
    );
    const remoteVersion = atob(response.content) as SemVer;
    const versionDiv = document.getElementById('version') as HTMLDivElement;
    const localVersion = versionDiv.innerText as SemVer;
    const compare = versionComparator(localVersion, remoteVersion);
    if (compare > 0) {
      const nextVersionSpan = document.getElementById('next-version') as HTMLSpanElement;
      const linkUpdate = document.getElementById('link-update') as HTMLAnchorElement;
      const updateToast = document.getElementById('update-toast') as HTMLDivElement;
      nextVersionSpan.innerText = remoteVersion;
      linkUpdate.href = 'https://github.com/luejerry/html-mangareader/releases';
      Object.assign(updateToast.style, { display: 'initial' });
      await asyncTimeout(0);
      updateToast.classList.add('show');
      await asyncTimeout(5000);
      updateToast.classList.remove('show');
    }
  }

  async function main(): Promise<void> {
    setupListeners();
    loadSettings();
    checkVersion();
  }

  main();
})();
