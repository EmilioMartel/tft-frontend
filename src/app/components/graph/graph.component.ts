import { Component, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphData, GraphService } from '../../../../src/app/services/graph/graph.service';
import * as d3 from 'd3';

@Component({
  selector: 'app-graph',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './graph.component.html',
  styleUrl: './graph.component.css',
})
export class GraphComponent {
  constructor(private graphService: GraphService, private el: ElementRef) {
    effect(() => {
      const graph = this.graphService.graphData();
      if (graph) this.renderInteractiveGraph(graph);
    });
  }

  private renderInteractiveGraph(graph: GraphData): void {
    const element = this.el.nativeElement;

    // Limpiar cualquier SVG anterior antes de renderizar uno nuevo
    d3.select(element).select('svg').remove();

    const width = 800;
    const height = 600;

    // Crear el SVG con fondo de color y agrupar todo en un <g> para aplicar zoom
    const svg = d3
      .select(element)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background-color', '#f4f4f4');

    // Agrupación para aplicar zoom
    const zoomGroup = svg.append('g');

    // Configuración de zoom
    const zoom = d3.zoom<SVGSVGElement, any>()
      .scaleExtent([0.5, 5])
      .on('zoom', (event) => zoomGroup.attr('transform', event.transform));
    
    // Aplicar zoom al SVG
    svg.call(zoom);

    // Definir simulación de fuerza para el grafo
    const simulation = d3
      .forceSimulation(graph.nodes)
      .force('link', d3.forceLink(graph.links).id((d: any) => d.id).distance(300))
      .force('charge', d3.forceManyBody().strength(0)) // Sin repulsión ni agrupamiento
      .velocityDecay(0.9) // Reduce el movimiento residual
      .on('end', () => {
        // Al terminar la simulación, quita la fuerza de colisión
        simulation.force('collision', null);
      });

    // Dibujar enlaces
    const link = zoomGroup
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(graph.links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1);

    // Dibujar nodos
    const node = zoomGroup
      .append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(graph.nodes)
      .join('circle')
      .attr('r', 8)
      .attr('fill', '#1f77b4')
      .call(
        d3
          .drag<any, any>()
          .on('start', (event, d) => this.dragStarted(event, d, simulation, svg))
          .on('drag', (event, d) => this.dragged(event, d))
          .on('end', (event, d) => this.dragEnded(event, d, svg))
      );

    // Agregar etiquetas de texto para los nodos
    const labels = zoomGroup
      .append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(graph.nodes)
      .join('text')
      .attr('font-size', '12px')
      .attr('fill', '#333')
      .text((d: any) => d.id);

    // Actualizar posiciones en cada tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);

      labels
        .attr('x', (d: any) => d.x + 10)
        .attr('y', (d: any) => d.y + 4);
    });
  }

  private dragStarted(event: any, d: any, simulation: any, svg: any): void {
    // Desactiva temporalmente el zoom al arrastrar
    svg.on('.zoom', null);

    // Reactiva la simulación solo para el nodo arrastrado
    if (!event.active) simulation.alphaTarget(0.9).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  private dragged(event: any, d: any): void {
    // Solo mueve el nodo seleccionado
    d.fx = event.x;
    d.fy = event.y;
  }

  private dragEnded(event: any, d: any, svg: any): void {
    // Fija el nodo en la posición actual
    d.fx = d.x;
    d.fy = d.y;

    // Reactiva el zoom al soltar el nodo
    svg.call(
      d3.zoom<SVGSVGElement, any>()
        .scaleExtent([0.5, 10])
        .on('zoom', (event) => svg.select('g').attr('transform', event.transform))
    );
  }
}
