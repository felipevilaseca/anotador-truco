(() => {
  'use strict';

  const STORAGE_KEY = 'truco-anotador-v2';

  const defaultState = {
    scoreA: 0,
    scoreB: 0,
    nameA: 'Nosotros',
    nameB: 'Ellos',
    target: 30,
  };

  let state = loadState();

  const nameAEl = document.getElementById('nameA');
  const nameBEl = document.getElementById('nameB');
  const tallyAEl = document.getElementById('tallyA');
  const tallyBEl = document.getElementById('tallyB');
  const colA = document.getElementById('colA');
  const colB = document.getElementById('colB');
  const minusA = document.getElementById('minusA');
  const minusB = document.getElementById('minusB');
  const targetOpts = document.querySelectorAll('.target-opt');
  const board = document.querySelector('.board');

  const settingsBtn = document.getElementById('settingsBtn');
  const settingsOverlay = document.getElementById('settingsOverlay');
  const inputA = document.getElementById('inputA');
  const inputB = document.getElementById('inputB');
  const saveNamesBtn = document.getElementById('saveNamesBtn');
  const resetBtn = document.getElementById('resetBtn');

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

  // Order sides are drawn in as a box fills from 1 to 4 points, 5th point adds the diagonal.
  const SIDE_COORDS = {
    top: [8, 8, 92, 8],
    left: [8, 8, 8, 92],
    bottom: [8, 92, 92, 92],
    right: [92, 8, 92, 92],
  };
  const SIDE_ORDER = ['top', 'left', 'bottom', 'right'];

  function boxSVG(filledSides, hasDiagonal) {
    let lines = '';
    for (let i = 0; i < filledSides; i++) {
      const [x1, y1, x2, y2] = SIDE_COORDS[SIDE_ORDER[i]];
      lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    }
    if (hasDiagonal) lines += `<line x1="10" y1="10" x2="90" y2="90"/>`;
    return `<svg class="tally-box" viewBox="0 0 100 100">${lines}</svg>`;
  }

  function renderTally(container, score) {
    const full = Math.floor(score / 5);
    const rem = score % 5;
    let html = '';
    for (let i = 0; i < full; i++) html += `<div class="tally-slot">${boxSVG(4, true)}</div>`;
    if (rem > 0) html += `<div class="tally-slot">${boxSVG(rem, false)}</div>`;
    container.innerHTML = html;
  }

  function render() {
    nameAEl.textContent = state.nameA;
    nameBEl.textContent = state.nameB;
    board.style.setProperty('--rows', Math.ceil(state.target / 5));
    renderTally(tallyAEl, state.scoreA);
    renderTally(tallyBEl, state.scoreB);
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

  function addPoint(team) {
    if (locked()) return;
    if (team === 'a') state.scoreA = Math.min(state.target, state.scoreA + 1);
    else state.scoreB = Math.min(state.target, state.scoreB + 1);
    saveState();
    render();
    vibrate(15);
    checkWin();
  }

  function subPoint(team) {
    if (locked()) return;
    if (team === 'a') state.scoreA = Math.max(0, state.scoreA - 1);
    else state.scoreB = Math.max(0, state.scoreB - 1);
    saveState();
    render();
  }

  colA.addEventListener('click', () => addPoint('a'));
  colB.addEventListener('click', () => addPoint('b'));
  minusA.addEventListener('click', () => subPoint('a'));
  minusB.addEventListener('click', () => subPoint('b'));

  targetOpts.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.target = Number(btn.dataset.target);
      if (state.scoreA > state.target) state.scoreA = state.target;
      if (state.scoreB > state.target) state.scoreB = state.target;
      saveState();
      render();
    });
  });

  settingsBtn.addEventListener('click', () => {
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

  resetBtn.addEventListener('click', () => {
    settingsOverlay.classList.add('hidden');
    resetConfirm.classList.remove('hidden');
  });

  cancelReset.addEventListener('click', () => resetConfirm.classList.add('hidden'));

  confirmReset.addEventListener('click', () => {
    state.scoreA = 0;
    state.scoreB = 0;
    saveState();
    render();
    resetConfirm.classList.add('hidden');
    winOverlay.classList.add('hidden');
  });

  playAgainBtn.addEventListener('click', () => {
    state.scoreA = 0;
    state.scoreB = 0;
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
