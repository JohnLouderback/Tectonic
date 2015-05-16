declare var MutationSummary;

interface InternalModelWrapper {
	model: Object;
}

class Gui {
	private static regexForTemplate: string = '\\$\\{(.*?)\\}';
	private static internalModelWrapper: InternalModelWrapper = {model: {}};
	public static elementToModelMap: Object = {};
	public static set model(value) {
		Gui.internalModelWrapper.model = value;
		Gui.Utils.Observe.observeObjects(false, Gui.internalModelWrapper);
	}
	public static get model() {
		return Gui.internalModelWrapper.model;
	}

	public static initialize() {
		Gui.Utils.Observe.observeObjects(false, Gui.internalModelWrapper);
		Gui.Dom.initialize();
	}
}