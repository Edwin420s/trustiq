import { User, LinkedAccount } from '@prisma/client';
import { TrustScore, TrustAnalysis } from '@trustiq/shared-types';

export class TrustScoreService {
  async calculateTrustScore(user: User & { linkedAccounts: LinkedAccount[] }): Promise<TrustScore> {
    const analysis = await this.analyzeUserData(user);
    const score = this.computeScore(analysis);
    const insights = this.generateInsights(analysis, score);

    return {
      score: score.overall,
      breakdown: score.breakdown,
      insights,
      calculatedAt: new Date(),
    };
  }

  private async analyzeUserData(user: User & { linkedAccounts: LinkedAccount[] }): Promise<TrustAnalysis> {
    const analysis: TrustAnalysis = {};

    for (const account of user.linkedAccounts) {
      switch (account.provider) {
        case 'github':
          analysis.github = await this.analyzeGitHub(account.metadata);
          break;
        case 'linkedin':
          analysis.linkedin = await this.analyzeLinkedIn(account.metadata);
          break;
      }
    }

    return analysis;
  }

  private async analyzeGitHub(metadata: any) {
    return {
      commitFrequency: metadata.publicRepos || 0,
      repoCount: metadata.publicRepos || 0,
      followerCount: metadata.followers || 0,
      accountAgeDays: this.calculateAccountAge(metadata.created_at),
      starCount: 0, // Would need additional API calls
      forkCount: 0, // Would need additional API calls
      contributionGraph: [], // Would need additional API calls
    };
  }

  private async analyzeLinkedIn(metadata: any) {
    return {
      connectionCount: metadata.connections || 0,
      endorsementCount: metadata.endorsements || 0,
      experienceYears: this.calculateExperienceYears(metadata.positions),
      skillCount: metadata.skills?.length || 0,
      recommendationCount: metadata.recommendations || 0,
    };
  }

  private computeScore(analysis: TrustAnalysis) {
    const githubScore = this.computeGitHubScore(analysis.github);
    const linkedinScore = this.computeLinkedInScore(analysis.linkedin);

    const overall = (githubScore.overall * 0.6 + linkedinScore.overall * 0.4);
    
    return {
      overall: Math.min(100, Math.max(0, overall)),
      breakdown: {
        consistency: (githubScore.consistency + linkedinScore.consistency) / 2,
        skillDepth: (githubScore.skillDepth + linkedinScore.skillDepth) / 2,
        peerValidation: (githubScore.peerValidation + linkedinScore.peerValidation) / 2,
        engagementQuality: (githubScore.engagement + linkedinScore.engagement) / 2,
        anomalyFactor: 0, // Would implement anomaly detection
      },
    };
  }

  private computeGitHubScore(github: any) {
    if (!github) return { overall: 0, consistency: 0, skillDepth: 0, peerValidation: 0, engagement: 0 };
    
    const consistency = Math.min(100, github.commitFrequency * 10);
    const skillDepth = Math.min(100, github.repoCount * 5);
    const peerValidation = Math.min(100, github.followerCount * 2);
    const engagement = Math.min(100, (github.forkCount + github.starCount) * 0.5);
    
    const overall = (consistency * 0.3 + skillDepth * 0.3 + peerValidation * 0.2 + engagement * 0.2);
    
    return { overall, consistency, skillDepth, peerValidation, engagement };
  }

  private computeLinkedInScore(linkedin: any) {
    if (!linkedin) return { overall: 0, consistency: 0, skillDepth: 0, peerValidation: 0, engagement: 0 };
    
    const consistency = Math.min(100, linkedin.experienceYears * 10);
    const skillDepth = Math.min(100, linkedin.skillCount * 5);
    const peerValidation = Math.min(100, linkedin.connectionCount * 0.2);
    const engagement = Math.min(100, (linkedin.endorsementCount + linkedin.recommendationCount) * 2);
    
    const overall = (consistency * 0.25 + skillDepth * 0.35 + peerValidation * 0.2 + engagement * 0.2);
    
    return { overall, consistency, skillDepth, peerValidation, engagement };
  }

  private generateInsights(analysis: TrustAnalysis, score: any): string[] {
    const insights: string[] = [];

    if (score.overall < 40) {
      insights.push('Your trust score is low. Consider adding more verified accounts and increasing your activity.');
    }

    if (analysis.github && analysis.github.followerCount < 10) {
      insights.push('Your GitHub profile has low visibility. Consider contributing to open source projects.');
    }

    if (analysis.linkedin && analysis.linkedin.connectionCount < 50) {
      insights.push('Expand your professional network on LinkedIn to improve peer validation.');
    }

    if (score.breakdown.consistency < 30) {
      insights.push('Your activity consistency is low. Regular contributions improve your trust score.');
    }

    if (score.overall > 80) {
      insights.push('Excellent trust score! Your digital reputation is strong across platforms.');
    }

    return insights;
  }

  private calculateAccountAge(createdAt: string): number {
    if (!createdAt) return 0;
    const created = new Date(createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateExperienceYears(positions: any[]): number {
    if (!positions || !Array.isArray(positions)) return 0;
    
    let totalExperience = 0;
    for (const position of positions) {
      if (position.startDate && position.endDate) {
        const start = new Date(position.startDate);
        const end = new Date(position.endDate);
        totalExperience += (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
      }
    }
    
    return Math.floor(totalExperience);
  }
}