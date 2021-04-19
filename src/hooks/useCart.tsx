import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data } = await api.get<UpdateProductAmount>(`stock/${productId}`);

      const currentCart = [...cart];
      const stockAmount = data.amount;
      const productExist = currentCart.find(product => product.id === productId);
      const currentAmount = productExist ? productExist.amount : 0;
      const amount = currentAmount + 1;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExist) {
        productExist.amount = amount;
      } else {
        const { data } = await api.get(`products/${productId}`)

        const newProduct = {
          ...data,
          amount: 1
        }

        currentCart.push(newProduct);
      }

      setCart(currentCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(currentCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const currentCart = [...cart];
      const productIndex = currentCart.findIndex(product => product.id === productId);

      if (productIndex >= 0) {
        currentCart.splice(productIndex, 1);

        setCart(currentCart);

        localStorage.setItem("@RocketShoes:cart", JSON.stringify(currentCart))
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }
      const { data } = await api.get<Stock>(`stock/${productId}`);
      const stockTotal = data.amount;

      if (amount > stockTotal) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = [...cart];
      const productExist = updatedCart.find(product => product.id === productId);

      if (productExist) {
        productExist.amount = amount;

        setCart(updatedCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
