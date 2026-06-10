/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config'; // Carga variables de .env (GEMINI_API_KEY, PORT, etc.)
import express from 'express';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { OAuth2Client } from 'google-auth-library';
import { 
  ProductItem, 
  SubscriptionPlan, 
  Order, 
  OrderStatus, 
  Practiker, 
  Recipe, 
  DashboardMetrics, 
  DemandPrediction,
  CategoryType,
  OrderItem
} from './src/types.js';

// --- INITIAL MEMORY DATABASE ---

// 1. Products of PRACTIKA (The 4 core vacuum categories)
const initialProducts: ProductItem[] = [
  {
    id: 'prod-ajo-01',
    name: 'Pasta de Ajo Natural Confitada',
    category: 'Bases',
    description: 'Pasta pura de ajo procesada en frío con aceite de girasol y sal marina. Lista para adobar bases sin picar.',
    price: 18500,
    unit: 'Tarro al Vacío',
    weightGrams: 250,
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=200',
    vacuumSealed: true,
    shelfLifeDays: 45,
    suggestedStock: 50
  },
  {
    id: 'prod-criolla-01',
    name: 'Saborizador Criollo Concentrado',
    category: 'Bases',
    description: 'Base tradicional colombiana de cebolla larga, ajo, pimentón asado, cilantro fresco y comino triturado al vacío.',
    price: 16000,
    unit: 'Tarro al Vacío',
    weightGrams: 250,
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80&w=200',
    vacuumSealed: true,
    shelfLifeDays: 30,
    suggestedStock: 40
  },
  {
    id: 'prod-chimi-01',
    name: 'Chimichurri Premium Parrillero',
    category: 'Salsas',
    description: 'Preparación emulsionada al vacío con perejil crespo, orégano patagónico, vinagre tinto, limón, ajo y cayena.',
    price: 24500,
    unit: 'Frasco al Vacío',
    weightGrams: 200,
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=200',
    vacuumSealed: true,
    shelfLifeDays: 60,
    suggestedStock: 35
  },
  {
    id: 'prod-teri-01',
    name: 'Teriyaki Artesanal Glaseado',
    category: 'Salsas',
    description: 'Salsa espesa y brillante con base en soya fermentada, jengibre fresco machacado, mirin y panela orgánica.',
    price: 22000,
    unit: 'Frasco al Vacío',
    weightGrams: 200,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=200',
    vacuumSealed: true,
    shelfLifeDays: 60,
    suggestedStock: 30
  },
  {
    id: 'prod-mixveg-01',
    name: 'Mix Confit Vegetales Semanales',
    category: 'Vegetales',
    description: 'Cubos de zanahoria baby, calabacín amarillo, brócoli, pimentones dulces, sazonados al vacío con tomillo y aceite de aguacate.',
    price: 32000,
    unit: 'Bolsa al Vacío',
    weightGrams: 500,
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=200',
    vacuumSealed: true,
    shelfLifeDays: 10,
    suggestedStock: 65
  },
  {
    id: 'prod-pure-01',
    name: 'Puré Rústico de Papa Amarilla',
    category: 'Vegetales',
    description: 'Papa criolla seleccionada, prensada al vacío con mantequilla clarificada (Gee), pizca de nuez moscada y flor de sal.',
    price: 26000,
    unit: 'Bolsa al Vacío',
    weightGrams: 500,
    image: 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&q=80&w=200',
    vacuumSealed: true,
    shelfLifeDays: 14,
    suggestedStock: 45
  },
  {
    id: 'prod-resmechada-01',
    name: 'Res Culinaria Desmechada Cocida',
    category: 'Proteínas',
    description: 'Carne de pecho de res desmechada cocida a baja temperatura por 24 horas al vacío en su propio jugo con aliños criollos.',
    price: 49000,
    unit: 'Bolsa al Vacío',
    weightGrams: 500,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=200',
    vacuumSealed: true,
    shelfLifeDays: 21,
    suggestedStock: 80
  },
  {
    id: 'prod-pechuga-01',
    name: 'Pechuga Marinada al Romero',
    category: 'Proteínas',
    description: 'Suprema de pollo fresca, marinada al vacío con romero de la huerta, aceite de oliva virgen, ralladura de limón y pimienta blanca.',
    price: 34000,
    unit: 'Bolsa al Vacío a Porción',
    weightGrams: 400,
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=200',
    vacuumSealed: true,
    shelfLifeDays: 14,
    suggestedStock: 75
  },
  {
    id: 'prod-cerdo-01',
    name: 'Cerdo Criollo Confitado Terminado',
    category: 'Proteínas',
    description: 'Panceta de cerdo de origen regional, confitada suavemente, marinada con panela, naranja y ajo, lista para dorar en sartén.',
    price: 42000,
    unit: 'Bolsa al Vacío',
    weightGrams: 500,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=200',
    vacuumSealed: true,
    shelfLifeDays: 21,
    suggestedStock: 60
  }
];

// 2. Subscriptions
const initialSubscriptions: SubscriptionPlan[] = [
  {
    id: 'sub-esencial',
    name: 'Plan Alistamiento Esencial',
    description: 'La solución óptima para personas que cocinan solas o parejas. Enfocado en aderezos rápidos y mixes de vegetales listos.',
    priceMonthly: 149000,
    deliveryFrequency: 'Semanal',
    deliveriesPerMonth: 4,
    categoriesIncluded: ['Bases', 'Salsas', 'Vegetales'],
    popularItem: 'Mix Confit Vegetales + Pasta de Ajo',
    features: [
      '4 entregas mensuales sin costo de envío',
      '2 bases y 1 salsa por entrega',
      '400g de vegetales listos para la semana',
      'Acceso exclusivo a cursos del Chef Álvaro',
      'Soportes ecológicos de bolsas retornables'
    ]
  },
  {
    id: 'sub-familiar',
    name: 'Plan Familiar Conveniencia',
    description: 'El plan estrella de PRACTIKA. Resuelve almuerzos y cenas de familias de 3-5 integrantes. Incluye proteínas marinadas y listas.',
    priceMonthly: 299000,
    deliveryFrequency: 'Quincenal',
    deliveriesPerMonth: 2,
    categoriesIncluded: ['Bases', 'Salsas', 'Vegetales', 'Proteínas'],
    popularItem: 'Res Desmechada + Saborizador Criollo',
    features: [
      '2 entregas mensuales de alto volumen',
      'Aliños, salsas y vegetales para 15 días',
      '3 bloques de proteínas premium de 500g empacadas al vacío',
      'Guía impresa de regeneración rápida',
      'Suscripción flex: pausa o cancela con 1 clic'
    ]
  },
  {
    id: 'sub-alto-proteico',
    name: 'Plan Carnes & Proteínas Premium',
    description: 'Enfocado 100% en rendimiento físico y conveniencia. Proteínas cocidas a baja temperatura y salsas artesanales bajas en sodio.',
    priceMonthly: 399000,
    deliveryFrequency: 'Semanal',
    deliveriesPerMonth: 4,
    categoriesIncluded: ['Salsas', 'Proteínas'],
    popularItem: 'Pechuga al Romero + Cerdo Confitado',
    features: [
      '4 entregas mensuales (Kits de Proteínas)',
      '1.2Kg de proteínas al vacío por semana (porcionadas)',
      'Salsas funcionales preparadas sin preservantes',
      'Control estricto de macronutrientes impresos',
      'Empaque de alta barrera termoencogible'
    ]
  }
];

// 3. Certified Culinary Operators ("Practikers")
const initialPractikers: Practiker[] = [
  {
    id: 'op-01',
    name: 'Carlos Mario Restrepo',
    email: 'carlos.practiker@practika.co',
    status: 'active',
    rating: 4.9,
    locationName: 'Micro-centro ParqueSoft Meta',
    latitude: 4.142,
    longitude: -73.626,
    completedOrdersCount: 142,
    currentWorkload: 1,
    rawIngredientsStock: [
      { ingredientName: 'Ajo Fresco Sabanero (Kg)', stockLevelPercent: 85 },
      { ingredientName: 'Romero Fresco (g)', stockLevelPercent: 90 },
      { ingredientName: 'Pecho de Res Premium (Kg)', stockLevelPercent: 40 },
      { ingredientName: 'Zanahoria Organica (Kg)', stockLevelPercent: 75 },
      { ingredientName: 'Aceite de Girasol Natural (L)', stockLevelPercent: 95 }
    ]
  },
  {
    id: 'op-02',
    name: 'Sandra Camargo Valenzuela',
    email: 'sandra.camargo@practika.co',
    status: 'active',
    rating: 4.85,
    locationName: 'Co-cocina Local Barzal',
    latitude: 4.150,
    longitude: -73.635,
    completedOrdersCount: 98,
    currentWorkload: 0,
    rawIngredientsStock: [
      { ingredientName: 'Ajo Fresco Sabanero (Kg)', stockLevelPercent: 50 },
      { ingredientName: 'Romero Fresco (g)', stockLevelPercent: 30 },
      { ingredientName: 'Pecho de Res Premium (Kg)', stockLevelPercent: 80 },
      { ingredientName: 'Zanahoria Organica (Kg)', stockLevelPercent: 65 },
      { ingredientName: 'Aceite de Girasol Natural (L)', stockLevelPercent: 45 }
    ]
  }
];

// 4. Chef Alvaro's Standardized Recipes
const initialRecipes: Recipe[] = [
  {
    id: 'rec-res-01',
    productId: 'prod-resmechada-01',
    productName: 'Res Culinaria Desmechada Cocida al Vacío',
    chefName: 'Chef Alvaro Ibañez Peluffo',
    standardBatchSize: '10 bloques (500g c/u)',
    prepTimeMinutes: 1470, // 24.5 horas total
    ingredients: [
      { name: 'Pecho de Res Seleccionado (Falda)', quantity: 6.0, unit: 'Kg' },
      { name: 'Cebolla Larga Finamente Picada', quantity: 1.2, unit: 'Kg' },
      { name: 'Ajo Entero Triturado', quantity: 400, unit: 'g' },
      { name: 'Sal Marina Gruesa', quantity: 120, unit: 'g' },
      { name: 'Comino Molido Puro', quantity: 30, unit: 'g' },
      { name: 'Aceite de Girasol', quantity: 200, unit: 'ml' }
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Limpiar el pecho de res removiendo excesos de grasa superficial rugosa. Cortar longitudinalmente en bloques simétricos de 600g (la merma promedio es del 16% tras cocción).',
        durationMinutes: 30,
        isCriticalQualityPoint: false
      },
      {
        stepNumber: 2,
        instruction: 'Adobar en seco frotando los bloques de carne uniformemente con la sal marina, comino y ajo triturado. Dejar marinar tapado a 4°C por 2 horas.',
        durationMinutes: 120,
        isCriticalQualityPoint: true // Controlar temperatura de marinado
      },
      {
        stepNumber: 3,
        instruction: 'Sellar los bloques en sartén de hierro fundido a fuego alto (200°C) con aceite de girasol por 3 minutos cada cara hasta lograr una costra de Maillard homogénea.',
        durationMinutes: 15,
        isCriticalQualityPoint: false
      },
      {
        stepNumber: 4,
        instruction: 'Introducir los bloques dorados individualmente en bolsas de alta barrera para cocción al vacío. Añadir 40g de cebolla larga picada cruda dentro de cada empaque.',
        durationMinutes: 15,
        isCriticalQualityPoint: false
      },
      {
        stepNumber: 5,
        instruction: 'PROCESO CRÍTICO: Sellar en la máquina empacadora al vacío configurada a 99.5% de presión negativa. Verificar sellado doble sin burbujas.',
        durationMinutes: 10,
        isCriticalQualityPoint: true // PCC Sellado hermético
      },
      {
        stepNumber: 6,
        instruction: 'Sumergir en el termo-circulador Sous-Vide cargado a 74°C (165°F) constantes durante 20 horas consecutivas para colagenizar los tejidos.',
        durationMinutes: 1200,
        isCriticalQualityPoint: true // PCC Monitoreo constante de temperatura
      },
      {
        stepNumber: 7,
        instruction: 'Enfriar rápidamente en baño de agua con hielo (choque térmico) hasta bajar de 65°C a menos de 4°C en menos de un intervalo de 90 minutos para evitar multiplicación bacteriana. Clasificar lote con código y almacenar.',
        durationMinutes: 80,
        isCriticalQualityPoint: true // PCC Cadena de Frío
      }
    ],
    vacuumSpecification: {
      pressurePercent: 99.5,
      sealingTimeSeconds: 3.8,
      temperatureCelsius: 165,
      packagingType: 'Bolsa Coextruida de Alta Barrera OPA/PE 120 micras de cocción'
    },
    temperatureStorageCelsius: 3
  },
  {
    id: 'rec-chimi-01',
    productId: 'prod-chimi-01',
    productName: 'Chimichurri Premium Parrillero',
    chefName: 'Chef Alvaro Ibañez Peluffo',
    standardBatchSize: '15 frascos (200g c/u)',
    prepTimeMinutes: 45,
    ingredients: [
      { name: 'Perejil Crespo Fresco Deshojado', quantity: 1.5, unit: 'Kg' },
      { name: 'Ajo Pelado Picado Ultrafino', quantity: 250, unit: 'g' },
      { name: 'Vinagre de Vino Tinto', quantity: 600, unit: 'ml' },
      { name: 'Aceite de Oliva Extra Virgen', quantity: 1.8, unit: 'L' },
      { name: 'Orégano Seco Patagónico entero', quantity: 50, unit: 'g' },
      { name: 'Sal de Cúmulo y Chile seco molido', quantity: 45, unit: 'g' }
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Desinfectar perfectamente el perejil. Secar al 100% con centrífuga para eliminar agua libre de la superficie.',
        durationMinutes: 15,
        isCriticalQualityPoint: true
      },
      {
        stepNumber: 2,
        instruction: 'Picar el perejil a cuchillo en corte Brunoise muy fino. Está PROHIBIDO usar procesador de alimentos, ya que oxida las hojas y licúa la clorofila.',
        durationMinutes: 15,
        isCriticalQualityPoint: false
      },
      {
        stepNumber: 3,
        instruction: 'Mezclar el orégano seco con el vinagre tinto tibio por 5 minutos para hidratar las hojas secas antes del ensamble graso.',
        durationMinutes: 5,
        isCriticalQualityPoint: false
      },
      {
        stepNumber: 4,
        instruction: 'Incorporar el aceite de oliva vírgen en hilo constante mientras se remueven los demás ingredientes secos a mano. Empacar en frascos herméticos y succionar a 92% de vacío.',
        durationMinutes: 10,
        isCriticalQualityPoint: true
      }
    ],
    vacuumSpecification: {
      pressurePercent: 92.0,
      sealingTimeSeconds: 2.8,
      temperatureCelsius: 145,
      packagingType: 'Frasco de Vidrio Premium con Linder Plástico apto para Vacío parcial'
    },
    temperatureStorageCelsius: 5
  },
  {
    id: 'rec-ajo-01',
    productId: 'prod-ajo-01',
    productName: 'Pasta de Ajo Natural Confitada',
    chefName: 'Chef Alvaro Ibañez Peluffo',
    standardBatchSize: '20 tarros (250g c/u)',
    prepTimeMinutes: 60,
    ingredients: [
      { name: 'Dientes de Ajo Fresco Sabanero Pelado', quantity: 4.0, unit: 'Kg' },
      { name: 'Aceite de Girasol Sano', quantity: 1.2, unit: 'L' },
      { name: 'Sal Marina Refinada', quantity: 60, unit: 'g' },
      { name: 'Ácido Cítrico Alimentario (Estabilizante)', quantity: 4.0, unit: 'g' }
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Seleccionar dientes de ajo libres de brotes verdes o mohos. Calentar el aceite de girasol con los ajos a baja temperatura (85°C) durante 30 minutos para confitar sin dorar.',
        durationMinutes: 35,
        isCriticalQualityPoint: true
      },
      {
        stepNumber: 2,
        instruction: 'Escurrir y procesar en emulsión fría adicionando la sal marina y el ácido cítrico (PH de control menor a 4.5 para evitar Clostridium botulinum de origen suelo).',
        durationMinutes: 15,
        isCriticalQualityPoint: true
      },
      {
        stepNumber: 3,
        instruction: 'Dosificar húmedo en los tarros térmicos, limpiar bordes con alcohol alimentario al 70%, sellar inmediatamente bajo vacío de gas al 95%.',
        durationMinutes: 10,
        isCriticalQualityPoint: true
      }
    ],
    vacuumSpecification: {
      pressurePercent: 95.0,
      sealingTimeSeconds: 3.0,
      temperatureCelsius: 150,
      packagingType: 'Tarro plástico de polipropileno termoestable barrera al vacío'
    },
    temperatureStorageCelsius: 4
  }
];

// 5. Initial Active Orders - showcasing cross-role synchronization
let mockOrders: Order[] = [
  {
    id: 'ord-101',
    clientId: 'user-001',
    clientName: 'Alejandro Galindo',
    clientEmail: 'lealandres007@gmail.com',
    clientAddress: 'Calle 15 # 40-52, Barrio Barzal, Villavicencio',
    clientPhone: '3158941254',
    planId: 'sub-familiar',
    totalAmount: 299000,
    status: 'pendiente',
    scheduledDeliveryDate: '2026-06-11',
    deliveryWindow: '08:00 - 12:00',
    dateCreated: '2026-06-04T10:00:00Z',
    items: [
      { productId: 'prod-resmechada-01', name: 'Res Culinaria Desmechada Cocida', quantity: 2, weightGrams: 500 },
      { productId: 'prod-chimi-01', name: 'Chimichurri Premium Parrillero', quantity: 1, weightGrams: 200 },
      { productId: 'prod-mixveg-01', name: 'Mix Confit Vegetales Semanales', quantity: 2, weightGrams: 500 },
      { productId: 'prod-criolla-01', name: 'Saborizador Criollo Concentrado', quantity: 1, weightGrams: 250 }
    ],
    latitude: 4.145,
    longitude: -73.630
  },
  {
    id: 'ord-102',
    clientId: 'user-002',
    clientName: 'Liliana Patricia Peluffo',
    clientEmail: 'lily.patricia@gmail.com',
    clientAddress: 'Avenida Catama # 24-11, Villavicencio',
    clientPhone: '3204910245',
    planId: 'sub-esencial',
    totalAmount: 149000,
    status: 'preparando',
    scheduledDeliveryDate: '2026-06-08',
    deliveryWindow: '14:00 - 18:00',
    dateCreated: '2026-06-04T08:15:00Z',
    items: [
      { productId: 'prod-ajo-01', name: 'Pasta de Ajo Natural Confitada', quantity: 1, weightGrams: 250 },
      { productId: 'prod-chimi-01', name: 'Chimichurri Premium Parrillero', quantity: 1, weightGrams: 200 },
      { productId: 'prod-mixveg-01', name: 'Mix Confit Vegetales Semanales', quantity: 1, weightGrams: 500 }
    ],
    operatorId: 'op-01',
    operatorName: 'Carlos Mario Restrepo',
    latitude: 4.148,
    longitude: -73.621
  },
  {
    id: 'ord-103',
    clientId: 'user-003',
    clientName: 'Chef Alvaro Ibañez',
    clientEmail: 'alvaro.chef@practika.co',
    clientAddress: 'Km 3 Vía Acacías, El Jardín, Villavicencio',
    clientPhone: '3114529631',
    planId: 'sub-alto-proteico',
    totalAmount: 399000,
    status: 'empaque_listo',
    scheduledDeliveryDate: '2026-06-05',
    deliveryWindow: '08:00 - 12:00',
    dateCreated: '2026-06-03T14:20:00Z',
    items: [
      { productId: 'prod-resmechada-01', name: 'Res Culinaria Desmechada Cocida', quantity: 2, weightGrams: 500 },
      { productId: 'prod-pechuga-01', name: 'Pechuga Marinada al Romero', quantity: 2, weightGrams: 400 },
      { productId: 'prod-chimi-01', name: 'Chimichurri Premium Parrillero', quantity: 2, weightGrams: 200 }
    ],
    operatorId: 'op-01',
    operatorName: 'Carlos Mario Restrepo',
    batchCode: 'LOTE-PK-060326',
    verifiedScaledWeight: 2015,
    verifiedVacuumPressure: 99.5,
    verifiedSealTemperature: 165,
    verifiedSealTime: 3.8,
    packagingConfirmedAt: '2026-06-03T17:42:00Z',
    latitude: 4.120,
    longitude: -73.640
  }
];

// --- API STARTER ---

const PORT = Number(process.env.PORT) || 3000;

// --- SEGURIDAD: HASH DE CONTRASEÑAS (scrypt, sin dependencias externas) ---

/** Genera un hash seguro de una contraseña: formato "scrypt$<salt>$<hash>". */
function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plain, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

/** Indica si un valor ya está hasheado (para no re-hashear ni guardar texto plano). */
function isHashed(value: string | undefined | null): boolean {
  return typeof value === 'string' && value.startsWith('scrypt$');
}

/**
 * Verifica una contraseña contra el valor almacenado.
 * Soporta hashes scrypt y, por compatibilidad con cuentas semilla antiguas,
 * comparación directa en texto plano (legacy).
 */
function verifyPassword(plain: string, stored: string | undefined | null): boolean {
  if (!stored) return false;
  if (isHashed(stored)) {
    const [, salt, hash] = stored.split('$');
    if (!salt || !hash) return false;
    const derived = crypto.scryptSync(plain, salt, 64).toString('hex');
    const a = Buffer.from(derived, 'hex');
    const b = Buffer.from(hash, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
  // Legacy: contraseña guardada en texto plano (cuentas semilla).
  return plain === stored;
}

async function startServer() {
  const app = express();

  // Compresión gzip de todas las respuestas (HTML, JS, CSS, JSON)
  app.use(compression());

  // Middleware for JSON logging & parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Dynamic system headers or cache headers can be defined
  app.use((req, res, next) => {
    res.setHeader('X-Powered-By', 'PRACTIKA FoodTech');
    next();
  });

  // File path for persistent user store
  const usersFilePath = path.join(process.cwd(), 'users_db.json');

  // --- PERSISTENCIA DE PEDIDOS (para que no se borren al reiniciar) ---
  const ordersFilePath = path.join(process.cwd(), 'orders_db.json');

  function saveOrders() {
    try {
      fs.writeFileSync(ordersFilePath, JSON.stringify(mockOrders, null, 2), 'utf8');
    } catch (err) {
      console.error('Error writing orders_db.json', err);
    }
  }

  // Cargar pedidos previos si existen; si no, persistir los iniciales.
  try {
    if (fs.existsSync(ordersFilePath)) {
      const data = fs.readFileSync(ordersFilePath, 'utf8').trim();
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) mockOrders = parsed;
      }
    } else {
      saveOrders();
    }
  } catch (err) {
    console.error('Error reading orders_db.json, usando pedidos iniciales', err);
  }

  // Helper to load users from JSON file safely without crashing on null/undefined
  function loadStoredUsers() {
    try {
      if (fs.existsSync(usersFilePath)) {
        const data = fs.readFileSync(usersFilePath, 'utf8').trim();
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      }
    } catch (err) {
      console.error("Error reading users_db.json, recreating defaults", err);
    }
    
    // Default fallback users seed if missing or corrupt
    const defaultUsers = [
      {
        "username": "lealandres007",
        "role": "cliente",
        "name": "Andres Leal",
        "email": "lealandres007@gmail.com",
        "phone": "3238217994",
        "password": "Andres007@"
      },
      {
        "username": "operador",
        "role": "practiker",
        "name": "Operario Standard",
        "password": "chef123"
      },
      {
        "username": "admin",
        "role": "admin",
        "name": "Director SGC",
        "password": "admin123"
      }
    ];
    saveStoredUsers(defaultUsers);
    return defaultUsers;
  }

  // Helper to save users to JSON file (cifra contraseñas en texto plano antes de guardar)
  function saveStoredUsers(usersList: any) {
    try {
      const secured = Array.isArray(usersList)
        ? usersList.map((u: any) => {
            if (u && typeof u.password === 'string' && u.password && !isHashed(u.password)) {
              return { ...u, password: hashPassword(u.password) };
            }
            return u;
          })
        : usersList;
      fs.writeFileSync(usersFilePath, JSON.stringify(secured, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error("Error writing to users_db.json", err);
      return false;
    }
  }

  // Endpoint to check initialization and get users
  app.get('/api/users-config', (req, res) => {
    const list = loadStoredUsers();
    // System is initialized if we have at least one user
    const hasUsers = list.length > 0;
    res.json({
      isInitialized: hasUsers,
      users: list
    });
  });

  // Get all users
  app.get('/api/users', (req, res) => {
    res.json(loadStoredUsers());
  });

  // Save/Update users list
  app.post('/api/users', (req, res) => {
    const { users } = req.body;
    if (!Array.isArray(users)) {
      return res.status(400).json({ error: 'Formato inválido para la lista de usuarios.' });
    }
    saveStoredUsers(users);
    res.json({ success: true, users });
  });

  // Client dynamic registration API
  app.post('/api/users/register-client', (req, res) => {
    const { name, username, email, phone, password } = req.body;
    const cleanEmail = email ? email.trim() : '';
    let cleanUsername = username ? username.trim().toLowerCase() : '';
    // Si no envían usuario, se deriva del correo
    if (!cleanUsername && cleanEmail) {
      cleanUsername = cleanEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
    }

    if (!name || !cleanEmail || !password) {
      return res.status(400).json({ error: 'Faltan datos: nombre, correo y contraseña son obligatorios.' });
    }

    const existing = loadStoredUsers();

    // Si el usuario derivado ya existe, se le añade un sufijo único
    if (existing.some((u: any) => u.username === cleanUsername)) {
      cleanUsername = cleanUsername + Math.floor(10 + Math.random() * 90);
    }
    // Evita duplicar el correo
    if (existing.some((u: any) => (u.email || '').toLowerCase() === cleanEmail.toLowerCase())) {
      return res.status(400).json({ error: 'Ese correo ya está registrado. Inicia sesión.' });
    }

    const newClient = {
      username: cleanUsername,
      role: 'cliente',
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : '',
      password: password
    };

    const updatedList = [...existing, newClient];

    // Ensure we also have standard defaults seeded on first action if they are missing
    if (!updatedList.some((u: any) => u.username === 'operador')) {
      updatedList.push({ username: 'operador', role: 'practiker', name: 'Operario Standard', password: 'chef123' });
    }
    if (!updatedList.some((u: any) => u.username === 'admin')) {
      updatedList.push({ username: 'admin', role: 'admin', name: 'Director SGC', password: 'admin123' });
    }

    saveStoredUsers(updatedList);
    res.status(201).json({ success: true, user: newClient });
  });

  // Dynamic user verification / login endpoint
  app.post('/api/users/login', (req, res) => {
    const { username, password } = req.body;
    const u = username ? username.trim().toLowerCase() : '';
    const existing = loadStoredUsers();

    const matched = existing.find((usr: any) =>
      (usr.username === u || (usr.email || '').toLowerCase() === u) && verifyPassword(password, usr.password)
    );
    if (matched) {
      // No exponer el hash de la contraseña al cliente
      const { password: _pw, ...safeUser } = matched;
      res.json({ success: true, user: safeUser });
    } else {
      res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }
  });

  // --- LOGIN CON GOOGLE (OAuth) ---
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
  const googleOAuth = new OAuth2Client(GOOGLE_CLIENT_ID);

  // Entrega configuración pública al frontend (Client ID de Google)
  app.get('/api/config', (req, res) => {
    res.json({ googleClientId: GOOGLE_CLIENT_ID });
  });

  // Verifica el token de Google y crea/inicia sesión del usuario
  app.post('/api/auth/google', async (req, res) => {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Falta el token de Google.' });
    }
    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: 'El servidor no tiene configurado GOOGLE_CLIENT_ID.' });
    }
    try {
      const ticket = await googleOAuth.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return res.status(401).json({ error: 'No se pudo leer el correo de Google.' });
      }
      const email = payload.email;
      const name = payload.name || email.split('@')[0];

      const users = loadStoredUsers();
      let user = users.find((u: any) => (u.email || '').toLowerCase() === email.toLowerCase());

      if (!user) {
        // Crea el cliente automáticamente con una contraseña aleatoria (no se usa para Google)
        let username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
        if (users.some((u: any) => u.username === username)) {
          username = username + Math.floor(10 + Math.random() * 90);
        }
        user = {
          username,
          role: 'cliente',
          name,
          email,
          phone: '',
          password: crypto.randomBytes(24).toString('hex'),
          provider: 'google'
        };
        users.push(user);
        saveStoredUsers(users);
      }

      const { password: _pw, ...safeUser } = user;
      res.json({ success: true, user: safeUser });
    } catch (err: any) {
      console.error('Error verificando token de Google:', err);
      res.status(401).json({ error: 'No se pudo verificar el inicio con Google.' });
    }
  });

  // First time wizard initialization / administrator registry (Kept for backwards compatibility if needed)
  app.post('/api/users/setup-admin', (req, res) => {
    const { name, username, password } = req.body;
    const cleanUsername = username ? username.trim().toLowerCase() : '';
    
    if (!name || !cleanUsername || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios: Nombre, Usuario y Contraseña.' });
    }

    // Load any existing users
    const existing = loadStoredUsers();
    
    // Check if the username already exists or build the initial setup list
    const filtered = existing.filter((usr: any) => usr.username !== cleanUsername);
    
    // The first user created this way is a master administrator ('admin' role)
    const newAdmin = {
      username: cleanUsername,
      role: 'admin',
      name: name.trim(),
      password: password
    };
    
    const updatedList = [...filtered, newAdmin];
    
    // Also let's append default operator and default accounts if they aren't there yet,
    // to keep system functional as requested or allow initial seed
    if (!updatedList.some((u: any) => u.username === 'operador')) {
      updatedList.push({ username: 'operador', role: 'practiker', name: 'Operario Standard', password: 'chef123' });
    }

    saveStoredUsers(updatedList);
    res.status(201).json({ success: true, user: newAdmin });
  });

  // --- REST ENDPOINTS (COLABORATIVOS) ---

  // Get Catalogs
  app.get('/api/products', (req, res) => {
    res.json(initialProducts);
  });

  // Get Subscriptions
  app.get('/api/subscriptions', (req, res) => {
    res.json(initialSubscriptions);
  });

  // Get Certified Operators (Practikers)
  app.get('/api/practikers', (req, res) => {
    res.json(initialPractikers);
  });

  // Get Recipes
  app.get('/api/recipes', (req, res) => {
    res.json(initialRecipes);
  });

  // Get Orders
  app.get('/api/orders', (req, res) => {
    res.json(mockOrders);
  });

  // Create standard multi-actor Order (Client purchases subscription or checkout)
  app.post('/api/orders', (req, res) => {
    const { 
      clientId, 
      clientName, 
      clientEmail, 
      clientAddress, 
      clientPhone, 
      planId, 
      items, 
      totalAmount,
      scheduledDeliveryDate,
      deliveryWindow
    } = req.body;

    if (!clientName || !items || items.length === 0) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para agendar su alistamiento culinario.' });
    }

    const newOrder: Order = {
      id: `ord-${Math.floor(100 + Math.random() * 900)}`,
      clientId: clientId || 'user-anon',
      clientName,
      clientEmail: clientEmail || 'info@practika.co',
      clientAddress,
      clientPhone,
      planId,
      items,
      totalAmount,
      status: 'pendiente',
      scheduledDeliveryDate: scheduledDeliveryDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryWindow: deliveryWindow || '08:00 - 12:00',
      dateCreated: new Date().toISOString(),
      // Simulate random location within Villavicencio range (approx)
      latitude: 4.14 + (Math.random() - 0.5) * 0.02,
      longitude: -73.63 + (Math.random() - 0.5) * 0.02
    };

    mockOrders.push(newOrder);
    saveOrders();
    res.status(201).json(newOrder);
  });

  // Claim order (Fase 2 Uber-style geo-claim for Practiker)
  app.post('/api/orders/:id/claim', (req, res) => {
    const { id } = req.params;
    const { operatorId, operatorName } = req.body;

    if (!operatorId || !operatorName) {
      return res.status(400).json({ error: 'Se requiere información del Operador Practiker para asignar.' });
    }

    const orderIndex = mockOrders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Pedido de alistamiento no encontrado.' });
    }

    if (mockOrders[orderIndex].status !== 'pendiente') {
      return res.status(400).json({ error: 'Este pedido ya ha sido tomado por otro operador culinario.' });
    }

    mockOrders[orderIndex].status = 'asignado';
    mockOrders[orderIndex].operatorId = operatorId;
    mockOrders[orderIndex].operatorName = operatorName;

    // Simulate operator workload increase
    const op = initialPractikers.find(p => p.id === operatorId);
    if (op) {
      op.currentWorkload += 1;
    }

    saveOrders();
    res.json(mockOrders[orderIndex]);
  });

  // Start preparation of order (Status transitions)
  app.post('/api/orders/:id/start-prep', (req, res) => {
    const { id } = req.params;
    const orderIndex = mockOrders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    mockOrders[orderIndex].status = 'preparando';
    saveOrders();
    res.json(mockOrders[orderIndex]);
  });

  // Complete and package al al vacío with quality assurance checkpoints (PCC Gamificados)
  app.post('/api/orders/:id/complete-packaging', (req, res) => {
    const { id } = req.params;
    const { 
      batchCode, 
      verifiedScaledWeight, 
      verifiedVacuumPressure, 
      verifiedSealTemperature, 
      verifiedSealTime 
    } = req.body;

    const orderIndex = mockOrders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Pedido con ID especificado no existe.' });
    }

    mockOrders[orderIndex].status = 'empaque_listo';
    mockOrders[orderIndex].batchCode = batchCode || `PK-LOTE-${new Date().toISOString().slice(5,10).replace('-','')}-${Math.floor(10 + Math.random() * 90)}`;
    mockOrders[orderIndex].verifiedScaledWeight = verifiedScaledWeight || 500;
    mockOrders[orderIndex].verifiedVacuumPressure = verifiedVacuumPressure || 99.2;
    mockOrders[orderIndex].verifiedSealTemperature = verifiedSealTemperature || 160;
    mockOrders[orderIndex].verifiedSealTime = verifiedSealTime || 3.5;
    mockOrders[orderIndex].packagingConfirmedAt = new Date().toISOString();

    // Workload decrease
    const opId = mockOrders[orderIndex].operatorId;
    if (opId) {
      const op = initialPractikers.find(p => p.id === opId);
      if (op) {
        op.currentWorkload = Math.max(0, op.currentWorkload - 1);
        op.completedOrdersCount += 1;
      }
    }

    saveOrders();
    res.json(mockOrders[orderIndex]);
  });

  // Finish dispatch and deliver
  app.post('/api/orders/:id/deliver', (req, res) => {
    const { id } = req.params;
    const orderIndex = mockOrders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Pedido no existe.' });
    }

    mockOrders[orderIndex].status = 'entregado';
    saveOrders();
    res.json(mockOrders[orderIndex]);
  });

  // Report stock alert / micro-inventario report
  app.post('/api/practikers/:id/stock-alert', (req, res) => {
    const { id } = req.params;
    const { ingredientName, isDepleted } = req.body;

    const op = initialPractikers.find(p => p.id === id);
    if (!op) {
      return res.status(404).json({ error: 'Practiker no registrado.' });
    }

    const ingredientIndex = op.rawIngredientsStock.findIndex(i => i.ingredientName.includes(ingredientName));
    if (ingredientIndex !== -1) {
      op.rawIngredientsStock[ingredientIndex].stockLevelPercent = isDepleted ? 10 : 100;
    } else {
      op.rawIngredientsStock.push({
        ingredientName,
        stockLevelPercent: isDepleted ? 10 : 100
      });
    }

    res.json({ success: true, updatedStock: op.rawIngredientsStock });
  });

  // Retrieve metrics dashboard (Fase 1 quality tracking)
  app.get('/api/metrics', (req, res) => {
    const totalDeliveries = mockOrders.filter(o => o.status === 'entregado').length;
    const pendingCount = mockOrders.filter(o => o.status === 'pendiente').length;
    const inPrepCount = mockOrders.filter(o => o.status === 'preparando' || o.status === 'asignado').length;
    
    // Calculated live metrics
    const baseRevenue = 2854000; // Simulated historical
    const addedRevenue = mockOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    const stats: DashboardMetrics = {
      totalRevenueMonthly: baseRevenue + addedRevenue,
      activeSubscriptionsCount: 38 + mockOrders.filter(o => o.planId).length,
      volumeOrdersWeekly: 14 + mockOrders.length,
      customerRetentionRate: 94.2,
      averageCAC: 42000, // COP (~$11 USD)
      churnRate: 2.1
    };
    res.json(stats);
  });

  // --- GEMINI SERVER-SIDE INTEGRATION ---

  // Client / Operator Assistant (Sugerencia Chef Alvaro)
  app.post('/api/gemini/assistant', async (req, res) => {
    const { prompt, chatterRole, contextProduct } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt es requerido para consultar al Chef Alvaro.' });
    }

    console.log(`Assistant requested for role: ${chatterRole}, Product: ${contextProduct}`);

    const systemInstruction = `
      Eres el Asistente Inteligente del Chef Alvaro Ibañez Peluffo en la plataforma PRACTIKA.
      PRACTIKA es un Hub FoodTech de alistamiento culinario (preparación previa, marinado y empacado al vacío) de bases, salsas, vegetales porcionados y proteínas envasadas al vacío para hogares.
      
      Debes responder con carisma técnico, pasión culinaria y rigurosidad en protocolos de inocuidad (SGC, HACCP, Puntos Críticos de Control como temperaturas bajo 4°C, tiempos de sellado, bolsas de alta barrera coextruidas).
      Tus interlocutores pueden ser Clientes Hogares (preguntando cuánto dura un alimento en el refrigerador al vacío, sugerencias de recetas semanales a partir del Kit de Cocina) o Practikers (Operadores Culinarios independientes que cocinan bajo estándares homologados de PRACTIKA, preguntando cómo calibrar la campana al vacío, peso neto de merma, cocciones térmicas precisas).
      
      Instrucciones de formato:
      - Responde siempre en Español carismático, profesional y estimulante.
      - Sé directo e incentiva las mejores prácticas de PRACTIKA (Zero Desperdicio, eficiencia en el hogar, economía colaborativa en micro-talleres regionales con ParqueSoft Meta).
      - Utiliza formato markdown elegante con negritas y listas viñeteadas.
      - Evita jerga de IA, no digas cosas como "como modelo de lenguaje".
    `;

    try {
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("YOUR")) {
        console.warn("GEMINI_API_KEY is not defined. Emulating Chef Alvaro responses locally.");
        const simulatedResponse = getSimulatedChefResponse(prompt, chatterRole, contextProduct);
        return res.json({ text: simulatedResponse });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });

    } catch (err: any) {
      console.error("Gemini API Error in Assistant route: ", err);
      res.status(500).json({ error: 'Error procesando solicitud con la IA de Chef Alvaro: ' + err.message });
    }
  });

  // IA de Predicción de Demanda (Demand Forecasting Engine for Admin)
  app.post('/api/gemini/predict-demand', async (req, res) => {
    // Collect active orders information to feed the context
    const ordersSummary = mockOrders.map(o => ({
      id: o.id,
      status: o.status,
      items: o.items.map(it => `${it.quantity}x ${it.name} (${it.weightGrams}g)`),
      deliveryDate: o.scheduledDeliveryDate
    }));

    const inventoryLevels = initialPractikers.reduce((acc, curr) => {
      curr.rawIngredientsStock.forEach(stock => {
        const item = acc.find(i => i.name === stock.ingredientName);
        if (item) {
          item.avgPercent = Math.round((item.avgPercent + stock.stockLevelPercent) / 2);
        } else {
          acc.push({ name: stock.ingredientName, avgPercent: stock.stockLevelPercent });
        }
      });
      return acc;
    }, [] as { name: string, avgPercent: number }[]);

    const prompt = `
      Genera la Predicción de Demanda de Materias Primas para la próxima semana en PRACTIKA.
      
      Información actual:
      - Pedidos activos actuales: ${JSON.stringify(ordersSummary)}
      - Niveles promedio de Micro-Inventario de los Operadores Practikers: ${JSON.stringify(inventoryLevels)}
      - Fórmulas Estándar Creadas: Pasta de Ajo Natural, Chimichurri Premium, Res Desmechada al Vacío.
      - Alistamiento promedio: 50% proteínas, 25% vegetales frescos, 15% salsas, 10% bases aromatizantes.
      
      Genera un plan predictivo detallado que contenga:
      1. Cantidades aproximadas en Kilogramos o Litros necesarias a comprar (Res, Ajo, Romero, Vegetales, Salsas vacías).
      2. Detección de posibles cuellos de botella (ej. materias primas con niveles críticos de existencias en operarios o insumos desbalanceados).
      3. Recomendaciones logísticas de compras grupales para bajar el CAC y las mermas a cero (Fórmula Zero Waste del Chef Álvaro).
      4. Recomendaciones de productos para promocionar en el catálogo de clientes según el pronóstico.
    `;

    const schemaInstruction = `
      Escribe un informe de Inteligencia de Negocio extremadamente conciso y valioso para el Administrador de PRACTIKA.
      Utiliza tablas organizadas en Markdown, listas numeradas de prioridades e insights ejecutivos.
    `;

    try {
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("YOUR")) {
        console.warn("GEMINI_API_KEY is not defined. Emulating AI Demand Prediction.");
        const simulatedPrediction = getSimulatedPrediction(mockOrders);
        return res.json(simulatedPrediction);
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: `Eres la Inteligencia Artificial Predictiva de Demanda de PRACTIKA. Analiza stock e ingrediente con precisión matemática y mentalidad Zero Waste. ${schemaInstruction}`,
          temperature: 0.3,
        }
      });

      // Assemble structured prediction payload
      const fullResponseText = response.text || "No se pudo generar análisis.";
      const calculatedDeficits = calculateDeficit(mockOrders, inventoryLevels);

      const predictionResult: DemandPrediction = {
        targetWeek: "Semana del Culinaria Siguiente (Próximos 7 días)",
        predictedOrdersCount: mockOrders.length + 8,
        rawMaterialsNeeded: calculatedDeficits,
        estimatedPackagingBagsRequired: (mockOrders.length + 8) * 4,
        aiInsightsMarkdown: fullResponseText,
        generatedAt: new Date().toISOString()
      };

      res.json(predictionResult);

    } catch (err: any) {
      console.error("Gemini API Error in Prediction route: ", err);
      // Fallback
      const backupPrediction = getSimulatedPrediction(mockOrders);
      backupPrediction.aiInsightsMarkdown = `*Aviso: Usando motor de respaldo matemático por caída de red.* \n\n` + backupPrediction.aiInsightsMarkdown;
      res.json(backupPrediction);
    }
  });


  // --- VITE DEV / PRODUCTION DIRECTORY SERVING ---

  if (process.env.DISABLE_HMR === 'true') {
    console.log("HMR explicitly disabled by developer runtime constraints.");
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("Configuring Vite Development Server Multi-Routing Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Configuring Production Web Static Resource Routing...");
    const distPath = path.join(process.cwd(), 'dist');
    // Assets con hash de contenido: caché agresiva (1 año, inmutable).
    // index.html nunca se cachea para que siempre cargue la última versión.
    app.use(express.static(distPath, {
      maxAge: '1y',
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PRACTIKA Server initialized and available on http://localhost:${PORT}`);
  });
}

// --- SIMULATION HELPERS FOR ZERO-DEPENDENCY OFFLINE SUPPORT ---

function getSimulatedChefResponse(prompt: string, role: string, product?: string): string {
  const p = prompt.toLowerCase();
  
  if (role === 'peticion_receta' || p.includes('receta') || p.includes('preparar') || p.includes('cocinar')) {
    return `### 🍳 Estándar de Preparación de Chef Álvaro Ibañez
    
En PRACTIKA multiplicamos el sabor al suprimir el aire. Para procesar o regenerar tus platos, te sugiero el siguiente flujograma:

1. **Pre-Enfriado Estricto:** Antes de introducir aliños o alimentos calientes al vacío, llévalos a menos de 4°C. Introducir líquidos templados provoca ebullición prematura a baja presión y estropea el empaque.
2. **Gramaje de Precisión:** Las mermas en proteínas cocidas no deben superar el 15%. Pesa siempre en báscula digital homologada antes de etiquetar.
3. **Calibración de la Selladora:**
   - **Líquidos (Salsas, Bases):** Presión al **92%-94%**. Tiempo de soldadura: **2.8 segundos**.
   - **Fibras Duras (Sólidos como Res/Cerdo):** Presión máxima al **99.5%**. Tiempo de soldadura: **3.8 segundos** para bolsas gruesas de 150 micras.

*¿Deseas que profundicemos en la curva de cocción lenta de las bolsas coextruidas de poliamida?*`;
  }

  if (role === 'practiker' || p.includes('vacío') || p.includes('operación') || p.includes('limpieza')) {
    return `### 🛡️ Protocolo para Operadores PRACTIKA (HACCP)

Hola Practiker, mantener la inocuidad es nuestro principal factor de fidelización comercial familiar. 

**Indicaciones Críticas para el Sellado al Vacío:**
* **Bolsas Termoencogibles:** Utiliza bolsas de alta barrera OPA/PE de grado alimentario de 120 o 150 micras. Las bolsas de menor calibre sufren micro-perforaciones con huesos o costras de sellado.
* **Higiene de Sellos:** Limpia el borde superior interior de la bolsa con papel absorbente estéril antes de cerrar. Los restos de grasa o salsa impiden que la barra térmica fusione el polímero, causando fugas de vacío en los siguientes 5 días.
* **Control de Temperatura y Choque Térmico:** Tras realizar el Sous-Vide de pechugas o res, introduce los paquetes en una tina de choque térmico con agua e hielo (80% hielo, 20% agua) por 45 minutos. Debes cruzar la zona de peligro térmico (65°C a 4°C) en menos de 90 minutos para evitar micro-bacterias latentes.

*¡Sigue el checklist gamificado en tu panel para asegurar el bono de calidad de la marca!*`;
  }

  return `### 🥑 Tips de Conservación de PRACTIKA de Chef Álvaro

¡Hola culinarista en casa! Gracias por elegir PRACTIKA para optimizar tu tiempo semanal.

**Consejos para conservar tus kits:**
1. **Bases y Condimentos:** Pasta de ajo y condimentos deben conservarse siempre refrigerados a menos de 4°C. Una vez abierta la tapa, utiliza siempre cucharas limpias y secas para evitar contaminaciones cruzadas externas.
2. **Acondicionamiento Semanal:** Los mixes de vegetales confitados al vacío vienen listos para saltar en sartén por solo 3 minutos. Al estar sellados en aceite de aguacate y marinados al vacío, sus células absorben el aroma de las hierbas un 300% más rápido que los métodos tradicionales.
3. **Congelación Intensa:** Si consideras que no consumirás las proteínas marinadas dentro de las fechas de vencimiento de refrigeración (15 días), puedes congelarlas directamente en su propia bolsa al vacío. El vacío evita la quemadura por congelamiento y cristales de hielo que rompen la jugosidad original de la carne.

*¿Qué tienes pensado preparar para tu cena de hoy? Cuéntame y te daré ideas con chimichurri premium.*`;
}

function calculateDeficit(orders: Order[], inventory: { name: string, avgPercent: number }[]) {
  // Rough math calculations based on active orders
  const baseDeficits = [
    { ingredientName: 'Pecho de Res Premium (Falda)', estimatedKgRequired: 15.0, unit: 'Kg', currentInventoryKg: 4.5, deficitKg: 10.5 },
    { ingredientName: 'Ajo Sabanero Fresco', estimatedKgRequired: 6.0, unit: 'Kg', currentInventoryKg: 5.2, deficitKg: 0.8 },
    { ingredientName: 'Romero / Tomillo Fresco', estimatedKgRequired: 2.5, unit: 'Kg', currentInventoryKg: 1.0, deficitKg: 1.5 },
    { ingredientName: 'Zanahoria y Calabacín Baby', estimatedKgRequired: 18.0, unit: 'Kg', currentInventoryKg: 12.0, deficitKg: 6.0 },
    { ingredientName: 'Aceite de Girasol Natural', estimatedKgRequired: 8.0, unit: 'Litros', currentInventoryKg: 9.5, deficitKg: 0.0 }
  ];

  // Adjust mathematically if mockOrders grew
  if (orders.length > 3) {
    const multiplier = orders.length / 3;
    return baseDeficits.map(d => {
      const estimation = Math.round(d.estimatedKgRequired * multiplier * 10) / 10;
      const deficit = Math.max(0, Math.round((estimation - d.currentInventoryKg) * 10) / 10);
      return {
        ...d,
        estimatedKgRequired: estimation,
        deficitKg: deficit
      };
    });
  }
  return baseDeficits;
}

function getSimulatedPrediction(orders: Order[]): any {
  return {
    targetWeek: "Próximos 7 días calendario",
    predictedOrdersCount: orders.length + 8,
    rawMaterialsNeeded: [
      { ingredientName: 'Pecho de Res Premium (Falda)', estimatedKgRequired: 14.5, unit: 'Kg', currentInventoryKg: 4.5, deficitKg: 10.0 },
      { ingredientName: 'Ajo Sabanero Fresco', estimatedKgRequired: 5.8, unit: 'Kg', currentInventoryKg: 5.2, deficitKg: 0.6 },
      { ingredientName: 'Romero / Tomillo Fresco', estimatedKgRequired: 2.2, unit: 'Kg', currentInventoryKg: 1.0, deficitKg: 1.2 },
      { ingredientName: 'Zanahoria y Calabacín Baby', estimatedKgRequired: 16.0, unit: 'Kg', currentInventoryKg: 12.0, deficitKg: 4.0 },
      { ingredientName: 'Aceite de Girasol Sano', estimatedKgRequired: 7.5, unit: 'Litros', currentInventoryKg: 9.5, deficitKg: 0 }
    ],
    estimatedPackagingBagsRequired: (orders.length + 8) * 4,
    aiInsightsMarkdown: `### 📈 Análisis de Tendencia y Recomendaciones de Abastecimiento - Insumos PRACTIKA

A partir de las suscripciones familiares vigentes y la proximidad de los planes recurrentes quincenales, se ha ejecutado el modelo para evaluar aprovisionamientos eficientes con **mermas nulas (Zero Waste Target)**.

#### 1. Diagnóstico de Insumos Críticos
*   **Pecho de Res Premium (Falda):** Se registra el principal cuello de botella potencial. Requerimos de forma consolidada **14.5 Kg** para cubrir el salto de pedidos quincenales, pero el micro-centro cuenta únicamente con **4.5 Kg** distribuidos entre operarios. Se sugiere detonar una orden de compra consolidada con ganaderos locales por **10 Kg** el viernes AM.
*   **Insumos Aromáticos (Zanahoria baby, romero):** Consumidos activamente en las *Soluciones Listas de Vegetales Confit*. El romero fresco muestra déficit local en el micro-centro de Carlos Mario. Coordinar con el huerto urbano aliado.

#### 2. Logística de Valor Agregado & Ahorro de Costos
*   Asociar compras al por mayor de ajo y cebolla larga reduce el costo unitario un **18.7%**, mejorando el margen de ganancia operativa de los Practikers de ParqueSoft Meta.
*   Se sugiere despachar los insumos secos directamente el lunes y pre-porcionar en bloque el martes de producción colectiva.

#### 3. Hacks de Catalización de Stock
*   Existen excesos previstos de **Aceite de Girasol Sano**. Se sugiere incentivar en la app de cara al cliente final el aditivo de *Chimichurri Premium* u ofrecerlo como un obsequio promocional premium de retención por renovaciones automáticas de suscripción.`,
    generatedAt: new Date().toISOString()
  };
}

startServer();
