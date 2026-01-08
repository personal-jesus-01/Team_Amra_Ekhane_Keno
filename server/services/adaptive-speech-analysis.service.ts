/**
 * Adaptive Speech Analysis Service
 *
 * Enhances the existing speech analysis with adaptive difficulty
 * and personalized feedback based on user's learning profile.
 */

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AdaptiveAnalysisConfig {
  userLevel: string; // beginner | intermediate | advanced | expert
  adaptiveDifficulty: number; // 0-100
  weakAreas: string[];
  strongAreas: string[];
  preferredLanguage: string;
  feedbackStrategy: string; // encouraging | balanced | constructive | challenging
}

export interface AdaptiveSpeechResult {
  scores: {
    contentCoverage: number;
    fluency: number;
    clarity: number;
    confidence: number;
    pace: number;
    pronunciation: number;
    overallScore: number;
  };
  adaptiveFeedback: {
    mainMessage: string;
    strengths: string[];
    improvements: string[];
    specificTips: string[];
    encouragement: string;
  };
  difficultyAssessment: {
    currentTaskDifficulty: number;
    recommendedNextDifficulty: number;
    performanceMatch: string; // too_easy | just_right | too_hard
  };
  skillGaps: Array<{
    skill: string;
    currentLevel: number;
    targetLevel: number;
    priority: 'high' | 'medium' | 'low';
  }>;
}

/**
 * Analyze speech with adaptive difficulty consideration
 */
export async function analyzeWithAdaptiveDifficulty(
  transcript: string,
  slideContent: string,
  config: AdaptiveAnalysisConfig
): Promise<AdaptiveSpeechResult> {
  try {
    const prompt = buildAdaptiveAnalysisPrompt(transcript, slideContent, config);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert adaptive presentation coach. Your analysis adapts to the user's level and provides feedback that is:

1. LEVEL-APPROPRIATE: Adjust expectations based on user's ${config.userLevel} level
2. DIFFICULTY-AWARE: Consider the task difficulty (${config.adaptiveDifficulty}/100) when scoring
3. PERSONALIZED: Focus on their weak areas: ${config.weakAreas.join(', ')}
4. ENCOURAGING: Use ${config.feedbackStrategy} feedback strategy
5. ACTIONABLE: Provide specific, doable improvements

SCORING GUIDELINES BY LEVEL:
- Beginner (difficulty 20-40): Score generously, focus on encouragement, basic skills
- Intermediate (difficulty 40-60): Balanced scoring, focus on refinement
- Advanced (difficulty 60-80): Stricter scoring, focus on nuance and polish
- Expert (difficulty 80-100): Very strict scoring, focus on perfection

DIFFICULTY CALIBRATION:
- If user scores 85%+ consistently: Task is TOO EASY → recommend increase
- If user scores 45-75%: Task is JUST RIGHT → maintain difficulty
- If user scores <45%: Task is TOO HARD → recommend decrease

Your response must be valid JSON.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
      max_tokens: 2500
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      scores: {
        contentCoverage: result.scores?.contentCoverage || 0,
        fluency: result.scores?.fluency || 0,
        clarity: result.scores?.clarity || 0,
        confidence: result.scores?.confidence || 0,
        pace: result.scores?.pace || 0,
        pronunciation: result.scores?.pronunciation || 0,
        overallScore: result.scores?.overallScore || 0
      },
      adaptiveFeedback: {
        mainMessage: result.adaptiveFeedback?.mainMessage || 'Keep practicing!',
        strengths: result.adaptiveFeedback?.strengths || [],
        improvements: result.adaptiveFeedback?.improvements || [],
        specificTips: result.adaptiveFeedback?.specificTips || [],
        encouragement: result.adaptiveFeedback?.encouragement || 'You\'re doing great!'
      },
      difficultyAssessment: {
        currentTaskDifficulty: config.adaptiveDifficulty,
        recommendedNextDifficulty: result.difficultyAssessment?.recommendedNextDifficulty || config.adaptiveDifficulty,
        performanceMatch: result.difficultyAssessment?.performanceMatch || 'just_right'
      },
      skillGaps: result.skillGaps || []
    };
  } catch (error) {
    console.error('Error in adaptive speech analysis:', error);
    throw new Error('Failed to analyze speech adaptively');
  }
}

/**
 * Build comprehensive prompt for adaptive analysis
 */
function buildAdaptiveAnalysisPrompt(
  transcript: string,
  slideContent: string,
  config: AdaptiveAnalysisConfig
): string {
  return `
ANALYZE THIS PRESENTATION PERFORMANCE WITH ADAPTIVE DIFFICULTY:

USER PROFILE:
- Level: ${config.userLevel}
- Current Difficulty Setting: ${config.adaptiveDifficulty}/100
- Weak Areas to Focus On: ${config.weakAreas.join(', ') || 'None identified'}
- Strong Areas: ${config.strongAreas.join(', ') || 'None identified'}
- Language: ${config.preferredLanguage}
- Feedback Style: ${config.feedbackStrategy}

SLIDE CONTENT (What they should cover):
${slideContent}

USER'S ACTUAL SPEECH:
${transcript}

ANALYSIS TASK:
Provide a comprehensive JSON response with:

{
  "scores": {
    "contentCoverage": number (0-100, how well did they cover the slides?),
    "fluency": number (0-100, smoothness of speech),
    "clarity": number (0-100, how clear and understandable),
    "confidence": number (0-100, perceived confidence level),
    "pace": number (0-100, appropriate speaking speed),
    "pronunciation": number (0-100, clarity of pronunciation),
    "overallScore": number (0-100, weighted average)
  },
  "adaptiveFeedback": {
    "mainMessage": "Primary feedback message in ${config.preferredLanguage}, tailored to ${config.feedbackStrategy} style",
    "strengths": ["specific strength 1", "specific strength 2"],
    "improvements": ["specific area to improve 1", "specific area to improve 2"],
    "specificTips": ["actionable tip 1", "actionable tip 2", "actionable tip 3"],
    "encouragement": "Motivational message appropriate for ${config.userLevel} level"
  },
  "difficultyAssessment": {
    "recommendedNextDifficulty": number (0-100, what difficulty to try next),
    "performanceMatch": "too_easy|just_right|too_hard",
    "reasoning": "Why you recommend this difficulty adjustment"
  },
  "skillGaps": [
    {
      "skill": "name of skill",
      "currentLevel": number (0-100, estimated current ability),
      "targetLevel": number (0-100, where they should be for their level),
      "priority": "high|medium|low",
      "improvement_plan": "Specific advice to bridge this gap"
    }
  ]
}

CRITICAL INSTRUCTIONS:
1. Scores should reflect ${config.userLevel} level expectations
2. ${config.feedbackStrategy === 'encouraging' ? 'Be very positive and supportive' : ''}
3. ${config.feedbackStrategy === 'challenging' ? 'Be direct and push for excellence' : ''}
4. ${config.feedbackStrategy === 'balanced' ? 'Balance praise with constructive criticism' : ''}
5. ${config.feedbackStrategy === 'constructive' ? 'Focus on specific improvements while acknowledging progress' : ''}
6. Consider current difficulty (${config.adaptiveDifficulty}) when assessing if task matches ability
7. Prioritize feedback on weak areas: ${config.weakAreas.join(', ')}
`;
}

/**
 * Generate next practice challenge based on performance
 */
export async function generateNextChallenge(
  userLevel: string,
  recommendedDifficulty: number,
  weakAreas: string[],
  topic: string
): Promise<{
  challenge: string;
  focusAreas: string[];
  timeLimit: number;
  successCriteria: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a presentation coach designing practice challenges. Create a challenge that:
1. Matches difficulty level ${recommendedDifficulty}/100
2. Targets user's weak areas: ${weakAreas.join(', ')}
3. Is appropriate for ${userLevel} level
4. Provides clear success criteria`
        },
        {
          role: 'user',
          content: `Create a presentation practice challenge about "${topic}" at difficulty ${recommendedDifficulty}/100 for a ${userLevel} presenter. Focus on improving: ${weakAreas.join(', ')}.

Return JSON:
{
  "challenge": "Clear description of what to do",
  "focusAreas": ["area 1", "area 2"],
  "timeLimit": number (in seconds),
  "successCriteria": ["criterion 1", "criterion 2", "criterion 3"]
}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 800
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Error generating next challenge:', error);
    return {
      challenge: `Present about ${topic} for 2-3 minutes`,
      focusAreas: weakAreas,
      timeLimit: 180,
      successCriteria: ['Cover main points', 'Speak clearly', 'Stay on time']
    };
  }
}
