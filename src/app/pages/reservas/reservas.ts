import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ReservaService } from '../../services/reserva.service';
import { LivroService } from '../../services/livro.service';
import { UsuarioService } from '../../services/usuario.service';
import { Reserva, StatusReserva } from '../../models/reserva';
import { Livro } from '../../models/livro';
import { Usuario } from '../../models/usuario';
import { obterMensagemErro } from '../../utils/error.util';

type FiltroStatus = 'TODOS' | 'AGUARDANDO' | 'CONCLUIDA' | 'CANCELADO';

@Component({
  selector: 'app-reservas',
  imports: [ReactiveFormsModule, FormsModule, DatePipe],
  templateUrl: './reservas.html',
  styleUrl: './reservas.css',
})
export class ReservasComponent implements OnInit {
  private readonly reservaService = inject(ReservaService);
  private readonly livroService = inject(LivroService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly fb = inject(FormBuilder);

  readonly reservas = signal<Reserva[]>([]);
  readonly livros = signal<Livro[]>([]);
  readonly usuarios = signal<Usuario[]>([]);
  readonly carregando = signal(true);
  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly sucesso = signal<string | null>(null);
  readonly filtroStatus = signal<FiltroStatus>('TODOS');
  readonly busca = signal('');
  readonly drawerAberto = signal(false);
  
  readonly pagina = signal(1);
  readonly itensPorPagina = 8;
  
  readonly hoje = new Date().toISOString().split('T')[0];

  readonly buscaLivro = signal('');
  readonly listaLivrosAberta = signal(false);
  readonly livroSelecionado = signal<Livro | null>(null);

  readonly buscaUsuario = signal('');
  readonly listaUsuariosAberta = signal(false);
  readonly usuarioSelecionado = signal<Usuario | null>(null);

  readonly form = this.fb.nonNullable.group({
    data: [this.hoje, [Validators.required]],
  });

  readonly totalAguardando = computed(
    () => this.reservas().filter((e) => e.statusReserva === 'AGUARDANDO').length,
  );
  readonly totalConcluidas = computed(
    () => this.reservas().filter((e) => e.statusReserva === 'CONCLUIDA').length,
  );
  readonly totalCanceladas = computed(
    () => this.reservas().filter((e) => e.statusReserva === 'CANCELADO').length,
  );

  readonly reservasFiltradas = computed(() => {
    const filtro = this.filtroStatus();
    const termo = this.busca().trim().toLowerCase();

    return this.reservas().filter((item) => {
      const combinaFiltro = filtro === 'TODOS' || item.statusReserva === filtro;
      const combinaTermo =
        !termo ||
        item.livro?.titulo?.toLowerCase().includes(termo) ||
        item.livro?.registro?.toLowerCase().includes(termo) ||
        item.usuario?.nome?.toLowerCase().includes(termo) ||
        item.usuario?.matricula?.toLowerCase().includes(termo);
      return Boolean(combinaFiltro && combinaTermo);
    });
  });

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.reservasFiltradas().length / this.itensPorPagina)),
  );

  readonly reservasPagina = computed(() => {
    const inicio = (this.pagina() - 1) * this.itensPorPagina;
    return this.reservasFiltradas().slice(inicio, inicio + this.itensPorPagina);
  });

  readonly paginasVisiveis = computed(() => {
    const total = this.totalPaginas();
    const atual = this.pagina();
    const janela = 2;
    const inicio = Math.max(1, atual - janela);
    const fim = Math.min(total, atual + janela);
    const paginas: number[] = [];
    for (let i = inicio; i <= fim; i++) {
      paginas.push(i);
    }
    return paginas;
  });

  readonly livrosFiltrados = computed(() => {
    const termo = this.buscaLivro().toLowerCase();
    return this.livros().filter(
      (l) =>
        l.titulo?.toLowerCase().includes(termo) ||
        l.autor?.toLowerCase().includes(termo) ||
        l.registro?.toLowerCase().includes(termo)
    );
  });

  readonly usuariosFiltrados = computed(() => {
    const termo = this.buscaUsuario().toLowerCase();
    return this.usuarios().filter(
      (u) =>
        u.nome?.toLowerCase().includes(termo) ||
        u.cpf?.toLowerCase().includes(termo) ||
        u.matricula?.toLowerCase().includes(termo)
    );
  });

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.reservaService.listarTodas().subscribe({
      next: (reservas) => {
        this.reservas.set(reservas);
        this.carregarDependencias();
      },
      error: (err) => {
        this.erro.set(obterMensagemErro(err, 'Falha ao carregar reservas.'));
        this.carregando.set(false);
      },
    });
  }

  carregarDependencias(): void {
    this.livroService.listar().subscribe((livros) => this.livros.set(livros));
    this.usuarioService.listar().subscribe((usuarios) => this.usuarios.set(usuarios));
    this.carregando.set(false);
  }

  definirFiltro(filtro: FiltroStatus): void {
    this.filtroStatus.set(filtro);
    this.pagina.set(1);
  }

  onBuscaChange(valor: string): void {
    this.busca.set(valor);
    this.pagina.set(1);
  }

  irParaPagina(pagina: number): void {
    this.pagina.set(pagina);
  }

  abrirNovo(): void {
    this.form.reset({ data: this.hoje });
    this.livroSelecionado.set(null);
    this.usuarioSelecionado.set(null);
    this.buscaLivro.set('');
    this.buscaUsuario.set('');
    this.sucesso.set(null);
    this.erro.set(null);
    this.drawerAberto.set(true);
  }

  fecharDrawer(): void {
    this.drawerAberto.set(false);
  }

  onBuscaLivroChange(valor: string): void {
    this.buscaLivro.set(valor);
    if (!valor) this.livroSelecionado.set(null);
  }

  selecionarLivro(livro: Livro): void {
    this.livroSelecionado.set(livro);
    this.buscaLivro.set(livro.titulo);
    this.listaLivrosAberta.set(false);
  }

  fecharListaLivros(): void {
    setTimeout(() => this.listaLivrosAberta.set(false), 200);
  }

  onBuscaUsuarioChange(valor: string): void {
    this.buscaUsuario.set(valor);
    if (!valor) this.usuarioSelecionado.set(null);
  }

  selecionarUsuario(usuario: Usuario): void {
    this.usuarioSelecionado.set(usuario);
    this.buscaUsuario.set(usuario.nome);
    this.listaUsuariosAberta.set(false);
  }

  fecharListaUsuarios(): void {
    setTimeout(() => this.listaUsuariosAberta.set(false), 200);
  }

  realizar(): void {
    if (this.form.invalid || !this.livroSelecionado() || !this.usuarioSelecionado()) {
      return;
    }

    this.salvando.set(true);
    const request = {
      idUsuario: this.usuarioSelecionado()!.id,
      idLivro: this.livroSelecionado()!.id,
      data: this.form.getRawValue().data,
    };

    this.reservaService.fazerReserva(request).subscribe({
      next: () => {
        this.sucesso.set('Reserva realizada com sucesso.');
        this.salvando.set(false);
        this.fecharDrawer();
        this.carregar();
      },
      error: (err) => {
        this.erro.set(obterMensagemErro(err, 'Não foi possível realizar a reserva.'));
        this.salvando.set(false);
      },
    });
  }
}
