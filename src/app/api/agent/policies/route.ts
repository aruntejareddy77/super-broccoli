import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const policies = await prisma.policy.findMany({
      select: {
        merchantId: true,
        autonomousLimit: true,
        approvalThreshold: true,
        maxAmount: true,
        maxQuantity: true,
      }
    });

    return NextResponse.json({ policies });
  } catch (error) {
    console.error('Error fetching policies:', error);
    return NextResponse.json({ error: 'Failed to fetch policies' }, { status: 500 });
  }
}
