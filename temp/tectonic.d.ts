/// <reference path="lib.es6.d.ts" />
declare var MutationSummary: any;
interface InternalModelWrapper {
    model: Object;
}
interface SubscribedElement {
    element: HTMLElement;
    attributes: [{
        attribute: string;
        expression: string;
        callbacks: Array<Function>;
    }];
}
interface SubscribedAttrTemplate {
    element: Node;
    attribute: string;
}
declare class App {
    private static internalModelWrapper;
    static regexForTemplate: string;
    static regexForModelPaths: string;
    static elementToModelMap: Map<string, Array<SubscribedAttrTemplate | Node>>;
    static subscribedElementsToModelMap: Map<string, Array<SubscribedElement>>;
    static model: Object;
    static initialize(): void;
}
declare module App {
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
            static updateSubscribedElements(elementsObject: any, modelLocation: any): void;
        }
        class Sandbox {
            static evaluate(code: any): void;
        }
    }
    class Dom {
        static initialize(): void;
        static templateFinder(summaries: any): void;
        static textNodeSearch(el: any): void;
        static templateRenderForTextNode(el: Node, templateProperty: string): void;
        static templateRenderForAttribute(el: HTMLElement, attribute: string, useAttributeTemplate?: boolean): void;
        static twoWayBinderOutHandler(event: any, selector: any): void;
        static twoWayBinderInHandler(el: any, value: any): void;
    }
    class Pipes {
        static toUpperCase(string: string): string;
    }
    interface SubscribedAttribute {
        attribute: string;
        subscribedModelPaths: Array<string>;
    }
    class Element {
        static registered: boolean;
        static el: HTMLElement;
        el: HTMLElement;
        subscribedAttrs: Array<SubscribedAttribute>;
        constructor(el?: any);
        protected subscribeAttrToModelPath(attribute: string, callback: Function): void;
        protected getClassName(): string;
        protected register(): void;
    }
    class Print extends Element {
        constructor(e?: any);
    }
    class If extends Element {
        constructor(e?: any);
    }
    class Else extends Element {
        constructor(e?: any);
        update(ifVal: boolean): void;
    }
}
