
var tableDiv = document.getElementById("table-div");
var handle = document.getElementById("resize-handle");
var cwFrame = document.getElementById("cw-frame");
var cwGrid = {};
var cwSqares = [];

var resizeOn = false;
var buttons;

makeDraggable(tableDiv, cwFrame, true);
makeResizer(tableDiv, handle, true);

//Add listener to ctrl panel buttons
var prevState = null;
document.forms.radioForm.addEventListener("change", function (e) {
  //end previous mode
  switch (prevState?.value) {
    case "cell-resize":
      console.log("end cell-resize mode");
      cwFrame.onclick = null;
      break;
    case "black-sqrs":
      console.log("end black-sqrs mode");
      blackingSquares(false);
      break;
    case "move":
    default:
      console.log("end move mode");
      makeDraggable(null, cwFrame, false);
      makeResizer(null, handle, false)
      document.getElementById("top-row").onmousedown = null;
      break;
  }

  //start new mode
  switch (e.target?.value) {
    case "move":
      console.log("start move mode");
      makeDraggable(tableDiv, cwFrame, true);
      makeResizer(tableDiv, handle, true);
      break;
    case "cell-resize":
      console.log("start cell-resize mode");
      startCellSizing();
      break;
    case "black-sqrs":
      console.log("start black-sqrs mode");
      blackingSquares(true);
      break;
    case "solve":
      console.log("start solve mode");
      startSolving();
      break;
  }

  prevState = e.target;
})

function startSolving() {

  document.getElementById("btn-frame").style.visibility = "hidden";
  cwFrame.style.backgroundColor = "rgba(0,0,0,0)";//}*** replace with class change
  cwFrame.style.cursor = "text";                  //}

  class cDirection {
    x; y;

    constructor(x, y) {
      this.x = x;
      this.y = y;
    }

    static get rtl() { return new cDirection(-1, 0); }
    static get ltr() { return new cDirection(1, 0); }
    static get ttb() { return new cDirection(0, 1); }
    static get btt() { return new cDirection(0, -1); }
    static get horizontal() { return this.rtl; }

    get isHorizontal() {
      return this.y == 0;
    }

    equals(other) {
      return this.x == other.x && this.y == other.y;
    }

    /**
     * 
     * @returns 
     */
    swich() {
      if (this.isHorizontal)
        return this.constructor.ttb;
      else
        return this.constructor.horizontal;
    }

    /**
     * Get an inverted version of it.
     * @returns a new cDirection object of the opposite direction.
     */
    get inverted() {
      return new cDirection(0 - this.x, 0 - this.y);
    }
  }

  var typeDirection = cDirection.rtl;
  var wordCells = [];
  var focusedCell;

  //add event handlers to the cells
  for (let i = 0; i < cwSqares.length; i++) {
    for (let j = 0; j < cwSqares[i].length; j++) {
      var cell = cwSqares[i][j];
      cell.y = i;
      cell.x = j;
      cell.onclick = cellClicked;
      cell.addEventListener("keyup", keyTyped);
    }
  }

  function cellClicked(e, cell) {
    var thisCell = e?.target ?? cell;
    if (thisCell.isBlack)
      return;

    //if this cell has already been selected, change typing direction
    if (thisCell == focusedCell) {
      setTypeDirection(typeDirection.swich());
    } else {
      setFocus(thisCell);
      setTypeDirection(cDirection.horizontal);
      hiliteWordCells();
      if (wordCells.length == 1)
        setTypeDirection(cDirection.ttb)
    }
  }

  function keyTyped(e) {
    var keyValue = e.key;

    const abc = "אבגדהוזחטיכלמנסעפצקרשת";
    const suffixes = "ךםןץף";
    const UP = cDirection.btt;
    const DOWN = cDirection.ttb;
    const LEFT = cDirection.rtl;
    const RIGHT = cDirection.ltr;
    const HORIZ = cDirection.horizontal;

    const dirMap = {
      "ArrowUp": { moveDir: UP, typeDir: DOWN },
      "ArrowDown": { moveDir: DOWN, typeDir: DOWN },
      "ArrowLeft": { moveDir: LEFT, typeDir: HORIZ },
      "ArrowRight": { moveDir: RIGHT, typeDir: HORIZ }
    }

    //arrow keys
    if (dirMap.hasOwnProperty(keyValue)) {
      if (!typeDirection.equals(dirMap[keyValue].typeDir))
        setTypeDirection(dirMap[keyValue].typeDir)
      else
        moveFocus(dirMap[keyValue].moveDir)
    }

    //letters
    else if (abc.indexOf(keyValue) >= 0) {
      e.target.innerText = e.key;
      e.target.style.color = "black";
      var next = getNextCell(e.target, typeDirection);
      if (next) {
        setFocus(next);
      }
    }

    else if (keyValue == "Delete") {
      clearCell(focusedCell);
    }

    else if (keyValue == "Backspace") {
      if (hasLetter(focusedCell)) {
        clearCell(focusedCell);
        moveOneCellBack();
      } else {
        moveOneCellBack();
        clearCell(focusedCell);
      }
    }
  }

  function hasLetter(cell) {
    return cell.innerText != ".";
  }

  function clearCell(cell) {
    cell.innerText = ".";
    cell.style.color = "rgba(0,0,0,0)"
  }

  function setTypeDirection(direction) {
    //remove previous hilite if exists
    wordCells.forEach(function (value) {
      value.classList.remove("hilite");
    });

    typeDirection = direction;

    //hilite the current word
    do {
      wordCells = [];
      var cellPtr = focusedCell;
      var aCell;
      wordCells.push(focusedCell);
      focusedCell.classList.add("hilite");
      //go backwards to word's start
      while (aCell = getNextCell(cellPtr, typeDirection.inverted), aCell && !aCell.isBlack) {
        cellPtr = aCell;
        aCell.classList.add("hilite");
        wordCells.push(aCell);
      }
      //now go forward to end
      cellPtr = focusedCell;
      while (aCell = getNextCell(cellPtr, typeDirection), aCell && !aCell.isBlack) {
        cellPtr = aCell;
        aCell.classList.add("hilite");
        wordCells.push(aCell);
      }
    } while (wordCells.length == 1 && (typeDirection = typeDirection.swich()));
  }

  function moveFocus(direction) {
    var next = getNextCell(focusedCell, direction);
    if (next) {
      setFocus(next);
    }
  }


  function setFocus(cell) {
    if (cell.isBlack)
      return;
    //what if cell is not in the hilited word?
    focusedCell = cell;
    cell.focus();
  }

  function moveOneCellBack() {
    moveFocus(typeDirection.inverted);
  }

  /**
   * Find an adjacent cell
   * @param {*} baseCell The cell whose neighbour we seek
   * @param {*} direction The direction we want to go from the base cell
   * @returns a reference to the adjacent cell or null if it's black or does not exist.
   */
  function getNextCell(baseCell, direction) {
    var x = baseCell.x + direction.x;
    var y = baseCell.y + direction.y;
    if (y < 0
      || y >= cwSqares.length
      || x < 0
      || x >= cwSqares[y].length)
      return null;
    var nextCell = cwSqares[y][x];
    if (nextCell.isBlack)
      return null;
    return nextCell;
  }
}

function blackingSquares(on) {
  cwFrame.style.cursor = "pointer";
  var rows = cwGrid.children;
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var cells = row.children;
    cwSqares[i] = [];
    for (var j = 0; j < cells.length; j++) {

      var cell = cells[j];
      cwSqares[i][j] = cell;
      cell.classList.add("cw-cell");

      if (on) {
        cell.onclick = function () {
          if (this.style.backgroundColor === "") {
            this.style.backgroundColor = "black";
            this.isBlack = true;
          }
          else {
            this.style.backgroundColor = "";
            this.isBlack = false;
          }
        }
      } else {
        cell.onclick = null;
      }
    }
  }
}

function makeDraggable(dragged, handle, on) {
  var old_X = 0, old_Y = 0, xDiff = 0, yDiff = 0;
  if (on) {
    handle.style.cursor = "grab";
    handle.onmousedown = startDrag;
  }
  else {
    handle.onmousedown = null;
  }

  function startDrag(e) {
    if (resizeOn)
      return;
    e.preventDefault();
    // get the mouse position at startup:
    old_X = e.clientX;
    old_Y = e.clientY;
    document.onmousemove = drag;
    document.onmouseup = endDrag;
  }

  function drag(e) {
    e.preventDefault();
    // calculate position differences:
    xDiff = old_X - e.clientX;
    yDiff = old_Y - e.clientY;
    old_X = e.clientX;
    old_Y = e.clientY;
    // set the element's new position:
    dragged.style.top = (dragged.offsetTop - yDiff) + "px";
    dragged.style.left = (dragged.offsetLeft - xDiff) + "px";
  }

  function endDrag() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function startCellSizing(e) {
  handle.style.display = "none";
  cwFrame.style.cursor = "crosshair";
  cwFrame.onclick = drawGrid; //preDrawGrid;
}

function preDrawGrid(e) {
  cwFrame.onclick = drawGrid;
}

function drawGrid(e) {
  let clickPos_x = e.clientX - cwFrame.getBoundingClientRect().left;
  let clickPos_y = e.clientY - cwFrame.getBoundingClientRect().top;
  let divHeight = cwFrame.offsetHeight;
  let divWidth = cwFrame.offsetWidth;
  let horizCellCount = Math.round(divWidth / clickPos_x);
  let vertiCellCount = Math.round(divHeight / clickPos_y);


  cwGrid = document.getElementById("theGrid");
  if (cwGrid) cwFrame.removeChild(cwGrid);

  cwGrid = document.createElement('div');
  cwGrid.classList.add("grid-outer");
  cwGrid.id = "theGrid";
  for (var i = 0; i < vertiCellCount; i++) {
    var row = document.createElement('div');
    row.classList.add('grid-row');
    var hite = "calc(" + 100 / vertiCellCount + "% - 2px)";//
    row.style.height = hite;
    for (var j = 0; j < horizCellCount; j++) {
      let cell = document.createElement('div');
      cell.classList.add("grid-cell");
      cell.tabIndex = "" + (i * horizCellCount + j);
      cell.innerText = ".";
      cell.style.color = "rgba(0,0,0,0)";
      row.appendChild(cell);
    }
    cwGrid.appendChild(row);
  }
  cwFrame.appendChild(cwGrid);
  cwGrid.style.fontSize = cwFrame.height / vertiCellCount * 0.4;
}

/**
 * Enables one HTML element be resized by dragging another.
 * 
 * @param {string} resizedId the id of the elemnt be resized
 * @param {string} handleId  the id of the element to be dragged for resizing
 */
function makeResizer(mainDiv, handle, on) {
  handle.style.display = "block";
  cwFrame.removeChild(handle);
  cwFrame.appendChild(handle);

  var xDiff = 0, yDiff = 0, old_x = 0, old_y = 0;
  if (on) {
    handle.onmousedown = startResize;
    handle.style.display = "block";
  }
  else {
    handle.onmousedown = null;
    handle.style.display = "none";
  }

  function startResize(e) {
    e.preventDefault();
    resizeOn = true;
    mainDiv.on
    old_x = e.clientX;
    old_y = e.clientY;
    document.onmouseup = endResize;
    document.onmousemove = resize;
  }

  function resize(e) {
    e.preventDefault();
    // calculate the new cursor position:
    xDiff = old_x - e.clientX;
    yDiff = old_y - e.clientY;
    old_x = e.clientX;
    old_y = e.clientY;
    // set the element's new size:
    var newHeight = (mainDiv.offsetHeight - yDiff) + "px";
    mainDiv.style.height = newHeight;
    mainDiv.style.minHeight = newHeight;
    mainDiv.style.width = (mainDiv.offsetWidth - xDiff) + "px";
  }

  function endResize(e) {
    resizeOn = false;
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

