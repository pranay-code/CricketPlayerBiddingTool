import { getState, setState, getSpecialityBadge } from '../state.js';

export function renderTeamSetup(container) {
  const state = getState();
  const players = state.players || [];
  const teams = state.teams;

  container.innerHTML = `
    <div class="card">
      <h2 class="card-title">⚔️ Team Setup</h2>
      <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:24px;">
        Define your two teams. Captains will be excluded from the auction — they do the bidding!
      </p>

      <div class="two-col">
        ${teams.map((team, i) => `
          <div class="card" style="border-color:var(--${team.color});">
            <h3 style="color:var(--${team.color});font-family:var(--font-heading);margin-bottom:16px;">
              ${i === 0 ? '🔵' : '🟠'} Team ${i + 1}
            </h3>
            <div class="form-group">
              <label class="form-label">Team Name</label>
              <input type="text" class="form-input team-name" data-idx="${i}" value="${team.name}" placeholder="e.g. Chennai Super Kings" />
            </div>
            <div class="form-group">
              <label class="form-label">Captain (excluded from auction)</label>
              <select class="form-select team-captain" data-idx="${i}">
                <option value="">— Select Captain —</option>
                ${players.map(p => `<option value="${p.id}" ${team.captain === p.id ? 'selected' : ''}>${p.name} (${getSpecialityBadge(p.speciality)})</option>`).join('')}
              </select>
            </div>
            <div style="display:flex;gap:12px;">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Min Players</label>
                <input type="number" class="form-input team-min" data-idx="${i}" value="${team.minPlayers}" min="1" max="20" />
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Max Players</label>
                <input type="number" class="form-input team-max" data-idx="${i}" value="${team.maxPlayers}" min="1" max="30" />
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div id="team-error" style="color:var(--danger);font-size:0.85rem;margin-top:12px;text-align:center;display:none;"></div>
    </div>

    <div class="nav-buttons">
      <button class="btn btn-secondary" id="btn-back">← Back</button>
      <button class="btn btn-primary btn-lg" id="btn-next-step">Next: Budget →</button>
    </div>
  `;

  // Save on change
  function saveTeams() {
    const updated = [...state.teams];
    container.querySelectorAll('.team-name').forEach(el => { updated[el.dataset.idx].name = el.value.trim(); });
    container.querySelectorAll('.team-captain').forEach(el => { updated[el.dataset.idx].captain = el.value ? parseInt(el.value) : null; });
    container.querySelectorAll('.team-min').forEach(el => { updated[el.dataset.idx].minPlayers = parseInt(el.value) || 1; });
    container.querySelectorAll('.team-max').forEach(el => { updated[el.dataset.idx].maxPlayers = parseInt(el.value) || 11; });
    setState({ teams: updated });
  }

  container.querySelectorAll('.team-name, .team-captain, .team-min, .team-max').forEach(el => {
    el.addEventListener('change', saveTeams);
    el.addEventListener('input', saveTeams);
  });

  // Validation
  function validate() {
    saveTeams();
    const t = getState().teams;
    const errEl = container.querySelector('#team-error');

    if (!t[0].name || !t[1].name) {
      errEl.textContent = 'Both teams need a name.';
      errEl.style.display = 'block';
      return false;
    }
    if (!t[0].captain || !t[1].captain) {
      errEl.textContent = 'Both teams need a captain.';
      errEl.style.display = 'block';
      return false;
    }
    if (t[0].captain === t[1].captain) {
      errEl.textContent = 'Captains must be different players.';
      errEl.style.display = 'block';
      return false;
    }
    if (t[0].minPlayers > t[0].maxPlayers || t[1].minPlayers > t[1].maxPlayers) {
      errEl.textContent = 'Min players cannot exceed max players.';
      errEl.style.display = 'block';
      return false;
    }
    errEl.style.display = 'none';
    return true;
  }

  container.querySelector('#btn-next-step').addEventListener('click', () => {
    if (!validate()) return;
    setState({ currentStep: 2 });
    window.navigateToStep(2);
  });

  container.querySelector('#btn-back').addEventListener('click', () => {
    setState({ currentStep: 0 });
    window.navigateToStep(0);
  });
}
