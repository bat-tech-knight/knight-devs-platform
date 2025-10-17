import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.job_descriptions) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'job_descriptions is required',
          error_type: 'missing_required_fields'
        },
        { status: 400 }
      );
    }

    if (!body.user_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'user_id is required',
          error_type: 'missing_candidate_data'
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.job_descriptions) || body.job_descriptions.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'job_descriptions must be a non-empty array',
          error_type: 'invalid_job_descriptions'
        },
        { status: 400 }
      );
    }

    // Call the Flask API with the new format
    const flaskResponse = await fetch(`${process.env.FLASK_API_URL}/api/ats-score/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: body.user_id,
        job_descriptions: body.job_descriptions
      })
    });

    if (!flaskResponse.ok) {
      const errorData = await flaskResponse.json();
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.error || 'Failed to calculate batch ATS scores',
          error_type: errorData.error_type || 'batch_ats_scoring_error'
        },
        { status: flaskResponse.status }
      );
    }

    const result = await flaskResponse.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in batch ATS scoring API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        error_type: 'server_error'
      },
      { status: 500 }
    );
  }
}
