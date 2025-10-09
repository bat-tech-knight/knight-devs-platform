import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check if it's a DOCX file
    const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                   file.type === 'application/msword' ||
                   file.name.toLowerCase().endsWith('.docx') ||
                   file.name.toLowerCase().endsWith('.doc');

    if (!isDocx) {
      return NextResponse.json(
        { success: false, error: 'File must be a DOCX or DOC file' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text using mammoth
    const result = await mammoth.extractRawText({ buffer });
    
    if (!result.value) {
      return NextResponse.json(
        { success: false, error: 'Failed to extract text from document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      text: result.value.trim(),
      warnings: result.messages || []
    });

  } catch (error) {
    console.error('DOCX extraction error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}
