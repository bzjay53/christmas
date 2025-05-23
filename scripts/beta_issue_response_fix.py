    def create_jira_issue(self, alert):
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
                    "key": project_key
                },
                "summary": f"[{alert['severity']}] {alert['name']}",
                "description": f"{alert['description']}\n\n감지 시간: {alert['detected_time']}\n현재 값: {alert['value']}",
                "issuetype": {
                    "name": issue_type_map.get(alert["severity"], "버그")
                },
                "labels": ["beta-test", "automated", alert["category"].lower()],
                "priority": {
                    "name": "Highest" if alert["severity"] == "P0" else 
                           "High" if alert["severity"] == "P1" else 
                           "Medium" if alert["severity"] == "P2" else 
                           "Low"
                }
            }
        }
        
        # JIRA API 호출
        url = f"{jira_config['url']}/rest/api/2/issue"
        auth = (jira_config["username"], jira_config["api_token"])
        headers = {"Content-Type": "application/json"} 