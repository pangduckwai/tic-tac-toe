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
function sim(root, game, run) {
	if (!(root instanceof Node)) throw new Error('Invalid input argument type');
	if (!(game instanceof Game)) throw new Error('Invalid input argument type for Game');
	if (root.player !== 0) throw new Error('Root node required');

	const n = game.grid();
	let node = root;
	let conclusion = 0;
	let completed = false;

	if (game.steps) { // simulation not starting at the very begining
		node = sync(root, game);
		if (!node) throw new Error('Tree not sync with the give game');
	}

	while (conclusion === 0) {
		if (!game.nextTurn()) {
			conclusion = 255;
			break;
		}

		let move;
		if (node.next.filter(t => t !== undefined).length < node.next.length) {
			// leaf node encountered or unvisited move exists, expand the mctree
			move = chooseMove(game, node);
			game.makeMove(move.r, move.c); // call this b4 'add()' to ensure the move is valid (position not yet occupied)
			const { newNode } = node.add(n, move.r, move.c, move.m);
			node = newNode;
			break;
		} else {
			// select a move from the tree
			const idx = node.ucb();
			move = { r: node.next[idx].row(n), c: node.next[idx].col(n) };
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

// Start simulations
function startSim(root, grid, runs) {
	if (!root) {
		console.log(`Initializing a new tree of ${grid} x ${grid} games`);
		root = Node.root(grid);
	}
	if (root.player !== 0) throw new Error('Root node required');

	let count = 0;
	for (let i = 0; i < runs; i ++) {
		const { completed } = sim(root, new Game(grid), i);
		if (completed) count ++;
	}

	return {
		tree: root,
		grid,
		runs,
		newly: runs - count,
	}
}

// Continue simulation
function contSim(root, game, runs) {
	if (!(root instanceof Node)) throw new Error('Invalid input argument type for Node');
	if (!(game instanceof Game)) throw new Error('Invalid input argument type for Game');
	if (root.player !== 0) throw new Error('Root node required');

	let count = 0;
	for (let i = 0; i < runs; i ++) {
		const { completed } = sim(root, game.clone(), i);
		if (completed) count ++;
	}

	return {
		tree: root,
		grid: game.grid(),
		runs,
		newly: runs - count,
	}
}

// find in the mctree the current game status
// move - moves taken in the current game so far
function track(root, game, move) {
	if (!(root instanceof Node)) throw new Error('Invalid input argument type for Node');
	if (!(game instanceof Game)) throw new Error('Invalid input argument type for Game');
	if (root.player !== 0) throw new Error('Root node required');
	if (!game.steps) throw new Error('The game given is not for interactive use');

	const n = game.grid();
	let found = false;
	let index; // Index of 'move' in the 'next' array of the current node
	// let indexNext = -1; // Index of the next move made by the AI player

	// navigate the tree to the current node
	let leaf = root;
	for (const step of game.steps) {
		if (leaf.next.filter(t => t !== undefined).length <= step) {
			// 'steps' expecting the tree has a node, is an error if turns out not the case
			throw new Error(`Expecting a child node at position ${step} of node ${leaf.show(n)}`);
		}
		leaf = leaf.next[step];
	}

	// current node found, try to find the latest move in this current node
	console.log(`[track] move : ${[' X', ' _', ' O'][move.player + 1]}${(''+move.row).padStart(2, ' ')}${(''+move.col).padStart(2, ' ')}`);
	for (index = 0; index < leaf.next.filter(t => t !== undefined).length; index ++) {
		if (move.player === leaf.next[index].player && move.row === leaf.next[index].row(n) && move.col === leaf.next[index].col(n)) {
			found = true; // found latest move in mctree
			leaf = leaf.next[index];
			console.log(`[track] found: ${leaf.show(n)}`);
			break;
		}
	}

	if (!found) index = -1; // human player made a move not yet explored
	return { index, leaf };
}
