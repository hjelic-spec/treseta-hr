export function createLobby(onStart) {
  const lobby = document.createElement('div');
  lobby.id = 'lobby';
  lobby.innerHTML = `
    <div class="lobby-content">
      <h1 class="lobby-title">Treseta</h1>
      <p class="lobby-subtitle">Igra na karata</p>

      <div class="lobby-section">
        <h3>Pravila</h3>
        <div class="radio-group" id="variant-select">
          <label class="radio-option selected">
            <input type="radio" name="variant" value="dubrovnik" checked>
            <span class="radio-label">Kako se igra u Dubrovniku</span>
            <span class="radio-desc">Bez zvanja, do 41 ponat</span>
          </label>
          <label class="radio-option">
            <input type="radio" name="variant" value="u_manje">
            <span class="radio-label">Dančarski horor</span>
            <span class="radio-desc">5 igrača, svak za sebe, skupi najmanje ponata — ispada tko prvi dođe do 101, pobjeđuje tko ima najmanje</span>
          </label>
        </div>
      </div>

      <div class="lobby-section">
        <h3>Način igre</h3>
        <div class="mode-buttons">
          <button class="btn btn-mode" data-mode="solo">
            <span class="mode-icon">🧑</span>
            <span class="mode-text">Sam protiv 3 bota</span>
          </button>
          <button class="btn btn-mode" data-mode="duo_vs_bots">
            <span class="mode-icon">👥</span>
            <span class="mode-text">2 igrača vs 2 bota</span>
            <span class="mode-soon">Uskoro</span>
          </button>
          <button class="btn btn-mode" data-mode="four_players">
            <span class="mode-icon">👥👥</span>
            <span class="mode-text">2 vs 2 igrača</span>
            <span class="mode-soon">Uskoro</span>
          </button>
        </div>
      </div>
    </div>
  `;

  lobby.querySelectorAll('.radio-option').forEach(opt => {
    opt.addEventListener('click', () => {
      lobby.querySelectorAll('.radio-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      opt.querySelector('input').checked = true;
      const variant = opt.querySelector('input').value;
      const soloBtn = lobby.querySelector('[data-mode="solo"] .mode-text');
      if (soloBtn) {
        soloBtn.textContent = variant === 'u_manje' ? 'Sam protiv 4 bota' : 'Sam protiv 3 bota';
      }
    });
  });

  lobby.querySelectorAll('.btn-mode').forEach(btn => {
    const mode = btn.dataset.mode;
    if (mode === 'solo') {
      btn.addEventListener('click', () => {
        const variant = lobby.querySelector('input[name="variant"]:checked').value;
        onStart({ mode, variant });
      });
    } else {
      btn.disabled = true;
      btn.classList.add('btn-disabled');
    }
  });

  return lobby;
}
