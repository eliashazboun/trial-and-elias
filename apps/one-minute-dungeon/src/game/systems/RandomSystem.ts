export class Random {
  constructor(private state: number) {
    this.state = state >>> 0;
  }
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let n = this.state;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  }
  int(max: number): number {
    return Math.floor(this.next() * max);
  }
}
export function newSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]!;
}
