/*
 * Visualization source
 */

define([
            'jquery',
            'underscore',
            'moment',
            'api/SplunkVisualizationBase',
            'api/SplunkVisualizationUtils',
            'highcharts',
            './highcharts-downsample'
            // Add required assets to this list
        ],
        function(
            $,
            _,
            moment,
            SplunkVisualizationBase,
            vizUtils,
            HighCharts,
            Downsample
        ) {

    Downsample.initDownsample(HighCharts)

    // Extend from SplunkVisualizationBase
    return SplunkVisualizationBase.extend({
        getProperty: function(name) {
            var config = this._config;
            var propertyValue = config[this.getPropertyNamespaceInfo().propertyNamespace + name];
            return vizUtils.escapeHtml(propertyValue);
        },
        initialize: function() {
            SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
            this.$el = $(this.el);

            this.uniqueId = `ot-chart-${Math.ceil(Math.random() * 100000000)}`
            this.$el.append(`<div id="${this.uniqueId}"></div>`)
            // Initialization logic goes here
        },

        // Optionally implement to format data returned from search.
        // The returned object will be passed to updateView as 'data'
        formatData: function(data) {
            if(data.results.length < 1){
                return false;
            }
            console.log('Begin date formatting')
            console.time('FormatData')

            //return datum;
            let timeField = 0
            let otherFields = []
            data.fields.forEach((curField, num) => {
                if (!~curField.name.indexOf('_span') && curField.name !== '_time') {
                    otherFields.push(curField.name)
                }
            })

            const severalAxis = this.getProperty('severalYAxis') === 'true' || false
            let series = []
            let numAxis = 0
            otherFields.forEach((curVal, idx) => series.push({
                downsample: {
                    threshold: parseInt(this.getProperty('downSampled'), 10) || 0
                },
                yAxis: severalAxis && numAxis < 2 ? numAxis++ : 0,
                name: curVal,
                type: 'line',
                data: [],
                tooltip: {
                }
            }))

            const gapeMode = this.getProperty('gapeMode') || 'blank'

            if (this.getProperty('needSort') === 'true') {
                data.results
                    .sort((firstVal, secondVal) => {
                        return moment(firstVal._time) < moment(secondVal._time) ? -1 : 1
                    })
            }

            data.results
                .forEach(curResult => {
                    for (let i = 0, len = otherFields.length; i < len; ++i) {
                        const yVal = curResult[otherFields[i]]
                        const timestamp = new Date(curResult._time).getTime()
                        if (yVal) {
                            series[i].data.push([timestamp, parseFloat(yVal)])
                            continue
                        }

                        switch (gapeMode) {
                            case 'blank':
                                series[i].data.push([timestamp, null])
                                break
                            case 'zeroes':
                                series[i].data.push([timestamp, 0])
                                break
                        }
                    }
                })

            console.timeEnd('FormatData')

            return { series }
        },
        drilldownLabel: function(event) {
            const clickedTimestamp = new Date(event.point.x).getDate()
            const obj4Drilldown = {
                earliest: moment(clickedTimestamp - 60000).toISOString(),
                latest: moment(clickedTimestamp + 60000).toISOString()
            }

            console.log('Before drilldown event: ', JSON.stringify(obj4Drilldown, null, 4))
            this.drilldown(obj4Drilldown, event)
        },

        // Implement updateView to render a visualization.
        //  'data' will be the data object returned from formatData or from the search
        //  'config' will be the configuration property object
        updateView: function(data, config) {
            const severalAxis = this.getProperty('severalYAxis') === 'true' || false
            console.log('severalAxis: ', severalAxis, this.getProperty('severalYAxis'))

            this.$el.find(`#${this.uniqueId}`).empty()

            if (!data.series) {
                return
            }
            console.time('updateView')

            console.log('------------------------')
            console.log('Before drawing HighChart')
            console.log('------------------------')

            const containerHeight = this.$el.closest('.viz-controller').height()
            this.$el.find(`#${this.uniqueId}`).css({
                height: `${containerHeight - 30}px`
            })

            const self = this
            const yAxisName = this.getProperty('yAxisName') || ''

            const highChart = HighCharts.chart(this.uniqueId, {
                chart: {
                    zoomType: 'x',
                    backgroundColor: "transparent",
                },
                legend: {
                    enabled: this.getProperty('showLegend') === 'true'
                },
                plotOptions: {
                    line: {
                        marker: {
                            enabled: this.getProperty('showMarkers') === 'true'
                        }
                    },
                    series: {
                        events: {
                            click: e => { this.drilldownLabel(e) }
                        }
                    }
                },
                colors: [
                    '#237eb2',
                    '#fbb902',
                    '#d64848',
                    '#07912c',
                    '#903030',
                    '#46c35b',
                    '#4a1d6f',
                    '#f60328',
                    '#2d9c89'
                ],
                credits: {
                    enabled: false,
                },
                title: {
                    text: ''
                },
                subtitle: {
                    text: ''
                },
                xAxis: [{
                    tickPixelInterval: parseInt(this.getProperty('tickInterval'), 10) || 50,
                    type: 'datetime',
                    labels: {
                        formatter: function() {
                            const formatOpts = self.getProperty('dateFormatAxis') || 'HH:mm:ss'
                            console.log('formatOpts ', formatOpts)
                            return moment(this.value).format(formatOpts)
                        },
                        rotation: parseInt(this.getProperty('xAngle'), 10) || 0,
                        align: 'left'
                    },
                    crosshair: false
                }],
                yAxis: severalAxis ? [{
                    min: null,
                    labels: {
                        style: {
                            color: "#237eb2"
                        }
                    },
                    title: {
                        text: '',
                        style: {
                            color: "#237eb2"
                        }
                    },
                    opposite: false
                }, {
                    min: null,
                    labels: {
                        style: {
                            color: "#237eb2"
                        }
                    },
                    title: {
                        text: '',
                        style: {
                            color: "#237eb2"
                        }
                    },
                    opposite: true
                }] :[{
                    min: null,
                    labels: {
                        style: {
                            color: "#237eb2"
                        }
                    },
                    title: {
                        text: `${yAxisName}`,
                        style: {
                            color: "#237eb2"
                        }
                    },
                    opposite: false
                }],
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    formatter: function () {
                        const formatOpts = self.getProperty('dateFormatTooltip') || 'HH:mm:ss'
                        console.log('formatOpts ', formatOpts)
                        return `<strong>Time:</strong>: ${moment(this.x).format(formatOpts)}<br>
                            <strong>${this.series.name}</strong>: ${this.y}`
                    },
                    borderRadius: 5,
                    borderWidth: 0,
                    shadow: false,
                    style: {
                        color: "#fff"
                    },
                    //
                    followTouchMove: false
                },
                series: data.series
            })

            console.timeEnd('updateView')
        },

        // Search data params
        getInitialDataParams: function() {
            return ({
                outputMode: SplunkVisualizationBase.RAW_OUTPUT_MODE,
                count: 0
            });
        },

        // Override to respond to re-sizing events
        reflow: function() {}
    });
});

