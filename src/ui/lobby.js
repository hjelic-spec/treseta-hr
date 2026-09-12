export function createLobby(onStart) {
  const lobby = document.createElement('div');
  lobby.id = 'lobby';
  lobby.innerHTML = `
    <div class="lobby-content">
      <div class="lobby-fan">
        <img src="assets/cards/dinari_1.png" class="fan-card" style="transform: rotate(-20deg) translateY(5px);">
        <img src="assets/cards/kupe_1.png" class="fan-card" style="transform: rotate(-7deg) translateY(-2px);">
        <img src="assets/cards/bate_1.png" class="fan-card" style="transform: rotate(7deg) translateY(-2px);">
        <img src="assets/cards/spade_1.png" class="fan-card" style="transform: rotate(20deg) translateY(5px);">
      </div>
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
        <button class="btn btn-primary btn-start" id="btn-start">Igraj</button>
      </div>
    </div>
  `;

  lobby.querySelectorAll('.radio-option').forEach(opt => {
    opt.addEventListener('click', () => {
      lobby.querySelectorAll('.radio-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      opt.querySelector('input').checked = true;
    });
  });

  lobby.querySelector('#btn-start').addEventListener('click', () => {
    const variant = lobby.querySelector('input[name="variant"]:checked').value;
    onStart({ mode: 'solo', variant });
  });

  return lobby;
}
