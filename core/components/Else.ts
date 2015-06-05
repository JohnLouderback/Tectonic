declare var App;
export class Else extends App.Element {
	constructor(e?) {
		super(e);
	}

	public update(ifVal: boolean) {
		var element = this.el;
		if (!ifVal) {
			element.style.display = 'block'
		} else {
			element.style.display = 'none'
		}
	}
}