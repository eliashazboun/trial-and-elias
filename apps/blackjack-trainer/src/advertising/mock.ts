import type { AdProvider, RewardResult } from "./provider";
// Only unit tests import this module; production entry points never reference it.
export class MockAdProvider implements AdProvider {
  constructor(private result: RewardResult) {}
  async initialize() {}
  async isAvailable() {
    return this.result.status !== "unavailable";
  }
  async showRewardedAd() {
    return this.result;
  }
  dispose() {}
}
