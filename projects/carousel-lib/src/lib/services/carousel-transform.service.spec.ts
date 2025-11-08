import { TestBed } from '@angular/core/testing';
import { CarouselTransformService } from './carousel-transform.service';

describe('CarouselTransformService', () => {
  let service: CarouselTransformService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CarouselTransformService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
