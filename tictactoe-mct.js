
const mctree = {
	player: 0,
	row: -1,
	col: -1,
	next: [], //NOTE this is real
	// next: [{ player: -1, row: 1, col: 1, next: [
	// 	{ player: 1, row: 0, col: 0, next: [] },
	// 	{ player: 1, row: 2, col: 0, next: [] },
	// 	{ player: 1, row: 0, col: 2, next: [] },
	// 	{ player: 1, row: 2, col: 2, next: [] },
	// ]}],
	wins: 0,
	runs: 1,
};

function compPlayer(game, moves, r, c) {
	// this is the move the player just made
	moves.push({ player: game.player, row: r, col: c });
	// console.log(`[mov0] player: ${moves[moves.length - 1].player} -> row: ${moves[moves.length - 1].row} | col: ${moves[moves.length - 1].col}`);

	// Find in the mctree the current game status
	const { leaf, found } = track(game, moves);
	// console.log(`[mc-t] player: ${leaf.player} -> row: ${leaf.row} | col: ${leaf.col} | next: ${leaf.next.length} ${found ? 'Found' : 'Expanded'}`);

	if (found) {
		console.log('[haha]', leaf);
		return 255; // TODO
	} else {
		// When even player's move not found, subsequent moves are all new
		const { row, col } = nextMove(game);
		const eid = `c${row}-${col}`;
		if (game.cells[row][col] === 0) { // nextMove selecting an occuplied node possible?
			if (makeMove((game.player === -1) ? 1 : -1, game.cells, row, col) === 0) {
				// this is the move the comp player just made
				moves.push({ player: (game.player === -1) ? 1 : -1, row, col });
				console.log(`[auto] player: ${moves[moves.length - 1].player} -> row: ${moves[moves.length - 1].row} | col: ${moves[moves.length - 1].col}`);

				expand((game.player === -1) ? 1 : -1, game.cells, moves[moves.length - 1], leaf);
				console.log(mctree);

				return 0; // Game not yet conclude
			}
		}
		return 255;
	}
}

// find in the mctree the current game status
// game - current game status
// move - moves taken in the current game so far
function track(game, moves) {
	let lf = mctree;
	let found = false;
  for (let i = 1; i < moves.length; i ++) {
		console.log(`[move] player: ${moves[i].player} -> row: ${moves[i].row} | col: ${moves[i].col}`);

		found = false
		for (let j = 0; j < lf.next.length; j ++) {
			if (moves[i].player === lf.next[j].player && moves[i].row === lf.next[j].row && moves[i].col === lf.next[j].col) {
				// Found move in mctree
				found = true;
				lf = lf.next[j];
				console.log(`[mc-t] player: ${lf.player} -> row: ${lf.row} | col: ${lf.col} | next: ${lf.next.length} FOUND`);
				break;
			}
		}

		// Only the latest move in the current game should get a not found, since will add all possible moves in previous runs
		// Therefore should be error if not found here but not last item in 'moves'
		if (!found) {
			if (i != moves.length - 1) console.log('ERROR!!!!!');
			break;
		}
	}

	if (found) {
		// human player made an existing move, choose a response from the mctree or explore a new one
		return { leaf: lf, found };
	} else {
		// human player made a move not yet explored
		return { leaf: expand(game.player, game.cells, moves[moves.length - 1], lf), found }; // TODO: need to simulate games till conclusion from the leaf node
	}
}

// Draw the clicked cell with 'O' or 'X' according to the current turn
function makeMove(player, cells, row, col) {
	const eid = `c${row}-${col}`;
	if (player > 0) {
		document.getElementById(eid).textContent = 'O';
		cells[row][col] = 1;
	} else {
		document.getElementById(eid).textContent = 'X';
		cells[row][col] = -1;
	}
	document.getElementById(eid).setAttribute("style", "color:#424242"); // Make the color of 'O' or 'X' solid as visual clue
	return evaluate(player, row, col);
}

function expand(player, cells, move, leaf) {
	// Add the new node to the mctree
	const node = {
		player,
		row: move.row,
		col: move.col,
		wins: 0, runs: 0,
		next: [],
	};
	leaf.next.push(node);

	// Add the other nodes for all the possible moves
	for (let row = 0; row < cells.length; row ++) {
		for (let col = 0; col < cells[row].length; col ++) {
			if (cells[row][col] === 0) {
				leaf.next.push({
					player,
					row, col,
					wins: 0, runs: 0,
					next: [],
				});
			}
		}
	}

	return node;
}

let temp = 0;
function nextMove(game) {
	// TODO: mock implementation!!!
	return [
		{row: 0, col: 0},
		{row: 2, col: 0},
		{row: 1, col: 2},
		{row: 2, col: 1},
	][temp ++];
}
