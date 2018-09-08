import { Component } from '@angular/core';

import { CalendarPage } from '../calendar/calendar';
import { RadarPage } from '../radar/radar';
import { HomePage } from '../home/home';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = HomePage;
  tab2Root = RadarPage;
  tab3Root = CalendarPage;

  constructor() {

  }
}
