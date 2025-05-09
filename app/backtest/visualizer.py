"""
Christmas 프로젝트 - 백테스트 시각화 모듈
백테스트 결과를 시각화하는 기능 제공
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import seaborn as sns
from typing import Dict, List, Any, Optional, Union, Tuple
import datetime
import logging
import io
import base64
from pathlib import Path

from app.backtest.analyzer import PerformanceMetrics

logger = logging.getLogger(__name__)


class BacktestVisualizer:
    """백테스트 결과 시각화 클래스"""
    
    def __init__(self, backtest_result: Dict[str, Any], metrics: Optional[PerformanceMetrics] = None):
        """
        백테스트 시각화 초기화
        
        Args:
            backtest_result: 백테스트 결과 딕셔너리
            metrics: 성능 지표 객체 (None인 경우 자동 계산 시도)
        """
        self.result = backtest_result
        self.metrics = metrics
        
        # 스타일 설정
        self.set_style()
        
        # 데이터 변환
        self._prepare_data()
    
    def set_style(self) -> None:
        """시각화 스타일 설정"""
        # Seaborn 스타일 설정
        sns.set(style="darkgrid", palette="muted", font_scale=1.2)
        
        # Matplotlib 설정
        plt.rcParams["figure.figsize"] = (12, 8)
        plt.rcParams["font.family"] = "sans-serif"
        plt.rcParams["axes.titlesize"] = 14
        plt.rcParams["axes.labelsize"] = 12
        plt.rcParams["xtick.labelsize"] = 10
        plt.rcParams["ytick.labelsize"] = 10
    
    def _prepare_data(self) -> None:
        """백테스트 결과 데이터 전처리"""
        # 포트폴리오 이력을 데이터프레임으로 변환
        if "portfolio_history" in self.result:
            self.portfolio_df = pd.DataFrame(self.result["portfolio_history"])
            self.portfolio_df["datetime"] = pd.to_datetime(self.portfolio_df["datetime"])
            self.portfolio_df.set_index("datetime", inplace=True)
            self.portfolio_df.sort_index(inplace=True)
        else:
            self.portfolio_df = pd.DataFrame(columns=["equity", "cash", "positions_value", "drawdown"])
        
        # 거래 이력을 데이터프레임으로 변환
        if "trades" in self.result and self.result["trades"]:
            self.trades_df = pd.DataFrame(self.result["trades"])
            if "datetime" in self.trades_df:
                self.trades_df["datetime"] = pd.to_datetime(self.trades_df["datetime"])
                self.trades_df.sort_values("datetime", inplace=True)
            if "exit_datetime" in self.trades_df:
                self.trades_df["exit_datetime"] = pd.to_datetime(self.trades_df["exit_datetime"])
        else:
            self.trades_df = pd.DataFrame(columns=["symbol", "pnl", "pnl_pct"])
        
        # 주문 이력을 데이터프레임으로 변환
        if "orders" in self.result and self.result["orders"]:
            self.orders_df = pd.DataFrame(self.result["orders"])
            if "datetime" in self.orders_df:
                self.orders_df["datetime"] = pd.to_datetime(self.orders_df["datetime"])
                self.orders_df.sort_values("datetime", inplace=True)
        else:
            self.orders_df = pd.DataFrame(columns=["datetime", "symbol", "direction", "price", "quantity"])
    
    def plot_equity_curve(self, figsize: Tuple[int, int] = (12, 6), show_drawdown: bool = True) -> plt.Figure:
        """
        자산 가치 변화 그래프 생성
        
        Args:
            figsize: 그래프 크기
            show_drawdown: 낙폭 표시 여부
            
        Returns:
            matplotlib Figure 객체
        """
        if self.portfolio_df.empty:
            logger.warning("포트폴리오 이력이 없어 자산 곡선을 그릴 수 없습니다.")
            fig, ax = plt.subplots(figsize=figsize)
            ax.text(0.5, 0.5, "No data available", ha="center", va="center")
            return fig
        
        # 그래프 생성
        fig, ax1 = plt.subplots(figsize=figsize)
        
        # 자산 곡선 플롯
        ax1.plot(self.portfolio_df.index, self.portfolio_df["equity"], 
                 label="Total Equity", color="royalblue", linewidth=2)
        
        # 매수/매도 표시
        buy_orders = self.orders_df[self.orders_df["direction"] == "buy"]
        sell_orders = self.orders_df[self.orders_df["direction"] == "sell"]
        
        if not buy_orders.empty and "datetime" in buy_orders:
            for dt in buy_orders["datetime"]:
                if dt in self.portfolio_df.index:
                    equity_val = self.portfolio_df.loc[dt, "equity"]
                    ax1.scatter(dt, equity_val, color="green", marker="^", s=100, alpha=0.7)
        
        if not sell_orders.empty and "datetime" in sell_orders:
            for dt in sell_orders["datetime"]:
                if dt in self.portfolio_df.index:
                    equity_val = self.portfolio_df.loc[dt, "equity"]
                    ax1.scatter(dt, equity_val, color="red", marker="v", s=100, alpha=0.7)
        
        # 낙폭 표시
        if show_drawdown and "drawdown" in self.portfolio_df:
            ax2 = ax1.twinx()
            ax2.fill_between(self.portfolio_df.index, 0, self.portfolio_df["drawdown"], 
                            color="salmon", alpha=0.3, label="Drawdown")
            ax2.set_ylim(0, max(10, self.portfolio_df["drawdown"].max() * 1.5))
            ax2.invert_yaxis()  # 낙폭을 위에서 아래로 표시
            ax2.set_ylabel("Drawdown (%)")
            
            # 두 축의 범례 병합
            lines1, labels1 = ax1.get_legend_handles_labels()
            lines2, labels2 = ax2.get_legend_handles_labels()
            ax1.legend(lines1 + lines2, labels1 + labels2, loc="upper left")
        else:
            ax1.legend(loc="upper left")
        
        # x축 날짜 포맷 설정
        ax1.xaxis.set_major_formatter(mdates.DateFormatter("%Y-%m-%d"))
        plt.xticks(rotation=45)
        
        # 그래프 제목 및 레이블 설정
        symbol = self.result.get("symbol", "")
        start_date = self.result.get("start_date", "")
        end_date = self.result.get("end_date", "")
        
        ax1.set_title(f"Equity Curve - {symbol} ({start_date} to {end_date})")
        ax1.set_ylabel("Equity Value")
        ax1.set_xlabel("Date")
        
        # 그리드 설정
        ax1.grid(True, alpha=0.3)
        
        # 그래프 여백 조정
        plt.tight_layout()
        
        return fig
    
    def plot_returns_distribution(self, figsize: Tuple[int, int] = (12, 6)) -> plt.Figure:
        """
        수익률 분포 그래프 생성
        
        Args:
            figsize: 그래프 크기
            
        Returns:
            matplotlib Figure 객체
        """
        if self.portfolio_df.empty or "daily_return" not in self.portfolio_df:
            logger.warning("포트폴리오 이력이 없어 수익률 분포를 그릴 수 없습니다.")
            fig, ax = plt.subplots(figsize=figsize)
            ax.text(0.5, 0.5, "No data available", ha="center", va="center")
            return fig
        
        # 일간 수익률 계산
        if "daily_return" not in self.portfolio_df:
            self.portfolio_df["daily_return"] = self.portfolio_df["equity"].pct_change() * 100
        
        # 그래프 생성
        fig, ax = plt.subplots(figsize=figsize)
        
        # 히스토그램 및 KDE 플롯
        returns = self.portfolio_df["daily_return"].dropna() * 100  # 퍼센트로 변환
        sns.histplot(returns, kde=True, ax=ax, color="royalblue", alpha=0.7)
        
        # 평균, 중앙값 표시
        mean_return = returns.mean()
        median_return = returns.median()
        ax.axvline(mean_return, color="red", linestyle="--", alpha=0.8, label=f"Mean: {mean_return:.2f}%")
        ax.axvline(median_return, color="green", linestyle="-.", alpha=0.8, label=f"Median: {median_return:.2f}%")
        
        # 0% 기준선 표시
        ax.axvline(0, color="black", alpha=0.5)
        
        # 그래프 제목 및 레이블 설정
        symbol = self.result.get("symbol", "")
        ax.set_title(f"Daily Returns Distribution - {symbol}")
        ax.set_xlabel("Daily Return (%)")
        ax.set_ylabel("Frequency")
        
        # 범례 표시
        ax.legend()
        
        # 그래프 여백 조정
        plt.tight_layout()
        
        return fig
    
    def plot_drawdown(self, figsize: Tuple[int, int] = (12, 6)) -> plt.Figure:
        """
        낙폭 그래프 생성
        
        Args:
            figsize: 그래프 크기
            
        Returns:
            matplotlib Figure 객체
        """
        if self.portfolio_df.empty or "drawdown" not in self.portfolio_df:
            logger.warning("포트폴리오 이력이 없어 낙폭 그래프를 그릴 수 없습니다.")
            fig, ax = plt.subplots(figsize=figsize)
            ax.text(0.5, 0.5, "No data available", ha="center", va="center")
            return fig
        
        # 그래프 생성
        fig, ax = plt.subplots(figsize=figsize)
        
        # 낙폭 플롯
        ax.fill_between(self.portfolio_df.index, 0, self.portfolio_df["drawdown"], 
                        color="crimson", alpha=0.5)
        
        # 최대 낙폭 위치 표시
        max_dd = self.portfolio_df["drawdown"].max()
        max_dd_idx = self.portfolio_df["drawdown"].idxmax()
        
        ax.scatter(max_dd_idx, max_dd, color="darkred", s=100, zorder=5)
        ax.annotate(f"Max Drawdown: {max_dd:.2f}%", 
                   (max_dd_idx, max_dd),
                   xytext=(30, -30),
                   textcoords="offset points",
                   arrowprops=dict(arrowstyle="->", color="black"))
        
        # x축 날짜 포맷 설정
        ax.xaxis.set_major_formatter(mdates.DateFormatter("%Y-%m-%d"))
        plt.xticks(rotation=45)
        
        # 그래프 제목 및 레이블 설정
        symbol = self.result.get("symbol", "")
        ax.set_title(f"Drawdown - {symbol}")
        ax.set_ylabel("Drawdown (%)")
        ax.set_xlabel("Date")
        
        # y축 역전 (낙폭을 위에서 아래로 표시)
        ax.invert_yaxis()
        
        # 그리드 설정
        ax.grid(True, alpha=0.3)
        
        # 그래프 여백 조정
        plt.tight_layout()
        
        return fig
    
    def plot_trade_results(self, figsize: Tuple[int, int] = (12, 6)) -> plt.Figure:
        """
        거래 결과 그래프 생성
        
        Args:
            figsize: 그래프 크기
            
        Returns:
            matplotlib Figure 객체
        """
        if self.trades_df.empty or "pnl" not in self.trades_df:
            logger.warning("거래 이력이 없어 거래 결과 그래프를 그릴 수 없습니다.")
            fig, ax = plt.subplots(figsize=figsize)
            ax.text(0.5, 0.5, "No trade data available", ha="center", va="center")
            return fig
        
        # 거래 결과 (승/패) 데이터 준비
        self.trades_df["result"] = "Win"
        self.trades_df.loc[self.trades_df["pnl"] <= 0, "result"] = "Loss"
        
        # 거래 결과에 따른 색상 설정
        colors = {"Win": "green", "Loss": "red"}
        
        # 그래프 생성
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=figsize)
        
        # 1. 승/패 거래 횟수 막대 그래프
        result_counts = self.trades_df["result"].value_counts()
        sns.barplot(x=result_counts.index, y=result_counts.values, ax=ax1, palette=colors)
        
        # 승률 표시
        win_rate = (result_counts.get("Win", 0) / len(self.trades_df) * 100) if not self.trades_df.empty else 0
        ax1.set_title(f"Trade Results (Win Rate: {win_rate:.2f}%)")
        ax1.set_ylabel("Number of Trades")
        
        # 2. 거래별 손익 그래프
        if "datetime" in self.trades_df and "pnl" in self.trades_df:
            # 손익 막대 그래프
            trades_with_date = self.trades_df.copy()
            trades_with_date["color"] = trades_with_date["pnl"].apply(lambda x: "green" if x > 0 else "red")
            
            # 거래 날짜 순서로 정렬
            if "datetime" in trades_with_date:
                trades_with_date = trades_with_date.sort_values("datetime")
            
            # 거래별 손익 플롯
            ax2.bar(range(len(trades_with_date)), trades_with_date["pnl"], color=trades_with_date["color"])
            
            # 0 기준선
            ax2.axhline(0, color="black", linewidth=1, alpha=0.5)
            
            ax2.set_title("Profit/Loss by Trade")
            ax2.set_xlabel("Trade Number")
            ax2.set_ylabel("Profit/Loss")
            
            # 그리드 설정
            ax2.grid(True, alpha=0.3, axis="y")
        
        # 그래프 여백 조정
        plt.tight_layout()
        
        return fig
    
    def plot_monthly_returns(self, figsize: Tuple[int, int] = (12, 6)) -> plt.Figure:
        """
        월별 수익률 히트맵 생성
        
        Args:
            figsize: 그래프 크기
            
        Returns:
            matplotlib Figure 객체
        """
        if self.portfolio_df.empty:
            logger.warning("포트폴리오 이력이 없어 월별 수익률을 그릴 수 없습니다.")
            fig, ax = plt.subplots(figsize=figsize)
            ax.text(0.5, 0.5, "No data available", ha="center", va="center")
            return fig
        
        # 일간 수익률 계산
        if "daily_return" not in self.portfolio_df:
            self.portfolio_df["daily_return"] = self.portfolio_df["equity"].pct_change()
        
        # 월별 수익률 계산
        monthly_returns = self.portfolio_df["daily_return"].resample("M").apply(
            lambda x: ((1 + x).prod() - 1) * 100
        )
        
        # 데이터프레임 재구성 (연도 x 월)
        returns_by_month = pd.DataFrame()
        
        for date, value in monthly_returns.items():
            year = date.year
            month = date.month
            if year not in returns_by_month:
                returns_by_month[year] = [np.nan] * 12
            returns_by_month.loc[month, year] = value
        
        # 인덱스를 월 이름으로 변환
        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        returns_by_month.index = month_names
        
        # 그래프 생성
        fig, ax = plt.subplots(figsize=figsize)
        
        # 히트맵 플롯
        sns.heatmap(returns_by_month, annot=True, fmt=".2f", cmap="RdYlGn", 
                   center=0, ax=ax, linewidths=0.5, cbar_kws={"label": "Return (%)"})
        
        # 그래프 제목 및 레이블 설정
        symbol = self.result.get("symbol", "")
        ax.set_title(f"Monthly Returns (%) - {symbol}")
        
        # 그래프 여백 조정
        plt.tight_layout()
        
        return fig
    
    def save_plots(self, output_dir: str, prefix: str = "") -> List[str]:
        """
        모든 그래프를 파일로 저장
        
        Args:
            output_dir: 출력 디렉터리 경로
            prefix: 파일명 접두사
            
        Returns:
            저장된 파일 경로 목록
        """
        # 출력 디렉터리 생성
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        saved_files = []
        
        # 자산 곡선 저장
        fig_equity = self.plot_equity_curve()
        equity_file = output_path / f"{prefix}equity_curve.png"
        fig_equity.savefig(equity_file)
        plt.close(fig_equity)
        saved_files.append(str(equity_file))
        
        # 수익률 분포 저장
        fig_returns = self.plot_returns_distribution()
        returns_file = output_path / f"{prefix}returns_distribution.png"
        fig_returns.savefig(returns_file)
        plt.close(fig_returns)
        saved_files.append(str(returns_file))

        # 낙폭 그래프 저장
        fig_drawdown = self.plot_drawdown()
        drawdown_file = output_path / f"{prefix}drawdown.png"
        fig_drawdown.savefig(drawdown_file)
        plt.close(fig_drawdown)
        saved_files.append(str(drawdown_file))
        
        # 거래 결과 그래프 저장
        fig_trades = self.plot_trade_results()
        trades_file = output_path / f"{prefix}trade_results.png"
        fig_trades.savefig(trades_file)
        plt.close(fig_trades)
        saved_files.append(str(trades_file))
        
        # 월별 수익률 저장
        fig_monthly = self.plot_monthly_returns()
        monthly_file = output_path / f"{prefix}monthly_returns.png"
        fig_monthly.savefig(monthly_file)
        plt.close(fig_monthly)
        saved_files.append(str(monthly_file))
        
        return saved_files
    
    def get_figure_as_base64(self, fig: plt.Figure) -> str:
        """
        Matplotlib 그림을 base64 인코딩된 문자열로 변환
        
        Args:
            fig: matplotlib Figure 객체
            
        Returns:
            base64 인코딩된 이미지 문자열
        """
        buffer = io.BytesIO()
        fig.savefig(buffer, format="png")
        buffer.seek(0)
        image_png = buffer.getvalue()
        buffer.close()
        
        return base64.b64encode(image_png).decode("utf-8") 