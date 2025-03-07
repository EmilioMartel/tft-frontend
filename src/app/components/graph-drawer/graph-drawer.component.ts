import { Component, ElementRef, EventEmitter, Output, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphData, GraphService } from '../../services/graph/graph.service';
import { GraphStateService } from '../../services/graph-state/graph-state.service';
import * as d3 from 'd3';

@Component({
  selector: 'app-graph-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './graph-drawer.component.html',
  styleUrls: ['./graph-drawer.component.css'],
})
export class GraphDrawerComponent {
  private graphState = inject(GraphStateService);
  private graphService = inject(GraphService);
  private elementRef = inject(ElementRef);
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private zoomGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private zoomBehavior!: d3.ZoomBehavior<SVGSVGElement, unknown>;

  @Output() graphInfo = new EventEmitter<{ nodes: number; links: number }>();

  constructor() {
    // Effect para actualizar la visualización cada vez que cambian los valores en el servicio.
    effect(() => {
      const zoom = this.graphState.zoom;
      const nodeWidth = this.graphState.nodeWidth;
      const randomColors = this.graphState.randomColors;
      const showNodeLabels = this.graphState.showNodeLabels;

      console.log('Actualizando grafo con:', { zoom, nodeWidth, randomColors, showNodeLabels });

      if (this.svg) {
        this.updateGraphDisplay(zoom, nodeWidth, randomColors, showNodeLabels);
      }
    });

    // Effect para renderizar el grafo cuando se dispongan de datos.
    effect(() => {
      const graph = this.graphService.graphData();
      if (graph) {
        this.graphInfo.emit({ nodes: graph.nodes.length, links: graph.links.length });
        this.renderInteractiveGraph(graph);
      }
    });
  }

  private renderInteractiveGraph(graph: GraphData): void {
    const element = this.elementRef.nativeElement;
    d3.select(element).select('svg').remove();

    this.graphInfo.emit({ nodes: graph.nodes.length, links: graph.links.length });

    const width = '100%';
    const height = '100%';

    this.svg = d3
      .select(element)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background-color', '#f4f4f4');

    this.zoomGroup = this.svg.append('g');

    // Inicializar comportamiento de zoom
    this.zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .extent([[0,0],[100,100]])
      .on('zoom', (event) => this.zoomGroup.attr('transform', event.transform));

    // Aplicar zoom inicial
    this.svg.call(this.zoomBehavior);
    this.svg.call(this.zoomBehavior.transform, d3.zoomIdentity.scale(this.graphState.zoom));

    const simulation = d3
      .forceSimulation(graph.nodes)
      .force('link', d3.forceLink(graph.links).id((d: any) => d.id).distance(300))
      .force('charge', d3.forceManyBody().strength(0))
      .force('center', d3.forceCenter(300, 300));

    const link = this.zoomGroup
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(graph.links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1);

    const node = this.zoomGroup
      .append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(graph.nodes)
      .join('circle')
      .attr('r', this.graphState.nodeWidth)
      .attr('fill', () => (this.graphState.randomColors ? this.getRandomColor() : '#1f77b4'))
      .call(
        d3.drag<any, any>()
          .on('start', (event, d) => this.dragStarted(event, d, simulation, this.svg))
          .on('drag', (event, d) => this.dragged(event, d))
          .on('end', (event, d) => this.dragEnded(event, d, this.svg))
      );

    const labels = this.zoomGroup
      .append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(graph.nodes)
      .join('text')
      .attr('font-size', '12px')
      .attr('fill', '#333')
      .text((d: any) => d.id)
      .attr('visibility', this.graphState.showNodeLabels ? 'visible' : 'hidden');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);

      labels.attr('x', (d: any) => d.x + 10).attr('y', (d: any) => d.y + 4);
    });
  }

  private updateGraphDisplay(
    zoom: number,
    nodeWidth: number,
    randomColors: boolean,
    showNodeLabels: boolean
  ): void {
    // Aplicar zoom cuando cambia el estado
    if (this.svg) {
      this.svg.transition().duration(500).call(this.zoomBehavior.transform, d3.zoomIdentity.scale(zoom));
    }

    // Actualizar nodos y colores
    this.zoomGroup.selectAll('.nodes circle').attr('r', nodeWidth).attr('fill', () =>
      randomColors ? this.getRandomColor() : '#1f77b4'
    );

    // Actualizar visibilidad de etiquetas
    this.zoomGroup.selectAll('.labels text').attr('visibility', showNodeLabels ? 'visible' : 'hidden');
  }

  private dragStarted(event: any, d: any, simulation: any, svg: any): void {
    svg.on('.zoom', null);
    if (!event.active) simulation.alphaTarget(0.9).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  private dragged(event: any, d: any): void {
    d.fx = event.x;
    d.fy = event.y;
  }

  private dragEnded(event: any, d: any, svg: any): void {
    d.fx = d.x;
    d.fy = d.y;
    svg.call(this.zoomBehavior);
  }

  private getRandomColor(): string {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  }
}
