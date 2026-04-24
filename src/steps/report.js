import { getState, getSpecialityBadge, getSpecialityClass } from '../state.js';
import { generateReport } from '../utils/pdfGenerator.js';

export function renderReport(container) {
  const state = getState();
  const { teams, players, budget, auctionLog } = state;

  function teamCard(team, idx) {
    const capPlayer = players.find(p => p.id === team.captain);
    const totalSpent = team.roster.reduce((s, e) => s + e.price, 0);
    const isA = idx === 0;

    return `
      <div class="report-team-card ${isA ? 'team-a' : 'team-b'}">
        <h3 style="color:var(--${isA ? 'team-a' : 'team-b'});">
          ${isA ? '🔵' : '🟠'} ${team.name || `Team ${idx+1}`}
        </h3>
        ${capPlayer ? `
          <div class="report-player-row captain">
            <span class="rp-name">🏅 ${capPlayer.name} <span class="badge ${getSpecialityClass(capPlayer.speciality)}" style="font-size:0.6rem;">${getSpecialityBadge(capPlayer.speciality)}</span> — Captain</span>
          </div>
        ` : ''}
        ${team.roster.map(e => {
          const p = players.find(pl => pl.id === e.playerId);
          if (!p) return '';
          return `
            <div class="report-player-row">
              <span class="rp-name">${p.name} <span class="badge ${getSpecialityClass(p.speciality)}" style="font-size:0.6rem;">${getSpecialityBadge(p.speciality)}</span></span>
              <span class="rp-price">₹${e.price}</span>
            </div>
          `;
        }).join('')}
        <div class="report-summary">
          <div class="rs-item"><strong>${team.roster.length + (team.captain ? 1 : 0)}</strong> Players</div>
          <div class="rs-item"><strong>₹${totalSpent}</strong> Spent</div>
          <div class="rs-item"><strong>₹${budget - totalSpent}</strong> Remaining</div>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="report-header">
      <h2>🏆 ADPL Auction Complete!</h2>
      <p>Official final breakdown of the Adani Digital Premier League Auction.</p>
    </div>

    <div class="two-col mb-16">
      ${teamCard(teams[0], 0)}
      ${teamCard(teams[1], 1)}
    </div>

    <div class="card mt-24">
      <h2 class="card-title">📋 Auction Timeline</h2>
      <table class="timeline-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Type</th>
            <th>Base</th>
            <th>Bid Sequence</th>
            <th>Final</th>
            <th>Won By</th>
          </tr>
        </thead>
        <tbody>
          ${auctionLog.map((entry, i) => `
            <tr>
              <td>${i + 1}</td>
              <td style="font-weight:600;">${entry.playerName}</td>
              <td><span class="badge ${getSpecialityClass(entry.speciality)}" style="font-size:0.6rem;">${getSpecialityBadge(entry.speciality)}</span></td>
              <td>₹${state.basePrice}</td>
              <td style="font-size:0.75rem;">${entry.bids.length > 0 ? entry.bids.map(b => `${b.team}: ₹${b.amount}`).join(' → ') : '—'}</td>
              <td style="font-weight:700;color:${entry.finalPrice ? 'var(--accent-gold)' : 'var(--text-muted)'};">${entry.finalPrice ? `₹${entry.finalPrice}` : 'Unsold'}</td>
              <td style="font-weight:600;">${entry.wonBy || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="nav-buttons mt-24">
      <button class="btn btn-secondary" id="btn-new-auction">🔄 New Auction</button>
      <button class="btn btn-gold btn-lg" id="btn-download-pdf">📄 Download PDF Report</button>
    </div>
  `;

  container.querySelector('#btn-download-pdf').addEventListener('click', () => {
    generateReport(state);
  });

  container.querySelector('#btn-new-auction').addEventListener('click', () => {
    if (confirm('Start a completely new auction? This will clear all data.')) {
      localStorage.removeItem('cricketAuctionState');
      location.reload();
    }
  });
}
