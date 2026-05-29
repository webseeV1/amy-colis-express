import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPin, getSession } from '@/lib/auth'
import { logAction } from '@/lib/audit'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    // Prevent modifying the admin account's own role
    if (target.role === 'admin' && target.id !== session.id && body.role) {
      return NextResponse.json({ error: 'Impossible de modifier le rôle d\'un admin' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {}

    // Toggle actif status
    if (typeof body.actif === 'boolean') {
      // Cannot deactivate yourself
      if (target.id === session.id && !body.actif) {
        return NextResponse.json({ error: 'Vous ne pouvez pas vous désactiver vous-même' }, { status: 400 })
      }
      updateData.actif = body.actif
    }

    // Update PIN
    if (body.pin) {
      if (!/^\d{6}$/.test(body.pin)) {
        return NextResponse.json({ error: 'Le PIN doit être exactement 6 chiffres' }, { status: 400 })
      }
      const ADMIN_PIN = process.env.ADMIN_PIN || '020106'
      if (body.pin === ADMIN_PIN) {
        return NextResponse.json({ error: 'Ce PIN est réservé et ne peut pas être utilisé' }, { status: 409 })
      }
      updateData.pinHash = await hashPin(body.pin)
    }

    // Update role
    if (body.role) {
      if (!['employe_abidjan', 'employe_france', 'admin'].includes(body.role)) {
        return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
      }
      updateData.role = body.role
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Aucune modification' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, username: true, role: true, actif: true, createdAt: true },
    })

    await logAction({
      userId: session.id,
      action: 'modification',
      entityType: 'User',
      entityId: id,
      details: { changes: Object.keys(updateData), targetUsername: target.username },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { id } = await params

    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    if (target.id === session.id) {
      return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 })
    }

    // Check if user has related records — soft delete instead
    const colisCount = await prisma.colis.count({
      where: {
        OR: [
          { enregistreParId: id },
          { receptionneParId: id },
          { payeParId: id },
        ],
      },
    })

    if (colisCount > 0) {
      // Soft delete: deactivate instead of deleting
      await prisma.user.update({
        where: { id },
        data: { actif: false },
      })
      await logAction({
        userId: session.id,
        action: 'suppression',
        entityType: 'User',
        entityId: id,
        details: { username: target.username, reason: 'soft_delete_has_records', colisCount },
      })
      return NextResponse.json({
        success: true,
        message: `Compte désactivé (${colisCount} colis liés — suppression définitive impossible)`,
        softDeleted: true,
      })
    }

    // Hard delete if no related records
    await prisma.auditLog.deleteMany({ where: { userId: id } })
    await prisma.finance.deleteMany({ where: { userId: id } })
    await prisma.user.delete({ where: { id } })

    await logAction({
      userId: session.id,
      action: 'suppression',
      entityType: 'User',
      entityId: id,
      details: { username: target.username, reason: 'hard_delete' },
    })

    return NextResponse.json({ success: true, message: 'Utilisateur supprimé définitivement' })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
