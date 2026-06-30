-- Add preorder column to produk table
ALTER TABLE produk ADD COLUMN preorder boolean DEFAULT false NOT NULL;
