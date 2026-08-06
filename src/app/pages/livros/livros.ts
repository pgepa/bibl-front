import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LivroService } from '../../services/livro.service';
import { Livro } from '../../models/livro';

@Component({
  selector: 'app-livros',
  imports: [ReactiveFormsModule],
  templateUrl: './livros.html',
  styleUrl: './livros.css',
})
export class LivrosComponent implements OnInit {
  private readonly livroService = inject(LivroService);
  private readonly fb = inject(FormBuilder);

  readonly livros = signal<Livro[]>([]);
  readonly carregando = signal(true);
  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly sucesso = signal<string | null>(null);
  readonly editandoId = signal<number | null>(null);
  readonly busca = signal('');

  readonly form = this.fb.nonNullable.group({
    titulo: ['', Validators.required],
    autor: ['', Validators.required],
    isbn: ['', Validators.required],
    anoLancamento: [new Date().getFullYear(), [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.carregar();
  }

  livrosFiltrados(): Livro[] {
    const termo = this.busca().trim().toLowerCase();
    if (!termo) {
      return this.livros();
    }
    return this.livros().filter(
      (livro) =>
        livro.titulo.toLowerCase().includes(termo) ||
        livro.autor.toLowerCase().includes(termo) ||
        livro.isbn.toLowerCase().includes(termo),
    );
  }

  carregar(): void {
    this.carregando.set(true);
    this.livroService.listar().subscribe({
      next: (livros) => {
        this.livros.set(livros);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Falha ao carregar livros.');
        this.carregando.set(false);
      },
    });
  }

  editar(livro: Livro): void {
    this.editandoId.set(livro.id);
    this.form.setValue({
      titulo: livro.titulo,
      autor: livro.autor,
      isbn: livro.isbn,
      anoLancamento: livro.anoLancamento,
    });
    this.sucesso.set(null);
    this.erro.set(null);
  }

  cancelarEdicao(): void {
    this.editandoId.set(null);
    this.form.reset({
      titulo: '',
      autor: '',
      isbn: '',
      anoLancamento: new Date().getFullYear(),
    });
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
      ? this.livroService.atualizar(id, payload)
      : this.livroService.cadastrar(payload);

    request$.subscribe({
      next: () => {
        this.sucesso.set(id ? 'Livro atualizado.' : 'Livro cadastrado.');
        this.cancelarEdicao();
        this.salvando.set(false);
        this.carregar();
      },
      error: (err) => {
        this.erro.set(err?.error?.mensagem ?? 'Não foi possível salvar o livro.');
        this.salvando.set(false);
      },
    });
  }

  remover(livro: Livro): void {
    if (!confirm(`Remover o livro "${livro.titulo}"?`)) {
      return;
    }

    this.livroService.remover(livro.id).subscribe({
      next: () => {
        this.sucesso.set('Livro removido.');
        this.carregar();
      },
      error: (err) => {
        this.erro.set(err?.error?.mensagem ?? 'Não foi possível remover o livro.');
      },
    });
  }
}
