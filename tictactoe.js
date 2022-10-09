// Background simulation runs
// const INTERVAL = 1; // 1 second timer interval
// const IDLE = 2; // 2 seconds
const INITIAL = 1000000; // initial simulation runs
const SUBSQNT = 100000; // subsequent simulation runs
// const TOTRUNS = 1000000; // Total number of runs
// let RUNS = TOTRUNS; // total simulation runs
// let idled;
// let thread;

// TODO: disabled for the moment
// function worker() {
// 	if (RUNS <= 0) {
// 		clearInterval(thread);
// 		console.log('Timer stopped');
// 		return;
// 	}

// 	if (idled < IDLE) {
// 		idled ++;
// 		// console.log(`${idled} waiting...`);
// 	} else {
// 		if (RUNS > 0) {
// 			console.log(`RUNS: ${RUNS}/${TOTRUNS}`);
// 			idled = 0;
// 			const { grid, runs, newly } = startSim(root, game.grid(), SUBSQNT);
// 			RUNS -= runs;
// 			if (RUNS <= 0) {
// 				console.log(`Ran ${runs} (${runs - newly}) simulations of ${grid} x ${grid} games (RUNS: ${RUNS})`);
// 				console.log(show(root.gird, root, 1));
// 			}
// 		}
// 	}
// }

class TicTacToe {
	/**
	 * @typedef {(msg:string) => void} Logger
	 */
	/**
	 * Initialize the TicTacToe object
	 * @param {string} elm element ID to attach the game board
	 * @param {Logger} logger logger callback
	 * @param {number} size board size, default is 3
	 * @param {number} player number of players, default is 1
	 * @param {boolean} human human player move first
	 * @param {number} font font size (for X and O) inside cells
	 * @param {number} cell cell size
	 * @param {number} gap space size between cells
	 */
	constructor(
		elm,
		logger,
		size, player, human,
		font, cell, gap,
	) {
		if (elm === undefined) throw 'Must provide an element to contain the game board';
		this.canvas = document.getElementById(elm);
		if (this.canvas === null) throw `Element '${elm}' not found`;
		this.canvas.innerHTML = '';

		this.setLogger(logger);

		this.setBoardSize((size === undefined) ? 3 : size);
		this.setPlayerNum((player === undefined) ? 1 : player);
		this.setHumanFirst((human === undefined) ? true : human);

		this.font = (font === undefined) ? 21 : font;
		this.cell = (cell === undefined) ? 42 : cell;
		this.gap  = (gap  === undefined) ? 4  : gap;

		this.board = document.createElement('div');
		this.board.setAttribute('id', 'tictactoe-board');
		this.board.setAttribute('style', `display:grid;gap:${this.gap}px;grid-template-columns:repeat(${this.size},${this.cell}px);grid-auto-rows:${this.cell}px;padding-top:${(this.gap+10)/2};padding-bottom:${(this.gap+10)/2};margin-left:${(this.gap+10)/2};`);
		this.buildBoard(false);

		let dialog = document.createElement('div');
		dialog.setAttribute('id', 'tictactoe-dialog');
		dialog.setAttribute('class', 'tictactoe-dialog');
		dialog.innerHTML = '<div class="tictactoe-dialog-content"><div id="tictactoe-msg">&nbsp;</div><button id="tictactoe-new">New game</button></div>';

		let element = document.createElement('div');
		element.setAttribute('style', `position:relative;width:${(this.cell+this.gap)*this.size+10}px;font-size:${this.font}px;`);
		element.appendChild(dialog);
		element.appendChild(this.board);
		this.canvas.appendChild(element);

		document.getElementById('tictactoe-new').onclick = () => this.newGame();

		this.dialogShow('Click to start', true);
	}

	setLogger(logger) {
		if (logger === undefined) return;
		if (typeof logger === 'function' && logger.length === 1) {
			this.logger = logger;
		}
	}

	log(msg) {
		if (this.logger === undefined) return;
		let now = new Date();
		this.logger(`${now.getFullYear()}-${(('0'+(now.getMonth()+1)).slice(-2))}-${('0'+now.getDate()).slice(-2)}_${('0'+now.getHours()).slice(-2)}:${('0'+now.getMinutes()).slice(-2)}:${('0'+now.getSeconds()).slice(-2)} ${msg}`);
	}

	setFontSize(n) {
		this.font = n;
	}

	setCellSize(n) {
		this.cell = n;
	}

	setGapSize(n) {
		this.gap = n;
	}

	setBoardSize(n) {
		if (n < 3 || n > 9) throw 'Supported board size: 3x3 to 9x9';
		this.size = n;
	}

	setPlayerNum(n) {
		switch (n) {
			case 1:
				this.ai = true;
				break;
			case 2:
				this.ai = false;
				break;
			default:
				throw 'Number of players can either be 1 or 2 only'
		}
	}

	setHumanFirst(b) {
		this.first = !b;
	}

	dialogShow(msg, n) {
		document.getElementById('tictactoe-msg').innerHTML = msg; //`<div>${msg}</div>`;
		if (n) {
			document.getElementById('tictactoe-new').style.display = "block";
		} else {
			document.getElementById('tictactoe-new').style.display = "none";
		}
		document.getElementById('tictactoe-dialog').style.display = "block";
	}
	
	dialogHide() {
		document.getElementById('tictactoe-dialog').style.display = "none";
	}

	/**
	 * Build new game board
	 * @param {boolean} v true to add event handlers
	 */
	buildBoard(v) {
		this.board.innerHTML = '';
	
		let r = -1;
		let c;
		for (let i = 0; i < this.size * this.size; i ++) {
			if ((i % this.size) === 0) { // Note the modular operation i % n
				r ++;
				c = 0;
			}
	
			// Initialize the cell's corresponding value in the Game Status object
			const row = r;
			const col = c;
			const eid = `tictactoe-${row}-${col}`;
	
			// Create the cell in the html DOM
			const tmpl = document.createElement('template');
			tmpl.innerHTML = `<div id="${eid}" class="tictactoe-cell">&nbsp;</div>`;
			this.board.appendChild(tmpl.content.firstChild);
	
			if (v) {
				// Add event handlers to the new cell
				const cell = document.getElementById(eid);

				cell.onmouseenter = (_) => {
					if (this.game.cells[row][col] === 0) {
						const eid = `tictactoe-${row}-${col}`;
						if (this.game.player > 0) {
							document.getElementById(eid).textContent = 'O';
						} else {
							document.getElementById(eid).textContent = 'X';
						}
						document.getElementById(eid).setAttribute("style", "color:#a0a0a0");
					}
				};

				cell.onmouseout = (_) => {
					const eid = `tictactoe-${row}-${col}`;
					if (this.game.cells[row][col] === 0) {
						document.getElementById(eid).textContent = ' ';
						document.getElementById(eid).setAttribute("style", "color:#424242");
					}
				};

				cell.onclick = (_) => {
					const n = this.game.grid();
					// idled = 0; // Indicate the user just clicked something, reset the idel timer. // TODO: disabled for the moment
					if (this.game.player !== 0) { // game.player === 0 if game is not yet started or already finished
						if (this.game.ai) this.moves.push({ player: this.game.player, row, col }); // this is the move just made
						const { index, leaf } = (this.game.ai) ? track(this.root, this.game, (this.moves.length > 0) ? this.moves[this.moves.length - 1] : undefined) : { index: undefined, leaf: undefined };
						if (index && index < 0) {
							// The human player just made an unexplored move
							const avil = this.game.availableMoves();
							for (let i = 0; i < avil.length; i ++) {
								if (leaf.next.filter(v => v !== undefined && v.row(n) === avil[i].r && v.col(n) === avil[i].c).length <= 0) {
									const { newNode } = leaf.add(n, avil[i].r, avil[i].c, avil.length - 1);
									if (avil[i].r === row && avil[i].c === col) {
										this.makeMove(avil[i].r, avil[i].c);
										this.game.steps.push(i);
										const { grid, runs, newly } = contSim(this.root, this.game, SUBSQNT);
										this.log(`Adding ${runs} (${runs - newly}) simulations of ${grid}x${grid} games`);
										if (!this.evaluate(avil[i].r, avil[i].c)) {
											if (this.game.ai) {
												this.compPlayer(newNode); // AI's turn to move
											}
										}
										break;
									}
								}
							}
						} else {
							// Found the corresponding node of the move the human player just made, normal operation
							this.makeMove(row, col);
							if (this.game.ai) this.game.steps.push(index);
							if (!this.evaluate(row, col)) {
								if (this.game.ai) {
									this.compPlayer(leaf); // AI's turn to move
								}
							}
						}
					}
				}
			}
	
			c ++;
		}
	}

	newGame() {
		this.dialogShow('Loading...', false);
		this.log(`Starting a ${this.size}x${this.size} new game with ${this.ai ? 1 : 2} player${this.ai ? '' : 's'}${this.ai ? ` (${this.first ? 'Computer' : 'Player'} move first)` : ''}`);
		this.buildBoard(true);

		// Initialize the Game Status object
		this.game = new Game(this.size);
		this.game.ai = this.ai;

		// Initialize the game moves
		this.moves = [];
		this.game.steps = [];

		this.game.nextTurn(); // start game

		// idled = 0; // TODO: disabled for the moment
		if (this.game.ai) {
			if (this.root && this.size !== this.root.grid) { // Discard the m.c. tree if the player change the game board size
				// RUNS = TOTRUNS; // TODO: disabled for the moment
				this.root = undefined;
			}

			setTimeout(() => {
				if (!!this.root) { // If the m.c. tree is not undefined, don't need to do anything
					// console.log(`Simulation ${(RUNS > 0) ? 'running' : 'finished'}: ${RUNS}/${TOTRUNS}`);
				} else { // Otherwise build a new m.c. tree
					const { tree, grid, runs, newly } = startSim(this.root, this.size, INITIAL);
					// RUNS -= runs; // TODO: disabled for the moment
					this.log(`Ran ${runs} (${runs - newly}) simulations of ${grid}x${grid} games`);
					// console.log(show(n, tree, 1));
					this.root = tree;

					// idled = 1; // TODO: disabled for the moment
					// thread = setInterval(() => worker(), INTERVAL * 1000); // TODO: disabled for the moment
				}

				if (this.first) {
					this.compPlayer(this.root); // if the AI should move first
				}
				this.dialogHide();
			}, 1);
		} else {
			this.dialogHide();
		}
	}

	// make a move and update the HTML
	makeMove(row, col) {
		this.game.makeMove(row, col);

		const eid = `tictactoe-${row}-${col}`;
		if (this.game.player > 0) {
			document.getElementById(eid).textContent = 'O';
		} else {
			document.getElementById(eid).textContent = 'X';
		}
		document.getElementById(eid).setAttribute("style", "color:#424242"); // Make the color of 'O' or 'X' solid as visual clue
	}

	// check game status and update the HTML
	evaluate(row, col) {
		const conclusion = this.game.evaluate(row, col);
		if (conclusion < 0) {
			this.dialogShow(' "X" won', true);
			return true;
		} else if (conclusion > 0) {
			this.dialogShow(' "O" won', true);
			return true;
		}

		if (!this.game.nextTurn()) {
			this.dialogShow(' Draw', true);
			return true;
		}
		return false;
	}

	// AI player's turn
	compPlayer(leaf) {
		if (this.game.player !== 0) {
			const n = this.game.grid();

			if (leaf.next.filter(t => t !== undefined).length < leaf.next.length) {
				// Unexplored and/or not fully explored node found
				// NOTE: Since no node under leaf, should add a node under leaf (by chooseMove()), afterward then can do sim()
				// NOTE: What about if leaf is partially explored? should expand instead of UCB?
				const move = chooseMove(this.game, leaf);
				this.makeMove(move.r, move.c);
				const { index } = leaf.add(n, move.r, move.c, move.m);
				this.game.steps.push(index);
				const { grid, runs, newly } = contSim(this.root, this.game, SUBSQNT);
				if (this.evaluate(move.r, move.c)) return;
				this.log(`Adding ${runs} (${runs - newly}) simulations of ${grid}x${grid} games`);
			} else {
				// Find a fully explored node, normal operation
				const indexNext = leaf.ucb();
				this.makeMove(leaf.next[indexNext].row(n), leaf.next[indexNext].col(n));
				this.game.steps.push(indexNext);
				if (this.evaluate(leaf.next[indexNext].row(n), leaf.next[indexNext].col(n))) return;
				this.log(`[comp] select: ${leaf.next[indexNext].show(n)}`);
			}
		}
	}
}
