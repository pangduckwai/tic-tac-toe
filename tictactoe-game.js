// Game Status
// player: indicate which player's turn it is
//  - player == -1 => 'X'
//  - player == +1 => 'O'
// cells: n x n grid with value: 0 (unoccupied), -1 (occupied by 'X'), +1 (occupied by 'O')
// wins: statistic for all winning conditions (n + n + 2, that is each horizontal and vertical lines plus the 2 diagonals)
//  - 0: forward diagonal, 1: backward diagonal, the rest are horizontals then vertical
class Game {
	constructor(n) {
		if (n < 3 || n > 9) throw new Error(`Unsupported game board size ${n}`);

		this.player = 0; // 0 means game not started
		this.ai = undefined; // Single player game

		// Steps taken so far in the game (in relation with the accompanying m.c. tree if exists).
		// Only used in interactive games, not in simulations
		this.steps = undefined;

		this.wins = new Array(2 * n + 2);
		for (let i = 0; i < this.wins.length; i ++) {
			this.wins[i] = 0;
		}

		this.cells = new Array(n);
		for (let i = 0; i < n; i ++) {
			this.cells[i] = new Array(n);
			for (let j = 0; j < n; j ++) {
				this.cells[i][j] = 0;
			}
		}
	}

	// Clone a game
	clone() {
		const n = this.grid();
		const g = new Game(n);
		g.player = this.player;
		g.ai = this.ai;

		g.steps = undefined;
		if (this.steps) {
			g.steps = [];
			for (const s of this.steps) {
				g.steps.push(s);
			}
		}

		g.wins = new Array(2 * n + 2);
		for (let i = 0; i < this.wins.length; i ++) {
			g.wins[i] = this.wins[i];
		}

		g.cells = new Array(n);
		for (let i = 0; i < n; i ++) {
			g.cells[i] = new Array(n);
			for (let j = 0; j < n; j ++) {
				g.cells[i][j] = this.cells[i][j];
			}
		}

		return g;
	}

	grid() {
		return this.cells.length;
	}

	show() {
		return this.cells.reduce(
			(str, row) => str += row.reduce(
				(s, cell) => s += [' X', ' _', ' O'][cell + 1], '\n'
			), ''
		).substring(1) + [' :X', ' :_', ' :O'][this.player + 1];
	}

	// Start a game if its not yet started, otherwise advance to the turn of the next player
	nextTurn() {
		const next = (this.cells.filter(r => (r.filter(c => c === 0).length > 0)).length > 0);
		if (this.player === 0) {
			this.player = -1; // Start game, "X" start first
			return next;
		} else if (this.player === -1 || this.player === 1) {
			this.player *= -1;
			if (!next) this.player = 0; // end game
			return next;
		} else {
			throw new Error(`Invalid game state ${this.player}`);
		}
	}

	// Make a move at the given location if the location is not yet occupied
	makeMove(row, col) {
		if (this.player !== -1 && this.player !== 1) throw new Error('Game not in progress');
	
		if (this.cells[row][col] !== 0) {
			throw new Error(`[${row}, ${col}] already occupied`);
		} else {
			this.cells[row][col] = this.player;
		}
	}

	// Check if someone win the game, should be called after makeMove(), and before nextTurn()
	evaluate(row, col) {
		if (this.player !== -1 && this.player !== 1) throw new Error('Game not in progress');

		const n = this.cells.length;
		const m = -1 * n;

		if (row === col) {
			this.wins[0] += this.player; // forward diagonal
		}
		if ((row + col + 1) === n) {
			this.wins[1] += this.player; // backward diagonal
		}
		this.wins[col + 2] += this.player; // horizontal
		this.wins[row + n + 2] += this.player; // vertical

		if (this.wins.filter(w => w >= n).length > 0) {
			this.player = 0; // end game
			return 1; // 'O' won
		} else if (this.wins.filter(w => w <= m).length > 0) {
			this.player = 0; // end game
			return -1; // 'X' won
		} else {
			return 0; // Continue
		}
	}

	availableMoves() {
		return this.cells.reduce(
			(v1, c1, r) => {
				if (c1.length > 0) v1.push(
					...c1.reduce(
						(v2, c2, c) => {
							if (c2 === 0) v2.push({ r, c });
							return v2;
						}, []
					)
				);
				return v1;
			}, []
		);
	}
}
