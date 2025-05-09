"""
Christmas 프로젝트 - 백테스트 성능 분석기 모듈
백테스트 결과의 성능 지표를 계산하고 분석하는 기능 제공
"""

import numpy as np
import pandas as pd
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Union
import datetime
import logging
import math

logger = logging.getLogger(__name__)


@dataclass
class PerformanceMetrics:
    """백테스트 성능 지표"""
    # 기본 정보
    symbol: str = ""  # 종목코드
    start_date: Optional[datetime.datetime] = None  # 시작일
    end_date: Optional[datetime.datetime] = None  # 종료일
    
    # 수익률 지표
    total_return: float = 0.0  # 총 수익률 (%)
    annualized_return: float = 0.0  # 연간 수익률 (%)
    daily_return: float = 0.0  # 일평균 수익률 (%)
    
    # 변동성 지표
    volatility: float = 0.0  # 변동성 (표준편차) (%)
    downside_volatility: float = 0.0  # 하방 변동성 (%)
    
    # 위험 조정 지표
    sharpe_ratio: float = 0.0  # 샤프 비율
    sortino_ratio: float = 0.0  # 소르티노 비율
    calmar_ratio: float = 0.0  # 칼마 비율
    
    # 최대 손실 지표
    max_drawdown: float = 0.0  # 최대 낙폭 (%)
    max_drawdown_duration: int = 0  # 최대 낙폭 기간 (일)
    
    # 거래 지표
    win_rate: float = 0.0  # 승률 (%)
    profit_factor: float = 0.0  # 이익 팩터 (총 이익 / 총 손실)
    expected_return: float = 0.0  # 기대 수익률 (평균 수익률 * 승률)
    total_trades: int = 0  # 총 거래 횟수
    winning_trades: int = 0  # 수익 거래 횟수
    losing_trades: int = 0  # 손실 거래 횟수
    avg_trade_return: float = 0.0  # 평균 거래 수익률 (%)
    avg_winning_return: float = 0.0  # 평균 수익 거래 수익률 (%)
    avg_losing_return: float = 0.0  # 평균 손실 거래 수익률 (%)
    max_consecutive_wins: int = 0  # 최대 연속 수익 횟수
    max_consecutive_losses: int = 0  # 최대 연속 손실 횟수
    
    # 포지션 지표
    avg_position_duration: float = 0.0  # 평균 포지션 유지 기간 (일)
    avg_position_size: float = 0.0  # 평균 포지션 크기
    max_position_size: float = 0.0  # 최대 포지션 크기
    
    # 기타 지표
    recovery_factor: float = 0.0  # 회복 팩터 (총 수익률 / 최대 낙폭)
    risk_of_ruin: float = 0.0  # 파산 위험도
    
    def to_dict(self) -> Dict[str, Any]:
        """지표를 딕셔너리로 변환"""
        return {
            # 기본 정보
            "symbol": self.symbol,
            "start_date": self.start_date.strftime("%Y-%m-%d") if self.start_date else None,
            "end_date": self.end_date.strftime("%Y-%m-%d") if self.end_date else None,
            
            # 수익률 지표
            "total_return": round(self.total_return, 2),
            "annualized_return": round(self.annualized_return, 2),
            "daily_return": round(self.daily_return, 4),
            
            # 변동성 지표
            "volatility": round(self.volatility, 2),
            "downside_volatility": round(self.downside_volatility, 2),
            
            # 위험 조정 지표
            "sharpe_ratio": round(self.sharpe_ratio, 3),
            "sortino_ratio": round(self.sortino_ratio, 3),
            "calmar_ratio": round(self.calmar_ratio, 3),
            
            # 최대 손실 지표
            "max_drawdown": round(self.max_drawdown, 2),
            "max_drawdown_duration": self.max_drawdown_duration,
            
            # 거래 지표
            "win_rate": round(self.win_rate, 2),
            "profit_factor": round(self.profit_factor, 3),
            "expected_return": round(self.expected_return, 4),
            "total_trades": self.total_trades,
            "winning_trades": self.winning_trades,
            "losing_trades": self.losing_trades,
            "avg_trade_return": round(self.avg_trade_return, 2),
            "avg_winning_return": round(self.avg_winning_return, 2),
            "avg_losing_return": round(self.avg_losing_return, 2),
            "max_consecutive_wins": self.max_consecutive_wins,
            "max_consecutive_losses": self.max_consecutive_losses,
            
            # 포지션 지표
            "avg_position_duration": round(self.avg_position_duration, 1),
            "avg_position_size": round(self.avg_position_size, 0),
            "max_position_size": round(self.max_position_size, 0),
            
            # 기타 지표
            "recovery_factor": round(self.recovery_factor, 3),
            "risk_of_ruin": round(self.risk_of_ruin, 4),
        }


class PerformanceAnalyzer:
    """백테스트 성능 분석기"""
    
    def __init__(self, backtest_result: Dict[str, Any]):
        """
        성능 분석기 초기화
        
        Args:
            backtest_result: 백테스트 결과 딕셔너리
        """
        self.result = backtest_result
        self.metrics = PerformanceMetrics()
        
        # 데이터 변환
        self._prepare_data()
        
        # 기본 정보 설정
        self.metrics.symbol = backtest_result.get("symbol", "")
        self.metrics.start_date = backtest_result.get("start_date")
        self.metrics.end_date = backtest_result.get("end_date")
    
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
                # 포지션 지속 시간 계산 (일 단위)
                self.trades_df["duration_days"] = (
                    self.trades_df["exit_datetime"] - self.trades_df["datetime"]
                ).dt.total_seconds() / (24 * 60 * 60)
        else:
            self.trades_df = pd.DataFrame(columns=["symbol", "pnl", "pnl_pct"])
        
        # 일별 수익률 계산
        if not self.portfolio_df.empty and len(self.portfolio_df) > 1:
            # 일간 수익률 계산
            self.portfolio_df["daily_return"] = self.portfolio_df["equity"].pct_change()
            self.portfolio_df.fillna(0, inplace=True)
    
    def calculate_metrics(self) -> PerformanceMetrics:
        """
        백테스트 성능 지표 계산
        
        Returns:
            계산된 성능 지표
        """
        # 충분한 데이터가 없는 경우
        if self.portfolio_df.empty:
            logger.warning("포트폴리오 이력이 없어 성능 지표를 계산할 수 없습니다.")
            return self.metrics
        
        try:
            # 기본 정보 계산
            self._calculate_basic_metrics()
            
            # 수익률 지표 계산
            self._calculate_return_metrics()
            
            # 변동성 지표 계산
            self._calculate_volatility_metrics()
            
            # 위험 조정 지표 계산
            self._calculate_risk_adjusted_metrics()
            
            # 최대 손실 지표 계산
            self._calculate_drawdown_metrics()
            
            # 거래 지표 계산
            self._calculate_trade_metrics()
            
            # 포지션 지표 계산
            self._calculate_position_metrics()
            
            # 기타 지표 계산
            self._calculate_other_metrics()
            
            logger.info("성능 지표 계산 완료")
            
        except Exception as e:
            logger.error(f"성능 지표 계산 중 오류 발생: {str(e)}")
        
        return self.metrics
    
    def _calculate_basic_metrics(self) -> None:
        """기본 정보 및 기초 지표 계산"""
        # 초기 자본금과 최종 자산 가치
        initial_capital = self.result.get("initial_capital", 0)
        final_equity = self.portfolio_df["equity"].iloc[-1] if not self.portfolio_df.empty else 0
        
        # 총 수익률 계산
        self.metrics.total_return = ((final_equity / initial_capital) - 1) * 100 if initial_capital > 0 else 0
    
    def _calculate_return_metrics(self) -> None:
        """수익률 관련 지표 계산"""
        if self.portfolio_df.empty or len(self.portfolio_df) <= 1:
            return
        
        # 일평균 수익률
        self.metrics.daily_return = self.portfolio_df["daily_return"].mean() * 100
        
        # 연간 수익률 계산
        days = (self.metrics.end_date - self.metrics.start_date).days if self.metrics.start_date and self.metrics.end_date else 365
        years = max(days / 365, 0.01)  # 최소 0.01년 가정
        self.metrics.annualized_return = ((1 + self.metrics.total_return / 100) ** (1 / years) - 1) * 100
    
    def _calculate_volatility_metrics(self) -> None:
        """변동성 관련 지표 계산"""
        if self.portfolio_df.empty or "daily_return" not in self.portfolio_df:
            return
        
        # 일별 변동성 (표준편차)
        daily_volatility = self.portfolio_df["daily_return"].std()
        self.metrics.volatility = daily_volatility * 100 * np.sqrt(252)  # 연간 변동성으로 변환
        
        # 하방 변동성
        negative_returns = self.portfolio_df[self.portfolio_df["daily_return"] < 0]["daily_return"]
        if not negative_returns.empty:
            downside_volatility = negative_returns.std()
            self.metrics.downside_volatility = downside_volatility * 100 * np.sqrt(252)
    
    def _calculate_risk_adjusted_metrics(self) -> None:
        """위험 조정 지표 계산"""
        # 무위험 수익률 (예: 연간 3%)
        risk_free_rate = 0.03
        daily_risk_free = risk_free_rate / 252
        
        # 일별 초과 수익률
        if not self.portfolio_df.empty and "daily_return" in self.portfolio_df:
            excess_returns = self.portfolio_df["daily_return"] - daily_risk_free
            
            # 샤프 비율 계산
            if self.metrics.volatility > 0:
                sharpe = (self.metrics.annualized_return - risk_free_rate * 100) / self.metrics.volatility
                self.metrics.sharpe_ratio = sharpe
            
            # 소르티노 비율 계산
            if self.metrics.downside_volatility > 0:
                sortino = (self.metrics.annualized_return - risk_free_rate * 100) / self.metrics.downside_volatility
                self.metrics.sortino_ratio = sortino
            
            # 칼마 비율 계산
            if self.metrics.max_drawdown > 0:
                calmar = self.metrics.annualized_return / self.metrics.max_drawdown
                self.metrics.calmar_ratio = calmar
    
    def _calculate_drawdown_metrics(self) -> None:
        """최대 손실 관련 지표 계산"""
        if "drawdown" in self.portfolio_df:
            # 최대 낙폭
            self.metrics.max_drawdown = self.portfolio_df["drawdown"].max()
            
            # 최대 낙폭 기간 계산
            if not self.portfolio_df.empty:
                # 낙폭 시작 및 종료 시점 찾기
                underwater = self.portfolio_df["equity"].cummax() - self.portfolio_df["equity"]
                underwater_rel = underwater / self.portfolio_df["equity"].cummax()
                
                # 낙폭 기간 계산
                is_underwater = underwater > 0
                if is_underwater.any():
                    underwater_periods = []
                    current_period = 0
                    
                    for is_under in is_underwater:
                        if is_under:
                            current_period += 1
                        else:
                            if current_period > 0:
                                underwater_periods.append(current_period)
                                current_period = 0
                    
                    # 마지막 낙폭 기간 추가
                    if current_period > 0:
                        underwater_periods.append(current_period)
                    
                    # 최대 낙폭 기간
                    self.metrics.max_drawdown_duration = max(underwater_periods) if underwater_periods else 0
    
    def _calculate_trade_metrics(self) -> None:
        """거래 관련 지표 계산"""
        if not self.trades_df.empty:
            # 총 거래 횟수
            self.metrics.total_trades = len(self.trades_df)
            
            # 수익/손실 거래 구분
            winning_trades = self.trades_df[self.trades_df["pnl"] > 0]
            losing_trades = self.trades_df[self.trades_df["pnl"] <= 0]
            
            self.metrics.winning_trades = len(winning_trades)
            self.metrics.losing_trades = len(losing_trades)
            
            # 승률 계산
            self.metrics.win_rate = (self.metrics.winning_trades / self.metrics.total_trades * 100) if self.metrics.total_trades > 0 else 0
            
            # 평균 수익률 계산
            if not self.trades_df.empty and "pnl_pct" in self.trades_df:
                self.metrics.avg_trade_return = self.trades_df["pnl_pct"].mean()
                self.metrics.avg_winning_return = winning_trades["pnl_pct"].mean() if not winning_trades.empty else 0
                self.metrics.avg_losing_return = losing_trades["pnl_pct"].mean() if not losing_trades.empty else 0
            
            # 수익 팩터 계산
            total_profit = winning_trades["pnl"].sum() if not winning_trades.empty else 0
            total_loss = abs(losing_trades["pnl"].sum()) if not losing_trades.empty else 0
            
            self.metrics.profit_factor = total_profit / total_loss if total_loss > 0 else float("inf")
            
            # 기대 수익률 계산
            self.metrics.expected_return = (self.metrics.win_rate / 100 * self.metrics.avg_winning_return) + \
                                         ((1 - self.metrics.win_rate / 100) * self.metrics.avg_losing_return)
            
            # 연속 수익/손실 계산
            if not self.trades_df.empty and "pnl" in self.trades_df:
                profit_streak = 0
                loss_streak = 0
                max_profit_streak = 0
                max_loss_streak = 0
                
                for pnl in self.trades_df["pnl"]:
                    if pnl > 0:
                        profit_streak += 1
                        loss_streak = 0
                        max_profit_streak = max(max_profit_streak, profit_streak)
                    else:
                        profit_streak = 0
                        loss_streak += 1
                        max_loss_streak = max(max_loss_streak, loss_streak)
                
                self.metrics.max_consecutive_wins = max_profit_streak
                self.metrics.max_consecutive_losses = max_loss_streak
    
    def _calculate_position_metrics(self) -> None:
        """포지션 관련 지표 계산"""
        if not self.trades_df.empty:
            # 평균 포지션 유지 기간
            if "duration_days" in self.trades_df:
                self.metrics.avg_position_duration = self.trades_df["duration_days"].mean()
            
            # 평균 및 최대 포지션 크기
            if "quantity" in self.trades_df and "entry_price" in self.trades_df:
                position_sizes = self.trades_df["quantity"] * self.trades_df["entry_price"]
                self.metrics.avg_position_size = position_sizes.mean()
                self.metrics.max_position_size = position_sizes.max()
    
    def _calculate_other_metrics(self) -> None:
        """기타 지표 계산"""
        # 회복 팩터
        if self.metrics.max_drawdown > 0:
            self.metrics.recovery_factor = self.metrics.total_return / self.metrics.max_drawdown
        
        # 파산 위험도 (매우 단순한 모델)
        if self.metrics.win_rate > 0 and self.metrics.avg_winning_return > 0 and self.metrics.avg_losing_return < 0:
            try:
                # 켈리 기준에 기반한 파산 위험도
                win_prob = self.metrics.win_rate / 100
                lose_prob = 1 - win_prob
                win_loss_ratio = abs(self.metrics.avg_winning_return / self.metrics.avg_losing_return)
                
                kelly = win_prob - (lose_prob / win_loss_ratio)
                
                # 음수 켈리는 높은 파산 위험을 의미
                if kelly < 0:
                    self.metrics.risk_of_ruin = 1 - (1 + kelly)  # 파산 위험도 스케일링 (0~1)
                else:
                    # 켈리가 양수이더라도 작으면 파산 위험은 존재
                    self.metrics.risk_of_ruin = max(0, 0.5 - kelly)
            except:
                self.metrics.risk_of_ruin = 0.5  # 기본값 