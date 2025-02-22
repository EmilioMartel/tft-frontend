import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphDrawerComponent } from './graph-drawer.component';

describe('GraphComponent', () => {
  let component: GraphDrawerComponent;
  let fixture: ComponentFixture<GraphDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphDrawerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GraphDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
