#!/usr/bin/env python3
import os
import asyncio
import subprocess
from datetime import datetime
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, filters, ContextTypes
import paramiko
from io import StringIO

# Load environment variables
load_dotenv()

# Configuration
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')
SSH_HOST = os.getenv('SSH_HOST', 'localhost')
SSH_PORT = int(os.getenv('SSH_PORT', 22))
SSH_USERNAME = os.getenv('SSH_USERNAME', 'root')
SSH_PASSWORD = os.getenv('SSH_PASSWORD', '')
ALLOWED_USERS = os.getenv('ALLOWED_USERS', '').split(',')
MAX_OUTPUT_LENGTH = int(os.getenv('MAX_OUTPUT_LENGTH', 4000))
CLAUDE_CODE_PATH = os.getenv('CLAUDE_CODE_PATH', '/usr/local/bin/claude')
WORKING_DIR = os.getenv('WORKING_DIR', '/root/christmas-trading')

# Global SSH client
ssh_client = None
current_session = None

def is_authorized(user_id):
    """Check if user is authorized"""
    return str(user_id) in ALLOWED_USERS or not ALLOWED_USERS[0]

def connect_ssh():
    """Establish SSH connection"""
    global ssh_client
    try:
        ssh_client = paramiko.SSHClient()
        ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        if SSH_PASSWORD:
            ssh_client.connect(SSH_HOST, SSH_PORT, SSH_USERNAME, SSH_PASSWORD)
        else:
            # Try to use SSH key
            ssh_client.connect(SSH_HOST, SSH_PORT, SSH_USERNAME)
        
        return True
    except Exception as e:
        print(f"SSH connection error: {e}")
        return False

def execute_command(command):
    """Execute command via SSH"""
    global ssh_client
    
    if not ssh_client:
        if not connect_ssh():
            return "Failed to connect via SSH"
    
    try:
        # Change to working directory before executing command
        full_command = f"cd {WORKING_DIR} && {command}"
        stdin, stdout, stderr = ssh_client.exec_command(full_command)
        
        output = stdout.read().decode('utf-8')
        error = stderr.read().decode('utf-8')
        
        result = output + error
        
        # Truncate if too long
        if len(result) > MAX_OUTPUT_LENGTH:
            result = result[:MAX_OUTPUT_LENGTH] + "\n... (output truncated)"
        
        return result if result else "Command executed (no output)"
    except Exception as e:
        return f"Error executing command: {e}"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start command handler"""
    user_id = update.effective_user.id
    
    if not is_authorized(user_id):
        await update.message.reply_text("Unauthorized access")
        return
    
    keyboard = [
        [InlineKeyboardButton("📟 Terminal Status", callback_data='status')],
        [InlineKeyboardButton("🚀 Quick Commands", callback_data='quick_commands')],
        [InlineKeyboardButton("🤖 Claude Code", callback_data='claude_menu')],
        [InlineKeyboardButton("📊 Project Status", callback_data='project_status')]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "🖥️ *Terminal Control Bot*\n\n"
        "Send any command to execute on the terminal.\n"
        "Use the buttons below for quick actions:",
        parse_mode='Markdown',
        reply_markup=reply_markup
    )

async def handle_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle text commands"""
    user_id = update.effective_user.id
    
    if not is_authorized(user_id):
        await update.message.reply_text("Unauthorized access")
        return
    
    command = update.message.text
    
    # Send typing action
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    
    # Execute command
    result = execute_command(command)
    
    # Format and send result
    response = f"```bash\n$ {command}\n{result}\n```"
    
    # Split long messages
    if len(response) > 4096:
        for i in range(0, len(response), 4096):
            await update.message.reply_text(response[i:i+4096], parse_mode='Markdown')
    else:
        await update.message.reply_text(response, parse_mode='Markdown')

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle button callbacks"""
    query = update.callback_query
    user_id = query.from_user.id
    
    if not is_authorized(user_id):
        await query.answer("Unauthorized", show_alert=True)
        return
    
    await query.answer()
    
    if query.data == 'status':
        result = execute_command('ps aux | grep -E "(python|node|claude)" | grep -v grep')
        await query.message.reply_text(f"```\n{result}\n```", parse_mode='Markdown')
    
    elif query.data == 'quick_commands':
        keyboard = [
            [InlineKeyboardButton("📁 List Files", callback_data='cmd_ls')],
            [InlineKeyboardButton("🔄 Git Status", callback_data='cmd_git_status')],
            [InlineKeyboardButton("📊 Docker PS", callback_data='cmd_docker_ps')],
            [InlineKeyboardButton("🏃 Run Bot", callback_data='cmd_run_bot')],
            [InlineKeyboardButton("🛑 Stop Bot", callback_data='cmd_stop_bot')],
            [InlineKeyboardButton("🔙 Back", callback_data='back_main')]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.message.edit_text("Select a command:", reply_markup=reply_markup)
    
    elif query.data == 'claude_menu':
        keyboard = [
            [InlineKeyboardButton("💭 Ask Claude", callback_data='claude_ask')],
            [InlineKeyboardButton("📝 Current Task", callback_data='claude_task')],
            [InlineKeyboardButton("🔄 Sync Code", callback_data='claude_sync')],
            [InlineKeyboardButton("🔙 Back", callback_data='back_main')]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.message.edit_text("Claude Code Actions:", reply_markup=reply_markup)
    
    elif query.data == 'project_status':
        # Get project status
        git_status = execute_command('git status --short')
        docker_status = execute_command('docker ps --format "table {{.Names}}\t{{.Status}}"')
        disk_usage = execute_command('df -h .')
        
        status_message = f"""📊 *Project Status*

*Git Status:*
```
{git_status if git_status.strip() else 'Clean working directory'}
```

*Docker Containers:*
```
{docker_status}
```

*Disk Usage:*
```
{disk_usage}
```
"""
        await query.message.reply_text(status_message, parse_mode='Markdown')
    
    elif query.data.startswith('cmd_'):
        commands = {
            'cmd_ls': 'ls -la',
            'cmd_git_status': 'git status',
            'cmd_docker_ps': 'docker ps -a',
            'cmd_run_bot': 'python trading_bot.py',
            'cmd_stop_bot': 'pkill -f trading_bot.py'
        }
        
        cmd = commands.get(query.data, '')
        if cmd:
            result = execute_command(cmd)
            await query.message.reply_text(f"```bash\n$ {cmd}\n{result}\n```", parse_mode='Markdown')
    
    elif query.data == 'claude_ask':
        await query.message.reply_text(
            "Send your question for Claude Code.\n"
            "Example: `claude explain the trading strategy`"
        )
    
    elif query.data == 'back_main':
        keyboard = [
            [InlineKeyboardButton("📟 Terminal Status", callback_data='status')],
            [InlineKeyboardButton("🚀 Quick Commands", callback_data='quick_commands')],
            [InlineKeyboardButton("🤖 Claude Code", callback_data='claude_menu')],
            [InlineKeyboardButton("📊 Project Status", callback_data='project_status')]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.message.edit_text("Select an action:", reply_markup=reply_markup)

async def claude_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle Claude Code commands"""
    user_id = update.effective_user.id
    
    if not is_authorized(user_id):
        await update.message.reply_text("Unauthorized access")
        return
    
    # Get the Claude query
    if context.args:
        query = ' '.join(context.args)
    else:
        await update.message.reply_text("Please provide a query for Claude Code")
        return
    
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    
    # Execute Claude command
    claude_cmd = f'{CLAUDE_CODE_PATH} "{query}"'
    result = execute_command(claude_cmd)
    
    # Send result
    response = f"🤖 *Claude Code Response:*\n```\n{result}\n```"
    
    if len(response) > 4096:
        for i in range(0, len(response), 4096):
            await update.message.reply_text(response[i:i+4096], parse_mode='Markdown')
    else:
        await update.message.reply_text(response, parse_mode='Markdown')

async def monitor_terminal(context: ContextTypes.DEFAULT_TYPE):
    """Periodically monitor terminal and send updates"""
    if not CHAT_ID:
        return
    
    # Check for critical processes
    critical_processes = execute_command('ps aux | grep -E "(error|failed|critical)" | grep -v grep')
    
    if critical_processes.strip():
        await context.bot.send_message(
            chat_id=CHAT_ID,
            text=f"⚠️ *Critical Process Alert:*\n```\n{critical_processes}\n```",
            parse_mode='Markdown'
        )

def main():
    """Main function"""
    # Create application
    app = Application.builder().token(BOT_TOKEN).build()
    
    # Add handlers
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("claude", claude_command))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_command))
    app.add_handler(CallbackQueryHandler(button_callback))
    
    # Add job for monitoring (every 5 minutes)
    job_queue = app.job_queue
    job_queue.run_repeating(monitor_terminal, interval=300, first=10)
    
    # Start bot
    print("🤖 Telegram Terminal Bot started...")
    app.run_polling()

if __name__ == "__main__":
    # Connect SSH on startup
    if connect_ssh():
        print("✅ SSH connection established")
    else:
        print("❌ Failed to establish SSH connection")
    
    main()