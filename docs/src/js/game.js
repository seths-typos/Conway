/*jslint onevar: true, undef: false, nomen: true, eqeqeq: true, plusplus: false, bitwise: true, regexp: true, newcap: true, immed: true  */

/**
 * original Game of Life - JS & CSS
 * http://pmav.eu
 * 04/Sep/2010
 * 
 * updated Nov 2024 by Seth Hamlin
 */


class Game {

  constructor () {
    console.log("new game", this)
    let baseColor = '#000000';

    // Variables
    this.waitTime = 2;
    this.waitCap = 1;
    this.waitRate = 1;
    this.count = 0
    this.alphaStep = 1 / ((this.waitTime - this.waitCap) / this.waitStep);
    this.firstRun = true;

    this.running = false;
    this.autoplay = false;
    this.insPointCounter = 0;
    this.currentWord = [];

    this.curAlpha = 1;

    // Clear state
    this.clear = false;

    // Initial state
    // this.initialState = '[{"0":[0,1,3,4]},{"1":[0,1,2,3,4,5,6]},{"2":[1,2,4]},{"3":[0,1,2,3,4]},{"4":[0,1,2,5,6]},{"5":[1,2,5,6]},{"6":[0,1,2,3,4,5,6]},{"7":[0,1,3,4,5]}]';
    // this.initialState = '';

    // Trail state
    this.trail = true;

    // Grid style
    this.gridColor = baseColor;

    // Zoom level
    this.zoom = {
      columns : 100,
      rows : 100,
      cellSize : 3,
      cellSpace: 3
    };

    // Cell colors
    this.colors = {
      dead : baseColor,
      trail : ['#B5ECA2'],
      ipColor : '#ffffff',
      alive : ['#9898FF', '#8585FF', '#7272FF', '#5F5FFF', '#4C4CFF', '#3939FF', '#2626FF', '#1313FF', '#0000FF', '#1313FF', '#2626FF', '#3939FF', '#4C4CFF', '#5F5FFF', '#7272FF', '#8585FF']
    };

    // Text
    this.line = 0;
    this.marginTop = 10;
    this.marginLeft = null;
    this.insertionPoints = [];
    this.letterSpacing = 1;
    this.lineHeight = 10;
    this.leading = 4;

    // ListLife Variables
    this.actualState = null;

    // Canvas Variables
    this.context = null;
    this.width = null;
    this.height = null;
    this.cellSize = null;
    this.cellSpace = null;

    this.rows = this.zoom.rows;
    this.columns = this.zoom.columns;
  }

  init () {
    try {
      this.initCanvas();     // Init canvas GUI
      this.setGridSize();

      this.actualState = new CellList({
        rows: this.rows,
        columns: this.columns
      });

      // this.setNoGridOn();

      this.prepare();
    } catch (e) {
      console.log("Error: "+e);
    }
  }

  reset () {
    this.running = false;
    this.cleanUp();
  }


  setGridSize () {
    this.columns = Math.round(window.innerWidth / (this.zoom.cellSize + this.cellSpace));

    let offset = document.getElementById("controls").getBoundingClientRect();

    this.rows = Math.round((window.innerHeight - offset.height - offset.bottom) / (this.zoom.cellSize + this.cellSpace));

    this.marginLeft = Math.round(this.rows/7);
  }

  setCapHeight (ltr) {
    let v = JSON.parse(ltr.code)
    this.lineHeight = v.length + this.leading;
  }

  /**
   * Clean up actual state and prepare a new run
   */
  cleanUp () {
    this.line = 0;
    this.actualState.reset(); // Reset/init algorithm
    this.clearWorld();
    this.redrawWorld();
  }


  /**
   * Prepare DOM elements and Canvas for a new run
   */
  prepare () {
    this.clearWorld(); // Reset GUI
    this.drawWorld(); // Draw State
  }

  /**
   * Run Next Step
   */
  nextStep () {
    this.context.clearRect(0,0,this.width, this.height)
    
    
    // Algorithm run
    if (this.count == this.waitTime || !this.running) {
      var liveCellNumber = this.actualState.nextGeneration();

      this.count = 0;

      if (this.firstRun) {
        this.firstRun = false;
      }
    } else {
      this.count += 1;
    }

    this.redrawWorld();


    // Flow Control
    if (this.running) { 
      requestAnimationFrame(this.nextStep.bind(this));
    } else {
      if (this.clear) {
        this.cleanUp();
      }
    }
  }

  /** ****************************************************************************************************************************
   * Canvas
   */

  /**
   * init
   */
  initCanvas () {
    this.canvas = document.getElementById('canvas');
    this.context = this.canvas.getContext('2d');

    this.cellSize = this.zoom.cellSize;
    this.cellSpace = this.zoom.cellSpace;
  }


  /**
   * clearWorld
   */
  clearWorld () {
    var i, j;

    this.insertionPoints = [this.marginLeft]

    // Init ages (Canvas reference)
    this.actualState.clearAges();
  }

  redrawWorld () {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawCells();
  }


  /**
   * drawWorld
   */
  drawWorld () {
    // Dynamic canvas size
    this.width = this.width + (this.cellSpace * this.columns) + (this.cellSize * this.columns);
    this.canvas.setAttribute('width', this.width);

    this.height = this.height + (this.cellSpace * this.rows) + (this.cellSize * this.rows);
    this.canvas.setAttribute('height', this.height);

    // Fill background
    this.context.fillStyle = this.gridColor;
    this.context.fillRect(0, 0, this.width, this.height);

    this.drawCells();    
  }

  drawCells () {
    for (let row in this.actualState.cells) {
      if (row < this.rows) {
        for (let col of this.actualState.cells[row]) {
          if (col < this.columns) {
            try {
              this.drawCell(col, row, true);
            } catch (e) {
              console.log(e, col, row, this.columns, this.rows, this.actualState.age[col])
              this.running = false;
            }
          }
        }
      } 
    }
  }


  /**
   * setNoGridOn
   */
  setNoGridOn () {
    this.cellSize = this.zoom.cellSize + 1;
    this.cellSpace = 0;
  }


  /**
   * setNoGridOff
   */
  setNoGridOff () {
    this.cellSize = this.zoom.cellSize;
    this.cellSpace = 1;
  }


  /**
   * drawCell
   */
  drawCell (i, j, alive) {   

    if (alive) {
      this.context.fillStyle = this.colors.alive[this.actualState.age[i][j] % this.colors.alive.length];

    } else {
      this.context.fillStyle = this.colors.dead;
    }
    
    // this.context.fillRect(this._processXCoord(i), this._processYCoord(j), this.cellSize, this.cellSize);
    let iPos = this.cellSpace + (this.cellSpace * i) + (this.cellSize * i) + this.cellSize/2;
    let jPos = this.cellSpace + (this.cellSpace * j) + (this.cellSize * j) + this.cellSize/2;
    this.context.beginPath();
    this.context.arc(iPos, jPos, this.cellSize/2, 0, 2 * Math.PI);
    this.context.fill();
  }

  flashInsertionPoint() {
    if (this.insPointCounter < 40) {
      this._drawInsertionPoint(true);
    } else if (this.insPointCounter < 60) {
      this._drawInsertionPoint(false);
    } else {
      this.insPointCounter = 0;
    }

    this.insPointCounter++;

    if (!this.running) { 
      requestAnimationFrame(this.flashInsertionPoint.bind(this));
    }
  }

  _drawInsertionPoint (on) {
    let x = this._processXCoord(this._getLastInsertionPoint()),
        y = this._processYCoord(this._getLastLine() - this.leading/4),
        width = this.cellSize / 2,
        height = ((this.lineHeight - this.leading/2) * this.cellSpace) + ((this.lineHeight - this.leading/2) * this.cellSize);

        // console.log(x,y,width, height)
    this.context.fillStyle = on ? this.colors.ipColor : this.colors.dead;
    this.context.fillRect(x, y, width, height);
  }


  /** ****************************************************************************************************************************
   *
   */


  /**
   * 
   */
  addSpace () {
    let newPoint = this._getLastInsertionPoint() + 7;
    this.insertionPoints.push(newPoint)
    this.currentWord = [];
  }

  carriageReturn () {
    this.insertionPoints.push(this.marginLeft)
    this.line += 1;
    this.currentWord = [];
  }

  typeLetter (ltr) {
    try {

      if (this.willBumpToNewLine(ltr)) {
        for (let i = 0; i < this.currentWord.length; i++) {
          this.deleteLetter()  
        } 

        this.line = this.line + 1;
        this.insertionPoints.push(this.marginLeft);

        for (let i = 0; i < this.currentWord.length; i++) {
          this.addString(this.currentWord[i]);
        }
      } 

      this.addString(ltr);
      this.currentWord.push(ltr);
    } catch (e) {
      console.log(e, ltr);
    }
  }

  /**
   * 
   */

  addString (str) {
    var code, i, j, k, x, y;

    code = JSON.parse(str.code);

    for (i = 0; i < code.length; i++) {
      for (k in code[i]) {
        for (j = 0 ; j < code[i][k].length ; j++) {
          x = code[i][k][j] + this._getLastInsertionPoint();

          y = parseInt(k, 10) + this.marginTop + this.line*this.lineHeight+(this.lineHeight-code.length);

          this.actualState.addCell(x, y);
        }
      }
    }


    let newPoint = this._getLastInsertionPoint() + str.width + this.letterSpacing;
    this.insertionPoints.push(newPoint);
  }

  deleteLetter () {
    var row;
    
    var xymax = this._trimInsertionPoints();
    
    if (xymax[2] == this.marginLeft) {
      this.line--;
      
      xymax = this._trimInsertionPoints();
    }

    for (let i = xymax[1]; i <= this.actualState.highestRow; i++) {
      for (let j = xymax[0]; j <= xymax[2]; j++) {
        if (i in this.actualState.cells && this.actualState.cells[i].has(j)) {
          this.actualState.removeCell(i,j);
        }
      }
    }
  }

  willBumpToNewLine (str) {
    return this._getLastInsertionPoint()+str.width > this.columns - this.marginLeft
  }

  _trimInsertionPoints () {
    let xMax = this.insertionPoints.pop();

    return [this._getLastInsertionPoint() - this.letterSpacing, this._getLastLine(), xMax];
  }

  _getLastInsertionPoint () {
    return this.insertionPoints[this.insertionPoints.length - 1];
  }

  _getLastLine () {
    return this.line*this.lineHeight+this.marginTop+this.leading;
  }

  _processXCoord (x) {
    return this.cellSpace + (this.cellSpace * x) + (this.cellSize * x);
  }

  _processYCoord (y) {
    return this.cellSpace + (this.cellSpace * y) + (this.cellSize * y);
  }

}

