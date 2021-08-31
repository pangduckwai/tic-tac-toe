// Pick the first available move base on the state of the current game
// n - grid size; r - row; c - column:
// cell index = n*r + c
function chooseMove(game, node) {
	if (!(game instanceof Game)) throw new Error('Invalid input argument type for Game');
	if (!(node instanceof Node)) throw new Error('Invalid input argument type for Node');
	if (game.player !== -1 && game.player !== 1) throw new Error('Game not in progress');

	const avil = game.availableMoves();
	const m = avil.length;
	const n = game.grid();

	for (const mov of avil) {
		if (node.next.filter(v => v !== undefined && v.row(n) === mov.r && v.col(n) === mov.c).length <= 0) { //[git:lean:1,2]
			mov.m = m - 1;
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
		if (node.next.filter(t => t !== undefined).length < node.next.length) { //[git:lean:1]
			// leaf node encountered or unvisited move exists, expand the mctree
			move = chooseMove(game, node);
			game.makeMove(move.r, move.c); // call this b4 'noode.add()' to ensure the move is valid (position not yet occupied)
			node = node.add(grid, move.r, move.c, move.m);
			break;
		} else {
			// select a move from the tree
			const idx = node.ucb();
			move = { r: node.next[idx].row(grid), c: node.next[idx].col(grid) }; //[git:lean:2]
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
			(conclusion === 1 && node.player === 1)
		) {
			node.wins += 2;
		} else if (conclusion === 255) {
			node.wins ++;
		}
		node = node.parent;
	}

	if (conclusion === 0) {
		throw new Error('Error, game not finished');
	}

	return { run, completed };
}

const mapped = [' X', ' _', ' O'];

// find in the mctree the current game status
// move - moves taken in the current game so far
function track(n, tree, moves) { //[git:lean:2]
	let lf = tree;
	let found = false;

	if (moves.length <= 1 && moves[0].player === lf.player && moves[0].row === lf.row(n) && moves[0].col === lf.col(n)) { //[git:lean:2]
		found = true;
		console.log(`[tree] FOUND : ${lf.show(n)}`);
	}

  for (let i = 1; i < moves.length; i ++) {
		console.log(`[move] player: ${mapped[moves[i].player + 1]}${(''+moves[i].row).padStart(2, ' ')}${(''+moves[i].col).padStart(2, ' ')}`);

		found = false
		for (let j = 0; j < lf.next.filter(t => t !== undefined).length; j ++) { //[git:lean:1]
			if (moves[i].player === lf.next[j].player && moves[i].row === lf.next[j].row(n) && moves[i].col === lf.next[j].col(n)) {
				// Found move in mctree
				found = true;
				lf = lf.next[j];
				console.log(`[tree] FOUND : ${lf.show(n)}`);
				break;
			}
		}

		// Only the latest move in the current game should get a not found, since will add all possible moves in previous runs
		// Therefore should be error if not found here but not last item in 'moves'
		if (!found) {
			if (i != moves.length - 1) throw new Error('Unable to find a move in the m.c. tree before reaching the last move');
			break;
		}
	}

	if (found) {
		// human player made an existing move, choose a response from the mctree or explore a new one
		return { leaf: lf, found };
	} else {
		// human player made a move not yet explored
		// TODO: should simulate games till conclusion from the leaf node
		throw new Error(`Unexplored move ${JSON.stringify(moves[moves.length - 1])} on:\n${show(n, lf, 2)}`);
	}
}

// Start or continue simulations
function simulate(grid, runs, tree) {
	if (!tree) {
		console.log(`Initializing a new tree of ${grid} x ${grid} games`);
		tree = Node.root(grid);
	}

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
