export interface app_user {
  id?: number;
  ID?: number;
  user?: string;
  USER?: string;
  username?: string;
  USERNAME?: string;
  email?: string;
  EMAIL?: string;
  name?: string;
  NOME?: string;
  admin: boolean;
  clients: boolean;
  products: boolean;
  movements: boolean;
  active: boolean;
  default_branch?: number;
  select_branch?: boolean;
}
