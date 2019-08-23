$(document).ready(function(){ erdInit(); });
var x;
var y;
function erdInit()
{
    $("#ig-load").click(function()
    {
        loadFile();
    });

    $("#ig-download-svg").click(function()
    {
        downloadSvg(this);
    });

    $("#ig-file").change(function()
    {
        x = this;
        if(this.files.length == 1)
        {
            if(this.files[0].name != "" && this.files[0].name != undefined && this.files[0].name != null)
            {
                $("#ig-file-label").html(this.files[0].name);

                $("#ig-load").removeClass("disabled");
                $("#ig-load").removeClass("btn-danger");
                $("#ig-load").addClass("btn-success");
            }
        }
    });
}