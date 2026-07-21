(() => {
  const root = document.getElementById('mitre-v19-options');
  const slides = root.querySelector('#v19-slides');
  const optionTabs = root.querySelector('#v19-option-tabs');
  const exportAllButton = root.querySelector('#v19-export-all');
  const exportStatus = root.querySelector('#v19-export-status');
  const tactics = window.CARDINAL_MITRE_V19;
  if (!Array.isArray(tactics)) throw new Error('Cardinal MITRE v19 data failed to load.');
  const options = [
    { id: 'weighted', title: 'Option 1 · Weighted matrix', note: 'Tactic area scales dynamically with technique count · Cardinal TCS v1 order' },
    { id: 'lanes', title: 'Option 2 · Ordered lanes', note: 'Lane height scales dynamically with content · Cardinal TCS v1 order' }
  ];
  const optionStates = new Map(options.map(option => [option.id, {
    uncoveredTechniques: true,
    uniformFontSize: true,
    calculateGhosts: option.id === 'weighted'
  }]));
  const panelControls = new Map();
  let activeOptionId = options[0].id;
  const healthByState = {
    'health-low': 16,
    'health-medium': 50,
    'health-high': 80,
    'health-full': 100
  };
  function buildTechniqueView(technique, tacticIndex, sourceIndex) {
    const healthStates = ['health-full', 'health-full', 'health-high', 'health-medium', 'health-low'];
    const state = (tacticIndex * 3 + sourceIndex) % 5 === 0 ? 'uncovered' : healthStates[(tacticIndex * 7 + sourceIndex) % healthStates.length];
    return {
      technique,
      state,
      sourceIndex,
      relatedEntitiesCount: state === 'uncovered' ? 0 : 1,
      health: healthByState[state] ?? 0,
      recommendationsCount: (technique.subTechniqueCount * 3 + sourceIndex + tacticIndex) % 8
    };
  }
  function cardinalTcs1TechniqueSorter(techniqueA, techniqueB) {
    if (techniqueA.relatedEntitiesCount === 0 && techniqueB.relatedEntitiesCount === 0) {
      return techniqueB.recommendationsCount - techniqueA.recommendationsCount || techniqueA.sourceIndex - techniqueB.sourceIndex;
    }
    if (techniqueA.relatedEntitiesCount === 0) return 1;
    if (techniqueB.relatedEntitiesCount === 0) return -1;
    return techniqueA.health - techniqueB.health || techniqueA.sourceIndex - techniqueB.sourceIndex;
  }
  function tacticNode(tactic, index, mode) {
    const { id, name, techniques } = tactic;
    const count = techniques.length;
    const section = document.createElement('section');
    section.className = 'tactic';
    section.dataset.mode = mode;
    section.dataset.tacticId = id;
    section.dataset.total = String(count);
    section.setAttribute('aria-label', `${name}: ${count} techniques`);
    const head = document.createElement('div');
    head.className = 'tactic-head text-small';
    head.innerHTML = `<span class="tactic-name">${name}</span><span class="tactic-count">${count}/${count}</span>`;
    const list = document.createElement('div');
    list.className = 'techs';
    let cols = 1;
    if (mode === 'lane') cols = count > 24 ? 17 : count > 16 ? 10 : count;
    else if (count > 22) cols = 3;
    else if (count > 14) cols = 2;
    const rows = Math.ceil(count / cols);
    list.style.setProperty('--cols', cols);
    list.style.setProperty('--rows', rows);
    const sortedTechniques = techniques
      .map((technique, sourceIndex) => buildTechniqueView(technique, index, sourceIndex))
      .sort(cardinalTcs1TechniqueSorter);
    sortedTechniques.forEach(({ technique, state, health, recommendationsCount }) => {
      const cell = document.createElement('div');
      cell.className = `tech text-small ${state}`;
      cell.dataset.techniqueId = technique.id;
      cell.dataset.subTechniqueCount = String(technique.subTechniqueCount);
      cell.dataset.health = String(health);
      cell.dataset.recommendationsCount = String(recommendationsCount);
      cell.textContent = technique.name;
      cell.title = technique.id === 'other' ? technique.name : `${technique.id}: ${technique.name}`;
      list.appendChild(cell);
    });
    section.append(head, list);
    return section;
  }
  function controlsMarkup(option) {
    const prefix = `v19-${option.id}`;
    const variationObject = {
      option: option.id === 'weighted' ? 'matrix' : 'lanes',
      uniformFontSize: true
    };
    if (option.id === 'weighted') variationObject.calculateGhosts = true;
    const ghostControl = option.id === 'weighted' ? `<div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="${prefix}-ghosts" data-control="ghosts" autocomplete="off" checked><label class="form-check-label" for="${prefix}-ghosts">Calculate ghosts</label><span class="help-tooltip" tabindex="0" aria-label="About Calculate ghosts" aria-describedby="${prefix}-ghost-help">?<span class="help-tooltip-text" id="${prefix}-ghost-help" role="tooltip">If uncovered techniques are hidden, stay in the paint flow calculation and move to the end.</span></span></div>` : '';
    return `<div class="viz-controls tab-controls"><section class="client-option-panel" aria-labelledby="${prefix}-client-option-title"><div class="control-group-heading"><strong id="${prefix}-client-option-title">filters</strong></div><div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="${prefix}-uncovered" data-control="uncovered" autocomplete="off" checked><label class="form-check-label" for="${prefix}-uncovered">Uncovered techniques</label></div></section><section class="variation-panel" aria-labelledby="${prefix}-variation-title"><div class="control-group-heading"><strong id="${prefix}-variation-title">Layout variations</strong><span>These settings belong only to this tab</span></div><div class="variation-checkboxes"><div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="${prefix}-uniform" data-control="uniform" autocomplete="off" checked><label class="form-check-label" for="${prefix}-uniform">Uniform font size</label></div>${ghostControl}</div><div class="variation-share" title="Variation settings for ${option.title}"><span class="variation-label">Final variation object—send this to us</span><code class="variation-code" data-variation-output>${JSON.stringify(variationObject)}</code><button type="button" class="btn btn-copy" data-copy-variation aria-live="polite">Copy variation object</button></div></section></div>`;
  }
  function frame(option, index) {
    const article = document.createElement('article');
    article.className = 'option uniform-mode';
    article.dataset.optionId = option.id;
    article.id = `v19-panel-${option.id}`;
    article.setAttribute('role', 'tabpanel');
    article.setAttribute('aria-labelledby', `v19-tab-${option.id}`);
    article.hidden = index !== 0;
    article.innerHTML = `<div class="option-heading"><div class="option-copy"><strong>${option.title}</strong><span class="text-small">${option.note}</span></div><button type="button" class="btn export-slide">Download 1920×1080 PNG</button></div>${controlsMarkup(option)}`;
    const shell = document.createElement('div');
    shell.className = 'slide-shell';
    const slide = document.createElement('section');
    slide.className = 'slide';
    slide.dataset.option = option.id;
    slide.innerHTML = `<header class="slide-head text-small"><strong>MITRE ATT&amp;CK Coverage</strong><span>Filtered: APT29 · Cloud campaign</span></header><div class="slide-body"></div><footer class="slide-foot text-small"><div class="legend"><span><i class="coverage-mark covered"></i>Covered</span><span class="uncovered-key"><i class="coverage-mark not-covered"></i>Not covered</span><i class="legend-divider"></i><span><i class="dot health-low"></i>Low</span><span><i class="dot health-medium"></i>Medium</span><span><i class="dot health-high"></i>High</span><span><i class="dot health-full"></i>Full</span></div><span>TCS v1 · Enterprise v19</span></footer>`;
    shell.appendChild(slide);
    article.appendChild(shell);
    slides.appendChild(article);
    const controls = {
      uncovered: article.querySelector('[data-control="uncovered"]'),
      uniform: article.querySelector('[data-control="uniform"]'),
      ghosts: article.querySelector('[data-control="ghosts"]'),
      variation: article.querySelector('[data-variation-output]'),
      copy: article.querySelector('[data-copy-variation]')
    };
    panelControls.set(option.id, controls);
    controls.uncovered.addEventListener('change', () => updateOption(option.id));
    controls.uniform.addEventListener('change', () => updateOption(option.id));
    controls.ghosts?.addEventListener('change', () => updateOption(option.id));
    controls.copy.addEventListener('click', () => copyVariation(option.id));
    article.querySelector('.export-slide').addEventListener('click', () => downloadSlidePng(slide, option.id, article.querySelector('.export-slide')));
    return slide.querySelector('.slide-body');
  }
  function createOptionTab(option, index) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option-tab';
    button.id = `v19-tab-${option.id}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', `v19-panel-${option.id}`);
    button.setAttribute('aria-selected', String(index === 0));
    button.tabIndex = index === 0 ? 0 : -1;
    button.textContent = option.title;
    button.addEventListener('click', () => activateOption(option.id));
    button.addEventListener('keydown', event => {
      const currentIndex = options.findIndex(candidate => candidate.id === option.id);
      let nextIndex = null;
      if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % options.length;
      if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + options.length) % options.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = options.length - 1;
      if (nextIndex === null) return;
      event.preventDefault();
      activateOption(options[nextIndex].id, true);
    });
    optionTabs.appendChild(button);
  }
  function proportionalSpans(counts, totalTracks = 24) {
    const minimum = 2;
    const available = totalTracks - minimum * counts.length;
    const total = counts.reduce((sum, count) => sum + count, 0) || 1;
    const rawExtras = counts.map(count => available * count / total);
    const extras = rawExtras.map(Math.floor);
    let remaining = available - extras.reduce((sum, count) => sum + count, 0);
    const order = rawExtras.map((value, index) => ({ index, fraction: value - Math.floor(value) })).sort((a, b) => b.fraction - a.fraction);
    for (let index = 0; index < remaining; index += 1) extras[order[index].index] += 1;
    return extras.map(extra => minimum + extra);
  }
  function visibleTechniqueCount(tactic) {
    return [...tactic.querySelectorAll('.tech')].filter(cell => !cell.hidden).length || 1;
  }
  const measureCanvas = document.createElement('canvas');
  const measureContext = measureCanvas.getContext('2d');
  const lineCountCache = new Map();
  function wrappedLineCount(text, maxWidth, fontSize, fontFamily) {
    const roundedWidth = Math.round(maxWidth * 2) / 2;
    const key = `${text}|${roundedWidth}|${fontSize}|${fontFamily}`;
    if (lineCountCache.has(key)) return lineCountCache.get(key);
    measureContext.font = `500 ${fontSize}px ${fontFamily}`;
    const words = text.trim().split(/\s+/);
    let lines = 1;
    let current = '';
    for (const word of words) {
      if (measureContext.measureText(word).width > maxWidth) {
        lineCountCache.set(key, Infinity);
        return Infinity;
      }
      const candidate = current ? `${current} ${word}` : word;
      if (measureContext.measureText(candidate).width <= maxWidth) current = candidate;
      else {
        lines += 1;
        current = word;
      }
    }
    lineCountCache.set(key, lines);
    return lines;
  }
  function textFits(text, width, height, fontSize, fontFamily) {
    const lineCount = wrappedLineCount(text, Math.max(1, width - 16), fontSize, fontFamily);
    return Number.isFinite(lineCount) && lineCount * fontSize * 1.05 <= Math.max(1, height - 6);
  }
  function maximumFittingFont(text, width, height, minimum, maximum, fontFamily) {
    if (!textFits(text, width, height, minimum, fontFamily)) return minimum;
    let low = minimum;
    let high = maximum;
    for (let iteration = 0; iteration < 6; iteration += 1) {
      const middle = (low + high) / 2;
      if (textFits(text, width, height, middle, fontFamily)) low = middle;
      else high = middle;
    }
    return Math.floor(low * 2) / 2;
  }
  function configureTechniqueGrid(tactic) {
    const mode = tactic.dataset.mode;
    const list = tactic.querySelector('.techs');
    const cells = [...list.querySelectorAll('.tech')].filter(cell => !cell.hidden);
    const count = cells.length || 1;
    const width = list.clientWidth;
    const height = list.clientHeight;
    if (!width || !height) return;
    const fontFamily = getComputedStyle(cells[0] || tactic).fontFamily;
    const preferredMinimumSize = mode === 'lane' ? 11 : 12;
    const emergencyMinimumSize = mode === 'lane' ? 9 : 8;
    const maximumSize = 32;
    const forcedColumns = mode === 'lane' && tactic.dataset.laneColumns ? Number(tactic.dataset.laneColumns) : null;
    const maximumColumns = Math.min(count, mode === 'lane' ? 20 : 8);
    const minimumCardWidth = mode === 'lane' ? 82 : 125;
    const columnCandidates = forcedColumns ? [forcedColumns] : Array.from({ length: maximumColumns }, (_, index) => index + 1);
    function findBest(minimumSize) {
      let bestCandidate = null;
      for (const columns of columnCandidates) {
        const rows = Math.ceil(count / columns);
        const cardWidth = (width - (columns - 1) * 2) / columns;
        const cardHeight = (height - (rows - 1)) / rows;
        if (cardWidth < minimumCardWidth && columns > 1 && !forcedColumns) continue;
        const allFitAtMinimum = cells.every(cell => textFits(cell.textContent, cardWidth, cardHeight, minimumSize, fontFamily));
        if (!allFitAtMinimum) continue;
        const fontSizes = cells.map(cell => maximumFittingFont(cell.textContent, cardWidth, cardHeight, minimumSize, maximumSize, fontFamily));
        const minimumFont = Math.min(...fontSizes);
        const averageFont = fontSizes.reduce((sum, size) => sum + size, 0) / fontSizes.length;
        const emptySlots = columns * rows - count;
        const aspectRatio = cardWidth / Math.max(cardHeight, 1);
        const score = minimumFont * 4 + averageFont - emptySlots * 0.1 - Math.abs(Math.log(Math.max(aspectRatio, 0.1) / 3));
        if (!bestCandidate || score > bestCandidate.score) bestCandidate = { columns, rows, fontSizes, minimumFont, score };
      }
      return bestCandidate;
    }
    const best = findBest(preferredMinimumSize) || findBest(emergencyMinimumSize);
    if (!best) return;
    list.style.setProperty('--cols', best?.columns ?? 1);
    list.style.setProperty('--rows', best?.rows ?? count);
    const uniform = tactic.closest('.option')?.classList.contains('uniform-mode');
    cells.forEach((cell, index) => {
      const size = uniform ? best.minimumFont : best.fontSizes[index];
      cell.style.fontSize = `${size}px`;
    });
  }
  function fillRectangle(body) {
    const tacticElements = [...body.querySelectorAll(':scope > .tactic')];
    const rows = [];
    for (let index = 0; index < tacticElements.length; index += 5) rows.push(tacticElements.slice(index, index + 5));
    const rowTotals = rows.map(row => row.reduce((sum, tactic) => sum + visibleTechniqueCount(tactic), 0));
    body.style.gridTemplateRows = rowTotals.map(total => `${total}fr`).join(' ');
    rows.forEach(row => {
      const spans = proportionalSpans(row.map(visibleTechniqueCount));
      row.forEach((tactic, index) => { tactic.style.gridColumn = `span ${spans[index]}`; });
    });
  }
  function planLane(tactic, fontSize) {
    const list = tactic.querySelector('.techs');
    const cells = [...list.querySelectorAll('.tech')].filter(cell => !cell.hidden);
    const width = list.clientWidth;
    const fontFamily = getComputedStyle(cells[0] || tactic).fontFamily;
    const head = tactic.querySelector('.tactic-head');
    const name = tactic.querySelector('.tactic-name');
    const count = tactic.querySelector('.tactic-count');
    const headStyle = getComputedStyle(head);
    const headFontSize = parseFloat(headStyle.fontSize) || 16;
    const headLineHeight = parseFloat(headStyle.lineHeight) || headFontSize * 1.05;
    const headTextWidth = Math.max(60, head.clientWidth - 28 - (count.clientWidth || 22));
    const headLines = wrappedLineCount(name.textContent, headTextWidth, headFontSize, headStyle.fontFamily);
    const headerRequiredHeight = headLines * headLineHeight + 22;
    let best = null;
    const maximumColumns = Math.min(cells.length, 20);
    for (let columns = 1; columns <= maximumColumns; columns += 1) {
      const rows = Math.ceil(cells.length / columns);
      const cardWidth = (width - (columns - 1) * 2) / columns;
      const textWidth = cardWidth - 20;
      if (textWidth < 60 && columns > 1) continue;
      const lineCounts = cells.map(cell => wrappedLineCount(cell.textContent, textWidth, fontSize, fontFamily));
      if (lineCounts.some(lines => !Number.isFinite(lines))) continue;
      const maximumLines = Math.max(...lineCounts, 1);
      const rowHeight = maximumLines * fontSize * 1.05 + 8;
      const techniqueRequiredHeight = rows * rowHeight + (rows - 1) + 12;
      const requiredHeight = Math.max(techniqueRequiredHeight, headerRequiredHeight);
      const emptySlots = columns * rows - cells.length;
      const score = requiredHeight + emptySlots * 1.5;
      if (!best || score < best.score) best = { columns, rows, requiredHeight, score };
    }
    return best || { columns: 1, rows: cells.length, requiredHeight: cells.length * (fontSize * 1.05 + 8) + 12, score: Infinity };
  }
  function fillLanes(body) {
    const tacticElements = [...body.querySelectorAll(':scope > .tactic')];
    const gap = 3 * (tacticElements.length - 1);
    const available = Math.max(0, body.clientHeight - gap);
    if (!available) return;
    let lower = 12;
    let upper = 20;
    let selectedFont = 12;
    let plans = tacticElements.map(tactic => planLane(tactic, selectedFont));
    for (let iteration = 0; iteration < 6; iteration += 1) {
      const fontSize = (lower + upper) / 2;
      const candidates = tacticElements.map(tactic => planLane(tactic, fontSize));
      const required = candidates.reduce((sum, plan) => sum + Math.max(30, plan.requiredHeight), 0);
      if (required <= available) {
        selectedFont = fontSize;
        plans = candidates;
        lower = fontSize;
      } else upper = fontSize;
    }
    const requiredHeights = plans.map(plan => Math.max(30, plan.requiredHeight));
    const requiredTotal = requiredHeights.reduce((sum, height) => sum + height, 0);
    const scale = requiredTotal > available ? available / requiredTotal : 1;
    const remaining = Math.max(0, available - requiredTotal * scale);
    const heights = requiredHeights.map(height => height * scale + remaining * height / requiredTotal);
    tacticElements.forEach((tactic, index) => {
      tactic.dataset.laneColumns = String(plans[index].columns);
      tactic.dataset.laneFontSize = String(selectedFont);
    });
    body.style.gridTemplateRows = heights.map(height => `${height}px`).join(' ');
  }
  function refreshLayouts(scope = root) {
    scope.querySelectorAll('.layout-weighted').forEach(fillRectangle);
    scope.querySelectorAll('.layout-lanes').forEach(fillLanes);
    scope.querySelectorAll('.tactic').forEach(configureTechniqueGrid);
  }
  options.forEach((option, index) => {
    createOptionTab(option, index);
    const body = frame(option, index);
    if (option.id === 'weighted') {
      body.className = 'slide-body layout-weighted';
      tactics.forEach((t, i) => body.appendChild(tacticNode(t, i, 'weighted')));
    } else {
      body.className = 'slide-body layout-lanes';
      tactics.forEach((t, i) => body.appendChild(tacticNode(t, i, 'lane')));
    }
  });
  function hasOverflow(element) {
    return element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1;
  }
  function fitOverflowingCell(cell, minimumSize) {
    const currentSize = parseFloat(cell.style.fontSize) || minimumSize;
    if (!hasOverflow(cell)) return;
    let low = 7;
    let high = currentSize;
    cell.style.fontSize = `${low}px`;
    if (hasOverflow(cell)) return;
    for (let iteration = 0; iteration < 6; iteration += 1) {
      const middle = (low + high) / 2;
      cell.style.fontSize = `${middle}px`;
      if (hasOverflow(cell)) high = middle;
      else low = middle;
    }
    cell.style.fontSize = `${Math.floor(low * 2) / 2}px`;
  }
  function fitSlide(slide) {
    const visibleCells = [...slide.querySelectorAll('.tech')].filter(cell => !cell.hidden);
    if (!visibleCells.length) return;
    const minimumSize = slide.dataset.option === 'lanes' ? 9 : 8;
    if (slide.closest('.option')?.classList.contains('uniform-mode')) {
      let high = Math.min(...visibleCells.map(cell => parseFloat(cell.style.fontSize) || minimumSize));
      let low = 7;
      visibleCells.forEach(cell => { cell.style.fontSize = `${low}px`; });
      if (visibleCells.some(hasOverflow)) return;
      for (let iteration = 0; iteration < 6; iteration += 1) {
        const middle = (low + high) / 2;
        visibleCells.forEach(cell => { cell.style.fontSize = `${middle}px`; });
        if (visibleCells.some(hasOverflow)) high = middle;
        else low = middle;
      }
      const sharedSize = Math.floor(low * 2) / 2;
      visibleCells.forEach(cell => { cell.style.fontSize = `${sharedSize}px`; });
    } else {
      visibleCells.forEach(cell => fitOverflowingCell(cell, minimumSize));
    }
    slide.querySelectorAll('.techs').forEach(list => {
      if (hasOverflow(list)) {
        [...list.querySelectorAll('.tech')]
          .filter(cell => !cell.hidden)
          .forEach(cell => fitOverflowingCell(cell, minimumSize));
      }
    });
  }
  function fitAll(scope = root) { scope.querySelectorAll('.slide').forEach(fitSlide); }
  function scalePreviews(scope = root) {
    scope.querySelectorAll('.slide-shell').forEach(shell => {
      const slide = shell.querySelector('.slide');
      slide.style.transform = `scale(${shell.clientWidth / 1920})`;
    });
  }
  async function slideToPngData(slide) {
    if (typeof window.html2canvas !== 'function') throw new Error('The PNG renderer failed to load.');
    const clone = slide.cloneNode(true);
    clone.style.position = 'relative';
    clone.style.left = '0';
    clone.style.top = '0';
    clone.style.transform = 'none';
    clone.style.width = '1920px';
    clone.style.height = '1080px';
    const staging = document.createElement('div');
    staging.style.position = 'fixed';
    staging.style.left = '-10000px';
    staging.style.top = '0';
    staging.style.width = '1920px';
    staging.style.height = '1080px';
    staging.style.overflow = 'visible';
    staging.appendChild(clone);
    document.body.appendChild(staging);
    try {
      const canvas = await window.html2canvas(clone, { backgroundColor: null, logging: false, scale: 1, width: 1920, height: 1080, useCORS: true });
      return canvas.toDataURL('image/png');
    } finally {
      staging.remove();
    }
  }
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function downloadSlidePng(slide, id, button) {
    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = 'Rendering PNG…';
    try {
      await document.fonts?.ready;
      const panel = slide.closest('.option');
      refreshLayouts(panel);
      fitAll(panel);
      const pngData = await slideToPngData(slide);
      const response = await fetch(pngData);
      downloadBlob(await response.blob(), `mitre-v19-${id}-1920x1080.png`);
    } catch (error) {
      console.error(error);
      exportStatus.textContent = `PNG export failed: ${error?.message || 'reload and try again.'}`;
    } finally {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  }
  async function exportAllPngs() {
    if (typeof window.JSZip !== 'function' || typeof window.html2canvas !== 'function') {
      exportStatus.textContent = 'Export libraries failed to load. Check the connection, then reload.';
      return;
    }
    const originalLabel = exportAllButton.textContent;
    exportAllButton.disabled = true;
    exportAllButton.textContent = 'Preparing PNGs…';
    exportStatus.textContent = `Preparing ${root.querySelectorAll('.slide').length} PNGs…`;
    try {
      await document.fonts?.ready;
      const zip = new window.JSZip();
      const slideElements = [...root.querySelectorAll('.slide')];
      for (let index = 0; index < slideElements.length; index += 1) {
        exportAllButton.textContent = `Rendering slide ${index + 1} of ${slideElements.length}…`;
        exportStatus.textContent = `Rendering slide ${index + 1} of ${slideElements.length}…`;
        const panel = slideElements[index].closest('.option');
        const wasHidden = panel.hidden;
        if (wasHidden) {
          panel.hidden = false;
          panel.classList.add('export-staging');
        }
        refreshLayouts(panel);
        fitAll(panel);
        scalePreviews(panel);
        let pngData;
        try {
          pngData = await slideToPngData(slideElements[index]);
        } finally {
          if (wasHidden) {
            panel.classList.remove('export-staging');
            panel.hidden = true;
          }
        }
        const id = slideElements[index].dataset.option;
        zip.file(`mitre-v19-${id}-1920x1080.png`, pngData.split(',')[1], { base64: true });
      }
      exportAllButton.textContent = 'Creating ZIP…';
      exportStatus.textContent = 'Creating the PNG ZIP…';
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(blob, 'mitre-v19-slide-options-png.zip');
      exportStatus.textContent = 'PNG ZIP downloaded.';
    } catch (error) {
      console.error(error);
      exportStatus.textContent = `Export failed: ${error?.message || 'reload the page and try again.'}`;
    } finally {
      exportAllButton.disabled = false;
      exportAllButton.textContent = originalLabel;
    }
  }
  function getOptionPanel(optionId = activeOptionId) {
    return root.querySelector(`.option[data-option-id="${optionId}"]`);
  }
  function activateOption(optionId, focusTab = false) {
    const state = optionStates.get(optionId);
    if (!state) return;
    activeOptionId = optionId;
    root.querySelectorAll('.option-tab').forEach(tab => {
      const selected = tab.id === `v19-tab-${optionId}`;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focusTab) tab.focus();
    });
    root.querySelectorAll('.option').forEach(panel => { panel.hidden = panel.dataset.optionId !== optionId; });
    panelControls.get(optionId).copy.textContent = 'Copy variation object';
    updateOption(optionId);
  }
  function updateOption(optionId = activeOptionId) {
    const panel = getOptionPanel(optionId);
    const state = optionStates.get(optionId);
    const controls = panelControls.get(optionId);
    if (!panel || !state || !controls) return;
    state.uncoveredTechniques = controls.uncovered.checked;
    state.uniformFontSize = controls.uniform.checked;
    state.calculateGhosts = optionId === 'weighted' && Boolean(controls.ghosts?.checked);
    const show = state.uncoveredTechniques;
    const reflow = state.calculateGhosts;
    panel.classList.toggle('uniform-mode', state.uniformFontSize);
    const variationObject = {
      option: optionId === 'weighted' ? 'matrix' : 'lanes',
      uniformFontSize: state.uniformFontSize
    };
    if (optionId === 'weighted') variationObject.calculateGhosts = state.calculateGhosts;
    const variation = JSON.stringify(variationObject);
    controls.variation.textContent = variation;
    controls.variation.setAttribute('aria-label', `Variation settings for ${options.find(option => option.id === optionId)?.title}: ${variation}`);
    controls.copy.dataset.copyText = variation;
    controls.copy.title = 'Copy variation object';
    panel.querySelectorAll('.tech.uncovered').forEach(el => {
      el.hidden = !show && !reflow;
      el.classList.toggle('reflow-gap', !show && reflow);
      el.setAttribute('aria-hidden', String(!show));
    });
    panel.querySelectorAll('.uncovered-key').forEach(el => el.hidden = !show);
    panel.querySelectorAll('.tactic').forEach(tactic => {
      const total = Number(tactic.dataset.total);
      const visible = show ? total : tactic.querySelectorAll('.tech:not(.uncovered)').length;
      tactic.querySelector('.tactic-count').textContent = `${visible}/${total}`;
      const name = tactic.querySelector('.tactic-name').textContent;
      tactic.setAttribute('aria-label', `${name}: ${visible} of ${total} techniques visible`);
    });
    if (optionId === activeOptionId) scheduleLayout();
  }
  async function copyVariation(optionId) {
    const controls = panelControls.get(optionId);
    if (!controls) return;
    const text = controls.copy.dataset.copyText || controls.variation.textContent;
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch (error) {
      console.warn('Clipboard API unavailable; using fallback.', error);
    }
    if (!copied) {
      const fallback = document.createElement('textarea');
      fallback.value = text;
      fallback.setAttribute('readonly', '');
      fallback.style.position = 'fixed';
      fallback.style.opacity = '0';
      document.body.appendChild(fallback);
      fallback.select();
      copied = document.execCommand('copy');
      fallback.remove();
    }
    controls.copy.textContent = copied ? 'Copied' : 'Copy failed';
    setTimeout(() => { controls.copy.textContent = 'Copy variation object'; }, 1400);
  }
  let layoutFrame;
  function scheduleLayout() {
    cancelAnimationFrame(layoutFrame);
    layoutFrame = requestAnimationFrame(() => {
      layoutFrame = requestAnimationFrame(() => {
        const panel = getOptionPanel();
        if (!panel) return;
        refreshLayouts(panel);
        fitAll(panel);
        scalePreviews(panel);
      });
    });
  }
  exportAllButton.addEventListener('click', exportAllPngs);
  window.addEventListener('resize', scheduleLayout);
  window.addEventListener('load', scheduleLayout);
  document.fonts?.ready.then(scheduleLayout);
  activateOption(activeOptionId);
})();
