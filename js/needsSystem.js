class NeedsSystem {
  static update(state, character, gameMinutes) {
    const n = character.needs;
    const socialDrain = character.hasTrait("social") ? 0.025 : character.hasTrait("shy") ? 0.012 : 0.018;
    const energyDrain = character.hasTrait("lazy") ? 0.024 : 0.018;
    n.hunger -= 0.018 * gameMinutes;
    n.energy -= energyDrain * gameMinutes;
    n.hygiene -= 0.012 * gameMinutes;
    n.bladder -= 0.03 * gameMinutes;
    n.fun -= 0.017 * gameMinutes;
    n.social -= socialDrain * gameMinutes;
    n.comfort = n.comfort * 0.98 + state.comfortScoreNear(character) * 0.02;
    n.environment = n.environment * 0.98 + state.homeEnvironmentScore() * 0.02;
    Object.keys(n).forEach(k => n[k] = Math.max(0, Math.min(100, n[k])));

    if (n.hunger < 10 && !character.moodlets.some(m => m.id === "starving")) character.addMoodlet("Çok aç", "uncomfortable", 14, 80);
    if (n.energy < 10 && !character.moodlets.some(m => m.id === "exhausted")) character.addMoodlet("Uykusuz", "tired", 12, 80);
    if (n.hygiene < 15 && !character.moodlets.some(m => m.id === "dirty")) character.addMoodlet("Kirli hissediyor", "uncomfortable", 9, 90);
    if (n.bladder <= 0) {
      n.bladder = 35; n.hygiene = Math.max(0, n.hygiene - 38);
      character.addMoodlet("Utanç verici kaza", "embarrassed", 16, 180);
      state.notify("Tuvalet ihtiyacı çok düştü ve küçük bir kaza yaşandı.", "warn");
    }
  }
}
window.NeedsSystem = NeedsSystem;
