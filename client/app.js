(function () {
	new WhiteboardCanvas(
		document.getElementById("whiteboard"),
		io.connect("http://localhost:1113"),
		window.location.hash.substring(1)
	);
})();