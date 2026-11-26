# Blackjack Trainer — Hand Totals, Betting Layout & Payout Animations

## Objective

Improve the visual presentation of player hands, wager placement, side bets, and round outcomes in the existing Blackjack Trainer.

The current issues are:

1. Player hand totals are not clearly displayed underneath the cards.
2. Win/loss amounts are not prominent enough.
3. Outcome notifications should appear centered above the corresponding hand.
4. Side bets are not displaying correctly.
5. Main wagers appear too far to the right when cards are dealt.
6. Losing wagers should visibly move toward the dealer.
7. Pushes need an explicit "PUSH" notification.
8. Wins and losses need clear, color-coded monetary feedback.

**Preserve all existing blackjack rules, betting functionality, card animations, split-hand behavior, bankroll calculations, and game mechanics.**

This is primarily a UI, positioning, and animation improvement task. Fix underlying state or rendering issues only where necessary.

---

## 1. Display Hand Totals Underneath Cards

Every active player hand should display its current blackjack total directly underneath its cards.

### Requirements

- Center the total horizontally relative to its corresponding hand.
- Update the total whenever cards are dealt, hit, doubled, or split.
- Support multiple player positions and split hands.
- Display the correct total for soft hands.
- Display "BUST" alongside or instead of the total when a hand exceeds 21.
- Keep totals readable against the blackjack table background.
- Avoid covering cards, chip stacks, or action buttons.

Suggested appearance:

- Compact rounded label.
- Dark translucent background.
- White or light-colored text.
- Slightly larger font for the numerical total.
- Red styling for busted hands.

Examples:

"17"

"Soft 18"

"21"

"BUST · 24"

The total should remain visually connected to its hand as cards spread or fan horizontally.

Use the existing hand-evaluation logic rather than creating a separate calculation system.

---

## 2. Center Wagers Behind the Cards

Currently, the main wager appears offset to the right after cards are dealt.

Correct this so each wager remains centered behind its corresponding hand.

### Requirements

- Position the main wager stack directly behind the horizontal center of the hand.
- The wager should visually sit farther toward the dealer than the player's cards.
- Keep the wager visible without obscuring card faces or hand totals.
- Preserve correct positioning as cards are added or fanned out.
- Support all player seats.
- Support multiple simultaneously active hands.
- Support split hands and doubled wagers.
- Prevent chip stacks from drifting when animations complete.

The wager must be positioned relative to the hand's actual visual center, not the card container's left or right edge.

Prefer a stable hand-centered coordinate system.

Do not use arbitrary offsets that only work for one player position.

---

## 3. Fix Side-Bet Visibility

Side bets are currently not displaying correctly.

Investigate why side-bet chip stacks or wager indicators are missing during gameplay.

Check:

- Side-bet state.
- Side-bet rendering conditions.
- Chip-stack components.
- Layering and z-index.
- Animation timing.
- Position calculations.
- Overflow clipping.
- Seat-specific rendering.
- Round transition behavior.

### Expected behavior

Every placed side bet must remain visibly associated with its player position.

Side bets should:

- Appear in their designated betting locations.
- Remain visible after cards are dealt.
- Be visually distinguishable from the main wager.
- Display their wager amounts clearly.
- Not overlap the main wager, cards, or hand totals.
- Remain correctly positioned for multiple player seats.

When a side bet resolves, its chip animation must match the actual result.

Do not change side-bet rules or payout calculations unless an existing bug is discovered.

---

## 4. Outcome Notifications Above Each Hand

Create or improve the existing hand-result notification system.

Each resolved hand should receive a large, clearly visible notification centered directly above its cards.

The notification should be associated with the specific hand, including split hands.

### Winning Hand

Display the net profit in bright green.

Example:

**+$100**

Requirements:

- Include the plus sign.
- Use a prominent font.
- Make the amount significantly larger than the existing notification.
- Add a subtle green glow.
- Animate upward slightly as it appears.
- Keep the result readable long enough for the player to recognize it.

The displayed positive amount must represent the actual net winnings, not the returned original wager.

For example:

A $100 main wager that wins at 1:1 should display +$100, not +$200.

### Losing Hand

Display the amount lost in bright red.

Example:

**-$100**

Requirements:

- Include the minus sign.
- Use the actual amount lost.
- Use large, bold typography.
- Add a subtle red glow.
- Animate upward or fade into view.
- Keep the result centered above the corresponding hand.

### Push

Display:

**PUSH**

Requirements:

- Use a neutral or amber color.
- Center the notification above the hand.
- Clearly distinguish it from a win or loss.
- Do not show a positive or negative amount for a standard push.
- Return the wager to the player's available balance according to the existing betting logic.

### Blackjack

For a natural blackjack, display the appropriate payout notification using the existing game rules.

For example:

**BLACKJACK! +$150**

For a $100 wager with a 3:2 payout.

Do not hardcode the payout ratio; use the actual table configuration.

### Timing

Show the notification when the corresponding hand's outcome has been determined.

Coordinate the notification with the chip animation.

Avoid showing win/loss amounts before the result is final.

Do not allow new-round transitions to immediately erase outcome notifications before they can be read.

---

## 5. Animate Losing Chips Toward the Dealer

When a main wager or side bet loses, its chip stack should visibly move toward the dealer.

### Expected animation

1. The hand or side bet resolves as a loss.
2. A red negative amount appears above the corresponding hand or wager.
3. The losing chip stack moves smoothly toward the dealer's chip collection area.
4. The stack fades or shrinks as it reaches the dealer.
5. The wager is removed from the table visually.

Use a short, smooth motion consistent with the existing card and chip animation style.

The destination should be the actual dealer-side collection area, not an arbitrary point offscreen.

### Important

The chip animation is visual only.

The game engine must remain the authoritative source for wager settlement.

Do not modify bankroll balances a second time when the animation finishes.

Avoid double deductions.

---

## 6. Animate Winning Chips and Payouts

When a wager wins:

- Display the positive net amount above the associated hand.
- Preserve the original wager's visual position until settlement begins.
- Animate winnings toward the player, or use the existing chip payout animation if one already exists.
- Keep the visual payout proportional to the actual outcome.
- Clear settled chips when the animation finishes.

For blackjack payouts, doubles, splits, and side bets, use the actual settlement result.

Do not assume every win pays 1:1.

Avoid creating duplicate chip stacks or adding winnings to the bankroll more than once.

---

## 7. Handle Side-Bet Outcomes

Side bets must settle independently from the main hand when appropriate.

### Side-Bet Loss

When a side bet does not hit:

- Display a red negative amount for that side bet.
- Animate its chips toward the dealer.
- Remove the settled wager from the table.

### Side-Bet Win

When a side bet wins:

- Display the positive net winnings.
- Use the actual configured payout.
- Play the appropriate payout animation.

### Side-Bet Push

If the supported side-bet rules permit a push:

- Display "PUSH".
- Return the original wager.
- Do not display a profit or loss.

Side-bet results should appear near their own wagering area so the player can distinguish them from the main-hand result.

Do not combine side-bet and main-hand profits into one misleading notification.

Side bets may resolve earlier than the main hand. Preserve the existing correct settlement timing.

---

## 8. Multiple Hands and Split Hands

All visuals must work independently for each hand.

For split hands:

- Display separate totals beneath each hand.
- Maintain a separately centered main wager for each hand.
- Display separate result notifications.
- Animate losing and winning chips independently.
- Use the correct doubled wager amount where applicable.

Example:

Left split hand:

**+$100**

Right split hand:

**-$100**

Do not combine them into one notification.

Ensure one hand's result does not overwrite another hand's result.

Support dynamic hand spacing when multiple hands occupy the same player position.

---

## 9. Layout and Layering

Inspect the current table rendering system before implementing the changes.

Identify the positioning hierarchy for:

- Player seats.
- Hand containers.
- Cards.
- Main wagers.
- Side-bet stacks.
- Hand totals.
- Active-hand action buttons.
- Result notifications.
- Dealer area.

Establish a consistent layering order.

Suggested visual hierarchy:

1. Table background.
2. Betting spots.
3. Chip stacks.
4. Playing cards.
5. Hand totals.
6. Result notifications.
7. Interactive controls.

Temporary chip animations may render above other elements when necessary.

Avoid clipping result notifications or animated chips due to container overflow.

Ensure cards and chips do not overlap important text.

Keep the table attractive at different viewport sizes.

Do not introduce unrelated layout changes.

---

## 10. Animation and Performance

Use the existing animation system wherever possible.

Prefer transform-based animations.

Keep transitions smooth and responsive.

Do not add heavy libraries unless the project already uses them.

Avoid:

- Unnecessary rerenders.
- Layout shifts.
- Conflicting animation timelines.
- Duplicate settlement effects.
- Chip stacks remaining visible after settlement.
- Result notifications appearing over the wrong hand.

Respect reduced-motion preferences.

If animations are skipped, the final UI and settlement state must still be correct.

---

## 11. Preserve Game Engine Integrity

Do not change the core blackjack engine unless necessary to correct an identified defect.

The engine must remain responsible for:

- Hand totals.
- Soft and hard hand evaluation.
- Win/loss/push determination.
- Blackjack payout ratios.
- Side-bet payout rules.
- Split wagers.
- Double-down wagers.
- Bankroll transactions.
- Round settlement.

The UI should consume these existing authoritative values.

Do not independently recalculate winnings inside animation components.

If the existing settlement data does not contain the amounts needed for the UI, introduce the smallest appropriate extension to the settlement result model.

Use stable identifiers for seats, hands, and individual wagers so animations remain associated with the correct outcome.

---

## 12. Testing Requirements

Test the following scenarios.

### Hand Totals

1. Initial two-card hand.
2. Hit.
3. Stand.
4. Double down.
5. Soft hand.
6. Hard hand.
7. Bust.
8. Natural blackjack.
9. Split hands.
10. Multiple player positions.

### Main Wagers

1. Wager placement before dealing.
2. Wager position after dealing.
3. Additional cards.
4. Split hands.
5. Double down.
6. Win.
7. Loss.
8. Push.
9. Blackjack payout.

### Side Bets

1. Side bet placed before dealing.
2. Side bet remains visible after cards are dealt until settlement.
3. Side bet wins.
4. Side bet loses.
5. Side bet pushes, if supported.
6. Multiple side bets.
7. Multiple player positions.
8. Side bet settles before the main hand.

### Result Notifications

1. Winning hand displays the correct positive amount.
2. Losing hand displays the correct negative amount.
3. Push displays "PUSH".
4. Blackjack displays the correct configured payout.
5. Split hands receive independent notifications.
6. Notifications appear above the correct hand.
7. Notifications remain visible for an appropriate duration.
8. Starting a new round clears old notifications.

### Animation and Bankroll

1. Losing chips move toward the dealer.
2. Winning chips follow the correct payout animation.
3. Side-bet losing chips move toward the dealer.
4. No duplicate deductions.
5. No duplicate winnings.
6. Skipped animations do not change settlement.
7. Browser refresh does not duplicate transactions.
8. Rebet and Rebet & Deal continue working.

---

## 13. Implementation Instructions

First, inspect the existing codebase and identify how hands, wagers, side bets, settlement results, and animations are currently rendered.

Determine the root cause of the side-bet visibility issue and the right-offset wager positioning.

Implement the requested changes using the existing architecture.

Avoid large refactors or unnecessary dependencies.

Preserve the current table design and all previously implemented features.

Run applicable tests and build checks.

When finished, provide:

1. A summary of the changes.
2. Files modified.
3. The cause of the wager positioning issue.
4. The cause of the missing side bets.
5. How chip movements and result notifications are synchronized with settlement.
6. Test results.
7. Any remaining manual visual checks.

**The final experience should make the outcome of every hand immediately clear: totals beneath the cards, centered wagers, visible side bets, and prominent win/loss/push notifications above the corresponding hand.**