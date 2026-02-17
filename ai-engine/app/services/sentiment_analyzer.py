import aiohttp
import asyncio
from typing import List, Dict, Optional
import logging
from textblob import TextBlob
import re

logger = logging.getLogger(__name__)

class SentimentAnalyzer:
    def __init__(self):
        self.session = None
    
    async def analyze_content_sentiment(self, content: str) -> Dict:
        """Analyze sentiment of text content"""
        try:
            # Clean and preprocess text 
            cleaned_text = self._clean_text(content)
            
            if not cleaned_text:
                return {
                    'polarity': 0.0,
                    'subjectivity': 0.0,
                    'sentiment': 'neutral',
                    'confidence': 0.0
                }
            
            # Analyze with TextBlob
            blob = TextBlob(cleaned_text)
            polarity = blob.sentiment.polarity
            subjectivity = blob.sentiment.subjectivity
            
            # Determine sentiment category
            if polarity > 0.1:
                sentiment = 'positive'
            elif polarity < -0.1:
                sentiment = 'negative'
            else:
                sentiment = 'neutral'
            
            # Calculate confidence based on polarity strength
            confidence = min(1.0, abs(polarity) * 2)
            
            return {
                'polarity': float(polarity),
                'subjectivity': float(subjectivity),
                'sentiment': sentiment,
                'confidence': confidence,
                'word_count': len(cleaned_text.split())
            }
            
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {e}")
            return {
                'polarity': 0.0,
                'subjectivity': 0.0,
                'sentiment': 'neutral',
                'confidence': 0.0,
                'word_count': 0
            }
    
    async def analyze_contribution_quality(self, contributions: List[Dict]) -> Dict:
        """Analyze quality of user contributions"""
        try:
            if not contributions:
                return {
                    'quality_score': 0.0,
                    'consistency': 0.0,
                    'impact': 0.0,
                    'engagement': 0.0
                }
            
            quality_scores = []
            sentiment_scores = []
            engagement_metrics = []
            
            for contribution in contributions:
                # Analyze content quality
                content_quality = await self._analyze_contribution_quality(contribution)
                quality_scores.append(content_quality)
                
                # Analyze sentiment if content exists
                if 'content' in contribution:
                    sentiment = await self.analyze_content_sentiment(contribution['content'])
                    sentiment_scores.append(sentiment['polarity'])
                
                # Track engagement metrics
                engagement = contribution.get('engagement', 0)
                engagement_metrics.append(engagement)
            
            # Calculate overall quality metrics
            avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 0.0
            avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0.0
            avg_engagement = sum(engagement_metrics) / len(engagement_metrics) if engagement_metrics else 0.0
            
            # Calculate consistency (lower std dev = higher consistency)
            quality_std = np.std(quality_scores) if quality_scores else 1.0
            consistency = max(0.0, 1.0 - quality_std)
            
            # Calculate impact (combination of quality and engagement)
            impact = (avg_quality + avg_engagement) / 2
            
            return {
                'quality_score': avg_quality,
                'consistency': consistency,
                'impact': impact,
                'engagement': avg_engagement,
                'sentiment_bias': avg_sentiment,
                'contribution_count': len(contributions)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing contribution quality: {e}")
            return {
                'quality_score': 0.0,
                'consistency': 0.0,
                'impact': 0.0,
                'engagement': 0.0,
                'sentiment_bias': 0.0,
                'contribution_count': 0
            }
    
    async def _analyze_contribution_quality(self, contribution: Dict) -> float:
        """Analyze quality of a single contribution"""
        try:
            quality_score = 0.0
            
            # Content length analysis
            content = contribution.get('content', '')
            if content:
                word_count = len(content.split())
                if word_count > 50:  # Substantial content
                    quality_score += 0.3
                elif word_count > 10:  # Meaningful content
                    quality_score += 0.1
            
            # Engagement metrics
            engagement = contribution.get('engagement', 0)
            if engagement > 100:
                quality_score += 0.4
            elif engagement > 10:
                quality_score += 0.2
            elif engagement > 0:
                quality_score += 0.1
            
            # Recency bonus
            recency = contribution.get('recency', 0)
            if recency > 0.8:  # Recent activity
                quality_score += 0.2
            
            # Platform-specific quality indicators
            platform = contribution.get('platform', '')
            if platform in ['github', 'stackoverflow']:
                quality_score += 0.1
            
            return min(1.0, quality_score)
            
        except Exception as e:
            logger.error(f"Error analyzing single contribution quality: {e}")
            return 0.0
    
    def _clean_text(self, text: str) -> str:
        """Clean and preprocess text for analysis"""
        if not text:
            return ""
        
        # Remove URLs
        text = re.sub(r'http\S+', '', text)
        
        # Remove special characters and extra whitespace
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        
        # Convert to lowercase
        text = text.lower().strip()
        
        return text
    
    async def close(self):
        """Close the session"""
        if self.session:
            await self.session.close()
