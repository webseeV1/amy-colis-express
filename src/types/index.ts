export type Role = 'admin' | 'employe_abidjan' | 'employe_france'

export interface SessionUser {
  id: string
  username: string
  role: Role
  actif: boolean
}

export interface ColisFormData {
  nom: string
  prenom: string
  telephoneDestinataire: string
  telephoneExpediteur: string
  poids: number
  description: string
  estPrepaye: boolean
  montant: number
  photoUrl?: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
