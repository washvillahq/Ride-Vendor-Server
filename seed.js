require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./src/modules/user/user.model');
const Car = require('./src/modules/car/car.model');
const Service = require('./src/modules/service/service.model');
const { CAR_TYPES, CAR_CATEGORIES, CAR_STATUS, CAR_FUEL_TYPES } = require('./src/shared/constants');

const seedData = async () => {
  try {
    console.log('--- Connecting to Database ---');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected.');

    // 1. Create/Find Admin User
    console.log('\n--- Setting up Admin User ---');
    let admin = await User.findOne({ email: 'admin@ridevendor.com' });
    if (!admin) {
      admin = await User.create({
        name: 'System Admin',
        email: 'admin@ridevendor.com',
        password: 'Password123!',
        phone: '0000000000',
        role: 'admin'
      });
      console.log('Created new Admin user.');
    } else {
      console.log('Existing Admin user found.');
    }

    // 2. Clear existing Cars and Services
    console.log('\n--- Clearing Existing Data ---');
    await Car.deleteMany({});
    await Service.deleteMany({});
    console.log('Cleared existing Cars and Services.');

    // 3. Define Services
    const services = [
      { name: 'Basic Car Wash', pricePerDay: 15, description: 'Exterior wash and dry', applicableTo: Object.values(CAR_TYPES) },
      { name: 'Full Detailing', pricePerDay: 80, description: 'Deep interior and exterior cleaning', applicableTo: Object.values(CAR_TYPES) },
      { name: 'Oil Change', pricePerDay: 50, description: 'Standard oil and filter change', applicableTo: [CAR_TYPES.SEDAN, CAR_TYPES.SUV, CAR_TYPES.TRUCK] },
      { name: 'Tire Rotation', pricePerDay: 30, description: 'Rotation and balance for all four tires', applicableTo: Object.values(CAR_TYPES) },
      { name: 'Brake Inspection', pricePerDay: 40, description: 'Comprehensive brake system check', applicableTo: Object.values(CAR_TYPES) },
      { name: 'GPS Navigation Pro', pricePerDay: 10, description: 'Latest high-end GPS unit for rentals', applicableTo: Object.values(CAR_TYPES) },
      { name: 'Child Safety Seat', pricePerDay: 5, description: 'ISOFIX compatible child safety seat', applicableTo: [CAR_TYPES.SUV, CAR_TYPES.SEDAN, CAR_TYPES.VAN, CAR_TYPES.WAGON] }
    ];

    // 4. Define Cars (10 Rental)
    const rentalCars = [
      {
        title: 'Tesla Model 3 Performance',
        brand: 'Tesla',
        model: 'Model 3',
        year: 2023,
        category: CAR_TYPES.SEDAN,
        type: CAR_CATEGORIES.RENTAL,
        pricePerDay: 120,
        location: 'Lagos, Nigeria',
        description: 'Blazing fast electric sedan with Autopilot.',
        features: ['Autopilot', 'AWD', 'Premium Audio', 'Supercharging'],
        images: [{ url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=2071&auto=format&fit=crop', public_id: 'tesla_3', isPrimary: true }],
        createdBy: admin._id
      },
      {
        title: 'Toyota Camry LE 2024',
        brand: 'Toyota',
        model: 'Camry',
        year: 2024,
        category: CAR_TYPES.SEDAN,
        type: CAR_CATEGORIES.RENTAL,
        pricePerDay: 55,
        location: 'Abuja, Nigeria',
        description: 'Reliable and fuel-efficient daily driver.',
        features: ['Bluetooth', 'Backup Camera', 'Cruise Control'],
        images: [{ url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=2070&auto=format&fit=crop', public_id: 'toyota_camry', isPrimary: true }],
        createdBy: admin._id
      },
      {
        title: 'Range Rover Sport',
        brand: 'Land Rover',
        model: 'Range Rover Sport',
        year: 2022,
        category: CAR_TYPES.SUV,
        type: CAR_CATEGORIES.RENTAL,
        pricePerDay: 250,
        location: 'Victoria Island, Lagos',
        description: 'Luxury off-roader with unparalleled comfort.',
        features: ['4WD', 'Panoramic Sunroof', 'Leather Seats', 'Air Suspension'],
        images: [{ url: 'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?q=80&w=2070&auto=format&fit=crop', public_id: 'range_rover', isPrimary: true }],
        createdBy: admin._id
      },
      {
        title: 'Mercedes-Benz C300',
        brand: 'Mercedes-Benz',
        model: 'C300',
        year: 2021,
        category: CAR_TYPES.LUXURY,
        type: CAR_CATEGORIES.RENTAL,
        pricePerDay: 150,
        location: 'Lagos, Nigeria',
        description: 'The pinnacle of luxury engineering.',
        features: ['Turbo Engine', 'Ambient Lighting', 'Heated Seats'],
        images: [{ url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=2070&auto=format&fit=crop', public_id: 'merc_c300', isPrimary: true }],
        createdBy: admin._id
      },
      {
        title: 'Honda Odyssey EX-L',
        brand: 'Honda',
        model: 'Odyssey',
        year: 2022,
        category: CAR_TYPES.VAN,
        type: CAR_CATEGORIES.RENTAL,
        pricePerDay: 85,
        location: 'Ibadan, Nigeria',
        description: 'Perfect for family vacations and group trips.',
        features: ['8-Seats', 'Rear Entertainment', 'Power Doors'],
        images: [{ url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop', public_id: 'honda_van', isPrimary: true }],
        createdBy: admin._id
      },
      {
        title: 'Ford F-150 Lariat',
        brand: 'Ford',
        model: 'F-150',
        year: 2023,
        category: CAR_TYPES.TRUCK,
        type: CAR_CATEGORIES.RENTAL,
        pricePerDay: 110,
        location: 'Lekki, Lagos',
        description: 'Tough, capable, and smart full-size pickup.',
        features: ['Extended Bed', 'Towing Package', 'Apple CarPlay'],
        images: [{ url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=2070&auto=format&fit=crop', public_id: 'ford_f150', isPrimary: true }],
        createdBy: admin._id
      },
      {
        title: 'Lexus RX 350',
        brand: 'Lexus',
        model: 'RX 350',
        year: 2022,
        category: CAR_TYPES.SUV,
        type: CAR_CATEGORIES.RENTAL,
        pricePerDay: 180,
        location: 'Port Harcourt, Nigeria',
        description: 'Elegance meets versatility in this luxury SUV.',
        features: ['Smooth Ride', 'Mark Levinson Audio', 'Blind Spot Monitor'],
        images: [{ url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2070&auto=format&fit=crop', public_id: 'lexus_rx', isPrimary: true }],
        createdBy: admin._id
      },
      {
        title: 'BMW 5 Series',
        brand: 'BMW',
        model: '530i',
        year: 2021,
        category: CAR_TYPES.LUXURY,
        type: CAR_CATEGORIES.RENTAL,
        pricePerDay: 160,
        location: 'Enugu, Nigeria',
        description: 'The ultimate driving machine for business and pleasure.',
        features: ['M-Sport Pack', 'Digital Cockpit', 'Lane Assist'],
        images: [{ url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=2070&auto=format&fit=crop', public_id: 'bmw_5', isPrimary: true }],
        createdBy: admin._id
      },
      {
        title: 'Hyundai Ioniq 5',
        brand: 'Hyundai',
        model: 'Ioniq 5',
        year: 2023,
        category: CAR_TYPES.CROSSOVER,
        type: CAR_CATEGORIES.RENTAL,
        pricePerDay: 130,
        location: 'Kano, Nigeria',
        description: 'Retro-futuristic design with super-fast charging.',
        features: ['Ultra-fast charging', 'E-GMP platform', 'HUD'],
        images: [{ url: 'https://images.unsplash.com/photo-1664188615469-8084a44f2fb9?q=80&w=2070&auto=format&fit=crop', public_id: 'hyundai_ioniq', isPrimary: true }],
        createdBy: admin._id
      },
      {
        title: 'Volkswagen Golf GTI',
        brand: 'Volkswagen',
        model: 'Golf GTI',
        year: 2022,
        category: CAR_TYPES.COUPE,
        type: CAR_CATEGORIES.RENTAL,
        pricePerDay: 95,
        location: 'Lagos, Nigeria',
        description: 'The hot hatch that started it all.',
        features: ['Turbocharged', 'Sport Suspension', 'Plaid Seats'],
        images: [{ url: 'https://images.unsplash.com/photo-1489824905844-703f1b6215be?q=80&w=2070&auto=format&fit=crop', public_id: 'vw_golf', isPrimary: true }],
        createdBy: admin._id
      }
    ];

    // 5. Define Cars (10 Sale)
    const saleCars = [
      {
        title: 'Rolls-Royce Phantom',
        brand: 'Rolls-Royce',
        model: 'Phantom',
        year: 2024,
        category: CAR_TYPES.LUXURY,
        type: CAR_CATEGORIES.SALE,
        salePrice: 450000,
        location: 'Victoria Island, Lagos',
        description: 'Unmatched elegance and status. The ultimate luxury statement.',
        features: ['V12 Engine', 'Handcrafted Wood', 'Starlight Headliner'],
        images: [{ url: 'https://images.unsplash.com/photo-1631214503051-a7463.png?q=80&w=2070&auto=format&fit=crop', public_id: 'rr_phantom', isPrimary: true }],
        createdBy: admin._id
      },
      {
        title: 'Porsche 911 Carrera',
        brand: 'Porsche',
        model: '911 Carrera',
        year: 2023,
        category: CAR_TYPES.SPORTS_CAR,
        type: CAR_CATEGORIES.SALE,
        salePrice: 105000,
        location: 'Lekki Phase 1, Lagos',
        description: 'Legendary performance and timeless design.',
        features: ['Flat-six Engine', 'PDK Transmission', 'Sport Chrono'],
        images: [{ url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2070&auto=format&fit=crop', public_id: 'porsche_911', isPrimary: true }],
        createdBy: admin._id
      },
      {
        title: 'Toyota Land Cruiser 300',
        brand: 'Toyota',
        model: 'LC300',
        year: 2024,
        category: CAR_TYPES.SUV,
        type: CAR_CATEGORIES.SALE,
        salePrice: 110000,
        location: 'Abuja, Nigeria',
        description: 'The king of all terrains. Brand new LC300 model.',
        features: ['Twin Turbo V6', 'JBL Sound', 'Fridge', 'Multiterrain Monitor'],
        images: [{ url: 'https://images.unsplash.com/photo-1594535182308-8ffefbb661e1?q=80&w=2070&auto=format&fit=crop', public_id: 'toyota_lc300', isPrimary: true }],
        createdBy: admin._id
      },
      {
        title: 'Mercedes-AMG G63',
        brand: 'Mercedes-AMG',
        model: 'G63',
        year: 2023,
        category: CAR_TYPES.SUV,
        type: CAR_CATEGORIES.SALE,
        salePrice: 180000,
        location: 'Lagos, Nigeria',
        description: 'Performance meets iconic boxy design.',
        features: ['Hand-built V8', 'Burmester Audio', 'Night Package'],
        images: [{ url: 'https://images.unsplash.com/photo-1520031441872-265e4ff70366?q=80&w=2070&auto=format&fit=crop', public_id: 'merc_g63', isPrimary: true }],
        createdBy: admin._id
      },
      {
        title: 'Honda Civic RS',
        brand: 'Honda',
        model: 'Civic',
        year: 2023,
        category: CAR_TYPES.SEDAN,
        type: CAR_CATEGORIES.SALE,
        salePrice: 32000,
        location: 'Ikeja, Lagos',
        description: 'Sporty sedan with exceptional reliability.',
        features: ['Turbo Engine', 'Honda Sensing', 'LED Headlights'],
        images: [{ url: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=2070&auto=format&fit=crop', public_id: 'honda_civic', isPrimary: true }],
        createdBy: admin._id
      },
      {
        title: 'Ford Mustang GT',
        brand: 'Ford',
        model: 'Mustang GT',
        year: 2022,
        category: CAR_TYPES.SPORTS_CAR,
        type: CAR_CATEGORIES.SALE,
        salePrice: 48000,
        location: 'Lagos, Nigeria',
        description: 'American muscle at its finest.',
        features: ['5.0L V8', 'Manual Transmission', 'Brembo Brakes'],
        images: [{ url: 'https://images.unsplash.com/photo-1584345604135-e5163ea94e77?q=80&w=2070&auto=format&fit=crop', public_id: 'ford_mustang', isPrimary: true }],
        createdBy: admin._id
      },
      {
        title: 'Chevrolet Silverado High Country',
        brand: 'Chevrolet',
        model: 'Silverado',
        year: 2023,
        category: CAR_TYPES.TRUCK,
        type: CAR_CATEGORIES.SALE,
        salePrice: 65000,
        location: 'Abuja, Nigeria',
        description: 'Luxury pickup truck with massive towing capacity.',
        features: ['6.2L V8', 'Leather Interior', 'Super Cruise'],
        images: [{ url: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=2070&auto=format&fit=crop', public_id: 'chevy_truck', isPrimary: true }],
        createdBy: admin._id
      },
      {
        title: 'Lexus LX 600',
        brand: 'Lexus',
        model: 'LX 600',
        year: 2024,
        category: CAR_TYPES.LUXURY,
        type: CAR_CATEGORIES.SALE,
        salePrice: 125000,
        location: 'Lagos, Nigeria',
        description: 'The luxury counterpart of the Land Cruiser.',
        features: ['Twin Turbo V6', 'Triple Beam LEDs', 'Exec Seating'],
        images: [{ url: 'https://images.unsplash.com/photo-1605515298946-d062f2e9da53?q=80&w=2070&auto=format&fit=crop', public_id: 'lexus_lx', isPrimary: true }],
        createdBy: admin._id
      },
      {
        title: 'Nissan Navara Pro-4X',
        brand: 'Nissan',
        model: 'Navara',
        year: 2023,
        category: CAR_TYPES.TRUCK,
        type: CAR_CATEGORIES.SALE,
        salePrice: 42000,
        location: 'Kaduna, Nigeria',
        description: 'Rugged and ready for any adventure.',
        features: ['All-Terrain Tires', 'Roof Rails', '360 Camera'],
        images: [{ url: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?q=80&w=2070&auto=format&fit=crop', public_id: 'nissan_truck', isPrimary: true }],
        createdBy: admin._id
      },
      {
        title: 'Jeep Wrangler Rubicon',
        brand: 'Jeep',
        model: 'Wrangler Rubicon',
        year: 2023,
        category: CAR_TYPES.SUV,
        type: CAR_CATEGORIES.SALE,
        salePrice: 55000,
        location: 'Jos, Nigeria',
        description: 'Go anywhere, do anything. Pure freedom.',
        features: ['Soft Top', '4:1 Rock-Trac', 'Winch-Ready'],
        images: [{ url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop', public_id: 'jeep_wrangler', isPrimary: true }],
        createdBy: admin._id
      }
    ];

    // 6. Insert Services
    console.log('\n--- Seeding Services ---');
    const createdServices = await Service.insertMany(services);
    console.log(`Successfully seeded ${createdServices.length} services.`);

    // 7. Insert Cars
    console.log('\n--- Seeding Rental Cars ---');
    const createdRentalCars = await Car.insertMany(rentalCars);
    console.log(`Successfully seeded ${createdRentalCars.length} rental cars.`);

    console.log('\n--- Seeding Sale Cars ---');
    const createdSaleCars = await Car.insertMany(saleCars);
    console.log(`Successfully seeded ${createdSaleCars.length} sale cars.`);

    console.log('\n🎉 ALL SEEDING TASKS COMPLETED SUCCESSFULLY! 🎉');

  } catch (err) {
    console.error('\n❌ SEEDING ERROR:', err);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('MongoDB Disconnected.');
    }
  }
};

seedData();
