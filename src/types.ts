/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CategoryType = 'Bases' | 'Salsas' | 'Vegetales' | 'Proteínas';

export interface ProductItem {
  id: string;
  name: string;
  category: CategoryType;
  description: string;
  price: number;
  unit: string;
  weightGrams: number;
  image: string;
  vacuumSealed: boolean;
  shelfLifeDays: number;
  suggestedStock: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  deliveryFrequency: string; // 'Semanal' | 'Quincenal'
  deliveriesPerMonth: number;
  categoriesIncluded: CategoryType[];
  popularItem?: string;
  features: string[];
}

export type OrderStatus = 'pendiente' | 'asignado' | 'preparando' | 'empaque_listo' | 'entregado';

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  weightGrams: number;
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientPhone: string;
  planId?: string; // Optional if subscription-based
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  scheduledDeliveryDate: string; // YYYY-MM-DD
  deliveryWindow: string; // e.g., "08:00 - 12:00" | "14:00 - 18:00"
  dateCreated: string;
  
  // Collaborative & Traceability attributes (Fase 2)
  operatorId?: string;
  operatorName?: string;
  batchCode?: string; // Lote (generated e.g. PK-2026-X)
  verifiedScaledWeight?: number;
  verifiedVacuumPressure?: number; // e.g. 99%
  verifiedSealTemperature?: number; // e.g. 155°C
  verifiedSealTime?: number; // e.g. 3.2s
  packagingConfirmedAt?: string;
  
  // Location
  latitude?: number;
  longitude?: number;
}

export interface Practiker {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  rating: number;
  locationName: string;
  latitude: number;
  longitude: number;
  completedOrdersCount: number;
  currentWorkload: number; // number of active preps
  rawIngredientsStock: {
    ingredientName: string;
    stockLevelPercent: number; // 0 to 100
  }[];
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
  durationMinutes: number;
  isCriticalQualityPoint: boolean; // PPC (Punto Crítico de Control)
}

export interface VacuumSpec {
  pressurePercent: number; // e.g. 98% for sauces, 99.5% for meat
  sealingTimeSeconds: number; // e.g. 3.5s
  temperatureCelsius: number; // e.g. 160°C
  packagingType: string; // e.g. "Bolsa Gofrada Coextruida 150 micras"
}

export interface Recipe {
  id: string;
  productId: string;
  productName: string;
  chefName: string; // e.g. "Chef Alvaro Ibañez Peluffo"
  standardBatchSize: string; // e.g., "10 porciones"
  prepTimeMinutes: number;
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
  }[];
  steps: RecipeStep[];
  vacuumSpecification: VacuumSpec;
  temperatureStorageCelsius: number; // e.g., 2°C - 4°C
}

export interface DashboardMetrics {
  totalRevenueMonthly: number;
  activeSubscriptionsCount: number;
  volumeOrdersWeekly: number;
  customerRetentionRate: number; // percentage
  averageCAC: number; // Cost of Acquisition in USD or local currency (COP)
  churnRate: number;
}

export interface DemandPrediction {
  targetWeek: string;
  predictedOrdersCount: number;
  rawMaterialsNeeded: {
    ingredientName: string;
    estimatedKgRequired: number;
    unit: string;
    currentInventoryKg: number;
    deficitKg: number;
  }[];
  estimatedPackagingBagsRequired: number;
  aiInsightsMarkdown: string;
  generatedAt: string;
}
