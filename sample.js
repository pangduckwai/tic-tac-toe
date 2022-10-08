
// On-Load event
window.onload = () => {
	document.getElementById('bsize').value = 3; // default 3x3 game board
	document.getElementById('pnumb').checked = true; // default to 1 players game
	document.getElementById('ai1st').checked = false; // default to human first
	document.getElementById('ai1st').disabled = false; // default to human first

  let ttt = new TicTacToe('board');

	document.getElementById('bsize').onchange = () => ttt.setBoardSize(document.getElementById('bsize').value);

	document.getElementById('pnumb').onchange = () => {
		let p = !document.getElementById('pnumb').checked; // unchecked means non single-player
		if (p) document.getElementById('ai1st').checked = false;
		document.getElementById('ai1st').disabled = p;
		ttt.setPlayerNum(p ? 2 : 1);
	}

	document.getElementById('ai1st').onchange = () => ttt.setHumanFirst(!document.getElementById('ai1st').checked);
};
