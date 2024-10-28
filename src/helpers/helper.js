const successResponse = (res, data, message = "Success", statusCode = 200) => {
  res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
};

const errorResponse = (res, message = "Error", statusCode = 500, error = null) => {
  let json = {
    status: 'error',
    message,
  };
  if (error) {
    json.error = error
  }
  res.status(statusCode).json(json);
};

module.exports = {
  successResponse,
  errorResponse
};