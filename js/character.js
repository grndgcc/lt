class Character {
  static create(data = {}) {
    const traitIds = data.traits && data.traits.length ? data.traits : ["creative", "social", "clean"];
    const c = new Character();
    c.id = `char_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    c.firstName = data.firstName || "Arin";
    c.lastName = data.lastName || "Vale";
    c.ageGroup = data.ageGroup || "adult";
    c.appearance = {
      skin: data.appearance || "warm",
      hair: data.hair || "short",
      outfit: data.outfit || "casual"
    };
    c.personality = traitIds.slice(0, 3);
    c.aspiration = data.aspiration || "wealth";
    c.needs = { hunger: 82, energy: 76, hygiene: 88, bladder: 74, fun: 66, social: 62, comfort: 50, environment: 60 };
    c.mood = "happy";
    c.moodlets = [{ id: "newHome", label: "Yeni başlangıç", mood: "happy", power: 8, ttl: 8 * 60 }];
    c.skills = {};
    Object.keys(GameData.skills).forEach(k => c.skills[k] = { level: 1, xp: 0 });
    c.career = { id: "none", level: 1, performance: 10, atWork: false, workUntil: null, missedToday: false };
    c.relationships = { neighbor_arya: { name: "Arya Koru", friendship: 12, romance: 0, level: "Tanıdık" } };
    c.queue = [];
    c.position = { x: 4, y: 4 };
    c.pixel = { x: c.position.x, y: c.position.y };
    c.path = [];
    c.currentAction = null;
    c.actionTimer = 0;
    c.autonomyCooldown = 4;
    c.talkBubble = null;
    c.hidden = false;
    return c;
  }

  static hydrate(data) {
    const c = new Character();
    Object.assign(c, data);
    c.pixel = c.pixel || { ...c.position };
    c.path = c.path || [];
    c.queue = c.queue || [];
    c.moodlets = c.moodlets || [];
    c.relationships = c.relationships || {};
    c.hidden = !!c.hidden;
    return c;
  }

  fullName() { return `${this.firstName} ${this.lastName}`; }
  hasTrait(id) { return this.personality.includes(id); }

  enqueue(command) { this.queue.push(command); }
  clearQueue() { this.queue = []; this.currentAction = null; this.path = []; }

  update(state, dt, gameMinutes) {
    if (this.hidden) return;
    this.pixel = this.pixel || { ...this.position };
    this.moodlets.forEach(m => m.ttl -= gameMinutes);
    this.moodlets = this.moodlets.filter(m => m.ttl > 0);
    if (this.talkBubble) {
      this.talkBubble.ttl -= dt;
      if (this.talkBubble.ttl <= 0) this.talkBubble = null;
    }

    if (this.path && this.path.length) {
      const target = this.path[0];
      const speed = 3.2 * dt;
      const dx = target.x - this.pixel.x;
      const dy = target.y - this.pixel.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= speed) {
        this.pixel.x = target.x; this.pixel.y = target.y;
        this.position.x = target.x; this.position.y = target.y;
        this.path.shift();
      } else {
        this.pixel.x += dx / dist * speed;
        this.pixel.y += dy / dist * speed;
      }
      return;
    }

    if (this.currentAction) {
      this.actionTimer -= gameMinutes;
      if (this.actionTimer <= 0) this.finishAction(state);
      return;
    }

    if (this.queue.length) {
      this.startNextCommand(state);
    } else {
      this.autonomyCooldown -= dt;
      if (this.autonomyCooldown <= 0) {
        this.autonomyCooldown = 5 + Math.random() * 6;
        this.chooseAutonomousAction(state);
      }
    }
  }

  startNextCommand(state) {
    const cmd = this.queue.shift();
    if (!cmd) return;
    if (cmd.type === "move") {
      const path = PathFinder.findPath(state, this.position, cmd.to);
      if (!path.length && !(this.position.x === cmd.to.x && this.position.y === cmd.to.y)) {
        state.notify("Buraya ulaşamıyorum.", "warn");
        return;
      }
      this.path = path;
      return;
    }
    if (cmd.type === "objectAction") {
      const obj = state.objects.find(o => o.uid === cmd.objectUid);
      if (!obj) { state.notify("Nesne artık yok.", "warn"); return; }
      const useTile = PathFinder.nearestUseTile(state, this.position, obj);
      if (!useTile) { state.notify("Bu nesneyi kullanmak için yeterli alan yok.", "warn"); return; }
      if (useTile.path.length) {
        this.queue.unshift(cmd);
        this.path = useTile.path;
        return;
      }
      this.currentAction = { ...cmd, objectName: obj.name, icon: obj.icon };
      this.actionTimer = cmd.action.duration;
      this.talkBubble = { text: obj.icon || "…", ttl: 2.2 };
      return;
    }
    if (cmd.type === "socialCall") {
      this.currentAction = { ...cmd, objectName: "Telefon", icon: "📱" };
      this.actionTimer = cmd.duration || 55;
      this.talkBubble = { text: "💬", ttl: 2.5 };
      return;
    }
  }

  finishAction(state) {
    const action = this.currentAction && this.currentAction.action;
    const cmd = this.currentAction;
    if (!cmd) return;

    if (cmd.type === "socialCall") {
      this.applyEffects({ social: +35, fun: +10 }, state);
      const rel = this.relationships.neighbor_arya || { name: "Arya Koru", friendship: 0, romance: 0 };
      rel.friendship = Math.min(100, rel.friendship + 9 + (this.hasTrait("social") ? 5 : 0));
      rel.level = this.relationshipLevel(rel);
      this.relationships.neighbor_arya = rel;
      this.addMoodlet("Güzel sohbet", "happy", 7, 130);
      this.talkBubble = { text: "😊", ttl: 2.5 };
      state.notify("Telefon sohbeti ilişkini güçlendirdi.", "good");
      this.currentAction = null;
      return;
    }

    if (action) {
      if (action.cost && state.household.money < action.cost) {
        state.notify("Bu etkileşim için yeterli para yok.", "warn");
      } else {
        if (action.cost) state.household.money -= action.cost;
        this.applyEffects(action.effects || {}, state);
        if (action.skill) this.gainSkill(action.skill, action.xp || 10, state);
        if (action.earn) {
          const [min, max] = action.earn;
          const level = this.skills[action.skill]?.level || 1;
          const earned = Math.round(min + Math.random() * (max - min) + level * 9);
          state.household.money += earned;
          state.notify(`${action.label} sonucunda ₺${earned} kazandın.`, "good");
        }
        if (action.special === "findJob") CareerSystem.offerJobs(state, this);
        if (action.special === "payBills") CareerSystem.payBills(state, this);
        const obj = state.objects.find(o => o.uid === cmd.objectUid);
        if (obj && action.special === "cleanObject") { obj.dirty = 0; state.notify(`${obj.name} temizlendi.`, "good"); }
        if (obj && action.special === "repairObject") { obj.broken = false; state.notify(`${obj.name} tamir edildi.`, "good"); }
        if (obj && action.effects && action.effects.dirty) obj.dirty = Math.min(5, (obj.dirty || 0) + action.effects.dirty);
      }
      this.talkBubble = { text: this.reactionIcon(action), ttl: 2.6 };
    }
    this.currentAction = null;
  }

  reactionIcon(action) {
    if (!action) return "…";
    if (action.skill === "programming") return "💡";
    if (action.skill === "painting") return "🎨";
    if (action.skill === "fitness") return "💪";
    if (action.effects?.hunger) return "🍽";
    if (action.effects?.hygiene) return "✨";
    if (action.effects?.fun) return "🎵";
    if (action.effects?.energy) return "💤";
    return "🙂";
  }

  applyEffects(effects, state) {
    const scalar = this.hasTrait("bookworm") && effects.fun ? 1.06 : 1;
    for (const [key, value] of Object.entries(effects)) {
      if (key in this.needs) this.needs[key] = Math.max(0, Math.min(100, this.needs[key] + value * scalar));
    }
    if (effects.mood) {
      const moodlets = {
        rested: ["Dinlenmiş", "energized", 10, 180], tastyMeal: ["Lezzetli yemek", "happy", 9, 160], fresh: ["Tertemiz", "confident", 7, 140],
        focused: ["Odaklandı", "focused", 8, 150], inspired: ["İlham geldi", "inspired", 9, 170], energized: ["Hareketli", "energized", 8, 120], relief: ["Faturalar ödendi", "happy", 6, 120]
      };
      const m = moodlets[effects.mood];
      if (m) this.addMoodlet(...m);
    }
    this.needs.comfort = state.comfortScoreNear(this);
    this.needs.environment = state.homeEnvironmentScore();
  }

  addMoodlet(label, mood, power = 5, ttl = 100) {
    this.moodlets.push({ id: `${Date.now()}_${Math.random()}`, label, mood, power, ttl });
  }

  gainSkill(skill, amount, state) {
    if (!this.skills[skill]) this.skills[skill] = { level: 1, xp: 0 };
    let boost = 1;
    if (this.hasTrait("creative") && ["painting", "music", "writing"].includes(skill)) boost += .25;
    if (this.hasTrait("athletic") && skill === "fitness") boost += .25;
    if (this.hasTrait("tech") && skill === "programming") boost += .25;
    if (this.mood === "focused") boost += .15;
    if (this.mood === "inspired" && ["painting", "writing", "music"].includes(skill)) boost += .2;
    this.skills[skill].xp += amount * boost;
    const needed = this.skills[skill].level * 100;
    if (this.skills[skill].level < 10 && this.skills[skill].xp >= needed) {
      this.skills[skill].xp -= needed;
      this.skills[skill].level += 1;
      state.notify(`${GameData.skills[skill]} becerisi ${this.skills[skill].level}. seviyeye çıktı!`, "good");
      this.addMoodlet("Beceri gelişti", "confident", 8, 120);
    }
  }

  chooseAutonomousAction(state) {
    const n = this.needs;
    if (this.currentAction || this.queue.length) return;
    const objectFor = (ids) => state.objects.find(o => ids.includes(o.id));
    let target = null, actionId = null;
    if (n.hunger < 32) { target = objectFor(["fridge_basic"]); actionId = n.hunger < 18 ? "cook" : "snack"; }
    else if (n.bladder < 28) { target = objectFor(["toilet_basic"]); actionId = "use_toilet"; }
    else if (n.energy < 24) { target = objectFor(["bed_basic", "sofa_basic"]); actionId = target?.id === "sofa_basic" ? "nap_sofa" : "sleep"; }
    else if (n.hygiene < 30) { target = objectFor(["shower_basic"]); actionId = "shower"; }
    else if (n.fun < 32) { target = objectFor(["tv_basic", "computer_basic", "bookcase_basic"]); actionId = target?.id === "computer_basic" ? "browse" : target?.id === "bookcase_basic" ? "read" : "watch_tv"; }
    else if (n.social < 25 || (this.hasTrait("social") && n.social < 42)) { this.enqueue({ type: "socialCall", label: "Telefonla sohbet", duration: 60 }); return; }
    else if (this.hasTrait("clean") && state.objects.some(o => (o.dirty || 0) > 2)) {
      const dirty = state.objects.find(o => (o.dirty || 0) > 2);
      target = dirty; actionId = "clean_object";
    }

    if (target && actionId === "clean_object") {
      this.enqueue({ type: "objectAction", objectUid: target.uid, label: `${target.name} temizle`, action: { id: "clean_object", label: "Temizle", duration: 45, skill: "cleaning", xp: 12, effects: { hygiene: -5, environment: +8 } } });
    } else if (target) {
      const action = target.interactions.find(a => a.id === actionId) || target.interactions[0];
      this.enqueue({ type: "objectAction", objectUid: target.uid, label: action.label, action });
    }
  }

  relationshipLevel(rel) {
    if (rel.romance >= 70) return "Sevgili";
    if (rel.romance >= 40) return "Flört";
    if (rel.friendship >= 85) return "En iyi arkadaş";
    if (rel.friendship >= 60) return "Yakın arkadaş";
    if (rel.friendship >= 35) return "Arkadaş";
    if (rel.friendship < -20) return "Düşman";
    return "Tanıdık";
  }
}
window.Character = Character;
