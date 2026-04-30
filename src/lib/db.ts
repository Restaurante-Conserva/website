import dbConnect from './mongoose';
import { Category, Product, Table, Sale, Config, Employee, Customer, CashRegister } from '../models/Schemas';

class Database {
    // CATEGORIES
    async getCategories() {
        await dbConnect();
        let categories = await Category.find({}).lean();
        if (categories.length === 0) {
            const defaults = ['Pizzas', 'Bebidas', 'Lanches', 'Porções'];
            await Category.insertMany(defaults.map(name => ({ name })));
            categories = await Category.find({}).lean();
        }
        return categories;
    }

    async addCategory(data: { name: string; image?: string }) {
        await dbConnect();
        return await Category.create(data);
    }

    async updateCategory(id: string, updates: any) {
        await dbConnect();
        return await Category.findByIdAndUpdate(id, updates, { returnDocument: 'after' });
    }

    async deleteCategory(id: string) {
        await dbConnect();
        await Category.findByIdAndDelete(id);
        await Product.deleteMany({ categoryId: id });
    }

    // PRODUCTS
    async getProducts() {
        await dbConnect();
        let products = await Product.find({}).lean();
        if (products.length === 0) {
            const cats = await this.getCategories();
            const pizzaCat = cats.find((c: any) => c.name === 'Pizzas');
            const drinkCat = cats.find((c: any) => c.name === 'Bebidas');

            if (pizzaCat && drinkCat) {
                await Product.insertMany([
                    { name: 'Pizza Calabresa Especial G', price: 55.00, categoryId: pizzaCat._id, stock: 100 },
                    { name: 'Pizza Marguerita Clássica', price: 52.00, categoryId: pizzaCat._id, stock: 100 },
                    { name: 'Coca-Cola Latinha 350ml', price: 6.00, categoryId: drinkCat._id, stock: 50 },
                    { name: 'Suco Natural Laranja 500ml', price: 12.00, categoryId: drinkCat._id, stock: 20 },
                ]);
                products = await Product.find({}).lean();
            }
        }
        return products;
    }

    async addProduct(product: any) {
        await dbConnect();
        return await Product.create(product);
    }

    async updateProduct(id: string, updates: any) {
        await dbConnect();
        return await Product.findByIdAndUpdate(id, updates, { returnDocument: 'after' });
    }

    async deleteProduct(id: string) {
        await dbConnect();
        return await Product.findByIdAndDelete(id);
    }

    // TABLES
    async getTables() {
        await dbConnect();
        let tables = await Table.find({}).lean();
        if (tables.length === 0) {
            const count = (await this.getConfig()).tableCount || 12;
            const defaults = Array.from({ length: count }, (_, i) => ({ number: i + 1 }));
            await Table.insertMany(defaults);
            tables = await Table.find({}).lean();
        }
        return tables;
    }

    async updateTable(id: string, updates: any) {
        await dbConnect();
        return await Table.findByIdAndUpdate(id, updates, { returnDocument: 'after' });
    }

    // CONFIG
    async getConfig() {
        await dbConnect();
        let config = await Config.findOne({}).lean();
        if (!config) {
            config = await Config.create({
                tableCount: 12,
                fiscal: {
                    cnpj_emitente: "61516347000186",
                    nome_emitente: "RESTAURANTE E PIZZARIA CONSERVA LTDA",
                    nome_fantasia_emitente: "RESTAURANTE E PIZZARIA CONSERVA",
                    logradouro_emitente: "AVENIDA PADRE JOAO FACUNDO",
                    numero_emitente: "34",
                    bairro_emitente: "CENTRO",
                    municipio_emitente: "CAPUTIRA",
                    uf_emitente: "MG",
                    cep_emitente: "36925000",
                    inscricao_estadual_emitente: "0052366780044",
                    regime_tributario: "1",
                    environment: "homologacao"
                }
            });
        } else if (!config.fiscal || !config.fiscal.cnpj_emitente) {
            // Fill existing config with defaults if fiscal data is missing
            config.fiscal = {
                cnpj_emitente: "61516347000186",
                nome_emitente: "RESTAURANTE E PIZZARIA CONSERVA LTDA",
                nome_fantasia_emitente: "RESTAURANTE E PIZZARIA CONSERVA",
                logradouro_emitente: "AVENIDA PADRE JOAO FACUNDO",
                numero_emitente: "34",
                bairro_emitente: "CENTRO",
                municipio_emitente: "CAPUTIRA",
                uf_emitente: "MG",
                cep_emitente: "36925000",
                inscricao_estadual_emitente: "0052366780044",
                regime_tributario: "1",
                environment: "homologacao"
            };
            await config.save();
        }
        return config;
    }

    async updateConfig(updates: any) {
        await dbConnect();
        return await Config.findOneAndUpdate({}, updates, { upsert: true, returnDocument: 'after' });
    }

    // SALES
    async getSales(limit?: number, from?: string, to?: string) {
        await dbConnect();
        const filter: any = {};
        if (from || to) {
            filter.date = {};
            if (from) filter.date.$gte = new Date(from + 'T00:00:00');
            if (to) filter.date.$lte = new Date(to + 'T23:59:59');
        }
        const query = Sale.find(filter).sort({ date: -1 }).lean();
        if (limit) query.limit(limit);
        return await query;
    }

    async addSale(sale: any) {
        await dbConnect();

        console.log(`[DATABASE DEBUG] Starting addSale. isFiscal: ${sale.isFiscal}`);

        // 1. Reduzir estoque
        for (const item of sale.items) {
            const product = await Product.findById(item.id || item.productId);
            if (product && product.stock !== null) {
                product.stock -= item.quantity;
                // Anexar dados fiscais ao item para o Focus se não vierem do frontend
                item.ncm = product.ncm || item.ncm;
                item.cfop = product.cfop || item.cfop;
                item.icms_origem = product.icms_origem || item.icms_origem;
                item.icms_situacao_tributaria = product.icms_situacao_tributaria || item.icms_situacao_tributaria;
                await product.save();
            }
        }

        // 2. Salvar venda inicial no banco
        const newSale = new Sale(sale);
        await newSale.save();
        const saleId = (newSale as any)._id.toString();

        // 3. Processamento Fiscal (Focus NFe)
        if (sale.isFiscal) {
            try {
                const { focusNFe } = await import('./focus');
                const config = await this.getConfig();

                if (focusNFe.isConfigured() && config.fiscal?.cnpj_emitente) {
                    console.log(`[DATABASE DEBUG] Emitting NFCe for Sale ${saleId}`);
                    const payload = focusNFe.buildNFCePayload(sale, config.fiscal);
                    const focusResponse = await focusNFe.emitirNFCe(saleId, payload);

                    if (focusResponse.status === 'autorizado' || focusResponse.status === 'processando') {
                        console.log(`[DATABASE DEBUG] Focus Response for Sale ${saleId}:`, JSON.stringify(focusResponse, null, 2));

                        (newSale as any).nfeStatus = 'issued';
                        (newSale as any).nfeId = focusResponse.protocolo;
                        (newSale as any).nfeUrl = focusResponse.caminho_xml_nota_fiscal;
                        (newSale as any).nfeDanfeUrl = focusResponse.caminho_danfe || focusResponse.url_danfe;
                        (newSale as any).fiscalReference = focusResponse.chave_nfe;
                        (newSale as any).nfeNumber = focusResponse.numero;
                        (newSale as any).nfeSeries = focusResponse.serie;
                        (newSale as any).nfeQRCode = focusResponse.qrcode_url;
                        (newSale as any).qrcode_url = focusResponse.qrcode_url;
                        (newSale as any).nfeExternalUrl = focusResponse.url_consulta_nf;
                        (newSale as any).nfeMessage = focusResponse.mensagem_sefaz;
                        (newSale as any).fiscalData = focusResponse;

                        console.log(`[DATABASE DEBUG] Saved QR Code URL: ${focusResponse.qrcode_url}`);
                        console.log(`[DATABASE DEBUG] NFCe Issued successfully for Sale ${saleId}`);
                    } else {
                        (newSale as any).nfeStatus = 'error';
                        (newSale as any).nfeError = focusResponse.mensagem_sefaz || 'Erro desconhecido na SEFAZ';
                        console.error(`[DATABASE DEBUG] NFCe Error for Sale ${saleId}:`, focusResponse);
                    }
                } else {
                    (newSale as any).nfeStatus = 'error';
                    (newSale as any).nfeError = 'Focus API ou Dados do Emitente não configurados';
                    console.warn(`[DATABASE DEBUG] Focus API or Issuer Data not configured for Sale ${saleId}`);
                }
            } catch (error: any) {
                (newSale as any).nfeStatus = 'error';
                (newSale as any).nfeError = error.message || 'Erro interno ao processar NFCe';
                console.error(`[DATABASE DEBUG] Critical Error processing NFCe for Sale ${saleId}:`, error);
            }
            await newSale.save();
            console.log(`[DATABASE DEBUG] Sale ${saleId} saved with fiscal fields:`, {
                qrcode_url: (newSale as any).qrcode_url,
                nfeQRCode: (newSale as any).nfeQRCode,
                nfeNumber: (newSale as any).nfeNumber,
                nfeSeries: (newSale as any).nfeSeries,
                fiscalReference: (newSale as any).fiscalReference
            });
        }

        // 4. Atualizar métricas do cliente (Fidelidade e Fiado)
        if (sale.customer && (sale.customer.id || sale.customer._id)) {
            const customerId = sale.customer.id || sale.customer._id;
            const customer = await Customer.findById(customerId);
            if (customer) {
                const earnedPoints = Math.floor((sale.total || 0) / 10);
                customer.loyaltyPoints = (customer.loyaltyPoints || 0) + earnedPoints;
                customer.totalSpent = (customer.totalSpent || 0) + (sale.total || 0);
                customer.lastVisit = new Date();

                const debtAmount = sale.payments
                    .filter((p: any) => p.method === 'fiado')
                    .reduce((acc: number, p: any) => acc + p.amount, 0);

                if (debtAmount > 0) {
                    customer.debtBalance = (customer.debtBalance || 0) + debtAmount;
                    customer.debtHistory.push({
                        date: new Date(),
                        type: 'addition',
                        description: `Venda ${saleId.substring(18)}`,
                        amount: debtAmount
                    });
                }
                await customer.save();
            }
        }

        // 5. Registrar no Caixa se houver um aberto
        const activeCash = await this.getActiveCashRegister();
        if (activeCash && sale.payments) {
            const cashPayment = sale.payments.find((p: any) => p.method === 'money' || p.method === 'cash');
            if (cashPayment) {
                activeCash.transactions.push({
                    type: 'in',
                    amount: cashPayment.amount,
                    description: `Venda #${saleId.substring(18)}`
                });
                await activeCash.save();
            }
        }

        console.log(`[DATABASE DEBUG] Returning sale ${saleId} with fiscal data:`, {
            qrcode_url: (newSale as any).qrcode_url,
            nfeQRCode: (newSale as any).nfeQRCode,
            fiscalReference: (newSale as any).fiscalReference,
            nfeNumber: (newSale as any).nfeNumber,
            nfeSeries: (newSale as any).nfeSeries,
            hasFiscalData: !!(newSale as any).fiscalData
        });

        return newSale;
    }

    async updateSale(id: string, updates: any) {
        await dbConnect();
        return await Sale.findByIdAndUpdate(id, updates, { returnDocument: 'after' });
    }

    async cancelSale(id: string) {
        await dbConnect();
        const sale = await Sale.findById(id);
        if (!sale) throw new Error("Venda não encontrada");
        if (sale.status === 'refunded') throw new Error("Venda já cancelada");

        // 1. Devolver ao estoque
        for (const item of sale.items) {
            const product = await Product.findById(item.productId || item.id);
            if (product && product.stock !== null) {
                product.stock += item.quantity;
                await product.save();
            }
        }

        // 2. Reverter pontos de fidelidade e débitos do cliente
        if (sale.customer && (sale.customer.id || sale.customer._id)) {
            const customerId = sale.customer.id || sale.customer._id;
            const customer = await Customer.findById(customerId);
            if (customer) {
                const pointsToDeduct = Math.floor((sale.total || 0) / 10);
                customer.loyaltyPoints = Math.max(0, (customer.loyaltyPoints || 0) - pointsToDeduct);
                customer.totalSpent = Math.max(0, (customer.totalSpent || 0) - (sale.total || 0));

                const debtAmount = sale.payments
                    .filter((p: any) => p.method === 'fiado' || p.method === 'debt')
                    .reduce((acc: number, p: any) => acc + p.amount, 0);

                if (debtAmount > 0) {
                    customer.debtBalance = Math.max(0, (customer.debtBalance || 0) - debtAmount);
                    customer.debtHistory.push({
                        date: new Date(),
                        type: 'adjustment',
                        description: `Cancelamento Venda ${id.substring(18)}`,
                        amount: -debtAmount
                    });
                }
                await customer.save();
            }
        }

        // 3. Registrar saída no caixa se houver um aberto (estorno de dinheiro)
        const activeCash = await this.getActiveCashRegister();
        if (activeCash && sale.payments) {
            const cashPayment = sale.payments.find((p: any) => p.method === 'money' || p.method === 'cash');
            if (cashPayment) {
                activeCash.transactions.push({
                    type: 'out',
                    amount: cashPayment.amount,
                    description: `Estorno Venda #${id.substring(18)}`
                });
                await activeCash.save();
            }
        }

        // 4. Marcar venda como estornada
        sale.status = 'refunded';
        return await sale.save();
    }

    // CUSTOMERS
    async getCustomers() {
        await dbConnect();
        return await Customer.find({}).sort({ name: 1 }).lean();
    }

    async addCustomer(customer: any) {
        await dbConnect();
        return await Customer.create(customer);
    }

    async updateCustomer(id: string, updates: any) {
        await dbConnect();
        return await Customer.findByIdAndUpdate(id, updates, { returnDocument: 'after' });
    }

    async findCustomerByCpf(cpf: string) {
        await dbConnect();
        return await Customer.findOne({ cpf });
    }

    // EMPLOYEES
    async getEmployees() {
        await dbConnect();
        return await Employee.find({}).lean();
    }

    async getEmployeeByPassword(password: string) {
        await dbConnect();
        const count = await Employee.countDocuments();
        if (count === 0) {
            await Employee.create({
                name: 'Administrador',
                password: 'admin',
                role: 'admin'
            });
        }
        return await Employee.findOne({ password, active: true }).lean();
    }

    async addEmployee(employee: any) {
        await dbConnect();
        return await Employee.create(employee);
    }

    async deleteEmployee(id: string) {
        await dbConnect();
        return await Employee.findByIdAndDelete(id);
    }

    // CASH REGISTER
    async getActiveCashRegister() {
        await dbConnect();
        return await CashRegister.findOne({ status: 'open' });
    }

    async openCashRegister(initialAmount: number, openedBy: string) {
        await dbConnect();
        const existing = await this.getActiveCashRegister();
        if (existing) throw new Error("Caixa já está aberto");
        return await CashRegister.create({ initialAmount, openedBy, status: 'open' });
    }

    async closeCashRegister(finalAmount: number, closedBy: string) {
        await dbConnect();
        const active = await this.getActiveCashRegister();
        if (!active) throw new Error("Nenhum caixa aberto");

        active.status = 'closed';
        active.closedAt = new Date();
        active.closedBy = closedBy;
        active.finalAmount = finalAmount;

        const totalTransactions = active.transactions.reduce((acc: number, t: any) =>
            t.type === 'in' ? acc + t.amount : acc - t.amount, 0);
        active.expectedAmount = active.initialAmount + totalTransactions;

        return await active.save();
    }

    async addCashTransaction(amount: number, type: 'in' | 'out', description: string) {
        await dbConnect();
        const active = await this.getActiveCashRegister();
        if (!active) throw new Error("Nenhum caixa aberto");

        active.transactions.push({
            type,
            amount,
            description,
            date: new Date()
        });

        return await active.save();
    }
}

export const db = new Database();
