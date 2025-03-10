import { Component, Input } from '@angular/core';
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
    NzUploadModule
  ],
  templateUrl: './graph-menu.component.html',
  styleUrls: ['./graph-menu.component.css']
})
export class GraphMenuComponent {
  uploading = false;
  uploadSuccessful = false;
  fileList: NzUploadFile[] = [];

  @Input() graphInfo: { nodes: number; links: number } = { nodes: 0, links: 0 };

  constructor(
    public graphState: GraphStateService,
    public graphService: GraphService,
    private messageService: NzMessageService
  ) {}

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
  
    if (!validExtensions.some(ext => file.name.endsWith(ext))) {
      this.messageService.error('Formato de archivo no permitido. Solo se aceptan archivos <b>.layout</b> o <b>.gfa</b>.');
      return;
    }
  
    this.uploading = true;
  
    this.graphService.uploadFile(file).subscribe({
      next: () => {
        this.uploading = false;
        this.fileList = [];
        this.uploadSuccessful = true;
        this.messageService.success('Archivo subido exitosamente.');
      },
      error: (error) => {
        this.uploading = false;
        this.messageService.error('Error al subir archivo.');
      }
    });
  }
  
  drawGraph() {
    this.graphService.fetchGraph();
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
