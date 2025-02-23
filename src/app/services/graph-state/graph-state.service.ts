import { Injectable, Signal, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GraphStateService {
  private _zoom = signal(5);
  private _nodeWidth = signal(5.0);
  private _randomColors = signal(false);
  private _showNodeLabels = signal(false);

  // Getters y setters para permitir la mutabilidad en el template

  get zoom() {
    console.log("zoom service:", this._zoom);

    return this._zoom();
  }
  set zoom(value: number) {
    this._zoom.set(value);
  }

  get nodeWidth() {
    return this._nodeWidth();
  }
  set nodeWidth(value: number) {
    this._nodeWidth.set(value);
  }

  get randomColors() {
    return this._randomColors();
  }
  set randomColors(value: boolean) {
    this._randomColors.set(value);
  }

  get showNodeLabels() {
    return this._showNodeLabels();
  }
  set showNodeLabels(value: boolean) {
    this._showNodeLabels.set(value);
  }
}
