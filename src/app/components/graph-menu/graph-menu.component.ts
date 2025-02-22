import { Component, Input, Signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
    MatSliderModule
  ],
  templateUrl: './graph-menu.component.html',
  styleUrls: ['./graph-menu.component.scss']
})
export class GraphMenuComponent {
  // Si usas Signals, puedes inyectar un Signal<boolean> para controlar la apertura; 
  // en este ejemplo, para simplificar, usaremos un valor fijo.
  @Input() isOpen!: Signal<boolean>;

  graphInfo = {
    nodes: 61,
    edges: 82,
    totalLength: 210.747
  };

  displayOptions = {
    zoom: 89.7,
    nodeWidth: 5.0,
    randomColors: true
  };

  nodeLabels = {
    custom: false,
    name: false,
    length: false
  };

  blastQuery = '';

  drawGraph() {
    console.log('Drawing graph with current settings...');
  }
}
