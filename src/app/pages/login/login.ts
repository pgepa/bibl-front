import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { obterMensagemErro } from '../../utils/error.util';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['admin@bibl.gov.br', [Validators.required, Validators.email]],
    senha: ['123456', [Validators.required]],
  });

  entrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.carregando.set(true);
    this.erro.set(null);

    const payload = this.form.getRawValue();
    this.authService.login(payload).subscribe({
      next: () => {
        this.carregando.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.erro.set(obterMensagemErro(err, 'E-mail ou senha inválidos.'));
        this.carregando.set(false);
      },
    });
  }
}
