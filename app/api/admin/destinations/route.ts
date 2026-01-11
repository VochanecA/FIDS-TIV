import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { destinationsTable } from '@/lib/db/schema';
import { and, eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const destinations = await db.select().from(destinationsTable).orderBy(desc(destinationsTable.createdAt));
    return NextResponse.json(destinations);
  } catch (error) {
    console.error('Error fetching destinations:', error);
    return NextResponse.json(
      { error: 'Greška pri učitavanju destinacija' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Provera da li destinacija već postoji za ovu avio kompaniju
    const existing = await db.select()
      .from(destinationsTable)
      .where(
        and(
          eq(destinationsTable.destinationCode, body.destinationCode),
          eq(destinationsTable.airlineIata, body.airlineIata)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Ova destinacija već postoji za ovu avio kompaniju' },
        { status: 400 }
      );
    }
    
    const [destination] = await db.insert(destinationsTable).values(body).returning();
    return NextResponse.json(destination);
  } catch (error) {
    console.error('Error creating destination:', error);
    return NextResponse.json(
      { error: 'Greška pri kreiranju destinacije' },
      { status: 500 }
    );
  }
}