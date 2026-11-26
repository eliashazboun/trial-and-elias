# Blackjack Trainer — Running Count Guessing & Anti-Cheating System

Make the following targeted improvements to the existing running-count interface.

Preserve the current table layout, count indicator, eye toggle, animations, betting mechanics, and game functionality.

## 1. Running Count Guessing

When the running count is hidden, display a small guessing section directly beneath the running-count indicator.

Players can only submit a guess after the running count has remained continuously hidden for at least 10 completed game rounds.

Requirements:

- Track how many completed rounds the count has remained hidden.
- Reset this counter whenever the running count is revealed.
- Only display the numeric guess input once the player has reached 10 eligible rounds.
- Until then, show a subtle progress message, such as "Guess unlocks in 4 rounds."
- Accept positive integers, negative integers, and zero.
- Provide a compact "Submit Guess" button.
- Prevent empty or invalid submissions.
- Compare the submitted guess against the actual running count at submission time.
- Show clear feedback indicating whether the player was correct.
- If incorrect, optionally display the correct count after submission.
- Do not automatically reveal the running-count indicator after a guess.
- Keep the guessing interface visually consistent with the existing compact table controls.

Use completed blackjack rounds as the counting unit, not individual player actions or split hands. A completed round should count exactly once.

## 2. Guessing Eligibility

Guessing is only permitted when both conditions are satisfied:

1. The running count is currently hidden.
2. The running count has remained hidden for at least 10 completed rounds.

If either condition is false, guessing must be unavailable.

Enforce these conditions in the application logic, not just by hiding the input.

## 3. Revealing the Count While Guessing Is Available

If the player has unlocked the guessing input and clicks the eye icon to reveal the actual running count:

- Immediately hide the guessing input.
- Display the following message in the same location:

"You can only guess the count when count is hidden"

- Keep the actual running count visible.
- Invalidate any unfinished guess.
- Reset the consecutive hidden-round counter.

When the player clicks the eye icon again to hide the count:

- Replace the previous message with:

"Cheaters never prosper"

- Deduct 100 chips from the player's bankroll.
- Apply the deduction exactly once for that reveal-and-hide sequence.
- Display the penalty briefly, preferably with a small red "-100 chips" indicator.
- Reset guessing eligibility so the player must complete another 10 rounds with the count hidden.

The penalty is specifically for revealing the count after the guessing input has become available, then hiding it again.

Do not penalize ordinary count visibility toggles before the player becomes eligible to guess.

Do not charge the penalty repeatedly because of rerenders, animation updates, or other unrelated state changes.

If the bankroll contains fewer than 100 chips, deduct only the available amount and never allow a negative bankroll.

## 4. UI Behavior

Keep everything compact and positioned immediately beneath the existing running-count indicator.

Expected states:

**Count visible:**
- Display the running count normally.
- Hide the guessing input.

**Count hidden, fewer than 10 rounds completed:**
- Keep the count blurred or concealed.
- Display progress toward unlocking the guess input.

**Count hidden, 10 or more rounds completed:**
- Display the numeric input and Submit Guess button.

**Player reveals the count after unlocking the input:**
- Hide the input.
- Display "You can only guess the count when count is hidden".

**Player hides the count again after peeking:**
- Display "Cheaters never prosper".
- Deduct 100 chips.
- Show a brief penalty animation.

Messages should be small, readable, and consistent with the existing UI.

Do not create large modals or move other table elements.

## 5. State Management

Inspect the existing blackjack engine, Zustand store, counting implementation, and bankroll management before making changes.

Reuse existing state management patterns.

Ensure:

- Hidden-round progress is tracked accurately.
- Split hands do not incorrectly count as additional rounds.
- Revealing the count resets the eligibility counter.
- Penalties are processed through the existing bankroll transaction logic.
- The deduction is recorded correctly if transaction history exists.
- Refreshing the browser cannot accidentally duplicate a penalty or bypass the intended eligibility rules.
- Resetting the game handles guessing state correctly.
- The guess uses the current running count, not a stale value.
- The UI never exposes the true count through the input or validation logic before submission.

Do not modify card-counting calculations or basic-strategy recommendations.

## 6. Testing

Test these scenarios:

1. Hide the count and complete 9 rounds — guessing remains locked.
2. Complete the 10th round — input becomes available.
3. Submit a correct guess — appropriate feedback appears.
4. Submit an incorrect guess — appropriate feedback appears.
5. Attempt to guess while the count is visible — rejected.
6. Reveal the count before reaching 10 rounds — no penalty.
7. Reveal the count after guessing becomes available — warning appears.
8. Hide the count again after revealing it — exactly 100 chips deducted.
9. Toggle the indicator repeatedly — no duplicate penalty for the same peek.
10. Complete another 10 hidden rounds — guessing becomes available again.
11. Verify split hands and multiple player positions do not incorrectly advance eligibility.
12. Verify bankroll calculations remain correct after the penalty.
13. Verify refresh and game reset behavior.

## 7. Implementation Instructions

Inspect the existing implementation first.

Make the smallest necessary changes.

Maintain the existing styling, animation quality, and functionality.

Do not introduce unnecessary dependencies or refactor unrelated game systems.

Implement the feature, run applicable checks, and summarize the changes.

The final experience should feel like a natural extension of the existing blackjack trainer rather than a separate feature bolted onto it.