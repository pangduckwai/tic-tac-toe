
const stats = {
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

function compPlayer(game, tree, r, c) {
	// Build tree
	const node = {
		player: game.player,
		row: r, col: c,
		next: [],
	};
	curr.next.push(node);
	curr = node;

	// Find in the mctree (stats) the current game status
	const { leaf, found } = track(game, tree);
	console.log('>======================================<');
	console.log(`player: ${leaf.player} -> row: ${leaf.row} | col: ${leaf.col} | next: ${leaf.next.length} ${found ? 'Found' : 'Expanded'}`);

	const { row, col } = nextMove(game);
	const eid = `c${row}-${col}`;
	if (game.cells[row][col] === 0) { // nextMove selecting an occuplied node possible?
		if (makeMove((game.player === -1) ? 1 : -1, game.cells, row, col) === 0) {
			return 0; // Game not yet conclude
		}
	}
	return 255;
}

// find in the mctree (stats) the current game status
// game - current game status
// move - moves taken in the current game so far
function track(game, tree) {
	let mv = tree;
	let st = stats;
	let found = false;
  while (mv.next.length > 0) {
		mv = mv.next[0];

		found = false
		for (let idx = 0; idx < st.next.length; idx ++) {
			if (mv.player === st.next[idx].player && mv.row === st.next[idx].row && mv.col === st.next[idx].col) {
				// Found move in stats
				found = true;
				st = st.next[idx];
				break;
			}
		}

		if (!found) break; // should be the latest move in the current game, but break here anyway...
	}

	if (found) {
		// human player made an existing move, choose a response from the mctree or explore a new one
		// console.log(`player: ${st.player} -> row: ${st.row} | col: ${st.col} | next: ${st.next.length} FOUND`);
		return { leaf: st, found };
	} else {
		// human player made a move not yet explored
		// console.log(`player: ${mv.player} -> row: ${mv.row} | col: ${mv.col} | next: ${mv.next.length} NOT FOUND!!!`);
		return { leaf: expand(game, mv, st), found }; // TODO: need to simulate games till conclusion from the leaf node
	}
}

function expand(game, move, stat) {
	// Add the new node to the tree
	const node = {
		player: game.player,
		row: move.row,
		col: move.col,
		wins: 0, runs: 0,
		next: [],
	};
	stat.next.push(node);

	// Add the other nodes for all the possible moves
	for (let row = 0; row < game.cells.length; row ++) {
		for (let col = 0; col < game.cells[row].length; col ++) {
			if (game.cells[row][col] === 0) {
				stat.next.push({
					player: game.player,
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
		{row: 2, col: 1},
		{row: 1, col: 2},
	][temp ++];
}
