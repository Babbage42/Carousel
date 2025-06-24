import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationLeftExternalComponent } from './navigation-left-external.component';

describe('NavigationLeftExternalComponent', () => {
  let component: NavigationLeftExternalComponent;
  let fixture: ComponentFixture<NavigationLeftExternalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationLeftExternalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NavigationLeftExternalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
