import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { DatePipe } from '@angular/common';
import { EmprestimoService } from '../../services/emprestimo.service';
import { LivroService } from '../../services/livro.service';
import { UsuarioService } from '../../services/usuario.service';
import { Emprestimo } from '../../models/emprestimo';
import { Livro } from '../../models/livro';
import { Usuario } from '../../models/usuario';

@Component({
  selector: 'app-emprestimos',
  imports: [ReactiveFormsModule, FormsModule, DatePipe],
  templateUrl: './emprestimos.html',
  styleUrl: './emprestimos.css',
})
export class EmprestimosComponent implements OnInit {
  private readonly emprestimoService = inject(EmprestimoService);
  private readonly livroService = inject(LivroService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly fb = inject(FormBuilder);

  readonly emprestimos = signal<Emprestimo[]>([]);
  readonly livrosDisponiveis = signal<Livro[]>([]);
  readonly usuarios = signal<Usuario[]>([]);
  readonly carregando = signal(true);
  readonly salvando = signal(false);
  readonly devolvendoId = signal<number | null>(null);
  readonly erro = signal<string | null>(null);
  readonly sucesso = signal<string | null>(null);
  readonly filtroStatus = signal<'TODOS' | 'ATIVO' | 'DEVOLVIDO'>('TODOS');

  readonly form = this.fb.nonNullable.group({
    livroId: [0, [Validators.required, Validators.min(1)]],
    usuarioId: [0, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.carregar();
  }

  emprestimosFiltrados(): Emprestimo[] {
    const filtro = this.filtroStatus();
    if (filtro === 'TODOS') {
      return this.emprestimos();
    }
    return this.emprestimos().filter((item) => item.statusEmprestimo === filtro);
  }

  carregar(): void {
    this.carregando.set(true);
    forkJoin({
      emprestimos: this.emprestimoService.listar(),
      livros: this.livroService.listar(),
      usuarios: this.usuarioService.listar(),
    }).subscribe({
      next: ({ emprestimos, livros, usuarios }) => {
        this.emprestimos.set(emprestimos);
        this.livrosDisponiveis.set(livros.filter((livro) => livro.disponivel));
        this.usuarios.set(usuarios);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Falha ao carregar empréstimos.');
        this.carregando.set(false);
      },
    });
  }

  realizar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();
    this.salvando.set(true);
    this.erro.set(null);
    this.sucesso.set(null);

    this.emprestimoService.realizar(payload).subscribe({
      next: () => {
        this.sucesso.set('Empréstimo registrado.');
        this.form.reset({ livroId: 0, usuarioId: 0 });
        this.salvando.set(false);
        this.carregar();
      },
      error: (err) => {
        this.erro.set(err?.error?.mensagem ?? 'Não foi possível registrar o empréstimo.');
        this.salvando.set(false);
      },
    });
  }

  devolver(emprestimo: Emprestimo): void {
    if (!confirm(`Confirmar devolução de "${emprestimo.livro.titulo}"?`)) {
      return;
    }

    this.devolvendoId.set(emprestimo.id);
    this.erro.set(null);
    this.sucesso.set(null);

    this.emprestimoService.devolver(emprestimo.id).subscribe({
      next: () => {
        this.sucesso.set('Devolução registrada.');
        this.devolvendoId.set(null);
        this.carregar();
      },
      error: (err) => {
        this.erro.set(err?.error?.mensagem ?? 'Não foi possível registrar a devolução.');
        this.devolvendoId.set(null);
      },
    });
  }
}
