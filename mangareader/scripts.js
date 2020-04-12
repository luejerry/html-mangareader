(function () {
  const versionCheckUrl = 'https://api.github.com/repos/luejerry/html-mangareader/contents/version';
  const storageKey = 'mangareader-config';

  const defaultConfig = {
    smoothScroll: true,
    darkMode: false,
    seamless: false,
  };

  const widthClamp = {
    none: 'none',
    shrink: 'shrink',
    fit: 'fit',
  };

  const orientation = {
    portrait: 'portrait',
    square: 'square',
    landscape: 'landscape',
  };

  const smartFit = {
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

  const pages = Array.from(document.getElementsByClassName('page'));
  const images = Array.from(document.getElementsByClassName('image'));
  const originalWidthBtn = document.getElementById('btn-original-width');
  const shrinkWidthBtn = document.getElementById('btn-shrink-width');
  const fitWidthBtn = document.getElementById('btn-fit-width');
  const smartFitBtns = Array.from(document.getElementsByClassName('btn-smart-fit'));
  const smoothScrollCheckbox = document.getElementById('input-smooth-scroll');
  const darkModeCheckbox = document.getElementById('input-dark-mode');
  const seamlessCheckbox = document.getElementById('input-seamless');

  let visiblePage;

  const intersectThreshold = 0.2;
  const intersectObserver = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.intersectionRatio > intersectThreshold)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        .map((entry) => entry.target)
        .forEach((target, index) => {
          if (!index) {
            visiblePage = target;
            // Update the URL hash as user scrolls.
            const url = new URL(location.href);
            url.hash = target.id;
            history.replaceState(null, '', url.toString());
          }
        });
    },
    { threshold: [intersectThreshold] },
  );

  const imagesMeta = images.map((image) => {
    const ratio = image.naturalWidth / image.naturalHeight;
    return {
      image,
      orientation: ratio > 1 ? 'landscape' : 'portrait',
    };
  });

  function readConfig() {
    let config;
    try {
      // Unfortunately Edge does not allow localStorage access for file:// urls
      config = localStorage.getItem(storageKey);
    } catch (err) {
      console.error(err);
    }
    return config ? JSON.parse(config) : defaultConfig;
  }

  function writeConfig(config) {
    const oldConfig = readConfig();
    const newConfig = Object.assign({}, oldConfig, config);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newConfig));
    } catch (err) {
      console.error(err);
    }
  }

  function loadSettings() {
    const config = readConfig();
    setupZenscroll(config);
    setupDarkMode(config);
    setupSeamless(config);
  }

  function setupZenscroll(config) {
    window.zenscroll.setup(170);
    if (config.smoothScroll) {
      smoothScrollCheckbox.checked = true;
    } else {
      window.pauseZenscroll = true;
    }
  }

  function setupDarkMode(config) {
    darkModeCheckbox.checked = config.darkMode;
    // Setting `checked` does not fire the `change` event, so we must dispatch it manually
    if (config.darkMode) {
      const change = document.createEvent('Event');
      change.initEvent('change', false, true);
      darkModeCheckbox.dispatchEvent(change);
    }
  }

  function setupSeamless(config) {
    seamlessCheckbox.checked = config.seamless;
    if (config.seamless) {
      const change = document.createEvent('Event');
      change.initEvent('change', false, true);
      seamlessCheckbox.dispatchEvent(change);
    }
  }

  function asyncTimeout(millis) {
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(), millis);
    });
  }

  function getWidth() {
    return window.innerWidth - 16;
  }

  function handleOriginalWidth() {
    setImagesWidth(widthClamp.none, getWidth());
  }

  function handleFitWidth() {
    setImagesWidth(widthClamp.fit, getWidth());
  }

  function handleShrinkWidth() {
    setImagesWidth(widthClamp.shrink, getWidth());
  }

  function handleSmartWidth(event) {
    const key = event.target.dataset.fitKey;
    smartFitImages(smartFit[key]);
  }

  function setImagesWidth(fitMode, width) {
    for (const img of images) {
      switch (fitMode) {
        case widthClamp.fit:
          Object.assign(img.style, {
            width: `${width}px`,
            maxWidth: null,
            maxHeight: null,
          });
          break;
        case widthClamp.shrink:
          Object.assign(img.style, {
            width: null,
            maxWidth: `${width}px`,
            maxHeight: null,
          });
          break;
        default:
          Object.assign(img.style, {
            width: null,
            maxWidth: null,
            maxHeight: null,
          });
      }
    }
    visiblePage.scrollIntoView();
  }

  function smartFitImages(fitMode) {
    for (const { image: img, orientation: orient } of imagesMeta) {
      switch (orient) {
        case orientation.portrait:
          Object.assign(img.style, {
            maxHeight: `${fitMode.portrait.height}px`,
          });
          break;
        case orientation.landscape:
          Object.assign(img.style, {
            maxWidth: `${getWidth()}px`,
            maxHeight: `${fitMode.landscape.height}px`,
          });
          break;
      }
    }
    visiblePage.scrollIntoView({ behavior: 'smooth' });
  }

  function handleSmoothScroll(event) {
    window.pauseZenscroll = !event.target.checked;
    writeConfig({
      smoothScroll: event.target.checked,
    });
  }

  function handleDarkMode(event) {
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

  function handleSeamless(event) {
    const seamlessEnabled = event.target.checked;
    if (seamlessEnabled) {
      document.body.classList.add('seamless');
    } else {
      document.body.classList.remove('seamless');
    }
    writeConfig({
      seamless: seamlessEnabled,
    });
    visiblePage.scrollIntoView();
  }

  function setupListeners() {
    originalWidthBtn.addEventListener('click', handleOriginalWidth);
    shrinkWidthBtn.addEventListener('click', handleShrinkWidth);
    fitWidthBtn.addEventListener('click', handleFitWidth);
    for (const button of smartFitBtns) {
      button.addEventListener('click', handleSmartWidth);
    }
    smoothScrollCheckbox.addEventListener('change', handleSmoothScroll);
    darkModeCheckbox.addEventListener('change', handleDarkMode);
    seamlessCheckbox.addEventListener('change', handleSeamless);
  }

  function attachIntersectObservers() {
    for (const page of pages) {
      intersectObserver.observe(page);
    }
  }

  async function checkVersion() {
    const response = await fetch(versionCheckUrl, { method: 'GET', mode: 'cors' }).then((r) =>
      r.json(),
    );
    const remoteVersion = atob(response.content);
    const localVersion = document.getElementById('version').innerText;
    const compare = versionComparator(localVersion, remoteVersion);
    if (compare > 0) {
      const nextVersionSpan = document.getElementById('next-version');
      const linkUpdate = document.getElementById('link-update');
      const updateToast = document.getElementById('update-toast');
      nextVersionSpan.innerText = remoteVersion;
      linkUpdate.href = 'https://github.com/luejerry/html-mangareader/releases';
      Object.assign(updateToast.style, { display: 'initial' });
      await asyncTimeout(0);
      updateToast.classList.add('show');
      await asyncTimeout(5000);
      updateToast.classList.remove('show');
    }
  }

  /**
   * Basic semver comparator. Only works with numbers, e.g. 1.2.1. Returns positive if target newer
   * than source, negative if target older than source, or zero if equal.
   * @param {string} source
   * @param {string} target
   */
  function versionComparator(source, target) {
    const sourceParts = source.split('.').map((num) => parseInt(num, 10));
    const targetParts = target.split('.').map((num) => parseInt(num, 10));

    const recursor = (s, t) => {
      if (!s.length && !t.length) {
        return 0;
      } else if (!s.length) {
        return t[0];
      } else if (!t.length) {
        return -s[0];
      }
      const diff = t[0] - s[0];
      return diff === 0 ? recursor(s.slice(1), t.slice(1)) : diff;
    };

    return recursor(sourceParts, targetParts);
  }

  function main() {
    setupListeners();
    loadSettings();
    attachIntersectObservers();
    checkVersion();
  }

  main();
})();
