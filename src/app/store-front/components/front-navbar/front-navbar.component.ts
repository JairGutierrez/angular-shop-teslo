import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'front-navbar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './front-navbar.component.html',
})
export class FrontNavbarComponent {

  authService = inject(AuthService);

  // onLogout() {
  //   this.authService.logout();
  //   this.router.navigate(['/auth/login']);
  // }
}
