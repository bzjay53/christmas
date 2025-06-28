#!/usr/bin/env python3
"""
Christmas Trading Task Master MCP Integration
Systematic task management and progress tracking system
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
import sqlite3
from pathlib import Path

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("task-master-mcp")

@dataclass
class Task:
    """작업 데이터 클래스"""
    id: str
    title: str
    description: str
    status: str  # pending, in_progress, completed, blocked
    priority: str  # low, medium, high, critical
    created_at: str
    updated_at: str
    due_date: Optional[str] = None
    assigned_to: Optional[str] = "Claude"
    tags: List[str] = None
    dependencies: List[str] = None
    progress: int = 0
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = []
        if self.dependencies is None:
            self.dependencies = []

class TaskMasterMCP:
    """Christmas Trading을 위한 Task Master MCP 시스템"""
    
    def __init__(self, db_path: str = "/root/dev/christmas-trading/.task-master.db"):
        self.db_path = db_path
        self.init_database()
        
    def init_database(self):
        """SQLite 데이터베이스 초기화"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT,
                    status TEXT DEFAULT 'pending',
                    priority TEXT DEFAULT 'medium',
                    created_at TEXT,
                    updated_at TEXT,
                    due_date TEXT,
                    assigned_to TEXT DEFAULT 'Claude',
                    tags TEXT,
                    dependencies TEXT,
                    progress INTEGER DEFAULT 0
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS task_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    task_id TEXT,
                    action TEXT,
                    details TEXT,
                    timestamp TEXT,
                    FOREIGN KEY (task_id) REFERENCES tasks (id)
                )
            """)
            
            conn.commit()
    
    def create_task(self, task: Task) -> bool:
        """새 작업 생성"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT INTO tasks 
                    (id, title, description, status, priority, created_at, updated_at, 
                     due_date, assigned_to, tags, dependencies, progress)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    task.id, task.title, task.description, task.status, task.priority,
                    task.created_at, task.updated_at, task.due_date, task.assigned_to,
                    json.dumps(task.tags), json.dumps(task.dependencies), task.progress
                ))
                
                # 히스토리 기록
                self.add_task_history(task.id, "created", f"Task created: {task.title}")
                
                conn.commit()
                logger.info(f"Task created: {task.id} - {task.title}")
                return True
                
        except Exception as e:
            logger.error(f"Error creating task: {e}")
            return False
    
    def update_task_status(self, task_id: str, status: str, progress: int = None) -> bool:
        """작업 상태 업데이트"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                update_fields = ["status = ?", "updated_at = ?"]
                values = [status, datetime.now().isoformat()]
                
                if progress is not None:
                    update_fields.append("progress = ?")
                    values.append(progress)
                
                values.append(task_id)
                
                conn.execute(f"""
                    UPDATE tasks 
                    SET {', '.join(update_fields)}
                    WHERE id = ?
                """, values)
                
                # 히스토리 기록
                self.add_task_history(task_id, "status_changed", f"Status changed to: {status}")
                
                conn.commit()
                logger.info(f"Task {task_id} status updated to: {status}")
                return True
                
        except Exception as e:
            logger.error(f"Error updating task status: {e}")
            return False
    
    def get_tasks_by_status(self, status: str = None) -> List[Dict]:
        """상태별 작업 조회"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                
                if status:
                    cursor = conn.execute("SELECT * FROM tasks WHERE status = ? ORDER BY priority DESC, created_at ASC", (status,))
                else:
                    cursor = conn.execute("SELECT * FROM tasks ORDER BY priority DESC, created_at ASC")
                
                tasks = []
                for row in cursor.fetchall():
                    task_dict = dict(row)
                    task_dict['tags'] = json.loads(task_dict['tags']) if task_dict['tags'] else []
                    task_dict['dependencies'] = json.loads(task_dict['dependencies']) if task_dict['dependencies'] else []
                    tasks.append(task_dict)
                
                return tasks
                
        except Exception as e:
            logger.error(f"Error getting tasks: {e}")
            return []
    
    def add_task_history(self, task_id: str, action: str, details: str):
        """작업 히스토리 추가"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT INTO task_history (task_id, action, details, timestamp)
                    VALUES (?, ?, ?, ?)
                """, (task_id, action, details, datetime.now().isoformat()))
                conn.commit()
                
        except Exception as e:
            logger.error(f"Error adding task history: {e}")
    
    def get_project_status(self) -> Dict:
        """프로젝트 전체 상태 조회"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                
                # 상태별 작업 수 조회
                status_counts = {}
                cursor = conn.execute("SELECT status, COUNT(*) as count FROM tasks GROUP BY status")
                for row in cursor.fetchall():
                    status_counts[row['status']] = row['count']
                
                # 우선순위별 작업 수 조회
                priority_counts = {}
                cursor = conn.execute("SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority")
                for row in cursor.fetchall():
                    priority_counts[row['priority']] = row['count']
                
                # 전체 진행률 계산
                cursor = conn.execute("SELECT AVG(progress) as avg_progress FROM tasks")
                avg_progress = cursor.fetchone()['avg_progress'] or 0
                
                # 최근 활동
                cursor = conn.execute("""
                    SELECT th.*, t.title 
                    FROM task_history th 
                    JOIN tasks t ON th.task_id = t.id 
                    ORDER BY th.timestamp DESC 
                    LIMIT 10
                """)
                recent_activities = [dict(row) for row in cursor.fetchall()]
                
                return {
                    "total_tasks": sum(status_counts.values()),
                    "status_breakdown": status_counts,
                    "priority_breakdown": priority_counts,
                    "overall_progress": round(avg_progress, 2),
                    "recent_activities": recent_activities,
                    "last_updated": datetime.now().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Error getting project status: {e}")
            return {}
    
    def get_daily_report(self, date: str = None) -> Dict:
        """일일 작업 보고서"""
        if not date:
            date = datetime.now().strftime('%Y-%m-%d')
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                
                # 해당 날짜의 작업 활동
                cursor = conn.execute("""
                    SELECT t.*, th.action, th.timestamp
                    FROM tasks t
                    JOIN task_history th ON t.id = th.task_id
                    WHERE DATE(th.timestamp) = ?
                    ORDER BY th.timestamp DESC
                """, (date,))
                
                daily_activities = [dict(row) for row in cursor.fetchall()]
                
                # 완료된 작업
                completed_tasks = [
                    activity for activity in daily_activities 
                    if activity['action'] == 'status_changed' and 'completed' in activity.get('details', '')
                ]
                
                # 진행 중인 작업
                in_progress_tasks = self.get_tasks_by_status('in_progress')
                
                # 대기 중인 고우선순위 작업
                pending_high_priority = [
                    task for task in self.get_tasks_by_status('pending')
                    if task['priority'] in ['high', 'critical']
                ]
                
                return {
                    "date": date,
                    "completed_tasks_count": len(completed_tasks),
                    "in_progress_count": len(in_progress_tasks),
                    "pending_high_priority_count": len(pending_high_priority),
                    "daily_activities": daily_activities[:10],
                    "recommendations": self.generate_daily_recommendations(in_progress_tasks, pending_high_priority),
                    "generated_at": datetime.now().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Error generating daily report: {e}")
            return {}
    
    def generate_daily_recommendations(self, in_progress: List[Dict], pending_high: List[Dict]) -> List[str]:
        """일일 추천사항 생성"""
        recommendations = []
        
        if len(in_progress) > 5:
            recommendations.append("진행 중인 작업이 많습니다. 일부 작업을 완료하거나 연기하는 것을 고려하세요.")
        
        if len(pending_high) > 0:
            recommendations.append(f"고우선순위 대기 작업 {len(pending_high)}개가 있습니다. 우선적으로 처리하세요.")
        
        if len(in_progress) == 0:
            recommendations.append("진행 중인 작업이 없습니다. 새로운 작업을 시작하세요.")
        
        # 마감일 임박 작업 체크
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        for task in in_progress:
            if task.get('due_date') and task['due_date'] <= tomorrow:
                recommendations.append(f"작업 '{task['title']}'의 마감일이 임박했습니다.")
        
        return recommendations

# 초기 작업 설정
def setup_initial_tasks():
    """초기 작업들 설정"""
    task_master = TaskMasterMCP()
    
    # 기본 작업들 생성
    initial_tasks = [
        Task(
            id="docs-update-phase3",
            title="Phase 3 완료 문서 업데이트",
            description="frontend.png 구현 완료를 반영한 모든 문서 업데이트",
            status="completed",
            priority="high",
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            tags=["documentation", "phase3", "ui"],
            progress=100
        ),
        Task(
            id="mcp-integration",
            title="Task Master & Memory Bank MCP 통합",
            description="체계적인 작업 관리 및 메모리 관리 시스템 구축",
            status="in_progress",
            priority="medium",
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            tags=["mcp", "integration", "task-management"],
            progress=80
        ),
        Task(
            id="gemini-mcp-verification",
            title="Gemini MCP 연동 검증",
            description="기존 Gemini MCP 서버 동작 확인 및 최적화",
            status="pending",
            priority="medium",
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            tags=["gemini", "mcp", "verification"],
            progress=0
        ),
        Task(
            id="memory-bank-setup",
            title="Memory Bank MCP 메모리 관리 설정",
            description="프로젝트 컨텍스트 및 기술적 결정사항 메모리 시스템 구축",
            status="pending",
            priority="medium",
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            tags=["memory-bank", "context-management", "mcp"],
            progress=0
        )
    ]
    
    for task in initial_tasks:
        task_master.create_task(task)
    
    logger.info("Initial tasks created successfully")
    return task_master

if __name__ == "__main__":
    # Task Master 초기화 및 설정
    task_master = setup_initial_tasks()
    
    # 프로젝트 현재 상태 출력
    status = task_master.get_project_status()
    print(json.dumps(status, indent=2, ensure_ascii=False))
    
    # 일일 보고서 생성
    daily_report = task_master.get_daily_report()
    print(json.dumps(daily_report, indent=2, ensure_ascii=False))