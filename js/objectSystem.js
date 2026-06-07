class ObjectSystem {
  static interactionsFor(obj) {
    const base = [...(obj.interactions || [])];
    if ((obj.dirty || 0) > 1) base.push({ id: "clean_object", label: "Temizle", duration: 45, skill: "cleaning", xp: 12, effects: { hygiene: -4, environment: +8 }, special: "cleanObject" });
    if (obj.broken) base.push({ id: "repair_object", label: "Tamir et", duration: 75, skill: "repair", xp: 18, effects: { fun: -4 }, special: "repairObject" });
    return base;
  }

  static enqueueInteraction(state, objectUid, actionId) {
    const char = state.activeCharacter();
    const obj = state.objects.find(o => o.uid === objectUid);
    if (!char || !obj) return;
    const action = this.interactionsFor(obj).find(a => a.id === actionId);
    if (!action) return;
    char.enqueue({ type: "objectAction", objectUid: obj.uid, label: `${obj.name}: ${action.label}`, action });
    state.notify(`Komut eklendi: ${action.label}.`, "info");
  }

  static updateRandomBreaks(state, gameMinutes) {
    if (!state.objects.length) return;
    state.randomEventCooldown -= gameMinutes;
    if (state.randomEventCooldown > 0) return;
    state.randomEventCooldown = 240 + Math.random() * 360;
    const roll = Math.random();
    if (roll < 0.28) {
      const candidates = state.objects.filter(o => ["tv_basic", "computer_basic", "shower_basic", "toilet_basic"].includes(o.id) && !o.broken);
      if (candidates.length) {
        const obj = candidates[Math.floor(Math.random() * candidates.length)];
        obj.broken = true;
        state.notify(`${obj.name} bozuldu. Tamir edebilirsin.`, "warn");
      }
    } else if (roll < 0.55) {
      const c = state.activeCharacter();
      if (c) {
        c.addMoodlet("İlham anı", "inspired", 9, 120);
        state.notify("Kısa bir ilham anı geldi. Sanatsal işler için iyi zaman!", "good");
      }
    } else if (roll < 0.75) {
      const c = state.activeCharacter();
      if (c) {
        c.enqueue({ type: "socialCall", label: "Komşu araması", duration: 40 });
        state.notify("Komşudan telefon geldi; komut sırasına eklendi.", "info");
      }
    }
  }

  static completeSpecialIfNeeded(state, character, cmd) {
    // Reserved for future expansions. Current special handling lives in Character.finishAction.
  }
}
window.ObjectSystem = ObjectSystem;
