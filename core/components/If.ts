declare var App;
export class If extends App.Element{
	constructor(e?) {
		super(e);
		var element = this.el;
		this.subscribeAttrToModelPath('condition', function(value){
			var val = App.Utils.castStringToType(value);
			if (val) {
				element.setAttribute('evaluates-to', 'true');
				element.style.display = 'block';
			} else {
				element.setAttribute('evaluates-to', 'false');
				element.style.display = 'none';
			}
			var nextSibling = element.nextElementSibling;
			var nextTagName = nextSibling.tagName;
			if(typeof nextSibling !== 'undefined' && typeof nextTagName !== 'undefined' && nextTagName.toLowerCase() === 'app-else' && typeof nextSibling['__controller'] !== 'undefined') {
				nextSibling['__controller'].update(App.Utils.castStringToType(element.getAttribute('evaluates-to')));
			}
		});
	}
}