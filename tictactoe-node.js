// The exploration parameter in the Upper Confidence Bound (UCB) algorithm.
// Theoretically it equals to √2, but in practice usually chosen empirically.
const EXPLORATION = 1.4142135623730950488016887242097 // √2

// A node in the m.c. tree
class Node {
	constructor(n, p, r, c, m) {
		this.player = p;
		this.pos = (r < 0 || c < 0) ? -1 : n * r + c;
		this.next = new Array(m);
		this.runs = 0;
		this.wins = 0;
	}

	// create root node
	static root(n) {
		if (n < 3 || n > 9) throw new Error(`Unsupported grid size ${n}`);
		const root = new Node(n, 0, -1, -1, n * n);
		root.grid = n;
		root.runs = 1;
		return root;
	}

	row(n) {
		if (this.pos < 0) return -1;
		return Math.floor(this.pos / n);
	}

	col(n) {
		if (this.pos < 0) return -1;
		return this.pos % n;
	}

	show(n) {
		const row = this.row(n);
		const col = this.col(n);

		const p = [' X', ' _', ' O'][this.player + 1];
		const r = row < 0 ? ' -' : (''+row).padStart(2, ' ');
		const c = col < 0 ? ' -' : (''+col).padStart(2, ' ');
		const u = (''+this.runs).padStart(8, ' ');
		const w = (''+this.wins).padStart(8, ' ');
		const m = (''+this.next.length).padStart(3, ' ');
		const l = (''+this.next.filter(t => t !== undefined).length).padStart(3, ' ');
		return `${p}${r}${c}|${l}/${m}|${w}/${u}`;
	}

	// add new child node
	add(n, row, col, moves) {
		const p = (this.player === 0) ? -1 : -1 * this.player; // "X" start first
		const newNode = new Node(n, p, row, col, moves);
		const index = this.next.findIndex(t => t === undefined);
		this.next[index] = newNode;
		newNode.parent = this;
		return { newNode, index };
	}

	// // insert new child node
	// insert(n, index, row, col, moves) {
	// 	if (index < 0 || index >= this.moves) throw new Error(`Index ${index} out of range ${this.moves}`);
	// 	if (this.next[index] !== undefined) throw new Error(`Child node ${index} already populated`);
	// 	const p = (this.player === 0) ? -1 : -1 * this.player; // "X" start first
	// 	const node = new Node(n, p, row, col, moves);
	// 	this.next[index] = node;
	// 	node.parent = this;
	// 	return node;
	// }

	// calculate ucb value
	ucb() {
		let ni = (this.runs === 0) ? 1 : Math.log(this.runs);

		let max = -1.0;
		const idx0 = [];
		const idx1 = [];
		for (let i = 0; i < this.next.filter(t => t !== undefined).length; i ++) {
			if (this.next[i].runs === 0) {
				idx0.push(i);
			} else {
				const u = this.next[i].wins / this.next[i].runs + EXPLORATION * Math.sqrt(ni / this.next[i].runs);
				if (u > max) {
					max = u;
					idx1.splice(0, idx1.length); // Remove all indices with same old high score, since a new high score is found
					idx1.push(i);
				} else if (u === max) {
					idx1.push(i);
				}
			}
		}

		if (idx0.length > 0) {
			return idx0[Math.floor(Math.random() * idx0.length)];
		}

		if (idx1.length > 0) {
			return idx1[Math.floor(Math.random() * idx1.length)];
		}

		throw new Error('UCB failed');
	}
}

function show(n, node, lvl) {
	if (!(node instanceof Node)) throw new Error('Invalid input argument type');

	let buff = '';
	let stck;
	let stack = [node];
	let prfx;
	let prfix = [0];
	while (stack.length > 0) {
		stck = stack[0];
		prfx = prfix[0];
		if (lvl < 0 || (prfx + 1) <= lvl) {
			stack = stck.next.filter(t => t !== undefined).concat(stack.slice(1));
			prfix = stck.next.filter(t => t !== undefined).map(_ => prfx + 1).concat(prfix.slice(1));
		} else {
			stack = stack.slice(1);
			prfix = prfix.slice(1);
		}

		buff += `${' '.repeat(prfx).padEnd(9, '─')} ${prfx}: ${stck.show(n)}\n`;
	}
	return buff;
}

// walk down the m.c. tree to the node specified by the steps, and return the node if it is sync with the given game
function sync(root, game) {
	if (!(root instanceof Node)) throw new Error('Invalid input argument type for Node');
	if (!(game instanceof Game)) throw new Error('Invalid input argument type for Game');
	if (root.player !== 0) throw new Error('Root node required');
	if (!game.steps) throw new Error('The game given is not for interactive use');

	const n = game.grid();

	let leaf = root;
	for (const step of game.steps) {
		if (leaf.next.filter(t => t !== undefined).length <= step) {
			// 'steps' expecting the tree has a node, is an error if turns out not the case
			throw new Error(`Expecting a child node at position ${step} of node ${leaf.show(n)}`);
		}
		// console.log(`Sync... ${step} ${leaf.show(n)}`);
		leaf = leaf.next[step];
		if (game.cells[leaf.row(n)][leaf.col(n)] === 0) {
			console.log(`Not sync 1: ${leaf.show(n)}\n${game.show()}`)
			return undefined; // game and tree not sync
		}
	}
	if (game.player !== leaf.player) {
		console.log(`Not sync 2: ${leaf.show(n)}\n${game.show()}`)
		return undefined; // game and tree not sync
	}

	return leaf;
}
