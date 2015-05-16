for (var guiClass in Gui) {
	if (Gui.hasOwnProperty(guiClass)) {
		if (typeof Gui[guiClass].prototype !== "undefined" && typeof Gui[guiClass].prototype.register !== "undefined" && typeof Gui[guiClass].registered !== "undefined" && !Gui[guiClass].registered) {
			Gui[guiClass].prototype.register();
		}
	}
}
Gui.initialize();