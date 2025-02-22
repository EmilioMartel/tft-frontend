import { Component } from '@angular/core';
import { GraphComponent } from './components/graph/graph.component';


@Component({
  selector: 'app-root',
  imports: [
    GraphComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'tft-frontend';
  
}
