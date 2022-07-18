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
		const eid = `c${row}-${col}`;
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
	const eid = `c${row}-${col}`;
	if (game.cells[row][col] === 0) {
		document.getElementById(eid).textContent = ' ';
		document.getElementById(eid).setAttribute("style", "color:#424242");
	}
}

// make a move and update the HTML
function makeMove(row, col) {
	game.makeMove(row, col);

	const eid = `c${row}-${col}`;
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
		document.getElementById('message').textContent = ' "X" won';
		return true;
	} else if (conclusion > 0) {
		document.getElementById('message').textContent = ' "O" won';
		return true;
	}

	if (!game.nextTurn()) {
		document.getElementById('message').textContent = ' Draw';
		return true;
	}
	return false;
}

// Event handler for clicking a cell
function clicked(row, col) {
	const n = game.grid();
	// idled = 0; // Indicate the user just clicked something, reset the idel timer. // TODO: disabled for the moment
	if (game.player !== 0) { // game.player === 0 if game is not yet started or already finished
		document.getElementById('message').innerHTML = '<div id="message" class="p">&nbsp;</div>';;

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

function newgame() {
	let n = document.getElementById('bsize').value;
	// limit the board size to 3x3 to 9x9
	if (n < 3) {
		n = 3;
		document.getElementById('bsize').value = 3;
	} else if (n > 9) {
		n = 9;
		document.getElementById('bsize').value = 9;
	}

	// Update html
	document.getElementById('message').innerHTML = '<div id="message" class="p">New game started</div>'; // Refrest game message
	document.getElementById('boardcss').innerHTML = `#board {grid-template-columns: repeat(${n}, 70px);}\n#left {width: ${80*n+10}px;}`; // dynamic part of the CSS

	// Initialize the Game Status object
	game = new Game(n);
	game.ai = document.getElementById('pnumb').checked; // pnumb checked means 1 player, unchecked 2 players

	// Initialize the game moves
	moves = [];
	game.steps = [];

	// Build the game board
	let board = document.getElementById('board');
	board.innerHTML = '';
	let r = -1;
	let c;
	for (let i = 0; i < n * n; i ++) {
		if ((i % n) === 0) { // Note the modular operation i % n
			r ++;
			c = 0;
		}

		// Initialize the cell's corresponding value in the Game Status object
		const row = r;
		const col = c;
		const eid = `c${row}-${col}`;

		// Create the cell in the html DOM
		const tmpl = document.createElement('template');
		tmpl.innerHTML = `<div id="${eid}" class="cell">&nbsp;</div>`;
		board.appendChild(tmpl.content.firstChild);

		// Add event handlers to the new cell
		const cell = document.getElementById(eid);
		cell.onclick = (_) => clicked(row, col);
		cell.onmouseenter = (_) => mouseentered(row, col);
		cell.onmouseout = (_) => mouseouted(row, col);

		c ++;
	}

	game.nextTurn(); // start game

	// idled = 0; // TODO: disabled for the moment
	if (game.ai) {
		if (root && n !== root.grid) { // Discard the m.c. tree if the player change the game board size
			// RUNS = TOTRUNS; // TODO: disabled for the moment
			root = undefined;
		}

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

		if (document.getElementById('ai1st').checked) {
			compPlayer(root); // if the AI should move first
		}
	}
}

function init() {
	document.getElementById('new').onclick = () => newgame(); // Add event handler for the 'New game' button
	document.getElementById('bsize').value = 3; // default 3x3 game board
	document.getElementById('pnumb').checked = true; // default to 1 players game
	document.getElementById('ai1st').checked = false; // default to human first
	document.getElementById('ai1st').disabled = false; // default to human first

	document.getElementById('bsize').onchange = () => document.getElementById('message').innerHTML = '<div id="message" class="p">&nbsp;</div>';;

	document.getElementById('ai1st').onchange = () => document.getElementById('message').innerHTML = '<div id="message" class="p">&nbsp;</div>';;

	document.getElementById('pnumb').onchange = () => {
		document.getElementById('message').innerHTML = '<div id="message" class="p">&nbsp;</div>';;
		if (!document.getElementById('pnumb').checked) document.getElementById('ai1st').checked = false;
		document.getElementById('ai1st').disabled = !document.getElementById('pnumb').checked;
	}
}

window.onload = () => init();
