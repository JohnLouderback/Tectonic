declare var MutationSummary: any;
interface InternalModelWrapper {
    model: Object;
}
declare class Gui {
    private static regexForTemplate;
    private static internalModelWrapper;
    static elementToModelMap: Object;
    static model: Object;
    static initialize(): void;
}
declare module Gui {
    class Utils {
        static isElement(o: any): boolean;
        static processTemplateThroughPipes(value: any): any;
        static splitParametersBySpaces(string: any): any[];
        static castStringToType(string: any): any;
        static unwrapQuotes(string: any): any;
    }
    module Utils {
        class Observe {
            static observerFunctions: Object;
            static witnessedObjects: Object;
            static observeObjects(unobserve: boolean, objectToObserve: Object | Array<any>, objectLocationString?: string, previousObjects?: Array<Object>): void;
            static setElementsToValue(elementsObject: any, modelLocation: any, value: any): void;
        }
    }
    class Dom {
        static initialize(): void;
        static templateFinder(summaries: any): void;
        static textNodeSearch(el: any): void;
        static templateRenderForTextNode(el: any, templateProperty: string): void;
        static templateRenderForAttribute(el: any, attribute: string, useAttributeTemplate?: boolean): void;
        static twoWayBinderOutHandler(event: any, selector: any): void;
        static twoWayBinderInHandler(el: any, value: any): void;
    }
    class Pipes {
        static toUpperCase(string: string): string;
    }
    class Element {
        static registered: boolean;
        static el: HTMLElement;
        el: HTMLElement;
        constructor(el?: any);
        protected getClassName(): string;
        protected register(): void;
    }
    class Print extends Element {
        constructor(e?: any);
    }
}
