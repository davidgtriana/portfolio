export class DiceRoller {
    private initial_seed: number;
    private seed: number;

    constructor(seed?: number) {
        this.initial_seed = seed ?? (Math.random()*2**32)>>>0;
        this.seed = this.initial_seed;
    }

    public roll(min: number, max?: number): number{
        if (max == undefined) return Math.floor(this.random() * min);
        return Math.floor(min + this.random() * (max - min + 1));
    }

    public getSeed(): number {
        return this.initial_seed;
    }

    // Returns a number between 0 and 1, 1 not included
    private random(): number {
        this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
        let t = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}
    
  