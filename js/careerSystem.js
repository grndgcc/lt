class CareerSystem {
  static update(state, character, gameMinutes) {
    const career = GameData.careers[character.career.id] || GameData.careers.none;
    if (!career || character.career.id === "none") return;
    const day = TimeSystem.dayIndex(state);
    const hour = TimeSystem.hour(state) + TimeSystem.minute(state) / 60;
    const worksToday = career.days.includes(day);

    if (character.career.atWork) {
      character.needs.energy = Math.max(0, character.needs.energy - .012 * gameMinutes);
      character.needs.fun = Math.max(0, character.needs.fun - .013 * gameMinutes);
      character.needs.social = Math.max(0, character.needs.social + .006 * gameMinutes);
      const skillLevel = career.skill ? character.skills[career.skill]?.level || 1 : 1;
      const moodBonus = ["happy", "focused", "confident", "energized"].includes(character.mood) ? .028 : -.01;
      const traitBonus = character.hasTrait("hardworking") ? .022 : 0;
      character.career.performance = Math.max(0, Math.min(100, character.career.performance + (moodBonus + traitBonus + skillLevel * .004) * gameMinutes));
      if (hour >= career.end || (career.end < career.start && hour < career.start && hour >= career.end)) {
        this.returnFromWork(state, character, career);
      }
      return;
    }

    if (worksToday && !character.career.missedToday && hour >= career.start && hour < career.end) {
      this.goToWork(state, character, career);
    }
    if (worksToday && !character.career.missedToday && hour > career.start + 1.2 && hour < career.end && !character.career.atWork) {
      character.career.performance = Math.max(0, character.career.performance - 8);
      character.career.missedToday = true;
      state.notify(`${character.firstName} işe geç kaldı. Performans düştü.`, "warn");
    }
  }

  static goToWork(state, character, career) {
    character.hidden = true;
    character.clearQueue();
    character.career.atWork = true;
    character.addMoodlet("İşte", "focused", 4, (career.end - career.start) * 60);
    state.notify(`${character.firstName} ${career.name} işine gitti.`, "info");
  }

  static returnFromWork(state, character, career) {
    character.hidden = false;
    character.position = { x: 7, y: 11 };
    character.pixel = { ...character.position };
    character.career.atWork = false;
    character.career.missedToday = true;
    const salary = Math.round(career.salary * (1 + (character.career.level - 1) * .22));
    state.household.money += salary;
    character.needs.energy = Math.max(0, character.needs.energy - 18);
    character.needs.fun = Math.max(0, character.needs.fun - 12);
    character.addMoodlet("Maaş aldı", "confident", 8, 150);
    state.notify(`İş bitti. ₺${salary} maaş kazanıldı.`, "good");
    if (character.career.performance >= 100 && character.career.level < 10) {
      character.career.level += 1;
      character.career.performance = 35;
      state.notify(`Terfi! Yeni pozisyon: ${career.levels[character.career.level - 1]}.`, "good");
      character.addMoodlet("Terfi aldı", "confident", 14, 240);
    }
  }

  static offerJobs(state, character) {
    const jobs = Object.entries(GameData.careers).filter(([id]) => id !== "none");
    const names = jobs.map(([id, c]) => `${c.name}`).join(", ");
    const chosen = jobs[Math.floor(Math.random() * jobs.length)];
    character.career = { id: chosen[0], level: 1, performance: 20, atWork: false, workUntil: null, missedToday: false };
    state.notify(`${character.firstName} ${chosen[1].name} kariyerine başladı. Diğer alanlar: ${names}.`, "good");
  }

  static payBills(state, character) {
    if (state.household.billsDue <= 0) { state.notify("Ödenecek fatura yok.", "info"); return; }
    if (state.household.money < state.household.billsDue) { state.notify("Faturayı ödemek için yeterli para yok.", "warn"); return; }
    state.household.money -= state.household.billsDue;
    state.notify(`₺${state.household.billsDue} fatura ödendi.`, "good");
    state.household.billsDue = 0;
    character.addMoodlet("Sorumluluk tamam", "confident", 5, 120);
  }

  static dailyUpdate(state) {
    if (state.time.day > 0 && state.time.day % 4 === 0 && state.household.lastBillDay !== state.time.day) {
      const bill = Math.round(180 + state.objects.reduce((sum, o) => sum + o.price * .015, 0));
      state.household.billsDue += bill;
      state.household.lastBillDay = state.time.day;
      state.notify(`Yeni fatura geldi: ₺${bill}. Bilgisayardan ödeyebilirsin.`, "warn");
    }
  }
}
window.CareerSystem = CareerSystem;
