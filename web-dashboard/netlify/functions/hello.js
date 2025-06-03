exports.handler = async (event, context) => {
  console.log("Hello function invoked!", { eventPath: event.path, eventQuery: event.queryStringParameters });
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Hello from the test function!", path: event.path, query: event.queryStringParameters }),
  };
}; 