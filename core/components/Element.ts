declare var App;

export interface SubscribedAttribute {
	attribute: string;
	subscribedModelPaths: Array<string>;
}

export class Element {

	public static registered: boolean = false;
	public static el: HTMLElement;
	public el: HTMLElement;
	public subscribedAttrs: Array<SubscribedAttribute> = [];

	constructor(el?) {
		if(!App[this.getClassName()].registered) {
			this.register();
		}
		if (!el) {
			this.el = new App[this.getClassName()].el;
		} else {
			this.el = el;
		}
		this.el['__controller'] = this;
	}

	protected subscribeAttrToModelPath(attribute: string, callback: Function) {
		var index = 0;
		var el = this.el;
		var regexForModelPaths = new RegExp(App.regexForModelPaths, 'g');
		var expression = el.getAttribute(attribute);
		var subscribedAttribute:SubscribedAttribute = {
			attribute           : attribute,
			subscribedModelPaths: []
		};
		var modelPaths: Array<string>;
		while ((modelPaths = regexForModelPaths.exec(expression)) !== null) {
			var modelPath = modelPaths[3].trim();
			subscribedAttribute.subscribedModelPaths.push(modelPath);
			if (typeof App.subscribedElementsToModelMap.get(modelPath) === 'undefined') {
				App.subscribedElementsToModelMap.set(modelPath, []);
			}

			// If this element is not in the subscribed map.
			if (!App.subscribedElementsToModelMap.get(modelPath).some(function (value:SubscribedElement) {
				if (value.element === el) {
					// If we find the element, check to see if it has this attribute already
					if (!value.attributes.some(function (attr) {
							// If this attribute exists already
							if (attr.attribute === attribute) {
								attr.callbacks.push(callback); // Then push the additional callback
								return true
							}
						})) {
						// If this attribute does not exist for the current element, add it
						value.attributes.push({
							attribute : attribute,
							expression: expression,
							callbacks : [callback]
						});
					}
					return true;
				}
			})) {
				// If this element is not in the subscribed map...
				var subscribedElement:SubscribedElement = {
					element   : el,
					attributes: [{
						attribute : attribute,
						expression: expression,
						callbacks : [callback]
					}]
				};
				// Push it
				App.subscribedElementsToModelMap.get(modelPath).push(subscribedElement);
			}
		}
		// And push it to this element's list of subscribed attributes
		this.subscribedAttrs.push(subscribedAttribute);
		// Set initial value
		App.Utils.Observe.updateSubscribedElements(App.subscribedElementsToModelMap, modelPath);
	}

	/*protected updateSubscribedAttr(attribute: string) {
		var el = this.el;
		this.subscribedAttrs.some(function(subscribedAttribute: SubscribedAttribute) {
			if (subscribedAttribute.attribute === attribute) {
				App.subscribedElementsToModelMap.get(subscribedAttribute.subscribedModelPath).some(function(subscribedElement: SubscribedElement) {
					if(subscribedElement.element === el) {
						// TODO: finish this function.
						return true;
					}
				});
				return true;
			}
		});
	}*/

	protected getClassName(): string {
		var funcNameRegex = /function (.{1,})\(/; // This is for ES5 and ES3 Builds
		//var funcNameRegex = /class (.*?)\s*?\{/; //This is for ES6 Builds
		var results = (funcNameRegex).exec(this["constructor"].toString());
		return (results && results.length > 1) ? results[1] : "";
	}

	public register(): void {
		if (!App[this.getClassName()].registered) {

			App[this.getClassName()].registered = true;

			var guiElement = this;
			var document:any = window.document;

			App[this.getClassName()].el = document.registerElement('app-' + this.getClassName().toLowerCase(), {
				prototype: Object.create(HTMLElement.prototype, {
					createdCallback: {
						value: function() {
							if (typeof this['__controller'] === 'undefined' || !this['__controller']) {
								this['__controller'] = new App[guiElement.getClassName()](this);
							}

							var shadow = this.createShadowRoot();

							var observer = new MutationSummary({
								callback: function (summaries) {
									App.Dom.templateFinder(summaries);
								},
								queries : [{
									all: true
								}],
								rootNode: shadow
							});
							shadow.innerHTML = "<content></content>";
						}
					},
					attributeChangedCallback: function() {

					}
				})
			});
		}
	}

}