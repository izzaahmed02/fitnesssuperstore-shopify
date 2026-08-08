/*
 * Build Your Own Rig (BYOR) configurator.
 *
 * Hybrid model per the v8 direction: standard layout cards pick a starting
 * point, the guided configurator underneath resolves the actual parts list.
 * Valid standard builds add to cart; anything on the quote-gate list is routed
 * to a layout/quote review instead of being forced through checkout.
 *
 * All titles, prices, images and availability come from live Shopify product
 * data fetched at runtime. Nothing about price or stock is hard-coded here.
 */
(function () {
  'use strict';

  var DATA = (window.BYOR && window.BYOR.data) || null;
  if (!DATA) return;

  var money = function (cents) {
    if (typeof cents !== 'number' || isNaN(cents)) return '';
    return (
      '$' +
      (cents / 100).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    );
  };

  var el = function (tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };

  /* -------------------------------------------------------------------------
   * Catalog — resolves roster SKUs against live storefront product data.
   * ---------------------------------------------------------------------- */
  function Catalog() {
    this.bySku = {};
    this.missing = {};
    this.ready = null;
  }

  Catalog.prototype.load = function () {
    if (this.ready) return this.ready;
    var self = this;
    var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';

    var fromCollections = DATA.sourceCollections.map(function (handle) {
      return self.crawlCollection(root, handle);
    });

    this.ready = Promise.all(fromCollections)
      .then(function () {
        // Anything the collections did not cover is fetched one by one. Handles
        // that 404 (hidden, unpublished, archived) stay unresolved on purpose.
        var pending = Object.keys(DATA.roster).filter(function (sku) {
          return !self.bySku[sku];
        });
        return self.fetchEach(root, pending);
      })
      .then(function () {
        Object.keys(DATA.roster).forEach(function (sku) {
          if (!self.bySku[sku]) self.missing[sku] = true;
        });
        return self;
      });

    return this.ready;
  };

  Catalog.prototype.crawlCollection = function (root, handle) {
    var self = this;
    var page = 1;

    function next() {
      return fetch(root + 'collections/' + handle + '/products.json?limit=50&page=' + page)
        .then(function (res) {
          return res.ok ? res.json() : { products: [] };
        })
        .then(function (payload) {
          var products = (payload && payload.products) || [];
          products.forEach(function (product) {
            self.absorb(product);
          });
          if (products.length === 50 && page < 6) {
            page += 1;
            return next();
          }
          return null;
        })
        .catch(function () {
          return null;
        });
    }

    return next();
  };

  Catalog.prototype.fetchEach = function (root, skus) {
    var self = this;
    var queue = skus.slice();

    function worker() {
      if (!queue.length) return Promise.resolve();
      var sku = queue.shift();
      var handle = DATA.roster[sku];
      return fetch(root + 'products/' + handle + '.js')
        .then(function (res) {
          return res.ok ? res.json() : null;
        })
        .then(function (product) {
          if (product) self.absorb(product);
        })
        .catch(function () {})
        .then(worker);
    }

    var lanes = [];
    for (var i = 0; i < 4; i++) lanes.push(worker());
    return Promise.all(lanes);
  };

  Catalog.prototype.absorb = function (product) {
    var self = this;
    var variants = product.variants || [];
    variants.forEach(function (variant) {
      var sku = variant.sku;
      if (!sku || !DATA.roster[sku] || self.bySku[sku]) return;
      self.bySku[sku] = {
        sku: sku,
        variantId: variant.id,
        title: product.title,
        handle: product.handle,
        url: '/products/' + product.handle,
        // /products.json returns a decimal string, /products/x.js returns cents.
        price: typeof variant.price === 'string' ? Math.round(parseFloat(variant.price) * 100) : variant.price,
        available: variant.available !== false,
        image: (product.images && product.images[0] && (product.images[0].src || product.images[0])) || product.featured_image || ''
      };
    });
  };

  Catalog.prototype.get = function (sku) {
    return this.bySku[sku] || null;
  };

  /* -------------------------------------------------------------------------
   * Build state and rules engine.
   * ---------------------------------------------------------------------- */
  function newState() {
    return {
      layoutId: null,
      mounting: null,
      uprights: {},
      depth: null,
      spacing: null,
      topStyle: null,
      sectionBars: {},
      gapBars: {},
      secondRow: false,
      secondRowSectionBars: {},
      secondRowGapBars: {},
      hooks: 'none',
      hookQty: {},
      storage: {},
      extras: {},
      siteUncertain: false
    };
  }

  var Rules = {
    totalPairs: function (state) {
      return Object.keys(state.uprights).reduce(function (sum, height) {
        return sum + (state.uprights[height] || 0);
      }, 0);
    },

    /* Uprights are ordered in pairs. Floor mounted needs four uprights to make
     * a section, wall mounted needs two. Half sections are possible (six floor
     * uprights is a section and a half) but never labelled as half a rig. */
    sections: function (state) {
      var pairs = Rules.totalPairs(state);
      if (!pairs) return 0;
      return state.mounting === 'wall' ? pairs : pairs / 2;
    },

    /* Number of "over squat rack" positions — a half bay still has a top. */
    sectionSlots: function (state) {
      return Math.ceil(Rules.sections(state));
    },

    gaps: function (state) {
      return Math.max(0, Rules.sectionSlots(state) - 1);
    },

    /* Floor mounted takes two width bars per position, wall mounted takes one. */
    barsPerPosition: function (state) {
      return state.mounting === 'wall' ? 1 : 2;
    },

    hasHalfSection: function (state) {
      var sections = Rules.sections(state);
      return sections > 0 && Math.abs(sections - Math.round(sections)) > 0.001;
    },

    mixedUprightHeights: function (state) {
      return Object.keys(state.uprights).filter(function (height) {
        return state.uprights[height] > 0;
      }).length > 1;
    },

    /* Step 5 top styles available for the current mounting type. Monkey bar
     * tops are floor mounted only. */
    topStyles: function (state) {
      var styles = [
        { id: 'basic', label: 'Basic', note: 'Junction bar pull-up bar tops.' },
        { id: 'basic_cm', label: 'Basic w/Crossmembers', note: 'Crossmember tops — needed for multi-grip bars.' }
      ];
      if (state.mounting === 'floor') {
        styles.unshift({
          id: 'monkey',
          label: 'Monkey Bar',
          note: 'Monkey bar run across the rig. Locks width bars to crossmembers.'
        });
      }
      return styles;
    },

    /* Choosing a monkey bar top forces crossmembers on Steps 6 and 7 —
     * the monkey bars need a crossmember to land on. */
    forcesCrossmembers: function (state) {
      return state.topStyle === 'monkey';
    },

    /* Over-squat-rack bars are always 43" — sections are always 43" wide.
     * Bars between sections follow the spacing chosen in Step 4. */
    sectionBarSize: function () {
      return 43;
    },

    gapBarSize: function (state) {
      return state.spacing;
    },

    /* Depth bars implied by the top style, per the BYOR logic sheet. */
    frameBars: function (state) {
      var out = {};
      var n = Rules.sectionSlots(state);
      var depth = state.depth;
      if (!n || !depth || !state.topStyle) return out;

      var add = function (sku, qty) {
        if (!sku || qty <= 0) return;
        out[sku] = (out[sku] || 0) + qty;
      };

      if (state.topStyle === 'basic') {
        add('FF-RR-JB-' + depth + '-V2PU', 2 * n);
        return out;
      }

      if (state.topStyle === 'basic_cm') {
        // Wall mounted shares a crossmember between adjacent sections.
        add('FF-RR-JBS-' + depth + '-V1-CM', state.mounting === 'wall' ? 2 * n - 1 : 2 * n);
        return out;
      }

      // Monkey bar (floor mounted only).
      var pullUpBars;
      if (n === 1) {
        pullUpBars = 3;
      } else {
        var base = state.spacing === 71 ? 11 : 9;
        var perExtra = state.spacing === 71 ? 8 : 6;
        pullUpBars = base + (n - 2) * perExtra;
      }
      add('FF-RR-PB-' + depth, pullUpBars);
      add('FF-RR-JB-' + depth + '-V2PU', 2 * n);
      return out;
    },

    /* Width bar options for a position, filtered by what the top style allows. */
    widthBarOptions: function (state, size) {
      var options = DATA.widthBars[size] || [];
      var crossmemberTop = state.topStyle === 'basic_cm' || state.topStyle === 'monkey';
      return options.filter(function (option) {
        return crossmemberTop || !option.crossmemberOnly;
      });
    },

    /* Spacings of 20" and 96" are not a bar choice — the crossmember is fixed. */
    fixedGapSku: function (state) {
      return DATA.fixedSpacingCrossmember[state.spacing] || null;
    },

    /* Storage tiers hang in the span between sections: floor mounted, two
     * sections and up, and only where the span is a 43" or 71" run. */
    storageAvailable: function (state) {
      return (
        state.mounting === 'floor' &&
        Rules.sections(state) >= 2 &&
        (state.spacing === 43 || state.spacing === 71)
      );
    }
  };

  /* Resolve the full bill of materials for the current state. */
  function billOfMaterials(state) {
    var lines = {};
    var perPosition = Rules.barsPerPosition(state);
    var slots = Rules.sectionSlots(state);
    var gaps = Rules.gaps(state);

    var add = function (sku, qty) {
      if (!sku || qty <= 0) return;
      lines[sku] = (lines[sku] || 0) + qty;
    };

    Object.keys(state.uprights).forEach(function (height) {
      var pairs = state.uprights[height] || 0;
      var match = DATA.uprightHeights.filter(function (u) {
        return String(u.height) === String(height);
      })[0];
      if (match) add(match.sku, pairs * 2);
    });

    var frame = Rules.frameBars(state);
    Object.keys(frame).forEach(function (sku) {
      add(sku, frame[sku]);
    });

    if (Rules.forcesCrossmembers(state)) {
      add('FF-RR-JBS-43-V1-CM', perPosition * slots);
      if (gaps > 0) {
        var forcedGapSku = Rules.fixedGapSku(state) || 'FF-RR-JBS-' + state.spacing + '-V1-CM';
        add(forcedGapSku, perPosition * gaps);
      }
    } else {
      for (var s = 0; s < slots; s++) {
        var picks = state.sectionBars[s] || {};
        Object.keys(picks).forEach(function (sku) {
          add(sku, picks[sku]);
        });
      }
      var fixedGap = Rules.fixedGapSku(state);
      for (var g = 0; g < gaps; g++) {
        if (fixedGap) {
          add(fixedGap, perPosition);
        } else {
          var gapPicks = state.gapBars[g] || {};
          Object.keys(gapPicks).forEach(function (sku) {
            add(sku, gapPicks[sku]);
          });
        }
      }
    }

    if (state.secondRow) {
      for (var s2 = 0; s2 < slots; s2++) {
        var row = state.secondRowSectionBars[s2] || {};
        Object.keys(row).forEach(function (sku) {
          add(sku, row[sku]);
        });
      }
      for (var g2 = 0; g2 < gaps; g2++) {
        var rowGap = state.secondRowGapBars[g2] || {};
        Object.keys(rowGap).forEach(function (sku) {
          add(sku, rowGap[sku]);
        });
      }
    }

    if (state.hooks !== 'none') {
      Object.keys(state.hookQty).forEach(function (sku) {
        add(sku, state.hookQty[sku]);
      });
    }

    Object.keys(state.storage).forEach(function (gapIndex) {
      var picks = state.storage[gapIndex] || {};
      Object.keys(picks).forEach(function (sku) {
        add(sku, picks[sku]);
      });
    });

    Object.keys(state.extras).forEach(function (sku) {
      add(sku, state.extras[sku]);
    });

    return lines;
  }

  /* What still needs answering before the build is orderable. */
  function outstanding(state) {
    var todo = [];
    if (!state.mounting) todo.push('Choose wall mounted or free standing.');
    if (Rules.sections(state) < 1) todo.push('Choose your uprights — one section is the smallest rig we build.');
    if (!state.depth) todo.push('Choose your rig depth.');
    if (Rules.sectionSlots(state) >= 2 && !state.spacing) todo.push('Choose the spacing between sections.');
    if (!state.topStyle) todo.push('Choose your depth bar style.');

    if (state.topStyle && !Rules.forcesCrossmembers(state)) {
      var perPosition = Rules.barsPerPosition(state);
      var slots = Rules.sectionSlots(state);
      for (var s = 0; s < slots; s++) {
        if (sumQty(state.sectionBars[s]) !== perPosition) {
          todo.push('Section ' + (s + 1) + ' needs exactly ' + perPosition + ' width bar' + (perPosition > 1 ? 's' : '') + ' over the squat rack.');
        }
      }
      if (!Rules.fixedGapSku(state)) {
        var gaps = Rules.gaps(state);
        for (var g = 0; g < gaps; g++) {
          if (sumQty(state.gapBars[g]) !== perPosition) {
            todo.push('Span ' + (g + 1) + ' needs exactly ' + perPosition + ' width bar' + (perPosition > 1 ? 's' : '') + ' between sections.');
          }
        }
      }
    }

    if (state.hooks !== 'none' && !sumQty(state.hookQty)) {
      todo.push('Choose your J-hooks and spotter arms, or switch that step back to "No thanks".');
    }

    return todo;
  }

  /* Reasons this build goes to quote review rather than straight to cart. */
  function quoteReasons(state, catalog, lines) {
    var reasons = [];
    var sections = Rules.sections(state);

    if (sections >= 4) reasons.push('4 or more sections');
    if (Rules.hasHalfSection(state)) reasons.push('Half-section (expansion bay) layout — frame quantities confirmed by our product team before it ships');
    if (Rules.mixedUprightHeights(state)) reasons.push('Mixed upright heights — these need angled junction bars');

    var quoteOnlySkus = {};
    DATA.otherAttachments.forEach(function (item) {
      if (item.quoteOnly) quoteOnlySkus[item.sku] = true;
    });
    quoteOnlySkus['FF-RR-AJB-43'] = true;
    quoteOnlySkus['FF-RR-AJB-71'] = true;

    var flagged = [];
    var unresolved = [];
    Object.keys(lines).forEach(function (sku) {
      if (quoteOnlySkus[sku]) flagged.push(sku);
      var product = catalog.get(sku);
      if (!product || !product.available) unresolved.push(sku);
    });

    if (flagged.length) {
      reasons.push('Cable, lat or low-row integration selected — we size the anchoring for these per site');
    }
    if (unresolved.length) {
      reasons.push('One or more selected parts are not available for self-serve checkout right now');
    }
    if (state.siteUncertain) {
      reasons.push('Ceiling height, flooring or anchoring still to be confirmed');
    }

    return reasons;
  }

  function sumQty(map) {
    if (!map) return 0;
    return Object.keys(map).reduce(function (sum, key) {
      return sum + (map[key] || 0);
    }, 0);
  }

  /* -------------------------------------------------------------------------
   * UI
   * ---------------------------------------------------------------------- */
  class BYORConfigurator extends HTMLElement {}

  BYORConfigurator.prototype.connectedCallback = function () {
    if (this.initialised) return;
    this.initialised = true;

    this.state = newState();
    this.catalog = new Catalog();

    this.layoutGrid = this.querySelector('[data-byor-layouts]');
    this.stepsHost = this.querySelector('[data-byor-steps]');
    this.summaryHost = this.querySelector('[data-byor-summary]');
    this.statusHost = this.querySelector('[data-byor-status]');
    this.quotePanel = this.querySelector('[data-byor-quote-panel]');
    this.quoteField = this.querySelector('[data-byor-quote-details]');
    this.addButton = this.querySelector('[data-byor-add]');

    var self = this;
    if (this.addButton) {
      this.addButton.addEventListener('click', function () {
        self.addToCart();
      });
    }

    this.renderLayouts();
    this.setStatus('Loading current pricing and availability…');

    this.catalog.load().then(function () {
      self.catalogReady = true;
      self.render();
    });
  };

  BYORConfigurator.prototype.setStatus = function (message) {
    if (this.statusHost) this.statusHost.textContent = message || '';
  };

  BYORConfigurator.prototype.renderLayouts = function () {
    if (!this.layoutGrid) return;
    var self = this;
    this.layoutGrid.innerHTML = '';

    DATA.layouts.forEach(function (layout) {
      var card = el('button', 'byor-layout-card');
      card.type = 'button';
      card.setAttribute('data-layout', layout.id);
      card.setAttribute('aria-pressed', 'false');

      card.appendChild(el('span', 'byor-layout-card__name', layout.name));
      card.appendChild(el('span', 'byor-layout-card__summary', layout.summary));
      card.appendChild(el('span', 'byor-layout-card__best', layout.bestFor));
      if (layout.quoteOnly) {
        card.appendChild(el('span', 'byor-tag byor-tag--quote', 'Quote review'));
      }

      card.addEventListener('click', function () {
        self.applyLayout(layout);
      });

      self.layoutGrid.appendChild(card);
    });
  };

  BYORConfigurator.prototype.applyLayout = function (layout) {
    var state = newState();
    state.layoutId = layout.id;

    if (layout.preset) {
      state.mounting = layout.preset.mounting;
      state.depth = layout.preset.depth;
      state.spacing = layout.preset.spacing;
      state.topStyle = layout.preset.topStyle;
      Object.keys(layout.preset.uprights).forEach(function (height) {
        state.uprights[height] = layout.preset.uprights[height];
      });
    }

    this.state = state;
    this.render();

    var steps = this.querySelector('[data-byor-steps]');
    if (steps && typeof steps.scrollIntoView === 'function') {
      steps.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  BYORConfigurator.prototype.render = function () {
    var self = this;

    if (this.layoutGrid) {
      Array.prototype.forEach.call(this.layoutGrid.children, function (card) {
        var active = card.getAttribute('data-layout') === self.state.layoutId;
        card.classList.toggle('is-selected', active);
        card.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    this.renderSteps();
    this.renderSummary();
  };

  BYORConfigurator.prototype.renderSteps = function () {
    if (!this.stepsHost) return;
    var self = this;
    var state = this.state;
    this.stepsHost.innerHTML = '';

    // Step 1 — mounting type
    this.stepsHost.appendChild(
      this.buildStep(1, 'Rig mounting type', 'This sets what every step below can offer.', function (body) {
        body.appendChild(
          self.choiceRow(
            [
              { value: 'wall', label: 'Wall mounted' },
              { value: 'floor', label: 'Free standing (floor mounted)' }
            ],
            state.mounting,
            function (value) {
              state.mounting = value;
              state.topStyle = null;
              state.sectionBars = {};
              state.gapBars = {};
              self.render();
            }
          )
        );
      })
    );

    if (!state.mounting) return;

    // Step 2 — uprights
    this.stepsHost.appendChild(
      this.buildStep(
        2,
        'Choose your upright height',
        state.mounting === 'wall'
          ? 'Uprights are ordered in pairs. Each pair is one wall mounted section.'
          : 'Uprights are ordered in pairs. Two pairs make a full section; a third pair adds an expansion bay.',
        function (body) {
          DATA.uprightHeights.forEach(function (upright) {
            var product = self.catalog.get(upright.sku);
            body.appendChild(
              self.quantityRow({
                sku: upright.sku,
                product: product,
                labelSuffix: ' — sold in pairs',
                value: state.uprights[upright.height] || 0,
                unit: 'pairs',
                onChange: function (value) {
                  state.uprights[upright.height] = value;
                  state.sectionBars = {};
                  state.gapBars = {};
                  state.secondRowSectionBars = {};
                  state.secondRowGapBars = {};
                  state.storage = {};
                  self.render();
                }
              })
            );
          });

          var sections = Rules.sections(state);
          var note = el('p', 'byor-note');
          if (sections === 0) {
            note.textContent = 'One section is the smallest rig we build.';
          } else if (sections < 1) {
            note.textContent = 'That is less than one section — add another pair of uprights.';
            note.classList.add('byor-note--warn');
          } else {
            note.textContent = 'That builds ' + formatSections(sections) + '.';
          }
          body.appendChild(note);
        }
      )
    );

    if (Rules.sections(state) < 1) return;

    // Step 3 — depth
    this.stepsHost.appendChild(
      this.buildStep(3, 'Choose your rig depth', 'This sets the length of your depth bars.', function (body) {
        body.appendChild(
          self.choiceRow(
            DATA.depths.map(function (depth) {
              return { value: depth, label: depth + '"' };
            }),
            state.depth,
            function (value) {
              state.depth = value;
              self.render();
            }
          )
        );
      })
    );

    if (!state.depth) return;

    // Step 4 — spacing between sections
    if (Rules.sectionSlots(state) >= 2) {
      this.stepsHost.appendChild(
        this.buildStep(4, 'Choose your spacing between sections', 'The span between each pair of sections.', function (body) {
          body.appendChild(
            self.choiceRow(
              DATA.spacings.map(function (spacing) {
                return { value: spacing, label: spacing + '"' };
              }),
              state.spacing,
              function (value) {
                state.spacing = value;
                state.gapBars = {};
                state.secondRowGapBars = {};
                state.storage = {};
                self.render();
              }
            )
          );
          if (Rules.fixedGapSku(state)) {
            body.appendChild(
              el('p', 'byor-note', 'At this span the crossmember is fixed — we add it for you.')
            );
          }
        })
      );
      if (!state.spacing) return;
    }

    // Step 5 — depth bar style
    this.stepsHost.appendChild(
      this.buildStep(5, 'Choose your depth bar style', 'One choice for the whole rig.', function (body) {
        body.appendChild(
          self.choiceRow(
            Rules.topStyles(state).map(function (style) {
              return { value: style.id, label: style.label, note: style.note };
            }),
            state.topStyle,
            function (value) {
              state.topStyle = value;
              state.sectionBars = {};
              state.gapBars = {};
              self.render();
            }
          )
        );
        if (Rules.forcesCrossmembers(state)) {
          body.appendChild(
            el(
              'p',
              'byor-note',
              'A monkey bar top lands on crossmembers, so your width bars are set to crossmembers for you.'
            )
          );
        }
      })
    );

    if (!state.topStyle) return;

    var perPosition = Rules.barsPerPosition(state);
    var slots = Rules.sectionSlots(state);
    var gaps = Rules.gaps(state);

    // Step 6 — width bars over the squat rack
    if (!Rules.forcesCrossmembers(state)) {
      this.stepsHost.appendChild(
        this.buildStep(
          6,
          'Choose your width bar style (over squat rack)',
          'Pick ' + perPosition + ' per section. Sections are always 43" wide.',
          function (body) {
            for (var index = 0; index < slots; index++) {
              body.appendChild(
                self.barPicker({
                  heading: 'Section ' + (index + 1),
                  size: Rules.sectionBarSize(),
                  required: perPosition,
                  picks: state.sectionBars[index] || {},
                  onChange: (function (i) {
                    return function (picks) {
                      state.sectionBars[i] = picks;
                      self.render();
                    };
                  })(index)
                })
              );
            }
          }
        )
      );
    }

    // Step 7 — width bars between sections
    if (gaps > 0 && !Rules.forcesCrossmembers(state) && !Rules.fixedGapSku(state)) {
      this.stepsHost.appendChild(
        this.buildStep(
          7,
          'Choose your width bar style (between sections)',
          'Pick ' + perPosition + ' per span. These are ' + state.spacing + '" bars.',
          function (body) {
            for (var index = 0; index < gaps; index++) {
              body.appendChild(
                self.barPicker({
                  heading: 'Span ' + (index + 1),
                  size: Rules.gapBarSize(state),
                  required: perPosition,
                  picks: state.gapBars[index] || {},
                  onChange: (function (i) {
                    return function (picks) {
                      state.gapBars[i] = picks;
                      self.render();
                    };
                  })(index)
                })
              );
            }
          }
        )
      );
    }

    // Step 8 — optional second row of bars
    this.stepsHost.appendChild(
      this.buildStep(8, 'Add another row of bars?', 'Optional second row at a lower hole position.', function (body) {
        body.appendChild(
          self.choiceRow(
            [
              { value: false, label: 'No thanks' },
              { value: true, label: 'Yes' }
            ],
            state.secondRow,
            function (value) {
              state.secondRow = value;
              if (!value) {
                state.secondRowSectionBars = {};
                state.secondRowGapBars = {};
              }
              self.render();
            }
          )
        );

        if (!state.secondRow) return;

        for (var index = 0; index < slots; index++) {
          body.appendChild(
            self.barPicker({
              heading: 'Second row — section ' + (index + 1),
              size: Rules.sectionBarSize(),
              max: perPosition,
              picks: state.secondRowSectionBars[index] || {},
              onChange: (function (i) {
                return function (picks) {
                  state.secondRowSectionBars[i] = picks;
                  self.render();
                };
              })(index)
            })
          );
        }

        if (state.spacing === 43 || state.spacing === 71) {
          for (var gapIndex = 0; gapIndex < gaps; gapIndex++) {
            body.appendChild(
              self.barPicker({
                heading: 'Second row — span ' + (gapIndex + 1),
                size: state.spacing,
                max: perPosition,
                picks: state.secondRowGapBars[gapIndex] || {},
                onChange: (function (i) {
                  return function (picks) {
                    state.secondRowGapBars[i] = picks;
                    self.render();
                  };
                })(gapIndex)
              })
            );
          }
        }
      })
    );

    // Step 9 — J-hooks and spotter arms
    this.stepsHost.appendChild(
      this.buildStep(9, 'Add spotter arms and J-hooks?', 'Sold in pairs.', function (body) {
        body.appendChild(
          self.choiceRow(
            [
              { value: 'none', label: 'No thanks' },
              { value: 'jhooks', label: 'Yes, J-hooks only' },
              { value: 'both', label: 'Yes, J-hooks and spotter arms' }
            ],
            state.hooks,
            function (value) {
              state.hooks = value;
              state.hookQty = {};
              self.render();
            }
          )
        );

        if (state.hooks === 'none') return;

        var max = slots * perPosition;
        var skus = DATA.jHooksAndSpotters.jhooks.slice();
        if (state.hooks === 'both') skus = skus.concat(DATA.jHooksAndSpotters.spotters);

        body.appendChild(el('p', 'byor-note', 'Up to ' + max + ' pairs of each for this rig.'));

        skus.forEach(function (sku) {
          body.appendChild(
            self.quantityRow({
              sku: sku,
              product: self.catalog.get(sku),
              value: state.hookQty[sku] || 0,
              max: max,
              unit: 'pairs',
              onChange: function (value) {
                state.hookQty[sku] = value;
                self.render();
              }
            })
          );
        });
      })
    );

    // Step 10 — storage tiers between sections
    if (Rules.storageAvailable(state)) {
      this.stepsHost.appendChild(
        this.buildStep(10, 'Select storage racks', 'Storage tiers hang in the span between sections. Up to 5 per span.', function (body) {
          for (var index = 0; index < gaps; index++) {
            body.appendChild(el('h4', 'byor-subheading', 'Span ' + (index + 1)));
            var picks = state.storage[index] || {};
            (DATA.storageTiers[state.spacing] || []).forEach(
              (function (i, currentPicks) {
                return function (sku) {
                  body.appendChild(
                    self.quantityRow({
                      sku: sku,
                      product: self.catalog.get(sku),
                      value: currentPicks[sku] || 0,
                      max: 5,
                      capTotal: 5,
                      currentTotal: sumQty(currentPicks),
                      onChange: function (value) {
                        var next = Object.assign({}, state.storage[i] || {});
                        next[sku] = value;
                        state.storage[i] = next;
                        self.render();
                      }
                    })
                  );
                };
              })(index, picks)
            );
          }
        })
      );
    }

    // Step 11 — other attachments
    this.stepsHost.appendChild(
      this.buildStep(11, 'Other attachments', 'Add as many as you like.', function (body) {
        DATA.otherAttachments.forEach(function (item) {
          var product = self.catalog.get(item.sku);
          body.appendChild(
            self.quantityRow({
              sku: item.sku,
              product: product,
              quoteOnly: item.quoteOnly,
              value: state.extras[item.sku] || 0,
              onChange: function (value) {
                state.extras[item.sku] = value;
                self.render();
              }
            })
          );
        });
      })
    );

    // Site check — drives the anchoring / ceiling height quote gate.
    var siteStep = this.buildStep(null, 'Anything we should check first?', '', function (body) {
      var label = el('label', 'byor-check');
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = state.siteUncertain;
      input.addEventListener('change', function () {
        state.siteUncertain = input.checked;
        self.render();
      });
      label.appendChild(input);
      label.appendChild(
        el('span', null, 'I am not sure about my ceiling height, flooring or anchoring — please review my layout.')
      );
      body.appendChild(label);
    });
    this.stepsHost.appendChild(siteStep);
  };

  BYORConfigurator.prototype.buildStep = function (number, title, description, fill) {
    var wrapper = el('section', 'byor-step');
    var header = el('header', 'byor-step__header');
    if (number != null) header.appendChild(el('span', 'byor-step__number', 'Step ' + number));
    header.appendChild(el('h3', 'byor-step__title', title));
    if (description) header.appendChild(el('p', 'byor-step__description', description));
    wrapper.appendChild(header);

    var body = el('div', 'byor-step__body');
    fill(body);
    wrapper.appendChild(body);
    return wrapper;
  };

  BYORConfigurator.prototype.choiceRow = function (options, current, onChange) {
    var row = el('div', 'byor-choices');
    options.forEach(function (option) {
      var button = el('button', 'byor-choice');
      button.type = 'button';
      if (option.value === current) button.classList.add('is-selected');
      button.setAttribute('aria-pressed', option.value === current ? 'true' : 'false');
      button.appendChild(el('span', 'byor-choice__label', option.label));
      if (option.note) button.appendChild(el('span', 'byor-choice__note', option.note));
      button.addEventListener('click', function () {
        onChange(option.value);
      });
      row.appendChild(button);
    });
    return row;
  };

  BYORConfigurator.prototype.quantityRow = function (config) {
    var row = el('div', 'byor-item');
    var product = config.product;

    if (product && product.image) {
      var image = document.createElement('img');
      image.className = 'byor-item__image';
      image.src = product.image;
      image.alt = '';
      image.loading = 'lazy';
      image.width = 56;
      image.height = 56;
      row.appendChild(image);
    }

    var info = el('div', 'byor-item__info');
    var name = el('span', 'byor-item__title', (product && product.title) || config.sku);
    info.appendChild(name);

    var meta = el('span', 'byor-item__meta');
    if (product) {
      meta.textContent = money(product.price) + (config.labelSuffix || '');
      if (!product.available) meta.textContent += ' — quote review';
    } else {
      meta.textContent = 'Available by quote review';
    }
    info.appendChild(meta);

    if (config.quoteOnly) {
      info.appendChild(el('span', 'byor-tag byor-tag--quote', 'Quote review'));
    }
    row.appendChild(info);

    var controls = el('div', 'byor-item__controls');
    var input = document.createElement('input');
    input.type = 'number';
    input.className = 'byor-item__qty';
    input.min = '0';
    input.step = '1';
    input.value = String(config.value || 0);
    input.setAttribute('aria-label', 'Quantity of ' + ((product && product.title) || config.sku));
    if (config.max != null) input.max = String(config.max);

    input.addEventListener('change', function () {
      var value = parseInt(input.value, 10);
      if (isNaN(value) || value < 0) value = 0;
      if (config.max != null && value > config.max) value = config.max;
      if (config.capTotal != null) {
        var others = (config.currentTotal || 0) - (config.value || 0);
        if (others + value > config.capTotal) value = Math.max(0, config.capTotal - others);
      }
      input.value = String(value);
      config.onChange(value);
    });

    controls.appendChild(input);
    if (config.unit) controls.appendChild(el('span', 'byor-item__unit', config.unit));
    row.appendChild(controls);

    return row;
  };

  /* Width bar picker for one position. Mixed picks are fine as long as the
   * total for the position lands on the required count. */
  BYORConfigurator.prototype.barPicker = function (config) {
    var self = this;
    var group = el('div', 'byor-picker');
    group.appendChild(el('h4', 'byor-subheading', config.heading));

    var picks = Object.assign({}, config.picks);
    var total = sumQty(picks);
    var cap = config.required != null ? config.required : config.max;

    if (config.required != null) {
      var counter = el(
        'p',
        'byor-picker__counter',
        total + ' of ' + config.required + ' selected'
      );
      if (total !== config.required) counter.classList.add('byor-note--warn');
      group.appendChild(counter);
    }

    Rules.widthBarOptions(this.state, config.size).forEach(function (option) {
      var product = self.catalog.get(option.sku);
      group.appendChild(
        self.quantityRow({
          sku: option.sku,
          product: product,
          value: picks[option.sku] || 0,
          max: cap,
          capTotal: cap,
          currentTotal: total,
          onChange: function (value) {
            var next = Object.assign({}, picks);
            next[option.sku] = value;
            config.onChange(next);
          }
        })
      );
    });

    return group;
  };

  BYORConfigurator.prototype.renderSummary = function () {
    if (!this.summaryHost) return;
    var self = this;
    var state = this.state;
    var lines = billOfMaterials(state);
    var todo = outstanding(state);
    var reasons = quoteReasons(state, this.catalog, lines);

    this.summaryHost.innerHTML = '';

    var heading = el('h3', 'byor-summary__title', 'Your build');
    this.summaryHost.appendChild(heading);

    var sections = Rules.sections(state);
    if (sections >= 1 && state.mounting) {
      var spec = [
        state.mounting === 'wall' ? 'Wall mounted' : 'Free standing',
        formatSections(sections),
        state.depth ? state.depth + '" depth' : null,
        state.spacing ? state.spacing + '" between sections' : null
      ]
        .filter(Boolean)
        .join(' · ');
      this.summaryHost.appendChild(el('p', 'byor-summary__spec', spec));
    }

    var skus = Object.keys(lines);
    if (!skus.length) {
      this.summaryHost.appendChild(
        el('p', 'byor-note', 'Pick a standard layout above, or work through the steps to build your own.')
      );
    }

    var total = 0;
    var priceKnown = true;
    var list = el('ul', 'byor-summary__list');

    skus.forEach(function (sku) {
      var product = self.catalog.get(sku);
      var qty = lines[sku];
      var item = el('li', 'byor-summary__line');
      item.appendChild(el('span', 'byor-summary__qty', qty + '×'));

      var label = el('span', 'byor-summary__name');
      if (product) {
        var link = el('a', null, product.title);
        link.href = product.url;
        link.target = '_blank';
        link.rel = 'noopener';
        label.appendChild(link);
      } else {
        label.textContent = sku;
      }
      item.appendChild(label);

      if (product && product.price != null) {
        item.appendChild(el('span', 'byor-summary__price', money(product.price * qty)));
        total += product.price * qty;
      } else {
        priceKnown = false;
        item.appendChild(el('span', 'byor-summary__price', 'Quote'));
      }

      list.appendChild(item);
    });

    if (skus.length) this.summaryHost.appendChild(list);

    if (skus.length && priceKnown) {
      var totalRow = el('p', 'byor-summary__total');
      totalRow.appendChild(el('span', null, 'Parts total'));
      totalRow.appendChild(el('strong', null, money(total)));
      this.summaryHost.appendChild(totalRow);
      this.summaryHost.appendChild(
        el('p', 'byor-note', 'Shipping and any assembly options are calculated at checkout.')
      );
    }

    if (todo.length) {
      var todoBox = el('div', 'byor-callout byor-callout--todo');
      todoBox.appendChild(el('h4', null, 'Still to choose'));
      var todoList = el('ul');
      todo.forEach(function (message) {
        todoList.appendChild(el('li', null, message));
      });
      todoBox.appendChild(todoList);
      this.summaryHost.appendChild(todoBox);
    }

    var gated = reasons.length > 0;
    if (gated) {
      var quoteBox = el('div', 'byor-callout byor-callout--quote');
      quoteBox.appendChild(el('h4', null, 'This build goes to a layout review'));
      var reasonList = el('ul');
      reasons.forEach(function (reason) {
        reasonList.appendChild(el('li', null, reason));
      });
      quoteBox.appendChild(reasonList);
      quoteBox.appendChild(
        el('p', null, 'Send it over and our team will confirm the parts list and come back to you.')
      );
      this.summaryHost.appendChild(quoteBox);
    }

    var canAdd = !todo.length && !gated && skus.length > 0 && this.catalogReady;
    if (this.addButton) {
      this.addButton.disabled = !canAdd;
      this.addButton.hidden = gated && !todo.length;
    }
    if (this.quotePanel) {
      this.quotePanel.hidden = !gated || todo.length > 0;
    }
    if (this.quoteField) {
      this.quoteField.value = this.buildText(lines, reasons);
    }

    if (!this.catalogReady) {
      this.setStatus('Loading current pricing and availability…');
    } else if (todo.length) {
      this.setStatus('');
    } else if (gated) {
      this.setStatus('');
    } else if (skus.length) {
      this.setStatus('This build is ready to add to your cart.');
    } else {
      this.setStatus('');
    }
  };

  BYORConfigurator.prototype.buildText = function (lines, reasons) {
    var self = this;
    var state = this.state;
    var out = [];

    out.push('Build Your Own Rig — configuration');
    out.push('Mounting: ' + (state.mounting === 'wall' ? 'Wall mounted' : 'Free standing'));
    out.push('Sections: ' + formatSections(Rules.sections(state)));
    if (state.depth) out.push('Rig depth: ' + state.depth + '"');
    if (state.spacing) out.push('Spacing between sections: ' + state.spacing + '"');
    if (state.topStyle) out.push('Depth bar style: ' + state.topStyle);
    out.push('');
    out.push('Parts:');

    Object.keys(lines).forEach(function (sku) {
      var product = self.catalog.get(sku);
      out.push('- ' + lines[sku] + ' x ' + sku + ' ' + ((product && product.title) || '(not available online)'));
    });

    if (reasons && reasons.length) {
      out.push('');
      out.push('Flagged for review:');
      reasons.forEach(function (reason) {
        out.push('- ' + reason);
      });
    }

    return out.join('\n');
  };

  BYORConfigurator.prototype.addToCart = function () {
    var self = this;
    var state = this.state;
    var lines = billOfMaterials(state);
    var buildRef = 'BYOR-' + Date.now().toString(36).toUpperCase();

    var items = [];
    var blocked = false;

    Object.keys(lines).forEach(function (sku) {
      var product = self.catalog.get(sku);
      if (!product || !product.variantId) {
        blocked = true;
        return;
      }
      items.push({
        id: product.variantId,
        quantity: lines[sku],
        properties: {
          _byor_build: buildRef,
          Rig: formatSections(Rules.sections(state)) + ', ' + (state.mounting === 'wall' ? 'wall mounted' : 'free standing')
        }
      });
    });

    if (blocked || !items.length) {
      this.setStatus('Some parts in this build need a quote review. Send us the build and we will confirm it.');
      return;
    }

    this.addButton.disabled = true;
    this.setStatus('Adding your rig to the cart…');

    var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';

    fetch(root + 'cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ items: items })
    })
      .then(function (res) {
        return res.json().then(function (payload) {
          return { ok: res.ok, payload: payload };
        });
      })
      .then(function (result) {
        if (!result.ok) {
          self.setStatus(
            (result.payload && result.payload.description) ||
              'We could not add every part to your cart. Please send us the build for review.'
          );
          self.addButton.disabled = false;
          return;
        }
        self.setStatus('Added to cart.');
        self.addButton.disabled = false;
        document.dispatchEvent(new CustomEvent('byor:added', { detail: { items: items } }));
        window.location.href = root + 'cart';
      })
      .catch(function () {
        self.setStatus('Something went wrong adding your rig. Please try again or send us the build for review.');
        self.addButton.disabled = false;
      });
  };

  function formatSections(sections) {
    if (!sections) return 'no sections yet';
    var whole = Math.floor(sections);
    var half = sections - whole >= 0.5;
    var label = half ? whole + '.5' : String(whole);
    return label + ' section' + (sections === 1 ? '' : 's');
  }

  // Exposed so the rules can be checked against the BYOR logic sheet without
  // driving the UI — see scripts/byor-rules-check.js.
  window.BYOR.rules = Rules;
  window.BYOR.newState = newState;
  window.BYOR.billOfMaterials = billOfMaterials;
  window.BYOR.outstanding = outstanding;
  window.BYOR.quoteReasons = quoteReasons;

  if (typeof customElements !== 'undefined' && !customElements.get('byor-configurator')) {
    customElements.define('byor-configurator', BYORConfigurator);
  }
})();
