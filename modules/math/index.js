
Math.sq = function(a) {
	return a*a;
}

Math.constrain = function(amt, low, high) {
  return (amt < low) ? low : ((amt > high) ? high : amt);
}

Math.degrees = function(radians) {
  return radians * (180/Math.PI);
}


Math.radians = function(degrees) {
	return degrees*(Math.PI/180);
}

Math.mag = function(a, b) {
  return Math.sqrt(a*a + b*b);
}

Math.dist = function(x1, y1, x2, y2) {
  return Math.sqrt(Math.sq(x2-x1) + Math.sq(y2-y1));
}

Math.lerp = function(start, stop, amt) {
  return start + (stop-start) * amt;
}

Math.norm = function(value, start, stop) {
  return (value - start) / (stop - start);
}

Math.map = function (value, istart, istop, ostart, ostop) {
	return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
}
