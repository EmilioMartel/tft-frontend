import { Injectable, Signal, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GraphStateService {
  private _zoom = signal(1);
  private _nodeWidth = signal(10);
  private _randomColors = signal(false);
  private _showNodeLabels = signal(false);

  get zoom() {
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
