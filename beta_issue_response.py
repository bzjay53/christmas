import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class BetaIssueResponse:
    def send_email_alert(self, subject, message, alert):
        """이메일 알림 전송"""
        email_config = self.config["notifications"]["email"]
        
        msg = MIMEMultipart()
        msg["From"] = email_config.get("from_address", email_config["username"])
        msg["To"] = ", ".join(email_config["recipients"])
        msg["Subject"] = subject
        
        msg.attach(MIMEText(message, "plain"))
        
        try:
            server = smtplib.SMTP(email_config["smtp_server"], email_config["smtp_port"])
            if email_config.get("use_tls", True):
                server.starttls()
            server.login(email_config["username"], email_config["password"])
            server.send_message(msg)
            server.quit()
            log.info(f"이메일 알림 전송 완료: {subject}")
        except Exception as e:
            log.error(f"이메일 전송 중 오류: {e}")
            raise 