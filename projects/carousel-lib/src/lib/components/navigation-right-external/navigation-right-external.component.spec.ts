import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationRightExternalComponent } from './navigation-right-external.component';

describe('NavigationLeftExternalComponent', () => {
  let component: NavigationRightExternalComponent;
  let fixture: ComponentFixture<NavigationRightExternalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationRightExternalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NavigationRightExternalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
