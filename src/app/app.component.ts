import { Component } from '@angular/core';
import {GraphComponent} from 'tft-graph-visualizer';

@Component({
  selector: 'app-root',
  imports: [GraphComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'tft-frontend';
}
