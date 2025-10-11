import asyncio
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import xgboost as xgb
import lightgbm as lgb
import joblib
import logging
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class MLPipeline:
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.feature_importance = {}
        self.model_performance = {}
        
    async def train_ensemble_model(self, training_data: List[Dict], target_column: str = 'trust_score') -> Dict:
        """Train an ensemble model for trust score prediction"""
        try:
            # Prepare data
            df = self._prepare_training_data(training_data, target_column)
            
            if df.empty:
                raise ValueError("No valid training data available")
            
            # Split features and target
            X = df.drop(columns=[target_column])
            y = df[target_column]
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # Scale features
            self.scalers['standard'] = StandardScaler()
            X_train_scaled = self.scalers['standard'].fit_transform(X_train)
            X_test_scaled = self.scalers['standard'].transform(X_test)
            
            # Train multiple models
            models = {
                'random_forest': RandomForestRegressor(
                    n_estimators=100,
                    max_depth=10,
                    random_state=42,
                    n_jobs=-1
                ),
                'gradient_boosting': GradientBoostingRegressor(
                    n_estimators=100,
                    max_depth=6,
                    random_state=42
                ),
                'xgboost': xgb.XGBRegressor(
                    n_estimators=100,
                    max_depth=6,
                    learning_rate=0.1,
                    random_state=42,
                    n_jobs=-1
                ),
                'lightgbm': lgb.LGBMRegressor(
                    n_estimators=100,
                    max_depth=6,
                    learning_rate=0.1,
                    random_state=42,
                    n_jobs=-1
                )
            }
            
            # Train and evaluate models
            best_score = -np.inf
            best_model_name = None
            
            for name, model in models.items():
                logger.info(f"Training {name}...")
                
                # Train model
                model.fit(X_train_scaled, y_train)
                
                # Predict and evaluate
                y_pred = model.predict(X_test_scaled)
                score = r2_score(y_test, y_pred)
                
                # Store model and performance
                self.models[name] = model
                self.model_performance[name] = {
                    'r2_score': score,
                    'mse': mean_squared_error(y_test, y_pred),
                    'mae': mean_absolute_error(y_test, y_pred),
                    'feature_importance': self._get_feature_importance(model, X.columns)
                }
                
                # Track best model
                if score > best_score:
                    best_score = score
                    best_model_name = name
            
            # Create ensemble model (weighted average)
            self.models['ensemble'] = self._create_ensemble_model()
            
            # Final evaluation
            ensemble_pred = self._predict_ensemble(X_test_scaled)
            ensemble_score = r2_score(y_test, ensemble_pred)
            
            self.model_performance['ensemble'] = {
                'r2_score': ensemble_score,
                'mse': mean_squared_error(y_test, ensemble_pred),
                'mae': mean_absolute_error(y_test, ensemble_pred),
                'weights': self._get_ensemble_weights()
            }
            
            logger.info(f"Ensemble training completed. Best model: {best_model_name} (R²: {best_score:.3f})")
            
            return {
                'best_model': best_model_name,
                'ensemble_score': ensemble_score,
                'model_performance': self.model_performance,
                'training_size': len(training_data),
                'feature_count': X.shape[1]
            }
            
        except Exception as e:
            logger.error(f"Error training ensemble model: {e}")
            raise
    
    async def predict_trust_score(self, user_data: Dict) -> Dict:
        """Predict trust score using trained ensemble model"""
        try:
            if 'ensemble' not in self.models:
                raise ValueError("No trained model available. Please train the model first.")
            
            # Prepare features
            features = self._extract_features(user_data)
            feature_vector = self._create_feature_vector(features)
            
            if feature_vector is None:
                return {
                    'predicted_score': 50.0,  # Default score
                    'confidence': 0.0,
                    'model_used': 'default',
                    'features_used': 0
                }
            
            # Scale features
            feature_vector_scaled = self.scalers['standard'].transform([feature_vector])
            
            # Get predictions from all models
            predictions = {}
            for name, model in self.models.items():
                if name != 'ensemble':
                    predictions[name] = float(model.predict(feature_vector_scaled)[0])
            
            # Ensemble prediction
            ensemble_pred = self._predict_ensemble(feature_vector_scaled)
            final_score = float(ensemble_pred[0])
            
            # Calculate confidence based on model agreement
            confidence = self._calculate_prediction_confidence(predictions, final_score)
            
            return {
                'predicted_score': max(0, min(100, final_score)),
                'confidence': confidence,
                'model_used': 'ensemble',
                'features_used': len(feature_vector),
                'individual_predictions': predictions,
                'feature_importance': self._get_top_features(features)
            }
            
        except Exception as e:
            logger.error(f"Error predicting trust score: {e}")
            return {
                'predicted_score': 50.0,
                'confidence': 0.0,
                'model_used': 'error_fallback',
                'features_used': 0
            }
    
    async def incremental_learning(self, new_data: List[Dict], target_column: str = 'trust_score'):
        """Update models with new data (incremental learning)"""
        try:
            if not self.models:
                await self.train_ensemble_model(new_data, target_column)
                return
            
            # Prepare new data
            df_new = self._prepare_training_data(new_data, target_column)
            
            if df_new.empty:
                logger.warning("No valid new data for incremental learning")
                return
            
            # Update models with new data
            X_new = df_new.drop(columns=[target_column])
            y_new = df_new[target_column]
            
            X_new_scaled = self.scalers['standard'].transform(X_new)
            
            for name, model in self.models.items():
                if name != 'ensemble' and hasattr(model, 'partial_fit'):
                    try:
                        model.partial_fit(X_new_scaled, y_new)
                        logger.info(f"Updated model {name} with new data")
                    except Exception as e:
                        logger.warning(f"Could not update model {name}: {e}")
            
            logger.info("Incremental learning completed")
            
        except Exception as e:
            logger.error(f"Error in incremental learning: {e}")
    
    def _prepare_training_data(self, data: List[Dict], target_column: str) -> pd.DataFrame:
        """Prepare training data from raw user data"""
        try:
            records = []
            
            for user_data in data:
                try:
                    features = self._extract_features(user_data)
                    if features and target_column in user_data:
                        feature_vector = self._create_feature_vector(features)
                        if feature_vector is not None:
                            record = feature_vector.copy()
                            record[target_column] = user_data[target_column]
                            records.append(record)
                except Exception as e:
                    logger.warning(f"Error processing user data: {e}")
                    continue
            
            if not records:
                return pd.DataFrame()
            
            df = pd.DataFrame(records)
            
            # Handle missing values
            df = df.fillna(df.median())
            
            return df
            
        except Exception as e:
            logger.error(f"Error preparing training data: {e}")
            return pd.DataFrame()
    
    def _extract_features(self, user_data: Dict) -> Dict:
        """Extract features from user data"""
        features = {}
        
        try:
            # GitHub features
            github_data = user_data.get('github', {})
            features.update({
                'github_commit_frequency': github_data.get('commit_frequency', 0),
                'github_repo_count': github_data.get('repo_count', 0),
                'github_follower_count': github_data.get('follower_count', 0),
                'github_account_age_days': github_data.get('account_age_days', 0),
                'github_star_count': github_data.get('star_count', 0),
                'github_fork_count': github_data.get('fork_count', 0),
            })
            
            # LinkedIn features
            linkedin_data = user_data.get('linkedin', {})
            features.update({
                'linkedin_connection_count': linkedin_data.get('connection_count', 0),
                'linkedin_endorsement_count': linkedin_data.get('endorsement_count', 0),
                'linkedin_experience_years': linkedin_data.get('experience_years', 0),
                'linkedin_skill_count': linkedin_data.get('skill_count', 0),
                'linkedin_recommendation_count': linkedin_data.get('recommendation_count', 0),
            })
            
            # On-chain features
            on_chain_data = user_data.get('on_chain', {})
            features.update({
                'on_chain_transaction_count': on_chain_data.get('transaction_count', 0),
                'on_chain_nft_holdings': on_chain_data.get('nft_holdings', 0),
                'on_chain_defi_activity': on_chain_data.get('defi_activity', 0),
                'on_chain_governance_participation': on_chain_data.get('governance_participation', 0),
                'on_chain_wallet_age_days': on_chain_data.get('wallet_age_days', 0),
            })
            
            # Behavioral features
            behavior_data = user_data.get('behavior', {})
            features.update({
                'behavior_anomaly_score': behavior_data.get('anomaly_score', 0),
                'behavior_consistency': behavior_data.get('behavior_consistency', 0),
                'behavior_risk_level': self._encode_risk_level(behavior_data.get('risk_level', 'low')),
            })
            
            # Social network features
            social_data = user_data.get('social_network', {})
            features.update({
                'social_network_size': social_data.get('network_size', 0),
                'social_influence_score': social_data.get('influence_score', 0),
                'social_connection_quality': social_data.get('connection_quality', 0),
                'social_network_diversity': social_data.get('network_diversity', 0),
                'social_capital': social_data.get('social_capital', 0),
            })
            
            # Derived features
            features.update(self._create_derived_features(features))
            
        except Exception as e:
            logger.error(f"Error extracting features: {e}")
        
        return features
    
    def _create_feature_vector(self, features: Dict) -> Optional[List[float]]:
        """Create a feature vector from extracted features"""
        try:
            # Define feature order (should be consistent with training)
            feature_order = [
                'github_commit_frequency', 'github_repo_count', 'github_follower_count',
                'github_account_age_days', 'github_star_count', 'github_fork_count',
                'linkedin_connection_count', 'linkedin_endorsement_count', 'linkedin_experience_years',
                'linkedin_skill_count', 'linkedin_recommendation_count',
                'on_chain_transaction_count', 'on_chain_nft_holdings', 'on_chain_defi_activity',
                'on_chain_governance_participation', 'on_chain_wallet_age_days',
                'behavior_anomaly_score', 'behavior_consistency', 'behavior_risk_level',
                'social_network_size', 'social_influence_score', 'social_connection_quality',
                'social_network_diversity', 'social_capital',
                'composite_activity_score', 'platform_diversity', 'engagement_velocity'
            ]
            
            vector = []
            for feature in feature_order:
                vector.append(features.get(feature, 0.0))
            
            return vector
            
        except Exception as e:
            logger.error(f"Error creating feature vector: {e}")
            return None
    
    def _create_derived_features(self, features: Dict) -> Dict:
        """Create derived features from basic features"""
        derived = {}
        
        try:
            # Composite activity score
            github_activity = features.get('github_commit_frequency', 0) * 0.3 + features.get('github_repo_count', 0) * 0.2
            linkedin_activity = features.get('linkedin_connection_count', 0) * 0.1 + features.get('linkedin_endorsement_count', 0) * 0.2
            on_chain_activity = features.get('on_chain_transaction_count', 0) * 0.2
            derived['composite_activity_score'] = github_activity + linkedin_activity + on_chain_activity
            
            # Platform diversity
            platforms_used = sum(1 for platform in ['github', 'linkedin', 'on_chain'] 
                               if features.get(f'{platform}_commit_frequency', 0) > 0 or 
                                  features.get(f'{platform}_connection_count', 0) > 0)
            derived['platform_diversity'] = platforms_used / 3.0
            
            # Engagement velocity (recent activity emphasis)
            recent_activity = min(1.0, features.get('github_commit_frequency', 0) / 30.0)  # Normalize
            derived['engagement_velocity'] = recent_activity
            
        except Exception as e:
            logger.error(f"Error creating derived features: {e}")
        
        return derived
    
    def _encode_risk_level(self, risk_level: str) -> float:
        """Encode risk level as numerical value"""
        risk_map = {
            'low': 0.0,
            'medium': 0.5,
            'high': 1.0
        }
        return risk_map.get(risk_level.lower(), 0.0)
    
    def _create_ensemble_model(self):
        """Create ensemble model wrapper"""
        class EnsembleModel:
            def __init__(self, models, weights):
                self.models = models
                self.weights = weights
            
            def predict(self, X):
                predictions = []
                for name, model in self.models.items():
                    if name != 'ensemble':
                        pred = model.predict(X)
                        predictions.append(pred * self.weights[name])
                return np.sum(predictions, axis=0)
        
        # Calculate weights based on model performance
        weights = {}
        total_performance = 0
        
        for name, performance in self.model_performance.items():
            if name != 'ensemble':
                # Use R² score as weight (ensure positive)
                weight = max(0, performance['r2_score'])
                weights[name] = weight
                total_performance += weight
        
        # Normalize weights
        if total_performance > 0:
            for name in weights:
                weights[name] /= total_performance
        else:
            # Equal weights if no positive performance
            model_count = len([n for n in self.models.keys() if n != 'ensemble'])
            for name in weights:
                weights[name] = 1.0 / model_count
        
        return EnsembleModel(self.models, weights)
    
    def _predict_ensemble(self, X):
        """Make prediction using ensemble model"""
        return self.models['ensemble'].predict(X)
    
    def _get_ensemble_weights(self):
        """Get ensemble model weights"""
        if hasattr(self.models['ensemble'], 'weights'):
            return self.models['ensemble'].weights
        return {}
    
    def _get_feature_importance(self, model, feature_names):
        """Get feature importance from model"""
        try:
            if hasattr(model, 'feature_importances_'):
                importance = model.feature_importances_
                return dict(zip(feature_names, importance))
            elif hasattr(model, 'coef_'):
                importance = np.abs(model.coef_)
                return dict(zip(feature_names, importance))
            else:
                return {}
        except:
            return {}
    
    def _calculate_prediction_confidence(self, predictions: Dict, ensemble_pred: float) -> float:
        """Calculate prediction confidence based on model agreement"""
        try:
            if not predictions:
                return 0.0
            
            predictions_list = list(predictions.values())
            std_dev = np.std(predictions_list)
            mean_pred = np.mean(predictions_list)
            
            # Confidence is higher when models agree (low std dev)
            # and when prediction is not extreme
            agreement_confidence = max(0, 1 - (std_dev / 10))  # Normalize
            extremity_confidence = 1 - abs(mean_pred - 50) / 50  # Confidence lower for extreme values
            
            confidence = (agreement_confidence + extremity_confidence) / 2
            return min(1.0, max(0.0, confidence))
            
        except:
            return 0.5
    
    def _get_top_features(self, features: Dict, top_n: int = 5) -> List[Dict]:
        """Get top contributing features for a prediction"""
        try:
            if not self.feature_importance:
                return []
            
            # Use feature importance from best model
            best_model = max(self.model_performance.items(), key=lambda x: x[1]['r2_score'])[0]
            importance_dict = self.model_performance[best_model].get('feature_importance', {})
            
            # Get top features
            top_features = sorted(
                importance_dict.items(),
                key=lambda x: x[1],
                reverse=True
            )[:top_n]
            
            return [
                {
                    'feature': feature,
                    'importance': importance,
                    'value': features.get(feature, 0)
                }
                for feature, importance in top_features
            ]
            
        except Exception as e:
            logger.error(f"Error getting top features: {e}")
            return []
    
    async def save_models(self, filepath: str):
        """Save trained models to disk"""
        try:
            model_data = {
                'models': self.models,
                'scalers': self.scalers,
                'encoders': self.encoders,
                'feature_importance': self.feature_importance,
                'model_performance': self.model_performance,
                'timestamp': datetime.now().isoformat()
            }
            
            joblib.dump(model_data, filepath)
            logger.info(f"Models saved to {filepath}")
            
        except Exception as e:
            logger.error(f"Error saving models: {e}")
            raise
    
    async def load_models(self, filepath: str):
        """Load trained models from disk"""
        try:
            model_data = joblib.load(filepath)
            
            self.models = model_data['models']
            self.scalers = model_data['scalers']
            self.encoders = model_data['encoders']
            self.feature_importance = model_data['feature_importance']
            self.model_performance = model_data['model_performance']
            
            logger.info(f"Models loaded from {filepath}")
            
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            raise
    
    def get_model_info(self) -> Dict:
        """Get information about trained models"""
        return {
            'trained_models': list(self.models.keys()),
            'model_performance': self.model_performance,
            'feature_count': len(self.scalers.get('standard', {}).get('feature_names_in_', [])),
            'last_training_time': getattr(self, 'last_training_time', None)
        }