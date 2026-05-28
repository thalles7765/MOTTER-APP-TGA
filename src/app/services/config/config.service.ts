import { Injectable } from '@angular/core';
import { apiClient } from '../api/api-client';
import { environment } from 'src/environments/environment';
import { BehaviorSubject } from 'rxjs';

export interface SystemConfig {
  id?: number;
  tenantId?: number;
  precoDefault: number;
  descPreco1: string;
  descPreco2: string;
  descPreco3: string;
  descPreco4: string;
  descPreco5: string;
  habilitaPreco1: boolean;
  habilitaPreco2: boolean;
  habilitaPreco3: boolean;
  habilitaPreco4: boolean;
  habilitaPreco5: boolean;
  habilitaPrecofilial: boolean;
  habilitaSaldofilial: boolean;
}

export interface ProductPriceOption {
  codigo: number;
  campo: string;
  descricao: string;
  valor: number;
  default: boolean;
}

const defaultConfig: SystemConfig = {
  precoDefault: 1,
  descPreco1: 'Preco Venda',
  descPreco2: 'Preco Venda 2',
  descPreco3: 'Preco Venda 3',
  descPreco4: 'Preco Venda 4',
  descPreco5: 'Preco Venda 5',
  habilitaPreco1: true,
  habilitaPreco2: true,
  habilitaPreco3: true,
  habilitaPreco4: true,
  habilitaPreco5: true,
  habilitaPrecofilial: false,
  habilitaSaldofilial: false
};

const storageKey = 'system_config';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private configSubject = new BehaviorSubject<SystemConfig>(this.readStoredConfig());
  private loadedFromApi = false;
  public config$ = this.configSubject.asObservable();

  constructor() { }

  async getData(params_req = {}, force = false) {
    if (!force && this.loadedFromApi) {
      return { status: 200, data: { data: this.configSubject.value } };
    }

    return await apiClient
      .get(`${environment.url_api}/configs`, { params: params_req, withCredentials: true })
      .then((response) => {
        const config = this.normalizeConfig(response.data?.data || response.data);
        this.setConfig(config);
        this.loadedFromApi = true;
        return { ...response, data: { ...response.data, data: config } };
      });
  }

  async refresh(params_req = {}) {
    return this.getData(params_req, true);
  }

  async updateConfig(payload: Partial<SystemConfig>) {
    const config = this.normalizeConfig({ ...this.configSubject.value, ...payload });

    return await apiClient
      .put(`${environment.url_api}/configs`, this.writableConfig(config), { withCredentials: true })
      .then((response) => {
        const updated = this.normalizeConfig(response.data?.data || response.data || config);
        this.setConfig(updated);
        this.loadedFromApi = true;
        return { ...response, data: { ...response.data, data: updated } };
      });
  }

  async syncConfig() {
    return await apiClient
      .post(`${environment.url_api}/configs/sync`, {}, { withCredentials: true })
      .then(async (response) => {
        const syncedConfig = response.data?.data ? this.normalizeConfig(response.data.data) : null;

        if (syncedConfig) {
          this.setConfig(syncedConfig);
          this.loadedFromApi = true;
          return { ...response, data: { ...response.data, data: syncedConfig } };
        }

        return await this.refresh();
      });
  }

  currentConfig() {
    return this.configSubject.value;
  }

  priceNumber(config = this.configSubject.value) {
    const value = Number(config?.precoDefault || 1);
    return value >= 1 && value <= 5 ? value : 1;
  }

  priceField(config = this.configSubject.value) {
    return `PRECO${this.priceNumber(config)}`;
  }

  priceFromProduct(product: any, priceNumber?: number | string | null) {
    return this.priceInfoFromProduct(product, priceNumber).valor;
  }

  priceInfoFromProduct(product: any, priceNumber?: number | string | null): ProductPriceOption {
    const prices = this.productPriceOptions(product);
    const requestedNumber = Number(priceNumber || this.priceNumber());
    const requestedField = requestedNumber > 0 ? `PRECO${requestedNumber}` : '';

    const requestedPrice = requestedNumber > 0
      ? prices.find((price) => Number(price.codigo) === requestedNumber || price.campo.toUpperCase() === requestedField)
      : null;

    const defaultPrice = prices.find((price) => price.default);
    const firstValidPrice = prices.find((price) => Number.isFinite(price.valor));

    return requestedPrice || defaultPrice || firstValidPrice || {
      codigo: this.priceNumber(),
      campo: this.priceField(),
      descricao: this.priceDescription(this.priceNumber()),
      valor: 0,
      default: true,
    };
  }

  productPriceOptions(product: any): ProductPriceOption[] {
    const sourcePrices = product?.precos || product?.PRECOS || product?.prices || [];

    if (Array.isArray(sourcePrices) && sourcePrices.length > 0) {
      return sourcePrices
        .map((price: any, index: number) => this.normalizeProductPrice(price, index))
        .filter((price) => price.campo && Number.isFinite(price.valor));
    }

    return [1, 2, 3, 4, 5]
      .map((number) => {
        const value = product?.[`PRECO${number}`];

        if (value === undefined || value === null) {
          return null;
        }

        return {
          codigo: number,
          campo: `PRECO${number}`,
          descricao: this.priceDescription(number),
          valor: Number(value || 0),
          default: number === this.priceNumber(),
        } as ProductPriceOption;
      })
      .filter((price): price is ProductPriceOption => !!price);
  }

  priceDescription(priceNumber: number | string | null | undefined, config = this.configSubject.value) {
    const normalized = Number(priceNumber || 1);
    const key = `descPreco${normalized}` as keyof SystemConfig;
    return String(config?.[key] || `Preco ${normalized}`);
  }

  private setConfig(config: SystemConfig) {
    this.configSubject.next(config);
    localStorage.setItem(storageKey, JSON.stringify(config));
  }

  private readStoredConfig(): SystemConfig {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? this.normalizeConfig(JSON.parse(stored)) : defaultConfig;
    } catch {
      return defaultConfig;
    }
  }

  private normalizeConfig(source: any): SystemConfig {
    const data = source || {};
    const config = data.config || data.CONFIG || data;

    return {
      id: config.id ?? config.ID,
      tenantId: config.tenantId ?? config.TENANTID ?? config.tenant_id ?? config.TENANT_ID,
      precoDefault: this.numberValue(config.precoDefault ?? config.PRECODEFAULT, defaultConfig.precoDefault),
      descPreco1: String(config.descPreco1 ?? config.DESCPRECO1 ?? defaultConfig.descPreco1),
      descPreco2: String(config.descPreco2 ?? config.DESCPRECO2 ?? defaultConfig.descPreco2),
      descPreco3: String(config.descPreco3 ?? config.DESCPRECO3 ?? defaultConfig.descPreco3),
      descPreco4: String(config.descPreco4 ?? config.DESCPRECO4 ?? defaultConfig.descPreco4),
      descPreco5: String(config.descPreco5 ?? config.DESCPRECO5 ?? defaultConfig.descPreco5),
      habilitaPreco1: this.booleanValue(config.habilitaPreco1 ?? config.HABILITAPRECO1, defaultConfig.habilitaPreco1),
      habilitaPreco2: this.booleanValue(config.habilitaPreco2 ?? config.HABILITAPRECO2, defaultConfig.habilitaPreco2),
      habilitaPreco3: this.booleanValue(config.habilitaPreco3 ?? config.HABILITAPRECO3, defaultConfig.habilitaPreco3),
      habilitaPreco4: this.booleanValue(config.habilitaPreco4 ?? config.HABILITAPRECO4, defaultConfig.habilitaPreco4),
      habilitaPreco5: this.booleanValue(config.habilitaPreco5 ?? config.HABILITAPRECO5, defaultConfig.habilitaPreco5),
      habilitaPrecofilial: this.booleanValue(config.habilitaPrecofilial ?? config.HABILITAPRECOFILIAL, defaultConfig.habilitaPrecofilial),
      habilitaSaldofilial: this.booleanValue(config.habilitaSaldofilial ?? config.HABILITASALDOFILIAL, defaultConfig.habilitaSaldofilial),
    };
  }

  private writableConfig(config: SystemConfig) {
    return {
      precoDefault: config.precoDefault,
      descPreco1: config.descPreco1,
      descPreco2: config.descPreco2,
      descPreco3: config.descPreco3,
      descPreco4: config.descPreco4,
      descPreco5: config.descPreco5,
      habilitaPreco1: config.habilitaPreco1,
      habilitaPreco2: config.habilitaPreco2,
      habilitaPreco3: config.habilitaPreco3,
      habilitaPreco4: config.habilitaPreco4,
      habilitaPreco5: config.habilitaPreco5,
      habilitaPrecofilial: config.habilitaPrecofilial,
      habilitaSaldofilial: config.habilitaSaldofilial,
    };
  }

  private numberValue(value: any, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private booleanValue(value: any, fallback: boolean) {
    if (value === undefined || value === null || value === '') {
      return fallback;
    }

    return value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true' || String(value).toUpperCase() === 'S';
  }

  private normalizeProductPrice(price: any, index: number): ProductPriceOption {
    const field = String(price?.campo ?? price?.CAMPO ?? `PRECO${price?.codigo ?? price?.CODIGO ?? index + 1}`).toUpperCase();
    const code = Number(price?.codigo ?? price?.CODIGO ?? field.replace(/\D/g, '') ?? index + 1);
    const normalizedCode = Number.isFinite(code) && code > 0 ? code : index + 1;

    return {
      codigo: normalizedCode,
      campo: field,
      descricao: this.priceDescription(normalizedCode),
      valor: Number(price?.valor ?? price?.VALOR ?? price?.PRECO ?? 0),
      default: this.booleanValue(price?.default ?? price?.DEFAULT ?? price?.padrao ?? price?.PADRAO, false),
    };
  }

}
