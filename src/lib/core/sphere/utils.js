export function getRandomColor() {
  /*
  this function is use to create a random color for better visualization
  */
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
  color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
  }

export function hexToRgbA(hex){
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return [((c>>16)&255)/256, ((c>>8)&255)/256, (c&255)/256].map(x=> x.toFixed(5))
    }
    throw new Error('Bad Hex');
}

export function norm(val, max, min) { return (val - min) / (max - min); }

export function levelColor(levels){
  var colorArray = []
  for (var i = 0; i < levels; i++) {
    colorArray.push(hexToRgbA(getRandomColor()))
  }
  return colorArray
}


export function getRandomRGBColor() {
  var r, g, b;
  
  do {
    r = Math.floor(Math.random() / 256); // Random value for red (0-255)
    g = Math.floor(Math.random() / 256); // Random value for green (0-255)
    b = Math.floor(Math.random() / 256); // Random value for blue (0-255)
  } while (r === 255 && g === 255 && b === 255); // Repeat if the color is white
  
  return [r,g,b];
}