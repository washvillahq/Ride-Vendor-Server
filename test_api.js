require('dotenv').config({ path: './.env' });
const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5001/api/v1';

const testUser = {
  name: 'Test Setup User',
  email: `testuser_${Date.now()}@example.com`,
  password: 'Password123!',
  passwordConfirm: 'Password123!',
  phone: '1234567890'
};

let userToken = '';
let adminToken = '';
let generatedIds = {
  users: [],
  cars: [],
  services: [],
  bookings: [],
  orders: []
};

async function setupAdmin() {
  console.log('--- Connecting to DB to setup Admin ---');
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('./src/modules/user/user.model');
  
  // Register an admin user via endpoint first so it gets hashed password
  const adminData = {
    name: 'Admin Tester',
    email: `admintester_${Date.now()}@example.com`,
    password: 'Password123!',
    passwordConfirm: 'Password123!',
    phone: '0987654321'
  };
  
  const res = await axios.post(`${BASE_URL}/auth/register`, adminData);
  adminToken = res.data.data.token;
  const adminId = res.data.data.user._id || res.data.data.user.id;
  generatedIds.users.push(adminId);
  
  // Update to admin directly in DB
  await User.findByIdAndUpdate(adminId, { role: 'admin' });
  console.log('Admin user setup complete:\n', res.data.data.user);
}

async function runTests() {
  try {
    // 1. Setup Admin
    await setupAdmin();

    // 2. Auth Tests
    console.log('\n--- Testing Auth Endpoints ---');
    const registerRes = await axios.post(`${BASE_URL}/auth/register`, testUser);
    console.log('✅ POST /auth/register - ', registerRes.status);
    userToken = registerRes.data.data.token;
    
    // Add to generated IDs for cleanup
    const userId = registerRes.data.data.user._id || registerRes.data.data.user.id;
    generatedIds.users.push(userId);
    
    // Login
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ POST /auth/login - ', loginRes.status);
    
    // Get Me
    const meRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✅ GET /auth/me - ', meRes.status);
    
    // 3. User & Admin Tests
    console.log('\n--- Testing Admin Endpoints ---');
    const usersRes = await axios.get(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ GET /admin/users - ', usersRes.status);
    
    // 4. Car Tests
    console.log('\n--- Testing Car Endpoints ---');
    const newCar = {
      title: 'Camry LE',
      brand: 'Toyota',
      model: 'LE',
      year: 2023,
      category: 'Sedan',
      type: 'rental',
      pricePerDay: 50,
      location: 'Test City',
      description: 'A nice test car',
      images: [{ url: 'http://test.com/img.png', public_id: 'img1' }]
    };
    
    const createCarRes = await axios.post(`${BASE_URL}/cars`, newCar, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ POST /cars - ', createCarRes.status);
    const carId = createCarRes.data.data._id || createCarRes.data.data.id;
    generatedIds.cars.push(carId);
    
    const getCarsRes = await axios.get(`${BASE_URL}/cars`);
    console.log('✅ GET /cars - ', getCarsRes.status);
    
    const getCarRes = await axios.get(`${BASE_URL}/cars/${carId}`);
    console.log(`✅ GET /cars/${carId} - `, getCarRes.status);
    
    // 5. Service Tests
    console.log('\n--- Testing Service Endpoints ---');
    const newService = {
      name: `Test Service ${Date.now()}`,
      description: 'A test service',
      pricePerDay: 100,
      applicableTo: ['Sedan']
    };
    const createServiceRes = await axios.post(`${BASE_URL}/services`, newService, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ POST /services - ', createServiceRes.status);
    const serviceId = createServiceRes.data.data._id || createServiceRes.data.data.id;
    generatedIds.services.push(serviceId);
    
    const getServicesRes = await axios.get(`${BASE_URL}/services`);
    console.log('✅ GET /services - ', getServicesRes.status);
    
    const getServiceRes = await axios.get(`${BASE_URL}/services/${serviceId}`);
    console.log(`✅ GET /services/${serviceId} - `, getServiceRes.status);
    
    // 6. Booking Tests
    console.log('\n--- Testing Booking Endpoints ---');
    // Ensure dates are valid
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    const newBooking = {
      carId: carId,
      startDate: tomorrow.toISOString(),
      endDate: dayAfter.toISOString(),
      services: [serviceId]
    };
    
    const createBookingRes = await axios.post(`${BASE_URL}/bookings`, newBooking, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✅ POST /bookings - ', createBookingRes.status);
    const bookingId = createBookingRes.data.data._id || createBookingRes.data.data.id;
    generatedIds.bookings.push(bookingId);
    
    // check availability
    const availRes = await axios.get(`${BASE_URL}/bookings/check-availability?carId=${carId}&startDate=${tomorrow.toISOString()}&endDate=${dayAfter.toISOString()}`);
    console.log('✅ GET /bookings/check-availability - ', availRes.status);

    // 7. Order Tests
    console.log('\n--- Testing Order Endpoints ---');
    // For orders, we need a car with type 'sale'
    const saleCar = {
      title: 'Sale Car',
      brand: 'Toyota',
      model: 'Camry',
      year: 2023,
      category: 'Sedan',
      type: 'sale',
      salePrice: 20000,
      location: 'Test City',
      description: 'A test car for sale',
      images: [{ url: 'http://test.com/img_sale.png', public_id: 'img_sale' }]
    };
    const createSaleCarRes = await axios.post(`${BASE_URL}/cars`, saleCar, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const saleCarId = createSaleCarRes.data.data._id || createSaleCarRes.data.data.id;
    generatedIds.cars.push(saleCarId);

    const newOrder = {
      carId: saleCarId
    };
    
    const createOrderRes = await axios.post(`${BASE_URL}/orders`, newOrder, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✅ POST /orders - ', createOrderRes.status);
    const orderId = createOrderRes.data.data._id || createOrderRes.data.data.id;
    generatedIds.orders.push(orderId);
    
    const getOrdersRes = await axios.get(`${BASE_URL}/orders`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✅ GET /orders - ', getOrdersRes.status);

    // 8. Payment Tests (Initialization)
    console.log('\n--- Testing Payment Endpoints ---');
    const payRes = await axios.post(`${BASE_URL}/payments/initialize`, {
      type: 'booking',
      relatedId: bookingId
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✅ POST /payments/initialize - ', payRes.status);

    console.log('\n✅ All endpoints tested successfully!');
    
  } catch (err) {
    if (err.response) {
      require('fs').writeFileSync('test_error.json', JSON.stringify({
        status: err.response.status,
        data: err.response.data,
        url: err.config.url,
        method: err.config.method
      }, null, 2));
    } else {
      require('fs').writeFileSync('test_error.json', JSON.stringify({
        error: err.message
      }, null, 2));
    }
  } finally {
    console.log('\n--- Cleanup ---');
    if (mongoose.connection.readyState === 1) {
      const User = require('./src/modules/user/user.model');
      const Car = require('./src/modules/car/car.model');
      const Service = require('./src/modules/service/service.model');
      const Booking = require('./src/modules/booking/booking.model');
      const Order = require('./src/modules/order/order.model');
      
      await User.deleteMany({ _id: { $in: generatedIds.users } });
      await Car.deleteMany({ _id: { $in: generatedIds.cars } });
      await Service.deleteMany({ _id: { $in: generatedIds.services } });
      await Booking.deleteMany({ _id: { $in: generatedIds.bookings } });
      await Order.deleteMany({ _id: { $in: generatedIds.orders } });
      
      console.log('Cleanup completed.');
      await mongoose.disconnect();
    }
  }
}

runTests();
