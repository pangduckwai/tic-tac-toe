// The exploration parameter in the Upper Confidence Bound (UCB) algorithm.
// Theoretically it equals to √2, but in practice usually chosen empirically.
const EXPLORATION = 1.4142135623730950488016887242097 // √2

// A node in the m.c. tree
class Node {
	constructor(p, r, c, m) {
		this.player = p;
		this.row = r;
		this.col = c;
		this.moves = m;
		this.next = [];
		this.runs = 0;
		this.wins = 0;
	}

	// create root node
	static root(n) {
		if (n < 3 || n > 9) throw new Error(`Unsupported grid size ${n}`);
		const root = new Node(0, -1, -1, n * n);
		root.grid = n;
		root.runs = 1;
		return root;
	}

	show() {
		const mapped = [' X', ' _', ' O'];
		const p = mapped[this.player + 1];
		const r = this.row < 0 ? ' -' : (''+this.row).padStart(2, ' ');
		const c = this.col < 0 ? ' -' : (''+this.col).padStart(2, ' ');
		const m = (''+this.moves).padStart(2, ' ');
		const n = (''+this.runs).padStart(7, ' ');
		const w = (''+this.wins).padStart(7, ' ');
		const l = (''+this.next.length).padStart(2, ' ');
		return `${p}${r}${c}${m}${l}|${w}/${n}`;
	}

	// create new child node
	add(row, col, moves) {
		const p = (this.player === 0) ? -1 : -1 * this.player; // "X" start first
		const node = new Node(p, row, col, moves);
		this.next.push(node);
		node.parent = this;
		return node;
	}

	// calculate ucb value
	ucb() {
		let ni = (this.runs === 0) ? 1 : Math.log(this.runs);

		let max = -1.0;
		const idx0 = [];
		const idx1 = [];
		for (let i = 0; i < this.next.length; i ++) {
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

function show(node, lvl) {
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
			stack = stck.next.concat(stack.slice(1));
			prfix = stck.next.map(_ => prfx + 1).concat(prfix.slice(1));
		} else {
			stack = stack.slice(1);
			prfix = prfix.slice(1);
		}

		buff += `${' '.repeat(prfx).padEnd(9, '─')}${prfx} - ${stck.show()}\n`;
	}
	return buff;
}
