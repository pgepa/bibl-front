import { Component, inject, OnInit, signal } from '@angular/core';
import { RelatorioService } from '../../services/relatorio.service';
import { RelatorioEmprestimoResponse } from '../../models/relatorio';
import { obterMensagemErro } from '../../utils/error.util';

@Component({
  selector: 'app-relatorios',
  templateUrl: './relatorios.html',
  styleUrl: './relatorios.css'
})
export class RelatoriosComponent implements OnInit {
  private readonly relatorioService = inject(RelatorioService);

  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly relatorio = signal<RelatorioEmprestimoResponse | null>(null);

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.relatorioService.gerarRelatorio().subscribe({
      next: (dados) => {
        this.relatorio.set(dados);
        this.carregando.set(false);
      },
      error: (err) => {
        this.erro.set(obterMensagemErro(err, 'Não foi possível carregar o relatório. Verifique a conexão com o backend.'));
        this.carregando.set(false);
      }
    });
  }
}
