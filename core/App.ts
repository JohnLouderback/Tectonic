/// <reference path="lib.es6.d.ts"/>

declare var MutationSummary;

interface InternalModelWrapper {
	model: Object;
}

interface SubscribedElement {
	element: HTMLElement;
	attributes: [{
		attribute: string;
		expression: string;
		callbacks: Array<Function>;
	}]
}

interface SubscribedAttrTemplate {
	element: Node;
	attribute: string;
}

class App {
	private static internalModelWrapper: InternalModelWrapper = {model: {}};
	public static regexForTemplate: string = '\\$\\{(.*?)\\}';
	public static regexForModelPaths: string = '((App|this)\\.(.*?)(?!\\[.*?|.*?\\])(?:\\||$|\\n|\\*|\\+|\\\\|\\-|\\s|\\(|\\)|\\|\\||&&|\\?|\\:|\\!))';
	public static elementToModelMap: Map<string, Array<SubscribedAttrTemplate|Node>> = new Map([['', []]]);
	public static subscribedElementsToModelMap: Map<string, Array<SubscribedElement>> = new Map([['', []]]);
	public static set model(value: Object) {
		for (var key in value) {
			if (value.hasOwnProperty(key)) {
				App.internalModelWrapper.model[key] = value[key]
			}
		}
		App.Utils.Observe.observeObjects(false, App.internalModelWrapper);
	}
	public static get model(): Object {
		return App.internalModelWrapper.model;
	}

	public static initialize() {
		App.Utils.Observe.observeObjects(false, App.internalModelWrapper);
		App.Dom.initialize();
	}
}