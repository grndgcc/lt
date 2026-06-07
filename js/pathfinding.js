class PathFinder {
  static key(x, y) { return `${x},${y}`; }

  static findPath(state, start, goal) {
    if (!state.isInside(goal.x, goal.y) || state.isBlocked(goal.x, goal.y, { ignoreCharacters: true })) return [];
    const startKey = this.key(start.x, start.y);
    const goalKey = this.key(goal.x, goal.y);
    const open = [{ x: start.x, y: start.y, g: 0, f: this.h(start, goal), parent: null }];
    const seen = new Map([[startKey, open[0]]]);
    const closed = new Set();
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

    while (open.length) {
      open.sort((a, b) => a.f - b.f);
      const node = open.shift();
      const nodeKey = this.key(node.x, node.y);
      if (nodeKey === goalKey) return this.reconstruct(node);
      closed.add(nodeKey);

      for (const [dx, dy] of dirs) {
        const nx = node.x + dx, ny = node.y + dy;
        const k = this.key(nx, ny);
        if (!state.isInside(nx, ny) || closed.has(k)) continue;
        if (state.isBlocked(nx, ny, { ignoreCharacters: true })) continue;
        const g = node.g + 1;
        const old = seen.get(k);
        if (!old || g < old.g) {
          const next = { x: nx, y: ny, g, f: g + this.h({x:nx,y:ny}, goal), parent: node };
          seen.set(k, next);
          if (!old) open.push(next);
          else Object.assign(old, next);
        }
      }
    }
    return [];
  }

  static h(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }

  static reconstruct(node) {
    const path = [];
    let cur = node;
    while (cur) {
      path.push({ x: cur.x, y: cur.y });
      cur = cur.parent;
    }
    path.reverse();
    path.shift();
    return path;
  }

  static nearestUseTile(state, source, object) {
    const candidates = [];
    const pos = object.position;
    for (let x = pos.x - 1; x <= pos.x + object.size.w; x++) {
      for (let y = pos.y - 1; y <= pos.y + object.size.h; y++) {
        const touches = x >= pos.x - 1 && x <= pos.x + object.size.w && y >= pos.y - 1 && y <= pos.y + object.size.h;
        const insideObj = x >= pos.x && x < pos.x + object.size.w && y >= pos.y && y < pos.y + object.size.h;
        if (!touches || insideObj) continue;
        if (!state.isInside(x, y) || state.isBlocked(x, y, { ignoreCharacters: true })) continue;
        const path = this.findPath(state, source, { x, y });
        if (path.length || (source.x === x && source.y === y)) {
          candidates.push({ x, y, dist: path.length, path });
        }
      }
    }
    candidates.sort((a, b) => a.dist - b.dist);
    return candidates[0] || null;
  }
}
window.PathFinder = PathFinder;
