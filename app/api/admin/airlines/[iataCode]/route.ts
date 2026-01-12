import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { airlinesTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  context: { params: { iataCode: string } }
) {
  try {
    const { iataCode } = context.params;
    const [airline] = await db.select()
      .from(airlinesTable)
      .where(eq(airlinesTable.iataCode, iataCode));
    
    if (!airline) {
      return NextResponse.json(
        { error: 'Avio kompanija nije pronađena' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(airline);
  } catch (error) {
    console.error('Error fetching airline:', error);
    return NextResponse.json(
      { error: 'Greška pri učitavanju avio kompanije' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { iataCode: string } }
) {
  try {
    const { iataCode } = context.params;
    const body = await request.json();
    
    const [airline] = await db.update(airlinesTable)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(eq(airlinesTable.iataCode, iataCode))
      .returning();
    
    if (!airline) {
      return NextResponse.json(
        { error: 'Avio kompanija nije pronađena' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(airline);
  } catch (error) {
    console.error('Error updating airline:', error);
    return NextResponse.json(
      { error: 'Greška pri ažuriranju avio kompanije' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { iataCode: string } }
) {
  try {
    const { iataCode } = context.params;
    const [deleted] = await db.delete(airlinesTable)
      .where(eq(airlinesTable.iataCode, iataCode))
      .returning();
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Avio kompanija nije pronađena' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting airline:', error);
    return NextResponse.json(
      { error: 'Greška pri brisanju avio kompanije' },
      { status: 500 }
    );
  }
}