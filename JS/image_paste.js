var CLIPBOARD = new CLIPBOARD_CLASS("cw-img-canvas", true);

/**
 * image pasting into canvas
 * 
 * @param {string} canvas_id - canvas id
 * @param {boolean} autoresize - if canvas will be resized
 */


function CLIPBOARD_CLASS(canvas_id, autoresize) {

  var _self = this;
  var canvas = document.getElementById(canvas_id);
  var ctx = document.getElementById(canvas_id).getContext("2d");

  //handlers
  document.addEventListener('paste', function (e) { _self.paste_auto(e); }, false);

  //on paste
  this.paste_auto = function (e) {
    if (e.clipboardData) {
      var items = e.clipboardData.items;
      if (!items) return;

      //access data directly
      var is_image = false;
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          //image
          var blob = items[i].getAsFile();
          var URLObj = window.URL || window.webkitURL;
          var source = URLObj.createObjectURL(blob);
          this.paste_createImage(source);
          is_image = true;
        }
      }
      if (is_image == true) {
        e.preventDefault();
      }
    }
  };

  //draw pasted image to canvas
  this.paste_createImage = function (source) {
    var pastedImage = new Image();
    pastedImage.onload = function () {
      if (autoresize == true) {
        //resize
        canvas.width = pastedImage.width;
        canvas.height = pastedImage.height;
      }
      else {
        //clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(pastedImage, 0, 0);
    };
    pastedImage.src = source;
  };
}

function loadImage() {
  var input, file, fr, img;

  if (typeof window.FileReader !== 'function') {
    write("The file API isn't supported on this browser yet.");
    return;
  }

  input = document.getElementById('imgfile');
  if (!input) {
    write("Couldn't find the imgfile element.");
  }
  else if (!input.files) {
    write("This browser doesn't seem to support the `files` property of file inputs.");
  }
  else if (!input.files[0]) {
    write("Please select a file before clicking 'Load'");
  }
  else {
    file = input.files[0];
    fr = new FileReader();
    fr.onload = createImage;
    fr.readAsDataURL(file);
  }

  function createImage() {
    img = new Image();
    img.onload = imageLoaded;
    img.src = fr.result;
  }

  function imageLoaded() {
    var canvas = document.getElementById("canvas")
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    alert(canvas.toDataURL("image/png"));
  }

  function write(msg) {
    var p = document.createElement('p');
    p.innerHTML = msg;
    document.body.appendChild(p);
  }
}
