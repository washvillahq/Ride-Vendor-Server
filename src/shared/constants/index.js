const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};

const CAR_TYPES = {
  SEDAN: 'Sedan',
  SUV: 'SUV',
  TRUCK: 'Truck',
  VAN: 'Van',
  COUPE: 'Coupe',
  WAGON: 'Wagon',
  CONVERTIBLE: 'Convertible',
  SPORTS_CAR: 'Sports Car',
  DIESEL: 'Diesel',
  CROSSOVER: 'Crossover',
  LUXURY: 'Luxury',
  HYBRID: 'Hybrid',
  ELECTRIC: 'Electric',
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
  CAR_CATEGORIES,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  ORDER_STATUS,
  CAR_STATUS,
};
