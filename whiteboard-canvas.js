function WhiteboardCanvas(canvas, socket, id) {
	this.canvas = canvas;
	this.context = canvas.getContext("2d");
	this.socket = socket;
	this.linesCount = 0;
	this.touchLineMap = {};

	_.bindAll(
		this, "setWhiteboard", "drawPolyline",
		"onTouchStart", "onTouchMove", "onTouchEnd",
		"onDrawStart", "onDraw", "onDrawEnd"
	);

	socket.emit("joinWhiteboard", id, _.bind(function (whiteboard) {
		if (whiteboard) {
			this.setWhiteboard(whiteboard);
		} else {
			socket.emit("createWhiteboard", this.getWorkspaceDimensions(), this.setWhiteboard);
		}
	}, this));

	socket.on("drawStart", this.drawPolyline);
	socket.on("draw", this.drawPolyline);

	canvas.onmousedown = this.onDrawStart;
	canvas.onmouseup = this.onDrawEnd;
	canvas.ontouchstart = this.onTouchStart;
	canvas.ontouchmove = this.onTouchMove;
	canvas.ontouchend = this.onTouchEnd;
}

WhiteboardCanvas.prototype = {
	setContextProperties: function (properties) {
		if ("width" in properties) this.context.lineWidth = properties.width;
		if ("color" in properties) this.context.strokeStyle = this.context.fillStyle = properties.color;
	},

	getWorkspaceDimensions: function () {
		return {
			width: window.innerWidth - 16 /* margin */ - ($(this.canvas).outerWidth() - $(this.canvas).width()),
			height: window.innerHeight - $("header").outerHeight(true) - ($(this.canvas).outerHeight(true) - $(this.canvas).height())
		};
	},

	setWhiteboard: function (whiteboard) {
		this.whiteboard = whiteboard;
		window.location.hash = whiteboard.id;
		this.resize();
		this.draw();
	},

	resize: function () {
		var $canvas = $(this.canvas).attr("width", this.whiteboard.width).attr("height", this.whiteboard.height);

		var aspectRatio = this.whiteboard.width / this.whiteboard.height,
			dimensions = this.getWorkspaceDimensions(),
			trueAspectRatio = dimensions.width / dimensions.height;

		if (trueAspectRatio > aspectRatio) {
			$canvas.height(dimensions.height).width(aspectRatio * dimensions.height);
		} else {
			$canvas.width(dimensions.width).height(dimensions.width / aspectRatio);
		}
		this.offset = $canvas.offset();
		this.zoomLevel = $canvas.width() / this.whiteboard.width;

		this.setContextProperties({
			width: 10,
			color: "#e74c3c"
		});
		this.context.lineCap = "round";
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
			this.onDrawStart(e.changedTouches[i]);
		}
	},

	onTouchMove: function (e) {
		e.preventDefault();
		for (var i = 0; i < e.changedTouches.length; i++) {
			this.onDraw(e.changedTouches[i]);
		}
	},

	onTouchEnd: function (e) {
		e.preventDefault();
		for (var i = 0; i < e.changedTouches.length; i++) {
			this.onDrawEnd(e.changedTouches[i]);
		}
	},

	onDrawStart: function (e) {
		this.linesCount++;
		var polyline = {
			id: e.identifier || this.linesCount,
			color: this.context.strokeStyle,
			width: this.context.lineWidth,
			points: [{
				x: this.adjustX(e.pageX),
				y: this.adjustY(e.pageY)
			}]
		};
		this.touchLineMap[e.identifier || this.linesCount] = polyline;

		this.drawCircle(
			this.adjustX(e.pageX),
			this.adjustY(e.pageY),
			this.context.lineWidth / 2
		);
		this.socket.emit("drawStart", polyline);

		this.canvas.onmousemove = this.onDraw;
	},

	onDraw: function (e) {
		var point = {
			x: this.adjustX(e.pageX),
			y: this.adjustY(e.pageY)
		};
		var polyline = this.touchLineMap[e.identifier || this.linesCount];
		polyline.points.push(point);

		this.drawLine(polyline.points.slice(polyline.points.length - 2));
		this.socket.emit("draw", {
			polylineId: polyline.id,
			point: point
		});
	},

	onDrawEnd: function (e) {
		delete this.touchLineMap[e.identifier || this.linesCount];
		this.canvas.onmousemove = null;
	},

	adjustX: function (x) {
		return (x - this.offset.left) / this.zoomLevel;
	},

	adjustY: function (y) {
		return (y - this.offset.top) / this.zoomLevel;
	}
};