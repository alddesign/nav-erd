/*
* --- SETTING ---
* In this section you may adjust what exactly will be rendered to the ERD and how.
*/
//Objects
var showObjects = "all"; //Options: "all", "included", "withCalls", "includedWithCalls"

//Functions
var showLocalFunctions = "all"; //Options: "all", "withCalls"
var showGlobalFunctions = "all"; //Options: "all", "withCalls"
var showTriggerFunctions = "all"; //Options: "all", "withCalls"

/*
* --- STYLE---
* In this section you may adjust the style of ERD.
*/
//Objects
var navObjectFontSize =		17;
var navObjectFontWeight = 	"bold";
var navObjectFontFamily = 	"'Source Sans Pro', sans-serif";
var navObjectFillOpacity = 	0.75;
var navObjectStrokeWidth =	4;
var navTableStroke = 		"#ce362c";
var navPageStroke = 		"#00aba9";
var navCodeunitStroke = 	"#1ba1e2";
var navReportStroke = 		"#f0a30a";
var navXmlPortStroke = 		"#bebebe";
var navQueryStroke = 		"#bebebe";
var navMenuSuiteStroke =	"#bebebe";

//Functions
var navFunctionFontSize =		13;
var navFunctionFontWeight = 	"bold";
var navFunctionFontFamily = 	"'Courier New', Courier, monospace";
var navFunctionFillOpacity =	0.75;
var navFunctionStrokeWidth =	4;
var navFunctionStroke =			"#455a64";
var navFunctionLocalStroke = 	"#989898";
var navTriggerFunctionRx =		0;
var navTriggerFunctionRy =		0;
var navFunctionRx =				5;
var navFunctionRy =				5;

//Links
var linkLabelFill 			= "#fff";
var linkLabelFontSize 		= 13;
var linkLabelFontWeight 	= "bold";
var linkLabelFontFamily 	= "'Source Sans Pro', sans-serif";
var linkLabelStrokeFill 	= "#999";
var linkLabelStrokeWidth 	= 13;



//Do not modify the following code:
//#region Helpers
function getNavObjectStroke(objectType)
{
	switch(objectType)
	{
		case "table" 		: return(navTableStroke); break;
		case "page" 		: return(navPageStroke); break;
		case "codeunit"		: return(navCodeunitStroke); break;
		case "report" 		: return(navReportStroke); break;
		case "xmlport" 		: return(navXmlPortStroke); break;
		case "query" 		: return(navQueryStroke); break;
		case "menusuite" 	: return(navMenuSuiteStroke); break;
		default 			: return("#000");
	}
}

function getNavFunctionStroke(type)
{
	return (local == 0) ? navFunctionLocalStroke: navFunctionStroke;
}

function getNavFunctionRy(type)
{
	return (type == 2) ? navTriggerFunctionRy : navFunctionRy;
}

function getNavFunctionRx(type)
{
	return (type == 2) ? navFunctionRx : navFunctionRx;
}
//#endregion