const { createApp } = Vue;

function genSeed(str) {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAti;
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  (h1 ^= h2 ^ h3 ^ h4), (h2 ^= h1), (h3 ^= h1), (h4 ^= h1);
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

function randomGenerator(seed) {
  const seedValues = genSeed(seed);
  let a = seedValues[0],
    b = seedValues[1],
    c = seedValues[2],
    d = seedValues[3];
  return function () {
    a |= 0; b |= 0; c |= 0; d |= 0;
    let t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

let random = randomGenerator('qwixx');

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

const row = (num, color) => Array.from({ length: 11 }, (_, i) => [num(i), color(i)]);

const standardRows = () => [
  row(i => i + 2, _ => 0),
  row(i => i + 2, _ => 1),
  row(i => 12 - i, _ => 2),
  row(i => 12 - i, _ => 3),
];
const randomRows = () => [
  shuffleArray(row(i => i + 2, _ => 0)),
  shuffleArray(row(i => i + 2, _ => 1)),
  shuffleArray(row(i => 12 - i, _ => 2)),
  shuffleArray(row(i => 12 - i, _ => 3)),
];
const rainbowRows = () => [
  row(i => i + 2, i => Math.floor((i / 3) % 4)),
  row(i => i + 2, i => Math.floor((i / 3 + 1) % 4)),
  row(i => 12 - i, i => Math.floor((i / 3 + 2) % 4)),
  row(i => 12 - i, i => Math.floor((i / 3 + 3) % 4)),
];
const chaosRows = () => {
  const rows = standardRows();
  const all = rows.reduce((list, x) => list.concat(x), []);
  shuffleArray(all);
  return [
    all.slice(0, 11),
    all.slice(11, 22),
    all.slice(22, 33),
    all.slice(33, 44),
  ];
};
const modes = {
  Standard: standardRows,
  Random: randomRows,
  Rainbow: rainbowRows,
  Chaos: chaosRows,
};

createApp({
  data() {
    return {
      width: 0,
      height: 0,
      cellSize: 10,
      rotate: false,
      rows: standardRows(),
      modes: modes,
      randomSeed: 'qwixx',

      marks: [new Set(), new Set(), new Set(), new Set()],
      locked: [false, false, false, false],
      lives: [false, false, false, false],
      history: [],
      resetOverlay: false,
      modeOverlay: false,
    };
  },

  mounted() {
    window.addEventListener('resize', this.checkWindowSize);
    setInterval(this.checkWindowSize, 200);
    this.checkWindowSize();
    this.loadGame();
  },
  unmounted() {
    window.removeEventListener('resize', this.checkWindowSize);
  },

  methods: {
    mark(row_i, num_i) {
      // avoid marking previous numbers
      if (this.maxMark(row_i) > num_i) return;
      // avoid marking locked rows (except unmarking last number)
      if (this.locked[row_i]) return;
      // avoid marking last number
      if (num_i == 10 && this.marks[row_i].size < 5) return;

      const step = [row_i, num_i];
      if (this.marks[row_i].has(num_i)) {
        this.marks[row_i].delete(num_i);
        this.history = this.history.filter(
          (x) => x[0] != row_i || x[1] != num_i
        );
      } else {
        this.marks[row_i].add(num_i);
        this.history.push(step);
      }
      this.saveGame();
    },

    maxMark(row_i) {
      max = -1;
      this.marks[row_i].forEach((mark) => {
        max = Math.max(max, mark);
      });
      return max;
    },

    lock(row_i) {
      if (this.lastMarked(row_i)) return;
      this.locked[row_i] = !this.locked[row_i];
      this.saveGame();
    },
    isLocked(row_i) {
      return this.locked[row_i] || this.lastMarked(row_i);
    },
    score(row_i) {
      let marks = this.marks[row_i].size;
      if (this.lastMarked(row_i)) {
        marks += 1;
      }
      return (marks * (marks + 1)) / 2;
    },

    lastMarked(row_i) {
      return this.marks[row_i].has(10);
    },

    life(i) {
      this.lives[i] = !this.lives[i];
      this.saveGame();
    },
    livesScore() {
      return this.lives.filter((x) => x).length * -5;
    },

    totalScore() {
      return (
        [0, 1, 2, 3].reduce((s, i) => s + this.score(i), 0) + this.livesScore()
      );
    },

    openOverlay() {
      this.resetOverlay = true;
    },
    closeOverlay() {
      this.resetOverlay = false;
    },
    reset() {
      this.marks = [new Set(), new Set(), new Set(), new Set()];
      this.locked = [false, false, false, false];
      this.lives = [false, false, false, false];
      this.history = [];
      this.resetOverlay = false;
      this.modeOverlay = false;
      this.saveGame();
    },

    openModeOverlay() {
      this.modeOverlay = true;
    },
    closeModeOverlay() {
      this.modeOverlay = false;
    },
    selectMode(mode) {
      let seed = document.getElementById('seed').value
      console.log(seed)
      if (seed != this.randomSeed) {
        this.randomSeed = seed;
        random = randomGenerator(seed);
        console.log('changed generator');
      }

      this.rows = modes[mode]();
      this.reset();
    },

    lastStep() {
      return this.history.slice(-1)[0] || [-1, ''];
    },
    lastNum() {
      const last = this.lastStep();
      if (last[0] == -1) return '';
      return this.rows[last[0]][last[1]][0];
    },
    lastColor() {
      const last = this.lastStep();
      if (last[0] == -1) return '';
      return this.rows[last[0]][last[1]][1];
    },
    undo() {
      const last = this.lastStep();
      if (last[0] == -1) return;
      this.mark(...last);
      this.saveGame();
    },

    saveGame() {
      const game = {
        rows: this.rows,
        marks: this.marks.map((mark) => Array.from(mark)),
        history: this.history,
        locked: this.locked,
        lives: this.lives,
      };
      localStorage.setItem('qwixx_game', JSON.stringify(game));
    },
    loadGame() {
      const save = JSON.parse(localStorage.getItem('qwixx_game'));

      if (save) {
        this.rows = save.rows || standardRows();
        this.marks = save.marks.map((marks) => new Set(marks));
        if (this.marks.every(marked => marked.size == 0)) {
          this.rows = standardRows();
        }
        this.locked = save.locked;
        this.lives = save.lives;
        this.history = save.history;
      }
    },

    checkWindowSize() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // avoid unnecessary calculations
      if (width == this.width && height == this.height) {
        return;
      }
      this.width = width;
      this.height = height;
      this.rotate = width < height;

      const long = Math.max(width, height);
      const short = Math.min(width, height);
      this.cellSize = Math.min((long - 30) / 13 - 6, (short - 20) / 5 - 16);
    },
  },
}).mount('#app');
