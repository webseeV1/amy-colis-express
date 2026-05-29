import { prisma } from './prisma'
import { TypeAction } from '@prisma/client'

export async function logAction({
  userId,
  action,
  entityType,
  entityId,
  details,
}: {
  userId: string
  action: TypeAction
  entityType: string
  entityId?: string
  details?: Record<string, unknown>
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details: details as any,
      },
    })
  } catch (error) {
    console.error('Audit log failed:', error)
  }
}
