class UI {
  static init(app) {
    this.app = app;
    this.bindStaticEvents();
    this.populateTraits();
  }

  static bindStaticEvents() {
    document.querySelectorAll("[data-speed]").forEach(btn => btn.addEventListener("click", () => {
      this.app.state.time.speed = Number(btn.dataset.speed);
      this.updateSpeedButtons();
    }));
    document.querySelectorAll("[data-mode]").forEach(btn => btn.addEventListener("click", () => BuildMode.setMode(this.app.state, btn.dataset.mode)));
    document.querySelectorAll("[data-tab]").forEach(btn => btn.addEventListener("click", () => { this.app.state.activeTab = btn.dataset.tab; this.render(this.app.state); }));
    document.getElementById("clearQueueBtn").addEventListener("click", () => { this.app.state.activeCharacter().clearQueue(); this.app.state.notify("Komut sırası temizlendi."); });
    document.getElementById("callFriendBtn").addEventListener("click", () => {
      const c = this.app.state.activeCharacter();
      c.enqueue({ type: "socialCall", label: "Telefonla sohbet", duration: 60 });
      this.app.state.notify("Telefonla sohbet komut sırasına eklendi.");
    });
    document.getElementById("closeToolPanel").addEventListener("click", () => this.closeToolPanel());
    document.getElementById("newGameBtn").addEventListener("click", () => {
      document.getElementById("startOverlay").classList.add("hidden");
      document.getElementById("creatorOverlay").classList.remove("hidden");
    });
    document.getElementById("loadGameBtn").addEventListener("click", () => {
      const loaded = SaveSystem.load();
      if (loaded) this.app.startWithState(loaded);
      else this.toastOnly("Kayıt bulunamadı.");
    });
    document.getElementById("creatorForm").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.currentTarget);
      const traits = [...ev.currentTarget.querySelectorAll("input[name=traits]:checked")].map(i => i.value).slice(0,3);
      if (traits.length !== 3) { this.toastOnly("Lütfen tam 3 kişilik seç."); return; }
      const data = Object.fromEntries(fd.entries());
      data.traits = traits;
      const state = GameState.starter(data);
      this.app.startWithState(state);
    });
    document.addEventListener("keydown", (e) => {
      if (!this.app.state) return;
      if (e.target && ["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.code === "Space") { e.preventDefault(); this.app.state.time.speed = this.app.state.time.speed === 0 ? 1 : 0; this.updateSpeedButtons(); }
      if (e.key === "1") this.app.state.time.speed = 1;
      if (e.key === "2") this.app.state.time.speed = 3;
      if (e.key === "3") this.app.state.time.speed = 8;
      if (e.key.toLowerCase() === "b") BuildMode.setMode(this.app.state, "build");
      if (e.key.toLowerCase() === "l") BuildMode.setMode(this.app.state, "life");
      if (e.key.toLowerCase() === "s" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); SaveSystem.save(this.app.state); }
      if (e.key.toLowerCase() === "r") { this.app.state.rotation = (this.app.state.rotation + 90) % 360; this.app.state.notify("Eşya döndürüldü."); }
      this.render(this.app.state);
    });
  }

  static populateTraits() {
    const root = document.getElementById("traitChoices");
    root.innerHTML = GameData.traits.map((t, i) => `<label title="${t.tip}"><input type="checkbox" name="traits" value="${t.id}" ${i < 3 ? "checked" : ""}/> ${t.name}</label>`).join("");
    root.addEventListener("change", () => {
      const checked = [...root.querySelectorAll("input:checked")];
      if (checked.length > 3) checked.at(-1).checked = false;
    });
  }

  static render(state) {
    if (!state) return;
    this.updateTop(state);
    this.updateModes(state);
    this.updatePortrait(state);
    this.updateQueue(state);
    this.updateTab(state);
    this.updateNotifications(state);
    if (state.mode === "build") this.openBuildPanel(state, false);
    if (state.mode === "buy") this.openBuyPanel(state, false);
  }

  static updateTop(state) {
    document.getElementById("clockText").textContent = `${TimeSystem.label(state)} • ${TimeSystem.dayPhase(state)}`;
    document.getElementById("moneyText").textContent = `₺${Math.round(state.household.money)}`;
    document.getElementById("billText").textContent = state.household.billsDue > 0 ? `Fatura: ₺${state.household.billsDue}` : "Fatura: yok";
    this.updateSpeedButtons();
  }

  static updateSpeedButtons() {
    const speed = this.app?.state?.time?.speed;
    document.querySelectorAll("[data-speed]").forEach(b => b.classList.toggle("active", Number(b.dataset.speed) === speed));
  }

  static updateModes(state) {
    document.querySelectorAll("[data-mode]").forEach(b => b.classList.toggle("active", b.dataset.mode === state.mode));
  }

  static updatePortrait(state) {
    const c = state.activeCharacter();
    if (!c) return;
    document.getElementById("portraitFace").textContent = MoodSystem.face(c.mood);
    document.getElementById("charName").textContent = c.fullName();
    const current = c.hidden ? "İşte" : c.currentAction ? c.currentAction.label || c.currentAction.action?.label : c.path?.length ? "Yürüyor" : "Serbest";
    document.getElementById("moodText").textContent = `${MoodSystem.label(c.mood)} • ${current}`;
  }

  static updateQueue(state) {
    const c = state.activeCharacter();
    const list = document.getElementById("queueList");
    const commands = c.queue || [];
    if (!commands.length) { list.innerHTML = `<li class="emptyHint">Komut yok</li>`; return; }
    list.innerHTML = commands.map((cmd, i) => `<li data-idx="${i}">${cmd.label || cmd.type}</li>`).join("");
    list.querySelectorAll("li[data-idx]").forEach(li => li.addEventListener("click", () => {
      c.queue.splice(Number(li.dataset.idx), 1);
      state.notify("Komut iptal edildi.");
      this.render(state);
    }));
  }

  static updateTab(state) {
    document.querySelectorAll("[data-tab]").forEach(b => b.classList.toggle("active", b.dataset.tab === state.activeTab));
    const c = state.activeCharacter();
    const el = document.getElementById("tabContent");
    if (state.activeTab === "needs") {
      const names = { hunger: "Açlık", energy: "Enerji", hygiene: "Hijyen", bladder: "Tuvalet", fun: "Eğlence", social: "Sosyallik", comfort: "Konfor", environment: "Ortam" };
      el.innerHTML = Object.entries(c.needs).map(([k, v]) => `<div class="needRow"><span>${names[k]}</span><div class="bar"><i style="width:${Math.round(v)}%"></i></div><span>${Math.round(v)}</span></div>`).join("");
    } else if (state.activeTab === "skills") {
      el.innerHTML = Object.entries(c.skills).map(([k, v]) => `<div class="skillRow"><span>${GameData.skills[k] || k}</span><div class="bar"><i style="width:${Math.min(100, Math.round(v.xp / (v.level * 100) * 100))}%"></i></div><span>${v.level}</span></div>`).join("");
    } else if (state.activeTab === "career") {
      const job = GameData.careers[c.career.id] || GameData.careers.none;
      const rel = c.relationships.neighbor_arya;
      el.innerHTML = `
        <div class="careerRow"><span>Kariyer</span><strong>${job.name}</strong><span>Lv ${c.career.level}</span></div>
        <div class="careerRow"><span>Pozisyon</span><span>${job.levels[c.career.level - 1] || "-"}</span><span></span></div>
        <div class="careerRow"><span>Performans</span><div class="bar"><i style="width:${Math.round(c.career.performance || 0)}%"></i></div><span>${Math.round(c.career.performance || 0)}</span></div>
        <div class="careerRow"><span>İlişki</span><span>${rel?.name || "Arya Koru"}: ${rel?.level || "Tanıdık"}</span><span>${Math.round(rel?.friendship || 0)}</span></div>`;
    } else {
      const env = state.homeEnvironmentScore();
      const value = Math.round(state.objects.reduce((sum, o) => sum + o.price, 0));
      el.innerHTML = `
        <div class="careerRow"><span>Ortam</span><div class="bar"><i style="width:${env}%"></i></div><span>${env}</span></div>
        <div class="careerRow"><span>Eşya</span><strong>${state.objects.length} nesne</strong><span>₺${value}</span></div>
        <div class="careerRow"><span>Kayıt</span><button id="saveNowBtn" class="smallBtn">Kaydet</button><button id="deleteSaveBtn" class="smallBtn danger">Sil</button></div>`;
      setTimeout(() => {
        document.getElementById("saveNowBtn")?.addEventListener("click", () => SaveSystem.save(state));
        document.getElementById("deleteSaveBtn")?.addEventListener("click", () => { SaveSystem.delete(); state.notify("Kayıt silindi."); });
      });
    }
  }

  static updateNotifications(state) {
    const root = document.getElementById("notificationStack");
    root.innerHTML = state.notifications.slice(-4).map(n => `<div class="toast ${n.type}">${n.text}</div>`).join("");
  }

  static openInteractionMenu(state, obj, clientX, clientY) {
    const menu = document.getElementById("interactionMenu");
    const actions = ObjectSystem.interactionsFor(obj);
    menu.innerHTML = `<h4>${obj.icon} ${obj.name}</h4>` + actions.map(a => `<button data-action="${a.id}">${a.label}${a.cost ? ` • ₺${a.cost}` : ""}</button>`).join("") + `<button data-sell="1">Eşyayı sat (+₺${Math.floor(obj.price * .55)})</button>`;
    menu.style.left = `${Math.min(clientX, window.innerWidth - 320)}px`;
    menu.style.top = `${Math.min(clientY, window.innerHeight - 300)}px`;
    menu.classList.remove("hidden");
    menu.querySelectorAll("button[data-action]").forEach(btn => btn.addEventListener("click", () => {
      ObjectSystem.enqueueInteraction(state, obj.uid, btn.dataset.action);
      this.closeInteractionMenu();
    }));
    menu.querySelector("button[data-sell]").addEventListener("click", () => { state.removeObjectAt(obj.position.x, obj.position.y); this.closeInteractionMenu(); });
  }

  static closeInteractionMenu() { document.getElementById("interactionMenu").classList.add("hidden"); }

  static openBuildPanel(state, force = true) {
    const panel = document.getElementById("toolPanel");
    if (force) panel.classList.remove("hidden");
    document.getElementById("toolTitle").textContent = "İnşa Modu";
    const content = document.getElementById("toolContent");
    content.innerHTML = `<p>Izgaraya tıkla. Duvarlar yolu kapatır, kapılar geçiş sağlar.</p><div class="toolGrid">${GameData.buildTools.map(t => `<button class="toolCard ${state.selectedBuildTool === t.id ? "active" : ""}" data-tool="${t.id}"><strong>${t.name} • ₺${t.price}</strong><small>${t.hint}</small></button>`).join("")}</div>`;
    content.querySelectorAll("[data-tool]").forEach(btn => btn.addEventListener("click", () => { state.selectedBuildTool = btn.dataset.tool; this.openBuildPanel(state); }));
    panel.classList.remove("hidden");
  }

  static openBuyPanel(state, force = true) {
    const panel = document.getElementById("toolPanel");
    if (force) panel.classList.remove("hidden");
    document.getElementById("toolTitle").textContent = "Eşya Modu";
    const categories = [...new Set(Object.values(GameData.objects).map(o => o.category))];
    const cards = Object.values(GameData.objects).map(o => `<button class="toolCard ${state.selectedObjectId === o.id ? "active" : ""}" data-object="${o.id}"><strong>${o.icon} ${o.name}</strong><small>${o.category} • ${o.size.w}x${o.size.h} • ₺${o.price}</small></button>`).join("");
    document.getElementById("toolContent").innerHTML = `<p>Eşyayı seçip zemine yerleştir. <span class="kbd">R</span> döndürür.</p><div class="catalogGrid">${cards}</div>`;
    document.querySelectorAll("[data-object]").forEach(btn => btn.addEventListener("click", () => { state.selectedObjectId = btn.dataset.object; this.openBuyPanel(state); }));
    panel.classList.remove("hidden");
  }

  static closeToolPanel() { document.getElementById("toolPanel").classList.add("hidden"); }

  static toastOnly(text) {
    const root = document.getElementById("notificationStack");
    const node = document.createElement("div");
    node.className = "toast";
    node.textContent = text;
    root.appendChild(node);
    setTimeout(() => node.remove(), 3000);
  }
}
window.UI = UI;
