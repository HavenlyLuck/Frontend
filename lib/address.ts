export interface Address {
  id: string
  label: string
  recipient: string
  phone: string
  zipCode: string
  address1: string
  address2: string
  isDefault: boolean
}

export const ADDRESSES: Address[] = [
  { id: '1', label: '집', recipient: '강호소', phone: '010-1234-5678', zipCode: '06134', address1: '서울특별시 강남구 테헤란로 123', address2: '101동 202호', isDefault: true },
]

export function addAddress(address: Address) {
  ADDRESSES.unshift(address)
}
