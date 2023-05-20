const { createApp } = Vue;

createApp({
  data() {
    return {
      width: 0,
      height: 0,
      cellSize: 10,
      rotate: false,
      rows: [
        Array.from({ length: 11 }, (_, i) => i + 2),
        Array.from({ length: 11 }, (_, i) => i + 2),
        Array.from({ length: 11 }, (_, i) => 12 - i),
        Array.from({ length: 11 }, (_, i) => 12 - i),
      ],

      marks: [new Set(), new Set(), new Set(), new Set()],
      locked: [false, false, false, false],
      lives: [false, false, false, false],
      history: [],
      overlay: false,
    };
  },

  mounted() {
    window.addEventListener('resize', this.checkWindowSize);
    setInterval(this.checkWindowSize, 200);
    this.checkWindowSize();
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

      const num = this.rows[row_i][num_i];
      const step = [row_i, num_i];
      if (this.marks[row_i].has(num)) {
        this.marks[row_i].delete(num);
        this.history = this.history.filter(x => x[0] != row_i || x[1] != num_i);
      } else {
        this.marks[row_i].add(num);
        this.history.push(step);
      }
    },

    maxMark(row_i) {
      max = -1;
      this.marks[row_i].forEach((mark) => {
        max = Math.max(max, this.rows[row_i].indexOf(mark));
      });
      return max;
    },

    lock(row_i) {
      if (this.lastMarked(row_i)) return;
      this.locked[row_i] = !this.locked[row_i];
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

    last(row_i) {
      return this.rows[row_i].slice(-1)[0];
    },
    lastMarked(row_i) {
      return this.marks[row_i].has(this.last(row_i));
    },

    life(i) {
      this.lives[i] = !this.lives[i];
    },
    livesScore() {
      return this.lives.filter((x) => x).length * -5;
    },

    totalScore() {
      return [0, 1, 2, 3].reduce((s, i) => s + this.score(i), 0) + this.livesScore();
    },

    openOverlay() {
      this.overlay = true;
    },
    closeOverlay() {
      this.overlay = false;
    },
    reset() {
      this.marks = [new Set(), new Set(), new Set(), new Set()];
      this.locked = [false, false, false, false];
      this.lives = [false, false, false, false];
      this.history = [];
      this.overlay = false;
    },

    lastStep() {
      return this.history.slice(-1)[0] || [-1, ''];
    },
    lastNum() {
      const last = this.lastStep();
      if (last[0] == -1) return '';
      return this.rows[last[0]][last[1]]
    },
    undo() {
      const last = this.lastStep();
      if (last[0] == -1) return;
      this.mark(...last);
    },

    checkWindowSize() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // avoid unnecessary calculations
      if (width == this.width && height == this.height) {
        return
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