"use strict";
/**
 * Microsoft Dynamics NAV Entity Relation Diagram (ERD)
 * 
 * @fileoverview Customize this file to adjust the look and feel
 * @author Alexander Döpper
 * @license MIT
 * @version v1.0.2-beta.1
 */

var erdMain = null;
var erdGlobal = null;
$(document).ready(function()
{  
    erdMain = new ErdMain();
    erdMain.setup();
});

class ErdMain
{
    constructor()
    {
        this.init();
    }

    init()
    {
        /** @type ErdDataLoader */
        this.erdDataLoader = new ErdDataLoader();
        /** @type ErdDrawer */
        this.erdDrawer = new ErdDrawer();
    }

    setup()
    {
        $("#"+ERDSETTINGS.htmlIdLoaderButton).click(function()
        {
            erdMain.createErd();
        }); 

        $("#"+ERDSETTINGS.htmlIdSvgDownload).click(function()
        {
            erdMain.erdDrawer.downloadSvg(this);
        });

        $("#ig-file").change(function()
        {
            if(this.files.length === 1)
            {
                $("#ig-file-label").html(this.files[0].name);

                $("#ig-load").removeClass("disabled");
                $("#ig-load").removeClass("btn-danger");
                $("#ig-load").addClass("btn-success");
            }
        });
    }

    //Its important to have a SINGLE async function, where we pack all our code! So we can do the AWAIT thing and make things synchronus
    async createErd()
    {
        try
        {
            var startTimeParsing = new Date();
            var fileInput = document.getElementById(ERDSETTINGS.htmlIdFileInput);
            if(fileInput === undefined || fileInput.files.length !== 1)
            {
                ErdUtil.errorModal("Please select a file before loading the ERD.", "No file selected");
                return;
            }

            this.init();
            var lines = await ErdUtil.readLines(fileInput.files[0]);
            
            
            ErdUtil.loadingModal("Parsing data...", "wanderingCubes"); await ErdUtil.sleep(200);
            this.erdDataLoader.load(lines);
            var endTimeParsing = new Date();

            var startTimeDrawing = new Date();
            ErdUtil.loadingModal("Drawing ERD...", "foldingCube"); await ErdUtil.sleep(200);
            this.erdDrawer.drawErd(this.erdDataLoader);

            $("#ig-download-svg").removeClass("disabled");
            $("#ig-download-svg").removeClass("btn-danger");
            $("#ig-download-svg").addClass("btn-success")

            ErdUtil.loadingModal();
            var endTimeDrawing = new Date();
        }
        catch(ex)
        {
            console.log(ex);
            ErdUtil.loadingModal();await ErdUtil.sleep(200);
            ErdUtil.errorModal(ex.message, ex.name, true);
        } 

        if(ERDSETTINGS.testPerformance)
        {
            var durationParsing = (endTimeParsing - startTimeParsing) / 1000;
            var durationDrawing = (endTimeDrawing - startTimeDrawing) / 1000;
            var duration = durationDrawing + durationParsing;
            
            var resText = "PERFORMANCE TEST:\rParsing: " + durationParsing.toFixed(3) + " sec.\rDrawing: " + durationDrawing.toFixed(3) + " sec.\rTotal: " + duration.toFixed(3) + " sec.";
            alert(resText);
            console.log(resText); 
        }
    }
}

