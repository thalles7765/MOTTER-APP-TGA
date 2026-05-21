type BrandTheme = Record<string, string>;

type BrandConfig = {
  appName: string;
  assets: {
    favicon: string;
  };
  theme: BrandTheme;
};

const ionicColorVariables = (name: string, value: string) => ({
  [`--ion-color-${name}`]: value,
  [`--ion-color-${name}-rgb`]: hexToRgb(value),
  [`--ion-color-${name}-contrast`]: getContrastColor(value),
  [`--ion-color-${name}-contrast-rgb`]: hexToRgb(getContrastColor(value)),
  [`--ion-color-${name}-shade`]: shadeHex(value, -12),
  [`--ion-color-${name}-tint`]: shadeHex(value, 10),
});

export function applyBrandTheme(brand: BrandConfig) {
  if (typeof document === "undefined") {
    return;
  }

  document.title = brand.appName;
  updateFavicon(brand.assets.favicon);

  const root = document.documentElement;
  const theme = {
    ...ionicColorVariables("primary", brand.theme["--ion-color-primary"]),
    ...ionicColorVariables("secondary", brand.theme["--ion-color-secondary"]),
    ...ionicColorVariables("tertiary", brand.theme["--ion-color-tertiary"]),
    ...brand.theme,
  };

  Object.entries(theme).forEach(([key, value]) => root.style.setProperty(key, value));
}

function updateFavicon(href: string) {
  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');

  if (favicon) {
    favicon.href = href;
  }
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value = parseInt(normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized, 16);

  return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
}

function getContrastColor(hex: string) {
  const [red, green, blue] = hexToRgb(hex).split(", ").map(Number);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

  return brightness > 160 ? "#000000" : "#ffffff";
}

function shadeHex(hex: string, percent: number) {
  const [red, green, blue] = hexToRgb(hex).split(", ").map(Number);
  const adjust = (channel: number) => {
    const target = percent < 0 ? 0 : 255;
    const amount = Math.abs(percent) / 100;

    return Math.round(channel + (target - channel) * amount);
  };

  return `#${[adjust(red), adjust(green), adjust(blue)]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}
