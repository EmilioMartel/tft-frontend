import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { GraphStateService } from '../../services/graph-state/graph-state.service';
import { GraphService } from '../../services/graph/graph.service';

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
  
  @Input() graphInfo: { nodes: number; links: number } = { nodes: 0, links: 0 };

  constructor(public graphState: GraphStateService, public graphService: GraphService) {}

  drawGraph() {
    console.log('Drawing graph with current settings...');
  }
}
