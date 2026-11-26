# BLACKJACK TRAINER — GAMEPLAY UI/UX OVERHAUL & BUG FIXES

## 1. OBJECTIVE

You are a senior game developer, UI/UX designer, Phaser 3 specialist, and React/TypeScript software engineer.

Your assignment is to substantially improve the existing Blackjack Trainer application.

The application already has an established master development specification and an existing implementation.

This is not a request to rebuild the application from scratch.

Inspect the existing codebase, understand the current architecture, identify the causes of existing problems, and implement a comprehensive gameplay interface overhaul.

The primary objectives are:

- Make gameplay significantly more intuitive.
- Make the table itself the primary interactive interface.
- Eliminate unnecessary separation between gameplay and controls.
- Improve responsiveness and input reliability.
- Improve visual chip representation.
- Improve split-hand presentation.
- Make educational assistance feel naturally integrated into gameplay.
- Reduce unnecessary clicks.
- Improve the speed of starting subsequent rounds.
- Create an authentic, premium casino table experience.
- Make the application an enjoyable and valuable educational tool.

A new player should be able to open the application and quickly understand how to place wagers, deal cards, make decisions, and begin another round without requiring extensive instructions.

The game should feel like a polished standalone blackjack product, not a collection of web components surrounding a canvas.

---

## 2. EXISTING REQUIREMENTS AND IMPLEMENTATION

Before making changes:

1. Inspect the existing project.
2. Read AGENTS.md and existing project documentation.
3. Review the original master development specification.
4. Inspect the current Phaser scenes.
5. Inspect the blackjack engine.
6. Inspect React and Phaser synchronization.
7. Inspect betting state management.
8. Inspect chip rendering.
9. Inspect existing card annotations.
10. Inspect strategy assistance and card counting systems.
11. Inspect responsive layouts.
12. Run existing validation commands.

Preserve existing working functionality unless this specification explicitly changes it.

This document supersedes conflicting requirements in the original specification concerning:

- Gameplay control placement.
- Chip denominations.
- Maximum main wagers.
- Visual chip stack composition.
- Chip stack total placement.
- Basic strategy recommendation timing.
- Running count presentation.
- Split-hand presentation.
- Post-round betting controls.

All other established gameplay rules, payout ratios, educational features, persistence requirements, statistics, privacy requirements, and architectural boundaries remain in effect.

Do not introduce unnecessary changes to the underlying blackjack mathematics.

---

## 3. OVERALL DESIGN DIRECTION

The desired visual direction is:

**Premium casino graphics combined with modern floating interfaces.**

Combine:

- Authentic casino table textures.
- Realistic dimensional chips.
- Attractive playing cards.
- Smooth card dealing animations.
- Modern compact controls.
- Contextual floating interfaces.
- Clear typography.
- Restrained visual effects.
- Excellent usability.

Avoid making the gameplay interface resemble:

- An administrative dashboard.
- A collection of disconnected cards and panels.
- A traditional HTML form.
- A generic component-library demonstration.
- A canvas surrounded by excessive buttons.

The table should be the centerpiece of the experience.

Visual elements should have clear hierarchy and purpose.

Do not introduce excessive glowing elements, gradients, shadows, or animations that compete for the player's attention.

Use visual emphasis primarily to communicate meaningful gameplay states.

---

## 4. INTEGRATE ALL GAMEPLAY CONTROLS INTO THE TABLE

This is a non-negotiable requirement.

**No gameplay controls should appear underneath the blackjack table.**

Remove existing below-table gameplay control sections.

All ordinary gameplay interactions must be accessible directly on or within the table's visual boundaries.

This includes:

- Chip denomination selection.
- Undo.
- Clear wagers.
- Rebet.
- Rebet & Deal.
- Double Bet.
- Deal.
- Hit.
- Stand.
- Double.
- Split.
- Insurance decisions.
- Even money decisions.
- Running count visibility.
- Count checks.
- Contextual gameplay messages.
- Hand status indicators.
- Relevant wager information.

Controls may be rendered using Phaser or React overlays, depending on which implementation provides the best accessibility, reliability, and maintainability.

However, React overlays must visually belong to the table and remain correctly positioned relative to the relevant table elements.

Do not interpret this requirement as forcing every control to be rendered inside the Phaser canvas.

Settings, statistics, tutorials, wallet management, and other secondary application features may remain accessible through appropriate navigation, dialogs, drawers, or overlays.

The player should never need to scroll below the table to perform an ordinary gameplay action.

---

## 5. RESPONSIVE TABLE LAYOUT SYSTEM

Implement or significantly improve the existing dynamic table layout system.

The layout must intelligently allocate space for:

- Dealer cards.
- Shoe.
- Discard tray.
- Running count indicator.
- Original betting positions.
- Main wagers.
- Side wagers.
- Player cards.
- Split hands.
- Floating action controls.
- Hand statuses.
- Chip denomination tray.
- Betting controls.
- Settlement animations.

Do not rely exclusively on fixed coordinates intended for a single screen resolution.

Create a centralized layout system capable of calculating positions and dimensions based on:

- Available viewport width.
- Available viewport height.
- Device orientation.
- Number of occupied betting positions.
- Number of hands in each position.
- Number of cards in each hand.
- Current round phase.
- Enabled side bets.
- Enabled educational annotations.
- Current visual theme.

Recalculate positions when relevant conditions change.

Transitions between layouts should feel smooth and deliberate.

Avoid unnecessary movement of unrelated table elements.

### Desktop

Take advantage of available horizontal space.

Maintain an authentic blackjack table composition with generous card spacing and clearly identifiable betting positions.

### Mobile portrait

Implement a dedicated portrait table layout.

Do not simply shrink the desktop table until everything becomes unreadable.

Rearrange elements intelligently to accommodate narrow screens.

Prioritize:

- Readable cards.
- Accessible touch targets.
- Convenient chip placement.
- Visible hand controls.
- Clear active-hand identification.
- Visibility of all split hands.

### Mobile landscape

Use available horizontal space efficiently while keeping the necessary controls within comfortable reach.

### General requirements

- No unintended horizontal scrolling.
- No gameplay controls outside the table.
- No overlapping interactive controls.
- No clipped wager labels.
- No inaccessible buttons.
- No hidden player hands.
- No card annotations obscured by unrelated elements.

---

## 6. FLOATING HAND ACTION BUTTONS

Remove the existing global player action control bar.

Replace it with contextual floating controls displayed directly above the currently active player hand.

The controls must include:

- Hit.
- Stand.
- Double.
- Split.

Use compact rounded buttons with recognizable icons and text labels.

Do not rely exclusively on icons.

### Active-hand behavior

Only the currently active hand should display interactive action buttons.

When the active hand changes:

1. Remove or transition away the previous hand's controls.
2. Identify the new active hand.
3. Position the action controls directly above it.
4. Update legal action availability.
5. Begin any applicable educational recommendation timer.

The floating controls must follow their corresponding hand when the layout changes.

They must not appear detached from their associated cards.

### Unavailable actions

Keep all four ordinary actions visible.

Illegal or unaffordable actions must remain visible but disabled and visually dimmed.

Examples:

- Split when the hand is not eligible.
- Double when the hand contains more than two cards.
- Split when the maximum split capacity has been reached.
- Double when the available bankroll is insufficient.
- Hit when a restricted split-ace hand cannot hit.

Where appropriate, provide a concise explanation for disabled actions through accessible tooltips or contextual feedback.

The engine must remain responsible for determining legal actions.

The visual interface must never become the authoritative source of blackjack legality.

### Input responsiveness

Buttons should respond immediately to valid interactions.

Prevent duplicate commands caused by:

- Rapid clicking.
- Double tapping.
- Multiple event handlers.
- Animation completion callbacks.
- Stale React state.
- Simultaneous keyboard and pointer input.

Do not artificially delay accepted gameplay actions.

---

## 7. DELAYED BASIC STRATEGY ASSISTANCE

Change how the existing basic strategy indicator operates.

When basic strategy assistance is enabled, do not immediately reveal the recommended action.

Instead, provide the player with an opportunity to think independently.

### Confirmed delay

Wait exactly three seconds before highlighting the recommended action.

Begin the timer only after:

- Relevant card dealing animations have completed.
- The active hand is established.
- The player can legally make a decision.
- The floating action controls are available for interaction.

Do not begin the timer while cards are still being dealt.

### Recommendation appearance

After the delay, highlight the recommended floating action button using:

- A subtle green outline.
- A restrained pulsing glow.
- Smooth visual transitions.

The recommendation should be noticeable without being distracting.

Do not introduce a large intrusive message covering the table.

Preserve access to the existing educational explanation functionality.

### Timer lifecycle

Cancel the recommendation timer when:

- The player selects an action.
- The active hand changes.
- The current decision becomes invalid.
- The round ends.
- The player disables basic strategy assistance.
- The relevant gameplay component is destroyed.

If the player acts before three seconds have elapsed, do not reveal the previous recommendation afterward.

Each new eligible decision must receive its own recommendation timer.

For example, if a player hits and remains eligible to make another decision, start a new three-second timer after the newly dealt card finishes its animation.

### Affordable recommendations

Continue distinguishing between:

- Ideal basic strategy.
- Best currently affordable legal action.

Never highlight a disabled button as though the player should be able to select it.

If the ideal action is unavailable, highlight the appropriate legal alternative and preserve the educational explanation of why the ideal action was unavailable.

### Analytics integration

Update educational tracking to distinguish:

- A decision made before the recommendation appeared.
- A decision made after the recommendation appeared.
- A decision made after consulting the strategy chart.
- A decision made while assistance was completely disabled.

Merely having strategy assistance enabled must not automatically classify a decision as assisted if no recommendation or relevant guidance was actually displayed.

---

## 8. FIX CARD COUNTING WEIGHT VISIBILITY

There is an existing visual defect in which the leftmost card's counting weight becomes obscured by overlapping cards.

Investigate the underlying card layout and annotation rendering.

Fix the problem for every card, not just the currently observed example.

### Requirements

When card counting weights are enabled:

- Every exposed card must display its individual Hi-Lo weight.
- The first card must remain visible.
- The last card must remain visible.
- Middle cards must remain visible.
- Split-hand cards must remain visible.
- Dealer card weights must remain visible.
- Cards with a zero weight must still display their indicator.

Preserve the established Hi-Lo values.

### Card arrangement

Fan cards horizontally.

Dynamically adjust card spacing based on:

- Number of cards.
- Available hand width.
- Number of neighboring hands.
- Available table space.
- Screen dimensions.
- Whether card annotations are enabled.

Card overlap is acceptable only when important information remains visible.

Do not allow overlapping cards to hide:

- Rank.
- Suit.
- Counting weight.
- Relevant educational annotations.

### Rendering architecture

Consider rendering counting annotations in a dedicated layer above card sprites.

Counting annotations may be positioned at exposed card edges or above the corresponding cards when necessary.

The exact implementation may vary, but every indicator must remain clearly associated with its card.

Do not solve this problem by merely increasing the depth of one card.

Verify the entire display order and layout system.

### Hidden cards

Never reveal a hidden card's Hi-Lo weight.

The dealer's hole card must not display its weight until the card is legitimately revealed.

---

## 9. ON-TABLE RUNNING COUNT INDICATOR

Redesign the running count interface as a compact floating element integrated into the table.

Position it near the shoe and discard tray.

The indicator should feel like a natural educational instrument associated with the shoe.

Display:

- Running Count label.
- Running count value when visible.
- Eye icon for visibility control.
- Count Check interaction.

### Visible state

When revealed, display the current running count clearly.

Use appropriate signed formatting for positive and negative values.

### Hidden state

When concealed, visually obscure the running count using a blur or masked-value treatment.

Keep the eye icon visible.

Clicking or tapping the eye toggles between visible and hidden states.

The player should not need to navigate into settings every time they want to check or conceal the running count.

### Privacy of the answer

A purely cosmetic blur must not accidentally expose the answer through:

- Accessibility labels.
- Tooltips.
- Copyable hidden text.
- Other automatically displayed count information.

When the count is concealed, render a masked presentation that visually resembles a blurred value without unnecessarily exposing the actual answer in the interface.

This is an educational concealment feature, not a security boundary.

### State behavior

Hiding or revealing the count must not:

- Reset the running count.
- Change shoe state.
- Affect card dealing.
- Change the actual Hi-Lo calculation.
- Affect blackjack outcomes.

Preserve visibility preferences appropriately.

The existing true count and remaining shoe visibility controls must remain independently configurable.

---

## 10. INTEGRATED COUNT CHECK POPOVER

Preserve the existing educational ability to submit an estimated running count.

However, integrate this interaction into the new on-table running count indicator.

Use a compact anchored popover.

### Interaction

The player should be able to:

1. Conceal the running count.
2. Open the Count Check popover.
3. Enter their estimated count.
4. Submit their answer.
5. Receive immediate educational feedback.

Support:

- Positive integers.
- Negative integers.
- Zero.
- Keyboard submission.
- Mobile numeric entry where practical.

### Feedback

Display:

- Submitted count.
- Actual count.
- Correct or incorrect result.
- Difference from the actual count.
- A concise explanation where appropriate.

Use supportive, educational language.

Do not introduce unnecessary full-screen interruptions.

### Data integrity

Preserve existing count accuracy tracking.

Record whether the actual count was visible before submission.

Distinguish independent count attempts from assisted attempts.

Do not classify a revealed-answer submission as independent mastery.

Preserve existing count checkpoints and true count exercises.

### Round lifecycle

Count verification must not interfere with active player decisions.

Preserve the established between-round count-check behavior unless an existing educational exercise explicitly supports another safe interaction point.

---

## 11. FIX INCONSISTENT CHIP PLACEMENT

There is an existing input reliability issue when placing chips across multiple betting positions.

After interacting with several positions, clicks sometimes stop registering.

This must be investigated and fixed at the underlying architectural level.

Do not simply add a debounce, arbitrary timeout, or workaround without identifying the cause.

### Investigate

Review:

- Phaser interactive hit areas.
- Pointer event propagation.
- Pointer capture.
- Input manager configuration.
- Overlapping interactive objects.
- Chip sprite interactivity.
- Betting spot depth ordering.
- Drag-and-drop handlers.
- Tap handlers.
- React overlays.
- Stale state closures.
- Zustand subscriptions.
- Scene lifecycle.
- Event listener registration.
- Animation-related input locks.
- Selected denomination state.
- Wallet reservation logic.
- Betting position identifiers.

Determine whether visual chip stacks are intercepting interactions intended for betting spots.

If decorative sprites do not need to receive pointer input, prevent them from unnecessarily intercepting it.

### Required behavior

A selected chip must remain selected while the player moves between betting positions.

The player should be able to quickly:

- Add chips to Position 1.
- Add chips to Position 2.
- Add chips to Position 3.
- Return to Position 1.
- Add additional chips.
- Change denominations.
- Place side wagers.
- Continue placing chips without inconsistent input behavior.

Every valid click or tap must result in exactly one wager modification.

Invalid interactions must result in no wager modification.

### Input methods

Preserve both:

- Click or tap placement.
- Drag-and-drop placement.

Ensure a drag gesture cannot also produce an unintended tap wager.

### Testing

Create regression tests covering rapid alternating interactions across multiple betting positions and multiple side betting spots.

Include interactions with existing chip stacks and after changing denominations.

Do not consider the issue resolved until the original failure scenario can no longer be reproduced.

---

## 12. NEW CHIP DENOMINATIONS

Expand the supported virtual chip denominations.

Use the following confirmed denominations and colors:

| Denomination | Color |
|---:|---|
| 1 | White |
| 5 | Red |
| 25 | Green |
| 100 | Black |
| 500 | Purple |
| 1,000 | Orange |
| 5,000 | Pink |

The new chips must follow the same dimensional visual design as existing chips.

Every chip must remain recognizable through both its color and numerical denomination.

Avoid visually ambiguous colors.

Create appropriate textures for the new denominations using the existing asset-generation architecture.

Update all affected systems, including:

- Chip selection.
- Chip placement.
- Chip normalization.
- Wager validation.
- Settlement rendering.
- Rebet.
- Double Bet.
- Wallet balance handling.
- Responsive chip tray layout.

Preserve exact half-chip accounting internally.

---

## 13. UPDATED TABLE BETTING LIMITS

Increase the maximum initial main wager per original betting position.

### Confirmed main wager limits

- Minimum: 10 chips.
- Maximum: 50,000 chips.

Apply these limits independently to each original betting position.

Legal doubles and splits may result in exposure exceeding the original 50,000-chip initial wager limit.

Continue requiring sufficient available bankroll for all additional wagers.

Do not introduce negative balances.

The existing side bet limits remain unchanged:

- Minimum: 1 chip.
- Maximum: 100 chips per side bet.

Update relevant interface labels, validation messages, documentation, tests, and rules references.

Do not leave outdated 1,000-chip maximum validation elsewhere in the application.

---

## 14. AUTOMATIC CHIP STACK CONSOLIDATION

Replace the existing requirement to preserve the exact visual sequence of chips placed.

Chip stacks must automatically normalize into the fewest supported denominations after every wager modification.

The visual stack represents the current total wager rather than the historical sequence of individual chip placements.

### Examples

Four 25-chip denominations:

- Original placement: 25 + 25 + 25 + 25.
- Visual representation: One 100 chip.

Five 100-chip denominations:

- Original placement: 100 + 100 + 100 + 100 + 100.
- Visual representation: One 500 chip.

Two 500-chip denominations:

- Visual representation: One 1,000 chip.

Five 1,000-chip denominations:

- Visual representation: One 5,000 chip.

A 6,375-chip wager should be represented using:

- One 5,000 chip.
- One 1,000 chip.
- Three 100 chips.
- Three 25 chips.

### Normalization rules

Implement a centralized denomination normalization utility.

The utility must:

- Accept an exact wager amount.
- Return an appropriate normalized denomination breakdown.
- Preserve the exact total.
- Minimize the number of represented chips.
- Handle large wager amounts.
- Handle settlement amounts containing half-chip remainders.

Use the same normalization utility wherever appropriate throughout the application.

Do not create separate inconsistent normalization implementations for betting and settlement.

### Accounting independence

Visual normalization must never:

- Modify the actual wager amount.
- Create additional wallet transactions.
- Deduct additional chips.
- Return funds.
- Change settlement.
- Alter historical betting records.

Chip consolidation is a presentation transformation.

The logical wager amount remains authoritative.

### Undo behavior

Preserve the actual sequence of betting modifications for undo purposes.

Example:

The player places four 25 chips.

The visual stack becomes one 100 chip.

Pressing Undo must reverse the most recent 25-chip placement, leaving a wager of 75 chips.

The visual stack should then normalize to three 25 chips.

Do not undo the entire displayed 100 chip unless that was the actual previous betting modification.

### Visual animation

When chips consolidate, use a brief, smooth visual transition where appropriate.

Do not require the player to wait for the consolidation animation before placing another chip.

Avoid excessive animations during rapid betting.

---

## 15. CHIP STACK TOTAL LABELS

Change the existing wager amount presentation.

The total amount of a chip stack must appear on top of the stack.

Remove redundant wager total labels displayed underneath chip stacks.

The top visible value should represent the entire stack's wager amount.

### Example

A stack containing:

- One 500 chip.
- Two 100 chips.
- One 25 chip.

The stack's displayed total must be 725.

It must not misleadingly display only 25 as the total wager.

### Presentation

Use a clearly readable central label or compact overlay integrated into the top chip.

Maintain the physical appearance of the underlying chip stack.

Individual denomination artwork may remain visible where appropriate.

However, the total wager must be immediately identifiable.

### Large values

Use readable number formatting.

Examples:

- 100
- 1,250
- 12,500
- 50,000

Do not abbreviate important wager totals in a way that removes precision.

### Half-chip balances

Accurately display fractional settlement values where applicable.

Example:

62.5

### Responsiveness

The total must remain readable when:

- The stack contains many chips.
- The stack is visually compressed.
- The viewport is narrow.
- Multiple hands are present.
- Side wagers are enabled.

---

## 16. REMOVE CHIPS FROM INDIVIDUAL BETTING SPOTS

Implement contextual chip removal.

### Desktop

Right-click an occupied betting spot to remove a chip.

Prevent the browser's default context menu from interfering with this specific interaction.

Do not unnecessarily disable the context menu throughout the entire application.

### Mobile

Long-press an occupied betting spot to remove a chip.

Provide appropriate visual feedback when the long-press is recognized.

Prevent a long-press from also triggering ordinary chip placement.

### Removal semantics

Recommended implementation:

Reverse the most recent chip placement associated with that particular betting spot.

This preserves predictable behavior even after visual normalization.

For example:

- The player places four 25 chips.
- The displayed stack consolidates into one 100 chip.
- Right-clicking the spot removes the most recently placed 25.
- The remaining stack becomes three 25 chips.

Maintain the global Undo control independently.

Never permit wager amounts to become negative.

Chip removal must only be available during the betting phase.

Include a discoverable explanation of the interaction so first-time players can learn how to remove chips.

---

## 17. ON-TABLE CHIP DENOMINATION TRAY

Move or redesign the chip denomination tray so it appears along the bottom edge inside the table.

The tray must remain visually integrated into the table.

Do not position it underneath the table canvas.

Display all seven denominations.

### Selected chip

Make the currently selected denomination immediately recognizable.

Use:

- A subtle elevated position.
- A clear outline.
- Appropriate lighting or shadow.
- A restrained selection animation.

Avoid relying on color alone.

### Available bankroll

Determine chip affordability using the actual available balance after accounting for existing pending reservations.

For example:

- Wallet balance: 1,000.
- Pending wagers: 750.
- Remaining available bankroll: 250.

The 500, 1,000, and 5,000 chips must be disabled.

### Unaffordable denominations

Blur and dim unaffordable chips.

They must remain visible but non-interactive.

Update their appearance immediately when available bankroll changes.

Do not remove denominations from the tray simply because they are temporarily unaffordable.

When a previously unavailable denomination becomes affordable, restore its normal appearance.

Ensure disabled states remain accessible and understandable.

### Destination limits

A chip may be affordable globally but invalid for a specific betting spot because it would exceed that spot's wager maximum.

Reject the placement clearly without deducting funds.

Do not incorrectly disable a denomination globally merely because one betting spot cannot accept it.

---

## 18. CONTEXTUAL BETTING CONTROLS

Integrate betting controls into the table's lower interaction area.

Required controls:

- Undo.
- Clear.
- Rebet.
- Rebet & Deal.
- Double Bet.
- Deal.

Use compact, polished controls with clear hierarchy.

Do not make every control equally prominent.

The most relevant action should receive the greatest emphasis based on the current betting state.

### Before the first round

Prioritize:

- Selecting chips.
- Placing wagers.
- Deal.

Rebet-related controls may be disabled when no previous betting configuration exists.

### During ordinary betting

Make it easy to:

- Modify wagers.
- Clear wagers.
- Undo changes.
- Begin the round.

### During active gameplay

Betting modification controls must become unavailable.

Do not allow accidental wager modifications during player or dealer actions.

Avoid unnecessary interface clutter during active rounds.

---

## 19. IMPROVED POST-ROUND EXPERIENCE

The transition between completed rounds and new rounds should be extremely convenient.

After settlement, make the relevant next-round actions immediately available on the table.

The player should not need to search for controls, open another panel, or scroll.

### Rebet

Restore the previous round's original initial wagers.

Include:

- Original main wagers.
- Original Perfect Pairs wagers.
- Original 21+3 wagers.

Do not restore:

- Insurance wagers.
- Additional split wagers.
- Additional double wagers.

Allow the player to review and modify the restored wagers before dealing.

### Rebet & Deal

Restore the previous round's initial wagers and immediately begin the next round.

This is a single explicit player action.

Validate the entire betting configuration before committing it.

If the configuration cannot be restored due to insufficient bankroll or applicable settings changes:

- Do not partially restore wagers.
- Do not begin a round.
- Clearly explain the problem.

Never automatically begin another round without an explicit player action.

### Double Bet

After a completed round, Double Bet should restore twice the previous round's initial wager configuration.

The player must be able to review the doubled wagers before dealing.

During an ordinary betting phase with existing pending wagers, Double Bet should double the pending configuration instead.

Make the contextual behavior clear.

Respect:

- Available bankroll.
- Main wager maximums.
- Side bet maximums.
- Enabled side bet settings.

Reject an invalid operation atomically rather than silently producing a partial configuration.

### Visual transitions

Make the transition from settlement to the betting phase feel natural.

Retain settlement information long enough to understand the result.

However, do not unnecessarily prevent the player from preparing another round once logical settlement has completed.

Do not automatically repeat wagers or deal cards.

---

## 20. COMPLETE VISUAL SPLIT-HAND PRESENTATION

This is a major gameplay presentation requirement.

The current experience must not simply cycle between split hands while hiding other hands.

Every resulting player hand must remain visually present on the table.

Support all established maximums:

- Three original betting positions.
- Four resulting hands per original position.
- Twelve total resulting player hands.

### Grouping

Maintain a clear visual relationship between split hands and their original betting position.

For example:

Position 1:

- Hand A.
- Hand B.
- Hand C.
- Hand D.

Position 2:

- Hand A.
- Hand B.

The player should immediately understand which hands belong together.

### Dynamic arrangements

Dynamically switch between horizontal and grid-based layouts depending on:

- Available width.
- Available height.
- Number of occupied betting positions.
- Number of resulting hands.
- Device orientation.
- Number of cards per hand.

For ordinary split scenarios, prefer a natural horizontal arrangement.

For more complex scenarios, use compact grid arrangements.

Do not force all twelve hands into a single unreadable horizontal row.

### Visibility

Every resulting hand must remain visible, including:

- Active hands.
- Hands awaiting their turn.
- Completed hands.
- Busted hands.
- Hands that have reached 21.
- Doubled hands.
- Restricted split-ace hands.

Do not remove a hand merely because the player has completed its decision.

### Split dealing policy

Preserve the established logical split-hand dealing sequence.

Visual presentation must reflect the actual engine state.

If a later split hand is awaiting its replacement card, display its existing card and a clear waiting state.

Do not draw or expose additional cards early merely to fill the visual layout.

### Wagers

Each resulting hand must have an independently identifiable wager stack.

Doubled wagers must update the associated hand's displayed amount.

Original side bets must remain associated with their original betting position and must not be duplicated across split hands.

---

## 21. ACTIVE HAND IDENTIFICATION

The currently active hand must be unmistakable.

Use an appropriate combination of:

- Subtle outline.
- Focused lighting.
- Active status indicator.
- Floating action controls.

Only the active hand displays interactive gameplay action buttons.

Do not make inactive hands disappear.

The active-hand indicator must follow the actual engine state.

When the player completes a hand, transition the visual focus to the next eligible hand.

Avoid excessive camera movement or table rearrangement solely because the active hand changed.

---

## 22. COMPLETED HAND STATUS INDICATORS

Keep completed hands fully visible.

Do not excessively dim or shrink them.

Display a small, readable status indicator where appropriate.

Examples:

- Standing.
- Busted.
- 21.
- Blackjack.
- Doubled.
- Waiting.
- Win.
- Loss.
- Push.

Distinguish intermediate hand states from final settlement outcomes.

For example, standing on 20 is not equivalent to winning.

Do not display a final win or loss before the result is logically established.

Use appropriate color and text together.

---

## 23. SETTLEMENT PRESENTATION

Improve the visual presentation of round results.

Each resolved hand must display its corresponding result.

Combine:

- Clear hand result indicators.
- Accurate net profit or loss information where appropriate.
- Animated chip settlement.

### Winning hands

Animate the appropriate winnings toward the associated wager area or wallet presentation.

Ensure visual payout amounts match authoritative settlement data.

### Losing hands

Animate committed wagers being collected.

Do not display misleading positive feedback for losing outcomes.

### Pushes

Clearly communicate that the original stake has been returned.

### Natural blackjack

Visually distinguish a natural blackjack from an ordinary 21.

Preserve the established payout rules.

### Side bets

Maintain independently identifiable side bet outcomes.

Do not confuse side bet winnings with main-hand winnings.

### Split hands

Settle each resulting hand independently.

The player must be able to identify which hands won, lost, or pushed.

### Animation independence

Animations must never control:

- Wallet deductions.
- Payout calculations.
- Logical settlement.
- Round completion.
- Educational statistics.

Do not duplicate payouts when animations are interrupted, replayed, or skipped.

---

## 24. USER EXPERIENCE AND INTERACTION POLISH

Actively identify and improve unnecessary friction throughout the gameplay experience.

Prioritize intuitive interaction over unnecessary decorative complexity.

### Discoverability

A first-time player should be able to understand:

- How to select chips.
- Where to place chips.
- How to remove chips.
- How to deal.
- Which hand is active.
- How to make a decision.
- How to check the running count.
- How to begin another round.

Use concise contextual hints where helpful.

Avoid forcing experienced players through repeated tutorials.

### Visual feedback

Provide immediate feedback for:

- Chip selection.
- Successful wager placement.
- Invalid wager placement.
- Chip removal.
- Disabled actions.
- Active-hand changes.
- Card dealing.
- Settlement.
- Count visibility changes.

### Speed

Gameplay should feel responsive.

Do not introduce arbitrary delays between ordinary player interactions.

Preserve configurable animation preferences.

Educational recommendation timing is an exception and must follow the confirmed three-second delay.

### Accessibility

Maintain:

- Keyboard support.
- Accessible button labels.
- Visible keyboard focus.
- Appropriate contrast.
- Sufficient touch target sizes.
- Reduced-motion support.
- Text alternatives to color-based indicators.

### Educational value

Make learning tools conveniently accessible without requiring players to leave the gameplay interface unnecessarily.

The application should support both ordinary play and intentional educational practice.

Keep all assistance optional.

---

## 25. ENGINE AND PRESENTATION SEPARATION

Preserve the established independent blackjack engine.

Do not move game rules into Phaser rendering logic.

Do not introduce separate competing implementations of:

- Wager validation.
- Legal actions.
- Hand evaluation.
- Splitting.
- Doubling.
- Dealer behavior.
- Running count calculation.
- Settlement.
- Wallet accounting.

The table layout system must consume authoritative gameplay state.

The normalized chip representation must consume authoritative wager amounts.

Floating buttons must consume authoritative legal actions.

The running count indicator must consume authoritative exposed-card counting state.

Use presentation-specific state only for visual concerns.

Examples:

- Animation progress.
- Sprite positions.
- Hover states.
- Drag state.
- Popover visibility.
- Temporary visual transitions.
- Recommendation highlight timing.

---

## 26. ANIMATION AND INPUT COORDINATION

Improve coordination between animations and player interactions.

Do not use a single global input lock that unnecessarily prevents unrelated valid interactions.

Determine which interactions actually need to be unavailable during a given animation or state transition.

For example:

- A card dealing animation may temporarily prevent another hand decision.
- A chip placement animation should not prevent placing another chip at a different betting position.
- A chip consolidation animation should not prevent placing additional wagers.
- A table resize should not corrupt or indefinitely disable input.

Handle:

- Interrupted animations.
- Rapid pointer interactions.
- Browser resizing.
- Orientation changes.
- Tab visibility changes.
- React remounting.
- Phaser scene recreation.
- Reduced-motion mode.

Ensure the interface always returns to the appropriate interactive state.

---

## 27. REQUIRED AUTOMATED TESTS

Add or update automated tests covering all changed functionality.

### Chip normalization

Verify:

- Four 25 chips normalize to one 100 chip.
- Five 100 chips normalize to one 500 chip.
- Two 500 chips normalize to one 1,000 chip.
- Five 1,000 chips normalize to one 5,000 chip.
- Arbitrary wager totals retain their exact value.
- Large wagers normalize correctly.
- Half-chip settlement amounts remain accurate.
- Normalization does not create wallet transactions.

### Wager modification history

Verify:

- Undo after consolidation.
- Individual betting spot removal.
- Clear wagers.
- Rebet.
- Rebet & Deal.
- Double Bet.
- Failed atomic betting operations.

### Input reliability

Verify:

- Rapidly alternating between all three betting positions.
- Repeated clicks on an occupied betting spot.
- Switching between main and side wagers.
- Changing denominations during betting.
- Drag-and-drop.
- Canceled dragging.
- Right-click removal.
- Mobile long-press removal.
- No duplicate wager placement.
- No permanently locked betting controls.

### Bankroll and limits

Verify:

- Affordability updates after each pending wager.
- Disabled chip interactions cannot place wagers.
- Newly affordable chips become enabled.
- Maximum main wager of 50,000 chips.
- Existing side bet limits.
- Additional legal split and double exposure.

### Strategy assistance

Verify:

- No immediate recommendation.
- Recommendation appears after three seconds.
- Timer begins only when the hand accepts input.
- Acting before the delay cancels the recommendation.
- A new decision creates a new timer.
- Changing hands cancels stale timers.
- Disabling assistance cancels pending highlights.
- Disabled actions are not highlighted.
- Assisted and unassisted decisions are classified correctly.

### Card counting

Verify:

- Every exposed card displays its weight.
- Overlapping cards do not obscure weights.
- Hidden cards never reveal their weights.
- Running count reveal and conceal behavior.
- Count check submission.
- Correct handling of negative and zero answers.
- Independent versus assisted count attempts.
- No changes to the underlying running count caused by visibility changes.

### Split hands

Verify:

- Two resulting hands remain visible.
- Three resulting hands remain visible.
- Four resulting hands remain visible.
- Multiple split positions remain visible.
- Twelve resulting hands remain visible.
- Only the active hand has interactive action controls.
- Completed hands retain their visual status.
- Every resulting hand has an identifiable wager.
- Resizing does not lose or duplicate hands.

---

## 28. RESPONSIVE AND VISUAL VALIDATION

Use Playwright or the existing browser testing infrastructure to inspect representative gameplay states.

Suggested test viewports:

- 1920 × 1080 desktop.
- 1440 × 900 desktop.
- 1366 × 768 laptop.
- 768 × 1024 tablet portrait.
- 390 × 844 mobile portrait.
- 360 × 800 compact mobile portrait.
- 844 × 390 mobile landscape.

Test representative states including:

- Empty betting table.
- One occupied betting position.
- Three occupied betting positions.
- Large wagers.
- Unaffordable denominations.
- Count indicator concealed.
- Count indicator revealed.
- Count check popover.
- Strategy recommendation visible.
- Multiple split hands.
- Twelve resulting hands.
- Dealer play.
- Settlement.
- Post-round betting controls.

Inspect screenshots for:

- Controls underneath the table.
- Overlapping cards.
- Hidden counting indicators.
- Clipped text.
- Inaccessible action buttons.
- Misplaced overlays.
- Incorrect chip stack totals.
- Excessive empty space.
- Unreadable mobile layouts.
- Unnecessary scrolling.

Do not consider the redesign complete based solely on successful compilation.

Visually inspect the actual application.

Fix discovered visual defects.

---

## 29. IMPLEMENTATION ORDER

Use the following implementation sequence unless the existing architecture requires a documented adjustment.

### Phase 1 — Audit and reproduce defects

- Inspect current architecture.
- Reproduce inconsistent chip placement.
- Identify card annotation overlap.
- Review existing hand layout.
- Identify below-table controls.
- Establish regression tests.

### Phase 2 — Betting and chip architecture

- Fix chip input reliability.
- Add new denominations.
- Update maximum main wagers.
- Implement normalized chip stacks.
- Implement wager modification history.
- Implement contextual chip removal.
- Update affordability behavior.
- Update stack total rendering.

### Phase 3 — Table layout

- Implement centralized responsive positioning.
- Integrate the chip tray.
- Integrate betting controls.
- Remove below-table gameplay controls.
- Implement dedicated mobile layouts.

### Phase 4 — Hand presentation

- Implement simultaneous split-hand visibility.
- Implement dynamic horizontal and grid arrangements.
- Implement active-hand focus.
- Implement contextual floating action buttons.
- Implement completed-hand status indicators.

### Phase 5 — Educational interfaces

- Fix card weight visibility.
- Implement the running count indicator.
- Implement eye-based visibility controls.
- Integrate the count check popover.
- Implement delayed strategy assistance.
- Update educational analytics.

### Phase 6 — Round transitions and settlement

- Improve settlement presentation.
- Implement Rebet & Deal.
- Refine Rebet.
- Refine contextual Double Bet.
- Improve transitions between rounds.

### Phase 7 — Validation and polish

- Run unit tests.
- Run integration tests.
- Run browser tests.
- Inspect responsive layouts.
- Fix remaining issues.
- Review interaction performance.
- Update documentation.

Keep the application runnable throughout development.

---

## 30. ACCEPTANCE CRITERIA

The overhaul is complete only when all of the following are true:

- No gameplay controls appear underneath the table.
- The entire ordinary gameplay flow is accessible within the table.
- Floating action buttons appear directly above the active hand.
- Only the active hand displays interactive player action controls.
- Disabled actions remain visible and distinguishable.
- Basic strategy recommendations appear after the confirmed three-second delay.
- Every exposed card's counting weight remains visible.
- The running count has an integrated eye-controlled visibility indicator.
- Players can submit their estimated running count through an anchored popover.
- Chip placement remains reliable across multiple positions.
- Chips automatically normalize into appropriate denominations.
- Undo correctly reverses original betting modifications.
- The 1,000 orange chip exists.
- The 5,000 pink chip exists.
- The maximum initial main wager is 50,000 chips per position.
- Unaffordable denominations are visibly blurred and disabled.
- Chip stack totals appear on top of their stacks.
- Right-click and long-press removal work correctly.
- Rebet is immediately accessible following settlement.
- Rebet & Deal works reliably.
- Double Bet restores the appropriate doubled configuration for review.
- All split hands remain simultaneously visible.
- Completed hands remain visible.
- Maximum-hand scenarios remain usable.
- Desktop gameplay feels polished.
- Mobile portrait gameplay is fully functional.
- Mobile landscape gameplay is fully functional.
- Existing game mathematics remain correct.
- Existing wallet accounting remains correct.
- Existing educational statistics remain accurate.
- Existing persistence behavior remains functional.
- No working unrelated functionality has been unnecessarily removed.
- Automated tests pass.
- The application builds successfully.

---

## 31. FINAL DIRECTIVE

Do not merely move existing buttons around.

Rethink the gameplay presentation as a cohesive interactive experience.

Make the table feel alive, responsive, authentic, and intuitive.

Make every ordinary action accessible where the player naturally expects it.

Make the chip placement experience reliable and satisfying.

Make split hands visually understandable.

Make educational assistance unobtrusive and genuinely useful.

Make the transition between rounds effortless without automating player decisions.

Preserve mathematical correctness and authoritative state integrity.

Do not sacrifice mobile usability for desktop presentation.

Do not introduce superficial fixes that conceal underlying architectural defects.

Inspect the running application, interact with it, identify friction, and improve it.

You have permission to independently refine ordinary design details such as spacing, typography, animation timing, positioning, visual hierarchy, component organization, and responsive breakpoints, provided those decisions remain consistent with this specification.

Document significant assumptions and architectural changes.

Update the existing master specification and development progress documentation to reflect the confirmed changes.

The finished product should be:

- Awesome to look at.
- Easy to understand.
- Quick to pick up.
- Intuitive to interact with.
- Responsive across devices.
- Mathematically reliable.
- Educationally valuable.
- Professionally polished.

Begin by inspecting the existing implementation.

Then proceed with the actual implementation.

Do not stop after presenting an implementation plan.