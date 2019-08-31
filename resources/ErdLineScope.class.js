"use strict";
class ErdLineScope
{ 
    constructor()
    {
        /** @type {NavObject} */ this.currentNavObject = null;
        /** @type {NavFunction} */ this.currentFunction = null;
        /** @type {boolean} */ this.inLocalVars = false;
        /** @type {boolean} */ this.inGlobalVars = false;
        /** @type {boolean} */ this.inBlockComment = false;
        /** @type {boolean} */ this.functionLine = false;
        /** @type {number} 0 = no, 1 = start, 2 = end */ this.triggerLine = 0;
    }
}
