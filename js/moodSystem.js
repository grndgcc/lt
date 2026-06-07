class MoodSystem {
  static update(character) {
    const scores = {};
    const add = (mood, value) => scores[mood] = (scores[mood] || 0) + value;
    for (const m of character.moodlets) add(m.mood, m.power);
    const n = character.needs;
    if (n.hunger < 25 || n.hygiene < 25 || n.environment < 30) add("uncomfortable", 10);
    if (n.energy < 25) add("tired", 12);
    if (n.fun < 25) add("bored", 10);
    if (n.social < 20) add("sad", 8);
    if (n.comfort > 75 && n.environment > 70) add("happy", 6);
    if (character.hasTrait("cheerful")) add("happy", 3);
    if (character.hasTrait("hotheaded") && (n.hunger < 35 || n.fun < 35)) add("angry", 4);

    let best = "fine";
    let bestScore = 0;
    for (const [mood, score] of Object.entries(scores)) {
      if (score > bestScore) { best = mood; bestScore = score; }
    }
    character.mood = best;
  }

  static label(mood) {
    return {
      happy: "Mutlu", sad: "Üzgün", angry: "Sinirli", embarrassed: "Utanmış", energized: "Enerjik", tired: "Yorgun",
      romantic: "Romantik", focused: "Odaklanmış", inspired: "İlhamlı", bored: "Sıkılmış", stressed: "Stresli",
      uncomfortable: "Rahatsız", confident: "Kendinden emin", fine: "Normal"
    }[mood] || "Normal";
  }

  static face(mood) {
    return { happy: "😊", sad: "😢", angry: "😠", embarrassed: "😳", energized: "😄", tired: "😴", romantic: "😍", focused: "🤓", inspired: "🤩", bored: "😐", stressed: "😬", uncomfortable: "😖", confident: "😎", fine: "🙂" }[mood] || "🙂";
  }
}
window.MoodSystem = MoodSystem;
