"use strict";
/**
 * Checks if Browser supports all the Javascript ES6 features which are required to run NAV ERD.
 * @returns {boolean}
 */
function checkFeatureSupport()
{

    if (typeof Symbol == "undefined") return false;
    try 
    {
        eval("class Foo {constructor(){this.p = 1;} f(){return 1;}}");
        eval("async function f(){}");
        eval("var promise = new Promise(function (x, y) {});");
        eval("var reader = new FileReader();");
        eval("var bar = (x) => x+1");

    } catch (e) { return false; }

    return true;
}

if(!checkFeatureSupport())
{
    window.alert("Your browser doesnt support all required features. Get the latest version Mozilla Firefox, Google Chrome or Microsoft Edge.");
}