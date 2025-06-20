#!/usr/bin/env python3
"""
통합 MCP 서버 - Christmas Trading Project
Gemini 코드 리뷰 + 사용량 모니터링 통합 서버

기능:
1. Gemini 2.5 Pro 코드 리뷰 및 검증
2. 실시간 사용량 모니터링 및 알림
3. 통합 대시보드 및 리포팅
4. Supabase → Firebase 마이그레이션 지원
"""

import asyncio
import json
import sys
import os
from typing import Any, Dict, List, Optional
from datetime import datetime
import logging

# 개별 MCP 서버들 import
try:
    import google.generativeai as genai
    from google.generativeai.types import HarmCategory, HarmBlockThreshold
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("Warning: Gemini API not available. Install google-generativeai package.", file=sys.stderr)

from christmas_usage_monitor import ChristmasUsageMonitor

class IntegratedMCPServer:
    def __init__(self):
        self.name = "christmas-integrated-mcp"
        self.version = "1.0.0"
        
        # 서브 시스템 초기화
        self.usage_monitor = ChristmasUsageMonitor()
        self.gemini_available = GEMINI_AVAILABLE
        
        if self.gemini_available:
            self._init_gemini()
        
        self.setup_logging()
        
        # 통합 도구 상태
        self.active_tools = {
            "gemini_review": self.gemini_available,
            "usage_monitoring": True,
            "migration_support": True,
            "dashboard": True
        }

    def _init_gemini(self):
        """Gemini 초기화"""
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')
        
        if not self.gemini_api_key:
            print("Warning: GEMINI_API_KEY not found", file=sys.stderr)
            self.gemini_available = False
            return
            
        genai.configure(api_key=self.gemini_api_key)
        
        self.gemini_model = genai.GenerativeModel(
            model_name="gemini-2.5-pro",
            system_instruction="""
            당신은 크리스마스 트레이딩 프로젝트의 전문 코드 리뷰어입니다.
            
            검토 우선순위:
            1. Supabase → Firebase 마이그레이션 관련 코드
            2. AI 매매 시스템 보안 및 정확성
            3. KIS API 연동 안정성
            4. 실시간 모니터링 성능
            5. 텔레그램 알림 시스템 신뢰성
            
            응답 형식:
            {
                "status": "approved/warning/rejected",
                "confidence": 0.95,
                "migration_compatibility": "compatible/needs_changes/incompatible",
                "trading_safety": "safe/caution/unsafe",
                "issues": [
                    {
                        "severity": "high/medium/low",
                        "category": "migration/trading/security/performance",
                        "description": "상세 설명",
                        "suggestion": "개선 방안",
                        "line": 10
                    }
                ],
                "summary": "종합 평가"
            }
            """
        )
        
        self.safety_settings = {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }

    def setup_logging(self):
        """로깅 설정"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('/root/dev/christmas-trading/logs/integrated_mcp.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

    async def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """통합 MCP 요청 처리"""
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
            self.logger.error(f"Request handling error: {e}")
            return self._error_response(str(e))

    def _list_tools(self) -> Dict[str, Any]:
        """통합 도구 목록"""
        tools = []
        
        # Gemini 코드 리뷰 도구
        if self.active_tools["gemini_review"]:
            tools.extend([
                {
                    "name": "gemini_code_review",
                    "description": "Gemini 2.5 Pro 코드 리뷰 (크리스마스 트레이딩 특화)",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "code": {"type": "string", "description": "검토할 코드"},
                            "language": {"type": "string", "description": "프로그래밍 언어"},
                            "context": {"type": "string", "description": "코드 컨텍스트"},
                            "migration_focus": {"type": "boolean", "description": "마이그레이션 관련 검토 여부"}
                        },
                        "required": ["code"]
                    }
                },
                {
                    "name": "gemini_migration_analysis",
                    "description": "Supabase → Firebase 마이그레이션 분석",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "supabase_code": {"type": "string", "description": "Supabase 코드"},
                            "target_firebase": {"type": "boolean", "description": "Firebase 타겟 여부"}
                        },
                        "required": ["supabase_code"]
                    }
                }
            ])
        
        # 사용량 모니터링 도구
        if self.active_tools["usage_monitoring"]:
            tools.extend([
                {
                    "name": "usage_dashboard",
                    "description": "통합 사용량 대시보드",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "detailed": {"type": "boolean", "description": "상세 정보 포함 여부"}
                        }
                    }
                },
                {
                    "name": "track_api_usage",
                    "description": "API 사용량 추적",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "service": {"type": "string", "description": "서비스명 (openai/gemini/kis_api)"},
                            "operation": {"type": "string", "description": "작업 유형"},
                            "tokens_used": {"type": "number", "description": "사용된 토큰 수"},
                            "cost": {"type": "number", "description": "비용"}
                        },
                        "required": ["service", "operation"]
                    }
                }
            ])
        
        # 마이그레이션 지원 도구
        if self.active_tools["migration_support"]:
            tools.append({
                "name": "migration_planning",
                "description": "Supabase → Firebase 마이그레이션 계획 수립",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "current_schema": {"type": "string", "description": "현재 Supabase 스키마"},
                        "target_structure": {"type": "string", "description": "목표 Firebase 구조"}
                    }
                }
            })
        
        # 통합 대시보드
        if self.active_tools["dashboard"]:
            tools.append({
                "name": "integrated_status",
                "description": "프로젝트 전체 상태 및 진행률",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "include_alerts": {"type": "boolean", "description": "알림 포함 여부"}
                    }
                }
            })
        
        return {
            "jsonrpc": "2.0",
            "result": {"tools": tools}
        }

    async def _call_tool(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """통합 도구 호출"""
        tool_name = params.get("name")
        arguments = params.get("arguments", {})
        
        # 사용량 추적
        await self.usage_monitor.track_usage("integrated_mcp", "tool_call", 1.0, {
            "tool": tool_name,
            "timestamp": datetime.now().isoformat()
        })
        
        # Gemini 도구들
        if tool_name == "gemini_code_review":
            return await self._gemini_code_review(arguments)
        elif tool_name == "gemini_migration_analysis":
            return await self._gemini_migration_analysis(arguments)
        
        # 모니터링 도구들
        elif tool_name == "usage_dashboard":
            return await self._usage_dashboard(arguments)
        elif tool_name == "track_api_usage":
            return await self._track_api_usage(arguments)
        
        # 마이그레이션 도구
        elif tool_name == "migration_planning":
            return await self._migration_planning(arguments)
        
        # 통합 상태
        elif tool_name == "integrated_status":
            return await self._integrated_status(arguments)
        
        else:
            return self._error_response(f"Unknown tool: {tool_name}")

    async def _gemini_code_review(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Gemini 코드 리뷰"""
        if not self.gemini_available:
            return self._error_response("Gemini API not available")
            
        code = args.get("code", "")
        language = args.get("language", "python")
        context = args.get("context", "")
        migration_focus = args.get("migration_focus", False)
        
        # 사용량 추적
        await self.usage_monitor.track_usage("gemini", "api_call", 1.0)
        await self.usage_monitor.track_usage("gemini", "token_usage", len(code) / 4)  # 대략적인 토큰 계산
        
        prompt = f"""
        크리스마스 트레이딩 프로젝트 코드 검토:
        
        언어: {language}
        컨텍스트: {context}
        마이그레이션 중점 검토: {'예' if migration_focus else '아니오'}
        
        코드:
        ```{language}
        {code}
        ```
        
        특별 검토 사항:
        1. 트레이딩 시스템 안전성
        2. API 사용량 최적화
        3. 데이터베이스 마이그레이션 호환성
        4. 실시간 모니터링 성능
        
        JSON 형식으로 결과를 제공해주세요.
        """
        
        try:
            response = await asyncio.to_thread(
                self.gemini_model.generate_content,
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
                            "text": f"## 🤖 Gemini 2.5 Pro - Christmas Trading 코드 리뷰\n\n{review_result}\n\n**검토 시간**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n**마이그레이션 중점**: {'✅' if migration_focus else '❌'}"
                        }
                    ]
                }
            }
            
        except Exception as e:
            self.logger.error(f"Gemini code review error: {e}")
            return self._error_response(f"Code review failed: {str(e)}")

    async def _gemini_migration_analysis(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """마이그레이션 분석"""
        if not self.gemini_available:
            return self._error_response("Gemini API not available")
            
        supabase_code = args.get("supabase_code", "")
        
        prompt = f"""
        Supabase → Firebase 마이그레이션 분석:
        
        현재 Supabase 코드:
        ```python
        {supabase_code}
        ```
        
        다음 사항을 분석해주세요:
        1. Firebase로 변환 가능성
        2. 필요한 코드 변경사항
        3. 데이터 구조 변경 필요성
        4. 잠재적 문제점 및 해결방안
        5. 마이그레이션 우선순위
        
        Firebase 등가 코드도 제안해주세요.
        """
        
        try:
            response = await asyncio.to_thread(
                self.gemini_model.generate_content,
                prompt,
                safety_settings=self.safety_settings
            )
            
            analysis_result = response.text
            
            return {
                "jsonrpc": "2.0",
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": f"## 🔄 Supabase → Firebase 마이그레이션 분석\n\n{analysis_result}\n\n**분석 시간**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                        }
                    ]
                }
            }
            
        except Exception as e:
            return self._error_response(f"Migration analysis failed: {str(e)}")

    async def _usage_dashboard(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """사용량 대시보드"""
        detailed = args.get("detailed", False)
        
        try:
            dashboard_data = await self.usage_monitor.get_usage_dashboard()
            
            # 요약 정보 생성
            summary = {
                "total_services": len(dashboard_data["services"]),
                "active_services": len([s for s in dashboard_data["services"].values() if s["status"] == "active"]),
                "recent_alerts": len(dashboard_data["recent_alerts"]),
                "system_health": "healthy" if dashboard_data["system_resources"]["cpu_usage"] < 80 else "warning"
            }
            
            if detailed:
                content_text = f"""## 📊 Christmas Trading - 상세 사용량 대시보드

### 🎯 프로젝트 상태 요약
- **전체 서비스**: {summary['total_services']}개
- **활성 서비스**: {summary['active_services']}개  
- **최근 알림**: {summary['recent_alerts']}건
- **시스템 상태**: {summary['system_health']}

### 💻 시스템 리소스
- **CPU 사용률**: {dashboard_data['system_resources']['cpu_usage']:.1f}%
- **메모리 사용률**: {dashboard_data['system_resources']['memory_usage']:.1f}%
- **디스크 사용률**: {dashboard_data['system_resources']['disk_usage']:.1f}%

### 🔧 서비스별 상태
"""
                for service_name, service_data in dashboard_data["services"].items():
                    status_emoji = "🟢" if service_data["status"] == "active" else "🔴"
                    content_text += f"- **{service_name}**: {status_emoji} {service_data['status']}\n"
                
                content_text += f"\n### 📈 상세 데이터\n```json\n{json.dumps(dashboard_data, indent=2, default=str)}\n```"
            else:
                content_text = f"""## 📊 Christmas Trading - 사용량 요약

**🎯 상태**: {summary['active_services']}/{summary['total_services']} 서비스 활성
**💻 시스템**: CPU {dashboard_data['system_resources']['cpu_usage']:.0f}% | 메모리 {dashboard_data['system_resources']['memory_usage']:.0f}%
**🚨 알림**: {summary['recent_alerts']}건
**⏰ 업데이트**: {datetime.now().strftime('%H:%M:%S')}"""
            
            return {
                "jsonrpc": "2.0",
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": content_text
                        }
                    ]
                }
            }
            
        except Exception as e:
            return self._error_response(f"Dashboard generation failed: {str(e)}")

    async def _track_api_usage(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """API 사용량 추적"""
        service = args.get("service")
        operation = args.get("operation")
        tokens_used = args.get("tokens_used", 0)
        cost = args.get("cost", 0)
        
        try:
            # 메타데이터 구성
            metadata = {
                "operation": operation,
                "tokens": tokens_used,
                "cost": cost,
                "timestamp": datetime.now().isoformat()
            }
            
            # 사용량 추적
            await self.usage_monitor.track_usage(service, "api_call", 1.0, metadata)
            
            if tokens_used > 0:
                await self.usage_monitor.track_usage(service, "token_usage", tokens_used, metadata)
            
            if cost > 0:
                await self.usage_monitor.track_usage(service, "cost", cost, metadata)
            
            return {
                "jsonrpc": "2.0",
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": f"✅ **API 사용량 추적 완료**\n\n- **서비스**: {service}\n- **작업**: {operation}\n- **토큰**: {tokens_used:,}개\n- **비용**: ${cost:.4f}\n- **시간**: {datetime.now().strftime('%H:%M:%S')}"
                        }
                    ]
                }
            }
            
        except Exception as e:
            return self._error_response(f"Usage tracking failed: {str(e)}")

    async def _migration_planning(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """마이그레이션 계획"""
        current_schema = args.get("current_schema", "")
        target_structure = args.get("target_structure", "")
        
        # 마이그레이션 체크리스트 생성
        migration_plan = f"""## 🔄 Supabase → Firebase 마이그레이션 계획

### 📋 현재 상태 분석
- **Supabase 프로젝트**: qehzzsxzjijfzqkysazc.supabase.co
- **주요 테이블**: users, trading_orders, coupons, referral_codes
- **RLS 정책**: 활성화
- **인증 시스템**: JWT 기반

### 🎯 Firebase 마이그레이션 계획

#### Phase 1: 준비 (1-2일)
- [ ] Firebase 프로젝트 생성
- [ ] 서비스 계정 설정
- [ ] 환경변수 준비

#### Phase 2: 스키마 변환 (2-3일)
- [ ] SQL → NoSQL 스키마 설계
- [ ] Security Rules 작성
- [ ] 데이터 이전 도구 개발

#### Phase 3: 코드 리팩토링 (3-4일)
- [ ] 백엔드 API 변경
- [ ] 인증 시스템 변경
- [ ] 프론트엔드 연동

#### Phase 4: 데이터 이전 (1-2일)
- [ ] 백업 생성
- [ ] 테스트 데이터 이전
- [ ] 운영 데이터 이전

### ⚠️ 리스크 및 대응방안
1. **데이터 손실 위험**: 완전 백업 필수
2. **다운타임**: 점진적 마이그레이션
3. **비용 증가**: 사용량 모니터링 강화

### 📊 예상 일정: 7-10일
"""
        
        return {
            "jsonrpc": "2.0",
            "result": {
                "content": [
                    {
                        "type": "text",
                        "text": migration_plan
                    }
                ]
            }
        }

    async def _integrated_status(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """통합 상태 조회"""
        include_alerts = args.get("include_alerts", True)
        
        try:
            # 전체 시스템 상태 수집
            dashboard_data = await self.usage_monitor.get_usage_dashboard()
            
            # 프로젝트 진행률 계산
            completed_features = [
                "Docker 환경 설정",
                "KIS API 기본 연동", 
                "텔레그램 봇 기본 구조",
                "AI 서비스 기본 구조",
                "Supabase 데이터베이스 설정",
                "통합 모니터링 시스템"
            ]
            
            total_features = completed_features + [
                "Firebase 마이그레이션",
                "AI 매매 시스템 완성",
                "실시간 모니터링 대시보드",
                "완전한 테스트 시스템"
            ]
            
            progress_percentage = (len(completed_features) / len(total_features)) * 100
            
            status_text = f"""## 🎄 Christmas Trading 프로젝트 통합 상태

### 📈 전체 진행률: {progress_percentage:.0f}%
```
{"█" * int(progress_percentage/5)}{"░" * (20-int(progress_percentage/5))} {progress_percentage:.0f}%
```

### ✅ 완료된 기능 ({len(completed_features)}개)
"""
            for feature in completed_features:
                status_text += f"- ✅ {feature}\n"
            
            status_text += f"\n### 🔄 진행 중인 작업\n- 🔄 Supabase → Firebase 마이그레이션 계획\n- 🔄 Gemini MCP 통합 검증\n- 🔄 사용량 모니터링 고도화\n"
            
            status_text += f"\n### 💻 시스템 상태\n"
            status_text += f"- **CPU**: {dashboard_data['system_resources']['cpu_usage']:.1f}%\n"
            status_text += f"- **메모리**: {dashboard_data['system_resources']['memory_usage']:.1f}%\n"
            status_text += f"- **활성 서비스**: {len([s for s in dashboard_data['services'].values() if s['status'] == 'active'])}/{len(dashboard_data['services'])}\n"
            
            if include_alerts and dashboard_data['recent_alerts']:
                status_text += f"\n### 🚨 최근 알림 ({len(dashboard_data['recent_alerts'])}건)\n"
                for alert in dashboard_data['recent_alerts'][:3]:
                    status_text += f"- {alert['type'].upper()}: {alert['service']} ({alert['timestamp'][:16]})\n"
            
            status_text += f"\n**⏰ 업데이트**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            
            return {
                "jsonrpc": "2.0",
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": status_text
                        }
                    ]
                }
            }
            
        except Exception as e:
            return self._error_response(f"Status generation failed: {str(e)}")

    def _error_response(self, message: str) -> Dict[str, Any]:
        """에러 응답 생성"""
        return {
            "jsonrpc": "2.0",
            "error": {
                "code": -32000,
                "message": message
            }
        }

    async def start_integrated_monitoring(self):
        """통합 모니터링 시작"""
        self.logger.info("Starting integrated Christmas Trading MCP server...")
        
        # 백그라운드 모니터링 작업 시작
        monitoring_task = asyncio.create_task(
            self.usage_monitor.start_monitoring(interval=30)
        )
        
        # 상태 정보 출력
        print(f"🎄 Christmas Trading Integrated MCP Server v{self.version}", file=sys.stderr)
        print(f"✅ Active tools: {sum(self.active_tools.values())}/{len(self.active_tools)}", file=sys.stderr)
        print(f"🤖 Gemini available: {'Yes' if self.gemini_available else 'No'}", file=sys.stderr)
        print(f"📊 Monitoring active: Yes", file=sys.stderr)
        print("Ready for requests...", file=sys.stderr)
        
        return monitoring_task

async def main():
    """메인 함수"""
    server = IntegratedMCPServer()
    
    # 통합 모니터링 시작
    monitoring_task = await server.start_integrated_monitoring()
    
    # MCP 서버 실행
    try:
        while True:
            line = await asyncio.to_thread(sys.stdin.readline)
            if not line:
                break
                
            request = json.loads(line.strip())
            response = await server.handle_request(request)
            
            print(json.dumps(response), flush=True)
            
    except KeyboardInterrupt:
        print("Shutting down server...", file=sys.stderr)
    except json.JSONDecodeError:
        error_response = server._error_response("Invalid JSON")
        print(json.dumps(error_response), flush=True)
    except Exception as e:
        error_response = server._error_response(str(e))
        print(json.dumps(error_response), flush=True)
    finally:
        monitoring_task.cancel()

if __name__ == "__main__":
    asyncio.run(main())