import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const situation = (body.situation || body.situationPrompt || '').trim();
    const skipCalibration = Boolean(body.skipCalibration);

    if (skipCalibration) {
      return NextResponse.json({
        needsClarification: false,
        message: 'Fast-tracked directly to simulation',
      });
    }

    // Adaptive entropy gate: short prompt (< 80 chars) or missing numbers triggers questions
    const isAmbiguous = situation.length < 80 || !/\d/.test(situation);

    if (isAmbiguous) {
      return NextResponse.json({
        needsClarification: true,
        entropyScore: 0.85,
        questions: [
          { id: 'q1', question: 'What is your current financial runway in months?' },
          { id: 'q2', question: 'Do you have early customer discovery validation?' },
          { id: 'q3', question: 'What is your primary constraint: time or capital?' },
        ],
      });
    }

    return NextResponse.json({
      needsClarification: false,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 });
  }
}
