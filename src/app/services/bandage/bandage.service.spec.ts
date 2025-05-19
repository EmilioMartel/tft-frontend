import { TestBed } from '@angular/core/testing';

import { BandageService } from './bandage.service';

describe('BandageService', () => {
  let service: BandageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BandageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
