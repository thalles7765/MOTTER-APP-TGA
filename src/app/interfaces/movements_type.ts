export interface movements_type {
    CODTIPOMOV: string;
    NOME: string;
    TIPOOPERACAO: number | null;
    CODTIPODOCLAN: string; 
    CODNAT: string; 
    DESCMAXIMOMOV: number;
    BUSCACCUSTOCONDPGTO: string; 
    CODCPG: string; 
    CODCCUSTO: string; 
    INATIVO: string; 
    QUALPRECO?: number | string | null;
    EDICAOPRECO?: 'T' | 'F' | boolean | number | string | null;
    qualpreco?: number | string | null;
    edicaopreco?: 'T' | 'F' | boolean | number | string | null;
}
