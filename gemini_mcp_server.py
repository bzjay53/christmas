#!/usr/bin/env python3
"""
Gemini MCP Server for Claude Code Integration
This server provides code review and validation capabilities using Gemini 2.5 Pro
"""

import asyncio
import json
import sys
from typing import Any, Dict, List, Optional
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import os
from datetime import datetime

class GeminiMCPServer:
    def __init__(self):
        self.name = "gemini-code-review"
        self.version = "1.0.0"
        self.api_key = os.getenv('GEMINI_API_KEY')
        
        if not self.api_key:
            print("Warning: GEMINI_API_KEY not found in environment variables", file=sys.stderr)
            return
            
        genai.configure(api_key=self.api_key)
        
        # Gemini 2.5 Pro 모델 초기화
        self.model = genai.GenerativeModel(
            model_name="gemini-2.5-pro",
            system_instruction="""
            당신은 코드 리뷰 전문가입니다. Claude Code에서 작성된 코드를 2차 검증하여 
            잠재적 버그, 성능 이슈, 보안 문제, 코드 품질을 검토합니다.
            
            검토 기준:
            1. 코드 정확성 및 논리적 오류
            2. 성능 최적화 가능성
            3. 보안 취약점
            4. 코드 스타일 및 가독성
            5. 에러 처리 및 예외 상황
            
            응답은 JSON 형식으로 제공하세요:
            {
                "status": "approved/warning/rejected",
                "confidence": 0.95,
                "issues": [
                    {"severity": "high/medium/low", "type": "bug/performance/security/style", "description": "문제 설명", "line": 10, "suggestion": "개선 제안"}
                ],
                "summary": "전반적인 검토 요약"
            }
            """
        )
        
        # 안전 설정
        self.safety_settings = {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }

    async def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """MCP 요청 처리"""
        try:
            method = request.get("method")
            params = request.get("params", {})
            
            if method == "tools/list":
                return self._list_tools()
            elif method == "tools/call":
                return await self._call_tool(params)
            elif method == "ping":
                return {"jsonrpc": "2.0", "result": "pong"}
            else:
                return self._error_response(f"Unknown method: {method}")
                
        except Exception as e:
            return self._error_response(str(e))

    def _list_tools(self) -> Dict[str, Any]:
        """사용 가능한 도구 목록 반환"""
        return {
            "jsonrpc": "2.0",
            "result": {
                "tools": [
                    {
                        "name": "gemini_code_review",
                        "description": "Gemini 2.5 Pro를 사용한 코드 리뷰 및 검증",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "code": {"type": "string", "description": "검토할 코드"},
                                "language": {"type": "string", "description": "프로그래밍 언어"},
                                "context": {"type": "string", "description": "코드 컨텍스트 정보"}
                            },
                            "required": ["code"]
                        }
                    },
                    {
                        "name": "gemini_complete_code",
                        "description": "Gemini를 사용한 코드 완성 및 제안",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "prompt": {"type": "string", "description": "코드 완성 프롬프트"},
                                "language": {"type": "string", "description": "프로그래밍 언어"}
                            },
                            "required": ["prompt"]
                        }
                    }
                ]
            }
        }

    async def _call_tool(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """도구 호출 처리"""
        tool_name = params.get("name")
        arguments = params.get("arguments", {})
        
        if tool_name == "gemini_code_review":
            return await self._review_code(arguments)
        elif tool_name == "gemini_complete_code":
            return await self._complete_code(arguments)
        else:
            return self._error_response(f"Unknown tool: {tool_name}")

    async def _review_code(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """코드 리뷰 실행"""
        if not self.api_key:
            return self._error_response("Gemini API key not configured")
            
        code = args.get("code", "")
        language = args.get("language", "python")
        context = args.get("context", "")
        
        prompt = f"""
        다음 {language} 코드를 검토해주세요:
        
        컨텍스트: {context}
        
        코드:
        ```{language}
        {code}
        ```
        
        JSON 형식으로 검토 결과를 제공해주세요.
        """
        
        try:
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt,
                safety_settings=self.safety_settings
            )
            
            review_result = response.text
            
            return {
                "jsonrpc": "2.0",
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": f"## Gemini 2.5 Pro 코드 리뷰 결과\n\n{review_result}\n\n검토 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                        }
                    ]
                }
            }
            
        except Exception as e:
            return self._error_response(f"Code review failed: {str(e)}")

    async def _complete_code(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """코드 완성 실행"""
        if not self.api_key:
            return self._error_response("Gemini API key not configured")
            
        prompt = args.get("prompt", "")
        language = args.get("language", "python")
        
        completion_prompt = f"""
        다음 {language} 코드 완성 요청에 대해 답변해주세요:
        
        {prompt}
        
        코드만 제공하고 설명은 간결하게 해주세요.
        """
        
        try:
            response = await asyncio.to_thread(
                self.model.generate_content,
                completion_prompt,
                safety_settings=self.safety_settings
            )
            
            completion_result = response.text
            
            return {
                "jsonrpc": "2.0",
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": f"## Gemini 2.5 Pro 코드 완성\n\n{completion_result}"
                        }
                    ]
                }
            }
            
        except Exception as e:
            return self._error_response(f"Code completion failed: {str(e)}")

    def _error_response(self, message: str) -> Dict[str, Any]:
        """에러 응답 생성"""
        return {
            "jsonrpc": "2.0",
            "error": {
                "code": -32000,
                "message": message
            }
        }

async def main():
    """MCP 서버 실행"""
    server = GeminiMCPServer()
    
    # stdin/stdout을 통한 JSON-RPC 통신
    while True:
        try:
            line = await asyncio.to_thread(sys.stdin.readline)
            if not line:
                break
                
            request = json.loads(line.strip())
            response = await server.handle_request(request)
            
            print(json.dumps(response), flush=True)
            
        except json.JSONDecodeError:
            error_response = server._error_response("Invalid JSON")
            print(json.dumps(error_response), flush=True)
        except Exception as e:
            error_response = server._error_response(str(e))
            print(json.dumps(error_response), flush=True)

if __name__ == "__main__":
    asyncio.run(main())