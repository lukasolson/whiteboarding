(function () {
	new WhiteboardCanvas(
		document.getElementById("whiteboard"),
		io.connect("http://10.1.11.35:1113"),
		window.location.hash.substring(1)
	);
})();