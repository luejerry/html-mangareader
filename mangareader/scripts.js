(function() {
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

  const images = Array.from(document.getElementsByClassName('image'));
  const originalWidthBtn = document.getElementById('btn-original-width');
  const shrinkWidthBtn = document.getElementById('btn-shrink-width');
  const fitWidthBtn = document.getElementById('btn-fit-width');
  const smartFitBtns = Array.from(document.getElementsByClassName('btn-smart-fit'));

  const imagesMeta = images.map(image => {
    const ratio = image.naturalWidth / image.naturalHeight;
    return {
      image,
      orientation: ratio > 1 ? 'landscape' : 'portrait',
    };
  });

  window.imagesMeta = imagesMeta;

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
          });
          break;
        case widthClamp.shrink:
          Object.assign(img.style, {
            width: null,
            maxWidth: `${width}px`,
          });
          break;
        default:
          Object.assign(img.style, {
            width: null,
            maxWidth: null,
          });
      }
    }
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
  }

  function setupListeners() {
    originalWidthBtn.addEventListener('click', handleOriginalWidth);
    shrinkWidthBtn.addEventListener('click', handleShrinkWidth);
    fitWidthBtn.addEventListener('click', handleFitWidth);
    for (const button of smartFitBtns) {
      button.addEventListener('click', handleSmartWidth);
    }
  }

  function main() {
    setupListeners();
  }

  main();
})();
