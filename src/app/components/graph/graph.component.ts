import { Component } from '@angular/core';


import { GraphDrawerComponent } from '../graph-drawer/graph-drawer.component';
import { GraphMenuComponent } from '../graph-menu/graph-menu.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-graph',
  imports: [
    GraphDrawerComponent,
    GraphMenuComponent,
    MatSidenavModule,
    MatButtonModule
  ],
  templateUrl: './graph.component.html',
  styleUrl: './graph.component.css'
})
export class GraphComponent {
  showFiller = false
  graphData = { nodes: 0, links: 0 };

}
