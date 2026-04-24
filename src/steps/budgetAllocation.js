import { getState, setState } from '../state.js';

export function renderBudgetAllocation(container) {
  const state = getState();
  const auctionPlayerCount = state.players.length - 2; // excluding 2 captains

  container.innerHTML = `
    <div class="card">
      <h2 class="card-title">💰 Budget & Auction Config</h2>
      <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:24px;">
        Configure pricing, minimum team size, and budget. The total budget is calculated as
        <strong>Base Budget + Buffer</strong>. The buffer is the extra amount available for competitive bidding.
      </p>

      <div style="max-width:650px;margin:0 auto;">
        <!-- Row 1: Base Price & Min Players -->
        <div class="two-col" style="margin-bottom:20px;">
          <div class="form-group">
            <label class="form-label">Base Price per Player (₹)</label>
            <input type="number" class="form-input" id="baseprice-input" value="${state.basePrice}" min="1" step="10" style="font-size:1.2rem;font-weight:700;text-align:center;" />
            <div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;text-align:center;">Starting bid for each player</div>
          </div>
          <div class="form-group">
            <label class="form-label">Min Players per Team</label>
            <input type="number" class="form-input" id="minplayers-input" value="${state.minPlayers}" min="1" max="${auctionPlayerCount}" step="1" style="font-size:1.2rem;font-weight:700;text-align:center;" />
            <div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;text-align:center;">Exclusive of captain, same for both teams</div>
          </div>
        </div>

        <!-- Auto-calculated Base Budget -->
        <div class="stat-box mb-16" style="border-color:var(--accent-primary);border-width:2px;border-style:solid;">
          <div class="stat-label" style="margin-bottom:4px;">Base Budget (auto-calculated)</div>
          <div class="stat-value" style="font-size:1.8rem;" id="base-budget-display">₹${state.minPlayers * state.basePrice}</div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;">
            = <span id="formula-display">${state.minPlayers} players × ₹${state.basePrice}</span>
          </div>
        </div>

        <!-- Buffer Input -->
        <div class="form-group" style="max-width:300px;margin:0 auto 20px;">
          <label class="form-label" style="text-align:center;">Bidding Buffer (₹)</label>
          <input type="number" class="form-input" id="buffer-input" value="${state.budget - (state.minPlayers * state.basePrice)}" min="0" step="50" style="font-size:1.2rem;font-weight:700;text-align:center;" />
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;text-align:center;">Extra budget for competitive bidding above base price</div>
        </div>

        <!-- Total Budget Preview -->
        <div class="two-col" style="margin-top:24px;">
          <div class="stat-box" style="border-color:var(--team-a);border-width:2px;border-style:solid;">
            <div style="font-size:0.75rem;color:var(--team-a);font-weight:700;text-transform:uppercase;letter-spacing:1px;">
              ${state.teams[0].name || 'Team 1'}
            </div>
            <div class="stat-value" id="preview-budget-a">₹${state.budget}</div>
            <div class="stat-label">Total Budget</div>
          </div>
          <div class="stat-box" style="border-color:var(--team-b);border-width:2px;border-style:solid;">
            <div style="font-size:0.75rem;color:var(--team-b);font-weight:700;text-transform:uppercase;letter-spacing:1px;">
              ${state.teams[1].name || 'Team 2'}
            </div>
            <div class="stat-value" id="preview-budget-b">₹${state.budget}</div>
            <div class="stat-label">Total Budget</div>
          </div>
        </div>

        <div style="text-align:center;margin-top:16px;">
          <div class="stat-box" style="display:inline-block;min-width:200px;">
            <div class="stat-label" style="margin-bottom:4px;">Players in Auction</div>
            <div class="stat-value" style="font-size:1.5rem;" id="preview-count">
              ${auctionPlayerCount}
            </div>
            <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;">(excluding 2 captains)</div>
          </div>
        </div>
      </div>
    </div>

    <div class="nav-buttons">
      <button class="btn btn-secondary" id="btn-back">← Back</button>
      <button class="btn btn-gold btn-lg" id="btn-start-auction">🏏 Start Auction!</button>
    </div>
  `;

  // Live recalculation
  const basePriceInput = container.querySelector('#baseprice-input');
  const minPlayersInput = container.querySelector('#minplayers-input');
  const bufferInput = container.querySelector('#buffer-input');

  function recalc() {
    const bp = parseInt(basePriceInput.value) || 0;
    const mp = parseInt(minPlayersInput.value) || 1;
    const buffer = parseInt(bufferInput.value) || 0;
    const baseBudget = mp * bp;
    const total = baseBudget + buffer;

    container.querySelector('#base-budget-display').textContent = `₹${baseBudget}`;
    container.querySelector('#formula-display').textContent = `${mp} players × ₹${bp}`;
    container.querySelector('#preview-budget-a').textContent = `₹${total}`;
    container.querySelector('#preview-budget-b').textContent = `₹${total}`;
  }

  basePriceInput.addEventListener('input', recalc);
  minPlayersInput.addEventListener('input', recalc);
  bufferInput.addEventListener('input', recalc);

  container.querySelector('#btn-start-auction').addEventListener('click', () => {
    const basePrice = parseInt(basePriceInput.value) || 50;
    const minPlayers = parseInt(minPlayersInput.value) || 3;
    const buffer = parseInt(bufferInput.value) || 0;
    const budget = (minPlayers * basePrice) + buffer;
    const state = getState();

    // Build auction pool (exclude captains)
    const captainIds = [state.teams[0].captain, state.teams[1].captain];
    const pool = state.players.filter(p => !captainIds.includes(p.id)).map(p => p.id);

    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Reset team rosters (captain is NOT in roster — they're separate)
    const teams = state.teams.map(t => ({ ...t, roster: [], spent: 0 }));

    setState({
      budget,
      basePrice,
      minPlayers,
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
