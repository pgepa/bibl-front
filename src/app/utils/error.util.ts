import { HttpErrorResponse } from '@angular/common/http';

export function obterMensagemErro(err: HttpErrorResponse | any, mensagemPadrao: string = 'Ocorreu um erro inesperado.'): string {
  if (!err) return mensagemPadrao;

  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'Parece que o servidor está offline no momento. Por favor, tente novamente mais tarde.';
    }
    if (err.status >= 500) {
      return 'Tivemos um problema interno no servidor. Nossa equipe técnica já foi notificada. Tente novamente em breve.';
    }
    if (err.status >= 400 && err.status < 500) {
      return err?.error?.mensagem ?? err?.error?.message ?? mensagemPadrao;
    }
  }

  return err?.error?.mensagem ?? err?.error?.message ?? mensagemPadrao;
}
