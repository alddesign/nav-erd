"use strict";
/**
 * Helper class.
 * 
 * Use static methods only.
 */
class ErdUtil
{
    static loadingModal(message = "", animation = "")
	{

		$("body").loadingModal("destroy");
		if(message == "") return;

		$("body").loadingModal({text : message});
		$("body").loadingModal("animation", animation);
	}

	static errorModal(message = "", title = "Error...", reload = false)
	{
		ErdUtil.modal("danger", title, message, reload);
	}
	
	static modal(color = "", title = "", message = "", reload = false)
	{
		var textcolor = "";
		
		switch(color)
		{
			case "primary" : 
			case "secondary" : 
			case "success" : 
			case "danger" : 
			case "info" : 
			case "dark" : textcolor = "text-white"; break;
			case "warning" :  
			case "light" : 
			case "white" : 
			case "transparent" : textcolor = "text-dark"; break; 
			default : color = "dark";
		}

		var modal = $("#ig-modal");
		modal.find(".modal-header").addClass("bg-" + color);
		modal.find(".modal-header").addClass(textcolor);
		modal.find(".modal-header button.close").addClass(textcolor);
		modal.find(".modal-footer button").addClass("btn-" + color);
		modal.find(".modal-body").html("<p>" + message + "</p>");
		modal.find(".modal-title").html(title);

		modal.modal();

		if(reload)
		{
			modal.on('hidden.bs.modal', function (e) { location.reload(); });
		}
	}


    
        /**
     * Make a call uid.
     * @param {string} objectType
     * @param {number} objectId 
     * @param {string} functionName 
     */
    static callUid(objectType, objectId, functionName)
	{
		return(ErdUtil.uid(objectType, objectId) + ERDSETTINGS.callUidSeparator + functionName.toLowerCase());
	}

    /**
     * Make a uid.
     * @param {string} type 
     * @param {number} id 
     */
	static uid(type, id)
	{
		return(String(type) + String(id));
	}

    /** @param {string} type*/
	static shortType(type)
	{
		switch(type)
		{
			case "table" : return("T");
			case "page" : return("P");
			case "codeunit" : return("C");
			case "report" : return("R");
			case "xmlport" : return("X");
			case "query" : return("Q");
			case "menusuite" : return("M");
			default : return("");
		}
	}
	
	static sleep(milliseconds) 
	{
		return new Promise(resolve => setTimeout(resolve, milliseconds));
	}

	static readLines(file)
	{	
		var reader = new FileReader();

		return new Promise((resolve, reject) =>
		{
			reader.onerror = () => 
			{
				reader.abort();
				reject(new DOMException("Error reading input file."));
			};
		
			reader.onload = () => 
			{
				resolve(reader.result.split("\r\n")); //array of lines
			};

			reader.readAsText(file);
		});
	}
}