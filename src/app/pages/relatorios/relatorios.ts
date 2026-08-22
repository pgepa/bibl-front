import { Component, inject, OnInit, signal } from '@angular/core';
import { RelatorioService } from '../../services/relatorio.service';
import { RelatorioEmprestimoResponse } from '../../models/relatorio';
import { obterMensagemErro } from '../../utils/error.util';
import { EmprestimoService } from '../../services/emprestimo.service';
import { Emprestimo } from '../../models/emprestimo';
import { forkJoin } from 'rxjs';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

type PdfMakeDocument = {
  getBlob: () => Promise<Blob>;
};

type PdfMakeApi = {
  addVirtualFileSystem: (vfs: Record<string, string>) => void;
  createPdf: (docDefinition: Record<string, unknown>) => PdfMakeDocument;
};

@Component({
  selector: 'app-relatorios',
  templateUrl: './relatorios.html',
  styleUrl: './relatorios.css'
})
export class RelatoriosComponent implements OnInit {
  private readonly relatorioService = inject(RelatorioService);
  private readonly emprestimoService = inject(EmprestimoService);
  private readonly pdfMake = pdfMake as unknown as PdfMakeApi;
  private fontesPdfConfiguradas = false;

  readonly carregando = signal(true);
  readonly gerandoPdf = signal(false);
  readonly erro = signal<string | null>(null);
  readonly relatorio = signal<RelatorioEmprestimoResponse | null>(null);
  readonly emprestimos = signal<Emprestimo[]>([]);

  ngOnInit(): void {
    this.configurarFontesPdf();
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    forkJoin({
      relatorio: this.relatorioService.gerarRelatorio(),
      emprestimos: this.emprestimoService.listar()
    }).subscribe({
      next: ({ relatorio, emprestimos }) => {
        this.relatorio.set(relatorio);
        this.emprestimos.set(emprestimos);
        this.carregando.set(false);
      },
      error: (err) => {
        this.erro.set(
          obterMensagemErro(
            err,
            'Não foi possível carregar o relatório. Verifique a conexão com o backend.'
          )
        );

        this.carregando.set(false);
      }
    });
  }

  async exportarPDF(): Promise<void> {
    const dados = this.relatorio();

    if (!dados) {
      this.erro.set(
        'Não existem dados disponíveis para gerar o relatório.'
      );
      return;
    }

    this.erro.set(null);
    this.gerandoPdf.set(true);

    /*
     * A nova guia precisa ser aberta imediatamente no clique.
     * Depois o blob do PDF é carregado nessa mesma guia.
     */
    const novaGuia = window.open('about:blank', '_blank');

    if (!novaGuia) {
      this.gerandoPdf.set(false);
      this.erro.set(
        'O navegador bloqueou a abertura da nova guia. Permita pop-ups para este site e tente novamente.'
      );
      return;
    }

    /*
     * Enquanto o PDF está sendo gerado,
     * mostramos uma mensagem na nova guia.
     */
    this.mostrarCarregamentoNaGuia(novaGuia);

    try {
      const pdf = this.pdfMake.createPdf(
        this.montarDocumentoPdf(dados)
      );
      const blob = await this.obterBlobPdf(pdf);
      const pdfUrl = URL.createObjectURL(blob);

      novaGuia.document.title = 'Relatório em PDF';
      novaGuia.location.href = pdfUrl;

      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 60000);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);

      novaGuia.close();

      this.erro.set(
        'Ocorreu um erro ao gerar o PDF. Verifique o console do navegador.'
      );
    } finally {
      this.gerandoPdf.set(false);
    }
  }

  private configurarFontesPdf(): void {
    if (this.fontesPdfConfiguradas) {
      return;
    }

    this.pdfMake.addVirtualFileSystem(pdfFonts as Record<string, string>);
    this.fontesPdfConfiguradas = true;
  }

  private mostrarCarregamentoNaGuia(novaGuia: Window): void {
    novaGuia.document.title = 'Gerando relatório...';
    novaGuia.document.body.innerHTML = `
      <div
        style="
          font-family: Arial, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          background: #f8fafc;
          color: #0f172a;
        "
      >
        <div style="text-align: center; max-width: 320px; padding: 24px;">
          <h2 style="margin: 0 0 8px;">Gerando relatório...</h2>
          <p style="margin: 0; line-height: 1.5;">Aguarde enquanto o PDF é preparado para visualização.</p>
        </div>
      </div>
    `;
  }

  private montarDocumentoPdf(dados: RelatorioEmprestimoResponse): Record<string, unknown> {
    const agora = new Date();
    const data = agora.toLocaleDateString('pt-BR');
    const hora = agora.toLocaleTimeString('pt-BR');
    const historicoEmprestimos = this.emprestimos();

    return {
      pageOrientation: 'landscape',
      content: [
        {
          text: 'RELATÓRIO DE CIRCULAÇÃO DO ACERVO',
          style: 'header'
        },
        {
          text: `Gerado em: ${data} às ${hora}`,
          style: 'subheader'
        },
        {
          text: '',
          margin: [0, 0, 0, 8]
        },
        {
          text: 'Resumo Estatístico',
          style: 'sectionHeader'
        },
        {
          table: {
            widths: ['*', 'auto'],
            body: [
              [
                { text: 'Métrica', style: 'tableHeader' },
                { text: 'Quantidade', style: 'tableHeader' }
              ],
              [
                'Total de Empréstimos',
                { text: dados.emprestimosTotais.toString(), alignment: 'right' }
              ],
              [
                'Empréstimos Ativos',
                { text: dados.emprestimosAtivos.toString(), alignment: 'right' }
              ],
              [
                'Empréstimos Concluídos / Devolvidos',
                { text: dados.emprestimosConcluidos.toString(), alignment: 'right' }
              ],
              [
                'Empréstimos Atrasados',
                {
                  text: dados.emprestimosAtrasados.toString(),
                  alignment: 'right',
                  color: '#b42318',
                  bold: true
                }
              ]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20]
        },
        {
          text: 'Histórico de Empréstimos',
          style: 'sectionHeader',
          margin: [0, 8, 0, 8]
        },
        historicoEmprestimos.length > 0
          ? {
              table: {
                headerRows: 1,
                widths: [32, '*', '*', 64, 64, 64, 56, 48],
                body: [
                  [
                    { text: 'ID', style: 'tableHeader' },
                    { text: 'Livro', style: 'tableHeader' },
                    { text: 'Usuário', style: 'tableHeader' },
                    { text: 'Empréstimo', style: 'tableHeader' },
                    { text: 'Prev. Devolução', style: 'tableHeader' },
                    { text: 'Devolução', style: 'tableHeader' },
                    { text: 'Status', style: 'tableHeader' },
                    { text: 'Renv.', style: 'tableHeader' }
                  ],
                  ...historicoEmprestimos.map((emprestimo) => [
                    emprestimo.id.toString(),
                    emprestimo.livro?.titulo ?? '-',
                    emprestimo.usuario?.nome ?? '-',
                    this.formatarDataPdf(emprestimo.dataEmprestimo),
                    this.formatarDataPdf(emprestimo.dataPrevistaDevolucao),
                    this.formatarDataPdf(emprestimo.dataDevolucao),
                    emprestimo.statusEmprestimo,
                    (emprestimo.quantidadeRenovacaoEmprestimo ?? 0).toString()
                  ])
                ]
              },
              layout: 'lightHorizontalLines',
              fontSize: 9
            }
          : {
              text: 'Nenhum empréstimo encontrado.',
              style: 'infoText'
            }
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          color: '#1a365d',
          alignment: 'center',
          margin: [0, 0, 0, 5]
        },
        subheader: {
          fontSize: 10,
          color: '#718096',
          alignment: 'center'
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          color: '#2d3748',
          margin: [0, 10, 0, 10]
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: '#2d3748',
          fillColor: '#edf2f7'
        },
        infoText: {
          fontSize: 9,
          color: '#718096',
          italics: true
        }
      },
      defaultStyle: {
        fontSize: 11
      },
      pageMargins: [40, 50, 40, 50]
    };
  }

  private formatarDataPdf(valor: string | null | undefined): string {
    if (!valor) {
      return '-';
    }

    const [ano, mes, dia] = valor.split('-');

    if (!ano || !mes || !dia) {
      return valor;
    }

    return `${dia}/${mes}/${ano}`;
  }

  private obterBlobPdf(pdf: PdfMakeDocument): Promise<Blob> {
    return pdf.getBlob();
  }
}
