import { Component ,ViewChild } from '@angular/core';
import { NavController } from 'ionic-angular';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts'
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  @ViewChild(BaseChartDirective)
  public chart: BaseChartDirective;

  private location = {
    name: "West Allis",
    latitude: 43.0167,
    longitude: -88.007
  };

  private forecast: any = {};
  private daily: Array<any> = [];
  private hourly: Array<any> = [];
  private hourlyTemps: Array<any> = [];
  private hourlyPercs: Array<any> = [];
  private showingTemp: boolean = true;

  private rooms: Array<any> = [];

  private lineChartData:Array<any>;
  private lineChartLabels:Array<any> = [];

  private onTempAnimationComplete:any = {
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

  private onPercipAnimationComplete:any = {
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

  private lineChartOptions:any = {
    tooltips: {
      enabled: false
    },
    animation: this.onTempAnimationComplete,
    scales: {
      yAxes: [{
        ticks: {
          display: false
        }
      }]
    }
  };

  private percipitationColors: Array<any> = [{
    backgroundColor: 'rgba(0, 100, 255, 0.4)',
    borderColor: 'rgba(0, 100, 255, 1)',
    pointBackgroundColor: 'rgba(0, 100, 255, 1)',
    pointBorderColor: 'rgba(0, 100, 255, 1)'
  }];

  private temperatureColors: Array<any> = [{
    backgroundColor: 'rgba(255, 227, 51, 0.4)',
    borderColor: 'rgba(255, 227, 51, 1)',
    pointBackgroundColor: 'rgba(255, 227, 51, 1)',
    pointBorderColor: 'rgba(255, 227, 51, 1)'
  }];

  private lineChartColors:Array<any> = this.temperatureColors;
  private lineChartType:string = 'line';

  constructor(public navCtrl: NavController, public http: HttpClient) {

  }

  ionViewDidLoad() {
    this.getForecast();
    this.getRoomTemp();
  }

  getForecast() {
    this.http
      .get(`http://192.168.2.11:5055/temp/forecast/${this.location.latitude},${this.location.longitude}`)
      .map(res => JSON.parse(JSON.stringify(res)))
      .subscribe(data => {
        this.forecast = data.currently;
        this.hourly = data.hourly.data;
        this.daily = data.daily.data;

        // Convert DarkSky icon to WeatherIcon
        this.forecast.icon = this.parseIcon(this.forecast.icon);

        // Get the day of the week for each day
        this.daily.forEach(d => {
          var day = new Date(d.time * 1000).getDay()
          d.dayOfWeek = this.getDayOfWeek(day);
          d.icon = this.parseIcon(d.icon);
        });
        this.daily = this.daily.slice(1, 6);

        // Get the day of the week for each day
        this.hourly.forEach(h => {
          var hour = new Date(h.time * 1000).getHours()
          h.hour = this.getHour(hour);
        });
        this.hourly.splice(13);
        this.hourly = this.hourly.filter((h, i) => {
          return i % 2 == 0;
        });

        // Map the graph data points
        this.hourlyTemps = this.hourly.map(h => h.temperature);
        this.hourlyPercs = this.hourly.map(h => h.precipProbability * 100);

        this.updateGraph(true);

        // Update the X-Axis with hours
        this.lineChartLabels = this.hourly.map(h => h.hour);
      });
  }

  updateGraph(temp: boolean) {
    this.showingTemp = temp;
    var data = temp ? this.hourlyTemps : this.hourlyPercs;

    if (temp) {
      // Shift the Y-Axis to display the largest and smallest temp
      var max = Math.max(...data);
      var min = Math.min(...data);
      var maxPadding = max % 5 < 1 ? 5 - max % 5 : max % 5;
      var minPadding = min % 5 < 1 ? 5 : min % 5;
      this.lineChartOptions.scales.yAxes[0].ticks.max = max + maxPadding;
      this.lineChartOptions.scales.yAxes[0].ticks.min = min - minPadding;
    } else {
      // Percipitation will you 0 - 100 %
      this.lineChartOptions.scales.yAxes[0].ticks.max = 100;
      this.lineChartOptions.scales.yAxes[0].ticks.min = 0;
    }

    //Update animation to show degree or percent sign
    this.lineChartOptions.animation = temp ? this.onTempAnimationComplete : this.onPercipAnimationComplete;

    //Update colors
    this.lineChartColors = temp ? this.temperatureColors : this.percipitationColors;

    // Update the graph with temp data points by default
    this.lineChartData = null;
    this.lineChartData = [{
      'data': data
    }];

    if (this.chart) {
      this.chart.chart.showingTemp = temp;
      this.chart.ngOnDestroy();
      this.chart.colors = this.lineChartColors;
      this.chart.chart = this.chart.getChartBuilder(this.chart.ctx);
    }
  }

  parseIcon(icon: string): string {
    switch (icon) {
      case "clear-day":
        return "wi-day-sunny";
      case "clear-night":
        return "wi-night-clear";
      case "rain":
        return "wi-rain";
      case "snow":
        return "wi-snow";
      case "sleet":
        return "wi-sleet";
      case "wind":
        return "wi-strong-wind";
      case "fog":
        return "wi-fog";
      case "cloudy":
        return "wi-cloudy";
      case "partly-cloudy-day":
        return "wi-day-cloudy";
      case "partly-cloudy-night":
        return "wi-night-alt-cloudy";
      case "thunderstorm":
        return "wi-thunderstorm";
      default:
          return "wi-na";
    }
  }

  // Date.getDay() return 0 for Sun, 1 for Mon, etc
  getDayOfWeek(index: number): string {
    var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return days[index];
  }

  // Date.getHours() returns 0-23
  getHour(index: number): string {
    if (index == 0)
      return "12am";
    else if (index == 12)
      return "12pm";
    else if (index > 12)
      return `${index - 12}pm`;
    else
      return `${index}am`
  }

  getRoomTemp() {
    this.http
      .get('http://192.168.2.11:5055/temp/rooms')
      .map(res => JSON.parse(JSON.stringify(res)))
      .subscribe(data => {
        this.rooms = data;

        this.rooms.forEach(r => {
          r.feelsLike = this.calculateFeelsLike(r.temperature, r.humidity);
        });
      });
  }

  calculateFeelsLike(temp: number, humid: number): number {
    var heatIndex = 0.5 * (temp + 61.0 + ((temp - 68.0) * 1.2) + ( humid * 0.094));
    if (heatIndex < 80)
      return heatIndex;

    return -42.379 +
      2.04901523 * temp +
      10.14333127 * humid -
      .22475541 * temp * humid -
      .00683783 * temp * temp -
      .05481717 * humid * humid +
      .00122874 * temp * temp * humid +
      .00085282 * temp * humid * humid -
      .00000199 * temp * temp * humid * humid;
  }
}
