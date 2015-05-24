declare var App;
export class Print extends Element{
	constructor(e?) {
		super(e);
		var element = this.el;
		this.subscribeAttrToModelPath('value', function(value){
			element.innerHTML = value;
		});
	}
}