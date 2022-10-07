// Game Status
let game;

// m.c. tree
let root;

// Steps taken in the current game
let moves = [];

// Background simulation runs
// const INTERVAL = 1; // 1 second timer interval
// const IDLE = 2; // 2 seconds
const INITIAL = 500000; // initial simulation runs
const SUBSQNT = 50000; // subsequent simulation runs
// const TOTRUNS = 1000000; // Total number of runs
// let RUNS = TOTRUNS; // total simulation runs
// let idled;
// let thread;

// Event handler for the mouse entering a cell
function mouseentered(row, col) {
	if (game.cells[row][col] === 0) {
		const eid = `tictactoe-${row}-${col}`;
		if (game.player > 0) {
			document.getElementById(eid).textContent = 'O';
		} else {
			document.getElementById(eid).textContent = 'X';
		}
		document.getElementById(eid).setAttribute("style", "color:#a0a0a0");
	}
}

// Event handler for the mouse leaving a cell
function mouseouted(row, col) {
	const eid = `tictactoe-${row}-${col}`;
	if (game.cells[row][col] === 0) {
		document.getElementById(eid).textContent = ' ';
		document.getElementById(eid).setAttribute("style", "color:#424242");
	}
}

// make a move and update the HTML
function makeMove(row, col) {
	game.makeMove(row, col);

	const eid = `tictactoe-${row}-${col}`;
	if (game.player > 0) {
		document.getElementById(eid).textContent = 'O';
	} else {
		document.getElementById(eid).textContent = 'X';
	}
	document.getElementById(eid).setAttribute("style", "color:#424242"); // Make the color of 'O' or 'X' solid as visual clue
}

// check game status and update the HTML
function evaluate(row, col) {
	const conclusion = game.evaluate(row, col);
	if (conclusion < 0) {
		dialogShow(' "X" won', true);
		return true;
	} else if (conclusion > 0) {
		dialogShow(' "O" won', true);
		return true;
	}

	if (!game.nextTurn()) {
		dialogShow(' Draw', true);
		return true;
	}
	return false;
}

// Event handler for clicking a cell
function clicked(row, col) {
	const n = game.grid();
	// idled = 0; // Indicate the user just clicked something, reset the idel timer. // TODO: disabled for the moment
	if (game.player !== 0) { // game.player === 0 if game is not yet started or already finished
		if (game.ai) moves.push({ player: game.player, row, col }); // this is the move just made
		const { index, leaf } = (game.ai) ? track(root, game, (moves.length > 0) ? moves[moves.length - 1] : undefined) : { index: undefined, leaf: undefined };
		if (index && index < 0) {
			// The human player just made an unexplored move
			const avil = game.availableMoves();
			for (let i = 0; i < avil.length; i ++) {
				if (leaf.next.filter(v => v !== undefined && v.row(n) === avil[i].r && v.col(n) === avil[i].c).length <= 0) {
					const { newNode } = leaf.add(n, avil[i].r, avil[i].c, avil.length - 1);
					if (avil[i].r === row && avil[i].c === col) {
						makeMove(avil[i].r, avil[i].c);
						game.steps.push(i);
						const { grid, runs, newly } = contSim(root, game, SUBSQNT);
						// console.log(`Adding ${runs} (${runs - newly}) simulations of ${grid} x ${grid} games`);
						if (!evaluate(avil[i].r, avil[i].c)) {
							if (game.ai) {
								compPlayer(newNode); // AI's turn to move
							}
						}
						break;
					}
				}
			}
		} else {
			// Found the corresponding node of the move the human player just made, normal operation
			makeMove(row, col);
			if (game.ai) game.steps.push(index);
			if (!evaluate(row, col)) {
				if (game.ai) {
					compPlayer(leaf); // AI's turn to move
				}
			}
		}
	}
}

// AI player's turn
function compPlayer(leaf) {
	if (game.player !== 0) {
		const n = game.grid();

		if (leaf.next.filter(t => t !== undefined).length < leaf.next.length) {
			// Unexplored and/or not fully explored node found
			// NOTE: Since no node under leaf, should add a node under leaf (by chooseMove()), afterward then can do sim()
			// NOTE: What about if leaf is partially explored? should expand instead of UCB?
			const move = chooseMove(game, leaf);
			makeMove(move.r, move.c);
			const { index } = leaf.add(n, move.r, move.c, move.m);
			game.steps.push(index);
			const { grid, runs, newly } = contSim(root, game, SUBSQNT);
			if (evaluate(move.r, move.c)) return;
			// console.log(`Adding ${runs} (${runs - newly}) simulations of ${grid} x ${grid} games`);
		} else {
			// Find a fully explored node, normal operation
			const indexNext = leaf.ucb();
			makeMove(leaf.next[indexNext].row(n), leaf.next[indexNext].col(n));
			game.steps.push(indexNext);
			if (evaluate(leaf.next[indexNext].row(n), leaf.next[indexNext].col(n))) return;
			// console.log(`[comp] select: ${leaf.next[indexNext].show(n)}`);
		}
	}
}

function dialogShow(msg, n) {
	document.getElementById('tictactoe-msg').innerHTML = msg; //`<div>${msg}</div>`;
	if (n) {
		document.getElementById('tictactoe-new').style.display = "block";
	} else {
		document.getElementById('tictactoe-new').style.display = "none";
	}
	document.getElementById('tictactoe-dialog').style.display = "block";
}

function dialogHide() {
	document.getElementById('tictactoe-dialog').style.display = "none";
}

// TODO: disabled for the moment
// function worker() {
// 	if (RUNS <= 0) {
// 		clearInterval(thread);
// 		console.log('Timer stopped');
// 		return;
// 	}

// 	if (idled < IDLE) {
// 		idled ++;
// 		// console.log(`${idled} waiting...`);
// 	} else {
// 		if (RUNS > 0) {
// 			console.log(`RUNS: ${RUNS}/${TOTRUNS}`);
// 			idled = 0;
// 			const { grid, runs, newly } = startSim(root, game.grid(), SUBSQNT);
// 			RUNS -= runs;
// 			if (RUNS <= 0) {
// 				console.log(`Ran ${runs} (${runs - newly}) simulations of ${grid} x ${grid} games (RUNS: ${RUNS})`);
// 				console.log(show(root.gird, root, 1));
// 			}
// 		}
// 	}
// }

// /**
//  * Build new game board
//  * @param {Node} board element to contain the game board
//  * @param {boolean} v true to add event handlers
//  * @param {number} n board size
//  */
// function buildBoard(board, v, n) {
// 	board.innerHTML = '';

// 	let r = -1;
// 	let c;
// 	for (let i = 0; i < n * n; i ++) {
// 		if ((i % n) === 0) { // Note the modular operation i % n
// 			r ++;
// 			c = 0;
// 		}

// 		// Initialize the cell's corresponding value in the Game Status object
// 		const row = r;
// 		const col = c;
// 		const eid = `tictactoe-${row}-${col}`;

// 		// Create the cell in the html DOM
// 		const tmpl = document.createElement('template');
// 		tmpl.innerHTML = `<div id="${eid}" class="tictactoe-cell">&nbsp;</div>`;
// 		board.appendChild(tmpl.content.firstChild);

// 		if (v) {
// 			// Add event handlers to the new cell
// 			const cell = document.getElementById(eid);
// 			cell.onclick = (_) => clicked(row, col);
// 			cell.onmouseenter = (_) => mouseentered(row, col);
// 			cell.onmouseout = (_) => mouseouted(row, col);
// 		}

// 		c ++;
// 	}
// }

/**
 * Start a new game
 * @param {number} n board size
 * @param {boolean} p is single player
 * @param {boolean} a AI move first
 */
function newgame(n, p, a) {
	dialogShow('Loading...', false);
	let board = document.getElementById('tictactoe-board');
	if (board === null) {
		console.log(`Game board not found`);
		return;
	}
	buildBoard(board, true, n);

	// Initialize the Game Status object
	game = new Game(n);
	game.ai = p;

	// Initialize the game moves
	moves = [];
	game.steps = [];

	game.nextTurn(); // start game

	// idled = 0; // TODO: disabled for the moment
	if (game.ai) {
		if (root && n !== root.grid) { // Discard the m.c. tree if the player change the game board size
			// RUNS = TOTRUNS; // TODO: disabled for the moment
			root = undefined;
		}

		setTimeout(() => {
			if (!!root) { // If the m.c. tree is not undefined, don't need to do anything
				// console.log(`Simulation ${(RUNS > 0) ? 'running' : 'finished'}: ${RUNS}/${TOTRUNS}`);
			} else { // Otherwise build a new m.c. tree
				const { tree, grid, runs, newly } = startSim(root, n, INITIAL);
				// RUNS -= runs; // TODO: disabled for the moment
				console.log(`Ran ${runs} (${runs - newly}) simulations of ${grid} x ${grid} games`);
				// console.log(show(n, tree, 1));
				root = tree;

				// idled = 1; // TODO: disabled for the moment
				// thread = setInterval(() => worker(), INTERVAL * 1000); // TODO: disabled for the moment
			}

			if (a) {
				compPlayer(root); // if the AI should move first
			}
			dialogHide();
		}, 1);
	} else {
		dialogHide();
	}
}

/**
 * Initialize page
 * @param {string} id element ID to attach the game board
 * @param {number} n board size
 * @param {number} z cell size
 * @param {number} g space size between cells
 * @param {number} f font size (for X and O) inside cells
 */
function init(id, n, z, g, f) {
	// limit the board size to 3x3 to 9x9
	if (n < 3) {
		n = 3;
		// document.getElementById('bsize').value = 3;
	} else if (n > 9) {
		n = 9;
		// document.getElementById('bsize').value = 9;
	}

	let content = document.getElementById(id);
	if (content === null) {
		console.log(`Element '${id}' not found`);
		return;
	}
	content.innerHTML = '';

	let board = document.createElement('div');
	board.setAttribute('id', 'tictactoe-board');
	board.setAttribute('style', `display:grid;gap:${g}px;grid-template-columns:repeat(${n},${z}px);grid-auto-rows:${z}px;padding-top:${(g+10)/2};padding-bottom:${(g+10)/2};margin-left:${(g+10)/2};`);
	buildBoard(board, false, n);

	let dialog = document.createElement('div');
	dialog.setAttribute('id', 'tictactoe-dialog');
	dialog.setAttribute('class', 'tictactoe-dialog');
	dialog.innerHTML = '<div class="tictactoe-dialog-content"><div id="tictactoe-msg">&nbsp;</div><button id="tictactoe-new">New game</button></div>';

	let element = document.createElement('div');
	element.setAttribute('style', `position:relative;width:${(z+g)*n+10}px;font-size:${f}px;`);
	element.appendChild(dialog);
	element.appendChild(board);
	content.appendChild(element);

	dialogShow('Click to start', true);
}

/**
 * Initialize the TicTacToe object
 * @param {string} id element ID to attach the game board
 * @param {number} n board size
 * @param {number} z cell size
 * @param {number} g space size between cells
 * @param {number} f font size (for X and O) inside cells
 */
 class TicTacToe {
	constructor(
		elm,
		n,
		z, g, f
	) {
		if (n < 3 || n > 9) throw 'Supported board size: 3x3 to 9x9';
		this.side = n;

		this.canvas = document.getElementById(elm);
		if (this.canvas === null) throw `Element '${elm}' not found`;
		this.canvas.innerHTML = '';

		this.cell = z;
		this.gap = g;
		this.font = f;
		this.ai = true; // default - single player
		this.first = false; // default - human move first

		this.board = document.createElement('div');
		this.board.setAttribute('id', 'tictactoe-board');
		this.board.setAttribute('style', `display:grid;gap:${g}px;grid-template-columns:repeat(${n},${z}px);grid-auto-rows:${z}px;padding-top:${(g+10)/2};padding-bottom:${(g+10)/2};margin-left:${(g+10)/2};`);
		this.buildBoard(false);

		this.dialog = document.createElement('div');
		this.dialog.setAttribute('id', 'tictactoe-dialog');
		this.dialog.setAttribute('class', 'tictactoe-dialog');
		this.dialog.innerHTML = '<div class="tictactoe-dialog-content"><div id="tictactoe-msg">&nbsp;</div><button id="tictactoe-new">New game</button></div>';

		let element = document.createElement('div');
		element.setAttribute('style', `position:relative;width:${(z+g)*n+10}px;font-size:${f}px;`);
		element.appendChild(this.dialog);
		element.appendChild(this.board);
		this.canvas.appendChild(element);

		this.dialogShow('Click to start', true);
	}

	dialogShow(msg, n) {
		document.getElementById('tictactoe-msg').innerHTML = msg; //`<div>${msg}</div>`;
		if (n) {
			document.getElementById('tictactoe-new').style.display = "block";
		} else {
			document.getElementById('tictactoe-new').style.display = "none";
		}
		this.dialog.style.display = "block";
	}

	dialogHide() {
		this.dialog.style.display = "none";
	}

	/**
	 * Build new game board
	 * @param {boolean} v true to add event handlers
	 */
	buildBoard(v) {
		this.board.innerHTML = '';
	
		let r = -1;
		let c;
		for (let i = 0; i < this.side * this.side; i ++) {
			if ((i % this.side) === 0) { // Note the modular operation i % n
				r ++;
				c = 0;
			}
	
			// Initialize the cell's corresponding value in the Game Status object
			const row = r;
			const col = c;
			const eid = `tictactoe-${row}-${col}`;
	
			// Create the cell in the html DOM
			const tmpl = document.createElement('template');
			tmpl.innerHTML = `<div id="${eid}" class="tictactoe-cell">&nbsp;</div>`;
			this.board.appendChild(tmpl.content.firstChild);
	
			if (v) {
				// Add event handlers to the new cell
				const cell = document.getElementById(eid);
				cell.onclick = (_) => clicked(row, col);
				cell.onmouseenter = (_) => mouseentered(row, col);
				cell.onmouseout = (_) => mouseouted(row, col);
			}
	
			c ++;
		}
	}
}
