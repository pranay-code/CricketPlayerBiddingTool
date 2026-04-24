import { getState, setState } from '../state.js';

export function renderBudgetAllocation(container) {
  const state = getState();

  container.innerHTML = `
    <div class="card">
      <h2 class="card-title">💰 Budget & Base Price</h2>
      <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:24px;">
        Set the auction budget (same for both teams) and the base price for each player.
      </p>

      <div class="two-col" style="max-width:600px;margin:0 auto;">
        <div class="form-group">
          <label class="form-label">Team Budget (₹)</label>
          <input type="number" class="form-input" id="budget-input" value="${state.budget}" min="100" step="100" style="font-size:1.2rem;font-weight:700;text-align:center;" />
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;text-align:center;">Same for both teams</div>
        </div>
        <div class="form-group">
          <label class="form-label">Base Price per Player (₹)</label>
          <input type="number" class="form-input" id="baseprice-input" value="${state.basePrice}" min="1" step="10" style="font-size:1.2rem;font-weight:700;text-align:center;" />
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;text-align:center;">Starting bid for each player</div>
        </div>
      </div>

      <!-- Preview -->
      <div class="two-col mt-24" style="max-width:700px;margin-left:auto;margin-right:auto;">
        <div class="stat-box" style="border-color:var(--team-a);border-width:2px;border-style:solid;">
          <div style="font-size:0.75rem;color:var(--team-a);font-weight:700;text-transform:uppercase;letter-spacing:1px;">
            ${state.teams[0].name || 'Team 1'}
          </div>
          <div class="stat-value" id="preview-budget-a">₹${state.budget}</div>
          <div class="stat-label">Budget</div>
        </div>
        <div class="stat-box" style="border-color:var(--team-b);border-width:2px;border-style:solid;">
          <div style="font-size:0.75rem;color:var(--team-b);font-weight:700;text-transform:uppercase;letter-spacing:1px;">
            ${state.teams[1].name || 'Team 2'}
          </div>
          <div class="stat-value" id="preview-budget-b">₹${state.budget}</div>
          <div class="stat-label">Budget</div>
        </div>
      </div>

      <div style="text-align:center;margin-top:20px;">
        <div class="stat-box" style="display:inline-block;min-width:200px;">
          <div class="stat-label" style="margin-bottom:4px;">Players in Auction</div>
          <div class="stat-value" style="font-size:1.5rem;" id="preview-count">
            ${state.players.length - 2}
          </div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;">(excluding 2 captains)</div>
        </div>
      </div>
    </div>

    <div class="nav-buttons">
      <button class="btn btn-secondary" id="btn-back">← Back</button>
      <button class="btn btn-gold btn-lg" id="btn-start-auction">🏏 Start Auction!</button>
    </div>
  `;

  // Live preview
  const budgetInput = container.querySelector('#budget-input');
  const basePriceInput = container.querySelector('#baseprice-input');

  function updatePreview() {
    const b = parseInt(budgetInput.value) || 0;
    container.querySelector('#preview-budget-a').textContent = `₹${b}`;
    container.querySelector('#preview-budget-b').textContent = `₹${b}`;
  }

  budgetInput.addEventListener('input', updatePreview);

  container.querySelector('#btn-start-auction').addEventListener('click', () => {
    const budget = parseInt(budgetInput.value) || 2200;
    const basePrice = parseInt(basePriceInput.value) || 50;
    const state = getState();

    // Build auction pool (exclude captains)
    const captainIds = [state.teams[0].captain, state.teams[1].captain];
    const pool = state.players.filter(p => !captainIds.includes(p.id)).map(p => p.id);

    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Reset team rosters
    const teams = state.teams.map(t => ({ ...t, roster: [], spent: 0 }));

    setState({
      budget,
      basePrice,
      auctionPool: pool,
      auctionBin: [],
      auctionLog: [],
      auctionPhase: 'pool',
      currentPlayer: null,
      currentBids: [],
      callState: 0,
      teams,
      currentStep: 3
    });

    window.navigateToStep(3);
  });

  container.querySelector('#btn-back').addEventListener('click', () => {
    setState({ currentStep: 1 });
    window.navigateToStep(1);
  });
}
