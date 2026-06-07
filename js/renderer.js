class Renderer {
  constructor(canvas, state) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.state = state;
    this.tile = 42;
    this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  setState(state) { this.state = state; this.centerCameraOnce(); }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.floor(rect.width * this.dpr);
    this.canvas.height = Math.floor(rect.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.centerCameraOnce();
  }

  centerCameraOnce() {
    if (!this.state || this.state.camera.initialized) return;
    const rect = this.canvas.getBoundingClientRect();
    this.state.camera.zoom = Math.min(1.08, Math.max(.72, rect.width / (this.state.lot.w * this.tile + 160)));
    this.state.camera.x = (rect.width - this.state.lot.w * this.tile * this.state.camera.zoom) / 2;
    this.state.camera.y = Math.max(78, (rect.height - this.state.lot.h * this.tile * this.state.camera.zoom) / 2 - 20);
    this.state.camera.initialized = true;
  }

  worldToScreen(x, y) {
    const cam = this.state.camera;
    return { x: cam.x + x * this.tile * cam.zoom, y: cam.y + y * this.tile * cam.zoom };
  }

  screenToTile(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const cam = this.state.camera;
    const x = (clientX - rect.left - cam.x) / (this.tile * cam.zoom);
    const y = (clientY - rect.top - cam.y) / (this.tile * cam.zoom);
    return { x: Math.floor(x), y: Math.floor(y), rawX: x, rawY: y };
  }

  draw() {
    const ctx = this.ctx;
    const rect = this.canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    this.drawBackground(ctx, rect.width, rect.height);
    ctx.save();
    const cam = this.state.camera;
    ctx.translate(cam.x, cam.y);
    ctx.scale(cam.zoom, cam.zoom);
    this.drawLot(ctx);
    this.drawObjects(ctx);
    this.drawCharacters(ctx);
    ctx.restore();
    this.drawNightOverlay(ctx, rect.width, rect.height);
  }

  drawBackground(ctx, w, h) {
    const phase = TimeSystem.dayPhase(this.state);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (phase === "gece") { grad.addColorStop(0, "#112434"); grad.addColorStop(1, "#0a151c"); }
    else if (phase === "akşam") { grad.addColorStop(0, "#35445c"); grad.addColorStop(1, "#20333f"); }
    else { grad.addColorStop(0, "#7fc9f1"); grad.addColorStop(1, "#7acb9e"); }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  drawLot(ctx) {
    const t = this.tile;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.25)";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "rgba(10,25,25,.2)";
    ctx.fillRect(-18, -18, this.state.lot.w * t + 36, this.state.lot.h * t + 36);
    ctx.restore();

    for (let y = 0; y < this.state.lot.h; y++) {
      for (let x = 0; x < this.state.lot.w; x++) {
        const tile = this.state.getTile(x, y);
        const px = x * t, py = y * t;
        ctx.fillStyle = tile.floor ? "#c9b692" : "#79b06d";
        ctx.fillRect(px, py, t, t);
        if (tile.floor) {
          ctx.fillStyle = (x + y) % 2 ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.035)";
          ctx.fillRect(px, py, t, t);
        }
        if (tile.dirty > 0) {
          ctx.fillStyle = `rgba(85,55,30,${Math.min(.5, tile.dirty * .12)})`;
          ctx.beginPath(); ctx.arc(px + t * .68, py + t * .65, t * .16, 0, Math.PI * 2); ctx.fill();
        }
        ctx.strokeStyle = "rgba(255,255,255,.12)";
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, t, t);
        if (tile.wall) {
          ctx.fillStyle = "#536373";
          ctx.fillRect(px + 4, py + 4, t - 8, t - 8);
          ctx.fillStyle = "rgba(255,255,255,.16)";
          ctx.fillRect(px + 7, py + 7, t - 14, 6);
        }
        if (tile.door) {
          ctx.fillStyle = "#9b623f";
          ctx.fillRect(px + 7, py + 5, t - 14, t - 10);
          ctx.fillStyle = "#ffd166";
          ctx.beginPath(); ctx.arc(px + t - 13, py + t / 2, 3, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  }

  drawObjects(ctx) {
    const t = this.tile;
    const sorted = [...this.state.objects].sort((a, b) => (a.position.y + a.size.h) - (b.position.y + b.size.h));
    for (const obj of sorted) {
      const x = obj.position.x * t, y = obj.position.y * t;
      const w = obj.size.w * t, h = obj.size.h * t;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,.18)";
      ctx.fillRect(x + 5, y + 7, w - 2, h - 2);
      ctx.fillStyle = obj.color || "#ddd";
      ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
      ctx.strokeStyle = "rgba(0,0,0,.35)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
      if (obj.broken) {
        ctx.fillStyle = "rgba(255, 107, 107, .9)";
        ctx.beginPath(); ctx.arc(x + w - 10, y + 10, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "white"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center"; ctx.fillText("!", x + w - 10, y + 14);
      }
      if (obj.dirty > 1) {
        ctx.fillStyle = "rgba(93,62,30,.45)";
        ctx.beginPath(); ctx.arc(x + 13, y + h - 12, 7, 0, Math.PI * 2); ctx.fill();
      }
      ctx.font = `${Math.min(28, w * .45)}px system-ui, emoji`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(obj.icon || "□", x + w / 2, y + h / 2);
      ctx.restore();
    }
  }

  drawCharacters(ctx) {
    const t = this.tile;
    for (const c of this.state.characters) {
      if (c.hidden) continue;
      const px = (c.pixel?.x ?? c.position.x) * t + t / 2;
      const py = (c.pixel?.y ?? c.position.y) * t + t / 2;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,.22)";
      ctx.beginPath(); ctx.ellipse(px + 3, py + 13, 15, 8, 0, 0, Math.PI * 2); ctx.fill();
      const skin = { warm: "#d89a6a", cool: "#e6c3a3", deep: "#8a5637", light: "#f2d6bc" }[c.appearance.skin] || "#d89a6a";
      const outfit = { casual: "#58b6ff", smart: "#3c4b70", sport: "#75ddb9", artist: "#bd7dff" }[c.appearance.outfit] || "#58b6ff";
      ctx.fillStyle = outfit;
      ctx.beginPath(); ctx.roundRect(px - 13, py - 2, 26, 28, 8); ctx.fill();
      ctx.fillStyle = skin;
      ctx.beginPath(); ctx.arc(px, py - 15, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#43342c";
      if (c.appearance.hair === "long") ctx.fillRect(px - 13, py - 28, 26, 18);
      else if (c.appearance.hair === "bun") { ctx.beginPath(); ctx.arc(px + 10, py - 28, 7, 0, Math.PI * 2); ctx.fill(); }
      else if (c.appearance.hair === "curly") { for (let i = -9; i <= 9; i += 6) { ctx.beginPath(); ctx.arc(px + i, py - 27, 5, 0, Math.PI * 2); ctx.fill(); } }
      else ctx.fillRect(px - 12, py - 28, 24, 10);
      ctx.fillStyle = "#101820";
      ctx.beginPath(); ctx.arc(px - 5, py - 15, 2, 0, Math.PI * 2); ctx.arc(px + 5, py - 15, 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.8)";
      ctx.lineWidth = 2;
      if (c.id === this.state.activeCharacterId) { ctx.beginPath(); ctx.arc(px, py, 24, 0, Math.PI * 2); ctx.stroke(); }
      if (c.talkBubble) this.drawBubble(ctx, px, py - 48, c.talkBubble.text);
      ctx.restore();
    }
  }

  drawBubble(ctx, x, y, text) {
    ctx.save();
    ctx.font = "20px system-ui, emoji";
    const w = Math.max(38, ctx.measureText(text).width + 18);
    ctx.fillStyle = "rgba(255,255,255,.94)";
    ctx.strokeStyle = "rgba(0,0,0,.18)";
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - 24, w, 32, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#14232b"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, x, y - 8);
    ctx.restore();
  }

  drawNightOverlay(ctx, w, h) {
    const a = TimeSystem.lightAlpha(this.state);
    if (a <= 0) return;
    ctx.fillStyle = `rgba(4, 10, 31, ${a})`;
    ctx.fillRect(0, 0, w, h);
  }
}
window.Renderer = Renderer;
