
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

// Steps taken in the current game
const moves = [];

// function evaluate(player, row, col) {
// 	const n = game.cells.length;

// 	game.moves ++;
// 	if (row === col) {
// 		game.wins[0] += player; // forward diagonal
// 	}
// 	if ((row + col + 1) === n) {
// 		game.wins[1] += player; // backward diagonal
// 	}
// 	game.wins[col + 2] += player; // horizontal
// 	game.wins[row + n + 2] += player; // vertical

// 	if (game.wins.filter(w => w >= n).length > 0) {
// 		document.getElementById('message').textContent = ' "O" won';
// 		game.player = 0;
// 		return 1;
// 	} else if (game.wins.filter(w => (-1 * w) >= n).length > 0) {
// 		document.getElementById('message').textContent = ' "X" won';
// 		game.player = 0;
// 		return -1;
// 	} else if (game.moves >= n * n) {
// 		document.getElementById('message').textContent = ' Draw';
// 		game.player = 0;
// 		return 255; // Draw
// 	} else {
// 		return 0;
// 	}
// }

// Alternate evaluate function:
/*
// 偵測遊戲結果，返回：0 - 遊戲繼續; -1 - 'X'勝; 1 - 'O'勝; 255 - 打和
function evaluate() {
	let val1, val2;
	let empty = 0;

	// 橫直
	for (let i = 0; i < 3; i ++) {
		val1 = 0; // 橫
		val2 = 0; // 直
		for (let j = 0; j < 3; j ++) {
			val1 += cells[i][j];
			val2 += cells[j][i];
			if (cells[i][j] === 0) {
				empty ++;
			}
		}
		if ((val1 === -3) || (val2 === -3)) {
			return -1;
		} else if ((val1 === 3) || (val2 === 3)) {
			return 1;
		}
	}

	val1 = 0;
	val2 = 0;
	// 斜
	for (let i = 0; i < 3; i ++) {
		val1 += cells[i][i];
		val2 += cells[2 - i][i];
	}
	if ((val1 === -3) || (val2 === -3)) {
		return -1;
	} else if ((val1 === 3) || (val2 === 3)) {
		return 1;
	}

	// 為什麼最後才檢查打和？
	if (empty <= 0) {
		return 255;
	}

	return 0;
}
*/

// Draw the clicked cell with 'O' or 'X' according to the current turn
function makeMove(player, cells, row, col) {
	if (cells[row][col] !== 0) {
		return { moved: false, result: 0 }; // cell (row,col) already occupied
	}

	const eid = `c${row}-${col}`;
	if (player > 0) {
		document.getElementById(eid).textContent = 'O';
		cells[row][col] = 1;
	} else {
		document.getElementById(eid).textContent = 'X';
		cells[row][col] = -1;
	}
	document.getElementById(eid).setAttribute("style", "color:#424242"); // Make the color of 'O' or 'X' solid as visual clue

	switch (evaluate(player, row, col)) {
		case -1:
			document.getElementById('message').textContent = ' "X" won';
			return { moved: true, result: -1 };
		case 1:
			document.getElementById('message').textContent = ' "O" won';
			return { moved: true, result: 1 };
		case 255:
			document.getElementById('message').textContent = ' Draw';
			return { moved: true, result: 255 };
		default:
			return { moved: true, result: 0 };
	};
}

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

// Event handler for clicking a cell
function clicked(row, col, single) {
	if (game.player !== 0) { // game.player === 0 if game is not yet started or already finished
		document.getElementById('message').innerHTML = '<div id="message" class="p">&nbsp;</div>';;
		const { moved, result } = makeMove(game.player, game.cells, row, col);
		if (moved) {
			if (result === 0) { // game not yet concluded
				if (single) {
					moves.push({ player: game.player, row, col }); // this is the move the player just made
					compPlayer(game, moves);
				} else {
					game.player = (game.player === -1) ? 1 : -1; // Next player
				}
			}
		} else {
			console.log(`[${row}, ${col}] already occupied`); // TODO TEMP
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

	const p = document.getElementById('pnumb').checked; // pnumb checked means 1 player, unchecked 2 players

	// Update html
	document.getElementById('message').innerHTML = '<div id="message" class="p">New game started</div>'; // Refrest game message
	document.getElementById('boardcss').innerHTML = `#board {grid-template-columns: repeat(${n}, 100px);}\n#left {width: ${110*n+10}px;}`; // dynamic part of the CSS

	// Initialize the Game Status object
	game.player = -1; // "X" start first
	game.moves = 0;
	game.wins = new Array(2 * n + 2);
	for (let i = 0; i < game.wins.length; i ++) {
		game.wins[i] = 0;
	}
	game.cells = new Array(n); // Delay the row and cell initialization to later, since there will be a loop later to build cell anyway

	// Initialize the game moves
	moves.splice(0, moves.length);
	moves.push({ player: 0, row: -1, col: -1 });

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
		cell.onclick = (_) => clicked(row, col, p);
		cell.onmouseenter = (_) => mouseentered(row, col);
		cell.onmouseout = (_) => mouseouted(row, col);

		c ++;
	}
}

function init() {
	document.getElementById('new').onclick = (_) => newgame(); // Add event handler for the 'New game' button
	document.getElementById('bsize').value = 3; // default 3x3 game board
	document.getElementById('pnumb').checked = false; // default to 2 players game
	document.getElementById('ai1st').checked = false; // default to 2 players game
	document.getElementById('ai1st').disabled = true; // default to 2 players game

	document.getElementById('bsize').onchange = (_) => document.getElementById('message').innerHTML = '<div id="message" class="p">&nbsp;</div>';;

	document.getElementById('ai1st').onchange = (_) => document.getElementById('message').innerHTML = '<div id="message" class="p">&nbsp;</div>';;

	document.getElementById('pnumb').onchange = (_) => {
		document.getElementById('message').innerHTML = '<div id="message" class="p">&nbsp;</div>';;
		if (!document.getElementById('pnumb').checked) document.getElementById('ai1st').checked = false;
		document.getElementById('ai1st').disabled = !document.getElementById('pnumb').checked;
	}

	newgame();
}

window.onload = (_) => {
	init();
};
