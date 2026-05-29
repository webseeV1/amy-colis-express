export function buildWhatsAppLink(
  telephone: string,
  message?: string
): string {
  // Normalize phone: remove spaces, dashes, +, ensure it starts with country code
  let tel = telephone.replace(/[\s\-\(\)\.]/g, '')
  if (tel.startsWith('0')) {
    tel = '33' + tel.slice(1)
  } else if (tel.startsWith('+')) {
    tel = tel.slice(1)
  }
  if (message) {
    return `https://wa.me/${tel}?text=${encodeURIComponent(message)}`
  }
  return `https://wa.me/${tel}`
}

export function buildWhatsAppMessage(
  template: string,
  vars: {
    nom?: string
    montant?: number
    adresse?: string
    maps_link?: string
    livraison?: string
  }
): string {
  return template
    .replace('{nom}', vars.nom || '')
    .replace('{montant}', vars.montant?.toString() || '')
    .replace('{adresse}', vars.adresse || '')
    .replace('{maps_link}', vars.maps_link || '')
    .replace('{livraison}', vars.livraison || '')
}
