import { Component } from '@angular/core';
import { GraphService } from '../../services/graph/graph.service';

@Component({
  selector: 'app-graph',
  imports: [],
  templateUrl: './graph.component.html',
  styleUrl: './graph.component.css'
})
export class GraphComponent {

  constructor(private graphService: GraphService){}

}
