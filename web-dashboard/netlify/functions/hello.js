exports.handler = async (event, context) => {
  // 로그를 남기는 시도조차 하지 않고 즉시 반환
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Super simple hello success!" }),
  };
}; 