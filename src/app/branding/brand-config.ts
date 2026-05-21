import { environment } from 'src/environments/environment';

type BrandAssets = typeof environment.assets;
type BrandConfig = typeof environment;

const devAssetVersion = Date.now().toString();

export const brandConfig: BrandConfig = {
  ...environment,
  assets: environment.production ? environment.assets : versionBrandAssets(environment.assets),
};

function versionBrandAssets(assets: BrandAssets): BrandAssets {
  return {
    ...assets,
    logo: versionAssetUrl(assets.logo),
    menuLogo: versionAssetUrl(assets.menuLogo),
    favicon: versionAssetUrl(assets.favicon),
    banners: assets.banners.map(versionAssetUrl),
  };
}

function versionAssetUrl(url: string) {
  const separator = url.includes('?') ? '&' : '?';

  return `${url}${separator}v=${devAssetVersion}`;
}
