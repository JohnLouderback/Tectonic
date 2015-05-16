declare var Gui;

export class Element {

	public static registered: boolean = false;
	public static el: HTMLElement;
	public el: HTMLElement;

	constructor(el?) {
		if(!Gui[this.getClassName()].registered) {
			this.register();
		}
		if (!el) {
			this.el = new Gui[this.getClassName()].el;
		} else {
			this.el = el;
		}
		this.el['__controller'] = this;
		this.el.setAttribute('uuid', 'test');
	}

	protected getClassName() {
		//var funcNameRegex = /function (.{1,})\(/; // This is for ES5 and ES3 Builds
		var funcNameRegex = /class (.*?)\s*?\{/; //This is for ES6 Builds
		var results = (funcNameRegex).exec(this["constructor"].toString());
		return (results && results.length > 1) ? results[1] : "";
	}

	protected register(): void {
		if (!Gui[this.getClassName()].registered) {

			Gui[this.getClassName()].registered = true;

			var guiElement = this;
			var document:any = window.document;

			Gui[this.getClassName()].el = document.registerElement('gui-' + this.getClassName().toLowerCase(), {
				prototype: Object.create(HTMLElement.prototype, {
					createdCallback: {
						value: function() {
							if (typeof this['__controller'] === 'undefined' || !this['__controller']) {
								this['__controller'] = new Gui[guiElement.getClassName()](this);
							}

							var shadow = this.createShadowRoot();

							var observer = new MutationSummary({
								callback: function (summaries) {
									Gui.Dom.templateFinder(summaries);
								},
								queries : [{
									all: true
								}],
								rootNode: shadow
							});
							shadow.innerHTML = "<content></content><b>I'm in the element's ${Gui.model.test} Shadow DOM!</b>";
						}
					},
					attributeChangedCallback: function() {

					}
				})
			});
		}
	}

}