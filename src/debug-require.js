try {
  console.log('Loading constants...');
  require('./shared/constants');
  console.log('Loading app error...');
  require('./shared/utils/appError');
  console.log('Loading auth middleware...');
  require('./shared/middlewares/auth');
  console.log('Loading booking validator...');
  require('./modules/booking/booking.validator');
  console.log('Loading car validator...');
  require('./modules/car/car.validator');
  console.log('Loading user validator...');
  require('./modules/user/user.validator');
  console.log('Loading admin route...');
  require('./modules/admin/admin.route');
  console.log('All loaded successfully!');
} catch (err) {
  console.error('FAILED TO LOAD:', err.message);
  console.error(err.stack);
}
