/**
 * Microsoft Dynamics NAV Entity Relation Diagram (ERD)
 * 
 * @fileoverview Customize this file to adjust the look and feel
 * @author Alexander Döpper
 * @license MIT
 * @version v1.0.0-beta.1
 */
var version = "v1.0.0-beta.1";
// ######################################################################################################################################################

// ### SETTING ##################################################
// In this section you may adjust what exactly will be rendered to the ERD and how.

//Objects
var showObjects = "all"; //Options: "all", "included", "with_calls", "included_with_calls"

//Functions
var showLocalFunctions = "all"; //Options: "all", "with_calls", "none"
var showGlobalFunctions = "all"; //Options: "all", "with_calls", "none"
var showTriggerFunctions = "all"; //Options: "all", "with_calls", "none"

// ### STYLE ##################################################
// In this section you may adjust the style of ERD.

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
var navFunctionFontSize =		12;
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

// ### INTERNAL - DO NOT MODIFY ##################################################
//#region Helpers
function getNavObjectStroke(objectType)
{
	switch(objectType)
	{
		case "table" 		: return(navTableStroke); 
		case "page" 		: return(navPageStroke); 
		case "codeunit"		: return(navCodeunitStroke); 
		case "report" 		: return(navReportStroke); 
		case "xmlport" 		: return(navXmlPortStroke); 
		case "query" 		: return(navQueryStroke); 
		case "menusuite" 	: return(navMenuSuiteStroke); 
		default 			: return("#000");
	}
}

function getNavFunctionStroke(type)
{
	switch(type)
	{
		case 0 : return navFunctionLocalStroke;
		case 1 : return navFunctionStroke;
		case 2 : return navFunctionStroke;
		default : return navFunctionStroke;
	}
}

function getNavFunctionRy(type)
{
	switch(type)
	{
		case 0 : return navFunctionRy;
		case 1 : return navFunctionRy;
		case 2 : return navTriggerFunctionRy;
		default : return navFunctionRy;
	}
}

function getNavFunctionRx(type)
{
	switch(type)
	{
		case 0 : return navFunctionRx;
		case 1 : return navFunctionRx;
		case 2 : return navTriggerFunctionRx;
		default : return navFunctionRx;
	}
}
//#endregion