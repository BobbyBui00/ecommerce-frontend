export class Product {
    id: string = "";
    sku: string = "";
    name: string = "";
    description: string = "";
    unitPrice: number = 0;
    imageUrl: string = "";
    active: boolean = false;
    unitsInStock: number = 0;
    dateCreated: number = Date.now();
    lastUpdated: number = Date.now();

}
