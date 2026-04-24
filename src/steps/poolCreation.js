import { getState, setState, SPECIALITIES, getSpecialityBadge, getSpecialityClass } from '../state.js';
import { playTing } from '../utils/sound.js';

let nextId = Date.now();

export function renderPoolCreation(container) {
  const state = getState();
  const players = state.players || [];

  container.innerHTML = `
    <div class="card">
      <h2 class="card-title">🏏 Player Pool</h2>
      <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:20px;">
        Add players. For bulk paste, just enter names one per line. You can set specialities later.
      </p>

      <div class="tab-toggle">
        <button class="tab-btn active" data-tab="single" id="tab-single">Single Add</button>
        <button class="tab-btn" data-tab="bulk" id="tab-bulk">Bulk Paste</button>
      </div>

      <!-- Single add -->
      <div id="panel-single">
        <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
          <div class="form-group" style="flex:1;min-width:180px;margin-bottom:0;">
            <label class="form-label" for="player-name">Player Name</label>
            <input type="text" class="form-input" id="player-name" placeholder="e.g. Virat Kohli" />
          </div>
          <div class="form-group" style="width:200px;margin-bottom:0;">
            <label class="form-label" for="player-spec">Speciality</label>
            <select class="form-select" id="player-spec">
              ${SPECIALITIES.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
          </div>
          <button class="btn btn-primary" id="btn-add-player">+ Add</button>
        </div>
      </div>

      <!-- Bulk add -->
      <div id="panel-bulk" class="hidden">
        <div class="form-group">
          <label class="form-label">Paste Player Names (one per line)</label>
          <textarea class="form-textarea" id="bulk-input" placeholder="Virat Kohli&#10;Rohit Sharma&#10;Jasprit Bumrah&#10;Hardik Pandya"></textarea>
        </div>
        <button class="btn btn-primary" id="btn-bulk-add">Add All</button>
      </div>

      <!-- Player list -->
      <div style="margin-top:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-weight:600;font-size:0.9rem;">Players Added</span>
          <span class="badge badge-all" style="font-size:0.75rem;">${players.length} players</span>
        </div>
        <div class="player-list-detailed" id="player-list">
          ${players.length === 0 ? '<div class="empty-state"><div class="es-icon">👥</div><div class="es-text">No players added yet</div></div>' : ''}
          <div style="display:grid; grid-template-columns: 1fr auto auto; gap: 12px; width: 100%;">
            ${players.map(p => `
              <div class="player-row-item" style="display:contents;">
                <div class="form-input" style="background:transparent; border:none; padding-left:0;">${p.name}</div>
                <select class="form-select spec-change-dropdown" data-id="${p.id}" style="padding: 4px 8px; font-size: 0.8rem; width: auto;">
                  ${SPECIALITIES.map(s => `<option value="${s}" ${p.speciality === s ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
                <button class="btn btn-danger btn-sm remove-btn" data-id="${p.id}" style="padding: 4px 10px;">✕</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <div class="nav-buttons">
      <div></div>
      <button class="btn btn-primary btn-lg" id="btn-next-step" ${players.length < 2 ? 'disabled' : ''}>
        Next: Team Setup →
      </button>
    </div>
  `;

  // Tab switching
  container.querySelector('#tab-single').addEventListener('click', () => {
    container.querySelector('#tab-single').classList.add('active');
    container.querySelector('#tab-bulk').classList.remove('active');
    container.querySelector('#panel-single').classList.remove('hidden');
    container.querySelector('#panel-bulk').classList.add('hidden');
  });
  container.querySelector('#tab-bulk').addEventListener('click', () => {
    container.querySelector('#tab-bulk').classList.add('active');
    container.querySelector('#tab-single').classList.remove('active');
    container.querySelector('#panel-bulk').classList.remove('hidden');
    container.querySelector('#panel-single').classList.add('hidden');
  });

  // Single add
  container.querySelector('#btn-add-player').addEventListener('click', () => {
    const nameInput = container.querySelector('#player-name');
    const name = nameInput.value.trim();
    if (!name) return nameInput.focus();
    const spec = container.querySelector('#player-spec').value;
    const updated = [...getState().players, { id: nextId++, name, speciality: spec }];
    setState({ players: updated });
    playTing();
    renderPoolCreation(container);
    // Auto-focus the name input for quick successive adds
    setTimeout(() => {
      const newInput = container.querySelector('#player-name');
      if (newInput) newInput.focus();
    }, 50);
  });

  // Enter key
  container.querySelector('#player-name').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') container.querySelector('#btn-add-player').click();
  });

  // Bulk add
  container.querySelector('#btn-bulk-add').addEventListener('click', () => {
    const text = container.querySelector('#bulk-input').value.trim();
    if (!text) return;
    const lines = text.split('\n').filter(l => l.trim());
    const newPlayers = lines.map(line => {
      const name = line.split(',')[0].trim(); // Take first part even if comma exists
      return { id: nextId++, name, speciality: 'Batsman' };
    }).filter(p => p.name);
    const updated = [...getState().players, ...newPlayers];
    setState({ players: updated });
    renderPoolCreation(container);
  });

  // Speciality change
  container.querySelectorAll('.spec-change-dropdown').forEach(dropdown => {
    dropdown.addEventListener('change', (e) => {
      const id = parseInt(e.target.dataset.id);
      const newSpec = e.target.value;
      const updated = getState().players.map(p => p.id === id ? { ...p, speciality: newSpec } : p);
      setState({ players: updated });
    });
  });

  // Remove player
  container.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const updated = getState().players.filter(p => p.id !== id);
      setState({ players: updated });
      renderPoolCreation(container);
    });
  });

  // Next step
  container.querySelector('#btn-next-step').addEventListener('click', () => {
    if (getState().players.length < 2) return;
    setState({ currentStep: 1 });
    window.navigateToStep(1);
  });
}
