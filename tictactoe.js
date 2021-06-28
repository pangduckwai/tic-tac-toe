
function evaluate(game) {
	const lgth = game.cells.length;
	let hv; // horizontal or vertical
	let df = 0, db = 0; // diagonal
	let dw = 0; // draw

	// horizontal and diagonal
	for (let i = 0; i < lgth; i ++) {
		hv = 0;
		for (let j = 0; j < lgth; j ++) {
			const isFrwDia = (i === j);
			const isBckDia = ((i + j + 1) === lgth);
			if (game.cells[i][j] > 0) {
				hv ++;
				if (isFrwDia) df ++;
				if (isBckDia) db ++;
			} else if (game.cells[i][j] < 0) {
				hv --;
				if (isFrwDia) df --;
				if (isBckDia) db --;
			} else {
				dw ++;
			}
		}
		if (hv === lgth) {
			return 1; // Player > 0 won
		} else if ((-1 * hv) === lgth) {
			return -1; // Player < 0 won
		}
	}

	if (df === lgth || db === lgth) {
		return 1; // Player > 0 won
	} else if ((-1 * df) === lgth || (-1 * db) === lgth) {
		return -1; // Player < 0 won
	}

	// vertical
	for (let j = 0; j < lgth; j ++) {
		hv = 0;
		for (let i = 0; i < lgth; i ++) {
			if (game.cells[i][j] > 0) {
				hv ++;
			} else if (game.cells[i][j] < 0) {
				hv --;
			}
		}
		if (hv === lgth) {
			return 1; // Player > 0 won
		} else if ((-1 * hv) === lgth) {
			return -1; // Player < 0 won
		}
	}

	if (dw === 0) {
		return 255;
	}
	return 0;
}

function newgame() {
	let s = document.getElementById('bsize').value;
	if (s < 3) {
		s = 3;
		document.getElementById('bsize').value = 3;
	} else if (s > 9) {
		s = 9;
		document.getElementById('bsize').value = 9;
	}

	// 0. prepare game data
	const cells = new Array(s);
	const game = {
		player: -1,
		cells,
	};
	document.getElementById('message').innerHTML = '<div id="message" class="p">&nbsp;</div>';

	// 1. build CSS
	let css = document.getElementById('boardcss');
	css.innerHTML = `#board {grid-template-columns: repeat(${s}, 100px);}`;

	// 2. build the board
	let board = document.getElementById('board');
	board.innerHTML = '';
	let r = -1;
	let c;
	for (let i = 0; i < s * s; i ++) {
		if ((i % s) === 0) {
			r ++;
			c = 0;
			game.cells[r] = new Array(s);
		}
		game.cells[r][c] = 0;
		const row = r;
		const col = c;
		const eid = `c${row}-${col}`;

		let tmpl = document.createElement('template');
		tmpl.innerHTML = `<div id="${eid}" class="cell">&nbsp;</div>`;
		board.appendChild(tmpl.content.firstChild);

		let cell = document.getElementById(eid);
		cell.onclick = (_) => {
			if (game.player !== 0) { // Game not yet end
				if (game.cells[row][col] === 0) {
					if (game.player > 0) {
						document.getElementById(eid).textContent = 'O';
						game.cells[row][col] = 1;
						game.player = -1;
					} else {
						document.getElementById(eid).textContent = 'X';
						game.cells[row][col] = -1;
						game.player = 1;
					}
					document.getElementById(eid).setAttribute("style", "color:#424242");
					
					const rslt = evaluate(game);
					switch (rslt) {
						case 0:
							// Not yet finish
							break;
						case 255:
							// Draw
							game.player = 0;
							break;
						case 1:
							// Player > 0 won
							document.getElementById('message').textContent = '"O" won';
							game.player = 0;
							break;
						case -1:
							// Player < 0 won
							document.getElementById('message').textContent = '"X" won';
							game.player = 0;
							break;
					}
				}
			}
		};
		cell.onmouseenter = (_) => {
			if (game.cells[row][col] === 0) {
				if (game.player > 0) {
					document.getElementById(eid).textContent = 'O';
				} else {
					document.getElementById(eid).textContent = 'X';
				}
				document.getElementById(eid).setAttribute("style", "color:#a0a0a0");
			}
		};
		cell.onmouseout = (_) => {
			if (game.cells[row][col] === 0) {
				document.getElementById(eid).textContent = ' ';
				document.getElementById(eid).setAttribute("style", "color:#424242");
			}
		};

		c ++;
	}
}

function init() {
	document.getElementById('bsize').value = 3; // default
	document.getElementById('new').onclick = (_) => newgame();

	newgame();
}

window.onload = (_) => {
	init();
};
