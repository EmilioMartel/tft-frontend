import { Component } from '@angular/core';


import { GraphDrawerComponent } from '../graph-drawer/graph-drawer.component';
import { GraphMenuComponent } from '../graph-menu/graph-menu.component';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-graph',
  imports: [
    GraphDrawerComponent,
    GraphMenuComponent,
    NzDrawerModule,
    NzButtonModule
  ],
  templateUrl: './graph.component.html',
  styleUrl: './graph.component.css'
})
export class GraphComponent {
  drawerVisible = false;
  showFiller = false
  graphData = { nodes: 0, links: 0 };

  close(): void {
    this.drawerVisible = false;
  } 
}
