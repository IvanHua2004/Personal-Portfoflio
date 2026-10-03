export class Perlin {
  private readonly perm: Uint8Array = new Uint8Array(512);

  constructor(seed = Math.random()) {
    const table: Uint8Array = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      table[i] = i;
    }

    let state = Math.floor(seed * 0xffffffff) >>> 0 || 0x9e3779b9;
    const random = (): number => {
      state ^= state << 13;
      state >>>= 0;
      state ^= state >>> 17;
      state ^= state << 5;
      state >>>= 0;
      return state / 0x100000000;
    };

    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const tmp = table[i];
      table[i] = table[j];
      table[j] = tmp;
    }

    for (let i = 0; i < 512; i++) {
      this.perm[i] = table[i & 255];
    }
  }

  private static fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private static grad(hash: number, x: number, y: number): number {
    switch (hash & 3) {
      case 0:
        return x + y;
      case 1:
        return -x + y;
      case 2:
        return x - y;
      default:
        return -x - y;
    }
  }

  noise2(x: number, y: number): number {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = Perlin.fade(xf);
    const v = Perlin.fade(yf);

    const aa = this.perm[this.perm[xi] + yi];
    const ab = this.perm[this.perm[xi] + yi + 1];
    const ba = this.perm[this.perm[xi + 1] + yi];
    const bb = this.perm[this.perm[xi + 1] + yi + 1];

    const x1 = Perlin.lerp(Perlin.grad(aa, xf, yf), Perlin.grad(ba, xf - 1, yf), u);
    const x2 = Perlin.lerp(Perlin.grad(ab, xf, yf - 1), Perlin.grad(bb, xf - 1, yf - 1), u);

    return Perlin.lerp(x1, x2, v);
  }
}
