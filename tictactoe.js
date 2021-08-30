// Game Status
let game;

// Steps taken in the current game
let moves = [];

// m.c. tree
let root;

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
			return;
		} else if (conclusion > 0) {
			document.getElementById('message').textContent = ' "O" won';
			return;
		}

		if (game.single) {
			moves.push({ player: game.player, row, col }); // this is the move just made
		}

		if (!game.nextTurn()) {
			document.getElementById('message').textContent = ' Draw';
			return;
		}
	} catch (error) {
		const msg = `${error}`;
		if (!msg.includes('already occupied')) {
			console.log(msg);
		}
	}
}

// Event handler for clicking a cell
function clicked(row, col) {
	if (game.player !== 0) { // game.player === 0 if game is not yet started or already finished
		document.getElementById('message').innerHTML = '<div id="message" class="p">&nbsp;</div>';;

		try {
			makeMove(row, col);
			if (game.single) {
				compPlayer(); // AI's turn to move
			}
		} catch (error) {
			const msg = `${error}`;
			if (!msg.includes('already occupied')) {
				console.log(msg);
			}
		}
	}
}

function compPlayer() {
	if (game.player !== 0) {
		const { leaf, found } = track(root, moves);
		// console.log(found, leaf.next.length, leaf.show());
		if (found && leaf.next.length > 0) {
			// select the next move
			const idx = leaf.ucb();
			makeMove(leaf.next[idx].row, leaf.next[idx].col);
			console.log(`[leaf] SELECT: ${leaf.next[idx].show()}`);
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
	document.getElementById('boardcss').innerHTML = `#board {grid-template-columns: repeat(${n}, 100px);}\n#left {width: ${110*n+10}px;}`; // dynamic part of the CSS

	// Initialize the Game Status object
	game = new Game(n);
	game['single'] = document.getElementById('pnumb').checked; // pnumb checked means 1 player, unchecked 2 players

	// Initialize the game moves
	moves = [{ player: 0, row: -1, col: -1 }];

	if (game.single) {
		const { tree, grid, runs, newly } = simulate(n, 100000);
		console.log(`Ran ${runs} (${runs - newly}) simulations of a ${grid} x ${grid} game`);
		console.log(show(tree, 1));
		root = tree;
	}

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
