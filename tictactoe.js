
function init() {
	document.getElementById("bsize").value = 3; // default
	document.getElementById("new").onclick = (event) => newGame();

	newGame();
}

function clicked(r, c) {
	console.log(`${r} ${c} clicked`);
}

function newGame() {
	let s = document.getElementById("bsize").value;
	if (s < 3) {
		s = 3;
		document.getElementById("bsize").value = 3;
	} else if (s > 9) {
		s = 9;
		document.getElementById("bsize").value = 9;
	}

	let r = -1;
	let c;
	for (let i = 0; i < s * s; i ++) {
		if ((i % s) === 0) {
			r ++;
			c = 0;
		}
		const id = `c${r}-${c}`;
		document.getElementById(id).onclick = (event) => clicked(r, c);
		// console.log(`id="c${r}-${c}"`, i);
		c ++;
	}
}

window.onload = (event) => {
	init();
};
