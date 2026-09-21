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
  ownerName: "Jesús López",
  ownerTaxId: null,
  ownerAddress: null,
  contactEmail: "hello@getaurafarmapp.com",
  reportsEmail: "reports@getaurafarmapp.com",
  lastUpdated: "21 de septiembre de 2026",
};