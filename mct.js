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

	toString() {
		const mapped = [' X', ' _', ' O'];
		return this.cells.reduce(
			(str, row) => str += row.reduce(
				(s, cell) => s += mapped[cell + 1], '\n'
			), ''
		).substring(1);
	}
}

function endGame(g) {
	if (!(g instanceof Game)) throw new Error('Invalid input argument');
	if (g.player !== -1 && g.player !== 1) throw new Error('Game not in progress');
	g.player = 0;
}

function makeMove(g, row, col) {
	if (!(g instanceof Game)) throw new Error('Invalid input argument');
	if (g.player !== -1 && g.player !== 1) throw new Error('Game not in progress');

	if (g.cells[row][col] !== 0) {
		throw new Error(`${row}, ${col} already occupied`);
	} else {
		g.cells[row][col] = g.player;
	}
}

function nextTurn(g) {
	if (!(g instanceof Game)) throw new Error('Invalid input argument');

	const next = (g.cells.filter(r => (r.filter(c => c === 0).length > 0)).length > 0);
	if (g.player === 0) {
		g.player = -1; // "X" start first
		return next;
	} else if (g.player === -1 || g.player === 1) {
		g.player *= -1;
		return next;
	} else {
		throw new Error(`Invalid game state ${g.player}`);
	}
}

// Should be called after makeMove(), and before nextTurn(), will NOT update the game object other than the 'wins' array
function evaluate(g, row, col) {
	if (!(g instanceof Game)) throw new Error('Invalid input argument');
	if (g.player !== -1 && g.player !== 1) throw new Error('Game not in progress');

	const n = g.cells.length;
	const m = -1 * n;

	if (row === col) {
		g.wins[0] += g.player; // forward diagonal
	}
	if ((row + col + 1) === n) {
		g.wins[1] += g.player; // backward diagonal
	}
	g.wins[col + 2] += g.player; // horizontal
	g.wins[row + n + 2] += g.player; // vertical

	if (g.wins.filter(w => w >= n).length > 0) {
		return 1; // 'O' won
	} else if (g.wins.filter(w => w <= m).length > 0) {
		return -1; // 'X' won
	} else {
		return 0; // Continue
	}
}

/* n*n (r,c) => n*r + c
 0  1  2  3
 4  5  6  7
 8  9 10 11
12 13 14 15
*/
function nextMove(g) {
	if (!(g instanceof Game)) throw new Error('Invalid input argument');
	if (g.player !== -1 && g.player !== 1) throw new Error('Game not in progress');

	const m = g.cells.reduce(
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

	const n = m.length;
	if (n > 0) {
		return m[Math.floor(Math.random() * n)];
	} else {
		return undefined;
	}
}



/*
const mctree = {
	player: 0,
	row: -1,
	col: -1,
	next: [],
	wins: 0,
	runs: 1,
};
*/
class Node {
	constructor(p, r, c) {
		if (!p) {
			this.player = 0; // root node not associate with any player
		} else {
			if (p !== -1 && p !== 1) throw new Error(`Invalid player ${p}`);
			this.player = p;
		}
		this.row = r || -1;
		this.col = c || -1;
		this.next = [];
		this.runs = (r && c) ? 0 : 1;
		this.wins = 0;
	}
}




// let midx = 0;
// const rows = [1,0,2,0,0,2,1,1,2];
// const cols = [1,0,0,2,1,1,2,0,2];
// const rows = [1,0,2,0,0,2,1,1,2];
// const cols = [1,1,0,2,0,2,0,2,1];

function simulation() {
	const g = new Game(3);
	let conclusion = 0;

	while (conclusion === 0 && nextTurn(g)) {
		const move = nextMove(g);
		makeMove(g, move.r, move.c);
		conclusion = evaluate(g, move.r, move.c);
		console.log(conclusion);
		console.log(g.toString());
	}

	if (conclusion < 0) {
		console.log('"X" won !!!');
	} else if (conclusion > 0) {
		console.log('"O" won !!!');
	} else {
		console.log('Draw !!!');
	}
	console.log(g.toString());
}

function init() {
	simulation();
}

window.onload = () => init();
