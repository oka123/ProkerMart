import { createClient } from "@/lib/supabase/client";

// Type for cart item returned from database
export interface CartItem {
  id_keranjang: string;
  id_pengguna: string;
  id_produk: string;
  jumlah: number;
  tgl_ditambahkan: string;
  produk: {
    id_produk: string;
    nama_produk: string;
    deskripsi: string | null;
    harga: number;
    stok: number;
    foto: string | null;
    kategori: string | null;
    status_aktif: boolean;
    metode_jualan: string;
    sub_toko: {
      id_sub_toko: string;
      nama_proker: string;
      alamat: string | null;
      toko: {
        id_toko: string;
        nama_toko: string;
        organisasi: {
          id_organisasi: string;
          nama_organisasi: string;
        };
      };
    };
  };
}

const CART_SELECT = `
  id_keranjang,
  id_pengguna,
  id_produk,
  jumlah,
  tgl_ditambahkan,
  produk (
    id_produk,
    nama_produk,
    deskripsi,
    harga,
    stok,
    foto,
    kategori,
    status_aktif,
    metode_jualan,
    sub_toko (
      id_sub_toko,
      nama_proker,
      alamat,
      toko (
        id_toko,
        nama_toko,
        organisasi (
          id_organisasi,
          nama_organisasi
        )
      )
    )
  )
`;

/**
 * Fetch all cart items for the currently logged-in user.
 */
export async function getCartItems(): Promise<CartItem[]> {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from("keranjang")
      .select(CART_SELECT)
      .eq("id_pengguna", user.id)
      .order("tgl_ditambahkan", { ascending: false });

    if (error) {
      console.error("[Cart - getCartItems] Error:", error);
      return [];
    }

    return (data as unknown as CartItem[]) ?? [];
  } catch (err) {
    console.error("[Cart - getCartItems] Unexpected error:", err);
    return [];
  }
}

/**
 * Add a product to the cart, or increase quantity if it already exists.
 * Uses Supabase upsert with onConflict on (id_pengguna, id_produk).
 */
export async function addToCart(
  productId: string,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Anda harus login terlebih dahulu" };
    }

    // Check if item already exists in cart
    const { data: existing, error: fetchError } = await supabase
      .from("keranjang")
      .select("id_keranjang, jumlah")
      .eq("id_pengguna", user.id)
      .eq("id_produk", productId)
      .maybeSingle();

    if (fetchError) {
      console.error("[Cart - addToCart] Fetch error:", fetchError);
      return { success: false, error: fetchError.message };
    }

    if (existing) {
      // Update quantity
      const newQuantity = existing.jumlah + quantity;
      const { error: updateError } = await supabase
        .from("keranjang")
        .update({ jumlah: newQuantity })
        .eq("id_keranjang", existing.id_keranjang);

      if (updateError) {
        console.error("[Cart - addToCart] Update error:", updateError);
        return { success: false, error: updateError.message };
      }
    } else {
      // Insert new item
      const { error: insertError } = await supabase
        .from("keranjang")
        .insert({
          id_pengguna: user.id,
          id_produk: productId,
          jumlah: quantity,
        });

      if (insertError) {
        console.error("[Cart - addToCart] Insert error:", insertError);
        return { success: false, error: insertError.message };
      }
    }

    return { success: true };
  } catch (err) {
    console.error("[Cart - addToCart] Unexpected error:", err);
    return { success: false, error: "Terjadi kesalahan tak terduga" };
  }
}

/**
 * Update the quantity of an existing cart item.
 */
export async function updateCartItemQuantity(
  cartId: string,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    if (quantity < 1) {
      return { success: false, error: "Jumlah minimal adalah 1" };
    }

    const { error } = await supabase
      .from("keranjang")
      .update({ jumlah: quantity })
      .eq("id_keranjang", cartId);

    if (error) {
      console.error("[Cart - updateCartItemQuantity] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[Cart - updateCartItemQuantity] Unexpected error:", err);
    return { success: false, error: "Terjadi kesalahan tak terduga" };
  }
}

/**
 * Remove an item from the cart.
 */
export async function removeFromCart(
  cartId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("keranjang")
      .delete()
      .eq("id_keranjang", cartId);

    if (error) {
      console.error("[Cart - removeFromCart] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[Cart - removeFromCart] Unexpected error:", err);
    return { success: false, error: "Terjadi kesalahan tak terduga" };
  }
}

/**
 * Remove multiple items from the cart.
 */
export async function removeMultipleFromCart(
  cartIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("keranjang")
      .delete()
      .in("id_keranjang", cartIds);

    if (error) {
      console.error("[Cart - removeMultipleFromCart] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[Cart - removeMultipleFromCart] Unexpected error:", err);
    return { success: false, error: "Terjadi kesalahan tak terduga" };
  }
}

/**
 * Get the total count of items in the cart for the current user.
 */
export async function getCartCount(): Promise<number> {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return 0;

    const { count, error } = await supabase
      .from("keranjang")
      .select("*", { count: "exact", head: true })
      .eq("id_pengguna", user.id);

    if (error) {
      console.error("[Cart - getCartCount] Error:", error);
      return 0;
    }

    return count ?? 0;
  } catch (err) {
    console.error("[Cart - getCartCount] Unexpected error:", err);
    return 0;
  }
}
