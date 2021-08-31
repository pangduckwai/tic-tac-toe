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
		if (node.next.filter(v => v !== undefined && v.row(n) === mov.r && v.col(n) === mov.c).length <= 0) {
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
		if (node.next.filter(t => t !== undefined).length < node.next.length) {
			// leaf node encountered or unvisited move exists, expand the mctree
			move = chooseMove(game, node);
			game.makeMove(move.r, move.c); // call this b4 'noode.add()' to ensure the move is valid (position not yet occupied)
			node = node.add(grid, move.r, move.c, move.m);
			break;
		} else {
			// select a move from the tree
			const idx = node.ucb();
			move = { r: node.next[idx].row(grid), c: node.next[idx].col(grid) };
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

const mapped = [' X', ' _', ' O'];

// find in the mctree the current game status
// move - moves taken in the current game so far
function track(root, steps, move) {
	const n = root.grid;
	let found = false;
	let index; // Index of 'move' in the 'next' array of the current node
	let indexNext = -1; // Index of the next move made by the AI player

	// navigate the tree to the current node
	let leaf = root;
	for (const step of steps) {
		if (leaf.next.filter(t => t !== undefined).length <= step) {
			// 'steps' expecting the tree has a node, is an error if turns out not the case
			throw new Error(`Expecting a child node at position ${step} of node ${leaf.show(n)}`);
		}
		leaf = leaf.next[step];
	}

	// current node found, try to find the latest move in this current node
	if (!move) {
		found = true;
	} else {
		console.log(`[move] player: ${mapped[move.player + 1]}${(''+move.row).padStart(2, ' ')}${(''+move.col).padStart(2, ' ')}`);
		for (index = 0; index < leaf.next.filter(t => t !== undefined).length; index ++) {
			if (move.player === leaf.next[index].player && move.row === leaf.next[index].row(n) && move.col === leaf.next[index].col(n)) {
				found = true; // found latest move in mctree
				leaf = leaf.next[index];
				console.log(`[tree] FOUND : ${leaf.show(n)}`);
				break;
			}
		}
	}

	if (!found) {
		// human player made a move not yet explored
		// TODO: should start a simulation from the current node
		return { index: -1, indexNext, leaf };
	} else if (leaf.next.filter(t => t !== undefined).length <= 0) {
		// unexplored leaf node found
		// TODO: should start a simulation from the current node
		return { index, indexNext: -1, leaf };
	} else {
		indexNext = leaf.ucb();
		leaf = leaf.next[indexNext];
		return { index, indexNext, leaf };
	}
}
