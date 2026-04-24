import './style.css';
import { getState, setState } from './state.js';
import { renderPoolCreation } from './steps/poolCreation.js';
import { renderTeamSetup } from './steps/teamSetup.js';
import { renderBudgetAllocation } from './steps/budgetAllocation.js';
import { renderAuction } from './steps/auction.js';
import { renderReport } from './steps/report.js';

const STEPS = [
  { label: 'Players', icon: '👥' },
  { label: 'Teams', icon: '⚔️' },
  { label: 'Budget', icon: '💰' },
  { label: 'Auction', icon: '🏏' },
  { label: 'Report', icon: '🏆' }
];

const renderers = [renderPoolCreation, renderTeamSetup, renderBudgetAllocation, renderAuction, renderReport];

function renderStepper(currentStep) {
  const stepperEl = document.getElementById('stepper');
  stepperEl.innerHTML = STEPS.map((s, i) => {
    let cls = 'step-item';
    if (i < currentStep) cls += ' completed';
    else if (i === currentStep) cls += ' active';
    return `
      <div class="${cls}">
        <div class="step-circle">${i < currentStep ? '✓' : i + 1}</div>
        <span class="step-label">${s.label}</span>
        ${i < STEPS.length - 1 ? '<div class="step-line"></div>' : ''}
      </div>
    `;
  }).join('');
}

function navigateToStep(step) {
  const main = document.getElementById('main-content');
  main.style.opacity = '0';
  main.style.transform = 'translateY(10px)';

  setTimeout(() => {
    renderStepper(step);
    renderers[step](main);
    requestAnimationFrame(() => {
      main.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      main.style.opacity = '1';
      main.style.transform = 'translateY(0)';
    });
  }, 150);
}

// Expose globally for step modules
window.navigateToStep = navigateToStep;

// Init
const state = getState();
if (state.theme === 'light') document.body.classList.add('light-theme');
navigateToStep(state.currentStep || 0);

// Theme Toggle
document.getElementById('theme-toggle').addEventListener('click', () => {
  const isLight = document.body.classList.toggle('light-theme');
  setState({ theme: isLight ? 'light' : 'dark' });
});
