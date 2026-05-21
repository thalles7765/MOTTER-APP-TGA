import { client } from "./client";
import { movements_type } from "./movements_type";
import { order_item } from "./order_item";
import { payments_type } from "./payments_type";
import { sellers } from "./sellers";

export interface order {
    CODEMPRESA: number;
    CODFILIAL: number;
    IDMOV: number;
    NOME: string; // nome movimento
    DESC_CONDPGTO: string; // nome movimento
    NOMEFANTASIA: string;
    CODCFO: string;
    CODCPG: string;
    CODVEN1: string;
    CODTMV: string;
    CODLOC: string;
    NUMEROMOV: string;
    SERIE: string;
    TIPO: string; //0 = ENTRADA ; 1 = SAIDA
    STATUS: string;
    STATUSPEDIDO: string;
    DATAEMISSAO: Date;
    DATASAIDA: Date;
    DATAMOVIMENTO: Date;
    VALORBRUTO: number;
    VALORLIQUIDO: number;
    VALOROUTROS: number;
    VALORDESC: number;
    PERCENTUALDESC: number;
    VALORTOTALPRODUTO: number;
    VENDEDOR: sellers;
    TELEFONE_CLIENTE: string;
    CIDADE_CLIENTE:string;
    ESTADO_CLIENTE:string;
    OBSERVACAO:string;
    CLIENTE: client;
    PAGAMENTO: payments_type;
    MOVIMENTO: movements_type;
    ITEMS: order_item[];
    // VALORTOTALSERVICO: number;    
}



// INSERT INTO TMOV (
//     CODEMPRESA, IDMOV, CODFILIAL, CODLOC, CODCFO, NUMEROMOV, SERIE, CODTMV, TIPO, STATUS,
//     DATAEMISSAO, DATASAIDA, CODCPG, VALORBRUTO, VALORLIQUIDO, VALOROUTROS,
//     PERCENTUALDESC, VALORDESC, DATAMOVIMENTO,
//     STATUS2, VALORTOTALPRODUTO
// ) VALUES (
//     1, :IDMOV, 2, '001', 'C00001', :NUMEROMOV, 'OR', '2.1.01', '1', 'F',
//     current_date, current_date, 0, '00', 375.41, 340, 375.41,
//     9.4323, 35.41, 0, 0, NULL, current_date,
//     'D', 375.41
// )