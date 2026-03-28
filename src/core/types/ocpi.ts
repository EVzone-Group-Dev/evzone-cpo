/**
 * OCPI 2.2.1 Base Types
 * Based on the specification: https://ocpi-protocol.org/
 */

export type OCPIRole = 'CPO' | 'EMSP' | 'HUB' | 'NSP' | 'NAP' | 'SCSP'

export interface OCPIBusinessDetails {
  name: string
  website?: string
  logo?: {
    url: string
    thumbnail?: string
    category: string
    type: string
    width: number
    height: number
  }
}

export interface OCPICredentialsRole {
  role: OCPIRole
  party_id: string
  country_code: string
  business_details: OCPIBusinessDetails
}

export interface OCPICredentials {
  token: string
  url: string
  roles: OCPICredentialsRole[]
}

export interface OCPIResponse<T> {
  data: T
  status_code: number
  status_message?: string
  timestamp: string
}

export interface OCPIPartyContext {
  countryCode: string
  operatorName: string
  partyId: string
  timeZone: string
}

export interface OCPILocationConnector {
  format: 'CABLE' | 'SOCKET'
  id: string
  last_updated: string
  max_amperage: number
  max_electric_power: number
  max_voltage: number
  power_type: 'AC_1_PHASE' | 'AC_3_PHASE' | 'DC'
  standard: 'IEC_62196_T2' | 'IEC_62196_T2_COMBO'
}

export interface OCPILocationEVSE {
  capabilities: string[]
  connectors: OCPILocationConnector[]
  evse_id: string
  last_updated: string
  status: string
  uid: string
}

export interface OCPILocation {
  address: string
  city: string
  coordinates: {
    latitude: string
    longitude: string
  }
  country: string
  evses: OCPILocationEVSE[]
  id: string
  last_updated: string
  name: string
  operator: OCPIBusinessDetails
  time_zone: string
  type: string
}

export const OCPIStatusCode = {
  SUCCESS: 1000,
  CLIENT_ERROR: 2000,
  INVALID_PARAMETERS: 2001,
  UNKNOWN_LOCATION: 2003,
  SERVER_ERROR: 3000,
} as const
