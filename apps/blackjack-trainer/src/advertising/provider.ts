export type RewardResult =
  | { status: "rewarded"; rewardEventId: string }
  | { status: "closed" | "unavailable" }
  | { status: "error"; message: string };
export interface AdProvider {
  initialize(): Promise<void>;
  isAvailable(): Promise<boolean>;
  showRewardedAd(requestId: string): Promise<RewardResult>;
  dispose(): void;
}
export class DisabledAdProvider implements AdProvider {
  async initialize() {}
  async isAvailable() {
    return false;
  }
  async showRewardedAd(): Promise<RewardResult> {
    return { status: "unavailable" };
  }
  dispose() {}
}
export class RewardLifecycle {
  private active = false;
  constructor(
    private provider: AdProvider,
    private grant: (eventId: string, requestId: string) => Promise<boolean>,
    private timeoutMs = 15000,
  ) {}
  async request(
    requestId: string,
    consent: boolean,
    betweenRounds: boolean,
  ): Promise<RewardResult> {
    if (this.active || !consent || !betweenRounds)
      return { status: "unavailable" };
    this.active = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        (async (): Promise<RewardResult> => {
          await this.provider.initialize();
          if (!(await this.provider.isAvailable()))
            return { status: "unavailable" };
          return this.provider.showRewardedAd(requestId);
        })(),
        new Promise<RewardResult>((resolve) => {
          timeout = setTimeout(
            () =>
              resolve({
                status: "error",
                message: "Advertisement request timed out.",
              }),
            this.timeoutMs,
          );
        }),
      ]);
      if (result.status === "rewarded")
        await this.grant(result.rewardEventId, requestId);
      return result;
    } catch {
      return { status: "error", message: "Advertisements are unavailable." };
    } finally {
      if (timeout) clearTimeout(timeout);
      this.provider.dispose();
      this.active = false;
    }
  }
}
export const productionAds = new DisabledAdProvider();
