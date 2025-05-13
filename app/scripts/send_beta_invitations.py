#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
베타 테스트 초대 이메일 발송 스크립트

이 스크립트는 environments/beta/beta_test_users.json 파일에서 
사용자 정보를 읽어와 베타 테스트 초대 이메일을 발송합니다.
"""

import argparse
import json
import logging
import os
import smtplib
import sys
import time
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from string import Template

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('beta_invitation_log.txt')
    ]
)
logger = logging.getLogger('beta_invitations')

# 상수 정의
DEFAULT_BETA_START_DATE = "2025-06-05"
DEFAULT_BETA_END_DATE = "2025-06-30"
DEFAULT_BETA_URL = "https://beta.christmas.example.com"
DEFAULT_SUPPORT_EMAIL = "support@christmas.example.com"
DEFAULT_EMAIL_TEMPLATE_PATH = "environments/beta/email_templates/beta_invitation.html"
DEFAULT_USERS_FILE_PATH = "environments/beta/beta_test_users.json"
DEFAULT_API_KEYS_FILE_PATH = "environments/beta/beta_api_keys.json"
DEFAULT_RESULT_FILE_PATH = "environments/beta/invitation_result.json"

def load_json_file(file_path):
    """JSON 파일을 로드합니다."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"JSON 파일 로드 중 오류 발생: {e}")
        return None

def load_template(template_path):
    """HTML 템플릿 파일을 로드합니다."""
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        logger.error(f"템플릿 파일 로드 중 오류 발생: {e}")
        return None

def get_smtp_config():
    """SMTP 설정을 환경 변수에서 가져옵니다."""
    return {
        'server': os.getenv('SMTP_SERVER', 'smtp.gmail.com'),
        'port': int(os.getenv('SMTP_PORT', 587)),
        'username': os.getenv('SMTP_USERNAME', 'beta@christmas.example.com'),
        'password': os.getenv('SMTP_PASSWORD', 'smtp_password'),
        'use_tls': os.getenv('SMTP_USE_TLS', 'True').lower() == 'true'
    }

def get_user_info(user, api_keys):
    """사용자 정보와 API 키 정보를 통합합니다."""
    username = user.get('username')
    
    # 해당 사용자의 API 키 찾기
    api_key_info = next((k for k in api_keys if k.get('username') == username), None)
    
    if not api_key_info:
        logger.warning(f"사용자 {username}의 API 키를 찾을 수 없습니다.")
        return None
    
    # 임시 비밀번호 생성 (실제로는 더 복잡한 로직을 사용해야 함)
    temp_password = f"Beta{username.split('_')[-1]}2025!"
    
    return {
        'username': username,
        'email': user.get('email'),
        'full_name': user.get('full_name'),
        'group': user.get('group'),
        'api_key': api_key_info.get('api_key'),
        'api_secret': api_key_info.get('api_secret'),
        'password': temp_password
    }

def send_email(recipient, subject, html_content, smtp_config):
    """이메일을 발송합니다."""
    try:
        # MIME 메시지 생성
        message = MIMEMultipart()
        message['From'] = smtp_config['username']
        message['To'] = recipient
        message['Subject'] = subject
        
        # HTML 내용 추가
        message.attach(MIMEText(html_content, 'html'))
        
        # SMTP 연결 및 전송
        with smtplib.SMTP(smtp_config['server'], smtp_config['port']) as server:
            if smtp_config['use_tls']:
                server.starttls()
            
            server.login(smtp_config['username'], smtp_config['password'])
            server.send_message(message)
            
        logger.info(f"이메일 발송 성공: {recipient}")
        return True
    except Exception as e:
        logger.error(f"이메일 발송 실패 ({recipient}): {e}")
        return False

def process_template(template_str, user_info, beta_info):
    """템플릿에 사용자 정보를 적용합니다."""
    try:
        # 기본 값 설정
        template_context = {
            'name': user_info.get('full_name', '테스터'),
            'username': user_info.get('username', ''),
            'password': user_info.get('password', ''),
            'api_key': user_info.get('api_key', ''),
            'api_secret': user_info.get('api_secret', ''),
            'group': user_info.get('group', 'regular'),
            'start_date': beta_info.get('start_date', DEFAULT_BETA_START_DATE),
            'end_date': beta_info.get('end_date', DEFAULT_BETA_END_DATE),
            'beta_url': beta_info.get('beta_url', DEFAULT_BETA_URL),
            'support_email': beta_info.get('support_email', DEFAULT_SUPPORT_EMAIL)
        }
        
        # if-else 조건 처리 (%if, %else, %endif)
        if "group == \"expert\"" in template_str and user_info.get('group') == 'expert':
            template_str = template_str.replace("{%if group == \"expert\"%}", "")
            template_str = template_str.replace("{%else%}", "<!--")
            template_str = template_str.replace("{%endif%}", "-->")
        else:
            template_str = template_str.replace("{%if group == \"expert\"%}", "<!--")
            template_str = template_str.replace("{%else%}", "-->")
            template_str = template_str.replace("{%endif%}", "")
        
        # 변수 대체
        for key, value in template_context.items():
            placeholder = "{" + key + "}"
            template_str = template_str.replace(placeholder, str(value))
        
        return template_str
    except Exception as e:
        logger.error(f"템플릿 처리 중 오류 발생: {e}")
        return None

def main(args):
    """메인 함수"""
    # 필요한 파일 로드
    users_data = load_json_file(args.users_file)
    if not users_data:
        logger.error("사용자 데이터를 로드할 수 없습니다.")
        return 1
    
    api_keys = load_json_file(args.api_keys_file)
    if not api_keys:
        logger.error("API 키 데이터를 로드할 수 없습니다.")
        return 1
    
    template_content = load_template(args.template_path)
    if not template_content:
        logger.error("이메일 템플릿을 로드할 수 없습니다.")
        return 1
    
    # SMTP 설정 가져오기
    smtp_config = get_smtp_config()
    
    # 베타 정보 설정
    beta_info = {
        'start_date': args.start_date,
        'end_date': args.end_date,
        'beta_url': args.beta_url,
        'support_email': args.support_email
    }
    
    # 결과 저장용 변수 초기화
    result = {
        'timestamp': datetime.now().isoformat(),
        'total_users': 0,
        'sent_emails': 0,
        'beta_start_date': args.start_date,
        'beta_end_date': args.end_date,
        'details': {
            'professional_traders': {'total': 0, 'sent': 0, 'failed': 0},
            'regular_users': {'total': 0, 'sent': 0, 'failed': 0}
        },
        'email_template': os.path.basename(args.template_path),
        'support_email': args.support_email,
        'beta_url': args.beta_url
    }
    
    # 전문 트레이더 처리
    for user in users_data.get('professional_traders', []):
        result['details']['professional_traders']['total'] += 1
        result['total_users'] += 1
        
        user_info = get_user_info(user, api_keys)
        if not user_info:
            result['details']['professional_traders']['failed'] += 1
            continue
        
        html_content = process_template(template_content, user_info, beta_info)
        if not html_content:
            result['details']['professional_traders']['failed'] += 1
            continue
        
        if not args.dry_run:
            success = send_email(
                user_info['email'],
                f"Christmas 프로젝트 베타 테스트 초대 ({user_info['group']} 그룹)",
                html_content,
                smtp_config
            )
            
            if success:
                result['details']['professional_traders']['sent'] += 1
                result['sent_emails'] += 1
            else:
                result['details']['professional_traders']['failed'] += 1
        else:
            logger.info(f"DRY RUN: 이메일을 {user_info['email']}로 발송합니다.")
            result['details']['professional_traders']['sent'] += 1
            result['sent_emails'] += 1
        
        # 과도한 요청 방지를 위한 지연
        time.sleep(1)
    
    # 일반 사용자 처리
    for user in users_data.get('regular_users', []):
        result['details']['regular_users']['total'] += 1
        result['total_users'] += 1
        
        user_info = get_user_info(user, api_keys)
        if not user_info:
            result['details']['regular_users']['failed'] += 1
            continue
        
        html_content = process_template(template_content, user_info, beta_info)
        if not html_content:
            result['details']['regular_users']['failed'] += 1
            continue
        
        if not args.dry_run:
            success = send_email(
                user_info['email'],
                f"Christmas 프로젝트 베타 테스트 초대 ({user_info['group']} 그룹)",
                html_content,
                smtp_config
            )
            
            if success:
                result['details']['regular_users']['sent'] += 1
                result['sent_emails'] += 1
            else:
                result['details']['regular_users']['failed'] += 1
        else:
            logger.info(f"DRY RUN: 이메일을 {user_info['email']}로 발송합니다.")
            result['details']['regular_users']['sent'] += 1
            result['sent_emails'] += 1
        
        # 과도한 요청 방지를 위한 지연
        time.sleep(1)
    
    # 결과 저장
    try:
        with open(args.result_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        logger.info(f"결과가 {args.result_file}에 저장되었습니다.")
    except Exception as e:
        logger.error(f"결과 저장 중 오류 발생: {e}")
    
    logger.info(f"총 {result['total_users']}명 중 {result['sent_emails']}명에게 초대 이메일을 발송했습니다.")
    
    return 0

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="베타 테스트 초대 이메일 발송")
    parser.add_argument("--dry-run", action="store_true", help="실제로 이메일을 발송하지 않고 시뮬레이션만 수행")
    parser.add_argument("--start-date", default=DEFAULT_BETA_START_DATE, help="베타 테스트 시작일")
    parser.add_argument("--end-date", default=DEFAULT_BETA_END_DATE, help="베타 테스트 종료일")
    parser.add_argument("--beta-url", default=DEFAULT_BETA_URL, help="베타 테스트 URL")
    parser.add_argument("--support-email", default=DEFAULT_SUPPORT_EMAIL, help="지원 이메일")
    parser.add_argument("--template-path", default=DEFAULT_EMAIL_TEMPLATE_PATH, help="이메일 템플릿 경로")
    parser.add_argument("--users-file", default=DEFAULT_USERS_FILE_PATH, help="사용자 목록 파일 경로")
    parser.add_argument("--api-keys-file", default=DEFAULT_API_KEYS_FILE_PATH, help="API 키 파일 경로")
    parser.add_argument("--result-file", default=DEFAULT_RESULT_FILE_PATH, help="결과 파일 경로")
    
    args = parser.parse_args()
    sys.exit(main(args))
