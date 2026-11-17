// 使用 crypto 亂數，避免 Math.random 的偏差
const buf = new Uint32Array(1);

export function rand01() {
  crypto.getRandomValues(buf);
  return buf[0] / 4294967296;
}

// 拒絕取樣，確保 0..n-1 每個值機率相同
export function randInt(n) {
  const limit = Math.floor(4294967296 / n) * n;
  let x;
  do {
    crypto.getRandomValues(buf);
    x = buf[0];
  } while (x >= limit);
  return x % n;
}

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function pick(arr) {
  return arr[randInt(arr.length)];
}
