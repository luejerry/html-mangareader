/**
 * Zenscroll 4.0.2 (modified by luejerry)
 * https://github.com/zengabor/zenscroll/
 *
 * Modification (luejerry): set `window.pauseZensmooth` to dynamically disable
 * Modification (luejerry): remove history smoothing
 *
 * Copyright 2015–2018 Gabor Lenard
 *
 * This is free and unencumbered software released into the public domain.
 *
 * Anyone is free to copy, modify, publish, use, compile, sell, or
 * distribute this software, either in source code form or as a compiled
 * binary, for any purpose, commercial or non-commercial, and by any
 * means.
 *
 * In jurisdictions that recognize copyright laws, the author or authors
 * of this software dedicate any and all copyright interest in the
 * software to the public domain. We make this dedication for the benefit
 * of the public at large and to the detriment of our heirs and
 * successors. We intend this dedication to be an overt act of
 * relinquishment in perpetuity of all present and future rights to this
 * software under copyright law.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
 * OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 *
 * For more information, please refer to <http://unlicense.org>
 *
 */

/*jshint devel:true, asi:true */

/*global define */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory());
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    (function install() {
      // To make sure Zenscroll can be referenced from the header, before `body` is available
      if (document && document.body) {
        root.zenscroll = factory();
      } else {
        // retry 9ms later
        setTimeout(install, 9);
      }
    })();
  }
})(this, function () {
  'use strict';

  // Detect if the browser already supports native smooth scrolling (e.g., Firefox 36+ and Chrome 49+) and it is enabled:
  const isNativeSmoothScrollEnabledOn = function (elem) {
    return (
      elem &&
      'getComputedStyle' in window &&
      window.getComputedStyle(elem)['scroll-behavior'] === 'smooth'
    );
  };

  // Exit if it’s not a browser environment:
  if (typeof window === 'undefined' || !('document' in window)) {
    return {};
  }

  const makeScroller = function (container, defaultDuration, edgeOffset) {
    // Use defaults if not provided
    defaultDuration = defaultDuration || 999; //ms
    if (!edgeOffset && edgeOffset !== 0) {
      // When scrolling, this amount of distance is kept from the edges of the container:
      edgeOffset = 9; //px
    }

    // Handling the life-cycle of the scroller
    let scrollTimeoutId;
    const setScrollTimeoutId = function (newValue) {
      scrollTimeoutId = newValue;
    };

    /**
     * Stop the current smooth scroll operation immediately
     */
    const stopScroll = function () {
      cancelAnimationFrame(scrollTimeoutId);
      setScrollTimeoutId(0);
    };

    const getTopWithEdgeOffset = function (elem) {
      return Math.max(0, container.getTopOf(elem) - edgeOffset);
    };

    /**
     * Scrolls to a specific vertical position in the document.
     *
     * @param {targetY} The vertical position within the document.
     * @param {duration} Optionally the duration of the scroll operation.
     *        If not provided the default duration is used.
     * @param {onDone} An optional callback function to be invoked once the scroll finished.
     */
    const scrollToY = function (targetY, duration, onDone) {
      stopScroll();
      if (
        duration === 0 ||
        (duration && duration < 0) ||
        isNativeSmoothScrollEnabledOn(container.body)
      ) {
        container.toY(targetY);
        if (onDone) {
          onDone();
        }
      } else {
        const startY = container.getY();
        const distance = Math.max(0, targetY) - startY;
        const startTime = new Date().getTime();
        duration = duration || Math.min(Math.abs(distance), defaultDuration);
        const task = () => {
          // Calculate percentage:
          const p = Math.min(1, (new Date().getTime() - startTime) / duration);
          // Calculate the absolute vertical position:
          const y = Math.max(
            0,
            Math.floor(startY + distance * (p < 0.5 ? 2 * p * p : p * (4 - p * 2) - 1)),
          );
          container.toY(y);
          if (p < 1 && container.getHeight() + y < container.body.scrollHeight) {
            setScrollTimeoutId(requestAnimationFrame(task));
          } else {
            setTimeout(stopScroll, 99); // with cooldown time
            if (onDone) {
              onDone();
            }
          }
        };
        (function loopScroll() {
          setScrollTimeoutId(requestAnimationFrame(task));
        })();
      }
    };

    /**
     * Scrolls to the top of a specific element.
     *
     * @param {elem} The element to scroll to.
     * @param {duration} Optionally the duration of the scroll operation.
     * @param {onDone} An optional callback function to be invoked once the scroll finished.
     */
    const scrollToElem = function (elem, duration, onDone) {
      scrollToY(getTopWithEdgeOffset(elem), duration, onDone);
    };

    /**
     * Scrolls an element into view if necessary.
     *
     * @param {elem} The element.
     * @param {duration} Optionally the duration of the scroll operation.
     * @param {onDone} An optional callback function to be invoked once the scroll finished.
     */
    const scrollIntoView = function (elem, duration, onDone) {
      const elemHeight = elem.getBoundingClientRect().height;
      const elemBottom = container.getTopOf(elem) + elemHeight;
      const containerHeight = container.getHeight();
      const y = container.getY();
      const containerBottom = y + containerHeight;
      if (getTopWithEdgeOffset(elem) < y || elemHeight + edgeOffset > containerHeight) {
        // Element is clipped at top or is higher than screen.
        scrollToElem(elem, duration, onDone);
      } else if (elemBottom + edgeOffset > containerBottom) {
        // Element is clipped at the bottom.
        scrollToY(elemBottom - containerHeight + edgeOffset, duration, onDone);
      } else if (onDone) {
        onDone();
      }
    };

    /**
     * Scrolls to the center of an element.
     *
     * @param {elem} The element.
     * @param {duration} Optionally the duration of the scroll operation.
     * @param {offset} Optionally the offset of the top of the element from the center of the screen.
     *        A value of 0 is ignored.
     * @param {onDone} An optional callback function to be invoked once the scroll finished.
     */
    const scrollToCenterOf = function (elem, duration, offset, onDone) {
      scrollToY(
        Math.max(
          0,
          container.getTopOf(elem) -
            container.getHeight() / 2 +
            (offset || elem.getBoundingClientRect().height / 2),
        ),
        duration,
        onDone,
      );
    };

    /**
     * Changes default settings for this scroller.
     *
     * @param {newDefaultDuration} Optionally a new value for default duration, used for each scroll method by default.
     *        Ignored if null or undefined.
     * @param {newEdgeOffset} Optionally a new value for the edge offset, used by each scroll method by default. Ignored if null or undefined.
     * @returns An object with the current values.
     */
    const setup = function (newDefaultDuration, newEdgeOffset) {
      if (newDefaultDuration === 0 || newDefaultDuration) {
        defaultDuration = newDefaultDuration;
      }
      if (newEdgeOffset === 0 || newEdgeOffset) {
        edgeOffset = newEdgeOffset;
      }
      return {
        defaultDuration: defaultDuration,
        edgeOffset: edgeOffset,
      };
    };

    return {
      setup: setup,
      to: scrollToElem,
      toY: scrollToY,
      intoView: scrollIntoView,
      center: scrollToCenterOf,
      stop: stopScroll,
      moving: function () {
        return Boolean(scrollTimeoutId);
      },
      getY: container.getY,
      getTopOf: container.getTopOf,
    };
  };

  const docElem = document.documentElement;
  const getDocY = function () {
    return window.scrollY || docElem.scrollTop;
  };

  // Create a scroller for the document:
  const zenscroll = makeScroller({
    body: document.scrollingElement || document.body,
    toY: function (y) {
      window.scrollTo(0, y);
    },
    getY: getDocY,
    getHeight: function () {
      return window.innerHeight || docElem.clientHeight;
    },
    getTopOf: function (elem) {
      return elem.getBoundingClientRect().top + getDocY() - docElem.offsetTop;
    },
  });

  /**
   * Creates a scroller from the provided container element (e.g., a DIV)
   *
   * @param {scrollContainer} The vertical position within the document.
   * @param {defaultDuration} Optionally a value for default duration, used for each scroll method by default.
   *        Ignored if 0 or null or undefined.
   * @param {edgeOffset} Optionally a value for the edge offset, used by each scroll method by default.
   *        Ignored if null or undefined.
   * @returns A scroller object, similar to `zenscroll` but controlling the provided element.
   */
  zenscroll.createScroller = function (scrollContainer, defaultDuration, edgeOffset) {
    return makeScroller(
      {
        body: scrollContainer,
        toY: function (y) {
          scrollContainer.scrollTop = y;
        },
        getY: function () {
          return scrollContainer.scrollTop;
        },
        getHeight: function () {
          return Math.min(scrollContainer.clientHeight, window.innerHeight || docElem.clientHeight);
        },
        getTopOf: function (elem) {
          return elem.offsetTop;
        },
      },
      defaultDuration,
      edgeOffset,
    );
  };

  // Automatic link-smoothing on achors
  // Exclude IE8- or when native is enabled or Zenscroll auto- is disabled
  if (
    'addEventListener' in window &&
    !window.noZensmooth &&
    !isNativeSmoothScrollEnabledOn(document.body)
  ) {
    const isHistorySupported = 'history' in window && 'pushState' in history;
    const isScrollRestorationSupported = isHistorySupported && 'scrollRestoration' in history;

    // On first load & refresh make sure the browser restores the position first
    if (isScrollRestorationSupported) {
      history.scrollRestoration = 'auto';
    }

    window.addEventListener(
      'load',
      function () {
        if (isScrollRestorationSupported) {
          // Set it to manual
          setTimeout(function () {
            history.scrollRestoration = 'manual';
          }, 9);
          window.addEventListener(
            'popstate',
            function (event) {
              if (window.pauseZenscroll) {
                return;
              }
              if (event.state && 'zenscrollY' in event.state) {
                zenscroll.toY(event.state.zenscrollY);
              }
            },
            false,
          );
        }

        // Add edge offset on first load if necessary
        // This may not work on IE (or older computer?) as it requires more timeout, around 100 ms
        if (window.location.hash) {
          setTimeout(function () {
            // Adjustment is only needed if there is an edge offset:
            const edgeOffset = zenscroll.setup().edgeOffset;
            if (edgeOffset) {
              const targetElem = document.getElementById(window.location.href.split('#')[1]);
              if (targetElem) {
                const targetY = Math.max(0, zenscroll.getTopOf(targetElem) - edgeOffset);
                const diff = zenscroll.getY() - targetY;
                // Only do the adjustment if the browser is very close to the element:
                if (0 <= diff && diff < 9) {
                  window.scrollTo(0, targetY);
                }
              }
            }
          }, 9);
        }
      },
      false,
    );

    // Handling clicks on anchors
    const RE_noZensmooth = new RegExp('(^|\\s)noZensmooth(\\s|$)');
    window.addEventListener(
      'click',
      function (event) {
        if (window.pauseZenscroll) {
          return;
        }
        let anchor = event.target;
        while (anchor && anchor.tagName !== 'A') {
          anchor = anchor.parentNode;
        }
        // Let the browser handle the click if it wasn't with the primary button, or with some modifier keys:
        if (
          !anchor ||
          event.which !== 1 ||
          event.shiftKey ||
          event.metaKey ||
          event.ctrlKey ||
          event.altKey
        ) {
          return;
        }
        // Save the current scrolling position so it can be used for scroll restoration:
        if (isScrollRestorationSupported) {
          const historyState =
            history.state && typeof history.state === 'object' ? history.state : {};
          historyState.zenscrollY = zenscroll.getY();
          try {
            history.replaceState(historyState, '');
          } catch (e) {
            // Avoid the Chrome Security exception on file protocol, e.g., file://index.html
          }
        }
        // Find the referenced ID:
        const href = anchor.getAttribute('href') || '';
        if (href.indexOf('#') === 0 && !RE_noZensmooth.test(anchor.className)) {
          let targetY = 0;
          const targetElem = document.getElementById(href.substring(1));
          if (href !== '#') {
            if (!targetElem) {
              // Let the browser handle the click if the target ID is not found.
              return;
            }
            targetY = zenscroll.getTopOf(targetElem);
          }
          event.preventDefault();
          // By default trigger the browser's `hashchange` event...
          let onDone = function () {
            window.location = href;
          };
          // ...unless there is an edge offset specified
          const edgeOffset = zenscroll.setup().edgeOffset;
          if (edgeOffset) {
            targetY = Math.max(0, targetY - edgeOffset);
            // (luejerry) disable history pushing
            // if (isHistorySupported) {
            //   onDone = function() {
            //     history.pushState({}, '', href);
            //   };
            // }
          }
          zenscroll.toY(targetY, null, onDone);
        }
      },
      false,
    );
  }

  return zenscroll;
});
