#!/usr/bin/env python3
"""
Christmas Trading Memory Bank MCP Integration
Project memory management and context preservation system
"""

import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
import sqlite3
from pathlib import Path
import hashlib

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("memory-bank-mcp")

@dataclass
class MemoryEntry:
    """메모리 엔트리 데이터 클래스"""
    id: str
    category: str  # technical, decision, issue, solution, context
    title: str
    content: str
    tags: List[str]
    importance: int  # 1-10
    created_at: str
    updated_at: str
    related_files: List[str] = None
    related_commits: List[str] = None
    status: str = "active"  # active, archived, deprecated
    
    def __post_init__(self):
        if self.related_files is None:
            self.related_files = []
        if self.related_commits is None:
            self.related_commits = []

class MemoryBankMCP:
    """Christmas Trading을 위한 Memory Bank MCP 시스템"""
    
    def __init__(self, db_path: str = "/root/dev/christmas-trading/.memory-bank.db"):
        self.db_path = db_path
        self.init_database()
        
    def init_database(self):
        """SQLite 데이터베이스 초기화"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS memories (
                    id TEXT PRIMARY KEY,
                    category TEXT NOT NULL,
                    title TEXT NOT NULL,
                    content TEXT,
                    tags TEXT,
                    importance INTEGER DEFAULT 5,
                    created_at TEXT,
                    updated_at TEXT,
                    related_files TEXT,
                    related_commits TEXT,
                    status TEXT DEFAULT 'active'
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS memory_relationships (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    memory_id TEXT,
                    related_memory_id TEXT,
                    relationship_type TEXT,
                    created_at TEXT,
                    FOREIGN KEY (memory_id) REFERENCES memories (id),
                    FOREIGN KEY (related_memory_id) REFERENCES memories (id)
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS project_context (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    context_key TEXT UNIQUE,
                    context_value TEXT,
                    updated_at TEXT
                )
            """)
            
            conn.commit()
    
    def add_memory(self, memory: MemoryEntry) -> bool:
        """새 메모리 추가"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO memories 
                    (id, category, title, content, tags, importance, created_at, updated_at,
                     related_files, related_commits, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    memory.id, memory.category, memory.title, memory.content,
                    json.dumps(memory.tags), memory.importance,
                    memory.created_at, memory.updated_at,
                    json.dumps(memory.related_files), json.dumps(memory.related_commits),
                    memory.status
                ))
                
                conn.commit()
                logger.info(f"Memory added: {memory.id} - {memory.title}")
                return True
                
        except Exception as e:
            logger.error(f"Error adding memory: {e}")
            return False
    
    def get_memories_by_category(self, category: str) -> List[Dict]:
        """카테고리별 메모리 조회"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                
                cursor = conn.execute("""
                    SELECT * FROM memories 
                    WHERE category = ? AND status = 'active'
                    ORDER BY importance DESC, updated_at DESC
                """, (category,))
                
                memories = []
                for row in cursor.fetchall():
                    memory_dict = dict(row)
                    memory_dict['tags'] = json.loads(memory_dict['tags']) if memory_dict['tags'] else []
                    memory_dict['related_files'] = json.loads(memory_dict['related_files']) if memory_dict['related_files'] else []
                    memory_dict['related_commits'] = json.loads(memory_dict['related_commits']) if memory_dict['related_commits'] else []
                    memories.append(memory_dict)
                
                return memories
                
        except Exception as e:
            logger.error(f"Error getting memories: {e}")
            return []
    
    def search_memories(self, query: str, category: str = None) -> List[Dict]:
        """메모리 검색"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                
                if category:
                    cursor = conn.execute("""
                        SELECT * FROM memories 
                        WHERE (title LIKE ? OR content LIKE ? OR tags LIKE ?)
                        AND category = ? AND status = 'active'
                        ORDER BY importance DESC, updated_at DESC
                    """, (f"%{query}%", f"%{query}%", f"%{query}%", category))
                else:
                    cursor = conn.execute("""
                        SELECT * FROM memories 
                        WHERE (title LIKE ? OR content LIKE ? OR tags LIKE ?)
                        AND status = 'active'
                        ORDER BY importance DESC, updated_at DESC
                    """, (f"%{query}%", f"%{query}%", f"%{query}%"))
                
                memories = []
                for row in cursor.fetchall():
                    memory_dict = dict(row)
                    memory_dict['tags'] = json.loads(memory_dict['tags']) if memory_dict['tags'] else []
                    memory_dict['related_files'] = json.loads(memory_dict['related_files']) if memory_dict['related_files'] else []
                    memory_dict['related_commits'] = json.loads(memory_dict['related_commits']) if memory_dict['related_commits'] else []
                    memories.append(memory_dict)
                
                return memories
                
        except Exception as e:
            logger.error(f"Error searching memories: {e}")
            return []
    
    def update_project_context(self, context_key: str, context_value: Any) -> bool:
        """프로젝트 컨텍스트 업데이트"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO project_context 
                    (context_key, context_value, updated_at)
                    VALUES (?, ?, ?)
                """, (context_key, json.dumps(context_value), datetime.now().isoformat()))
                
                conn.commit()
                logger.info(f"Project context updated: {context_key}")
                return True
                
        except Exception as e:
            logger.error(f"Error updating project context: {e}")
            return False
    
    def get_project_context(self, context_key: str = None) -> Dict:
        """프로젝트 컨텍스트 조회"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                
                if context_key:
                    cursor = conn.execute("""
                        SELECT * FROM project_context WHERE context_key = ?
                    """, (context_key,))
                    row = cursor.fetchone()
                    if row:
                        return {
                            row['context_key']: json.loads(row['context_value']),
                            'updated_at': row['updated_at']
                        }
                    return {}
                else:
                    cursor = conn.execute("SELECT * FROM project_context ORDER BY updated_at DESC")
                    context = {}
                    for row in cursor.fetchall():
                        context[row['context_key']] = {
                            'value': json.loads(row['context_value']),
                            'updated_at': row['updated_at']
                        }
                    return context
                
        except Exception as e:
            logger.error(f"Error getting project context: {e}")
            return {}
    
    def get_memory_summary(self) -> Dict:
        """메모리 은행 요약 정보"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                
                # 카테고리별 메모리 수
                cursor = conn.execute("""
                    SELECT category, COUNT(*) as count 
                    FROM memories 
                    WHERE status = 'active'
                    GROUP BY category
                """)
                category_counts = {row['category']: row['count'] for row in cursor.fetchall()}
                
                # 중요도별 메모리 수
                cursor = conn.execute("""
                    SELECT 
                        CASE 
                            WHEN importance >= 8 THEN 'critical'
                            WHEN importance >= 6 THEN 'high'
                            WHEN importance >= 4 THEN 'medium'
                            ELSE 'low'
                        END as importance_level,
                        COUNT(*) as count
                    FROM memories 
                    WHERE status = 'active'
                    GROUP BY importance_level
                """)
                importance_counts = {row['importance_level']: row['count'] for row in cursor.fetchall()}
                
                # 최근 업데이트된 메모리
                cursor = conn.execute("""
                    SELECT title, category, updated_at 
                    FROM memories 
                    WHERE status = 'active'
                    ORDER BY updated_at DESC 
                    LIMIT 5
                """)
                recent_memories = [dict(row) for row in cursor.fetchall()]
                
                # 프로젝트 컨텍스트 수
                cursor = conn.execute("SELECT COUNT(*) as count FROM project_context")
                context_count = cursor.fetchone()['count']
                
                return {
                    "total_memories": sum(category_counts.values()),
                    "category_breakdown": category_counts,
                    "importance_breakdown": importance_counts,
                    "recent_memories": recent_memories,
                    "project_contexts": context_count,
                    "last_updated": datetime.now().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Error getting memory summary: {e}")
            return {}
    
    def generate_context_report(self) -> Dict:
        """컨텍스트 보고서 생성"""
        try:
            # 기술적 결정사항
            technical_decisions = self.get_memories_by_category("decision")
            
            # 중요한 이슈들
            important_issues = self.search_memories("", None)
            important_issues = [m for m in important_issues if m['importance'] >= 7]
            
            # 프로젝트 컨텍스트
            project_context = self.get_project_context()
            
            # 최근 활동
            recent_activities = self.get_memories_by_category("context")[:10]
            
            return {
                "technical_decisions_count": len(technical_decisions),
                "high_importance_memories": len(important_issues),
                "project_contexts": len(project_context),
                "recent_activities": recent_activities,
                "key_decisions": technical_decisions[:5],
                "critical_memories": important_issues[:5],
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating context report: {e}")
            return {}

def generate_memory_id(title: str, category: str) -> str:
    """메모리 ID 생성"""
    content = f"{category}:{title}:{datetime.now().isoformat()}"
    return hashlib.md5(content.encode()).hexdigest()[:12]

def setup_initial_memories():
    """초기 메모리들 설정"""
    memory_bank = MemoryBankMCP()
    
    # 기본 메모리들 생성
    initial_memories = [
        MemoryEntry(
            id=generate_memory_id("Phase 3 UI Complete", "technical"),
            category="technical",
            title="Phase 3 UI 완료 - frontend.png 100% 구현",
            content="frontend.png 디자인을 100% 구현 완료. Binance Dashboard v1 인터페이스, 한국어 텍스트 (총 포트폴리오 가치, AI 자동 거래, 실시간 차트), 인기 코인 TOP 10 테이블, 시장 인덱스 섹션 모두 구현됨. Vercel 배포 최적화와 번들 분할 완료.",
            tags=["ui", "frontend", "phase3", "completion", "binance"],
            importance=9,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            related_files=["src/App.tsx", "vercel.json", "vite.config.ts"],
            status="active"
        ),
        MemoryEntry(
            id=generate_memory_id("Vercel Deployment Optimization", "technical"),
            category="technical",
            title="Vercel 배포 최적화 및 번들 분할",
            content="SPA 라우팅 지원을 위한 rewrites 설정, manual chunks를 통한 번들 분할 (vendor, charts, icons, crypto), buildCommand 최적화. 성능 향상을 위해 66KB + 314KB + 324KB로 번들 분할됨.",
            tags=["vercel", "deployment", "optimization", "bundle-splitting"],
            importance=8,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            related_files=["vercel.json", "vite.config.ts"],
            status="active"
        ),
        MemoryEntry(
            id=generate_memory_id("Binance API Integration", "technical"),
            category="technical",
            title="바이낸스 API 완전 연동 완료",
            content="binanceAPI.ts 모듈 700줄 완전 구현. HMAC SHA256 인증, WebSocket 실시간 데이터, Rate Limiting, Private API 연동으로 실제 USDT, C98 보유 자산 확인. BTCUSDT, ETHUSDT, BNBUSDT, ADAUSDT, SOLUSDT 실시간 스트리밍.",
            tags=["binance", "api", "websocket", "crypto", "authentication"],
            importance=10,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            related_files=["src/lib/binanceAPI.ts", ".env.example"],
            status="active"
        ),
        MemoryEntry(
            id=generate_memory_id("User Feedback System", "decision"),
            category="decision",
            title="사용자 피드백 시스템적 반영 결정",
            content="사용자가 강조한 '업무의 중요도와 순서에 맞게 과정을 차근차근 진행', 'Gemini MCP와 협업하여 신중하고 확실한 방법으로 진행', '참조 문서를 보고 문서들을 잘 확인하고 작성하며 업데이트' 원칙을 프로젝트 전반에 적용하기로 결정.",
            tags=["user-feedback", "methodology", "systematic-approach"],
            importance=9,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            status="active"
        ),
        MemoryEntry(
            id=generate_memory_id("MCP Integration Strategy", "context"),
            category="context",
            title="MCP 통합 전략 - Task Master & Memory Bank",
            content="Gemini MCP와 협업하여 Task Master MCP로 체계적 작업 관리, Memory Bank MCP로 프로젝트 메모리 관리를 구축. 문서 최신화와 함께 지속적인 컨텍스트 보존이 목표.",
            tags=["mcp", "integration", "task-management", "memory-management"],
            importance=8,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            related_files=["gemini_mcp_server.py", "mcp-config.json"],
            status="active"
        )
    ]
    
    for memory in initial_memories:
        memory_bank.add_memory(memory)
    
    # 프로젝트 컨텍스트 설정
    memory_bank.update_project_context("current_phase", "Phase 3 완료 - UI 100% 구현")
    memory_bank.update_project_context("deployment_status", "Production Ready - Vercel 배포 완료")
    memory_bank.update_project_context("binance_integration", "100% 완료 - Private API 연동")
    memory_bank.update_project_context("mcp_status", "진행 중 - Task Master & Memory Bank 통합")
    memory_bank.update_project_context("user_feedback_integration", "체계적 접근 방식 적용")
    
    logger.info("Initial memories and project context created successfully")
    return memory_bank

if __name__ == "__main__":
    # Memory Bank 초기화 및 설정
    memory_bank = setup_initial_memories()
    
    # 메모리 은행 요약 출력
    summary = memory_bank.get_memory_summary()
    print("=== Memory Bank Summary ===")
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    
    # 컨텍스트 보고서 생성
    context_report = memory_bank.generate_context_report()
    print("\n=== Context Report ===")
    print(json.dumps(context_report, indent=2, ensure_ascii=False))