var app = require("http").createServer(),
	io = require("socket.io").listen(app),
	HashGenerator = require("./hash-generator");

app.listen(1113);
io.set("log level", 1);

var whiteboardsMap = {};
io.sockets.on("connection", function (socket) {
	var whiteboard = null;

	var createWhiteboard = function (dimensions, callback) {
		var id = HashGenerator.generateHash(4);
		whiteboardsMap[id] = {id: id, polylinesMap: {}, width: dimensions.width, height: dimensions.height};
		joinWhiteboard(id, callback);
	};

	var joinWhiteboard = function(id, callback) {
		if (!(id in whiteboardsMap)) return callback(null);
		whiteboard = whiteboardsMap[id];
		whiteboard.polylinesMap[socket.id] = {};
		socket.join(id);
		callback(whiteboard);
	};

	socket.on("createWhiteboard", createWhiteboard);

	socket.on("joinWhiteboard", joinWhiteboard);

	socket.on("drawStart", function (polyline) {
		whiteboard.polylinesMap[socket.id][polyline.id] = polyline;
		socket.broadcast.to(whiteboard.id).emit("drawStart", polyline);
	});

	socket.on("draw", function (data) {
		var polyline = whiteboard.polylinesMap[socket.id][data.polylineId];
		polyline.points.push(data.point);
		socket.broadcast.to(whiteboard.id).emit("draw", {
			color: polyline.color,
			width: polyline.width,
			points: polyline.points.slice(polyline.points.length - 2)
		});
	});
});