const Screen = require("./screen");
const Cursor = require("./cursor");

const emojiCodes = [0x1F34B, 0x1F349, 0x1F34A, 0x1F350, 0x1F95D, 0x1F34E];
const emojis = emojiCodes.map(code => String.fromCodePoint(code));
const randomEmoji = () => {
  return emojis[Math.floor((Math.random()*(emojis.length)))]
}

class Bejeweled {

  constructor() {

    this.playerTurn = "O";

    // Initialize this
    this.grid = [];

    this.cursor = new Cursor(8, 8);

    Screen.initialize(8, 8);
    Screen.setGridlines(false);

    this.last = {
      char: Screen.grid[this.cursor.row][this.cursor.col],
      row: this.cursor.row,
      col: this.cursor.col
    };

    Screen.addCommand("up", "move up", Bejeweled.moveUp.bind(this));
    Screen.addCommand("down", "move down", Bejeweled.moveDown.bind(this));
    Screen.addCommand("left", "move left", Bejeweled.moveLeft.bind(this));
    Screen.addCommand("right", "move right", Bejeweled.moveRight.bind(this));
    Screen.addCommand("return", "select fruit", Bejeweled.select.bind(this));

    Bejeweled.addressMatches(Screen.grid, this, 0, true);

    this.score = 0;
    this.combo = 0;
    Screen.message = `Score: ${this.score}\nCombo: ${this.combo}`;

    this.cursor.setBackgroundColor();
    Screen.render();
  }

  static changeCommands(context) {
    Screen.commands["up"].description = "select fruit above";
    Screen.commands["up"].action = Bejeweled.selectAbove.bind(context);

    Screen.commands["down"].description = "select fruit below";
    Screen.commands["down"].action = Bejeweled.selectBelow.bind(context);

    Screen.commands["left"].description = "select fruit to the left";
    Screen.commands["left"].action = Bejeweled.selectLeft.bind(context);

    Screen.commands["right"].description = "select fruit to the right";
    Screen.commands["right"].action = Bejeweled.selectRight.bind(context);

    Screen.commands["return"].description = "unselect fruit";
    Screen.commands["return"].action = Bejeweled.changeCommandsBack.bind(context, context);

    Screen.render();
  }

  static changeCommandsBack(context) {

    context.cursor.cursorColor = "white";
    context.cursor.setBackgroundColor();

    Screen.commands["up"].description = "move up";
    Screen.commands["up"].action = Bejeweled.moveUp.bind(context);

    Screen.commands["down"].description = "move down";
    Screen.commands["down"].action = Bejeweled.moveDown.bind(context);

    Screen.commands["left"].description = "move left";
    Screen.commands["left"].action = Bejeweled.moveLeft.bind(context);

    Screen.commands["right"].description = "move right";
    Screen.commands["right"].action = Bejeweled.moveRight.bind(context);

    Screen.addCommand("return", "select fruit", Bejeweled.select.bind(context));

    Screen.render();
  }

  static undo(context) {

    let center = Screen.grid[context.last.row][context.last.col];
    let adjacent = Screen.grid[context.cursor.row][context.cursor.col];
    Screen.setGrid(context.cursor.row, context.cursor.col, center);
    Screen.setGrid(context.last.row, context.last.col, adjacent);

    context.cursor.cursorColor = "white";
    context.cursor.setBackgroundColor();
  }

  static swap(context) {

    context.cursor.cursorColor = "white";
    context.cursor.setBackgroundColor();

    let center = Screen.grid[context.last.row][context.last.col];
    let adjacent = Screen.grid[context.cursor.row][context.cursor.col];

    Screen.setGrid(context.cursor.row, context.cursor.col, center);
    Screen.setGrid(context.last.row, context.last.col, adjacent);

    //check for matches
    if (Bejeweled.checkForMatches(Screen.grid).length > 0) {
      Bejeweled.addressMatches(Screen.grid, context);
      Bejeweled.changeCommandsBack(context);
    } else {
      Bejeweled.undo(context);
      Bejeweled.changeCommandsBack(context);
      Screen.message = `Invalid move!\nScore: ${context.score}\nCombo: 0`;
    }

    Screen.render();
  }

  static selectAbove() {
    this.cursor.resetBackgroundColor();

    this.cursor.selectAbove();
    Bejeweled.swap(this);
  }
  static selectBelow() {
    this.cursor.resetBackgroundColor();

    this.cursor.selectBelow();
    Bejeweled.swap(this);
  }
  static selectLeft() {
    this.cursor.resetBackgroundColor();

    this.cursor.selectLeft();
    Bejeweled.swap(this);
  }
  static selectRight() {
    this.cursor.resetBackgroundColor();

    this.cursor.selectRight();
    Bejeweled.swap(this);
  }

  static select() {
    this.cursor.cursorColor = "yellow";
    this.cursor.setBackgroundColor();
    this.last.char = Screen.grid[this.cursor.row][this.cursor.col];
    this.last.row = this.cursor.row;
    this.last.col = this.cursor.col;
    Bejeweled.changeCommands(this);

  }

  static moveUp() {
    this.cursor.up();
  }
  static moveDown() {
    this.cursor.down();
  }
  static moveLeft() {
    this.cursor.left();
  }
  static moveRight() {
    this.cursor.right();
  }

  static addressMatches(grid, context, combo, startOfGame) {

    combo = combo || 1;

    let matches = Bejeweled.checkForMatches(grid);
    if (matches.length === 0) {
      return;
    }

    //change all matches to bomb
    matches.forEach(match => {
      Screen.setGrid(match.row, match.col, String.fromCodePoint(0x1F4A3));
      context.score += (1*combo);
        if (startOfGame){
          context.score = 0
          combo = 0;
        };
      Screen.message = `Good move!\nScore: ${context.score}\nCombo: ${combo}`;
      Screen.render();
    });





    //add some delay
    setTimeout(() => {
      //go through each column grabbing any remaining fruit
      Bejeweled.getFruits(grid);
      //fill up spots with random fruits
      Bejeweled.fillUp(grid);
      //check for matches again
      if (Bejeweled.checkForMatches(grid).length > 0) {
        combo++;
        if (startOfGame) {
          context.score = 0
          combo = 0;
          Bejeweled.addressMatches(grid, context, combo, true);
          Screen.message = `\nScore: ${context.score}\nCombo: ${combo}`;
          Screen.render();

        } else {
          Bejeweled.addressMatches(grid, context, combo, false);
          Screen.message = `Good move!\nScore: ${context.score}\nCombo: ${combo}`;
          Screen.render();
        }

      }
    }, 500);
  }

  static fillUp(grid) {
    grid.forEach(
      (row, rowIndex) => {
        row.forEach(
          (column, columnIndex) => {
            if (Screen.grid[rowIndex][columnIndex] === ("  ")) {
              Screen.setGrid(rowIndex, columnIndex, randomEmoji());
            }
          }
        );
      }

    );
  }

  static getFruits(grid) {
    //for each column
    for (let i = 0; i < grid[0].length; i++) {
      //create an array to hold any remaining fruit
      let fruits = [];
      //iterate over the column
      for (let j = grid.length - 1; j >= 0; j--) {
        //if we find a fruit
        if (grid[j][i] !== String.fromCodePoint(0x1F4A3)) {
          fruits.push(grid[j][i]); //stick the fruit at the beginning
        }
      }
      //without moving to the next column, have the fruits "fall down"
      Bejeweled.fall(grid, fruits, i);
    }
  }

  static fall(grid, fruits, column) {

    for (let i = grid.length - 1; i >= 0; i--) {
      if (fruits[0]) {
        Screen.setGrid(i, column, fruits.shift())
      } else {
        Screen.setGrid(i, column, "  ");
      }
    }
  }


  static checkForMatches(grid) {
    return [...Bejeweled.checkHorizontal(grid), ...Bejeweled.checkVertical(grid)];
  }

  static checkHorizontal(grid) {
    let matches = [];

    grid.forEach(
      (row, index) => {
        for (let i = 0; i < row.length - 2; i++) {
          if(row[i] === row[i+1] && row[i] === row[i+2]) {
            matches.push({row: index, col: i});
            matches.push({row: index, col: i+1});
            matches.push({row: index, col: i+2});

            if (row[i] === row[i+3]) {
              matches.push({row: index, col: i+3});
              if (row[i] === row[i+4]) {
                matches.push({row: index, col: i+4});
                if (row[i] === row[i+5]) {
                  matches.push({row: index, col: i+5});
                  if (row[i] === row[i+6]) {
                    matches.push({row: index, col: i+6});
                    if (row[i] === row[i+7]) {
                      matches.push({row: index, col: i+7});
                    }
                  }
                }
              }
            }

          }

        }
      }
    );
    return matches;
  }

  static checkVertical(grid) {
    let matches = [];
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[0].length-2; j++) {
        if (grid[j][i] === grid[j+1][i] && grid[j][i] === grid[j+2][i]) {
          matches.push({row: j, col: i});
          matches.push({row: j+1, col: i});
          matches.push({row: j+2, col: i});

          if (grid[j+3] !== undefined && grid[j][i] === grid[j+3][i]) {
            matches.push({row: j+3, col: i});
            if (grid[j+4] !== undefined && grid[j][i] === grid[j+4][i]) {
              matches.push({row: j+4, col: i});
              if (grid[j+5] !== undefined && grid[j][i] === grid[j+5][i]) {
                matches.push({row: j+5, col: i});
                if (grid[j+6] !== undefined && grid[j][i] === grid[j+6][i]) {
                  matches.push({row: j+6, col: i});
                  if (grid[j+7] !== undefined && grid[j][i] === grid[j+7][i]) {
                    matches.push({row: j+7, col: i});
                  }
                }
              }
            }
          }

        }
      }
    }
    return matches;
  }


}

module.exports = Bejeweled;
