// Default
import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

// Added Plugins
import { Network } from '@ionic-native/network';
import { Geolocation } from '@ionic-native/geolocation';
import { ChartsModule } from 'ng2-charts';
import { NativeGeocoder } from '@ionic-native/native-geocoder';
import { Toast } from '@ionic-native/toast';

// Implemented Pages
import { HomePage } from '../pages/home/home';
import { CalendarPage } from '../pages/calendar/calendar';
import { RadarPage } from '../pages/radar/radar'
import { TabsPage } from '../pages/tabs/tabs';

// Implemented Providers
import { WeatherProxy } from '../providers/weatherProxy';
import { WeatherGraphHelper } from '../providers/WeatherGraphHelper';

// Weather App
import { MyApp } from './app.component';

@NgModule({
  declarations: [
    MyApp,
    CalendarPage,
    HomePage,
    RadarPage,
    TabsPage
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(MyApp),
    ChartsModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    CalendarPage,
    HomePage,
    RadarPage,
    TabsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Network,
    Toast,
    Geolocation,
    NativeGeocoder,
    WeatherProxy,
    WeatherGraphHelper,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
