import { NextRequest, NextResponse } from 'next/server';
import { generateWorkoutProgram, validateProgram } from '@/lib/services/programGeneration';
import { ProgramMetadata } from '@/lib/types/firestore';

/**
 * POST /api/workout-program
 * Generate a personalized workout program from template library
 *
 * NOTE: Authentication is handled by Firestore security rules when saving.
 * This endpoint generates the program and returns it; the client saves it.
 */
export async function POST(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development';

  try {
    // Parse request body
    const body = await request.json();
    const { questionnaire, userContext } = body;


    // Validate questionnaire
    if (!questionnaire) {
      return NextResponse.json(
        { success: false, error: 'Questionnaire data is required' },
        { status: 400 }
      );
    }

    // Validate required fields in questionnaire
    const requiredFields = [
      'goal',
      'experienceLevel',
      'equipmentAccess',
      'location',
      'daysPerWeek',
      'sessionLengthMin',
    ];
    const missingFields = requiredFields.filter((field) => !(field in questionnaire));
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate field values
    const validGoals = ['muscle_gain', 'fat_loss', 'strength', 'endurance', 'general_fitness'];
    const validExperienceLevels = ['beginner', 'intermediate', 'advanced'];
    const validEquipmentAccess = ['full_gym', 'home_equipment', 'minimal', 'bodyweight_only'];
    const validLocations = ['gym', 'home', 'both'];

    if (!validGoals.includes(questionnaire.goal)) {
      return NextResponse.json(
        { success: false, error: 'Invalid goal value' },
        { status: 400 }
      );
    }

    if (!validExperienceLevels.includes(questionnaire.experienceLevel)) {
      return NextResponse.json(
        { success: false, error: 'Invalid experience level' },
        { status: 400 }
      );
    }

    if (!validEquipmentAccess.includes(questionnaire.equipmentAccess)) {
      return NextResponse.json(
        { success: false, error: 'Invalid equipment access' },
        { status: 400 }
      );
    }

    if (!validLocations.includes(questionnaire.location)) {
      return NextResponse.json(
        { success: false, error: 'Invalid location' },
        { status: 400 }
      );
    }

    // Validate numeric ranges
    const daysPerWeek = parseInt(questionnaire.daysPerWeek);
    const sessionLengthMin = parseInt(questionnaire.sessionLengthMin);

    if (isNaN(daysPerWeek) || daysPerWeek < 3 || daysPerWeek > 7) {
      return NextResponse.json(
        { success: false, error: 'Days per week must be between 3 and 7' },
        { status: 400 }
      );
    }

    if (isNaN(sessionLengthMin) || sessionLengthMin < 30 || sessionLengthMin > 120) {
      return NextResponse.json(
        { success: false, error: 'Session length must be between 30 and 120 minutes' },
        { status: 400 }
      );
    }

    // Build metadata object
    const metadata: ProgramMetadata = {
      goal: questionnaire.goal,
      experienceLevel: questionnaire.experienceLevel,
      equipmentAccess: questionnaire.equipmentAccess,
      location: questionnaire.location,
      daysPerWeek,
      sessionLengthMin,
      injuries: questionnaire.injuries?.trim() || undefined,
      notes: questionnaire.notes?.trim() || undefined,
    };

    // Gather user context from database (stats, history, etc.)
    const enrichedContext = userContext || {};
    // Note: Additional user context (stats, history) would be gathered on the client side
    // and passed in the userContext parameter

    // Generate deterministic template-based program
    const generatedProgram = await generateWorkoutProgram(metadata, enrichedContext);

    // Validate generated program structure
    const validation = validateProgram(generatedProgram);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Generated program failed validation: ' + validation.errors.join('; '),
        },
        { status: 502, headers: { 'content-type': 'application/json' } }
      );
    }

    // Return success response with program data
    return NextResponse.json(
      {
        success: true,
        data: generatedProgram,
      },
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    const errorMessage = err.message || 'Failed to generate program';

    const statusCode = 500;

    console.error('[Program Generation Error]', {
      message: errorMessage,
      isDev,
      statusCode,
    });

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: statusCode, headers: { 'content-type': 'application/json' } }
    );
  }
}
