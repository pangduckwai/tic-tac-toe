
const mctree = {
	player: 0,
	row: -1,
	col: -1,
	next: [],
	wins: 0,
	runs: 1,
};

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
		game.player = 0;
		return 1;
	} else if (game.wins.filter(w => (-1 * w) >= n).length > 0) {
		game.player = 0;
		return -1;
	} else if (game.moves >= n * n) {
		game.player = 0;
		return 255; // Draw
	} else {
		return 0;
	}
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

function compPlayer(game, moves) {
	// console.log(`[mov0] player: ${moves[moves.length - 1].player} -> row: ${moves[moves.length - 1].row} | col: ${moves[moves.length - 1].col}`);

	// Find in the mctree the current game status
	const { leaf, found } = track(game, moves);
	// console.log(`[mc-t] player: ${leaf.player} -> row: ${leaf.row} | col: ${leaf.col} | next: ${leaf.next.length} ${found ? 'Found' : 'Expanded'}`);

	if (found) {
		if (leaf.next.length > 0) {
			// Player made an existing move with child nodes, use UCT to find the next move
			const { player, row, col } = leaf.next[1]; // TODO TEMP!!! for now choose the 2nd one
			const { moved, result } = makeMove(player, game.cells, row, col);
			if (moved) {
				if (result === 0) {
					moves.push({ player, row, col }); // this is the move the comp player just made
					console.log(`[com0] player: ${moves[moves.length - 1].player} -> row: ${moves[moves.length - 1].row} | col: ${moves[moves.length - 1].col}`);
				}
			} else {// selecting an occupied node possible?
				console.log(`[${row}, ${col}] already occupied`); // TODO TEMP
			}
		} else {
			// Player made an existing move which is a leaf node
			// TODO HERE!!!
			console.log('hahaha', leaf);
		}
	} else {
		// Player made an unexplored move, perform a playout from this move
		const player = (game.player === -1) ? 1 : -1;
		const { row, col } = nextMove(game);
		const { moved, result } = makeMove(player, game.cells, row, col);
		if (moved) {
			if (result === 0) {
				moves.push({ player, row, col }); // this is the move the comp player just made
				console.log(`[com1] player: ${moves[moves.length - 1].player} -> row: ${moves[moves.length - 1].row} | col: ${moves[moves.length - 1].col}`);

				expand(player, game.cells, moves[moves.length - 1], leaf);
				console.log(mctree);
			}
		} else {// nextMove selecting an occupied cell possible?
			console.log(`[${row}, ${col}] already occupied`); // TODO TEMP
		}
	}
}
