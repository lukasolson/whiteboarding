exports.generateHash = function (length) {
	var alphanums = "abcdefghijklmnopqrstuvwxyz";
	alphanums += alphanums.toUpperCase() + "0123456789";

	var hash = "";
	for (var i = 0; i < length; i++) {
		hash += alphanums.charAt(Math.floor(Math.random() * alphanums.length));
	}
	return hash;
};