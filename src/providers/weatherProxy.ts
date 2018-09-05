import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Network } from '@ionic-native/network';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

@Injectable()
export class WeatherProxy {

  constructor(public http: HttpClient, private network: Network) { }

  getRoomTemp(url: string) {
    return this.http
      .get(`${url}/temp/rooms`)
      .map(res => JSON.parse(JSON.stringify(res)));
  }

  getForecast(url: string, latitude: number, longitude: number) {
    return this.http
      .get(`${url}/temp/forecast/${latitude},${longitude}`)
      .map(res => JSON.parse(JSON.stringify(res)));
  }

  // Taken from https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml
  public calculateFeelsLike(temp: number, humid: number): number {
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

  // Convert DarkSky icons to WeatherIcon
  public parseIcon(icon: string): string {
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
}
