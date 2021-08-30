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

	show() {
		const mapped = [' X', ' _', ' O'];
		return this.cells.reduce(
			(str, row) => str += row.reduce(
				(s, cell) => s += mapped[cell + 1], '\n'
			), ''
		).substring(1);
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
			throw new Error(`${row}, ${col} already occupied`);
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

// The exploration parameter in the Upper Confidence Bound (UCB) algorithm.
// Theoretically it equals to √2, but in practice usually chosen empirically.
const EXPLORATION = 1.4142135623730950488016887242097 // √2

// A node in the m.c. tree
class Node {
	constructor(p, r, c, m) {
		this.player = p;
		this.row = r;
		this.col = c;
		this.moves = m;
		this.next = [];
		this.runs = 0;
		this.wins = 0;
	}

	// create root node
	static root(n) {
		if (n < 3 || n > 9) throw new Error(`Unsupported grid size ${n}`);
		const root = new Node(0, -1, -1, n * n);
		root.grid = n;
		root.runs = 1;
		return root;
	}

	show() {
		const mapped = [' X', ' _', ' O'];
		const p = mapped[this.player + 1];
		const r = this.row < 0 ? ' -' : (''+this.row).padStart(2, ' ');
		const c = this.col < 0 ? ' -' : (''+this.col).padStart(2, ' ');
		const m = (''+this.moves).padStart(2, ' ');
		const n = (''+this.runs).padStart(7, ' ');
		const w = (''+this.wins).padStart(7, ' ');
		return `${p}${r}${c}${m}|${w}/${n}`;
	}

	// create new child node
	add(row, col, moves) {
		const p = (this.player === 0) ? -1 : -1 * this.player; // "X" start first
		const node = new Node(p, row, col, moves);
		node.grid = this.grid;
		this.next.push(node);
		node.parent = this;
		return node;
	}

	// calculate ucb value
	ucb() {
		let ni = (this.runs === 0) ? 1 : Math.log(this.runs);

		let max = -1.0;
		const idx0 = [];
		const idx1 = [];
		for (let i = 0; i < this.next.length; i ++) {
			if (this.next[i].runs === 0) {
				idx0.push(i);
			} else {
				const u = this.next[i].wins / this.next[i].runs + EXPLORATION * Math.sqrt(ni / this.next[i].runs);
				if (u > max) {
					max = u;
					idx1.splice(0, idx1.length); // Remove all indices with same old high score, since a new high score is found
					idx1.push(i);
				} else if (u === max) {
					idx1.push(i);
				}
			}
		}

		if (idx0.length > 0) {
			return idx0[Math.floor(Math.random() * idx0.length)];
		}

		if (idx1.length > 0) {
			return idx1[Math.floor(Math.random() * idx1.length)];
		}

		throw new Error('UCB failed');
	}
}

function show(node, lvl) {
	if (!(node instanceof Node)) throw new Error('Invalid input argument type');

	let buff = '';
	let stck;
	let stack = [node];
	let prfx;
	let prfix = [0];
	while (stack.length > 0) {
		stck = stack[0];
		prfx = prfix[0];
		if (lvl < 0 || (prfx + 1) <= lvl) {
			stack = stck.next.concat(stack.slice(1));
			prfix = stck.next.map(_ => prfx + 1).concat(prfix.slice(1));
		} else {
			stack = stack.slice(1);
			prfix = prfix.slice(1);
		}

		buff += `${' '.repeat(prfx).padEnd(9, '─')}${prfx} - ${stck.show()}\n`;
	}
	return buff;
}

// Randomly pick an available move base on the state of the current game
// n - grid size; r - row; c - column:
// cell index = n*r + c
function chooseMove(game, node) {
	if (!(game instanceof Game)) throw new Error('Invalid input argument type for Game');
	if (!(node instanceof Node)) throw new Error('Invalid input argument type for Node');
	if (game.player !== -1 && game.player !== 1) throw new Error('Game not in progress');

	const avil = game.availableMoves();
	const n = avil.length;

	for (const mov of avil) {
		if (node.next.filter(v => v.row === mov.r && v.col === mov.c).length <= 0) {
			mov.m = n - 1;
			return mov;
		}
	}

	throw new Error('No available move left');
}

// Simulate a game from start to finish
function sim(root, grid, run) {
	if (!(root instanceof Node)) throw new Error('Invalid input argument type');
	if (root.player !== 0) throw new Error('Root node required');

	const game = new Game(grid);
	let node = root;
	let conclusion = 0;
	let completed = false;

	while (conclusion === 0) {
		if (!game.nextTurn()) {
			conclusion = 255;
			break;
		}

		let move;
		if (node.next.length <= 0 || node.next.length < node.moves) {
			// leaf node encountered or unvisited move exists, expand the mctree
			move = chooseMove(game, node);
			game.makeMove(move.r, move.c); // call this b4 'noode.add()' to ensure the move is valid (position not yet occupied)
			node = node.add(move.r, move.c, move.m);
			break;
		} else {
			// select a move from the tree
			const idx = node.ucb();
			move = { r: node.next[idx].row, c: node.next[idx].col };
			game.makeMove(move.r, move.c);
			node = node.next[idx];
		}

		conclusion = game.evaluate(move.r, move.c);
	}

	if (conclusion !== 0) completed = true;

	// Simulation until the game conclude
	while (conclusion === 0) {
		if (!game.nextTurn()) {
			conclusion = 255;
			break;
		}

		const moves = game.availableMoves();
		const move = moves[Math.floor(Math.random() * moves.length)];
		game.makeMove(move.r, move.c);
		conclusion = game.evaluate(move.r, move.c);
	}

	// back propagate
	while (node) {
		node.runs ++;
		if (
			(conclusion === -1 && node.player === -1) ||
			(conclusion === 1 && node.player === 1) ||
			(conclusion === 255)
		) node.wins ++;
		node = node.parent;
	}

	if (conclusion === 0) {
		throw new Error('Error, game not finished');
	}

	return { run, completed };
}

function simulate(grid, runs) {
	const tree = Node.root(grid);
	let count = 0;
	for (let i = 0; i < runs; i ++) {
		const { completed } = sim(tree, grid, i);
		if (completed) count ++;
	}
	return {
		tree,
		grid,
		runs,
		newly: runs - count,
	}
}

function init() {
	const runs = 30000;
	const { tree, newly } = simulate(3, runs);

	console.log(runs, newly, runs - newly);
	console.log(show(tree, 1));
}

window.onload = () => init();
