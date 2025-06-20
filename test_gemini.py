#\!/usr/bin/env python3
import os
import google.generativeai as genai

print("=== Gemini API 설정 상태 확인 ===")

# API 키 확인
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("❌ GEMINI_API_KEY가 설정되지 않았습니다.")
    print("환경변수 또는 .env 파일에 GEMINI_API_KEY를 설정해주세요.")
    exit(1)

print(f"✅ API 키 발견: {api_key[:10]}...")

# Gemini 설정 테스트
try:
    genai.configure(api_key=api_key)
    print("✅ Gemini API 설정 완료")
    
    # 간단한 모델 테스트
    model = genai.GenerativeModel("gemini-2.5-pro")
    response = model.generate_content("Hello, say hi back\!")
    print(f"✅ API 호출 성공: {response.text[:50]}...")
    
except Exception as e:
    print(f"❌ API 호출 실패: {e}")
