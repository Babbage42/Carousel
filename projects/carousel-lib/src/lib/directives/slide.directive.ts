import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[slide]',
})
export class SlideDirective {
  constructor(public templateRef: TemplateRef<any>) {}
}
