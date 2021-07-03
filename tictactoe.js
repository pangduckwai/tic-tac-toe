
// Game Status
// player: indicate which player's turn it is
//  - player == -1 => 'X'
//  - player == +1 => 'O'
// cells: n x n grid with value: 0 (unoccupied), -1 (occupied by 'X'), +1 (occupied by 'O')
// moves: total count
// wins: statistic for all winning conditions (n + n + 2, that is each horizontal and vertical lines plus the 2 diagonals)
//  - 0: forward diagonal, 1: backward diagonal, the rest are horizontals then vertical
const game = {
	player: 0,
	cells: [[0]],
	moves: 0,
	wins: [0],
}

const tree = {
	player: 255,
	row: -1,
	col: -1,
	next: [],
}
let curr;

function evaluate(player, row, col) {
	const n = game.cells.length;

	game.moves ++;
	if (row === col) {
		game.wins[0] += player; // forward diagonal
	}
	if ((row + col + 1) === n) {
		game.wins[1] += player; // backward diagonal
	}
	game.wins[col + 2] += player; // horizontal
	game.wins[row + n + 2] += player; // vertical

	if (game.wins.filter(w => w >= n).length > 0) {
		document.getElementById('message').textContent = ' "O" won';
		game.player = 0;
		return 1;
	} else if (game.wins.filter(w => (-1 * w) >= n).length > 0) {
		document.getElementById('message').textContent = ' "X" won';
		game.player = 0;
		return -1;
	} else if (game.moves >= n * n) {
		document.getElementById('message').textContent = ' Draw';
		game.player = 0;
		return 255; // Draw
	} else {
		return 0;
	}
}

// Event handler for the mouse entering a cell
function mouseentered(row, col, eid) {
	if (game.cells[row][col] === 0) {
		if (game.player > 0) {
			document.getElementById(eid).textContent = 'O';
		} else {
			document.getElementById(eid).textContent = 'X';
		}
		document.getElementById(eid).setAttribute("style", "color:#a0a0a0");
	}
}

// Event handler for the mouse leaving a cell
function mouseouted(row, col, eid) {
	if (game.cells[row][col] === 0) {
		document.getElementById(eid).textContent = ' ';
		document.getElementById(eid).setAttribute("style", "color:#424242");
	}
}

// Event handler for clicking a cell
function clicked(row, col, eid) {
	if (game.player !== 0) { // game.player === 0 if game is not yet started or already finished
		if (game.cells[row][col] === 0) { // cell value === 0 means unoccupied
			// Draw the clicked cell with 'O' or 'X' according to the current turn
			if (game.player > 0) {
				document.getElementById(eid).textContent = 'O';
				game.cells[row][col] = 1;
			} else {
				document.getElementById(eid).textContent = 'X';
				game.cells[row][col] = -1;
			}
			document.getElementById(eid).setAttribute("style", "color:#424242"); // Make the color of 'O' or 'X' solid as visual clue
			const rslt = evaluate(game.player, row, col); // Evaluate if the latest move win or draw the game

			// Build tree
			const node = {
				player: game.player,
				row, col,
				next: [],
			};
			curr.next.push(node);
			curr = node;

			game.player = (game.player === -1) ? 1 : -1; // Next player

			if (rslt === 0) {
				sims(game, tree);
			// } else {
			// 	console.log(tree);
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
	document.getElementById('message').innerHTML = '<div id="message" class="p">&nbsp;</div>'; // Refrest game message
	document.getElementById('boardcss').innerHTML = `#board {grid-template-columns: repeat(${n}, 100px);}`; // Build the dynamic part of the CSS

	// Initialize the Game Status object
	game.player = -1; // "X" start first
	game.moves = 0;
	game.wins = new Array(2 * n + 2);
	for (let i = 0; i < game.wins.length; i ++) {
		game.wins[i] = 0;
	}
	game.cells = new Array(n); // Delay the row and cell initialization to later, since there will be a loop later to build cell anyway

	// Initialize the Tree
	tree.player = 0;
	curr = tree;

	// Build the game board
	let board = document.getElementById('board');
	board.innerHTML = '';
	let r = -1;
	let c;
	for (let i = 0; i < n * n; i ++) {
		if ((i % n) === 0) { // Note the modular operation i % n
			r ++;
			c = 0;
			game.cells[r] = new Array(n); // Delay the row initialization to here
		}

		// Initialize the cell's corresponding value in the Game Status object
		game.cells[r][c] = 0; // Delay the cell initialization to here
		const row = r;
		const col = c;
		const eid = `c${row}-${col}`;

		// Create the cell in the html DOM
		let tmpl = document.createElement('template');
		tmpl.innerHTML = `<div id="${eid}" class="cell">&nbsp;</div>`;
		board.appendChild(tmpl.content.firstChild);

		// Add event handlers to the new cell
		let cell = document.getElementById(eid);
		cell.onclick = (_) => clicked(row, col, eid);
		cell.onmouseenter = (_) => mouseentered(row, col, eid);
		cell.onmouseout = (_) => mouseouted(row, col, eid);

		c ++;
	}
}

function init() {
	document.getElementById('bsize').value = 3; // default 3x3 game board
	document.getElementById('bsize').onchange = (_) => newgame(); // Add event handler when the game board size changed
	document.getElementById('new').onclick = (_) => newgame(); // Add event handler for the 'New game' button
	newgame();
}

window.onload = (_) => {
	init();
};
