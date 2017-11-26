$(document).ready(function() {


BatteryVoltages = [];
SolarVoltages = [];
RegVoltages = [];

$.getJSON('/api/voltages.php', function(data) {

$.each(data, function(i) {

if (data[i].source == "Battery") {
tmpdata = [Date.parse(data[i].timestamp),Number(data[i].value)];
BatteryVoltages.push(tmpdata);
}
if (data[i].source == "Solar") {
tmpdata = [Date.parse(data[i].timestamp),Number(data[i].value)];
SolarVoltages.push(tmpdata);
}
if (data[i].source == "Regulator") {
tmpdata = [Date.parse(data[i].timestamp),Number(data[i].value)];
RegVoltages.push(tmpdata);
}
})


console.log(BatteryVoltages);

$('#batterycontainer').highcharts({
rangeSelector : {
				selected : 1,
				inputEnabled: $('#batterycontainer').width() > 480
			},
	chart: {
                type: 'line',
                zoomType: 'xy'
            },
        title: {
            text: 'Battery Voltage',
            x: -20 //center
        },
        subtitle: {
            text: 'Site XYZ',
            x: -20
        },
	xAxis: {
                type: 'datetime',
		dateTimeLabelFormats: {
                second: '%Y-%m-%d<br/>%H:%M:%S',
                minute: '%Y-%m-%d<br/>%H:%M',
                hour: '%Y-%m-%d<br/>%H:%M',
                day: '%Y<br/>%m-%d',
                week: '%Y<br/>%m-%d',
                month: '%Y-%m',
                year: '%Y'
            }
		},
            yAxis: {
                title: {
                    text: 'Volts'
		    },
		    min: 10,
		    max: 15,
            },
	series: [{
	    regression: true ,
                regressionSettings: {
                    type: 'linear',
                    color:  'rgba(223, 83, 83, .9)'
                },
            name: "Battery",
            data: BatteryVoltages
	}],
})

$('#solarcontainer').highcharts({
        title: {
            text: 'Solar Voltage',
            x: -20 //center
        },
        subtitle: {
            text: 'Site XYZ',
            x: -20
        },
        xAxis: {
                type: 'datetime',
                dateTimeLabelFormats: {
                second: '%Y-%m-%d<br/>%H:%M:%S',
                minute: '%Y-%m-%d<br/>%H:%M',
                hour: '%Y-%m-%d<br/>%H:%M',
                day: '%Y<br/>%m-%d',
                week: '%Y<br/>%m-%d',
                month: '%Y-%m',
                year: '%Y'
            }
                },
            yAxis: {
                title: {
                    text: 'Volts'
                    },
                    min: 0,
                    max: 15,
            },
        series: [{
            name: "Solar",
            data: SolarVoltages
        }],
})

$('#regcontainer').highcharts({
        title: {
            text: 'Regulated Voltage',
            x: -20 //center
        },
        subtitle: {
            text: 'Site XYZ',
            x: -20
        },
        xAxis: {
                type: 'datetime',
                dateTimeLabelFormats: {
                second: '%Y-%m-%d<br/>%H:%M:%S',
                minute: '%Y-%m-%d<br/>%H:%M',
                hour: '%Y-%m-%d<br/>%H:%M',
                day: '%Y<br/>%m-%d',
                week: '%Y<br/>%m-%d',
                month: '%Y-%m',
                year: '%Y'
            }
                },
            yAxis: {
                title: {
                    text: 'Volts'
                    },
                    min: 0,
                    max: 10,
            },
        series: [{
            name: "Regulated",
            data: RegVoltages
        }],
})

});




});
