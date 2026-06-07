class TimeSystem {
  static update(state, dt) {
    const speed = state.time.speed;
    if (speed <= 0) return 0;
    const gameMinutes = dt * speed; // 1 real second at 1x = 1 in-game minute.
    state.time.minute += gameMinutes;
    while (state.time.minute >= 1440) {
      state.time.minute -= 1440;
      state.time.day += 1;
      state.characters.forEach(c => c.career.missedToday = false);
      CareerSystem.dailyUpdate(state);
      SaveSystem.autoSave(state);
    }
    return gameMinutes;
  }

  static dayIndex(state) { return state.time.day % 7; }
  static hour(state) { return Math.floor(state.time.minute / 60); }
  static minute(state) { return Math.floor(state.time.minute % 60); }
  static label(state) {
    const d = GameData.days[this.dayIndex(state)];
    const h = String(this.hour(state)).padStart(2, "0");
    const m = String(this.minute(state)).padStart(2, "0");
    return `${d} ${h}:${m}`;
  }
  static dayPhase(state) {
    const h = this.hour(state);
    if (h >= 6 && h < 12) return "sabah";
    if (h >= 12 && h < 18) return "öğle";
    if (h >= 18 && h < 22) return "akşam";
    return "gece";
  }
  static lightAlpha(state) {
    const h = TimeSystem.hour(state) + TimeSystem.minute(state) / 60;
    if (h >= 7 && h <= 17) return 0;
    if (h >= 22 || h < 5) return .42;
    if (h > 17 && h < 22) return (h - 17) / 5 * .36;
    return (7 - h) / 2 * .32;
  }
}
window.TimeSystem = TimeSystem;
