class SaveSystem {
  static key = "minik-hayatlar-evim-save";
  static save(state) {
    localStorage.setItem(this.key, state.serialize());
    state.notify("Oyun kaydedildi.", "good");
  }
  static autoSave(state) {
    localStorage.setItem(`${this.key}-auto`, state.serialize());
  }
  static load() {
    const raw = localStorage.getItem(this.key) || localStorage.getItem(`${this.key}-auto`);
    if (!raw) return null;
    return GameState.fromJSON(raw);
  }
  static hasSave() { return !!(localStorage.getItem(this.key) || localStorage.getItem(`${this.key}-auto`)); }
  static delete() { localStorage.removeItem(this.key); localStorage.removeItem(`${this.key}-auto`); }
}
window.SaveSystem = SaveSystem;
