import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Directive({
  selector: '[appHasRole]',
  standalone: true,
})
export class HasRoleDirective implements OnInit {
  private roles: string[] = [];
  private isVisible = false;

  @Input()
  set appHasRole(roles: string[]) {
    this.roles = roles;
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    if (this.authService.hasRole(...this.roles)) {
      if (!this.isVisible) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.isVisible = true;
      }
    } else {
      this.viewContainer.clear();
      this.isVisible = false;
    }
  }
}
