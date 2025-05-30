import { Component, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { GraphStateService } from '../../services/graph-state/graph-state.service';
import { GraphService } from '../../services/graph/graph.service';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { BandageService } from '../../services/bandage/bandage.service';
import { mapGraphStats, GraphStats } from '../../utils/graph-stats.mapper';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { mapGraphStatsToDisplay } from '../../utils/graph-stats.mapper';
import { finalize, switchMap } from 'rxjs';
@Component({
  selector: 'app-graph-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzSliderModule,
    NzCheckboxModule,
    NzInputNumberModule,
    NzIconModule,
    NzUploadModule,
    NzModalModule,
  ],
  templateUrl: './graph-menu.component.html',
  styleUrls: ['./graph-menu.component.css'],
})
export class GraphMenuComponent {
  uploading = false;
  uploadSuccessful = false;
  fileList: NzUploadFile[] = [];
  isVisible = false;

  @Input() stats: GraphStats | null = null;
  @Input() statsDisplay: Record<string, string | number> = {};
  @Output() drawGraphClicked = new EventEmitter<void>();

  constructor(
    public graphState: GraphStateService,
    public graphService: GraphService,
    private messageService: NzMessageService,
    private bandageService: BandageService
  ) {}

  showModal(): void {
    this.isVisible = true;
  }

  handleOk(): void {
    console.log('Button ok clicked!');
    this.isVisible = false;
  }

  handleCancel(): void {
    console.log('Button cancel clicked!');
    this.isVisible = false;
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    this.fileList = this.fileList.concat(file);
    return false;
  };

  handleUpload(): void {
    if (this.fileList.length === 0) {
      this.messageService.warning('No hay archivos para subir.');
      return;
    }

    const file = this.fileList[0] as unknown as File;
    const validExtensions = ['.layout', '.gfa'];

    if (!validExtensions.some((ext) => file.name.endsWith(ext))) {
      this.messageService.error(
        'Formato de archivo no permitido. Solo se aceptan archivos <b>.layout</b> o <b>.gfa</b>.'
      );
      return;
    }

    this.uploading = true;

    this.graphService
      .uploadFile(file)
      .pipe(
        switchMap(() => this.bandageService.getGraphLayout()),
        finalize(() => (this.uploading = false))
      )
      .subscribe({
        next: (layout) => {
          this.fileList = [];
          this.uploadSuccessful = true;
          this.messageService.success('Archivo subido y layout generado.');
          console.log('Layout recibido:', layout);
        },
        error: (err) => {
          console.error('Error en el flujo completo:', err);
          this.messageService.error('Error al procesar el layout.');
        },
      });
  }

  drawGraph() {
    this.graphService.fetchGraph();
    this.bandageService.getGraphInfo().subscribe((info) => {
      const mapped = mapGraphStats(info);
      this.stats = mapped;
      this.statsDisplay = mapGraphStatsToDisplay(mapped);
    });
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
