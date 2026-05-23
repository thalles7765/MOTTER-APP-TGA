export interface security_request {
  IDSOLICITA: number;
  CODFILIAL: number;
  CODSISTEMA: string;
  OPCAO: string;
  COMPUTADOR: string;
  USUARIO: string;
  STATUS: 'A' | 'L' | 'B' | string;
  DATA: string;
  TEXTO: string;
}

export type SecurityRequestUpdatePayload = {
  ID: number;
  CODFILIAL: number;
  STATUS: 'A' | 'L' | 'B';
  MENSAGEM: string;
};
