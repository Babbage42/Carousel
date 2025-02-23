import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[slide]',
  standalone: true,
})
export class SlideDirective {
  constructor(public templateRef: TemplateRef<any>) {}
}
