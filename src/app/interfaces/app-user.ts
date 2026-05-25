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
  edit_client?: boolean;
  edit_product?: boolean;
  active: boolean;
  default_branch?: number;
  select_branch?: boolean;
  default_seller?: string | null;
  default_seller_name?: string | null;
  default_movement?: string | null;
  default_movement_name?: string | null;
}
