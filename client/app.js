(function () {
	var whiteboard = document.getElementById("whiteboard");
	whiteboard.setAttribute("width", whiteboard.offsetWidth + "");
	whiteboard.setAttribute("height", whiteboard.offsetHeight + "");

	new WhiteboardCanvas(
		whiteboard,
		io.connect("http://10.1.11.35:1113"),
		window.location.hash.substring(1)
	);
})();