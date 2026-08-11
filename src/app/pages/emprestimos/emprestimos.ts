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
import {AbstractControl. ValidatorsErrors} from '@angular/forms';

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
  readonly filtroStatus = signal<'TODOS' | 'ATIVO' | 'CONCLUIDO'>('TODOS');

  readonly buscaLivro = signal('');
  readonly buscaUsuario = signal('');
  readonly listaLivrosAberta = signal(false);
  readonly listaUsuariosAberta = signal(false);

  private prazoPadrao(): string {
    const data = new Date();
    data.setDate(data.getDate() + 14);
    return data.toISOString().slice(0, 10);
  }

  private dataNaoPassadaValidator(control: AbstractControl) : ValidatorsErrors | null{
    if(!control.value){
      return null;
    }

    return control.vlaue < this.hoje ? {dtaPassada = true} : null;
  }

  readonly hoje = new Date.toISOString().slice(0,10);

  readonly form = this.fb.nonNullable.group({
    livroId: [0, [Validators.required, Validators.min(1)]],
    usuarioId: [0, [Validators.required, Validators.min(1)]],
    dataPrevistaDevolucao: [this.prazoPadrao(), [Validators.required, this.dataNaoPassadaValidator.bind(this)]],
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

  livrosFiltrados(): Livro[] {
    const termo = this.buscaLivro().trim().toLowerCase();
    const lista = this.livrosDisponiveis();
    if (!termo) {
      return lista;
    }
    return lista.filter(
      (livro) =>
        livro.titulo.toLowerCase().includes(termo) ||
        livro.autor.toLowerCase().includes(termo) ||
        livro.isbn.toLowerCase().includes(termo),
    );
  }

  usuariosFiltrados(): Usuario[] {
    const termo = this.buscaUsuario().trim().toLowerCase();
    const lista = this.usuarios();
    if (!termo) {
      return lista;
    }
    return lista.filter(
      (usuario) =>
        usuario.nome.toLowerCase().includes(termo) ||
        usuario.cpf.toLowerCase().includes(termo) ||
        usuario.email.toLowerCase().includes(termo),
    );
  }

  onBuscaLivroChange(valor: string): void {
    this.buscaLivro.set(valor);
    this.listaLivrosAberta.set(true);
    if (this.form.controls.livroId.value !== 0) {
      this.form.controls.livroId.setValue(0);
    }
  }

  onBuscaUsuarioChange(valor: string): void {
    this.buscaUsuario.set(valor);
    this.listaUsuariosAberta.set(true);
    if (this.form.controls.usuarioId.value !== 0) {
      this.form.controls.usuarioId.setValue(0);
    }
  }

  selecionarLivro(livro: Livro): void {
    this.form.controls.livroId.setValue(livro.id);
    this.buscaLivro.set(`${livro.titulo} — ${livro.autor}`);
    this.listaLivrosAberta.set(false);
  }

  selecionarUsuario(usuario: Usuario): void {
    this.form.controls.usuarioId.setValue(usuario.id);
    this.buscaUsuario.set(usuario.nome);
    this.listaUsuariosAberta.set(false);
  }

  fecharListaLivros(): void {
    setTimeout(() => this.listaLivrosAberta.set(false), 150);
  }

  fecharListaUsuarios(): void {
    setTimeout(() => this.listaUsuariosAberta.set(false), 150);
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
        this.form.reset({ livroId: 0, usuarioId: 0, dataPrevistaDevolucao: this.prazoPadrao() });
        this.buscaLivro.set('');
        this.buscaUsuario.set('');
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
