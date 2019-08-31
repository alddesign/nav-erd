"use strict";
/**
 * Dont run/use this file! This is an example of "var navObject" in json format.
 * 
 * It is easier to actually create a litteral object here rather than real classes.
 * ErdLoadData.class.js deals with these objects.
 */

var navObject =
{
	table50000 :
	{
		uid : "table50000",
		type : "table",
		typeShort : "t",
		id : 50000,
		name : "IG General Setup",
		included : true,
		render : true,
		functions : 
		{
			createnewsetup : 
			{
				name : "createnewsetup",
				realname : "CreateNewSetup",
				id : 1000005,
				included : true,
				type : 0, //0 = local, 1 = global, 2 = trigger
				render: true,
				params : 
				{
					rec : {name : "rec", realName : "Rec", id : 1000000, objectType : "table", objectId : 50001, objectUid : "table50001", temp : false},
					//...
				},
				vars: 
				{
					igtaskmgt : {name : "igtaskmgt", realName : "IGTaskMgt", id : 1000002, objectType : "codeunit", objectId : 50030, objectUid : "codeunit50030", temp : false},
					//...
				},
				calls : 
				{
                    "codunit50012.checksetup" : {callUid : "codunit50012.checksetup", objectType : "codeunit", objectId : 50012, objectUid : "codeunit500012", functionName : "checksetup", amount : 1},
                    //..
				},
				totalCalls : 0,
				totalCallsIn : 0,
				totalCallsOut : 0
			},
			OnDelete :
			{
                //...
            }
		},
		vars :
		{
			itemrec : {name : "itemrec", realName : "ItemRec", id : 1000000, objectType : "table", objectId : 27, objectUid : "table27", temp : false},
			//...
		},
		totalCalls : 0,
		totalCallsIn : 0,
		totalCallsOut : 0,		
        
        totalLocalFunctions : 2,
		totalGlobalFunctions : 5,
		totalTriggerFunctions : 3,
        
        totalLocalFunctionsWithCalls : 0,
		totalGlobalFunctionsWithCalls : 4,
		totalTriggerFunctionsWithCalls : 1,
        
        totalFunctionsToRender : 2
	},
	//...
};