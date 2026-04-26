import { useEffect, useState } from 'react';
import { collection, doc, getDocs, onSnapshot, updateDoc, deleteDoc, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [newProd, setNewProd] = useState({ name: '', price: 0, stock: 0, imageUrl: '' });

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name'));
    const unsub = onSnapshot(q, (snap) => {
      const list: Product[] = [];
      snap.forEach(doc => {
        const data = doc.data() as Omit<Product, 'id'>;
        list.push({ id: doc.id, ...data });
      });
      setProducts(list);
    });
    return unsub;
  }, []);

  const startEdit = (p: Product) => setEditing(p);
  const cancelEdit = () => setEditing(null);

  const saveEdit = async () => {
    if (!editing) return;
    const { id, ...rest } = editing;
    await updateDoc(doc(db, 'products', id), rest);
    setEditing(null);
  };

  const remove = async (id: string) => {
    if (confirm('Delete product?')) await deleteDoc(doc(db, 'products', id));
  };

  const addProduct = async () => {
    await addDoc(collection(db, 'products'), { ...newProd });
    setNewProd({ name: '', price: 0, stock: 0, imageUrl: '' });
  };

  return (
    <div>
      <h1>Inventory Management</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Name</th><th>Price</th><th>Stock</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>${p.price.toFixed(2)}</td>
              <td>{p.stock}</td>
              <td>
                <button onClick={() => startEdit(p)}>Edit</button>
                <button onClick={() => remove(p.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing && (
        <div style={{ marginTop: 20 }}>
          <h3>Edit Product</h3>
          <label>Name: <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></label><br/>
          <label>Price: <input type='number' value={editing.price} onChange={e => setEditing({ ...editing, price: parseFloat(e.target.value) })} /></label><br/>
          <label>Stock: <input type='number' value={editing.stock} onChange={e => setEditing({ ...editing, stock: parseInt(e.target.value) })} /></label><br/>
          <button onClick={saveEdit}>Save</button>
          <button onClick={cancelEdit}>Cancel</button>
        </div>
      )}

      <div style={{ marginTop: 30 }}>
        <h3>Add New Product</h3>
        <label>Name: <input value={newProd.name} onChange={e => setNewProd({ ...newProd, name: e.target.value })} /></label><br/>
        <label>Price: <input type='number' value={newProd.price} onChange={e => setNewProd({ ...newProd, price: parseFloat(e.target.value) })} /></label><br/>
        <label>Stock: <input type='number' value={newProd.stock} onChange={e => setNewProd({ ...newProd, stock: parseInt(e.target.value) })} /></label><br/>
        <label>Image URL: <input value={newProd.imageUrl} onChange={e => setNewProd({ ...newProd, imageUrl: e.target.value })} /></label><br/>
        <button onClick={addProduct}>Add Product</button>
      </div>
    </div>
  );
}
