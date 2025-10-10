import numpy as np
from typing import Dict, List, Tuple
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import logging

from ..models.trust_score import TrustScore, ScoreBreakdown

logger = logging.getLogger(__name__)

class TrustScorer:
    def __init__(self):
        self.scaler = StandardScaler()
        self.anomaly_detector = IsolationForest(contamination=0.1, random_state=42)
        self.weights = {
            'consistency': 0.25,
            'skill_depth': 0.30,
            'peer_validation': 0.25,
            'engagement_quality': 0.20
        }
    
    def calculate_score(self, analysis_results: Dict) -> TrustScore:
        """Calculate overall trust score from analysis results"""
        try:
            # Extract features for scoring
            features = self._extract_features(analysis_results)
            
            # Calculate component scores
            consistency_score = self._calculate_consistency(features)
            skill_score = self._calculate_skill_depth(features)
            peer_score = self._calculate_peer_validation(features)
            engagement_score = self._calculate_engagement_quality(features)
            
            # Apply anomaly detection
            anomaly_factor = self._detect_anomalies(features)
            
            # Calculate weighted score
            base_score = (
                consistency_score * self.weights['consistency'] +
                skill_score * self.weights['skill_depth'] +
                peer_score * self.weights['peer_validation'] +
                engagement_score * self.weights['engagement_quality']
            )
            
            # Adjust for anomalies
            final_score = base_score * (1 - anomaly_factor * 0.3)
            final_score = max(0, min(100, final_score))
            
            breakdown = ScoreBreakdown(
                consistency=consistency_score,
                skill_depth=skill_score,
                peer_validation=peer_score,
                engagement_quality=engagement_score,
                anomaly_factor=anomaly_factor
            )
            
            return TrustScore(score=final_score, breakdown=breakdown)
            
        except Exception as e:
            logger.error(f"Error calculating trust score: {e}")
            return TrustScore(score=50, breakdown=ScoreBreakdown())
    
    def _extract_features(self, analysis_results: Dict) -> np.ndarray:
        """Extract numerical features from analysis results"""
        features = []
        
        # GitHub features
        github_data = analysis_results.get('github', {})
        features.extend([
            github_data.get('commit_frequency', 0),
            github_data.get('repo_count', 0),
            github_data.get('follower_count', 0),
            github_data.get('account_age_days', 0),
        ])
        
        # LinkedIn features
        linkedin_data = analysis_results.get('linkedin', {})
        features.extend([
            linkedin_data.get('connection_count', 0),
            linkedin_data.get('endorsement_count', 0),
            linkedin_data.get('experience_years', 0),
        ])
        
        return np.array(features).reshape(1, -1)
    
    def _calculate_consistency(self, features: np.ndarray) -> float:
        """Calculate consistency score based on activity patterns"""
        commit_freq = features[0, 0]
        account_age = features[0, 3]
        
        if account_age == 0:
            return 50.0
            
        consistency = (commit_freq / (account_age / 30)) * 10  # Normalize
        return min(100, max(0, consistency * 10))
    
    def _calculate_skill_depth(self, features: np.ndarray) -> float:
        """Calculate skill depth based on repositories and experience"""
        repo_count = features[0, 1]
        experience_years = features[0, 6]
        
        skill_score = (repo_count * 2) + (experience_years * 10)
        return min(100, skill_score)
    
    def _calculate_peer_validation(self, features: np.ndarray) -> float:
        """Calculate peer validation score"""
        followers = features[0, 2]
        connections = features[0, 4]
        endorsements = features[0, 5]
        
        peer_score = (followers * 0.5) + (connections * 0.3) + (endorsements * 0.2)
        return min(100, peer_score * 0.1)
    
    def _calculate_engagement_quality(self, features: np.ndarray) -> float:
        """Calculate engagement quality score"""
        # Simple implementation - can be enhanced with NLP
        base_engagement = np.mean(features[0, :4])
        return min(100, base_engagement * 5)
    
    def _detect_anomalies(self, features: np.ndarray) -> float:
        """Detect anomalous patterns in user data"""
        try:
            # Fit scaler and anomaly detector (in production, this would be pre-trained)
            features_scaled = self.scaler.fit_transform(features)
            anomaly_scores = self.anomaly_detector.fit_predict(features_scaled)
            
            # Return anomaly factor (0 = normal, 1 = highly anomalous)
            return 1.0 if anomaly_scores[0] == -1 else 0.0
            
        except Exception as e:
            logger.warning(f"Anomaly detection failed: {e}")
            return 0.0
    
    def generate_insights(self, analysis_results: Dict, trust_score: TrustScore) -> List[str]:
        """Generate human-readable insights from the score"""
        insights = []
        breakdown = trust_score.breakdown
        
        if breakdown.consistency < 30:
            insights.append("Your activity consistency is low. Consider maintaining regular contributions.")
        
        if breakdown.skill_depth > 80:
            insights.append("Strong skill depth detected across multiple platforms.")
        
        if breakdown.peer_validation < 40:
            insights.append("Peer validation could be improved through more community engagement.")
        
        if breakdown.anomaly_factor > 0.5:
            insights.append("Unusual activity patterns detected. Please verify your account information.")
        
        if trust_score.score > 80:
            insights.append("Excellent trust score! Your digital reputation is strong.")
        elif trust_score.score < 40:
            insights.append("Trust score needs improvement. Focus on verified contributions and engagement.")
        
        return insights