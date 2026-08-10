import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
import { Usuario } from '../../models/usuario';

@Component({
  selector: 'app-usuarios',
  imports: [ReactiveFormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class UsuariosComponent implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly fb = inject(FormBuilder);

  readonly usuarios = signal<Usuario[]>([]);
  readonly carregando = signal(true);
  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly sucesso = signal<string | null>(null);
  readonly editandoId = signal<number | null>(null);
  readonly busca = signal('');

  readonly form = this.fb.nonNullable.group({
    cpf: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
    nome: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telefone: ['', Validators.required],
  });

  ngOnInit(): void {
    this.carregar();
  }

  usuariosFiltrados(): Usuario[] {
    const termo = this.busca().trim().toLowerCase();
    if (!termo) {
      return this.usuarios();
    }
    return this.usuarios().filter(
      (usuario) =>
        usuario.nome.toLowerCase().includes(termo) ||
        usuario.cpf.toLowerCase().includes(termo) ||
        usuario.email.toLowerCase().includes(termo) ||
        usuario.telefone.toLowerCase().includes(termo),
    );
  }

  carregar(): void {
    this.carregando.set(true);
    this.usuarioService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Falha ao carregar usuários.');
        this.carregando.set(false);
      },
    });
  }

  editar(usuario: Usuario): void {
    this.editandoId.set(usuario.id);
    this.form.setValue({
      cpf: usuario.cpf,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
    });
    this.form.controls.cpf.disable();
    this.sucesso.set(null);
    this.erro.set(null);
  }

  cancelarEdicao(): void {
    this.editandoId.set(null);
    this.form.controls.cpf.enable();
    this.form.reset({ cpf: '', nome: '', email: '', telefone: '' });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();
    const id = this.editandoId();
    this.salvando.set(true);
    this.erro.set(null);
    this.sucesso.set(null);

    const request$ = id
      ? this.usuarioService.atualizar(id, payload)
      : this.usuarioService.cadastrar(payload);

    request$.subscribe({
      next: () => {
        this.sucesso.set(id ? 'Usuário atualizado.' : 'Usuário cadastrado.');
        this.cancelarEdicao();
        this.salvando.set(false);
        this.carregar();
      },
      error: (err) => {
        this.erro.set(err?.error?.mensagem ?? 'Não foi possível salvar o usuário.');
        this.salvando.set(false);
      },
    });
  }

  remover(usuario: Usuario): void {
    if (!confirm(`Remover o usuário "${usuario.nome}"?`)) {
      return;
    }

    this.usuarioService.remover(usuario.id).subscribe({
      next: () => {
        this.sucesso.set('Usuário removido.');
        this.carregar();
      },
      error: (err) => {
        this.erro.set(err?.error?.mensagem ?? 'Não foi possível remover o usuário.');
      },
    });
  }
}
