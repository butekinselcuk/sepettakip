"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unitPrice: number;
  supplier: string;
  lastUpdated: string;
  reorderPoint: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

interface Supplier {
  id: number;
  name: string;
  contact: string;
  email: string;
  phone: string;
  active: boolean;
}

const InventoryPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState<boolean>(false);

  // Categories
  const categories = ['Gıda', 'İçecek', 'Tatlı', 'Atıştırmalık', 'Paketli Ürünler', 'Diğer'];

  // Status badge colors
  const statusColors = {
    'in-stock': 'success',
    'low-stock': 'warning',
    'out-of-stock': 'destructive'
  };

  // Status labels
  const statusLabels = {
    'in-stock': 'Stokta',
    'low-stock': 'Az Stok',
    'out-of-stock': 'Stokta Yok'
  };

  // New item template
  const newItemTemplate: Omit<InventoryItem, 'id'> = {
    name: '',
    sku: '',
    category: 'Gıda',
    quantity: 0,
    unitPrice: 0,
    supplier: '',
    lastUpdated: new Date().toISOString().split('T')[0],
    reorderPoint: 5,
    status: 'in-stock'
  };

  // New supplier template
  const newSupplierTemplate: Omit<Supplier, 'id'> = {
    name: '',
    contact: '',
    email: '',
    phone: '',
    active: true
  };

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch data from API
        const itemsResponse = await axios.get('/api/business/inventory/items');
        const suppliersResponse = await axios.get('/api/business/inventory/suppliers');
        
        setItems(itemsResponse.data);
        setSuppliers(suppliersResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching inventory data:', error);
        toast.error('Envanter verisi yüklenirken bir hata oluştu');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter items based on search and filters
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Handle adding a new item
  const handleAddItem = () => {
    setEditingItem({ 
      ...newItemTemplate, 
      id: Math.max(0, ...items.map(i => i.id)) + 1 
    } as InventoryItem);
    setIsEditDialogOpen(true);
  };

  // Handle editing an item
  const handleEditItem = (item: InventoryItem) => {
    setEditingItem({ ...item });
    setIsEditDialogOpen(true);
  };

  // Save item (add or update)
  const handleSaveItem = async () => {
    if (!editingItem) return;
    
    try {
      setLoading(true);
      
      // Validate form
      if (!editingItem.name || !editingItem.sku || !editingItem.supplier) {
        toast.error('Lütfen gerekli alanları doldurun');
        setLoading(false);
        return;
      }
      
      // In a real app, this would be an API call
      // if (editingItem.id) {
      //   await axios.put(`/api/inventory/items/${editingItem.id}`, editingItem);
      // } else {
      //   await axios.post('/api/inventory/items', editingItem);
      // }
      
      // Update local state
      const isNewItem = !items.some(i => i.id === editingItem.id);
      
      if (isNewItem) {
        setItems(prev => [...prev, editingItem]);
        toast.success('Yeni ürün eklendi');
      } else {
        setItems(prev => prev.map(i => i.id === editingItem.id ? editingItem : i));
        toast.success('Ürün güncellendi');
      }
      
      setIsEditDialogOpen(false);
      setEditingItem(null);
      setLoading(false);
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Ürün kaydedilirken bir hata oluştu');
      setLoading(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (id: number) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
    
    try {
      setLoading(true);
      
      // In a real app, this would be an API call
      // await axios.delete(`/api/inventory/items/${id}`);
      
      // Update local state
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Ürün silindi');
      setLoading(false);
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Ürün silinirken bir hata oluştu');
      setLoading(false);
    }
  };

  // Handle adding a new supplier
  const handleAddSupplier = () => {
    setSelectedSupplier({ 
      ...newSupplierTemplate, 
      id: Math.max(0, ...suppliers.map(s => s.id)) + 1 
    } as Supplier);
    setIsSupplierDialogOpen(true);
  };

  // Handle editing a supplier
  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier({ ...supplier });
    setIsSupplierDialogOpen(true);
  };

  // Save supplier (add or update)
  const handleSaveSupplier = async () => {
    if (!selectedSupplier) return;
    
    try {
      setLoading(true);
      
      // Validate form
      if (!selectedSupplier.name || !selectedSupplier.contact || !selectedSupplier.email) {
        toast.error('Lütfen gerekli alanları doldurun');
        setLoading(false);
        return;
      }
      
      // In a real app, this would be an API call
      // if (selectedSupplier.id) {
      //   await axios.put(`/api/inventory/suppliers/${selectedSupplier.id}`, selectedSupplier);
      // } else {
      //   await axios.post('/api/inventory/suppliers', selectedSupplier);
      // }
      
      // Update local state
      const isNewSupplier = !suppliers.some(s => s.id === selectedSupplier.id);
      
      if (isNewSupplier) {
        setSuppliers(prev => [...prev, selectedSupplier]);
        toast.success('Yeni tedarikçi eklendi');
      } else {
        setSuppliers(prev => prev.map(s => s.id === selectedSupplier.id ? selectedSupplier : s));
        toast.success('Tedarikçi güncellendi');
      }
      
      setIsSupplierDialogOpen(false);
      setSelectedSupplier(null);
      setLoading(false);
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast.error('Tedarikçi kaydedilirken bir hata oluştu');
      setLoading(false);
    }
  };

  // Update item status based on quantity and reorder point
  const updateItemStatus = (item: InventoryItem): InventoryItem => {
    let status: 'in-stock' | 'low-stock' | 'out-of-stock';
    
    if (item.quantity <= 0) {
      status = 'out-of-stock';
    } else if (item.quantity <= item.reorderPoint) {
      status = 'low-stock';
    } else {
      status = 'in-stock';
    }
    
    return { ...item, status };
  };

  // Handle quantity change for an item
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingItem) return;
    
    const quantity = parseInt(e.target.value) || 0;
    const updatedItem = updateItemStatus({ ...editingItem, quantity });
    
    setEditingItem(updatedItem);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="ml-2">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Header title="Envanter Yönetimi" subtitle="Stok ve tedarikçi bilgilerinizi yönetin" />
      
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="inventory">Envanter</TabsTrigger>
          <TabsTrigger value="suppliers">Tedarikçiler</TabsTrigger>
        </TabsList>
        
        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Envanter Listesi</CardTitle>
                  <CardDescription>Tüm ürünlerin stok durumunu görüntüleyin ve yönetin</CardDescription>
                </div>
                <Button onClick={handleAddItem}>Yeni Ürün Ekle</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Ürün adı, SKU veya tedarikçi ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col md:flex-row gap-2">
                  <Select
                    value={filterCategory}
                    onValueChange={setFilterCategory}
                  >
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Kategoriler</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={filterStatus}
                    onValueChange={setFilterStatus}
                  >
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Durum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Durumlar</SelectItem>
                      <SelectItem value="in-stock">Stokta</SelectItem>
                      <SelectItem value="low-stock">Az Stok</SelectItem>
                      <SelectItem value="out-of-stock">Stokta Yok</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün Adı</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="text-center">Miktar</TableHead>
                      <TableHead className="text-right">Birim Fiyat</TableHead>
                      <TableHead>Tedarikçi</TableHead>
                      <TableHead className="text-center">Durum</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Aramanızla eşleşen ürün bulunamadı.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.sku}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">{item.unitPrice.toFixed(2)} ₺</TableCell>
                          <TableCell>{item.supplier}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={statusColors[item.status] as any}>{statusLabels[item.status]}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEditItem(item)}
                              >
                                Düzenle
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                Sil
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Toplam {filteredItems.length} ürün gösteriliyor
              </div>
              <div className="flex space-x-4">
                <Badge variant="warning" className="ml-auto">
                  Az Stok: {items.filter(i => i.status === 'low-stock').length}
                </Badge>
                <Badge variant="destructive" className="ml-auto">
                  Stokta Yok: {items.filter(i => i.status === 'out-of-stock').length}
                </Badge>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Suppliers Tab */}
        <TabsContent value="suppliers">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Tedarikçi Listesi</CardTitle>
                  <CardDescription>Tedarikçilerinizi görüntüleyin ve yönetin</CardDescription>
                </div>
                <Button onClick={handleAddSupplier}>Yeni Tedarikçi Ekle</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Tedarikçi adı, iletişim veya e-posta ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tedarikçi Adı</TableHead>
                      <TableHead>İlgili Kişi</TableHead>
                      <TableHead>E-posta</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead className="text-center">Durum</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.filter(s => 
                      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.email.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Aramanızla eşleşen tedarikçi bulunamadı.
                        </TableCell>
                      </TableRow>
                    ) : (
                      suppliers.filter(s => 
                        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.email.toLowerCase().includes(searchTerm.toLowerCase())
                      ).map(supplier => (
                        <TableRow key={supplier.id}>
                          <TableCell className="font-medium">{supplier.name}</TableCell>
                          <TableCell>{supplier.contact}</TableCell>
                          <TableCell>{supplier.email}</TableCell>
                          <TableCell>{supplier.phone}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={supplier.active ? 'success' : 'destructive'}>
                              {supplier.active ? 'Aktif' : 'Pasif'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEditSupplier(supplier)}
                              >
                                Düzenle
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter>
              <div className="text-sm text-muted-foreground">
                Toplam {suppliers.filter(s => 
                  s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  s.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  s.email.toLowerCase().includes(searchTerm.toLowerCase())
                ).length} tedarikçi gösteriliyor
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingItem?.id ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}</DialogTitle>
            <DialogDescription>
              Ürün bilgilerini girin ve kaydedin
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Ürün Adı <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    placeholder="Ürün adını girin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU <span className="text-red-500">*</span></Label>
                  <Input
                    id="sku"
                    value={editingItem.sku}
                    onChange={(e) => setEditingItem({ ...editingItem, sku: e.target.value })}
                    placeholder="Stok kodu girin"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select
                    value={editingItem.category}
                    onValueChange={(value) => setEditingItem({ ...editingItem, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Tedarikçi <span className="text-red-500">*</span></Label>
                  <Select
                    value={editingItem.supplier}
                    onValueChange={(value) => setEditingItem({ ...editingItem, supplier: value })}
                  >
                    <SelectTrigger id="supplier">
                      <SelectValue placeholder="Tedarikçi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers
                        .filter(s => s.active)
                        .map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.name}>{supplier.name}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Miktar</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={editingItem.quantity}
                    onChange={handleQuantityChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Birim Fiyat (₺)</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingItem.unitPrice}
                    onChange={(e) => setEditingItem({ ...editingItem, unitPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reorderPoint">Yeniden Sipariş Noktası</Label>
                  <Input
                    id="reorderPoint"
                    type="number"
                    min="0"
                    value={editingItem.reorderPoint}
                    onChange={(e) => setEditingItem({ 
                      ...editingItem, 
                      reorderPoint: parseInt(e.target.value) || 0,
                      status: updateItemStatus({ ...editingItem, reorderPoint: parseInt(e.target.value) || 0 }).status
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Durum</Label>
                  <div className="h-10 flex items-center px-3 mt-1 border rounded-md bg-muted/50">
                    <Badge variant={statusColors[editingItem.status] as any}>
                      {statusLabels[editingItem.status]}
                    </Badge>
                    <div className="ml-2 text-sm text-muted-foreground">
                      (Miktar ve yeniden sipariş noktasına göre otomatik hesaplanır)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSaveItem}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Supplier Dialog */}
      <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedSupplier?.id ? 'Tedarikçi Düzenle' : 'Yeni Tedarikçi Ekle'}</DialogTitle>
            <DialogDescription>
              Tedarikçi bilgilerini girin ve kaydedin
            </DialogDescription>
          </DialogHeader>
          {selectedSupplier && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="supplierName">Tedarikçi Adı <span className="text-red-500">*</span></Label>
                <Input
                  id="supplierName"
                  value={selectedSupplier.name}
                  onChange={(e) => setSelectedSupplier({ ...selectedSupplier, name: e.target.value })}
                  placeholder="Tedarikçi adını girin"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact">İlgili Kişi <span className="text-red-500">*</span></Label>
                  <Input
                    id="contact"
                    value={selectedSupplier.contact}
                    onChange={(e) => setSelectedSupplier({ ...selectedSupplier, contact: e.target.value })}
                    placeholder="İlgili kişi adını girin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={selectedSupplier.email}
                    onChange={(e) => setSelectedSupplier({ ...selectedSupplier, email: e.target.value })}
                    placeholder="E-posta adresini girin"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={selectedSupplier.phone}
                    onChange={(e) => setSelectedSupplier({ ...selectedSupplier, phone: e.target.value })}
                    placeholder="Telefon numarasını girin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="active">Durum</Label>
                  <div className="flex items-center h-10 space-x-2">
                    <input 
                      type="checkbox" 
                      id="active" 
                      checked={selectedSupplier.active} 
                      onChange={(e) => setSelectedSupplier({ ...selectedSupplier, active: e.target.checked })}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="active">Aktif</label>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSupplierDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSaveSupplier}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryPage; 