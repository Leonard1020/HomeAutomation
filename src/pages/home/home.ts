import { Component ,ViewChild } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';
import { BaseChartDirective } from 'ng2-charts';
import { Network } from '@ionic-native/network';
import { Geolocation } from '@ionic-native/geolocation';
import { Toast } from '@ionic-native/toast';
import { NativeGeocoder,
         NativeGeocoderReverseResult,
       /*NativeGeocoderForwardResult*/ } from '@ionic-native/native-geocoder';
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

  private location: any;

  private forecast: any;
  private daily: Array<any>;
  private hourly: Array<any>;
  private hourlyTemps: Array<any>;
  private hourlyPercs: Array<any>;

  private rooms: Array<any>;

  public showingTemp: boolean;
  public lineChartType: string;
  public lineChartData: Array<any>;
  public lineChartLabels: Array<any>;
  public lineChartOptions: any;
  public lineChartColors: Array<any>;

  public showSpinner: boolean;

  constructor(public navCtrl: NavController,
              public network: Network,
              public platform: Platform,
              public toast: Toast,
              public gps: Geolocation,
              public geoCoder: NativeGeocoder,
              public graphHelper: WeatherGraphHelper,
              public proxy: WeatherProxy) {
    this.rooms = [];
    this.forecast = {};
    this.daily = [];
    this.hourly = [];
    this.hourlyTemps = [];
    this.hourlyPercs = [];
    this.showingTemp = true;

    this.showSpinner = true;

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

    //Default to Greenfield WI
    this.location = {
      "name": "Greenfield",
      "latitude": 42.961,
      "longitude": -88.013
    };
  }

  ionViewDidLoad() {
    this.pullData(undefined);
  }

  pullData(refresher) {
    var count = 0;
    this.getLocation((error: string) => {
      if (error) {
        this.createToast(error);

        //Default to Greenfield WI
        this.location.name = "Greenfield"
        this.location.latitude = 42.961;
        this.location.longitude = -88.013;
      }

      this.getURL((url: string) => {
        this.getForecast(url, () => {
          count++;
        });
        this.getRoomTemp(url, () => {
          count++;
        });
      })
    })

    //Wait for response
    var timeout = 60000;
    var timer = setInterval(() => {
      if (count > 1) {
        clearInterval(timer);
        if (refresher)
          refresher.complete();
      }
      timeout -= 100;
      if (timeout < 0) {
        clearInterval(timer);
        this.showSpinner = false;
        this.createToast("Could not reach proxy");
        if (refresher)
          refresher.complete();
      }
    }, 100);
  }

  private getLocation(callback: (error: string) => void) {
    this.gps.getCurrentPosition()
      .then((res) => {
        var lat = res.coords.latitude;
        var lon = res.coords.longitude;
        this.location.latitude = lat;
        this.location.longitude = lon;

        this.geoCoder.reverseGeocode(lat, lon)
          .then((result: NativeGeocoderReverseResult[]) => {
            var city = result[0].locality;
            this.location.name = city;
            return callback(undefined);
          })
          .catch((error) => {
            console.log('Error with reverseGeoCode', error);
            return callback('Unable to get city info');
          });
      }).catch((error) => {
        console.log('Error getting location', error);
        if (error.code == 1)
          return callback('Location permission denied');
        else
          return callback('Unable to get location');
      });
  }

  private getURL(callback: (url: string) => void) {
    if (this.network.type == 'wifi') {
      WifiWizard2.requestPermission();
      WifiWizard2.getConnectedBSSID()
        .then((mac) => {
          return callback(mac == this.localMac ?
                                 this.localURL :
                                 this.remoteURL)
        })
        .catch((error) => {
          return callback(this.remoteURL);
        });
    } else if (this.platform.is('core')) {
      return callback(this.localURL);
    } else {
      return callback(this.remoteURL);
    }
  }

  getForecast(url: string, callback: () => void) {
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

        return callback();
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
    this.showSpinner = false;
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

  getRoomTemp(url: string, callback: () => void) {
    this.proxy.getRoomTemp(url)
      .subscribe(data => {
        this.rooms = data;

        this.rooms.forEach(r => {
          r.feelsLike = this.proxy.calculateFeelsLike(r.temperature, r.humidity);
        });
        return callback();
      });
  }

  private createToast(message: string) {
    if (!this.platform.is('core')) {
      this.toast.showLongBottom(message)
        .subscribe(toast => console.log(toast));
    }
  }
}
