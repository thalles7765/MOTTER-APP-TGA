import { product } from "./product";

export interface order_item extends product {
    CODEMPRESA: number;
    IDMOV: number;
    NSEQ: number;
    CODPRD: string;
    QUANTIDADE: number;
    PRECOUNITARIO: number;
    PERCENTUALDESC: number;
    VALORDESC: number;
    DATAEMISSAO: Date; // Representando datas no formato string
    CODUND: string;
    VALORTOTALITEM: number;
    FATCONVUND: number;
    FLAGEFEITOSALDO: string;
    PRECOTABELA: number | null;
    CODCPG: string | null;
    VALORFINANCEIRO: number;
    VALORUNITARIO: number;
    PRECOBASE: number;
    PONTOEQUILIBRIO: number;
    PRECOTABELAALTERADO: string;
    CODPRODUTO: string;
    CUSTOUNITARIO: number;
    CODSIT: string;
    EXPEDICAO: string;
    RATEIODESC: number;
    CODDEPARTAMENTO: string;
    CODPRATELEIRA: string;
    DATAHORAINCLUSAO: Date; // Representando datas no formato string
    DATAHORAALTERACAO: Date; // Representando datas no formato string
    CUSTOMEDIO: number;    
    CUSTOVARIAVEIS: number;
    TINTOMETRIAIDFORMULA: number | null;
}

// INSERT INTO TMOVITENS(CODEMPRESA, 
// IDMOV, NSEQ, CODPRD, QUANTIDADE, 
// PRECOUNITARIO, PERCENTUALDESC, VALORDESC,
//     DATAEMISSAO, CODUND, VALORTOTALITEM, 
// FATCONVUND, FLAGEFEITOSALDO, PRECOTABELA, CODCPG,
//     VALORFINANCEIRO, VALORUNITARIO, PRECOBASE, 
// PONTOEQUILIBRIO, PRECOTABELAALTERADO, CODPRODUTO,
//     CUSTOUNITARIO, CODSIT, EXPEDICAO, RATEIODESC, 
// CODDEPARTAMENTO, CODPRATELEIRA, DATAHORAINCLUSAO,
//     DATAHORAALTERACAO, CUSTOMEDIO, VALORCONSUMOFLEX, 
// CUSTOVARIAVEIS, TINTOMETRIAIDFORMULA)

// VALUES(1, 2501438, 7, '012350', 1, 4.0536, 0, 0, '14-MAR-2025 00:00:00', 'PÇ', 4.05, 1, 'NNNNNNNNNN', 4.0536, NULL,
//     3.22, 3.22, 4.0536, 2.94, 'F', '012350', 1.8241, '2', 'N', 0.38, '000', '', '14-MAR-2025 15:57:46',
//     '14-MAR-2025 15:59:39', 1.4169, 0, 1.3946, 0);