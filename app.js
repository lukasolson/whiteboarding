(function () {
	new WhiteboardCanvas(
		document.getElementById("whiteboard"),
		io.connect("http://askullsoon.com:1113"),
		window.location.hash.substring(1)
	);
})();
