"""거래 결과 분석 모듈."""

import logging
import json
from typing import Dict, List, Optional, Any, Tuple, Union
from datetime import datetime
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA

from app.learning.model_manager import ModelManager

# 로깅 설정
logger = logging.getLogger(__name__)

class ResultAnalyzer:
    """
    거래 결과 분석기.
    거래 데이터를 분석하여 성공/실패 패턴을 찾고, 향후 전략 개선에 활용합니다.
    """
    
    def __init__(
        self,
        model_manager: Optional[ModelManager] = None,
        min_trades_for_analysis: int = 20,
        output_dir: str = "reports"
    ):
        """
        결과 분석기를 초기화합니다.
        
        Args:
            model_manager: 모델 관리자 객체
            min_trades_for_analysis: 분석에 필요한 최소 거래 수
            output_dir: 분석 보고서 저장 디렉토리
        """
        self.model_manager = model_manager or ModelManager()
        self.min_trades_for_analysis = min_trades_for_analysis
        self.output_dir = output_dir
        
        # 분석 결과 저장소
        self.analysis_results: Dict[str, Any] = {}
    
    def analyze_trades(self, trade_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        거래 이력을 분석합니다.
        
        Args:
            trade_history: 거래 이력 목록
            
        Returns:
            Dict[str, Any]: 분석 결과
        """
        if len(trade_history) < self.min_trades_for_analysis:
            logger.warning(f"분석에 필요한 거래 수가 부족합니다: {len(trade_history)} < {self.min_trades_for_analysis}")
            return {"error": "분석에 필요한 거래 수가 부족합니다"}
        
        try:
            # 거래 데이터프레임 생성
            df = self._prepare_trade_dataframe(trade_history)
            
            # 기본 성과 지표 계산
            performance_metrics = self._calculate_performance_metrics(df)
            
            # 거래 패턴 분석
            patterns = self._analyze_patterns(df)
            
            # 시계열 분석
            time_analysis = self._analyze_time_patterns(df)
            
            # 종목별 분석
            symbol_analysis = self._analyze_by_symbol(df)
            
            # 결과 병합
            analysis = {
                "performance": performance_metrics,
                "patterns": patterns,
                "time_analysis": time_analysis,
                "symbol_analysis": symbol_analysis,
                "timestamp": datetime.now().isoformat(),
                "trade_count": len(trade_history)
            }
            
            # 결과 저장
            analysis_id = f"trade_analysis_{datetime.now().strftime('%Y%m%d%H%M%S')}"
            self.model_manager.save_data(analysis_id, analysis)
            
            # 메모리에도 저장
            self.analysis_results[analysis_id] = analysis
            
            logger.info(f"거래 이력 분석 완료: {len(trade_history)}개 거래")
            return analysis
            
        except Exception as e:
            logger.error(f"거래 이력 분석 중 오류 발생: {str(e)}")
            return {"error": str(e)}
    
    def _prepare_trade_dataframe(self, trade_history: List[Dict[str, Any]]) -> pd.DataFrame:
        """
        거래 이력을 데이터프레임으로 변환합니다.
        
        Args:
            trade_history: 거래 이력 목록
            
        Returns:
            pd.DataFrame: 거래 데이터프레임
        """
        # 결과 및 메타데이터 추출
        trades_data = []
        
        for trade in trade_history:
            # 거래 데이터 및 결과 추출
            trade_data = trade.get("trade_data", {})
            result = trade.get("result", 0)
            timestamp = trade.get("timestamp")
            
            # 기본 정보 추출
            trade_info = {
                "result": result,
                "timestamp": pd.to_datetime(timestamp) if timestamp else pd.NaT,
                "is_profit": result > 0,
                "symbol": trade_data.get("symbol", ""),
                "signal_type": trade_data.get("signal_type", ""),
                "confidence": trade_data.get("confidence", 0),
                "price": trade_data.get("price", 0),
                "volume": trade_data.get("volume", 0),
                "strategy": trade_data.get("strategy", "")
            }
            
            # 시장 데이터 특성 추출 (있는 경우)
            if "market_data" in trade_data and isinstance(trade_data["market_data"], list):
                # 마지막 캔들 데이터 사용
                candle = trade_data["market_data"][-1] if trade_data["market_data"] else {}
                
                # 기술적 지표 추출
                for indicator in ["rsi", "macd", "macd_signal", "bb_upper", "bb_lower"]:
                    if indicator in candle:
                        trade_info[indicator] = candle[indicator]
            
            trades_data.append(trade_info)
        
        # 데이터프레임 생성
        df = pd.DataFrame(trades_data)
        
        # 시간 관련 특성 추가
        if "timestamp" in df.columns and not df["timestamp"].isna().all():
            df["year"] = df["timestamp"].dt.year
            df["month"] = df["timestamp"].dt.month
            df["day"] = df["timestamp"].dt.day
            df["hour"] = df["timestamp"].dt.hour
            df["minute"] = df["timestamp"].dt.minute
            df["weekday"] = df["timestamp"].dt.weekday
            df["is_month_start"] = df["timestamp"].dt.is_month_start
            df["is_month_end"] = df["timestamp"].dt.is_month_end
        
        return df
    
    def _calculate_performance_metrics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        성과 지표를 계산합니다.
        
        Args:
            df: 거래 데이터프레임
            
        Returns:
            Dict[str, Any]: 성과 지표
        """
        # 기본 통계
        total_trades = len(df)
        profitable_trades = df["is_profit"].sum()
        loss_trades = total_trades - profitable_trades
        
        win_rate = profitable_trades / total_trades if total_trades > 0 else 0
        
        # 수익률 통계
        total_return = df["result"].sum()
        mean_return = df["result"].mean()
        median_return = df["result"].median()
        std_return = df["result"].std()
        max_return = df["result"].max()
        min_return = df["result"].min()
        
        # 승리한 거래와 패배한 거래의 평균 수익률 계산
        win_avg = df[df["is_profit"]]["result"].mean() if profitable_trades > 0 else 0
        loss_avg = df[~df["is_profit"]]["result"].mean() if loss_trades > 0 else 0
        
        # 수익 요인 (전체 이익 / 전체 손실의 절대값)
        total_profit = df[df["result"] > 0]["result"].sum()
        total_loss = abs(df[df["result"] < 0]["result"].sum())
        profit_factor = total_profit / total_loss if total_loss > 0 else float('inf')
        
        # 최대 연속 승리/패배 횟수
        win_streak, max_win_streak = 0, 0
        loss_streak, max_loss_streak = 0, 0
        
        for is_profit in df["is_profit"]:
            if is_profit:
                win_streak += 1
                loss_streak = 0
                max_win_streak = max(max_win_streak, win_streak)
            else:
                loss_streak += 1
                win_streak = 0
                max_loss_streak = max(max_loss_streak, loss_streak)
        
        return {
            "total_trades": total_trades,
            "profitable_trades": int(profitable_trades),
            "loss_trades": int(loss_trades),
            "win_rate": win_rate,
            "total_return": total_return,
            "mean_return": mean_return,
            "median_return": median_return,
            "std_return": std_return,
            "max_return": max_return,
            "min_return": min_return,
            "win_avg": win_avg,
            "loss_avg": loss_avg,
            "profit_factor": profit_factor,
            "max_win_streak": max_win_streak,
            "max_loss_streak": max_loss_streak
        }
    
    def _analyze_patterns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        거래 패턴을 분석합니다.
        
        Args:
            df: 거래 데이터프레임
            
        Returns:
            Dict[str, Any]: 패턴 분석 결과
        """
        # 수익성 기준으로 클러스터링
        try:
            # 분석할 특성 선택
            feature_cols = [
                col for col in ["rsi", "macd", "macd_signal", "bb_upper", "bb_lower", "price", "volume"]
                if col in df.columns
            ]
            
            # 특성이 충분하지 않으면 추가 정보 없이 반환
            if len(feature_cols) < 3:
                return {"message": "패턴 분석에 필요한 특성이 부족합니다"}
            
            # 결측치 처리
            analysis_df = df[feature_cols].fillna(0)
            
            # 클러스터링 (3개 그룹)
            kmeans = KMeans(n_clusters=3, random_state=42)
            if len(analysis_df) > 0:
                clusters = kmeans.fit_predict(analysis_df)
                df["cluster"] = clusters
                
                # 차원 축소 (시각화용)
                if len(feature_cols) > 2:
                    pca = PCA(n_components=2)
                    pca_result = pca.fit_transform(analysis_df)
                    df["pca_x"] = pca_result[:, 0]
                    df["pca_y"] = pca_result[:, 1]
                
                # 클러스터별 성능 분석
                cluster_stats = []
                for cluster_id in range(3):
                    cluster_df = df[df["cluster"] == cluster_id]
                    
                    if len(cluster_df) > 0:
                        win_rate = cluster_df["is_profit"].mean()
                        avg_return = cluster_df["result"].mean()
                        centroid = kmeans.cluster_centers_[cluster_id]
                        
                        # 가장 중요한 특성 찾기
                        feature_importance = {}
                        for i, feature in enumerate(feature_cols):
                            feature_importance[feature] = centroid[i]
                        
                        cluster_stats.append({
                            "cluster_id": cluster_id,
                            "size": len(cluster_df),
                            "win_rate": win_rate,
                            "avg_return": avg_return,
                            "feature_importance": feature_importance
                        })
                
                return {
                    "clusters": cluster_stats,
                    "cluster_counts": df["cluster"].value_counts().to_dict()
                }
            
            return {"message": "데이터가 부족하여 패턴 분석을 건너뜁니다"}
            
        except Exception as e:
            logger.error(f"패턴 분석 중 오류 발생: {str(e)}")
            return {"error": str(e)}
    
    def _analyze_time_patterns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        시간 기반 패턴을 분석합니다.
        
        Args:
            df: 거래 데이터프레임
            
        Returns:
            Dict[str, Any]: 시간 패턴 분석 결과
        """
        # 시간 관련 컬럼이 없으면 건너뜀
        if "timestamp" not in df.columns or df["timestamp"].isna().all():
            return {"message": "시간 데이터가 부족하여 시간 패턴 분석을 건너뜁니다"}
        
        try:
            # 요일별 성과
            weekday_performance = {}
            for day in range(7):
                day_df = df[df["weekday"] == day]
                if len(day_df) > 0:
                    weekday_performance[day] = {
                        "count": len(day_df),
                        "win_rate": day_df["is_profit"].mean(),
                        "avg_return": day_df["result"].mean()
                    }
            
            # 시간대별 성과
            hourly_performance = {}
            for hour in range(24):
                hour_df = df[df["hour"] == hour]
                if len(hour_df) > 0:
                    hourly_performance[hour] = {
                        "count": len(hour_df),
                        "win_rate": hour_df["is_profit"].mean(),
                        "avg_return": hour_df["result"].mean()
                    }
            
            # 월별 성과
            monthly_performance = {}
            for month in range(1, 13):
                month_df = df[df["month"] == month]
                if len(month_df) > 0:
                    monthly_performance[month] = {
                        "count": len(month_df),
                        "win_rate": month_df["is_profit"].mean(),
                        "avg_return": month_df["result"].mean()
                    }
            
            # 월초/월말 성과
            month_start_df = df[df["is_month_start"] == True]
            month_end_df = df[df["is_month_end"] == True]
            
            month_edge_performance = {
                "month_start": {
                    "count": len(month_start_df),
                    "win_rate": month_start_df["is_profit"].mean() if len(month_start_df) > 0 else 0,
                    "avg_return": month_start_df["result"].mean() if len(month_start_df) > 0 else 0
                },
                "month_end": {
                    "count": len(month_end_df),
                    "win_rate": month_end_df["is_profit"].mean() if len(month_end_df) > 0 else 0,
                    "avg_return": month_end_df["result"].mean() if len(month_end_df) > 0 else 0
                }
            }
            
            return {
                "weekday_performance": weekday_performance,
                "hourly_performance": hourly_performance,
                "monthly_performance": monthly_performance,
                "month_edge_performance": month_edge_performance
            }
            
        except Exception as e:
            logger.error(f"시간 패턴 분석 중 오류 발생: {str(e)}")
            return {"error": str(e)}
    
    def _analyze_by_symbol(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        종목별 성과를 분석합니다.
        
        Args:
            df: 거래 데이터프레임
            
        Returns:
            Dict[str, Any]: 종목별 분석 결과
        """
        # 심볼 컬럼이 없으면 건너뜀
        if "symbol" not in df.columns or df["symbol"].isna().all():
            return {"message": "종목 데이터가 부족하여 종목별 분석을 건너뜁니다"}
        
        try:
            # 종목별 성과
            symbol_performance = {}
            
            for symbol in df["symbol"].unique():
                if not symbol:
                    continue
                    
                symbol_df = df[df["symbol"] == symbol]
                
                if len(symbol_df) > 0:
                    win_rate = symbol_df["is_profit"].mean()
                    total_return = symbol_df["result"].sum()
                    avg_return = symbol_df["result"].mean()
                    profit_count = symbol_df["is_profit"].sum()
                    loss_count = len(symbol_df) - profit_count
                    
                    symbol_performance[symbol] = {
                        "count": len(symbol_df),
                        "win_rate": win_rate,
                        "total_return": total_return,
                        "avg_return": avg_return,
                        "profit_count": int(profit_count),
                        "loss_count": int(loss_count)
                    }
            
            # 상위/하위 종목 추출
            if symbol_performance:
                sorted_symbols = sorted(
                    symbol_performance.items(),
                    key=lambda x: x[1]["win_rate"],
                    reverse=True
                )
                
                top_symbols = dict(sorted_symbols[:5])
                bottom_symbols = dict(sorted_symbols[-5:])
                
                # 거래량 많은 순
                most_traded = sorted(
                    symbol_performance.items(),
                    key=lambda x: x[1]["count"],
                    reverse=True
                )
                
                most_traded_symbols = dict(most_traded[:5])
                
                return {
                    "symbol_performance": symbol_performance,
                    "top_symbols": top_symbols,
                    "bottom_symbols": bottom_symbols,
                    "most_traded_symbols": most_traded_symbols
                }
            
            return {"message": "종목 데이터가 부족하여 종목별 분석 결과가 없습니다"}
            
        except Exception as e:
            logger.error(f"종목별 분석 중 오류 발생: {str(e)}")
            return {"error": str(e)}
    
    def generate_report(self, analysis_id: Optional[str] = None) -> str:
        """
        분석 보고서를 생성합니다.
        
        Args:
            analysis_id: 분석 ID (None이면 최신 분석 사용)
            
        Returns:
            str: 보고서 경로
        """
        # 분석 결과 로드
        analysis = None
        
        if analysis_id and analysis_id in self.analysis_results:
            analysis = self.analysis_results[analysis_id]
        elif analysis_id:
            analysis_data, _ = self.model_manager.load_data(analysis_id)
            if analysis_data:
                analysis = analysis_data
        else:
            # 최신 분석 사용
            if self.analysis_results:
                latest_id = max(self.analysis_results.keys())
                analysis = self.analysis_results[latest_id]
        
        if not analysis:
            logger.error("보고서 생성을 위한 분석 결과를 찾을 수 없습니다")
            return ""
        
        try:
            # 보고서 파일 경로 생성
            report_path = f"{self.output_dir}/trade_analysis_report_{datetime.now().strftime('%Y%m%d%H%M%S')}.json"
            
            # 디렉토리 생성
            import os
            os.makedirs(self.output_dir, exist_ok=True)
            
            # JSON 보고서 저장
            with open(report_path, 'w', encoding='utf-8') as f:
                json.dump(analysis, f, ensure_ascii=False, indent=2)
            
            logger.info(f"분석 보고서 생성 완료: {report_path}")
            return report_path
            
        except Exception as e:
            logger.error(f"보고서 생성 중 오류 발생: {str(e)}")
            return ""
    
    def extract_improvement_suggestions(self, analysis: Dict[str, Any]) -> List[str]:
        """
        분석 결과에서 개선 제안사항을 추출합니다.
        
        Args:
            analysis: 분석 결과
            
        Returns:
            List[str]: 개선 제안사항 목록
        """
        suggestions = []
        
        try:
            # 성과 지표 기반 제안
            performance = analysis.get("performance", {})
            
            # 승률이 낮을 경우
            win_rate = performance.get("win_rate", 0)
            if win_rate < 0.5:
                suggestions.append(f"승률이 낮습니다 ({win_rate:.2f}). 진입 조건을 더 엄격하게 설정하는 것이 좋습니다.")
            
            # 손실 평균이 이익 평균보다 클 경우
            win_avg = performance.get("win_avg", 0)
            loss_avg = performance.get("loss_avg", 0)
            
            if abs(loss_avg) > win_avg:
                suggestions.append(f"평균 손실({abs(loss_avg):.4f})이 평균 이익({win_avg:.4f})보다 큽니다. 손절 전략을 개선하세요.")
            
            # 최대 연속 손실이 클 경우
            max_loss_streak = performance.get("max_loss_streak", 0)
            if max_loss_streak > 5:
                suggestions.append(f"최대 연속 손실({max_loss_streak}회)이 많습니다. 위험 관리를 강화하세요.")
            
            # 시간 패턴 기반 제안
            time_analysis = analysis.get("time_analysis", {})
            weekday_performance = time_analysis.get("weekday_performance", {})
            
            # 요일별 성과가 극단적으로 다를 경우
            if weekday_performance:
                weekday_win_rates = [(day, data["win_rate"]) for day, data in weekday_performance.items()]
                best_day = max(weekday_win_rates, key=lambda x: x[1])
                worst_day = min(weekday_win_rates, key=lambda x: x[1])
                
                if best_day[1] - worst_day[1] > 0.3:  # 30% 이상 차이
                    day_names = ["월", "화", "수", "목", "금", "토", "일"]
                    suggestions.append(f"{day_names[int(worst_day[0])]}요일의 승률({worst_day[1]:.2f})이 낮습니다. 해당 날짜의 거래를 줄이는 것이 좋습니다.")
            
            # 종목별 분석 기반 제안
            symbol_analysis = analysis.get("symbol_analysis", {})
            bottom_symbols = symbol_analysis.get("bottom_symbols", {})
            
            if bottom_symbols:
                worst_symbols = list(bottom_symbols.keys())[:3]
                if worst_symbols:
                    suggestions.append(f"다음 종목들의 성과가 좋지 않습니다: {', '.join(worst_symbols)}. 해당 종목들에 대한 전략을 개선하거나 제외하세요.")
            
            # 클러스터 분석 기반 제안
            patterns = analysis.get("patterns", {})
            clusters = patterns.get("clusters", [])
            
            best_cluster = None
            worst_cluster = None
            
            for cluster in clusters:
                if cluster.get("size", 0) > 5:  # 충분한 샘플이 있는 클러스터만 고려
                    if best_cluster is None or cluster.get("win_rate", 0) > best_cluster.get("win_rate", 0):
                        best_cluster = cluster
                    
                    if worst_cluster is None or cluster.get("win_rate", 0) < worst_cluster.get("win_rate", 0):
                        worst_cluster = cluster
            
            if best_cluster and worst_cluster and best_cluster["cluster_id"] != worst_cluster["cluster_id"]:
                # 최고 클러스터의 주요 특성 찾기
                best_features = best_cluster.get("feature_importance", {})
                worst_features = worst_cluster.get("feature_importance", {})
                
                if best_features and worst_features:
                    # 특성 중요도 비교
                    feature_diff = {}
                    for feature in best_features:
                        if feature in worst_features:
                            feature_diff[feature] = best_features[feature] - worst_features[feature]
                    
                    # 가장 차이가 큰 특성
                    if feature_diff:
                        most_diff_feature = max(feature_diff.items(), key=lambda x: abs(x[1]))
                        suggestions.append(f"'{most_diff_feature[0]}' 지표가 거래 성공과 실패를 구분하는 중요한 특성입니다. 이 지표에 더 집중하세요.")
            
            return suggestions
            
        except Exception as e:
            logger.error(f"개선 제안 추출 중 오류 발생: {str(e)}")
            return ["분석 중 오류가 발생했습니다"] 