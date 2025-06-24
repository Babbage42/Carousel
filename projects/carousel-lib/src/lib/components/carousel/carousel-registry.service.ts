import { Injectable, signal, TemplateRef, WritableSignal } from '@angular/core';
import { CarouselComponent } from './carousel.component';

@Injectable({ providedIn: 'root' })
export class CarouselRegistryService {
  public carouselNavigationLeftSignal: WritableSignal<
    TemplateRef<any> | undefined
  > = signal(undefined);

  public carouselNavigationRightSignal: WritableSignal<
    TemplateRef<any> | undefined
  > = signal(undefined);

  public hasExternalControls = signal(false);
}
