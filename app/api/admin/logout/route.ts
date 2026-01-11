import { NextResponse } from 'next/server';

export async function POST() {
  // U stvarnoj aplikaciji ovde bi invalidirali token
  return NextResponse.json({ 
    success: true, 
    message: 'Uspešno ste se odjavili' 
  });
}