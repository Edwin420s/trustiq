import numpy as np
import pandas as pd
from typing import Dict, List, Optional
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
from datetime import datetime, timedelta
import logging
import asyncio

logger = logging.getLogger(__name__)

class AdvancedAnalyzer:
    def __init__(self):
        self.scaler = StandardScaler()
        self.cluster_models = {}
        
    async def analyze_behavior_patterns(self, user_data: Dict, historical_data: List[Dict]) -> Dict:
        """Analyze user behavior patterns for anomaly detection"""
        try:
            features = self._extract_behavior_features(user_data, historical_data)
            
            statistical_anomalies = self._detect_statistical_anomalies(features)
            temporal_anomalies = await self._detect_temporal_anomalies(historical_data)
            cluster_anomalies = self._detect_cluster_anomalies(features)
            
            anomaly_score = (
                statistical_anomalies * 0.4 +
                temporal_anomalies * 0.3 +
                cluster_anomalies * 0.3
            )
            
            return {
                'anomaly_score': anomaly_score,
                'statistical_anomalies': statistical_anomalies,
                'temporal_anomalies': temporal_anomalies,
                'cluster_anomalies': cluster_anomalies,
                'behavior_consistency': 1 - anomaly_score,
                'risk_level': self._calculate_risk_level(anomaly_score)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing behavior patterns: {e}")
            return {
                'anomaly_score': 0.0,
                'statistical_anomalies': 0.0,
                'temporal_anomalies': 0.0,
                'cluster_anomalies': 0.0,
                'behavior_consistency': 1.0,
                'risk_level': 'low'
            }
    
    async def analyze_social_network(self, user_connections: List[Dict]) -> Dict:
        """Analyze social network structure and influence"""
        try:
            if not user_connections:
                return {
                    'network_size': 0,
                    'influence_score': 0.0,
                    'connection_quality': 0.0,
                    'network_diversity': 0.0
                }
                
            network_size = len(user_connections)
            influence_score = self._calculate_influence_score(user_connections)
            connection_quality = self._calculate_connection_quality(user_connections)
            network_diversity = self._calculate_network_diversity(user_connections)
            
            return {
                'network_size': network_size,
                'influence_score': influence_score,
                'connection_quality': connection_quality,
                'network_diversity': network_diversity,
                'social_capital': (influence_score + connection_quality + network_diversity) / 3
            }
            
        except Exception as e:
            logger.error(f"Error analyzing social network: {e}")
            return {
                'network_size': 0,
                'influence_score': 0.0,
                'connection_quality': 0.0,
                'network_diversity': 0.0,
                'social_capital': 0.0
            }
    
    async def predict_score_trend(self, historical_scores: List[float]) -> Dict:
        """Predict future trust score trends"""
        try:
            if len(historical_scores) < 5:
                return {
                    'predicted_score': historical_scores[-1] if historical_scores else 50.0,
                    'trend': 'stable',
                    'confidence': 0.5,
                    'momentum': 0.0
                }
           
            x = np.arange(len(historical_scores))
            y = np.array(historical_scores)

            z = np.polyfit(x, y, 1)
            trend_slope = z[0]
            
            # Predict next score
            predicted_score = np.poly1d(z)(len(historical_scores))
            predicted_score = max(0, min(100, predicted_score))
            
            # Calculate momentum (recent change rate)
            recent_scores = historical_scores[-5:]
            momentum = (recent_scores[-1] - recent_scores[0]) / len(recent_scores)
            
            # Determine trend direction
            if abs(trend_slope) < 0.1:
                trend = 'stable'
            elif trend_slope > 0:
                trend = 'improving'
            else:
                trend = 'declining'
            
            # Calculate confidence based on data consistency
            confidence = min(0.9, len(historical_scores) / 20)
            
            return {
                'predicted_score': float(predicted_score),
                'trend': trend,
                'confidence': confidence,
                'momentum': momentum,
                'trend_strength': abs(trend_slope)
            }
            
        except Exception as e:
            logger.error(f"Error predicting score trend: {e}")
            return {
                'predicted_score': historical_scores[-1] if historical_scores else 50.0,
                'trend': 'stable',
                'confidence': 0.5,
                'momentum': 0.0,
                'trend_strength': 0.0
            }
    
    def _extract_behavior_features(self, user_data: Dict, historical_data: List[Dict]) -> np.ndarray:
        """Extract features for behavior analysis"""
        features = []
        
        # Activity frequency features
        if historical_data:
            activity_dates = [pd.to_datetime(data.get('timestamp')) for data in historical_data]
            activity_dates.sort()
            
            if len(activity_dates) > 1:
                time_diffs = [(activity_dates[i+1] - activity_dates[i]).total_seconds() 
                             for i in range(len(activity_dates)-1)]
                avg_frequency = np.mean(time_diffs) if time_diffs else 0
                frequency_std = np.std(time_diffs) if time_diffs else 0
            else:
                avg_frequency = 0
                frequency_std = 0
        else:
            avg_frequency = 0
            frequency_std = 0
        
        features.extend([avg_frequency, frequency_std])
        
        # Platform usage features
        platforms_used = len(set(data.get('platform', '') for data in historical_data))
        features.append(platforms_used)
        
        # Content features (simplified)
        avg_content_length = np.mean([len(str(data.get('content', ''))) for data in historical_data])
        features.append(avg_content_length)
        
        return np.array(features).reshape(1, -1)
    
    def _detect_statistical_anomalies(self, features: np.ndarray) -> float:
        """Detect anomalies using statistical methods"""
        try:
            if np.all(features == 0):
                return 0.0
            
            # Z-score based anomaly detection
            features_scaled = self.scaler.fit_transform(features)
            z_scores = np.abs(features_scaled)
            max_z_score = np.max(z_scores)
            
            # Normalize to 0-1 range
            anomaly_score = min(1.0, max_z_score / 3.0)
            return anomaly_score
            
        except Exception as e:
            logger.error(f"Error in statistical anomaly detection: {e}")
            return 0.0
    
    async def _detect_temporal_anomalies(self, historical_data: List[Dict]) -> float:
        """Detect temporal pattern anomalies"""
        try:
            if len(historical_data) < 3:
                return 0.0
            
            # Analyze temporal patterns
            timestamps = [pd.to_datetime(data.get('timestamp')) for data in historical_data]
            timestamps.sort()
            
            # Calculate time between activities
            time_diffs = [(timestamps[i+1] - timestamps[i]).total_seconds() 
                         for i in range(len(timestamps)-1)]
            
            if not time_diffs:
                return 0.0
            
            # Detect unusual gaps or bursts
            avg_gap = np.mean(time_diffs)
            std_gap = np.std(time_diffs)
            
            # Count outliers (beyond 2 standard deviations)
            outliers = sum(1 for gap in time_diffs if abs(gap - avg_gap) > 2 * std_gap)
            anomaly_ratio = outliers / len(time_diffs)
            
            return min(1.0, anomaly_ratio * 2)  # Scale to 0-1
            
        except Exception as e:
            logger.error(f"Error in temporal anomaly detection: {e}")
            return 0.0
    
    def _detect_cluster_anomalies(self, features: np.ndarray) -> float:
        """Detect anomalies using clustering"""
        try:
            if features.shape[1] == 0 or np.all(features == 0):
                return 0.0
            
            # Use DBSCAN for outlier detection
            clustering = DBSCAN(eps=0.5, min_samples=2)
            labels = clustering.fit_predict(features)
            
            # If point is labeled as -1, it's an outlier
            is_outlier = 1.0 if labels[0] == -1 else 0.0
            
            return is_outlier
            
        except Exception as e:
            logger.error(f"Error in cluster anomaly detection: {e}")
            return 0.0
    
    def _calculate_risk_level(self, anomaly_score: float) -> str:
        """Calculate risk level based on anomaly score"""
        if anomaly_score < 0.3:
            return 'low'
        elif anomaly_score < 0.7:
            return 'medium'
        else:
            return 'high'
    
    def _calculate_influence_score(self, connections: List[Dict]) -> float:
        """Calculate user influence score based on connections"""
        if not connections:
            return 0.0
        
        # Simple influence calculation based on connection metrics
        total_followers = sum(conn.get('followers', 0) for conn in connections)
        total_engagement = sum(conn.get('engagement_rate', 0) for conn in connections)
        
        influence = (total_followers * 0.0001 + total_engagement * 10) / len(connections)
        return min(1.0, influence)
    
    def _calculate_connection_quality(self, connections: List[Dict]) -> float:
        """Calculate quality of connections"""
        if not connections:
            return 0.0
        
        # Calculate based on verification status and activity
        verified_ratio = sum(1 for conn in connections if conn.get('verified', False)) / len(connections)
        active_ratio = sum(1 for conn in connections if conn.get('active', False)) / len(connections)
        
        return (verified_ratio + active_ratio) / 2
    
    def _calculate_network_diversity(self, connections: List[Dict]) -> float:
        """Calculate diversity of social network"""
        if not connections:
            return 0.0
        
        # Calculate based on platform diversity and connection types
        platforms = set(conn.get('platform', '') for conn in connections)
        platform_diversity = len(platforms) / 5  # Normalize by max expected platforms
        
        connection_types = set(conn.get('type', '') for conn in connections)
        type_diversity = len(connection_types) / 3  # Normalize by max expected types
        
        return (platform_diversity + type_diversity) / 2
