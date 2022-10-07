
// On-Load event
window.onload = () => {
	// var sizeCll = 42; // 42 70
	// var sizeFnt = 21; // 21 49
	// var sizeGap =  4; //  4 10

	// init('board', 3, sizeCll, sizeGap, sizeFnt);

	// document.getElementById('tictactoe-new').onclick = () => { // Add event handler for the 'New game' button
	// 	let boardSize = document.getElementById('bsize').value;
	// 	let snglePlyr = document.getElementById('pnumb').checked; // pnumb checked means 1 player, unchecked 2 players
	// 	let aiMove1st = document.getElementById('ai1st').checked; // ai1st checked means AI should move first
	// 	newgame(boardSize, snglePlyr, aiMove1st);
	// }
	document.getElementById('bsize').value = 3; // default 3x3 game board
	document.getElementById('pnumb').checked = true; // default to 1 players game
	document.getElementById('ai1st').checked = false; // default to human first
	document.getElementById('ai1st').disabled = false; // default to human first

	document.getElementById('pnumb').onchange = () => {
		if (!document.getElementById('pnumb').checked) document.getElementById('ai1st').checked = false;
		document.getElementById('ai1st').disabled = !document.getElementById('pnumb').checked;
	}

  let test = new TicTacToe('board', 3, 42, 4, 21);
  console.log('YEAH!');
};
