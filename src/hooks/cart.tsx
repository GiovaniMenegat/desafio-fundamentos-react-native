import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storeProducts =
        (await AsyncStorage.getItem('@GoMarketplace:product')) || null;

      if (storeProducts) {
        setProducts(JSON.parse(storeProducts));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const incrementedProduct = products.find(product => product.id === id);
      if (incrementedProduct) {
        incrementedProduct.quantity += 1;
      }
      setProducts([...products]);
      await AsyncStorage.setItem(
        '@GoMarketplace:product',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async item => {
      const productExists = products.find(product => product.id === item.id);
      if (productExists) {
        increment(item.id);
      } else {
        setProducts([...products, { ...item, quantity: 1 }]);
        await AsyncStorage.setItem(
          '@GoMarketplace:product',
          JSON.stringify([...products, { ...item, quantity: 1 }]),
        );
      }
    },
    [increment, products],
  );

  const decrement = useCallback(
    async id => {
      const decrementProduct = products.find(product => product.id === id);
      if (decrementProduct && decrementProduct.quantity > 1) {
        decrementProduct.quantity -= 1;
        setProducts([...products]);
      } else {
        setProducts([...products.filter(product => product.id !== id)]);
      }
      await AsyncStorage.setItem(
        '@GoMarketplace:product',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
