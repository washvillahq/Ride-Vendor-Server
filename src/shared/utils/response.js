const responseHelper = (res, statusCode, message, data = null) => {
  const isError = statusCode >= 400;
  
  const responseData = {
    status: isError ? 'error' : 'success',
    message,
    data,
  };

  // Remove data field if it is null (especially for errors or deletes)
  if (data === null) {
    delete responseData.data;
  }

  return res.status(statusCode).json(responseData);
};

module.exports = responseHelper;
