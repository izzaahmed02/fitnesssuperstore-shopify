/*
 * Build Your Own Rig (BYOR) — scale-aware 2D visual.
 *
 * MVP gap #1 from the technical-discovery checkpoint. Draws the configured rig
 * to scale from the build state: a front elevation and a top-down plan, both in
 * real inches, with dimension callouts and a scale bar.
 *
 * Geometry is derived only from what the rules engine already knows:
 *   - a section is always 43" wide (Rules.sectionBarSize)
 *   - spacing is the span between sections (Step 4)
 *   - depth is the front-to-back rig depth (Step 3)
 *   - uprights are ordered in pairs; floor mounted stands two deep at each
 *     column position, wall mounted stands one deep
 *
 * This is a dimensioned schematic, not a product rendering. It never invents a
 * dimension: if a value has not been chosen yet it is simply not drawn.
 *
 * buildGeometry() is pure (no DOM) so it can be checked by
 * scripts/byor-rules-check.js. Only renderInto() touches the document.
 */
window.BYOR = window.BYOR || {};

window.BYOR.visual = (function () {
  'use strict';

  /* Physical constants of the French Fitness Rack & Rig frame. */
  var SECTION_WIDTH = 43; // inches — a section is always 43" wide
  var UPRIGHT_SIZE = 3; // inches — 3" x 3" upright tube
  var BAR_THICKNESS = 3; // inches — drawn thickness of a top bar

  var SVG_NS = 'http://www.w3.org/2000/svg';

  /* -------------------------------------------------------------------------
   * Geometry (pure)
   * ---------------------------------------------------------------------- */

  /*
   * Column positions run: section, span, section, span, ...
   * Two columns bracket every section, so column i sits at
   *   x(0) = 0, and each following column adds either a section width or a span.
   *
   * The number of columns comes from the uprights actually chosen, which is why
   * a half bay (an odd column count) draws correctly instead of being rounded up.
   */
  function buildGeometry(state, Rules) {
    if (!state) return null;

    var mounting = state.mounting;
    var depth = state.depth || null;
    var spacing = state.spacing || null;

    /* Uprights per column position: floor mounted stands front and back. */
    var perColumn = mounting === 'wall' ? 1 : 2;

    /* Expand the height -> pairs map into one entry per column position. */
    var columnHeights = [];
    var heights = Object.keys(state.uprights || {})
      .filter(function (h) {
        return (state.uprights[h] || 0) > 0;
      })
      .sort(function (a, b) {
        return Number(b) - Number(a); // tallest first
      });

    heights.forEach(function (height) {
      var pairs = state.uprights[height] || 0;
      var uprights = pairs * 2;
      var columns = Math.round(uprights / perColumn);
      for (var i = 0; i < columns; i++) columnHeights.push(Number(height));
    });

    if (!columnHeights.length || !mounting) return null;

    /* A span is only crossable once spacing is chosen. With a single section
     * (two columns) no span is needed, so the drawing is still valid. */
    var needsSpacing = columnHeights.length > 2;
    if (needsSpacing && !spacing) return null;

    var columns = [];
    var x = 0;
    for (var c = 0; c < columnHeights.length; c++) {
      if (c > 0) {
        // Odd column closes a section; even column crosses a span.
        x += c % 2 === 1 ? SECTION_WIDTH : spacing;
      }
      columns.push({ x: x, height: columnHeights[c] });
    }

    /* Spans between the column pairs. */
    var sections = [];
    var spans = [];
    for (var i = 0; i + 1 < columns.length; i++) {
      var run = {
        from: columns[i].x,
        to: columns[i + 1].x,
        width: columns[i + 1].x - columns[i].x,
        top: Math.min(columns[i].height, columns[i + 1].height)
      };
      if (i % 2 === 0) sections.push(run);
      else spans.push(run);
    }

    var totalWidth = columns[columns.length - 1].x;
    var maxHeight = columnHeights.reduce(function (m, h) {
      return Math.max(m, h);
    }, 0);

    return {
      mounting: mounting,
      depth: depth,
      spacing: spacing,
      columns: columns,
      sections: sections,
      spans: spans,
      totalWidth: totalWidth,
      maxHeight: maxHeight,
      /* A partial bay: an odd number of column positions. */
      hasPartialBay: columns.length % 2 === 1,
      mixedHeights: heights.length > 1,
      uprightCount: columns.length * perColumn,
      sectionsLabel: Rules && typeof Rules.sections === 'function' ? Rules.sections(state) : null
    };
  }

  /* -------------------------------------------------------------------------
   * Rendering
   * ---------------------------------------------------------------------- */

  function svgEl(name, attrs) {
    var node = document.createElementNS(SVG_NS, name);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        node.setAttribute(key, String(attrs[key]));
      });
    }
    return node;
  }

  function fmtInches(value) {
    if (value == null) return '';
    var rounded = Math.round(value * 10) / 10;
    return (rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1)) + '"';
  }

  /* Feet-and-inches helper for the human-readable caption. */
  function fmtFeet(value) {
    if (value == null) return '';
    var feet = Math.floor(value / 12);
    var inches = Math.round(value - feet * 12);
    if (inches === 12) {
      feet += 1;
      inches = 0;
    }
    if (!feet) return inches + '"';
    return feet + "' " + (inches ? inches + '"' : '');
  }

  function drawElevation(geo, unit) {
    var pad = unit * 9;
    var labelBand = unit * 7;
    var vbWidth = geo.totalWidth + pad * 2;
    var vbHeight = geo.maxHeight + pad + labelBand;

    var svg = svgEl('svg', {
      class: 'byor-visual__svg',
      viewBox: '0 0 ' + vbWidth + ' ' + vbHeight,
      role: 'img',
      'aria-label':
        'Front elevation, drawn to scale: ' +
        fmtInches(geo.totalWidth) +
        ' wide by ' +
        fmtInches(geo.maxHeight) +
        ' tall.'
    });

    var g = svgEl('g', { transform: 'translate(' + pad + ',' + pad + ')' });
    var floorY = geo.maxHeight;

    /* Floor / wall reference line. */
    g.appendChild(
      svgEl('line', {
        class: 'byor-visual__ground',
        x1: -unit * 3,
        y1: floorY,
        x2: geo.totalWidth + unit * 3,
        y2: floorY
      })
    );

    if (geo.mounting === 'wall') {
      g.appendChild(
        svgEl('line', {
          class: 'byor-visual__wall',
          x1: -unit * 2,
          y1: 0,
          x2: -unit * 2,
          y2: floorY
        })
      );
    }

    /* Top bars over sections and spans. */
    geo.sections.concat(geo.spans).forEach(function (run) {
      g.appendChild(
        svgEl('rect', {
          class: 'byor-visual__bar',
          x: run.from,
          y: floorY - run.top,
          width: run.width,
          height: BAR_THICKNESS,
          rx: 0.5
        })
      );
    });

    /* Uprights. */
    geo.columns.forEach(function (col) {
      g.appendChild(
        svgEl('rect', {
          class: 'byor-visual__upright',
          x: col.x - UPRIGHT_SIZE / 2,
          y: floorY - col.height,
          width: UPRIGHT_SIZE,
          height: col.height,
          rx: 0.5
        })
      );
    });

    /* Per-run width dimensions just under the floor line. */
    var dimY = floorY + unit * 2.4;
    geo.sections.concat(geo.spans).forEach(function (run) {
      g.appendChild(
        svgEl('line', {
          class: 'byor-visual__dim',
          x1: run.from,
          y1: dimY,
          x2: run.to,
          y2: dimY
        })
      );
      var label = svgEl('text', {
        class: 'byor-visual__dim-label',
        x: (run.from + run.to) / 2,
        y: dimY + unit * 2.6,
        'text-anchor': 'middle',
        'font-size': unit * 2.4
      });
      label.textContent = fmtInches(run.width);
      g.appendChild(label);
    });

    /* Overall width. */
    var totalY = floorY + unit * 5.4;
    g.appendChild(
      svgEl('line', {
        class: 'byor-visual__dim byor-visual__dim--total',
        x1: 0,
        y1: totalY,
        x2: geo.totalWidth,
        y2: totalY
      })
    );
    var totalLabel = svgEl('text', {
      class: 'byor-visual__dim-label byor-visual__dim-label--total',
      x: geo.totalWidth / 2,
      y: totalY + unit * 2.8,
      'text-anchor': 'middle',
      'font-size': unit * 2.6
    });
    totalLabel.textContent = 'Overall width ' + fmtInches(geo.totalWidth) + ' (' + fmtFeet(geo.totalWidth) + ')';
    g.appendChild(totalLabel);

    /* Height dimension on the left. */
    g.appendChild(
      svgEl('line', {
        class: 'byor-visual__dim',
        x1: -unit * 5,
        y1: floorY - geo.maxHeight,
        x2: -unit * 5,
        y2: floorY
      })
    );
    var hLabel = svgEl('text', {
      class: 'byor-visual__dim-label',
      x: -unit * 5.8,
      y: floorY - geo.maxHeight / 2,
      'text-anchor': 'middle',
      'font-size': unit * 2.4,
      transform: 'rotate(-90 ' + -unit * 5.8 + ' ' + (floorY - geo.maxHeight / 2) + ')'
    });
    hLabel.textContent = fmtInches(geo.maxHeight) + ' (' + fmtFeet(geo.maxHeight) + ')';
    g.appendChild(hLabel);

    svg.appendChild(g);
    return svg;
  }

  function drawPlan(geo, unit) {
    if (!geo.depth) return null;

    var pad = unit * 9;
    var vbWidth = geo.totalWidth + pad * 2;
    var vbHeight = geo.depth + pad * 2;

    var svg = svgEl('svg', {
      class: 'byor-visual__svg',
      viewBox: '0 0 ' + vbWidth + ' ' + vbHeight,
      role: 'img',
      'aria-label':
        'Top-down plan, drawn to scale: footprint ' +
        fmtInches(geo.totalWidth) +
        ' by ' +
        fmtInches(geo.depth) +
        '.'
    });

    var g = svgEl('g', { transform: 'translate(' + pad + ',' + pad + ')' });

    /* Footprint. */
    g.appendChild(
      svgEl('rect', {
        class: 'byor-visual__footprint',
        x: 0,
        y: 0,
        width: geo.totalWidth,
        height: geo.depth
      })
    );

    if (geo.mounting === 'wall') {
      g.appendChild(
        svgEl('line', {
          class: 'byor-visual__wall',
          x1: 0,
          y1: 0,
          x2: geo.totalWidth,
          y2: 0
        })
      );
    }

    /* Upright footprints: front row, plus a back row when floor mounted. */
    var rows = geo.mounting === 'wall' ? [0] : [0, geo.depth];
    geo.columns.forEach(function (col) {
      rows.forEach(function (rowY) {
        g.appendChild(
          svgEl('rect', {
            class: 'byor-visual__upright',
            x: col.x - UPRIGHT_SIZE / 2,
            y: rowY - UPRIGHT_SIZE / 2,
            width: UPRIGHT_SIZE,
            height: UPRIGHT_SIZE
          })
        );
      });
    });

    /* Depth dimension. */
    g.appendChild(
      svgEl('line', {
        class: 'byor-visual__dim',
        x1: -unit * 4,
        y1: 0,
        x2: -unit * 4,
        y2: geo.depth
      })
    );
    var dLabel = svgEl('text', {
      class: 'byor-visual__dim-label',
      x: -unit * 4.8,
      y: geo.depth / 2,
      'text-anchor': 'middle',
      'font-size': unit * 2.4,
      transform: 'rotate(-90 ' + -unit * 4.8 + ' ' + geo.depth / 2 + ')'
    });
    dLabel.textContent = 'Depth ' + fmtInches(geo.depth);
    g.appendChild(dLabel);

    svg.appendChild(g);
    return svg;
  }

  function figure(title, svg, note) {
    var wrap = document.createElement('figure');
    wrap.className = 'byor-visual__figure';

    var caption = document.createElement('figcaption');
    caption.className = 'byor-visual__caption';
    caption.textContent = title;
    wrap.appendChild(caption);
    wrap.appendChild(svg);

    if (note) {
      var noteEl = document.createElement('p');
      noteEl.className = 'byor-visual__note';
      noteEl.textContent = note;
      wrap.appendChild(noteEl);
    }
    return wrap;
  }

  /*
   * Render the visual for `state` into `host`. Safe to call on every state
   * change: it clears and redraws. When the build is not yet drawable it shows
   * a short prompt rather than a misleading picture.
   */
  function renderInto(host, state, Rules) {
    if (!host) return null;
    host.innerHTML = '';

    var geo = buildGeometry(state, Rules);
    if (!geo) {
      var empty = document.createElement('p');
      empty.className = 'byor-visual__empty';
      empty.textContent =
        'Choose your mounting type, uprights and spacing and your rig will be drawn to scale here.';
      host.appendChild(empty);
      return null;
    }

    /* One drawing unit, used for padding and type, scaled off the rig so the
     * annotations stay readable on a small studio rig and a large facility rig. */
    var unit = Math.max(geo.totalWidth, geo.maxHeight) / 90;

    var heading = document.createElement('h3');
    heading.className = 'byor-visual__title';
    heading.textContent = 'Your rig, to scale';
    host.appendChild(heading);

    host.appendChild(
      figure(
        'Front elevation',
        drawElevation(geo, unit),
        geo.mixedHeights
          ? 'Mixed upright heights are shown tallest first. Exact upright positions are confirmed at layout review.'
          : null
      )
    );

    var plan = drawPlan(geo, unit);
    if (plan) {
      host.appendChild(
        figure(
          'Top-down plan',
          plan,
          geo.mounting === 'wall'
            ? 'The heavy line marks the mounting wall.'
            : null
        )
      );
    }

    var summary = document.createElement('p');
    summary.className = 'byor-visual__summary';
    var bits = [
      'Footprint ' + fmtInches(geo.totalWidth) + ' wide',
      geo.depth ? fmtInches(geo.depth) + ' deep' : null,
      fmtInches(geo.maxHeight) + ' tall',
      geo.uprightCount + ' uprights'
    ].filter(Boolean);
    summary.textContent = bits.join(' · ');
    host.appendChild(summary);

    var disclaimer = document.createElement('p');
    disclaimer.className = 'byor-visual__note';
    disclaimer.textContent =
      'Dimensioned schematic of the frame only — attachments are not drawn. Confirm ceiling height and clearance before ordering.';
    host.appendChild(disclaimer);

    if (geo.hasPartialBay) {
      var partial = document.createElement('p');
      partial.className = 'byor-visual__note';
      partial.textContent =
        'This layout includes an expansion bay. Frame quantities for the partial bay are confirmed by our product team.';
      host.appendChild(partial);
    }

    return geo;
  }

  return {
    SECTION_WIDTH: SECTION_WIDTH,
    buildGeometry: buildGeometry,
    renderInto: renderInto,
    fmtInches: fmtInches,
    fmtFeet: fmtFeet
  };
})();
