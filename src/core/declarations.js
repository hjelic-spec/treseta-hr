const DECLARABLE_RANKS = [1, 2, 3];

export function detectDeclarations(hand) {
  const declarations = [];

  for (const rank of DECLARABLE_RANKS) {
    const cards = hand.filter(c => c.rank === rank);
    if (cards.length === 4) {
      declarations.push({ type: 'four_of_kind', rank, cards: [...cards], points: 4 });
    } else if (cards.length === 3) {
      declarations.push({ type: 'three_of_kind', rank, cards: [...cards], points: 3 });
    }
  }

  const bySuit = {};
  for (const card of hand) {
    if (!bySuit[card.suit]) bySuit[card.suit] = [];
    bySuit[card.suit].push(card);
  }

  for (const [suit, cards] of Object.entries(bySuit)) {
    const ranks = new Set(cards.map(c => c.rank));
    if (ranks.has(1) && ranks.has(2) && ranks.has(3)) {
      const napCards = cards.filter(c => [1, 2, 3].includes(c.rank));
      declarations.push({ type: 'napolitana', suit, cards: napCards, points: 3 });
    }
  }

  return declarations;
}

export function totalDeclarationPoints(declarations) {
  return declarations.reduce((sum, d) => sum + d.points, 0);
}
