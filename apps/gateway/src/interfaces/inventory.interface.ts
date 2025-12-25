export interface InventoryWarehouse {
  id: string;
  name: string;
  location?: string;
}

export interface InventoryAvailability {
  sku: string;
  totalOnHand: number;
  totalReserved: number;
  totalAvailable: number;
  warehouses: {
    warehouseId: string;
    onHand: number;
    reserved: number;
    available: number;
  }[];
}

export interface InventoryStock {
  sku: string;
  warehouseId: string;
  onHand: number;
  reserved: number;
  createdAt: string;
  updatedAt: string;
}   
