import { Component } from '@angular/core';

import { CalendarPage } from '../calendar/calendar';
import { HomePage } from '../home/home';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = HomePage;
  tab2Root = CalendarPage;

  constructor() {

  }
}
