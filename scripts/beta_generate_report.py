#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
베타 테스트 피드백 및 이슈 보고서 생성 스크립트
"""

import os
import json
import logging
import argparse
import datetime
import requests
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(f"logs/beta_report_{datetime.datetime.now().strftime('%Y%m%d')}.log")
    ]
)
logger = logging.getLogger("BetaReportGenerator")

class BetaReportGenerator:
    """베타 테스트 보고서 생성 클래스"""
    
    def __init__(self, config_path=None):
        """초기화"""
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        if config_path is None:
            self.feedback_config_path = os.path.join(base_dir, "environments", "beta", "config", "feedback_system.json")
            self.issue_config_path = os.path.join(base_dir, "environments", "beta", "config", "issue_response.json")
        else:
            self.feedback_config_path = os.path.join(base_dir, config_path, "feedback_system.json")
            self.issue_config_path = os.path.join(base_dir, config_path, "issue_response.json")
            
        self.output_dir = os.path.join(base_dir, "reports", "beta")
        os.makedirs(self.output_dir, exist_ok=True)
        
        self.load_configs()
        self.feedback_data = None
        self.issue_data = None
    
    def load_configs(self):
        """설정 파일 로드"""
        try:
            with open(self.feedback_config_path, 'r', encoding='utf-8') as f:
                self.feedback_config = json.load(f)
            logger.info(f"피드백 시스템 설정 로드 완료: {self.feedback_config_path}")
            
            with open(self.issue_config_path, 'r', encoding='utf-8') as f:
                self.issue_config = json.load(f)
            logger.info(f"이슈 대응 시스템 설정 로드 완료: {self.issue_config_path}")
        except Exception as e:
            logger.error(f"설정 파일 로드 실패: {str(e)}")
            raise
    
    def fetch_data(self):
        """데이터 수집"""
        logger.info("베타 테스트 데이터 수집 시작")
        
        # 실제 구현에서는 데이터베이스 또는 API에서 데이터를 가져옴
        # 현재는 예시 데이터 생성
        self._generate_mock_data()
        
        logger.info(f"피드백 데이터 {len(self.feedback_data)} 건 수집 완료")
        logger.info(f"이슈 데이터 {len(self.issue_data)} 건 수집 완료")
        
    def _generate_mock_data(self):
        """목업 데이터 생성 (실제 DB 연결 전 테스트용)"""
        # 피드백 데이터 생성
        feedback_categories = self.feedback_config.get('feedback_categories', [])
        priority_levels = self.feedback_config.get('priority_levels', [])
        
        # 현재 날짜
        today = datetime.datetime.now()
        
        # 최근 7일 날짜 생성
        dates = [(today - datetime.timedelta(days=i)).strftime('%Y-%m-%d') for i in range(7)]
        
        # 피드백 데이터 생성
        feedback_data = []
        for i in range(50):  # 50개 샘플 데이터
            day_idx = i % 7
            feedback_data.append({
                'id': f"fb_{i+1:03d}",
                'date': dates[day_idx],
                'category': feedback_categories[i % len(feedback_categories)],
                'priority': priority_levels[i % len(priority_levels)],
                'status': 'resolved' if i % 3 == 0 else ('in_progress' if i % 3 == 1 else 'open'),
                'response_time_minutes': 5 + (i % 120),
                'user_satisfaction': 1 + (i % 5)
            })
        
        self.feedback_data = pd.DataFrame(feedback_data)
        
        # 이슈 데이터 생성
        issue_data = []
        severities = ['P0', 'P1', 'P2', 'P3']
        categories = ['성능', '기능', 'UI/UX', '시스템 안정성', '보안', '기타']
        
        for i in range(30):  # 30개 샘플 데이터
            day_idx = i % 7
            issue_data.append({
                'id': f"issue_{i+1:03d}",
                'date': dates[day_idx],
                'severity': severities[i % len(severities)],
                'category': categories[i % len(categories)],
                'status': 'resolved' if i % 4 == 0 else ('in_progress' if i % 4 == 1 else ('acknowledged' if i % 4 == 2 else 'open')),
                'resolution_time_hours': i % 48 if i % 4 == 0 else None,
                'source': 'automated' if i % 3 == 0 else ('manual' if i % 3 == 1 else 'feedback')
            })
        
        self.issue_data = pd.DataFrame(issue_data)
    
    def generate_report(self):
        """보고서 생성"""
        if self.feedback_data is None or self.issue_data is None:
            self.fetch_data()
        
        logger.info("보고서 생성 시작")
        
        report_date = datetime.datetime.now().strftime('%Y-%m-%d')
        report_path = os.path.join(self.output_dir, f"beta_report_{report_date}")
        os.makedirs(report_path, exist_ok=True)
        
        # 1. 기본 통계 생성
        self._generate_basic_stats(report_path)
        
        # 2. 피드백 분석 차트
        self._generate_feedback_charts(report_path)
        
        # 3. 이슈 분석 차트
        self._generate_issue_charts(report_path)
        
        # 4. HTML 보고서 생성
        self._generate_html_report(report_path)
        
        logger.info(f"보고서 생성 완료: {report_path}")
        return report_path
    
    def _generate_basic_stats(self, report_path):
        """기본 통계 생성"""
        # 피드백 통계
        feedback_stats = {
            'total_count': len(self.feedback_data),
            'by_priority': self.feedback_data['priority'].value_counts().to_dict(),
            'by_category': self.feedback_data['category'].value_counts().to_dict(),
            'by_status': self.feedback_data['status'].value_counts().to_dict(),
            'avg_response_time': self.feedback_data['response_time_minutes'].mean(),
            'avg_satisfaction': self.feedback_data['user_satisfaction'].mean()
        }
        
        # 이슈 통계
        issue_stats = {
            'total_count': len(self.issue_data),
            'by_severity': self.issue_data['severity'].value_counts().to_dict(),
            'by_category': self.issue_data['category'].value_counts().to_dict(),
            'by_status': self.issue_data['status'].value_counts().to_dict(),
            'by_source': self.issue_data['source'].value_counts().to_dict(),
            'avg_resolution_time': self.issue_data[self.issue_data['resolution_time_hours'].notna()]['resolution_time_hours'].mean()
        }
        
        # JSON 파일로 저장
        with open(os.path.join(report_path, 'feedback_stats.json'), 'w', encoding='utf-8') as f:
            json.dump(feedback_stats, f, ensure_ascii=False, indent=2)
        
        with open(os.path.join(report_path, 'issue_stats.json'), 'w', encoding='utf-8') as f:
            json.dump(issue_stats, f, ensure_ascii=False, indent=2)
        
        logger.info("기본 통계 생성 완료")
    
    def _generate_feedback_charts(self, report_path):
        """피드백 분석 차트 생성"""
        plt.figure(figsize=(12, 8))
        
        # 1. 카테고리별 피드백 수
        plt.subplot(2, 2, 1)
        sns.countplot(data=self.feedback_data, x='category', palette='viridis')
        plt.title('피드백 카테고리 분포')
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        # 2. 우선순위별 피드백 수
        plt.subplot(2, 2, 2)
        sns.countplot(data=self.feedback_data, x='priority', palette='rocket')
        plt.title('피드백 우선순위 분포')
        plt.tight_layout()
        
        # 3. 일별 피드백 추이
        plt.subplot(2, 2, 3)
        date_counts = self.feedback_data['date'].value_counts().sort_index()
        plt.plot(date_counts.index, date_counts.values, marker='o')
        plt.title('일별 피드백 추이')
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        # 4. 사용자 만족도 분포
        plt.subplot(2, 2, 4)
        sns.countplot(data=self.feedback_data, x='user_satisfaction', palette='magma')
        plt.title('사용자 만족도 분포')
        plt.tight_layout()
        
        # 저장
        plt.tight_layout()
        plt.savefig(os.path.join(report_path, 'feedback_analysis.png'), dpi=300)
        plt.close()
        
        logger.info("피드백 분석 차트 생성 완료")
    
    def _generate_issue_charts(self, report_path):
        """이슈 분석 차트 생성"""
        plt.figure(figsize=(12, 8))
        
        # 1. 심각도별 이슈 수
        plt.subplot(2, 2, 1)
        severity_order = ['P0', 'P1', 'P2', 'P3']
        sns.countplot(data=self.issue_data, x='severity', order=severity_order, palette='Reds_r')
        plt.title('이슈 심각도 분포')
        plt.tight_layout()
        
        # 2. 카테고리별 이슈 수
        plt.subplot(2, 2, 2)
        sns.countplot(data=self.issue_data, x='category', palette='viridis')
        plt.title('이슈 카테고리 분포')
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        # 3. 일별 이슈 추이
        plt.subplot(2, 2, 3)
        date_counts = self.issue_data['date'].value_counts().sort_index()
        plt.plot(date_counts.index, date_counts.values, marker='o', color='red')
        plt.title('일별 이슈 추이')
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        # 4. 상태별 이슈 수
        plt.subplot(2, 2, 4)
        status_order = ['open', 'acknowledged', 'in_progress', 'resolved']
        sns.countplot(data=self.issue_data, x='status', order=status_order, palette='YlOrRd')
        plt.title('이슈 상태 분포')
        plt.tight_layout()
        
        # 저장
        plt.tight_layout()
        plt.savefig(os.path.join(report_path, 'issue_analysis.png'), dpi=300)
        plt.close()
        
        # 5. 해결 시간 히스토그램
        plt.figure(figsize=(10, 6))
        resolved_issues = self.issue_data[self.issue_data['resolution_time_hours'].notna()]
        if len(resolved_issues) > 0:
            sns.histplot(data=resolved_issues, x='resolution_time_hours', bins=10, kde=True, color='purple')
            plt.title('이슈 해결 시간 분포(시간)')
            plt.savefig(os.path.join(report_path, 'issue_resolution_time.png'), dpi=300)
        plt.close()
        
        logger.info("이슈 분석 차트 생성 완료")
    
    def _generate_html_report(self, report_path):
        """HTML 보고서 생성"""
        report_date = os.path.basename(report_path).split('_')[-1]
        
        # 피드백 통계 로드
        with open(os.path.join(report_path, 'feedback_stats.json'), 'r', encoding='utf-8') as f:
            feedback_stats = json.load(f)
        
        # 이슈 통계 로드
        with open(os.path.join(report_path, 'issue_stats.json'), 'r', encoding='utf-8') as f:
            issue_stats = json.load(f)
        
        # HTML 템플릿
        html_content = f"""
        <!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>베타 테스트 보고서 - {report_date}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 0; color: #333; line-height: 1.6; }}
                .container {{ width: 90%; max-width: 1200px; margin: 0 auto; padding: 20px; }}
                h1, h2, h3 {{ color: #2c3e50; }}
                h1 {{ border-bottom: 2px solid #eee; padding-bottom: 10px; }}
                .card {{ background: #fff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px; padding: 20px; }}
                .summary {{ display: flex; justify-content: space-between; flex-wrap: wrap; }}
                .summary-item {{ background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 15px; flex-basis: 30%; }}
                .chart-container {{ margin-top: 30px; }}
                .chart {{ margin-bottom: 30px; text-align: center; }}
                .chart img {{ max-width: 100%; height: auto; border: 1px solid #eee; }}
                table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                th, td {{ text-align: left; padding: 12px 15px; border-bottom: 1px solid #ddd; }}
                th {{ background-color: #f5f5f5; }}
                tr:hover {{ background-color: #f9f9f9; }}
                .footer {{ margin-top: 30px; text-align: center; color: #777; font-size: 0.9em; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Christmas 베타 테스트 보고서</h1>
                <p>보고서 생성일: {report_date}</p>
                
                <div class="card">
                    <h2>요약</h2>
                    <div class="summary">
                        <div class="summary-item">
                            <h3>피드백 총계</h3>
                            <p>{feedback_stats['total_count']} 건</p>
                        </div>
                        <div class="summary-item">
                            <h3>평균 응답 시간</h3>
                            <p>{feedback_stats['avg_response_time']:.1f} 분</p>
                        </div>
                        <div class="summary-item">
                            <h3>평균 만족도</h3>
                            <p>{feedback_stats['avg_satisfaction']:.1f} / 5.0</p>
                        </div>
                        <div class="summary-item">
                            <h3>이슈 총계</h3>
                            <p>{issue_stats['total_count']} 건</p>
                        </div>
                        <div class="summary-item">
                            <h3>해결된 이슈</h3>
                            <p>{issue_stats['by_status'].get('resolved', 0)} 건</p>
                        </div>
                        <div class="summary-item">
                            <h3>평균 해결 시간</h3>
                            <p>{issue_stats.get('avg_resolution_time', 0):.1f} 시간</p>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <h2>피드백 분석</h2>
                    <div class="chart">
                        <img src="feedback_analysis.png" alt="피드백 분석">
                    </div>
                    
                    <h3>카테고리별 피드백</h3>
                    <table>
                        <tr>
                            <th>카테고리</th>
                            <th>건수</th>
                        </tr>
                        {''.join(f"<tr><td>{category}</td><td>{count}</td></tr>" for category, count in feedback_stats['by_category'].items())}
                    </table>
                    
                    <h3>우선순위별 피드백</h3>
                    <table>
                        <tr>
                            <th>우선순위</th>
                            <th>건수</th>
                        </tr>
                        {''.join(f"<tr><td>{priority}</td><td>{count}</td></tr>" for priority, count in feedback_stats['by_priority'].items())}
                    </table>
                </div>
                
                <div class="card">
                    <h2>이슈 분석</h2>
                    <div class="chart">
                        <img src="issue_analysis.png" alt="이슈 분석">
                    </div>
                    
                    <h3>심각도별 이슈</h3>
                    <table>
                        <tr>
                            <th>심각도</th>
                            <th>건수</th>
                        </tr>
                        {''.join(f"<tr><td>{severity}</td><td>{count}</td></tr>" for severity, count in issue_stats['by_severity'].items())}
                    </table>
                    
                    <h3>이슈 해결 시간</h3>
                    <div class="chart">
                        <img src="issue_resolution_time.png" alt="이슈 해결 시간">
                    </div>
                </div>
                
                <div class="footer">
                    <p>Christmas 베타 테스트 보고서 - 자동 생성됨</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # HTML 파일 저장
        with open(os.path.join(report_path, 'report.html'), 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        logger.info("HTML 보고서 생성 완료")
    
    def send_report(self, report_path, recipients=None):
        """보고서 전송 (이메일, 슬랙 등)"""
        # 이 부분은 실제 구현 시 필요에 따라 구현
        logger.info(f"보고서 전송 (목적지: {recipients if recipients else '기본 수신자'})")
        # 이메일 전송 코드 등이 여기에 들어감
        pass

def main():
    parser = argparse.ArgumentParser(description="Christmas 베타 테스트 보고서 생성")
    parser.add_argument("--config-path", help="설정 파일 경로")
    parser.add_argument("--output-dir", help="보고서 출력 디렉토리")
    parser.add_argument("--send", action="store_true", help="보고서 전송 여부")
    parser.add_argument("--recipients", help="보고서 수신자 (콤마로 구분)")
    
    args = parser.parse_args()
    
    try:
        generator = BetaReportGenerator(config_path=args.config_path)
        report_path = generator.generate_report()
        
        if args.send:
            recipients = args.recipients.split(',') if args.recipients else None
            generator.send_report(report_path, recipients)
            
        logger.info(f"보고서 생성 완료: {report_path}")
        print(f"보고서가 생성되었습니다: {report_path}")
    except Exception as e:
        logger.error(f"보고서 생성 중 오류 발생: {str(e)}", exc_info=True)
        print(f"오류: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main()) 