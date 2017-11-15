var chart = AmCharts.makeChart("chartdiv", {
    "type": "serial",
    "theme": "light",
    "marginRight": 70,
    "autoMarginOffset": 20,
    "dataProvider": [],
    "balloon": {
        "cornerRadius": 6
    },
    "valueAxes": [{
        "axisAlpha": 0
    }],
    "graphs": [{
        "balloonText": "[[category]]<br><b><span style='font-size:14px;'>[[value]] C</span></b>",
        "bullet": "round",
        "bulletSize": 6,
        "connect": false,
        "lineColor": "#b6d278",
        "lineThickness": 2,
        "negativeLineColor": "#487dac",
        "valueField": "value"
    }],
    "chartCursor": {
        "categoryBalloonDateFormat": "YYYY",
        "cursorAlpha": 0.1,
        "cursorColor": "#000000",
        "fullWidth": true,
        "graphBulletSize": 2
    },
    "chartScrollbar": {},
    "dataDateFormat": "YYYY",
    "categoryField": "year",
    "categoryAxis": {
        "minPeriod": "YYYY",
        "parseDates": true,
        "minorGridEnabled": true
    },
    "export": {
        "enabled": true
    }
});

chart.addListener("dataUpdated", zoomChart);

function zoomChart(){
    chart.zoomToDates(new Date(1970, 0), new Date(1995, 0));
}