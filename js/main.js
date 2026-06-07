class AppController {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.state = null;
    this.renderer = null;
    this.last = performance.now();
    this.pointer = { down: false, moved: false, lastX: 0, lastY: 0, startX: 0, startY: 0 };
    UI.init(this);
    this.bindCanvas();
    requestAnimationFrame((t) => this.loop(t));
  }

  startWithState(state) {
    this.state = state;
    document.getElementById("startOverlay").classList.add("hidden");
    document.getElementById("creatorOverlay").classList.add("hidden");
    if (!this.renderer) this.renderer = new Renderer(this.canvas, this.state);
    else this.renderer.setState(this.state);
    this.state.notify("Hoş geldin! Yaşam modunda karaktere veya nesnelere tıklayabilirsin.", "good");
    UI.render(this.state);
  }

  bindCanvas() {
    this.canvas.addEventListener("pointerdown", (e) => {
      if (!this.state) return;
      this.canvas.setPointerCapture(e.pointerId);
      this.pointer = { down: true, moved: false, lastX: e.clientX, lastY: e.clientY, startX: e.clientX, startY: e.clientY };
      UI.closeInteractionMenu();
    });
    this.canvas.addEventListener("pointermove", (e) => {
      if (!this.state || !this.pointer.down) return;
      const dx = e.clientX - this.pointer.lastX;
      const dy = e.clientY - this.pointer.lastY;
      const total = Math.hypot(e.clientX - this.pointer.startX, e.clientY - this.pointer.startY);
      if (total > 8 || e.buttons === 2) {
        this.pointer.moved = true;
        this.state.camera.x += dx;
        this.state.camera.y += dy;
      }
      this.pointer.lastX = e.clientX;
      this.pointer.lastY = e.clientY;
    });
    this.canvas.addEventListener("pointerup", (e) => {
      if (!this.state) return;
      const wasMoved = this.pointer.moved;
      this.pointer.down = false;
      if (!wasMoved) this.handleCanvasClick(e);
    });
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    this.canvas.addEventListener("wheel", (e) => {
      if (!this.state) return;
      e.preventDefault();
      const cam = this.state.camera;
      const before = this.renderer.screenToTile(e.clientX, e.clientY);
      const factor = e.deltaY > 0 ? .92 : 1.08;
      cam.zoom = Math.max(.55, Math.min(1.8, cam.zoom * factor));
      const rect = this.canvas.getBoundingClientRect();
      cam.x = e.clientX - rect.left - before.rawX * this.renderer.tile * cam.zoom;
      cam.y = e.clientY - rect.top - before.rawY * this.renderer.tile * cam.zoom;
    }, { passive: false });
  }

  handleCanvasClick(e) {
    const tile = this.renderer.screenToTile(e.clientX, e.clientY);
    const x = tile.x, y = tile.y;
    if (!this.state.isInside(x, y)) return;
    const obj = this.state.objectAt(x, y);
    if (this.state.mode === "life") {
      if (obj) UI.openInteractionMenu(this.state, obj, e.clientX, e.clientY);
      else {
        const c = this.state.activeCharacter();
        if (this.state.isBlocked(x, y, { ignoreCharacters: true })) { this.state.notify("Buraya yürünemiyor.", "warn"); return; }
        c.enqueue({ type: "move", label: `Yürü (${x}, ${y})`, to: { x, y } });
      }
    } else if (this.state.mode === "build") {
      BuildMode.applyTool(this.state, x, y);
    } else if (this.state.mode === "buy") {
      if (!this.state.selectedObjectId) { this.state.notify("Önce bir eşya seç.", "warn"); return; }
      this.state.addObject(this.state.selectedObjectId, x, y);
    }
    UI.render(this.state);
  }

  loop(now) {
    const dt = Math.min(.08, (now - this.last) / 1000 || 0);
    this.last = now;
    if (this.state) {
      const gameMinutes = TimeSystem.update(this.state, dt);
      this.state.update(dt);
      for (const c of this.state.characters) {
        NeedsSystem.update(this.state, c, gameMinutes);
        MoodSystem.update(c);
        CareerSystem.update(this.state, c, gameMinutes);
        c.update(this.state, dt, gameMinutes);
      }
      ObjectSystem.updateRandomBreaks(this.state, gameMinutes);
      this.renderer.draw();
      if (!this._uiTick || now - this._uiTick > 280) { UI.render(this.state); this._uiTick = now; }
    }
    requestAnimationFrame((t) => this.loop(t));
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.app = new AppController();
  if (!SaveSystem.hasSave()) document.getElementById("loadGameBtn").disabled = true;
});
