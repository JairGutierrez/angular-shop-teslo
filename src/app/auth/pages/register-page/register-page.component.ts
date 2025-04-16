import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';

@Component({
  selector: 'app-register-page',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './register-page.component.html',
})
export class RegisterPageComponent {

  fb = inject(FormBuilder);
  hashError = signal(false);
  router = inject(Router);

  authService = inject(AuthService);

  registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      fullName: ['', [Validators.required, Validators.minLength(6)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit() {
    if (this.registerForm.invalid) {
      this.hashError.set(true);
      setTimeout(() => {
        this.hashError.set(false);
      }, 2000);
      return;
    }

    const { email, fullName, password } = this.registerForm.value;

    if (!email || !fullName || !password) {
      this.hashError.set(true);
      setTimeout(() => {
        this.hashError.set(false);
      }, 2000);
      return;
    }

    this.authService.register(email, fullName, password).subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        this.router.navigateByUrl('/');
        return;
      }

      this.hashError.set(true);
      setTimeout(() => {
        this.hashError.set(false);
      }, 2000);
    });
  }

}
