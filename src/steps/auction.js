import { getState, setState, getSpecialityBadge, getSpecialityClass } from '../state.js';
import { playTing, playGavel, playSold, playWhoosh, playUnsold } from '../utils/sound.js';

export function renderAuction(container) {
  const state = getState();
  const { teams, players, budget, basePrice, auctionPool, auctionBin, auctionPhase, currentPlayer, currentBids, callState, auctionLog } = state;

  // Check if auction is done
  if (auctionPhase === 'done') {
    setState({ currentStep: 4 });
    window.navigateToStep(4);
    return;
  }

  // Get current player object
  const cp = currentPlayer ? players.find(p => p.id === currentPlayer) : null;
  const highestBid = currentBids.length > 0 ? currentBids[currentBids.length - 1] : null;
  const currentPrice = highestBid ? highestBid.amount : basePrice;

  // Helper: can team bid?
  function canTeamBid(idx) {
    const t = teams[idx];
    const remaining = budget - t.spent;
    if (t.roster.length >= t.maxPlayers) return false;
    if (remaining < basePrice) return false;
    return true;
  }

  // Sidebar player list
  function renderSidebar(idx) {
    const t = teams[idx];
    const capPlayer = players.find(p => p.id === t.captain);
    const isA = idx === 0;
    return `
      <div class="auction-sidebar" style="border-top:3px solid var(--${t.color});">
        <h3 style="color:var(--${t.color});">${t.name || `Team ${idx+1}`}</h3>
        ${capPlayer ? `<div class="sidebar-player" style="background:rgba(245,158,11,0.1);"><span>🏅 ${capPlayer.name}</span><span class="badge ${getSpecialityClass(capPlayer.speciality)}" style="font-size:0.6rem;">${getSpecialityBadge(capPlayer.speciality)}</span></div>` : ''}
        ${t.roster.map(e => {
          const p = players.find(pl => pl.id === e.playerId);
          return `<div class="sidebar-player"><span>${p ? p.name : '?'}</span><span class="sp-price">₹${e.price}</span></div>`;
        }).join('')}
        ${t.roster.length === 0 ? '<div style="font-size:0.75rem;color:var(--text-muted);padding:8px;">No players yet</div>' : ''}
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border-subtle);font-size:0.7rem;color:var(--text-secondary);">
          Players: ${t.roster.length}/${t.maxPlayers} (min: ${t.minPlayers})
        </div>
      </div>
    `;
  }

  // Call state labels
  const callLabels = ['', 'GOING ONCE...', 'GOING TWICE...', 'SOLD! 🔨'];

  container.innerHTML = `
    <div class="auction-layout">
      ${renderSidebar(0)}
      <div class="auction-center">
        <!-- Budget bar -->
        <div class="budget-bar">
          <div class="budget-card team-a">
            <div class="bc-name">${teams[0].name || 'Team 1'}</div>
            <div class="bc-amount">₹${budget - teams[0].spent}</div>
            <div class="bc-players">${teams[0].roster.length}/${teams[0].maxPlayers} players</div>
          </div>
          <div style="text-align:center;align-self:center;">
            <div style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;">Round</div>
            <div style="font-family:var(--font-heading);font-size:1.3rem;font-weight:800;">${auctionLog.length + 1}</div>
          </div>
          <div class="budget-card team-b">
            <div class="bc-name">${teams[1].name || 'Team 2'}</div>
            <div class="bc-amount">₹${budget - teams[1].spent}</div>
            <div class="bc-players">${teams[1].roster.length}/${teams[1].maxPlayers} players</div>
          </div>
        </div>

        ${!cp ? `
          <!-- No current player - pick next -->
          <div class="player-spotlight" style="border-color:var(--border-subtle);">
            <div class="empty-state">
              <div class="es-icon">🎲</div>
              <div class="es-text">Ready to pick the next player</div>
            </div>
            <button class="btn btn-gold btn-lg mt-16" id="btn-next-player">Draw Next Player</button>
          </div>
          <div class="bin-indicator">
            <span>📦 2nd Auction Bin:</span>
            <span class="bin-count">${auctionBin.length} players</span>
            <span style="margin-left:4px;">| 🎯 Pool: ${auctionPool.length} remaining</span>
          </div>
        ` : `
          <!-- Current player spotlight -->
          <div class="player-spotlight">
            <div class="spotlight-label">${auctionPhase === 'bin' ? '2nd Auction' : 'Now Bidding'}</div>
            <div style="margin:8px 0;">
              <span class="badge ${getSpecialityClass(cp.speciality)}">${getSpecialityBadge(cp.speciality)}</span>
            </div>
            <div class="spotlight-name">${cp.name}</div>
            <div class="spotlight-price">₹${currentPrice}</div>
            <div class="spotlight-bidder">
              ${highestBid ? `Highest: <strong style="color:var(--${highestBid.teamIdx === 0 ? 'team-a' : 'team-b'});">${teams[highestBid.teamIdx].name}</strong>` : 'Base Price — No bids yet'}
            </div>
            ${callState > 0 ? `<div style="font-family:var(--font-heading);font-size:1.5rem;font-weight:800;color:var(--accent-gold);margin-top:8px;animation:stampIn 0.3s ease;">${callLabels[callState]}</div>` : ''}
          </div>

          <!-- Bid controls -->
          <div class="bid-controls">
            ${callState < 3 ? `
              <div class="bid-row">
                <button class="btn btn-team-a btn-lg" id="btn-bid-0" ${!canTeamBid(0) || (highestBid && highestBid.teamIdx === 0) ? 'disabled' : ''}>
                  ${teams[0].name || 'Team 1'} Bids
                </button>
                <input type="number" class="bid-input" id="bid-amount" value="${highestBid ? highestBid.amount + 10 : basePrice}" min="${highestBid ? highestBid.amount + 1 : basePrice}" step="10" />
                <button class="btn btn-team-b btn-lg" id="btn-bid-1" ${!canTeamBid(1) || (highestBid && highestBid.teamIdx === 1) ? 'disabled' : ''}>
                  ${teams[1].name || 'Team 2'} Bids
                </button>
              </div>

              ${currentBids.length === 0 ? `
                <button class="btn btn-secondary" id="btn-no-bid">No Bid — Send to Bin</button>
              ` : `
                <div class="call-row">
                  <button class="btn-call ${callState >= 1 ? 'called' : ''}" id="btn-call1" ${callState >= 1 ? 'disabled' : ''}>Going Once</button>
                  <button class="btn-call ${callState >= 2 ? 'called' : ''}" id="btn-call2" ${callState < 1 || callState >= 2 ? 'disabled' : ''}>Going Twice</button>
                  <button class="btn-call ${callState >= 3 ? 'called' : ''}" id="btn-call3" ${callState < 2 ? 'disabled' : ''}>SOLD! 🔨</button>
                </div>
              `}
            ` : ''}
          </div>

          <!-- Bid history -->
          ${currentBids.length > 0 ? `
            <div style="width:100%;max-width:500px;margin-top:8px;">
              <div style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px;">Bid History</div>
              <div style="display:flex;flex-wrap:wrap;gap:4px;">
                ${currentBids.map(b => `<span style="font-size:0.75rem;padding:2px 8px;border-radius:4px;background:var(--${b.teamIdx === 0 ? 'team-a' : 'team-b'}-glow);color:var(--${b.teamIdx === 0 ? 'team-a' : 'team-b'});font-weight:600;">₹${b.amount}</span>`).join(' → ')}
              </div>
            </div>
          ` : ''}

          <div class="bin-indicator">
            <span>📦 Bin: <span class="bin-count">${auctionBin.length}</span></span>
            <span>| 🎯 Pool: ${auctionPool.length}</span>
          </div>
        `}
      </div>
      ${renderSidebar(1)}
    </div>
  `;

  // ===== EVENT HANDLERS =====

  // Draw next player
  const btnNext = container.querySelector('#btn-next-player');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      const s = getState();
      let pool = [...s.auctionPool];
      let phase = s.auctionPhase;
      let bin = [...s.auctionBin];

      if (pool.length === 0 && bin.length > 0 && phase === 'pool') {
        pool = [...bin];
        bin = [];
        phase = 'bin';
        // shuffle bin
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
      }

      if (pool.length === 0) {
        setState({ auctionPhase: 'done', currentStep: 4 });
        window.navigateToStep(4);
        return;
      }

      const nextId = pool.shift();
      playWhoosh();
      setState({
        currentPlayer: nextId,
        currentBids: [],
        callState: 0,
        auctionPool: pool,
        auctionBin: bin,
        auctionPhase: phase
      });
      renderAuction(container);
    });
  }

  // Place bid
  function placeBid(teamIdx) {
    const s = getState();
    const input = container.querySelector('#bid-amount');
    const amount = parseInt(input.value);
    const minBid = s.currentBids.length > 0 ? s.currentBids[s.currentBids.length - 1].amount + 1 : s.basePrice;

    if (isNaN(amount) || amount < minBid) {
      input.style.borderColor = 'var(--danger)';
      setTimeout(() => input.style.borderColor = '', 500);
      return;
    }

    const remaining = s.budget - s.teams[teamIdx].spent;
    if (amount > remaining) {
      input.style.borderColor = 'var(--danger)';
      setTimeout(() => input.style.borderColor = '', 500);
      return;
    }

    playTing();
    const bids = [...s.currentBids, { teamIdx, amount, team: s.teams[teamIdx].name }];
    setState({ currentBids: bids, callState: 0 });
    renderAuction(container);
  }

  const btnBid0 = container.querySelector('#btn-bid-0');
  const btnBid1 = container.querySelector('#btn-bid-1');
  if (btnBid0) btnBid0.addEventListener('click', () => placeBid(0));
  if (btnBid1) btnBid1.addEventListener('click', () => placeBid(1));

  // No bid
  const btnNoBid = container.querySelector('#btn-no-bid');
  if (btnNoBid) {
    btnNoBid.addEventListener('click', () => {
      const s = getState();
      playUnsold();
      const cp2 = s.players.find(p => p.id === s.currentPlayer);
      const log = [...s.auctionLog, {
        seq: s.auctionLog.length + 1,
        playerId: s.currentPlayer,
        playerName: cp2 ? cp2.name : '?',
        speciality: cp2 ? cp2.speciality : '',
        bids: [],
        finalPrice: null,
        wonBy: null,
        timestamp: new Date().toISOString()
      }];

      let bin = [...s.auctionBin];
      if (s.auctionPhase === 'pool') bin.push(s.currentPlayer);

      setState({ currentPlayer: null, currentBids: [], callState: 0, auctionBin: bin, auctionLog: log });
      renderAuction(container);
    });
  }

  // Going once / twice / sold - human-led
  const btnCall1 = container.querySelector('#btn-call1');
  const btnCall2 = container.querySelector('#btn-call2');
  const btnCall3 = container.querySelector('#btn-call3');

  if (btnCall1) btnCall1.addEventListener('click', () => {
    playGavel();
    setState({ callState: 1 });
    renderAuction(container);
  });

  if (btnCall2) btnCall2.addEventListener('click', () => {
    playGavel();
    setState({ callState: 2 });
    renderAuction(container);
  });

  if (btnCall3) btnCall3.addEventListener('click', () => {
    // SOLD!
    const s = getState();
    const winner = s.currentBids[s.currentBids.length - 1];
    const cp3 = s.players.find(p => p.id === s.currentPlayer);

    // Show sold overlay
    const overlay = document.createElement('div');
    overlay.className = 'sold-overlay';
    overlay.innerHTML = `<div class="sold-stamp">SOLD!</div>`;
    document.body.appendChild(overlay);
    playSold();
    // Vibrate on supported devices (mobile)
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    setTimeout(() => {
      overlay.remove();

      // Update team roster
      const updatedTeams = s.teams.map((t, i) => {
        if (i === winner.teamIdx) {
          return {
            ...t,
            roster: [...t.roster, { playerId: s.currentPlayer, price: winner.amount }],
            spent: t.spent + winner.amount
          };
        }
        return t;
      });

      const log = [...s.auctionLog, {
        seq: s.auctionLog.length + 1,
        playerId: s.currentPlayer,
        playerName: cp3 ? cp3.name : '?',
        speciality: cp3 ? cp3.speciality : '',
        bids: s.currentBids.map(b => ({ team: b.team, amount: b.amount })),
        finalPrice: winner.amount,
        wonBy: s.teams[winner.teamIdx].name,
        timestamp: new Date().toISOString()
      }];

      // Check if both teams full or budget done
      let phase = s.auctionPhase;
      let pool = [...s.auctionPool];
      const bothFull = updatedTeams.every(t => t.roster.length >= t.maxPlayers);
      const bothBroke = updatedTeams.every(t => (s.budget - t.spent - winner.amount * (t === updatedTeams[winner.teamIdx] ? 0 : 0)) < s.basePrice);

      if (bothFull) phase = 'done';
      if (pool.length === 0 && s.auctionBin.length === 0) phase = 'done';

      setState({
        teams: updatedTeams,
        currentPlayer: null,
        currentBids: [],
        callState: 0,
        auctionLog: log,
        auctionPhase: phase
      });

      if (phase === 'done') {
        setState({ currentStep: 4 });
        window.navigateToStep(4);
      } else {
        renderAuction(container);
      }
    }, 1800);
  });
}
