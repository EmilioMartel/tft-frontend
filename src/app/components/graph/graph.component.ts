import { Component } from '@angular/core';

import { GraphDrawerComponent } from '../graph-drawer/graph-drawer.component';
import { GraphMenuComponent } from '../graph-menu/graph-menu.component';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { GraphStats } from '../../utils/graph-stats.mapper';
import { GraphService } from '../../services/graph/graph.service';
import { BandageService } from '../../services/bandage/bandage.service';

import {
  mapGraphStats,
  mapGraphStatsToDisplay,
} from '../../utils/graph-stats.mapper';

@Component({
  selector: 'app-graph',
  imports: [
    GraphDrawerComponent,
    GraphMenuComponent,
    NzDrawerModule,
    NzButtonModule,
  ],
  templateUrl: './graph.component.html',
  styleUrl: './graph.component.css',
})
export class GraphComponent {
  drawerVisible = false;
  showFiller = false;
  graphData = { nodes: 0, links: 0 };
  stats: GraphStats | null = null;
  statsDisplay: Record<string, string | number> = {};

  constructor(
    private graphService: GraphService,
    private bandageService: BandageService
  ) {}

  close(): void {
    this.drawerVisible = false;
  }

  drawGraph(): void {
    this.graphService.fetchGraph();
    this.bandageService.getGraphInfo().subscribe((info) => {
      console;
      const mapped = mapGraphStats(info);
      this.stats = mapped;
      this.statsDisplay = mapGraphStatsToDisplay(mapped);
    });
  }
}
