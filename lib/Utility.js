class Utility {

  //utility functions
	static splitValue(value, index) {
		var arr = [value.substring(0, index), value.substring(index)];
		return arr;
	}

	static splitRange(value, start, length) {
		var arr = [value.substring(0, start), value.substring(start, start + length), value.substring(start + length)];
		return arr;
	}
}
export default Utility;
