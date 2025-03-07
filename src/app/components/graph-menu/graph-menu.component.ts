import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { GraphStateService } from '../../services/graph-state/graph-state.service';
import { GraphService } from '../../services/graph/graph.service';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';

@Component({
  selector: 'app-graph-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzSliderModule,
    NzCheckboxModule,
    NzInputNumberModule
  ],
  templateUrl: './graph-menu.component.html',
  styleUrls: ['./graph-menu.component.css']
})
export class GraphMenuComponent {
  
  @Input() graphInfo: { nodes: number; links: number } = { nodes: 0, links: 0 };

  constructor(public graphState: GraphStateService, public graphService: GraphService) {}

  drawGraph() {
    console.log('Drawing graph with current settings...');
  }

  get zoom(): number {
    return this.graphState.zoom;
  }
  set zoom(value: number) {
    this.graphState.zoom = value;
  }

  get nodeWidth(): number {
    return this.graphState.nodeWidth;
  }
  set nodeWidth(value: number) {
    this.graphState.nodeWidth = value;
  }

  get randomColors(): boolean {
    return this.graphState.randomColors;
  }
  set randomColors(value: boolean) {
    this.graphState.randomColors = value;
  }

  get showNodeLabels(): boolean {
    return this.graphState.showNodeLabels;
  }
  set showNodeLabels(value: boolean) {
    this.graphState.showNodeLabels = value;
  }
}
