# tic-tac-toe
This is my attempt to implement a self-contained Tic Tac Toe game employing the [Monte Carlo tree search](https://en.wikipedia.org/wiki/Monte_Carlo_tree_search) principle.

## Deployment
Since it is meant to be self-contain, everything you need is in this repository.

### Deploying locally

1. Copy all the source code here into a directory.

1. Open `sample.html` in Firefox. Other browsers should work, it is just that I didn't test on any other.

### Deploying online

- There is no special setup on the server side, as the whole thing is running on the client's browser

### Embedding in a web page
Follow the example provided with `sample.css`, `sample.js` and `sample.html`

> Imports the `css` and `js` files, as well as provides a `<div>` tag to contain the game board, in the `html` file:
> - `tictactoe.css` light theme
> - `tictactoe-dark.css` dark theme
> ``` html
> <html lang="en">
> <head>
> 	<link type="text/css" rel="stylesheet" href="tictactoe.css" />
> 	<link type="text/css" rel="stylesheet" href="sample.css" />
> </head>
> <body>
> 	<div id="game-board-id"></div>
> 	<script src="tictactoe-game.js" type="text/javascript"></script>
> 	<script src="tictactoe-node.js" type="text/javascript"></script>
> 	<script src="tictactoe-sim.js" type="text/javascript"></script>
> 	<script src="tictactoe.js" type="text/javascript"></script>
> 	<script src="sample.js" type="text/javascript"></script>
> </body>
> </html>
> ```

> Initial the TicTacToe object in the sample `js` file:
> ``` javascript
> new TicTacToe('game-board-id', (msg) => console.log(msg));
> ```

## NOTE
Although the code support 3x3 to 9x9 board sizes, testing shows that one starts experiencing minor lags with a 4x4 board, on Firefox running on an i7-7500U machine with 8GB of RAM.

---

> © 2021 sea9.org