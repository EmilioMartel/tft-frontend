import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { GraphStateService } from '../../services/graph-state/graph-state.service';

@Component({
  selector: 'app-graph-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSidenavModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule,
    MatInputModule,
    MatSliderModule,
  
  ],
  templateUrl: './graph-menu.component.html',
  styleUrls: ['./graph-menu.component.scss']
})
export class GraphMenuComponent {
  localZoom: number;
  localNodeWidth: number;

  graphInfo = {
    nodes: 61,
    edges: 82,
    totalLength: 210.747
  };

  constructor(public graphState: GraphStateService) {
    this.localZoom = this.graphState.zoom;
    this.localNodeWidth = this.graphState.nodeWidth;
  }


  drawGraph() {
    console.log('Drawing graph with current settings...');
  }
}
