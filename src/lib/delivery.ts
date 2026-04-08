export type DeliveryType = 'standard' | 'express';

export type DeliveryZone = {
  id: string;
  name: string;
  cities: string[];
  standardFee: number;
  expressFee: number;
  standardDays: string;
  expressDays: string;
};

export type DeliveryZoneDb = {
  province_code: string;
  province_name: string;
  cities: string[];
  standard_fee_cents: number;
  express_fee_cents: number;
  standard_days: string;
  express_days: string;
};

type DeliveryZoneSeed = {
  id: string;
  name: string;
  cities: string[];
  standardFeeCents: number;
  expressFeeCents: number;
  standardDays: string;
  expressDays: string;
};

const DEFAULT_DELIVERY_ZONE_SEED: DeliveryZoneSeed[] = [
  {
    id: 'GP',
    name: 'Gauteng',
    cities: ['Johannesburg', 'Pretoria', 'Midrand', 'Sandton', 'Centurion'],
    standardFeeCents: 0,
    expressFeeCents: 29900,
    standardDays: '3-5',
    expressDays: '1-2',
  },
  {
    id: 'WC',
    name: 'Western Cape',
    cities: ['Cape Town', 'Stellenbosch', 'Paarl', 'George', 'Knysna'],
    standardFeeCents: 29900,
    expressFeeCents: 59900,
    standardDays: '4-6',
    expressDays: '2-3',
  },
  {
    id: 'KZN',
    name: 'KwaZulu-Natal',
    cities: ['Durban', 'Pietermaritzburg', 'Richards Bay', 'Ballito', 'Umhlanga'],
    standardFeeCents: 29900,
    expressFeeCents: 59900,
    standardDays: '4-6',
    expressDays: '2-3',
  },
  {
    id: 'EC',
    name: 'Eastern Cape',
    cities: ['Port Elizabeth', 'East London', 'Mthatha', 'Grahamstown'],
    standardFeeCents: 39900,
    expressFeeCents: 79900,
    standardDays: '5-7',
    expressDays: '3-4',
  },
  {
    id: 'LP',
    name: 'Limpopo',
    cities: ['Polokwane', 'Tzaneen', 'Thohoyandou', 'Louis Trichardt'],
    standardFeeCents: 39900,
    expressFeeCents: 79900,
    standardDays: '5-7',
    expressDays: '3-4',
  },
  {
    id: 'MP',
    name: 'Mpumalanga',
    cities: ['Nelspruit', 'Witbank', 'Secunda', 'Barberton'],
    standardFeeCents: 34900,
    expressFeeCents: 69900,
    standardDays: '4-6',
    expressDays: '2-3',
  },
  {
    id: 'NW',
    name: 'North West',
    cities: ['Rustenburg', 'Mahikeng', 'Klerksdorp', 'Brits'],
    standardFeeCents: 34900,
    expressFeeCents: 69900,
    standardDays: '4-6',
    expressDays: '2-3',
  },
  {
    id: 'NC',
    name: 'Northern Cape',
    cities: ['Kimberley', 'Upington', 'Springbok', 'De Aar'],
    standardFeeCents: 49900,
    expressFeeCents: 99900,
    standardDays: '6-8',
    expressDays: '4-5',
  },
  {
    id: 'FS',
    name: 'Free State',
    cities: ['Bloemfontein', 'Welkom', 'Bethlehem', 'Sasolburg'],
    standardFeeCents: 34900,
    expressFeeCents: 69900,
    standardDays: '4-6',
    expressDays: '2-3',
  },
];

export const DEFAULT_FREE_SHIPPING_THRESHOLD_CENTS = 500000;
export const DEFAULT_FREE_SHIPPING_THRESHOLD = centsToRand(DEFAULT_FREE_SHIPPING_THRESHOLD_CENTS);

export const DEFAULT_DELIVERY_ZONES_DB: DeliveryZoneDb[] = DEFAULT_DELIVERY_ZONE_SEED.map((zone) => ({
  province_code: zone.id,
  province_name: zone.name,
  cities: zone.cities,
  standard_fee_cents: zone.standardFeeCents,
  express_fee_cents: zone.expressFeeCents,
  standard_days: zone.standardDays,
  express_days: zone.expressDays,
}));

export const DEFAULT_DELIVERY_ZONES: DeliveryZone[] = DEFAULT_DELIVERY_ZONE_SEED.map((zone) => ({
  id: zone.id,
  name: zone.name,
  cities: zone.cities,
  standardFee: centsToRand(zone.standardFeeCents),
  expressFee: centsToRand(zone.expressFeeCents),
  standardDays: zone.standardDays,
  expressDays: zone.expressDays,
}));

export function centsToRand(cents: number): number {
  return Math.max(0, Math.round(cents)) / 100;
}

export function randToCents(value: number): number {
  return Math.max(0, Math.round(value * 100));
}

export function normalizeDeliveryType(value: string): DeliveryType {
  return value.trim().toLowerCase() === 'express' ? 'express' : 'standard';
}

export function normalizeProvinceCode(value: string): string {
  return value.trim().toUpperCase();
}

export function mapDbZoneToDeliveryZone(zone: DeliveryZoneDb): DeliveryZone {
  return {
    id: zone.province_code,
    name: zone.province_name,
    cities: zone.cities,
    standardFee: centsToRand(zone.standard_fee_cents),
    expressFee: centsToRand(zone.express_fee_cents),
    standardDays: zone.standard_days,
    expressDays: zone.express_days,
  };
}

export function mapDbZonesToDeliveryZones(zones: DeliveryZoneDb[]): DeliveryZone[] {
  return zones.map(mapDbZoneToDeliveryZone);
}

export function calculateDeliveryFeeCents(params: {
  subtotalCents: number;
  freeShippingThresholdCents: number;
  zone: Pick<DeliveryZoneDb, 'standard_fee_cents' | 'express_fee_cents'>;
  deliveryType: DeliveryType;
}): number {
  if (
    params.deliveryType === 'standard' &&
    params.subtotalCents >= Math.max(0, params.freeShippingThresholdCents)
  ) {
    return 0;
  }

  return params.deliveryType === 'express'
    ? Math.max(0, params.zone.express_fee_cents)
    : Math.max(0, params.zone.standard_fee_cents);
}

export function estimateDefaultStandardDeliveryFee(zones: DeliveryZone[]): number {
  const nonZeroFees = zones.map((zone) => zone.standardFee).filter((fee) => fee > 0);
  if (nonZeroFees.length === 0) {
    return 0;
  }

  return Math.min(...nonZeroFees);
}
