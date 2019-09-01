"use strict";
/**
 * NAV ERD Settings.
 * 
 * Adjust this file to customize the look and feel of NAV ERD.
 */

const ERDSETTINGS = 
{
// ### SETTING ##################################################
// In this section you may adjust what exactly will be rendered to the ERD and how.
	showObjects 			: "included", //Options: "all", "included", "included_with_calls"
	showLocalFunctions 		: "all", //Options: "all", "with_calls", "none"
	showGlobalFunctions 	: "all", //Options: "all", "with_calls", "none"
	showTriggerFunctions 	: "all", //Options: "all", "with_calls", "none"

// ### STYLE ##################################################
// In this section you may adjust the style of ERD.
	navObjectFontSize 		: 17,
	navObjectFontWeight 	: "bold",
	navObjectFontFamily 	: "'Source Sans Pro', sans-serif",
	navObjectFillOpacity 	: 0.75,
	navObjectStrokeWidth 	: 4,
	navStrokeColor			: //Color for objects
	{
		table 				: "#ce362c",
		page 				: "#00aba9",
		codeunit 			: "#1ba1e2",
		report 				: "#f0a30a",
		xmlport 			: "#bebebe",
		query 				: "#bebebe",
		menusuite 			: "#bebebe",
	},

	navFunctionFontSize 	: 14,
	navFunctionFontWeight 	: "bold",
	navFunctionFontFamily 	: "'Courier New', Courier, monospace",
	navFunctionFillOpacity 	: 0.75,
	navFunctionStrokeWidth 	: 4,
	navFunctionStroke 		: //Color for functions
	{
		0					: "#888888", //local function
		1 					: "#455a64", //global function
		2					: "#885a64", //trigger function	
	},
	navFunctionRx			:
	{
		0					: 5, //local function
		1 					: 5, //global function
		2					: 0, //trigger function	
	},
	navFunctionRy			:
	{
		0					: 5, //local function
		1 					: 5, //global function
		2					: 0, //trigger function			
	},
	linkLabelFill 			: "#fff",
	linkLabelFontSize 		: 13,
	linkLabelFontWeight 	: "bold",
	linkLabelFontFamily 	: "'Source Sans Pro', sans-serif",
	linkLabelStrokeFill 	: "#999",
	linkLabelStrokeWidth 	: 13,

// ### MARGINS and OFFSETS [px] ##################################################
// !!! You should not change that, unless you want to f*ck up your ERD !!!
	navObjectEntityWidth 		: 420,
	navObjectEntityMarginX 		: 80,
	navObjectEntityMarginY 		: 70,
	navObjectEntityYOffset 		: 15,
	navObjectEntityMinHeight 	: 60,
	navObjectEntityHeightOffset : 60,

	navFunctionEntityHeight 	: 32,
	navFunctionEntityMaring 	: 15,
	navFunctionEntityXMargin 	: 60,
	navFunctionEntityYOffset 	: 50,

	testPerformance 			: true,

	htmlIdErdDiv		: "ig-erd",
	htmlIdFileInput		: "ig-file",
	htmlIdLoaderButton	: "ig-load",
	htmlIdSvgDownload	: "ig-download-svg",
	callUidSeparator 	: ".",
	triggers 			: ["OnRun","OnInsert","OnModify","OnDelete","OnRename","OnValidate","OnLookup","OnInitReport","OnPreReport","OnPostReport","OnPreDataItem","OnAfterGetRecord","OnPostDataItem","OnAfterAssignField","OnAfterAssignVariable","OnAfterGetField","OnAfterGetRecord","OnAfterInitRecord","OnAfterInsertRecord","OnAfterModifyRecord","OnBeforeInsertRecord","OnBeforeModifyRecord","OnBeforePassField","OnBeforePassVariable","OnInitXMLport","OnPreXMLport","OnPostXMLport","OnPreXMLItem","OnInit","OnOpenPage","OnClosePage","OnFindRecord","OnNextRecord","OnAfterGetCurrRecord","OnAfterGetRecord","OnNewRecord","OnInsertRecord","OnModifyRecord","OnDeleteRecord","OnQueryClosePage","OnValidate (Page fields)","OnLookup (Page fields)","OnDrillDown","OnAssistEdit","OnControlAddin","OnAction","OnBeforeTestRun","OnAfterTestRun","OnBeforeOpen"]

};