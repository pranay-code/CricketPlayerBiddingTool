// ===== Central State Management =====
const STATE_KEY = 'cricketAuctionState';

const defaultState = {
  currentStep: 0,
  players: [],        // { id, name, speciality }
  teams: [
    { name: '', captain: null, minPlayers: 7, maxPlayers: 11, color: 'team-a', roster: [], spent: 0 },
    { name: '', captain: null, minPlayers: 7, maxPlayers: 11, color: 'team-b', roster: [], spent: 0 }
  ],
  budget: 2200,
  basePrice: 50,
  auctionPool: [],     // ids remaining
  auctionBin: [],      // ids unsold (2nd chance)
  auctionLog: [],      // { seq, playerId, playerName, speciality, bids:[{team,amount}], finalPrice, wonBy, timestamp }
  auctionPhase: 'pool', // 'pool' | 'bin' | 'done'
  currentPlayer: null,
  currentBids: [],
  callState: 0,        // 0=none, 1=going once, 2=going twice, 3=sold
  theme: 'dark'        // 'dark' | 'light'
};

let state = loadState();
const listeners = new Set();

function loadState() {
  try {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) { /* ignore */ }
  return JSON.parse(JSON.stringify(defaultState));
}

function saveState() {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}

export function getState() { return state; }

export function setState(partial) {
  Object.assign(state, partial);
  saveState();
  listeners.forEach(fn => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function resetState() {
  state = JSON.parse(JSON.stringify(defaultState));
  saveState();
  listeners.forEach(fn => fn(state));
}

export function getSpecialityBadge(spec) {
  const map = {
    'Batsman': 'BAT', 'Bowler': 'BOWL', 'All Rounder': 'ALL',
    'All Rounder (Throw)': 'ALL-T', 'Bowler (Throw)': 'BOWL-T'
  };
  return map[spec] || spec;
}

export function getSpecialityClass(spec) {
  const map = {
    'Batsman': 'badge-bat', 'Bowler': 'badge-bowl', 'All Rounder': 'badge-all',
    'All Rounder (Throw)': 'badge-all-t', 'Bowler (Throw)': 'badge-bowl-t'
  };
  return map[spec] || 'badge-all';
}

export const SPECIALITIES = ['Batsman', 'Bowler', 'All Rounder', 'All Rounder (Throw)', 'Bowler (Throw)'];
