$(function() {
    PDU = [];

    // Highcharts.setOptions({
    //     global: { 
    //         useUTC: true
    //     }
    // });

//     $.getJSON('/api/dht11.php', function(data) {
//         dht11temp = [];
//         dht11humidity = [];

//         $.each(data, function(i) {
//             tmpdate = new Date(data[i].timestamp);
//             tmpdate.setTime( tmpdate.getTime() - tmpdate.getTimezoneOffset()*60*1000 );
//             tmpdate = tmpdate.getTime();
//             dht11temp.push([tmpdate, parseFloat(data[i].temp)]);
//             dht11humidity.push([tmpdate, parseFloat(data[i].humidity)]);


//         });
//         timestamp = new Date(data[data.length-1]["timestamp"]);
//         timestamp.setTime(timestamp.getTime() - timestamp.getTimezoneOffset()*60*1000);
//         $( "#dht11-temp" ).html(data[data.length-1]["temp"]+"&#x2103");
//         $( "#dht11-humidity" ).html(data[data.length-1]["humidity"]+"%");
//         $( "#dht11-time" ).text(moment(timestamp).fromNow());


//         $('#dht11-chart').highcharts({
//             chart: {
//                 type: 'spline',
//                 zoomType: 'x'
//             },

//             title: {
//                 text: 'DHT11'
//             },
//             subtitle: {
//                 text: 'Previous 24 Hours'
//             },
//             xAxis: {
//                 type: 'datetime',
//             dateTimeLabelFormats: { // don't display the dummy year
//             second: '%H:%M:%S',
//             minute: '%H:%M',
//             hour: '%H:%M',
//             day: '%e. %b',
//             week: '%e. %b',
//             month: '%b \'%y',
//             year: '%Y'
//         },
//         title: {
//             text: 'Timestamp'
//         }
//     },
//     yAxis: [{
//         labels: {
//             format: '{value}C',
//             style: {
//                 color: Highcharts.getOptions().colors[1]
//             }
//         },
//         title: {
//             text: 'Temperature'
//         },
//         min: 0
//     },{
//         labels: {
//             format: '{value}%',
//             style: {
//                 color: Highcharts.getOptions().colors[1]
//             }
//         },
//         title: {
//             text: 'Humidity'
//         },
//         min: 0,
//         opposite: true,
//     }],
//     tooltip: {
//         shared: false,
//     },

//     plotOptions: {
//         spline: {
//          lineWidth: 1,
//          states: {
//             hover: {
//                 lineWidth: 1
//             }
//         },
//         marker: {
//             enabled: false,
//             radius: 1
//         }
//     }
// },
// series: [{
//     name: 'Temperature',
//     data: dht11temp,
//     yAxis: 0,
//     tooltip: {
//         valueSuffix: ' °C'
//     }
// },
// {
//     name: 'Humidity',
//     data: dht11humidity,
//     yAxis: 1,
//     tooltip: {
//         valueSuffix: ' %'
//     }
// }]

// });

// });

$.getJSON('../api/uptime.php', function(data) {
    $( "#uptime-chart" ).text(data)

});

$.getJSON('../api/voltages.php', function(data) {
    runningTotalUsed = 0;
    runningTotalGained = 0;
    NumberOfPoints = 0;


    $.each(data, function(i) {


        tmpdata = [];
        tmpdata["period"] = new Date(data[i].timestamp);
        tmpdata["period"].setTime( tmpdata["period"].getTime() - tmpdata["period"].getTimezoneOffset()*60*1000);

        //tmpdata["period"].setTime( tmpdata["period"].getTime() +
        //tmpdata["period"] =  new Date(tmpdata["period"].getTime() + (3600000*10));

        var mmt = moment();

            // Your moment at midnight
            var mmtMidnight = mmt.clone().startOf('day');

            if (moment(tmpdata["period"]).isAfter(mmtMidnight))
            {
                if (parseInt(data[i].solarpower) > parseInt(data[i].battpower))
                {
                    runningTotalUsed += ((data[i].battpower)/1000);
                    runningTotalGained += (((data[i].solarpower-data[i].battpower)*0.85)/1000);
                    console.log((((data[i].solarpower-data[i].battpower)*0.85)/1000));
                } else {
                    runningTotalUsed += ((data[i].battpower-data[i].solarpower)/1000);
                }
                NumberOfPoints++;  
            }

            tmpdata["battvoltage"] = parseFloat(data[i].battvoltage);//.toFixed(2);
            tmpdata["solarvoltage"] = parseFloat(data[i].solarvoltage);//.toFixed(2);
            tmpdata["regularvoltage"] = parseFloat(data[i].regularvoltage);//.toFixed(2);
            tmpdata["battpower"] = parseFloat((data[i].battpower)/1000);//.toFixed(2);
            tmpdata["solarpower"] = parseFloat((data[i].solarpower)/1000);//.toFixed(2);

          //  console.log(tmpdata);
          PDU.push(tmpdata);
      })

// Your moment
var mmt = moment();

// Your moment at midnight
var mmtMidnight = mmt.clone().startOf('day');

// Difference in minutes
var diffMinutes = mmt.clone().diff(mmtMidnight, 'minutes');
WattsHrsLost = (runningTotalUsed/NumberOfPoints*(diffMinutes/60));
WattsHrsGained = (runningTotalGained/NumberOfPoints*diffMinutes/(60));
console.log(NumberOfPoints);
console.log(runningTotalGained);
//console.log(WattsHrsGained);
//console.log(WattsHrsLost);


$( "#batt-power-watthrs" ).text(WattsHrsLost.toFixed(2)+" Watt Hrs");
$( "#solar-power-watthrs" ).text(WattsHrsGained.toFixed(2)+" Watt Hrs");

$('#watthours').circliful({
 percent: WattsHrsGained/WattsHrsLost*100,
 text: "Lost/Gained Wh",
 animationStep: 10,

});


if (PDU[PDU.length - 1]["battvoltage"] < 11) {
    $( "#battery-voltage-box" ).addClass("panel-red");
}

if (PDU[PDU.length - 1]["battvoltage"] > 11 && PDU[PDU.length - 1]["battvoltage"] < 11.5) {
    $( "#battery-voltage-box" ).addClass("panel-yellow");
}

if (PDU[PDU.length - 1]["battvoltage"] > 11.5 && PDU[PDU.length - 1]["battvoltage"] < 14) {
    $( "#battery-voltage-box" ).addClass("panel-green");
}

if (PDU[PDU.length - 1]["battvoltage"] > 14) {
    $( "#battery-voltage-box" ).addClass("panel-red");
} 

$( "#battery-voltage" ).text(PDU[PDU.length - 1]["battvoltage"].toFixed(2));
$( "#battery-voltage-time" ).text(moment(PDU[PDU.length - 1]["period"]).fromNow());

if (PDU[PDU.length - 1]["battpower"] > 5) {
    $( "#battery-current-box" ).addClass("panel-red");
}

if (PDU[PDU.length - 1]["battpower"] > 3.5 && PDU[PDU.length - 1]["battpower"] < 5) {
    $( "#battery-current-box" ).addClass("panel-yellow");
}

if (PDU[PDU.length - 1]["battpower"] < 3.5) {
    $( "#battery-current-box" ).addClass("panel-green");
}

$( "#battery-current" ).text(PDU[PDU.length - 1]["battpower"].toFixed(2));
$( "#battery-current-time" ).text(moment(PDU[PDU.length - 1]["period"]).fromNow());


if (PDU[PDU.length - 1]["solarvoltage"] < 10) {
    $( "#solar-voltage-box" ).addClass("panel-red");
}

if (PDU[PDU.length - 1]["solarvoltage"] > 10 && PDU[PDU.length - 1]["solarvoltage"] < 12) {
    $( "#solar-voltage-box" ).addClass("panel-yellow");
}

if (PDU[PDU.length - 1]["solarvoltage"] > 12) {
    $( "#solar-voltage-box" ).addClass("panel-green");
}

$( "#solar-voltage" ).text(PDU[PDU.length - 1]["solarvoltage"].toFixed(2));
$( "#solar-voltage-time" ).text(moment(PDU[PDU.length - 1]["period"]).fromNow());




if (PDU[PDU.length - 1]["solarpower"] < PDU[PDU.length - 1]["battpower"]) {
    $( "#solar-power-box" ).addClass("panel-red");
}

if (PDU[PDU.length - 1]["solarpower"] > PDU[PDU.length - 1]["battpower"] && PDU[PDU.length - 1]["solarpower"] < PDU[PDU.length - 1]["battpower"]*1.25) {
    $( "#solar-power-box" ).addClass("panel-yellow");
}

if (PDU[PDU.length - 1]["solarpower"] > PDU[PDU.length - 1]["battpower"]*2) {
    $( "#solar-power-box" ).addClass("panel-green");
}

$( "#solar-power" ).text(PDU[PDU.length - 1]["solarpower"].toFixed(2));
$( "#solar-power-time" ).text(moment(PDU[PDU.length - 1]["period"]).fromNow());
$( "#solar-power-percentage" ).text(((PDU[PDU.length - 1]["solarpower"]/PDU[PDU.length - 1]["battpower"])*100).toFixed(2)+"% of consumption")





    // if (PDU[PDU.length - 1]["regularvoltage"] < 4.5) {
    //     $( "#reg-voltage-box" ).addClass("panel-red");
    // }

    // if (PDU[PDU.length - 1]["regularvoltage"] > 4.5 && PDU[PDU.length - 1]["regularvoltage"] < 4.9) {
    //     $( "#reg-voltage-box" ).addClass("panel-yellow");
    // }

    // if (PDU[PDU.length - 1]["regularvoltage"] > 4.9) {
    //     $( "#reg-voltage-box" ).addClass("panel-green");
    // }

    // $( "#reg-voltage" ).text(PDU[PDU.length - 1]["regularvoltage"].toFixed(2));
    // $( "#reg-voltage-time" ).text(moment(PDU[PDU.length - 1]["period"]).fromNow());

    battVoltage = [];
    regVoltage = [];
    solarVoltage = [];
    battPower = [];
    solarPower = [];

    $.each(PDU, function (index, value) {
        battVoltage.push([value.period, value.battvoltage]);
        regVoltage.push([value.period, value.regularvoltage]);
        solarVoltage.push([value.period, value.solarvoltage]);
        battPower.push([value.period, value.battpower]);
        solarPower.push([value.period, value.solarpower]);


    })   

    console.log(battVoltage);

    var voltagesChart = new Highcharts.Chart({
        chart: {
            renderTo: 'battery-chart',
            type: 'spline',
            zoomType: 'x'
        },
        subtitle: {
         text: 'Previous 36 Hours'
     },
     title: {
        text: 'Voltages'
    },
    rangeSelector: {
        selected: 1
    },
    xAxis: {
        type: 'datetime',
            dateTimeLabelFormats: { // don't display the dummy year
            second: '%H:%M:%S',
            minute: '%H:%M',
            hour: '%H:%M',
            day: '%e. %b',
            week: '%e. %b',
            month: '%b \'%y',
            year: '%Y'
        },
        title: {
            text: 'Timestamp'
        }
    },
    yAxis: [{
        labels: {
            format: '{value}V',
            style: {
                color: Highcharts.getOptions().colors[1]
            }
        },
        title: {
            text: 'Voltage (V)'
        },
        min: 0
    }],
    tooltip: {
        shared: false
        // formatter: function() {
        //     return  '<b>' + this.series.name +'</b><br/>' +
        //     moment(this.x).fromNow()
        //     + '  <br/>' + this.y + ' V';
        // }
    },

    plotOptions: {

        spline: {
           lineWidth: 2,
           states: {
            hover: {
                lineWidth: 3
            }
        },
        marker: {
            enabled: false,
            radius: 1
        }
    }
},
series: [{
    name: '12V Battery',
    data: battVoltage,
    yAxis: 0
},{
    name: '5V Regulated',
    data: regVoltage,
    yAxis: 0
},{
    name: 'Solar',
    data: solarVoltage,
    yAxis: 0
}]

});





$('#current-chart').highcharts({
    chart: {
        type: 'spline',
        zoomType: 'x'
    },
    title: {
        text: 'Power'
    },
    subtitle: {
     text: 'Previous 36 Hours'
 },
 xAxis: {
    type: 'datetime',
            dateTimeLabelFormats: { // don't display the dummy year
            second: '%H:%M:%S',
            minute: '%H:%M',
            hour: '%H:%M',
            day: '%e. %b',
            week: '%e. %b',
            month: '%b \'%y',
            year: '%Y'
        },
        title: {
            text: 'Timestamp'
        }
    },
    yAxis: [{
        labels: {
            format: '{value}W',
            style: {
                color: Highcharts.getOptions().colors[1]
            }
        },
        title: {
            text: 'Watts (W)'
        },
        min: 0
    }],
    tooltip: {
        shared: false,
        // formatter: function() {
        //     return  '<b>' + this.series.name +'</b><br/>' +
        //     moment(this.x).fromNow()
        //     + '  <br/>' + this.y.toFixed(2) + ' W';
        // }
    },
    plotOptions: {
        area: {
            fillColor: {
                linearGradient: {
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 1
                },
                stops: [
                [0, Highcharts.getOptions().colors[0]],
                [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                ]
            }},
            spline: {
               lineWidth: 1,
               states: {
                hover: {
                    lineWidth: 1
                }
            },
            marker: {
                enabled: false,
                radius: 1
            }
        }
    },
    series: [{
        name: 'Battery',
        data: battPower,
        yAxis: 0,
        tooltip: {
            valueDecimals: 2,
            valueSuffix: ' W'
        }
    },
    {
     name: 'Solar',
     data: solarPower,
     yAxis: 0,
     tooltip: {
        valueDecimals: 2,
        valueSuffix: ' W'
    }   
}]

});



        // Morris.Area({
        //     element: 'battery-chart',
        //     data: PDU, 
        //     xkey: 'period',
        //     ykeys: ['battvoltage'],
        //     labels: ['Volts'],
        //     postUnits: ['V'],
        //     pointSize: 2,
        //     hideHover: 'auto',
        //     resize: true,
        //     ymax: 14,
        //     ymin: 10
        // });

// Morris.Area({
//     element: 'current-chart',
//     data: PDU,
//     xkey: 'period',
//     ykeys: ['battpower'],
//     labels: ['W'],
//     postUnits: ['W'],
//     pointSize: 2,
//     hideHover: 'auto',
//     resize: true,
//     ymax: 'auto',
//     ymin: 0
// });

// Morris.Area({
//     element: 'solar-chart',
//     data: PDU,
//     xkey: 'period',
//     ykeys: ['solarvoltage'],
//     labels: ['Volts'],
//     postUnits: ['V'],
//     pointSize: 2,
//     hideHover: 'auto',
//     resize: true,
//     ymax: 27,
//     ymin: 0
// });

// Morris.Area({
//     element: 'reg-chart',
//     data: PDU,
//     xkey: 'period',
//     ykeys: ['regularvoltage'],
//     labels: ['Volts'],
//     postUnits: ['V'],
//     pointSize: 2,
//     hideHover: 'auto',
//     resize: true,
//     ymax: 7,
//     ymin: 3
// });
})

});
