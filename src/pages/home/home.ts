import { Component ,ViewChild } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';
import { BaseChartDirective } from 'ng2-charts';
import { Network } from '@ionic-native/network';
import { WeatherProxy } from '../../providers/weatherProxy';
import { WeatherGraphHelper } from '../../providers/WeatherGraphHelper';

declare let WifiWizard2: any;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  @ViewChild(BaseChartDirective)
  public chart: BaseChartDirective;

  private readonly remoteURL: string = "http://honeycompress.ddns.net:5055";
  private readonly localURL: string = "http://192.168.2.11:5055";
  private readonly localMac: string = "94:10:3e:b3:fe:7d";

  private readonly location = {
    name: "West Allis",
    latitude: 43.0167,
    longitude: -88.007
  };

  private showingTemp: boolean;

  private forecast: any;
  private daily: Array<any>;
  private hourly: Array<any>;
  private hourlyTemps: Array<any>;
  private hourlyPercs: Array<any>;

  private rooms: Array<any>;

  private lineChartType: string;
  private lineChartData: Array<any>;
  private lineChartLabels: Array<any>;
  private lineChartOptions: any;
  private lineChartColors: Array<any>;

  constructor(public navCtrl: NavController,
              public network: Network,
              public platform: Platform,
              public graphHelper: WeatherGraphHelper,
              public proxy: WeatherProxy) {
    this.rooms = [];
    this.forecast = {};
    this.daily = [];
    this.hourly = [];
    this.hourlyTemps = [];
    this.hourlyPercs = [];
    this.showingTemp = true;

    // Show Temp graph by default
    this.lineChartType = graphHelper.graphType;
    this.lineChartColors = graphHelper.temperatureColors;
    this.lineChartOptions = {
      tooltips: { enabled: false },
      animation: graphHelper.onTempAnimationComplete,
      scales: {
        yAxes: [{ ticks: { display: false }}]
      }
    };
  }

  ionViewDidLoad() {
    if (this.network.type == 'wifi') {
      WifiWizard2.requestPermission();
      WifiWizard2.getConnectedBSSID()
        .then((mac) => {
          var url = mac == this.localMac ?
                           this.localURL :
                           this.remoteURL;
          this.getForecast(url);
          this.getRoomTemp(url);
        });
    } else if (this.platform.is('core')) {
      this.getForecast(this.localURL);
      this.getRoomTemp(this.localURL);
    } else {
      this.getForecast(this.remoteURL);
      this.getRoomTemp(this.remoteURL);
    }
  }

  getForecast(url: string) {
    this.proxy.getForecast(url,
                           this.location.latitude,
                           this.location.longitude)
      .subscribe(data => {
        this.forecast = data.currently;
        this.hourly = data.hourly.data;
        this.daily = data.daily.data;

        // Convert DarkSky icon to WeatherIcon
        this.forecast.icon = this.proxy.parseIcon(this.forecast.icon);

        // Get the day of the week for each day
        this.daily.forEach(d => {
          var day = new Date(d.time * 1000).getDay()
          d.dayOfWeek = this.graphHelper.getDayOfWeek(day);
          d.icon = this.proxy.parseIcon(d.icon);
        });
        this.daily = this.daily.slice(1, 6);

        // Get the day of the week for each day
        this.hourly.forEach(h => {
          var hour = new Date(h.time * 1000).getHours()
          h.hour = this.graphHelper.getHour(hour);
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
      var maxPadding = max % 5 < 2 ? 5 - max % 5 : max % 5;
      var minPadding = min % 5 < 1 ? 2 : min % 5;
      this.lineChartOptions.scales.yAxes[0].ticks.max = max + maxPadding;
      this.lineChartOptions.scales.yAxes[0].ticks.min = min - minPadding;
    } else {
      // Percipitation will you 0 - 100 %
      this.lineChartOptions.scales.yAxes[0].ticks.max = 100;
      this.lineChartOptions.scales.yAxes[0].ticks.min = 0;
    }

    //Update animation to show degree or percent sign
    this.lineChartOptions.animation = temp ?
                                      this.graphHelper.onTempAnimationComplete :
                                      this.graphHelper.onPercipAnimationComplete;

    //Update colors
    this.lineChartColors = temp ?
                           this.graphHelper.temperatureColors :
                           this.graphHelper.percipitationColors;

    // Update the graph with temp data points by default
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

  getRoomTemp(url: string) {
    this.proxy.getRoomTemp(url)
      .subscribe(data => {
        this.rooms = data;

        this.rooms.forEach(r => {
          r.feelsLike = this.proxy.calculateFeelsLike(r.temperature, r.humidity);
        });
      });
  }
}
