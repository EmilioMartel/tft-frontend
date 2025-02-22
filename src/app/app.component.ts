import { Component, signal } from '@angular/core';
import { GraphComponent } from './components/graph/graph.component';
import { GraphMenuComponent } from './components/graph-menu/graph-menu.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import {MatButtonModule} from '@angular/material/button';


@Component({
  selector: 'app-root',
  imports: [
    GraphComponent,
    GraphMenuComponent,
    MatSidenavModule,
    MatButtonModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'tft-frontend';
  showFiller = false

}
