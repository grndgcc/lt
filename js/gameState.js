class GameState {
  constructor() {
    this.version = 1;
    this.mode = "life";
    this.activeTab = "needs";
    this.selectedBuildTool = "floor";
    this.selectedObjectId = null;
    this.rotation = 0;
    this.camera = { x: 0, y: 0, zoom: 1 };
    this.time = { day: 0, minute: 6 * 60, speed: 1, accumulator: 0 };
    this.household = { money: 6200, billsDue: 0, lastBillDay: 0 };
    this.lot = { w: 26, h: 18 };
    this.tiles = [];
    this.objects = [];
    this.characters = [];
    this.activeCharacterId = null;
    this.notifications = [];
    this.randomEventCooldown = 0;
    this.initLot();
  }

  initLot() {
    this.tiles = [];
    for (let y = 0; y < this.lot.h; y++) {
      const row = [];
      for (let x = 0; x < this.lot.w; x++) row.push({ floor: x > 1 && y > 1 && x < 14 && y < 12, wall: false, door: false, dirty: 0 });
      this.tiles.push(row);
    }
    // Starter room outline.
    for (let x = 2; x <= 13; x++) { this.tiles[2][x].wall = true; this.tiles[11][x].wall = true; }
    for (let y = 2; y <= 11; y++) { this.tiles[y][2].wall = true; this.tiles[y][13].wall = true; }
    this.tiles[11][7].door = true; this.tiles[11][7].wall = false;
    for (let y = 3; y <= 10; y++) for (let x = 3; x <= 12; x++) this.tiles[y][x].floor = true;
  }

  static starter(characterData) {
    const state = new GameState();
    const char = Character.create(characterData || {});
    char.position = { x: 7, y: 9 };
    state.characters.push(char);
    state.activeCharacterId = char.id;
    const starterObjects = [
      ["bed_basic", 4, 4], ["fridge_basic", 11, 4], ["toilet_basic", 4, 9], ["shower_basic", 5, 9], ["computer_basic", 8, 4], ["lamp_basic", 10, 8]
    ];
    starterObjects.forEach(([id, x, y]) => state.addObject(id, x, y, true));
    return state;
  }

  activeCharacter() { return this.characters.find(c => c.id === this.activeCharacterId) || this.characters[0]; }

  getTile(x, y) { return this.tiles[y] && this.tiles[y][x]; }
  isInside(x, y) { return x >= 0 && y >= 0 && x < this.lot.w && y < this.lot.h; }

  isBlocked(x, y, opts = {}) {
    if (!this.isInside(x, y)) return true;
    const tile = this.getTile(x, y);
    if (!tile.floor) return true;
    if (tile.wall && !tile.door) return true;
    for (const obj of this.objects) {
      if (x >= obj.position.x && x < obj.position.x + obj.size.w && y >= obj.position.y && y < obj.position.y + obj.size.h) return true;
    }
    if (!opts.ignoreCharacters) {
      for (const c of this.characters) if (c.position.x === x && c.position.y === y) return true;
    }
    return false;
  }

  objectAt(x, y) {
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const o = this.objects[i];
      if (x >= o.position.x && x < o.position.x + o.size.w && y >= o.position.y && y < o.position.y + o.size.h) return o;
    }
    return null;
  }

  canPlaceObject(objectId, x, y) {
    const def = GameData.objects[objectId];
    if (!def) return { ok: false, reason: "Nesne bulunamadı." };
    for (let ty = y; ty < y + def.size.h; ty++) {
      for (let tx = x; tx < x + def.size.w; tx++) {
        if (!this.isInside(tx, ty)) return { ok: false, reason: "Arsanın dışına taşar." };
        const tile = this.getTile(tx, ty);
        if (!tile.floor) return { ok: false, reason: "Önce zemin yerleştir." };
        if (tile.wall && !tile.door) return { ok: false, reason: "Duvara denk geliyor." };
        if (this.objectAt(tx, ty)) return { ok: false, reason: "Bu alan dolu." };
      }
    }
    return { ok: true };
  }

  addObject(objectId, x, y, free = false) {
    const def = GameData.objects[objectId];
    if (!def) return null;
    const placement = this.canPlaceObject(objectId, x, y);
    if (!placement.ok) { this.notify(placement.reason, "warn"); return null; }
    if (!free && this.household.money < def.price) { this.notify("Bu eşya için yeterli paran yok.", "warn"); return null; }
    if (!free) this.household.money -= def.price;
    const obj = {
      uid: `obj_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      id: objectId,
      name: def.name,
      icon: def.icon,
      category: def.category,
      price: def.price,
      size: { ...def.size },
      position: { x, y },
      rotation: this.rotation,
      color: def.color,
      interactions: def.interactions,
      comfort: def.comfort || 0,
      environment: def.environment || 0,
      dirty: 0,
      broken: false
    };
    this.objects.push(obj);
    if (!free) this.notify(`${def.name} satın alındı.`, "good");
    return obj;
  }

  removeObjectAt(x, y) {
    const obj = this.objectAt(x, y);
    if (!obj) return false;
    this.objects = this.objects.filter(o => o.uid !== obj.uid);
    this.household.money += Math.floor(obj.price * 0.55);
    this.notify(`${obj.name} satıldı.`, "good");
    return true;
  }

  notify(text, type = "info") {
    this.notifications.push({ id: `${Date.now()}_${Math.random()}`, text, type, ttl: 4.4 });
  }

  homeEnvironmentScore() {
    let score = 50;
    for (const obj of this.objects) score += (obj.environment || 0) * 0.35 - (obj.dirty || 0) * 8 - (obj.broken ? 12 : 0);
    for (const row of this.tiles) for (const t of row) score -= (t.dirty || 0) * 3;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  comfortScoreNear(character) {
    let score = 45;
    for (const obj of this.objects) {
      const d = Math.abs(obj.position.x - character.position.x) + Math.abs(obj.position.y - character.position.y);
      if (d <= 5) score += (obj.comfort || 0) * (1 - d / 6) * .7;
    }
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  update(dt) {
    this.notifications.forEach(n => n.ttl -= dt);
    this.notifications = this.notifications.filter(n => n.ttl > 0);
  }

  serialize() {
    return JSON.stringify({
      version: this.version,
      mode: this.mode,
      activeTab: this.activeTab,
      selectedBuildTool: this.selectedBuildTool,
      selectedObjectId: this.selectedObjectId,
      rotation: this.rotation,
      camera: this.camera,
      time: this.time,
      household: this.household,
      lot: this.lot,
      tiles: this.tiles,
      objects: this.objects,
      characters: this.characters,
      activeCharacterId: this.activeCharacterId,
      randomEventCooldown: this.randomEventCooldown
    });
  }

  static fromJSON(raw) {
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    const state = new GameState();
    Object.assign(state, obj);
    state.characters = (state.characters || []).map(c => Character.hydrate(c));
    state.notifications = [];
    return state;
  }
}
window.GameState = GameState;
