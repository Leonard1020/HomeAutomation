import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { SafeResourceUrl, DomSanitizer} from '@angular/platform-browser';

@Component({
  selector: 'page-radar',
  templateUrl: 'radar.html'
})
export class RadarPage {

  public radarUrl: SafeResourceUrl;

  constructor(public navCtrl: NavController,
              private sanitizer: DomSanitizer) {
    //Radar: radar
    //Percip: precipitation_rate
    this.radarUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      "https://maps.darksky.net/@radar,42.98,-88.01,9?" +
      "domain=%22+encodeURIComponent(window.location.href)+%22&" +
      "auth=1536423828_534da96e017d572d908664195495808b&" +
      "embed=true&" +
      "timeControl=true&" +
      "fieldControl=true&" +
      "defaultField=radar&" +
      "defaultUnits=_inph");
  }

}
