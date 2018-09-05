import { Injectable } from '@angular/core';

@Injectable()
export class WeatherGraphHelper {

  readonly graphType:string = 'line';

  readonly percipitationColors: Array<any> = [{
    backgroundColor: 'rgba(0, 100, 255, 0.4)',
    borderColor: 'rgba(0, 100, 255, 1)',
    pointBackgroundColor: 'rgba(0, 100, 255, 1)',
    pointBorderColor: 'rgba(0, 100, 255, 1)'
  }];

  readonly temperatureColors: Array<any> = [{
    backgroundColor: 'rgba(255, 227, 51, 0.4)',
    borderColor: 'rgba(255, 227, 51, 1)',
    pointBackgroundColor: 'rgba(255, 227, 51, 1)',
    pointBorderColor: 'rgba(255, 227, 51, 1)'
  }];

  readonly onTempAnimationComplete:any = {
    onComplete: function () {
      var chartInstance = this.chart;
      var ctx = chartInstance.ctx;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';

      this.data.datasets.forEach(function (dataset, i) {
        var meta = chartInstance.controller.getDatasetMeta(i);
        meta.data.forEach(function (bar, index) {
          var data = dataset.data[index].toFixed(0) + "\xB0";
          ctx.fillText(data, bar._model.x, bar._model.y - 5);
        });
      });
    }
  };

  readonly onPercipAnimationComplete:any = {
    onComplete: function () {
      var chartInstance = this.chart;
      var ctx = chartInstance.ctx;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';

      this.data.datasets.forEach(function (dataset, i) {
        var meta = chartInstance.controller.getDatasetMeta(i);
        meta.data.forEach(function (bar, index) {
          var data = dataset.data[index].toFixed(0) + "%";
          ctx.fillText(data, bar._model.x, bar._model.y - 5);
        });
      });
    }
  };

  constructor() { }

  // Date.getDay() return 0 for Sun, 1 for Mon, etc
  public getDayOfWeek(index: number): string {
    var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return days[index];
  }

  // Date.getHours() returns 0-23
  public getHour(index: number): string {
    if (index == 0)
      return "12am";
    else if (index == 12)
      return "12pm";
    else if (index > 12)
      return `${index - 12}pm`;
    else
      return `${index}am`
  }
}
