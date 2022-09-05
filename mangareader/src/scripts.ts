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
  const scrubberContainerDiv = document.getElementById('scrubber-container') as HTMLDivElement;
  const scrubberDiv = document.getElementById('scrubber') as HTMLDivElement;
  const scrubberPreviewDiv = document.getElementById('scrubber-preview') as HTMLDivElement;
  const scrubberMarker = document.getElementById('scrubber-marker') as HTMLDivElement;
  const scrubberMarkerActive = document.getElementById('scrubber-marker-active') as HTMLDivElement;
  let scrubberImages: HTMLImageElement[]; // Array of images, set in `setupScrubber()`

  const animationDispatcher = createAnimationDispatcher();

  let visiblePage: HTMLElement | null;
  // Used by scrubber
  const scrubberState: ScrubberState = {
    screenHeight: 0,
    previewHeight: 0,
    markerHeight: 0,
    visiblePageIndex: 0,
    viewDirection: 'vertical',
  };

  function setupIntersectionObserver(threshold: number, rootMargin: string): IntersectionObserver {
    const observer = onIntersectChange(
      (target: HTMLElement) => {
        visiblePage = target;
        if (target.dataset.index == null) {
          return;
        }
        scrubberState.visiblePageIndex = parseInt(target.dataset.index, 10);
        // Update the URL hash as user scrolls.
        const url = new URL(location.href);
        url.hash = target.id;
        history.replaceState(null, '', url.toString());

        setScrubberMarkerActive(scrubberState.visiblePageIndex);
      },
      { threshold, rootMargin },
    );
    for (const page of pages) {
      observer.observe(page);
    }
    return observer;
  }

  let intersectObserver = setupIntersectionObserver(0, INTERSECT_MARGIN.vertical);

  const imagesMeta = images.map((image) => {
    const ratio = image.naturalWidth / image.naturalHeight;
    return {
      image,
      orientation: ratio > 1 ? 'landscape' : 'portrait',
    };
  });

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

  function writeConfig(config: Partial<LocalConfig>): void {
    const oldConfig = readConfig();
    const newConfig = { ...oldConfig, ...config };
    try {
      localStorage.setItem(storageKey, JSON.stringify(newConfig));
    } catch (err) {
      console.error(err);
    }
  }

  function loadSettings(): void {
    const config = readConfig();
    initScalingMode(config);
    setupDirection(config);
    setupZenscroll(config);
    setupDarkMode(config);
    setupSeamless(config);
  }

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

  function setupZenscroll(config: LocalConfig): void {
    window.zenscroll.setup(170);
    if (config.smoothScroll) {
      smoothScrollCheckbox.checked = true;
    } else {
      window.pauseZenscroll = true;
    }
  }

  function setupDarkMode(config: LocalConfig): void {
    darkModeCheckbox.checked = config.darkMode ?? false;
    // Setting `checked` does not fire the `change` event, so we must dispatch it manually
    if (config.darkMode) {
      const change = new Event('change', { cancelable: true });
      darkModeCheckbox.dispatchEvent(change);
    }
  }

  function setupSeamless(config: LocalConfig): void {
    seamlessCheckbox.checked = config.seamless ?? false;
    if (config.seamless) {
      const change = new Event('change', { cancelable: true });
      seamlessCheckbox.dispatchEvent(change);
    }
  }

  function getWidth(): number {
    return document.documentElement.clientWidth;
  }

  function getHeight(): number {
    return document.documentElement.clientHeight;
  }

  function handleOriginalSize(): void {
    setImagesWidth(SCREENCLAMP.none, getWidth());
    writeConfig({ scaling: 'none' });
  }

  function handleShrinkSize(): void {
    setImagesDimensions(SCREENCLAMP.shrink, getWidth(), getHeight());
    writeConfig({ scaling: 'shrink' });
  }

  function handleFitWidth(): void {
    setImagesWidth(SCREENCLAMP.fit, getWidth());
    writeConfig({ scaling: 'fit_width' });
  }

  function handleFitHeight(): void {
    setImagesHeight(SCREENCLAMP.fit, getHeight());
    writeConfig({ scaling: 'fit_height' });
  }

  function handleShrinkWidth(): void {
    setImagesWidth(SCREENCLAMP.shrink, getWidth());
    writeConfig({ scaling: 'shrink_width' });
  }

  function handleShrinkHeight(): void {
    setImagesHeight(SCREENCLAMP.shrink, getHeight());
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

  function setImagesWidth(fitMode: keyof typeof SCREENCLAMP, width: number) {
    for (const img of images) {
      switch (fitMode) {
        case SCREENCLAMP.fit:
          Object.assign(img.style, {
            width: `${width}px`,
            maxWidth: null,
            height: null,
            maxHeight: null,
          });
          break;
        case SCREENCLAMP.shrink:
          Object.assign(img.style, {
            width: null,
            maxWidth: `${width}px`,
            height: null,
            maxHeight: null,
          });
          break;
        default:
          Object.assign(img.style, {
            width: null,
            maxWidth: null,
            height: null,
            maxHeight: null,
          });
      }
    }
    visiblePage?.scrollIntoView();
  }

  function setImagesHeight(fitMode: keyof typeof SCREENCLAMP, height: number) {
    for (const img of images) {
      switch (fitMode) {
        case SCREENCLAMP.fit:
          Object.assign(img.style, {
            height: `${height}px`,
            maxWidth: null,
            width: null,
            maxHeight: null,
          });
          break;
        case SCREENCLAMP.shrink:
          Object.assign(img.style, {
            width: null,
            maxHeight: `${height}px`,
            height: null,
            maxWidth: null,
          });
          break;
        default:
          Object.assign(img.style, {
            width: null,
            maxWidth: null,
            height: null,
            maxHeight: null,
          });
      }
    }
    visiblePage?.scrollIntoView({ inline: 'center' });
  }

  function setImagesDimensions(fitMode: keyof typeof SCREENCLAMP, width: number, height: number) {
    for (const img of images) {
      switch (fitMode) {
        case SCREENCLAMP.fit:
          // Not implemented
          break;
        case SCREENCLAMP.shrink:
          Object.assign(img.style, {
            width: null,
            maxHeight: `${height}px`,
            height: null,
            maxWidth: `${width}px`,
          });
          break;
        default:
          Object.assign(img.style, {
            width: null,
            maxWidth: null,
            height: null,
            maxHeight: null,
          });
      }
    }
    visiblePage?.scrollIntoView();
  }

  function smartFitImages(fitMode: FitDimensions): void {
    for (const { image: img, orientation: orient } of imagesMeta) {
      switch (orient) {
        case ORIENTATION.portrait:
          Object.assign(img.style, {
            width: null,
            maxWidth: null,
            height: null,
            maxHeight: `${fitMode.portrait.height}px`,
          });
          break;
        case ORIENTATION.landscape:
          Object.assign(img.style, {
            width: null,
            maxWidth: `${getWidth()}px`,
            height: null,
            maxHeight: `${fitMode.landscape.height}px`,
          });
          break;
      }
    }
    visiblePage?.scrollIntoView({ inline: 'center' });
  }

  function setDirection(direction: Direction): void {
    scrubberState.viewDirection = direction;
    // intersection observer must be recreated to change the root margin
    intersectObserver.disconnect();
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
    if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
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
    const previewImages = images.map((img) => {
      const previewImage = document.createElement('img');
      previewImage.src = img.src;
      previewImage.classList.add('scrubber-preview-image');
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

  function setupScrubber(): void {
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
    });

    scrubberDiv.addEventListener('mousemove', (event) => {
      const cursorY = event.clientY;
      const cursorYRatio = cursorY / scrubberState.screenHeight;
      const imageIndex = Math.floor(cursorYRatio * images.length);
      const image = scrubberImages[imageIndex];
      if (!image) {
        return;
      }
      if (event.buttons & 1) {
        // Allow left click drag scrubbing
        if (imageIndex !== scrubberState.visiblePageIndex) {
          images[imageIndex]?.scrollIntoView({ inline: 'center' });
        }
      }
      animationDispatcher.addTask('mousemove', () => {
        setMarkerPosition(cursorY);
        setMarkerText(`${imageIndex + 1}`);
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

  function main(): void {
    setupListeners();
    loadSettings();
    checkVersion();
    setupScrubber();
  }

  main();
})();
