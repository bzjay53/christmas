#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
JIRA 프로젝트 키 문제 수정 스크립트
"""

import re
import os

def main():
    # 파일 읽기
    with open('beta_issue_response.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 수정할 코드 블록
    old_code = '''    def create_jira_issue(self, alert):
        """JIRA 이슈 생성"""
        jira_config = self.config["jira"]
        
        # 심각도에 따른 이슈 타입 매핑
        issue_type_map = {
            "P0": "버그",
            "P1": "버그",
            "P2": "작업",
            "P3": "하위 작업"
        }
        
        # 이슈 데이터 구성
        issue_data = {
            "fields": {
                "project": {
                    "key": jira_config["project_key"]'''
    
    # 새로운 코드 블록
    new_code = '''    def create_jira_issue(self, alert):
        """JIRA 이슈 생성"""
        jira_config = self.config["jira"]
        
        # 심각도에 따른 이슈 타입 매핑
        issue_type_map = {
            "P0": "버그",
            "P1": "버그",
            "P2": "작업",
            "P3": "하위 작업"
        }
        
        # 프로젝트 키 가져오기 (project_key가 없으면 project_keys의 첫 번째 항목 또는 기본값 "BETA" 사용)
        project_key = jira_config.get("project_key")
        if not project_key:
            if "project_keys" in jira_config and len(jira_config["project_keys"]) > 0:
                project_key = jira_config["project_keys"][0]
            else:
                project_key = "BETA"
                log.warning(f"JIRA 프로젝트 키가 설정되지 않아 기본값 '{project_key}'를 사용합니다.")
        
        # 이슈 데이터 구성
        issue_data = {
            "fields": {
                "project": {
                    "key": project_key'''
    
    # 코드 교체
    if old_code in content:
        modified_content = content.replace(old_code, new_code)
        print("코드 패턴을 찾았습니다. 수정 중...")
    else:
        # 간단한 대체 시도
        modified_content = content.replace('"key": jira_config["project_key"]', 
                                          '"key": project_key')
        print("코드 패턴을 찾지 못했습니다. 간단한 대체 수행 중...")
    
    # 파일 쓰기
    with open('beta_issue_response.py', 'w', encoding='utf-8') as f:
        f.write(modified_content)
    
    print("수정 완료!")

if __name__ == "__main__":
    main() 