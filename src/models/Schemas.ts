import mongoose, { Schema } from 'mongoose';

// CATEGORY
const CategorySchema = new Schema({
    name: { type: String, required: true },
    image: { type: String, default: null },
});

// PRODUCT
const ProductSchema = new Schema({
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: null }, // null = infinite
    image: { type: String, default: null },
    // Fiscal Fields
    ncm: { type: String, default: '21069090' }, // Default food preparation
    cfop: { type: String, default: '5102' },   // Default sale
    icms_origem: { type: String, default: '0' },
    icms_situacao_tributaria: { type: String, default: '102' }, // Simples Nacional - Sem permissão de crédito
});

// TABLE
const TableSchema = new Schema({
    number: { type: Number, required: true },
    status: { type: String, enum: ['free', 'occupied'], default: 'free' },
    customerName: { type: String },
    orders: [{
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, required: true }
    }],
});

// SALE
const SaleSchema = new Schema({
    tableId: { type: String },
    tableNumber: { type: Number },
    customerName: { type: String },
    total: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['paid', 'refunded'], default: 'paid' },
    transactionId: { type: String },
    items: [{
        productId: { type: String },
        name: { type: String },
        price: { type: Number },
        quantity: { type: Number }
    }],
    payments: [{
        method: { type: String },
        amount: { type: Number }
    }],
    customer: {
        id: String,
        _id: String,
        name: String,
        cpf: String
    },
    fiadoTaker: { type: String },
    // Fiscal / NFe fields (Consolidated)
    isFiscal: { type: Boolean, default: false },
    fiscalReference: { type: String },
    nfeId: { type: String }, // Protocolo
    nfeStatus: { type: String, enum: ['none', 'pending', 'issued', 'error', 'cancelled'], default: 'none' },
    nfeUrl: { type: String }, // XML
    nfeDanfeUrl: { type: String }, // PDF
    nfeNumber: { type: String },
    nfeSeries: { type: String },
    nfeQRCode: { type: String },
    qrcode_url: { type: String }, // Direct mapping for bridge
    nfeExternalUrl: { type: String },
    nfeMessage: { type: String },
    nfeError: { type: String },
    fiscalData: { type: Object }
});

// CONFIG
const ConfigSchema = new Schema({
    tableCount: { type: Number, default: 12 },
    fiscal: {
        cnpj_emitente: String,
        inscricao_estadual_emitente: String,
        nome_emitente: String,
        nome_fantasia_emitente: String,
        logradouro_emitente: String,
        numero_emitente: String,
        bairro_emitente: String,
        municipio_emitente: String,
        uf_emitente: String,
        cep_emitente: String,
        regime_tributario: { type: String, default: '1' }, // 1 = Simples Nacional
        csc_token: String,
        csc_id: String,
        environment: { type: String, default: 'homologacao' }
    }
});

// RECEIPT
const ReceiptSchema = new Schema({
    receiptNumber: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
    transactionId: {
        type: String,
        required: true,
        index: true
    },
    timestamp: {
        type: Date,
        required: true,
        default: Date.now
    },
    storeInfo: {
        name: String,
        cnpj: String,
        stateRegistration: String,
        address: String,
        city: String,
        state: String,
        zipCode: String,
        phone: String
    },
    cashierName: {
        type: String,
        required: true
    },
    items: [{
        productId: String,
        name: String,
        quantity: Number,
        unitPrice: Number,
        subtotal: Number
    }],
    subtotal: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    tax: {
        icms: Number,
        pis: Number,
        cofins: Number,
        total: Number
    },
    total: {
        type: Number,
        required: true
    },
    payments: [{
        method: {
            type: String,
            enum: ['cash', 'pix', 'credit', 'debit'],
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        amountTendered: Number,
        change: Number
    }],
    customer: {
        name: String,
        cpf: String,
        email: String,
        phone: String
    },
    printStatus: {
        type: String,
        enum: ['pending', 'printed', 'failed'],
        default: 'pending'
    },
    printAttempts: {
        type: Number,
        default: 0
    },
    printErrors: [{
        timestamp: Date,
        error: String
    }]
}, {
    timestamps: true
});

// EMPLOYEE
const EmployeeSchema = new Schema({
    name: { type: String, required: true },
    password: { type: String, required: true }, // Simple password/pin as requested
    role: { type: String, enum: ['admin', 'cashier'], default: 'cashier' },
    active: { type: Boolean, default: true }
}, { timestamps: true });

// CUSTOMER
const CustomerSchema = new Schema({
    name: { type: String, required: true },
    cpf: { type: String, unique: true, sparse: true },
    email: { type: String },
    phone: { type: String },
    address: {
        street: String,
        number: String,
        complement: String,
        neighborhood: String,
        city: String,
        state: String,
        zipCode: String
    },
    loyaltyPoints: { type: Number, default: 0 },
    debtBalance: { type: Number, default: 0 },
    debtHistory: [{
        date: { type: Date, default: Date.now },
        type: { type: String, enum: ['addition', 'payment', 'adjustment'] },
        description: String,
        amount: Number
    }],
    totalSpent: { type: Number, default: 0 },
    lastVisit: { type: Date, default: Date.now }
}, { timestamps: true });

// PRINTER CONFIG
const PrinterConfigSchema = new Schema({
    paperWidth: { type: Number, enum: [58, 80], default: 80 },
    charactersPerLine: { type: Number, default: 48 },
    encoding: { type: String, default: 'utf8' },
    connection: {
        type: { type: String, enum: ['usb', 'network', 'serial'], default: 'usb' },
        usbVendorId: Number,
        usbProductId: Number,
        devicePath: String,
        ipAddress: String,
        port: Number
    },
    headerText: { type: String, default: 'CUPOM FISCAL' },
    footerText: { type: String, default: 'Obrigado pela preferência!' }
}, { timestamps: true });

// CASH REGISTER (CAIXA)
const CashRegisterSchema = new Schema({
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
    openedBy: { type: String, required: true },
    closedBy: { type: String },
    initialAmount: { type: Number, required: true },
    finalAmount: { type: Number },
    expectedAmount: { type: Number },
    transactions: [{
        type: { type: String, enum: ['in', 'out'], required: true },
        amount: { type: Number, required: true },
        description: { type: String },
        date: { type: Date, default: Date.now }
    }],
    status: { type: String, enum: ['open', 'closed'], default: 'open' }
}, { timestamps: true });

// Model Export with Next.js Singleton Pattern
const transform = {
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: function (doc: any, ret: any) {
            ret.id = ret._id ? ret._id.toString() : (ret.id?.toString() || ret.id);
            delete ret._id;
        }
    }
};

CategorySchema.set('toJSON', transform.toJSON);
ProductSchema.set('toJSON', transform.toJSON);
TableSchema.set('toJSON', transform.toJSON);
SaleSchema.set('toJSON', transform.toJSON);
ConfigSchema.set('toJSON', transform.toJSON);
EmployeeSchema.set('toJSON', transform.toJSON);
CustomerSchema.set('toJSON', transform.toJSON);
ReceiptSchema.set('toJSON', transform.toJSON);
PrinterConfigSchema.set('toJSON', transform.toJSON);
CashRegisterSchema.set('toJSON', transform.toJSON);

export const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
export const Table = mongoose.models.Table || mongoose.model('Table', TableSchema);
export const Sale = mongoose.models.Sale || mongoose.model('Sale', SaleSchema);
export const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
export const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
export const Config = mongoose.models.Config || mongoose.model('Config', ConfigSchema);
export const Receipt = mongoose.models.Receipt || mongoose.model('Receipt', ReceiptSchema);
export const PrinterConfig = mongoose.models.PrinterConfig || mongoose.model('PrinterConfig', PrinterConfigSchema);
export const CashRegister = mongoose.models.CashRegister || mongoose.model('CashRegister', CashRegisterSchema);
