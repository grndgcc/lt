class BuildMode {
  static setMode(state, mode) {
    state.mode = mode;
    if (mode === "build") UI.openBuildPanel(state);
    else if (mode === "buy") UI.openBuyPanel(state);
    else UI.closeToolPanel();
  }

  static applyTool(state, x, y) {
    if (!state.isInside(x, y)) return;
    const tool = state.selectedBuildTool;
    const tile = state.getTile(x, y);
    if (tool === "floor") {
      if (tile.floor) return;
      if (!this.spend(state, 8)) return;
      tile.floor = true;
      state.notify("Zemin döşendi.", "good");
    } else if (tool === "wall") {
      if (!tile.floor) { state.notify("Duvar için önce zemin gerekir.", "warn"); return; }
      if (state.objectAt(x, y)) { state.notify("Eşyanın üstüne duvar koyamazsın.", "warn"); return; }
      if (!this.spend(state, 35)) return;
      tile.wall = true; tile.door = false;
      state.notify("Duvar inşa edildi.", "good");
    } else if (tool === "door") {
      if (!tile.wall) { state.notify("Kapı için önce duvar seç.", "warn"); return; }
      if (!this.spend(state, 85)) return;
      tile.door = true; tile.wall = false; tile.floor = true;
      state.notify("Kapı eklendi.", "good");
    } else if (tool === "erase") {
      if (state.removeObjectAt(x, y)) return;
      if (tile.wall || tile.door) { tile.wall = false; tile.door = false; state.household.money += 10; state.notify("Yapı parçası silindi.", "good"); return; }
      if (tile.floor) { tile.floor = false; state.household.money += 2; state.notify("Zemin kaldırıldı.", "good"); return; }
    }
  }

  static spend(state, price) {
    if (state.household.money < price) { state.notify("Yeterli para yok.", "warn"); return false; }
    state.household.money -= price;
    return true;
  }
}
window.BuildMode = BuildMode;
