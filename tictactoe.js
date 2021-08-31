// Game Status
let game;

// Steps taken in the current game
let moves = [];
let steps = [];

// m.c. tree
let root;

// Background simulation runs
const INTERVAL = 1; // 1 second timer interval
const IDLE = 2; // 2 seconds
const INITIAL = 50000; // initial simulation runs
const SUBSQNT = 10000; // subsequent simulation runs
const TOTRUNS = 1000000;
let RUNS = TOTRUNS; // total simulation runs
let idled;
let thread;

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

// make a move
function makeMove(row, col) {
	try {
		game.makeMove(row, col);

		const eid = `c${row}-${col}`;
		if (game.player > 0) {
			document.getElementById(eid).textContent = 'O';
		} else {
			document.getElementById(eid).textContent = 'X';
		}
		document.getElementById(eid).setAttribute("style", "color:#424242"); // Make the color of 'O' or 'X' solid as visual clue

		const conclusion = game.evaluate(row, col);
		if (conclusion < 0) {
			document.getElementById('message').textContent = ' "X" won';
			return true;
		} else if (conclusion > 0) {
			document.getElementById('message').textContent = ' "O" won';
			return true;
		}

		if (game.single) {
			moves.push({ player: game.player, row, col }); // this is the move just made
		}

		if (!game.nextTurn()) {
			document.getElementById('message').textContent = ' Draw';
		}

		return true;
	} catch (error) {
		const msg = `${error}`;
		if (!msg.includes('already occupied')) {
			console.log(msg);
		}
	}

	return false;
}

// Event handler for clicking a cell
function clicked(row, col) {
	idled = 0;
	if (game.player !== 0) { // game.player === 0 if game is not yet started or already finished
		document.getElementById('message').innerHTML = '<div id="message" class="p">&nbsp;</div>';;

		try {
			if (makeMove(row, col)) {
				if (game.single) {
					compPlayer(); // AI's turn to move
				}
			}
		} catch (error) {
			const msg = `${error}`;
			if (!msg.includes('already occupied')) {
				console.log(msg);
			}
		}
	}
}

// AI player's turn
function compPlayer() {
	if (game.player !== 0) {
		const { index, indexNext, leaf } = track(root, steps, (moves.length > 0) ? moves[moves.length - 1] : undefined);
		const n = root.grid;

		if (index !== undefined && index < 0) {
			// TODO TEMP: should start a simulation from the current node
			throw new Error(`Unexplored move ${JSON.stringify(moves[moves.length - 1])} on:\n${show(n, leaf, 2)}`);
		} else if (indexNext < 0) {
			// TODO TEMP: should start a simulation from the current node
			throw new Error(`No move available on:\n${show(n, leaf, 1)}`);
		} else {
			if (index !== undefined) steps.push(index);
			steps.push(indexNext);
			if (makeMove(leaf.row(n), leaf.col(n))) {
				console.log(`[leaf] SELECT: ${leaf.show(n)}`);
			}
		}
	}
}

function idle() {
	if (RUNS <= 0) {
		clearInterval(thread);
		console.log('Timer stopped');
		return;
	}

	if (idled < IDLE) {
		idled ++;
		// console.log(`${idled} waiting...`);
	} else {
		if (RUNS > 0) {
			console.log(`RUNS: ${RUNS}/${TOTRUNS}`);
			idled = 0;
			const { grid, runs, newly } = simulate(root.grid, SUBSQNT, root);
			RUNS -= runs;
			if (RUNS <= 0) {
				console.log(`Ran ${runs} (${runs - newly}) simulations of ${grid} x ${grid} games (RUNS: ${RUNS})`);
				console.log(show(root.gird, root, 1));
			}
		}
	}
}

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
	game['single'] = document.getElementById('pnumb').checked; // pnumb checked means 1 player, unchecked 2 players

	// Initialize the game moves
	moves = [];
	steps = [];

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

	idled = 0;
	if (game.single) {
		if (root && n !== root.grid) {
			RUNS = TOTRUNS;
			root = undefined;
		}
		if (!!root) {
			if (RUNS > 0)
				console.log(`Simulation running: ${RUNS}/${TOTRUNS}`);
			else
				console.log(`Simulation finished: ${RUNS}/${TOTRUNS}`);
		} else {
			const { tree, grid, runs, newly } = simulate(n, INITIAL, root);
			RUNS -= runs;
			console.log(`Ran ${runs} (${runs - newly}) simulations of ${grid} x ${grid} games`);
			console.log(show(n, tree, 1));
			root = tree;

			idled = 1;
			thread = setInterval(() => idle(), INTERVAL * 1000);
		}

		if (document.getElementById('ai1st').checked) {
			compPlayer();
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
