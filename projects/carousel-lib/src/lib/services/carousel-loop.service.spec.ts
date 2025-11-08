import { TestBed } from '@angular/core/testing';
import { CarouselLoopService } from './carousel-loop.service';

describe('CarouselLoopService', () => {
  let service: CarouselLoopService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CarouselLoopService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
