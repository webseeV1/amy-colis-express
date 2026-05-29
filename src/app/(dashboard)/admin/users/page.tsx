'use client'
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  UserPlus, Shield, User, MapPin, Plane, Power, PowerOff,
  KeyRound, Trash2, RefreshCw, CheckCircle, XCircle,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

interface UserData {
  id: string
  username: string
  telephone?: string | null
  role: 'admin' | 'employe_abidjan' | 'employe_france'
  actif: boolean
  createdAt: string
}

const roleConfig = {
  admin: { label: 'Admin', icon: <Shield size={14} />, color: 'bg-purple-100 text-purple-700' },
  employe_abidjan: { label: 'Abidjan', icon: <MapPin size={14} />, color: 'bg-orange-100 text-orange-700' },
  employe_france: { label: 'France', icon: <Plane size={14} />, color: 'bg-blue-100 text-blue-700' },
}

interface CreateForm {
  username: string
  telephone: string
  pin: string
  pinConfirm: string
  role: 'employe_abidjan' | 'employe_france' | 'admin'
}

interface ChangePinForm {
  pin: string
  pinConfirm: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  const [changePinUser, setChangePinUser] = useState<UserData | null>(null)
  const [changingPin, setChangingPin] = useState(false)
  const [deleteUser, setDeleteUser] = useState<UserData | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [createForm, setCreateForm] = useState<CreateForm>({
    username: '',
    telephone: '',
    pin: '',
    pinConfirm: '',
    role: 'employe_abidjan',
  })
  const [changePinForm, setChangePinForm] = useState<ChangePinForm>({ pin: '', pinConfirm: '' })

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data.success) setUsers(data.data)
      else toast.error('Erreur chargement utilisateurs')
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (createForm.pin !== createForm.pinConfirm) {
      toast.error('Les PINs ne correspondent pas')
      return
    }
    if (createForm.telephone.replace(/\D/g, '').length < 8) {
      toast.error('Numéro de téléphone requis (au moins 8 chiffres)')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: createForm.username,
          telephone: createForm.telephone,
          pin: createForm.pin,
          role: createForm.role,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Compte "${createForm.username}" créé !`)
        setShowCreate(false)
        setCreateForm({ username: '', telephone: '', pin: '', pinConfirm: '', role: 'employe_abidjan' })
        loadUsers()
      } else {
        toast.error(data.error || 'Erreur création')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setCreating(false)
    }
  }

  async function handleToggleActif(user: UserData) {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: !user.actif }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(user.actif ? `"${user.username}" désactivé` : `"${user.username}" activé`)
        loadUsers()
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur réseau')
    }
  }

  async function handleChangePin(e: React.FormEvent) {
    e.preventDefault()
    if (!changePinUser) return
    if (changePinForm.pin !== changePinForm.pinConfirm) {
      toast.error('Les PINs ne correspondent pas')
      return
    }
    setChangingPin(true)
    try {
      const res = await fetch(`/api/admin/users/${changePinUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: changePinForm.pin }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`PIN de "${changePinUser.username}" modifié`)
        setChangePinUser(null)
        setChangePinForm({ pin: '', pinConfirm: '' })
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setChangingPin(false)
    }
  }

  async function handleDelete() {
    if (!deleteUser) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${deleteUser.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Compte supprimé')
        setDeleteUser(null)
        loadUsers()
      } else {
        toast.error(data.error || 'Erreur suppression')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setDeleting(false)
    }
  }

  const admins = users.filter(u => u.role === 'admin')
  const abidjan = users.filter(u => u.role === 'employe_abidjan')
  const france = users.filter(u => u.role === 'employe_france')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-1">{users.length} compte{users.length > 1 ? 's' : ''} au total</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadUsers}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="Actualiser"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
            <UserPlus size={18} />
            Nouvel employé
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Admins */}
          {admins.length > 0 && (
            <UserGroup title="Administrateurs" icon={<Shield size={18} className="text-purple-600" />} users={admins} onToggle={handleToggleActif} onChangePin={setChangePinUser} onDelete={setDeleteUser} />
          )}

          {/* Employés Abidjan */}
          <UserGroup
            title="Employés Abidjan"
            icon={<MapPin size={18} className="text-orange-600" />}
            users={abidjan}
            onToggle={handleToggleActif}
            onChangePin={setChangePinUser}
            onDelete={setDeleteUser}
            emptyText="Aucun employé Abidjan"
          />

          {/* Employés France */}
          <UserGroup
            title="Employés France"
            icon={<Plane size={18} className="text-blue-600" />}
            users={france}
            onToggle={handleToggleActif}
            onChangePin={setChangePinUser}
            onDelete={setDeleteUser}
            emptyText="Aucun employé France"
          />
        </div>
      )}

      {/* Modal Créer employé */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Créer un compte employé">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom d&apos;utilisateur</label>
            <Input
              value={createForm.username}
              onChange={e => setCreateForm(f => ({ ...f, username: e.target.value }))}
              placeholder="ex: employe_paris"
              required
            />
            <p className="text-xs text-gray-400 mt-1">3-30 caractères, lettres, chiffres et _</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
            <Input
              type="tel"
              inputMode="numeric"
              value={createForm.telephone}
              onChange={e => setCreateForm(f => ({ ...f, telephone: e.target.value.replace(/[^\d\s\-\+\(\)\.]/g, '') }))}
              placeholder="0612345678 ou 07 XX XX XX XX"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Pour identifier et contacter l&apos;employé</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
            <select
              value={createForm.role}
              onChange={e => setCreateForm(f => ({ ...f, role: e.target.value as CreateForm['role'] }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="employe_abidjan">Employé Abidjan (enregistrement colis)</option>
              <option value="employe_france">Employé France (réception + paiements)</option>
              <option value="admin">Administrateur (accès complet)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PIN (6 chiffres)</label>
              <Input
                type="password"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={createForm.pin}
                onChange={e => setCreateForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))}
                placeholder="••••••"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer PIN</label>
              <Input
                type="password"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={createForm.pinConfirm}
                onChange={e => setCreateForm(f => ({ ...f, pinConfirm: e.target.value.replace(/\D/g, '') }))}
                placeholder="••••••"
                required
              />
            </div>
          </div>

          {createForm.pin && createForm.pinConfirm && createForm.pin !== createForm.pinConfirm && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <XCircle size={14} /> Les PINs ne correspondent pas
            </p>
          )}
          {createForm.pin.length === 6 && createForm.pin === createForm.pinConfirm && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle size={14} /> PINs identiques
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" loading={creating} className="flex-1">
              Créer le compte
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Changer PIN */}
      <Modal
        open={!!changePinUser}
        onClose={() => { setChangePinUser(null); setChangePinForm({ pin: '', pinConfirm: '' }) }}
        title={`Changer PIN — ${changePinUser?.username}`}
      >
        <form onSubmit={handleChangePin} className="space-y-4">
          <p className="text-sm text-gray-600">
            Saisissez le nouveau PIN à 6 chiffres pour{' '}
            <strong>{changePinUser?.username}</strong>.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau PIN</label>
              <Input
                type="password"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={changePinForm.pin}
                onChange={e => setChangePinForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))}
                placeholder="••••••"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer</label>
              <Input
                type="password"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={changePinForm.pinConfirm}
                onChange={e => setChangePinForm(f => ({ ...f, pinConfirm: e.target.value.replace(/\D/g, '') }))}
                placeholder="••••••"
                required
              />
            </div>
          </div>
          {changePinForm.pin && changePinForm.pinConfirm && changePinForm.pin !== changePinForm.pinConfirm && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <XCircle size={14} /> Les PINs ne correspondent pas
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setChangePinUser(null)} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" loading={changingPin} className="flex-1">
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Supprimer */}
      <Modal
        open={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        title="Supprimer un compte"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-medium">
              Supprimer <strong>{deleteUser?.username}</strong> ?
            </p>
            <p className="text-xs text-red-600 mt-2">
              Si ce compte a des colis enregistrés, il sera <strong>désactivé</strong> (suppression impossible pour préserver l&apos;historique).
              Sinon, il sera <strong>supprimé définitivement</strong>.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setDeleteUser(null)} className="flex-1">
              Annuler
            </Button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {deleting ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {deleting ? 'En cours...' : 'Confirmer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

interface UserGroupProps {
  title: string
  icon: React.ReactNode
  users: UserData[]
  onToggle: (u: UserData) => void
  onChangePin: (u: UserData) => void
  onDelete: (u: UserData) => void
  emptyText?: string
}

function UserGroup({ title, icon, users, onToggle, onChangePin, onDelete, emptyText }: UserGroupProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{users.length}</span>
      </div>

      {users.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-400">{emptyText || 'Aucun utilisateur'}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {users.map(user => (
            <UserCard
              key={user.id}
              user={user}
              onToggle={onToggle}
              onChangePin={onChangePin}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface UserCardProps {
  user: UserData
  onToggle: (u: UserData) => void
  onChangePin: (u: UserData) => void
  onDelete: (u: UserData) => void
}

function UserCard({ user, onToggle, onChangePin, onDelete }: UserCardProps) {
  const rc = roleConfig[user.role]

  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm transition-opacity ${!user.actif ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${user.actif ? 'bg-blue-50' : 'bg-gray-100'}`}>
            <User size={18} className={user.actif ? 'text-blue-600' : 'text-gray-400'} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{user.username}</p>
            {user.telephone && <p className="text-xs text-gray-500">📞 {user.telephone}</p>}
            <p className="text-xs text-gray-400">Créé le {formatDate(user.createdAt)}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${rc.color}`}>
            {rc.icon} {rc.label}
          </span>
          {user.actif ? (
            <Badge label="Actif" color="green" className="text-xs" />
          ) : (
            <Badge label="Inactif" color="red" className="text-xs" />
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={() => onToggle(user)}
          title={user.actif ? 'Désactiver' : 'Activer'}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            user.actif
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-green-50 text-green-600 hover:bg-green-100'
          }`}
        >
          {user.actif ? <PowerOff size={13} /> : <Power size={13} />}
          {user.actif ? 'Désactiver' : 'Activer'}
        </button>
        <button
          onClick={() => onChangePin(user)}
          title="Changer PIN"
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
        >
          <KeyRound size={13} />
          PIN
        </button>
        {user.role !== 'admin' && (
          <button
            onClick={() => onDelete(user)}
            title="Supprimer"
            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
