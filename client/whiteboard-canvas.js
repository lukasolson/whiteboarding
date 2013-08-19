function WhiteboardCanvas(canvas, socket, id) {
	this.canvas = canvas;
	this.context = canvas.getContext("2d");
	this.context.lineCap = "round";
	this.setContextProperties({
		width: 10,
		color: "#e74c3c"
	});
	this.socket = socket;
	this.linesCount = 0;
	this.touchLineMap = {};

	_.bindAll(
		this, "setWhiteboard", "drawPolyline",
		"onTouchStart", "onTouchMove", "onTouchEnd",
		"onMouseDown", "onMouseMove", "onMouseUp"
	);

	if (id) {
		socket.emit("joinWhiteboard", id, this.setWhiteboard);
	} else {
		socket.emit("createWhiteboard", null, this.setWhiteboard);
	}

	socket.on("drawStart", this.drawPolyline);
	socket.on("draw", this.drawPolyline);

	canvas.onmousedown = this.onMouseDown;
	canvas.onmouseup = this.onMouseUp;
	canvas.ontouchstart = this.onTouchStart;
	canvas.ontouchmove = this.onTouchMove;
	canvas.ontouchend = this.onTouchEnd;
}

WhiteboardCanvas.prototype = {
	setContextProperties: function (properties) {
		if ("width" in properties) this.context.lineWidth = properties.width;
		if ("color" in properties) this.context.strokeStyle = this.context.fillStyle = properties.color;
	},

	setWhiteboard: function (whiteboard) {
		this.whiteboard = whiteboard;
		window.location.hash = whiteboard.id;
		this.draw();
	},

	draw: function () {
		this.context.clearRect(0, 0, this.canvas.offsetWidth, this.canvas.offsetHeight);
		for (var socketId in this.whiteboard.polylinesMap) {
			var polylines = this.whiteboard.polylinesMap[socketId];
			for (var id in polylines) {
				this.drawPolyline(polylines[id]);
			}
		}
	},

	drawPolyline: function (polyline) {
		this.context.save();
		this.setContextProperties(polyline);
		var points = polyline.points;

		if (points.length === 1) {
			this.drawCircle(points[0].x, points[0].y, polyline.width / 2);
		} else {
			this.drawLine(points);
		}
		this.context.restore();
	},

	drawCircle: function (x, y, radius) {
		this.context.beginPath();
		this.context.arc(x, y, radius, 0, Math.PI * 2, false);
		this.context.fill();
	},

	drawLine: function (points) {
		this.context.beginPath();
		this.context.moveTo(points[0].x, points[0].y);
		for (var j = 1; j < points.length; j++) {
			this.context.lineTo(points[j].x, points[j].y);
		}
		this.context.stroke();
	},

	onTouchStart: function (e) {
		e.preventDefault();
		for (var i = 0; i < e.changedTouches.length; i++) {
			var touch = e.changedTouches[i],
				polyline = {
					id: touch.identifier,
					color: this.context.strokeStyle,
					width: this.context.lineWidth,
					points: [{
						x: touch.pageX,
						y: touch.pageY
					}]
				};
			this.touchLineMap[touch.identifier] = polyline;
			this.drawCircle(touch.pageX, touch.pageY, this.context.lineWidth / 2);
			this.socket.emit("drawStart", polyline);
		}
	},

	onTouchMove: function (e) {
		e.preventDefault();
		for (var i = 0; i < e.changedTouches.length; i++) {
			var touch = e.changedTouches[i],
				point = {
					x: touch.pageX,
					y: touch.pageY
				};
			var polyline = this.touchLineMap[touch.identifier];
			polyline.points.push(point);
			this.drawLine(polyline.points.slice(polyline.points.length - 2));
			this.socket.emit("draw", {
				polylineId: polyline.id,
				point: point
			});
		}
	},

	onTouchEnd: function (e) {
		e.preventDefault();
		for (var i = 0; i < e.changedTouches.length; i++) {
			delete this.touchLineMap[e.changedTouches[i].identifier];
		}
	},

	onMouseDown: function (e) {
		this.linesCount++
		this.onTouchStart(this.wrapMouseEvent(e));
		this.canvas.onmousemove = this.onMouseMove;
	},

	onMouseMove: function (e) {
		this.onTouchMove(this.wrapMouseEvent(e));
	},

	onMouseUp: function (e) {
		this.onTouchEnd(this.wrapMouseEvent(e));
		this.canvas.onmousemove = null;
	},

	wrapMouseEvent: function(e) {
		e.changedTouches = [{
			pageX: e.pageX,
			pageY: e.pageY,
			identifier: this.linesCount
		}];
		return e;
	}
};