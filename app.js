(() => {
  'use strict';

  const STORAGE_KEY = 'truco-anotador-v2';

  const defaultState = {
    scoreA: 0,
    scoreB: 0,
    nameA: 'Nos',
    nameB: 'Ellos',
    target: 30,
  };

  let state = loadState();
  let history = [];

  const nameAEl = document.getElementById('nameA');
  const nameBEl = document.getElementById('nameB');
  const colA = document.getElementById('colA');
  const colB = document.getElementById('colB');
  const targetOpts = document.querySelectorAll('.target-opt');

  const backBtn = document.getElementById('backBtn');
  const menuBtn = document.getElementById('menuBtn');
  const newMatchBtn = document.getElementById('newMatchBtn');
  const roundBtns = document.querySelectorAll('.round-btn');

  const settingsOverlay = document.getElementById('settingsOverlay');
  const inputA = document.getElementById('inputA');
  const inputB = document.getElementById('inputB');
  const saveNamesBtn = document.getElementById('saveNamesBtn');

  const resetConfirm = document.getElementById('resetConfirm');
  const cancelReset = document.getElementById('cancelReset');
  const confirmReset = document.getElementById('confirmReset');

  const winOverlay = document.getElementById('winOverlay');
  const winnerName = document.getElementById('winnerName');
  const playAgainBtn = document.getElementById('playAgainBtn');

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...defaultState };
      return { ...defaultState, ...JSON.parse(raw) };
    } catch {
      return { ...defaultState };
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // Sides are drawn clockwise as a box fills from 1 to 4 points;
  // the 5th point lays the diagonal stick across it.
  const SIDES = [
    { line: [10, 10, 90, 10], head: [90, 10] },   // top
    { line: [90, 10, 90, 90], head: [90, 90] },   // right
    { line: [90, 90, 10, 90], head: [10, 90] },   // bottom
    { line: [10, 90, 10, 10], head: [10, 10] },   // left
  ];
  const DIAGONAL = { line: [14, 14, 86, 86], head: [86, 86] };

  function stick(line, head) {
    const [x1, y1, x2, y2] = line;
    const [hx, hy] = head;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="url(#stickGrad)" stroke-width="8" stroke-linecap="round"/>` +
           `<circle cx="${hx}" cy="${hy}" r="6.5" fill="url(#headGrad)"/>`;
  }

  function boxSVG(filledSides, hasDiagonal) {
    let inner = '';
    for (let i = 0; i < filledSides; i++) inner += stick(SIDES[i].line, SIDES[i].head);
    if (hasDiagonal) inner += stick(DIAGONAL.line, DIAGONAL.head);
    return `<svg class="tally-box" viewBox="0 0 100 100">${inner}</svg>`;
  }

  function buenasThresholdBoxes() {
    return Math.floor(Math.floor(state.target / 2) / 5);
  }

  function renderTally(container, score) {
    const full = Math.floor(score / 5);
    const rem = score % 5;
    const threshold = buenasThresholdBoxes();
    let html = '';
    for (let i = 0; i < full; i++) {
      html += boxSVG(4, true);
      if (threshold > 0 && i === threshold - 1) html += `<div class="buenas-line"></div>`;
    }
    if (rem > 0) html += boxSVG(rem, false);
    container.innerHTML = html;
  }

  function render() {
    nameAEl.textContent = state.nameA + ':';
    nameBEl.textContent = state.nameB + ':';
    renderTally(colA, state.scoreA);
    renderTally(colB, state.scoreB);
    targetOpts.forEach((btn) => {
      btn.classList.toggle('active', Number(btn.dataset.target) === state.target);
    });
  }

  function vibrate(ms) {
    if (navigator.vibrate) navigator.vibrate(ms);
  }

  function checkWin() {
    if (state.scoreA >= state.target || state.scoreB >= state.target) {
      winnerName.textContent = state.scoreA >= state.target ? state.nameA : state.nameB;
      winOverlay.classList.remove('hidden');
      vibrate([40, 60, 40]);
      return true;
    }
    return false;
  }

  function locked() {
    return !winOverlay.classList.contains('hidden');
  }

  function applyDelta(team, delta) {
    if (team === 'a') state.scoreA = Math.min(state.target, Math.max(0, state.scoreA + delta));
    else state.scoreB = Math.min(state.target, Math.max(0, state.scoreB + delta));
    saveState();
    render();
  }

  function addPoint(team) {
    if (locked()) return;
    const before = team === 'a' ? state.scoreA : state.scoreB;
    applyDelta(team, 1);
    const after = team === 'a' ? state.scoreA : state.scoreB;
    if (after !== before) {
      history.push({ team, delta: after - before });
      vibrate(15);
    }
    checkWin();
  }

  function subPoint(team) {
    if (locked()) return;
    const before = team === 'a' ? state.scoreA : state.scoreB;
    applyDelta(team, -1);
    const after = team === 'a' ? state.scoreA : state.scoreB;
    if (after !== before) history.push({ team, delta: after - before });
  }

  function undoLast() {
    if (locked() || history.length === 0) return;
    const last = history.pop();
    applyDelta(last.team, -last.delta);
  }

  roundBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const team = btn.dataset.team;
      if (btn.dataset.action === 'plus') addPoint(team);
      else subPoint(team);
    });
  });

  backBtn.addEventListener('click', undoLast);

  targetOpts.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.target = Number(btn.dataset.target);
      if (state.scoreA > state.target) state.scoreA = state.target;
      if (state.scoreB > state.target) state.scoreB = state.target;
      saveState();
      render();
    });
  });

  menuBtn.addEventListener('click', () => {
    inputA.value = state.nameA;
    inputB.value = state.nameB;
    settingsOverlay.classList.remove('hidden');
  });

  settingsOverlay.addEventListener('click', (e) => {
    if (e.target === settingsOverlay) settingsOverlay.classList.add('hidden');
  });

  saveNamesBtn.addEventListener('click', () => {
    state.nameA = inputA.value.trim() || defaultState.nameA;
    state.nameB = inputB.value.trim() || defaultState.nameB;
    saveState();
    render();
    settingsOverlay.classList.add('hidden');
  });

  newMatchBtn.addEventListener('click', () => resetConfirm.classList.remove('hidden'));
  cancelReset.addEventListener('click', () => resetConfirm.classList.add('hidden'));

  confirmReset.addEventListener('click', () => {
    state.scoreA = 0;
    state.scoreB = 0;
    history = [];
    saveState();
    render();
    resetConfirm.classList.add('hidden');
    winOverlay.classList.add('hidden');
  });

  playAgainBtn.addEventListener('click', () => {
    state.scoreA = 0;
    state.scoreB = 0;
    history = [];
    saveState();
    render();
    winOverlay.classList.add('hidden');
  });

  render();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
})();
