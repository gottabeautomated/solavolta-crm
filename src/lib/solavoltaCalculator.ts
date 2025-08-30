export type RoofType = 'ziegel' | 'blech' | 'flach'

export interface CalculatorConfig {
  modulePowerW: number
  moduleModel: string
  moduleUnitPrice: number
  inverterModel: string
  inverterUnitPrice: number
  baseMountingPerModule: number
  roofTypeFactors: Record<RoofType, number>
  plzZoneSurcharge: Record<string, number>
  fixedDiscountPerkWp: number
  travelFlat: number
  logisticsFlat: number
  vatRate: number
}

export interface SapPosition {
  sapCode: string
  name: string
  quantity: number
  unit: 'pcs' | 'set' | 'eur'
  unitPrice: number
  total: number
  meta?: Record<string, any>
}

export interface CalculationResult {
  kWp: number
  plz: string
  roofType: RoofType
  modules: number
  positions: SapPosition[]
  totals: { net: number; vat: number; gross: number }
}

export class SolaVoltaCalculator {
  private cfg: CalculatorConfig
  private kWp: number
  private plz: string
  private roofType: RoofType

  constructor(
    input: { kWp: number; plz: string; roofType: RoofType },
    cfg?: Partial<CalculatorConfig>
  ) {
    this.kWp = input.kWp
    this.plz = input.plz
    this.roofType = input.roofType
    this.cfg = {
      modulePowerW: 455,
      moduleModel: 'Trina TSM-455',
      moduleUnitPrice: 130, // EUR pro Modul (Material)
      inverterModel: 'SolaX X3 hybrid',
      inverterUnitPrice: 950, // EUR pro 5 kW Schritt
      baseMountingPerModule: 116,
      roofTypeFactors: { ziegel: 1.0, blech: 1.12, flach: 1.25 },
      plzZoneSurcharge: {
        '1': 0,
        '2': 30,
        '3': 50,
        '4': 70,
        '5': 90,
        '6': 110,
        '7': 130,
        '8': 150,
        '9': 170,
      },
      fixedDiscountPerkWp: 250,
      travelFlat: 150,
      logisticsFlat: 200,
      vatRate: 0.2,
      ...cfg,
    }
  }

  public setInput(kWp: number, plz: string, roofType: RoofType) {
    this.kWp = kWp
    this.plz = plz
    this.roofType = roofType
  }

  public calculateModules(kWp: number = this.kWp): number {
    return Math.max(1, Math.ceil((kWp * 1000) / this.cfg.modulePowerW))
  }

  public calculateFixedDiscount(kWp: number = this.kWp): number {
    return -(kWp * this.cfg.fixedDiscountPerkWp)
  }

  public calculateMountingCost(modules: number, roofType: RoofType = this.roofType): number {
    const factor = this.cfg.roofTypeFactors[roofType] ?? 1
    return round2(modules * this.cfg.baseMountingPerModule * factor)
  }

  public calculatePLZSurcharge(plz: string = this.plz): number {
    const zone = (plz || '').trim()[0] || '1'
    return this.cfg.plzZoneSurcharge[zone] ?? 0
  }

  private calculateInverterCount(): number {
    // Simple sizing: 1 unit per 5 kWp
    return Math.max(1, Math.ceil(this.kWp / 5))
  }

  public calculateTotal(): CalculationResult {
    const modules = this.calculateModules()
    const invCount = this.calculateInverterCount()

    const positions: SapPosition[] = []

    // Module material
    positions.push(makePos('PV-MOD', this.cfg.moduleModel, modules, 'pcs', this.cfg.moduleUnitPrice, { powerW: this.cfg.modulePowerW }))

    // Inverter (steps of ~5 kW)
    positions.push(makePos('PV-INV', this.cfg.inverterModel, invCount, 'pcs', this.cfg.inverterUnitPrice))

    // Mounting
    const mounting = this.calculateMountingCost(modules, this.roofType)
    positions.push(makePos('PV-MOUNT', `Montagepauschale (${this.roofType})`, 1, 'eur', mounting))

    // Zuschläge/Pauschalen
    positions.push(makePos('PV-TRAVEL', 'Anfahrtpauschale', 1, 'eur', this.cfg.travelFlat))
    positions.push(makePos('PV-LOG', 'Logistik/Entsorgung', 1, 'eur', this.cfg.logisticsFlat))

    // PLZ-Zone
    const plzSurch = this.calculatePLZSurcharge(this.plz)
    if (plzSurch > 0) positions.push(makePos('PV-PLZ', `PLZ-Zone ${this.plz}`, 1, 'eur', plzSurch))

    // Abschlag (negativ)
    const discount = this.calculateFixedDiscount(this.kWp)
    positions.push(makePos('PV-DISCOUNT', `Fixer Abschlag ${this.kWp.toFixed(2)} kWp × ${this.cfg.fixedDiscountPerkWp}€`, 1, 'eur', discount))

    const net = round2(positions.reduce((s, p) => s + p.total, 0))
    const vat = round2(net * this.cfg.vatRate)
    const gross = round2(net + vat)

    return {
      kWp: this.kWp,
      plz: this.plz,
      roofType: this.roofType,
      modules,
      positions,
      totals: { net, vat, gross },
    }
  }
}

function makePos(code: string, name: string, quantity: number, unit: SapPosition['unit'], unitPrice: number, meta?: Record<string, any>): SapPosition {
  const total = round2((unit === 'eur' ? 1 : quantity) * unitPrice)
  return { sapCode: code, name, quantity, unit, unitPrice, total, meta }
}

function round2(n: number): number { return Math.round(n * 100) / 100 }


