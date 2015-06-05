}

for (var guiClass in App) {
	if (App.hasOwnProperty(guiClass)) {
		if (typeof App[guiClass].prototype !== "undefined" && typeof App[guiClass].prototype.register !== "undefined" && typeof App[guiClass].registered !== "undefined" && !App[guiClass].registered) {
			App[guiClass].prototype.register();
		}
	}
}
App.initialize();

window['App'] = App;