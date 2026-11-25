# Advertising status

Production advertising is disabled. The wallet shows an honest unavailable state and the hourly claim countdown. No ad SDK, live impression, provider account, credentials or tracking request has been introduced. All education remains available without viewing an ad.

The adapter distinguishes rewarded, closed, unavailable and error outcomes. Only a legitimate rewarded result reaches a grant callback. The authoritative engine credits exactly 1,000 half-chip units (500 chips), persists request/event receipts and rejects duplicate credits. Database CAS/ownership checks apply to grants just like wagers. Unit tests use an isolated mock; it is not imported into the application entry or production UI.

Research performed 2026-11-24:

- Google Ad Manager supports web rewarded formats through GPT: https://support.google.com/admanager/answer/9116812
- The primary implementation sample distinguishes rewardedSlotGranted from closed/video-completed events and requires voluntary user choice and consent: https://developers.google.com/publisher-tag/samples/display-rewarded-ad
- Reward policies restrict reward nature and misleading choice design: https://support.google.com/admanager/answer/7496282
- Google's social-casino advertising rules are a distinct policy domain, not proof that this publisher/account is approved to monetize this particular game: https://support.google.com/adspolicy/answer/15132179

Google Ad Manager is only a researched candidate. No provider has been selected or approved. Publisher account eligibility, simulated-casino inventory eligibility, supported geographies, adult-audience handling, anonymous/nontransferable rewards, consent-platform requirements, repeat-request/frequency caps and actual SDK/account configuration require provider-specific approval before activation. Do not introduce authentication to satisfy an incompatible provider. Do not confuse advertiser certification with permission to monetize a publisher page.

No production integration should occur until the owner approves a compatible provider and its verified requirements. An ad click, impression, closed event or elapsed timer must never award chips. Client-local balances and receipts are not fraud-proof; no backend verification is promised. Disabled/unavailable ads do not block ordinary play or hourly claims.
