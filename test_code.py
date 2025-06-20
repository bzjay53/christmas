def calculate_average(numbers):
    if not numbers:
        return 0
    
    total = 0
    for i in range(len(numbers)):
        total += numbers[i]
    return total / len(numbers)

def process_data(data):
    result = []
    for item in data:
        if item > 0:
            result.append(item * 2)
    return result

# 테스트 코드
numbers = [1, 2, 3, 4, 5]
average = calculate_average(numbers)
print(f"평균: {average}")

data = [1, -2, 3, -4, 5]
processed = process_data(data)
print(f"처리된 데이터: {processed}")