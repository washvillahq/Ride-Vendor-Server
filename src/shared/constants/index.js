const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};

const CAR_TYPES = {
  SEDAN: 'Sedan',
  SUV: 'SUV',
  TRUCK: 'Truck',
  COUPE: 'Coupe',
  VAN: 'Van',
  WAGON: 'Wagon',
  CONVERTIBLE: 'Convertible',
  SPORTS_CAR: 'Sports Car',
  LUXURY: 'Luxury',
  CROSSOVER: 'Crossover',
};

const CAR_CONDITIONS = {
  NEW: 'New',
  TOKUNBO: 'Tokunbo',
  LOCAL_USED: 'Local Used',
};

const SERVICE_CATEGORIES = {
  EXECUTIVE_VIP: 'Executive & VIP',
  WEDDING: 'Wedding Specials',
  CORPORATE: 'Corporate & Staff',
  DAILY_AIRPORT: 'Daily & Airport',
};

const CAR_TRANSMISSIONS = {
  AUTOMATIC: 'Automatic',
  MANUAL: 'Manual',
  CVT: 'CVT',
};

const CAR_FUEL_TYPES = {
  PETROL: 'Petrol',
  DIESEL: 'Diesel',
  HYBRID: 'Hybrid',
  ELECTRIC: 'Electric',
  GAS: 'Gas',
};

const CAR_CATEGORIES = {
  RENTAL: 'rental',
  SALE: 'sale',
};

const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const CAR_STATUS = {
  AVAILABLE: 'available',
  UNAVAILABLE: 'unavailable',
  MAINTENANCE: 'maintenance',
  SOLD: 'sold',
};

module.exports = {
  ROLES,
  CAR_TYPES,
  CAR_CONDITIONS,
  SERVICE_CATEGORIES,
  CAR_TRANSMISSIONS,
  CAR_FUEL_TYPES,
  CAR_CATEGORIES,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  ORDER_STATUS,
  CAR_STATUS,
};
