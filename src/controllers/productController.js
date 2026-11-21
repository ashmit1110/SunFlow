import * as productService from '../services/productService.js';

export async function list(req, res) {
  res.status(200).json(await productService.listProducts(req.validated.query));
}

export async function create(req, res) {
  const product = await productService.createProduct(req.validated.body);
  res.status(201).json({ data: product });
}

export async function update(req, res) {
  const product = await productService.updateProduct(req.validated.params.id, req.validated.body);
  res.status(200).json({ data: product });
}

export async function stockMovements(req, res) {
  res.status(200).json(await productService.listStockMovements(req.validated.params.id, req.validated.query));
}
