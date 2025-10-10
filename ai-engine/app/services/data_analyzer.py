import aiohttp
import asyncio
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

class DataAnalyzer:
    def __init__(self):
        self.session = None

    async def analyze_user_data(self, accounts_data: Dict, on_chain_data: Optional[Dict] = None) -> Dict:
        analysis_results = {}
        
        try:
            # Analyze GitHub data if available
            if 'github' in accounts_data:
                analysis_results['github'] = await self.analyze_github_data(accounts_data['github'])
            
            # Analyze LinkedIn data if available
            if 'linkedin' in accounts_data:
                analysis_results['linkedin'] = await self.analyze_linkedin_data(accounts_data['linkedin'])
            
            # Analyze on-chain data if available
            if on_chain_data:
                analysis_results['on_chain'] = await self.analyze_on_chain_data(on_chain_data)
                
        except Exception as e:
            logger.error(f"Error analyzing user data: {e}")
            
        return analysis_results

    async def analyze_github_data(self, github_data: Dict) -> Dict:
        try:
            # Extract key metrics from GitHub data
            public_repos = github_data.get('public_repos', 0)
            followers = github_data.get('followers', 0)
            following = github_data.get('following', 0)
            created_at = github_data.get('created_at')
            
            # Calculate account age in days
            account_age_days = 0
            if created_at:
                from datetime import datetime
                created = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                now = datetime.utcnow()
                account_age_days = (now - created).days
            
            # Estimate commit frequency (this would need additional API calls in production)
            commit_frequency = min(public_repos * 10, 100)  # Simplified estimation
            
            return {
                'commit_frequency': commit_frequency,
                'repo_count': public_repos,
                'follower_count': followers,
                'account_age_days': account_age_days,
                'star_count': 0,  # Would need additional API calls
                'fork_count': 0,  # Would need additional API calls
                'contribution_graph': []  # Would need additional API calls
            }
            
        except Exception as e:
            logger.error(f"Error analyzing GitHub data: {e}")
            return {}

    async def analyze_linkedin_data(self, linkedin_data: Dict) -> Dict:
        try:
            # Extract key metrics from LinkedIn data
            # Note: LinkedIn API access is more restricted
            connections = linkedin_data.get('connections', 0)
            endorsements = linkedin_data.get('endorsements', 0)
            positions = linkedin_data.get('positions', [])
            
            # Calculate total experience in years
            experience_years = self.calculate_experience_years(positions)
            
            # Estimate skill count
            skill_count = linkedin_data.get('skill_count', 0)
            
            return {
                'connection_count': connections,
                'endorsement_count': endorsements,
                'experience_years': experience_years,
                'skill_count': skill_count,
                'recommendation_count': linkedin_data.get('recommendations', 0)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing LinkedIn data: {e}")
            return {}

    async def analyze_on_chain_data(self, on_chain_data: Dict) -> Dict:
        try:
            # Analyze on-chain activity
            transaction_count = on_chain_data.get('transaction_count', 0)
            nft_holdings = on_chain_data.get('nft_holdings', 0)
            defi_activity = on_chain_data.get('defi_activity', 0)
            governance_participation = on_chain_data.get('governance_participation', 0)
            wallet_age_days = on_chain_data.get('wallet_age_days', 0)
            
            return {
                'transaction_count': transaction_count,
                'nft_holdings': nft_holdings,
                'defi_activity': defi_activity,
                'governance_participation': governance_participation,
                'wallet_age_days': wallet_age_days
            }
            
        except Exception as e:
            logger.error(f"Error analyzing on-chain data: {e}")
            return {}

    def calculate_experience_years(self, positions: list) -> int:
        if not positions:
            return 0
            
        total_experience = 0
        for position in positions:
            if position.get('start_date') and position.get('end_date'):
                from datetime import datetime
                try:
                    start = datetime.fromisoformat(position['start_date'].replace('Z', '+00:00'))
                    end = datetime.fromisoformat(position['end_date'].replace('Z', '+00:00'))
                    experience_days = (end - start).days
                    total_experience += experience_days / 365.25
                except (ValueError, KeyError):
                    continue
            elif position.get('start_date'):
                # Current position
                from datetime import datetime
                try:
                    start = datetime.fromisoformat(position['start_date'].replace('Z', '+00:00'))
                    now = datetime.utcnow()
                    experience_days = (now - start).days
                    total_experience += experience_days / 365.25
                except (ValueError, KeyError):
                    continue
        
        return int(total_experience)

    async def close(self):
        if self.session:
            await self.session.close()