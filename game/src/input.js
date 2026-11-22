// Ember Duel — mouse and keyboard input.
// Click a card to select it, click it again (or the foe, or Enter) to play it.
// 1–7 select a card, Enter plays it, Esc cancels, Space ends the turn.

export function wireInput(ctx) {
  const hand = document.getElementById('player-hand');
  hand.addEventListener('click', (event) => {
    const cardEl = event.target.closest('.card');
    if (!cardEl) return;
    const id = Number(cardEl.dataset.id);
    ctx.clickCard(id);
  });

  document.getElementById('foe-zone').addEventListener('click', () => ctx.clickFoe());
  document.getElementById('table-zone').addEventListener('click', () => ctx.clickTable());
  document.getElementById('end-turn').addEventListener('click', () => ctx.endTurn());
  document.getElementById('start-btn').addEventListener('click', () => ctx.startDuel());
  document.getElementById('play-again-btn').addEventListener('click', () => ctx.startDuel());
  document.getElementById('sound-btn').addEventListener('click', () => ctx.toggleMute());
  document.getElementById('restart-btn').addEventListener('click', () => ctx.startDuel());

  document.addEventListener('keydown', (event) => {
    const state = ctx.getState();
    if (state.screen === 'title' && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      ctx.startDuel();
      return;
    }
    if (state.screen === 'duel' && state.phase === 'player') {
      if (event.key >= '1' && event.key <= '7') {
        const index = Number(event.key) - 1;
        const card = state.player.hand[index];
        if (card) ctx.clickCard(card.id);
      } else if (event.key === 'Enter') {
        if (state.selectedId !== null) ctx.playSelected();
      } else if (event.key === 'Escape') {
        ctx.deselect();
      } else if (event.key === ' ') {
        event.preventDefault();
        ctx.endTurn();
      }
    }
    if ((state.screen === 'won' || state.screen === 'lost') && event.key === 'Enter') {
      ctx.startDuel();
    }
  });
}
