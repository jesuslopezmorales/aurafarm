export interface LegalInfo {
  appName: string;
  siteUrl: string;
  ownerName: string;
  ownerTaxId: string | null;
  ownerAddress: string | null;
  contactEmail: string;
  reportsEmail: string;
  lastUpdated: string;
}

export const LEGAL: LegalInfo = {
  appName: "AuraFarm",
  siteUrl: "https://www.getaurafarmapp.com",
  ownerName: "Jesús López Morales",
  ownerTaxId: "53234969C",
  ownerAddress: "Calle Leandro Gras Limiñana 16, 03670 Monforte del Cid, Alicante, España",
  contactEmail: "hello@getaurafarmapp.com",
  reportsEmail: "reports@getaurafarmapp.com",
  lastUpdated: "23 de septiembre de 2026",
};