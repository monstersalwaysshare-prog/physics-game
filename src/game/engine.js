// src/game/engine.js

// Utility: return a new array with elements shuffled (Fisher–Yates)
// The algorithm guarantees every shuffle is unbiased, no slot or card consistently appreas early or late
// player can not game the system by memorizing patterns.
export function shuffle(array) {
  const a = array.slice(); // copy
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = a[i];
    a[i] = a[j];
    a[j] = temp;
  }
  return a;
}

// Utility: choose a random integer in [min, max] inclusive
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * IPO:
 * Given one scenario object (from scenarios.json),
 * generate one card for each slot using the smart-random strategy.
 * Returns an array of objects:
 *   { slotId, category, cardId, isCorrect }
 */
export function generateCardsForScenario(scenario) {
  //Count how many slots the scenario has
  const slots = scenario.slots || [];
  const nSlots = slots.length;

  if (nSlots === 0) {
    return [];
  }

  // Step 1: choose K = number of correct cards we want for this scenario 
  // - smart random, min 2 max 5 correct of each scenario
  // - students will see at least 2 correct ones, at most 5 correct ones
  const minCorrect = 2;
  const maxCorrect = Math.min(5, nSlots);
  const K = randomInt(minCorrect, maxCorrect);

  // Step 2: randomly choose which slot indices will be correct
  const indices = Array.from({ length: nSlots }, (_, i) => i);
  const shuffledIndices = shuffle(indices);
  const correctIndices = new Set(shuffledIndices.slice(0, K));

  // Step 3: for each slot, pick a card
  const result = [];

  for (let i = 0; i < nSlots; i += 1) //for a slot (7 cards), 1 loop 1 card
    {
    const slot = slots[i];
    const wantCorrect = correctIndices.has(i);

    let chosenCardId = null;
    let isCorrect = false;

    if (wantCorrect) 
    {
      if (slot.correctCards && slot.correctCards.length > 0) 
        {
        const idx = randomInt(0, slot.correctCards.length - 1);
        chosenCardId = slot.correctCards[idx];
        isCorrect = true;
        } 
        else if (slot.incorrectCards && slot.incorrectCards.length > 0) 
        {
        const idx = randomInt(0, slot.incorrectCards.length - 1);
        chosenCardId = slot.incorrectCards[idx];
        isCorrect = false;
       }
    }  else 
    {
      if (slot.incorrectCards && slot.incorrectCards.length > 0) 
      {
        const idx = randomInt(0, slot.incorrectCards.length - 1);
        chosenCardId = slot.incorrectCards[idx];
        isCorrect = false;
      } 
      else if (slot.correctCards && slot.correctCards.length > 0) 
      {
        const idx = randomInt(0, slot.correctCards.length - 1);
        chosenCardId = slot.correctCards[idx];
        isCorrect = true;
      }
    }

    // If we still did not pick anything, skip that slot - f a slot somehow has no cards in either list
    if (chosenCardId !== null) 
        {
      result.push({
        slotId: slot.slotId,
        category: slot.category,
        cardId: chosenCardId,
        isCorrect: isCorrect
      });
    }
  }

  // Step 4: shuffle final cards so student cannot guess by position
  return shuffle(result);
}
