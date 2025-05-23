"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import BusinessLayout from "@/app/components/layouts/BusinessLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowUpDown, Check, Package, PenSquare, Plus, Search, Trash2, XCircle } from "lucide-react";
import ProductCard from "@/app/components/products/ProductCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

// Ürün kategorisi tipi
interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parentId: string | null;
  _count: {
    products: number;
    children: number;
  };
}

// Ürün tipi
interface Product {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  quantity: number;
  price: number;
  sku: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  categoryId: string | null;
  category: ProductCategory | null;
}

// Filtreleme tipi
interface Filters {
  page: number;
  limit: number;
  category: string;
  search: string;
  orderBy: string;
  orderDir: string;
  isActive: string;
}

export default function BusinessProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    limit: 12,
    category: "",
    search: "",
    orderBy: "name",
    orderDir: "asc",
    isActive: "all",
  });
  
  // Form değerleri
  const [formValues, setFormValues] = useState({
    name: "",
    description: "",
    price: 0,
    quantity: 0,
    sku: "",
    imageUrl: "",
    categoryId: "",
    isActive: true,
  });
  
  const router = useRouter();

  // Ürünleri ve kategorileri yükle
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/auth/login");
        return;
      }

      // Query parametrelerini oluştur
      const queryParams = new URLSearchParams();
      queryParams.append("page", filters.page.toString());
      queryParams.append("limit", filters.limit.toString());
      
      if (filters.category) {
        queryParams.append("category", filters.category);
      }
      
      if (filters.search) {
        queryParams.append("search", filters.search);
      }
      
      queryParams.append("orderBy", filters.orderBy);
      queryParams.append("orderDir", filters.orderDir);
      queryParams.append("isActive", filters.isActive);

      // API çağrısı
      const response = await axios.get(`/api/business/products?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        setProducts(response.data.products);
        setTotalProducts(response.data.pagination.total);
        setTotalPages(response.data.pagination.pages);
      } else {
        setError("Ürünler yüklenirken bir hata oluştu.");
      }
    } catch (error) {
      console.error("Ürünler yüklenirken hata:", error);
      setError("Veriler yüklenemedi. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/auth/login");
        return;
      }

      // API çağrısı
      const response = await axios.get("/api/business/categories", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        setCategories(response.data);
      } else {
        console.error("Kategoriler yüklenirken hata:", response);
      }
    } catch (error) {
      console.error("Kategoriler yüklenirken hata:", error);
    }
  };

  const handleAddProduct = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await axios.post("/api/business/products", formValues, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 201) {
        // Yeni ürünü ekle
        fetchProducts();
        setShowAddModal(false);
        resetForm();
      }
    } catch (error) {
      console.error("Ürün eklenirken hata:", error);
      setError("Ürün eklenirken bir hata oluştu.");
    }
  };

  const handleEditProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await axios.put(`/api/business/products?id=${selectedProduct.id}`, formValues, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        // Ürünleri yeniden yükle
        fetchProducts();
        setShowEditModal(false);
        resetForm();
      }
    } catch (error) {
      console.error("Ürün güncellenirken hata:", error);
      setError("Ürün güncellenirken bir hata oluştu.");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Bu ürünü silmek istediğinizden emin misiniz?")) return;
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await axios.delete(`/api/business/products?id=${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        // Ürünü listeden kaldır
        setProducts(products.filter(p => p.id !== productId));
      }
    } catch (error) {
      console.error("Ürün silinirken hata:", error);
      setError("Ürün silinirken bir hata oluştu.");
    }
  };

  // Form değerlerini sıfırla
  const resetForm = () => {
    setFormValues({
      name: "",
      description: "",
      price: 0,
      quantity: 0,
      sku: "",
      imageUrl: "",
      categoryId: "",
      isActive: true,
    });
  };

  // Ürün düzenleme modalını göster
  const showEditProductModal = (product: Product) => {
    setSelectedProduct(product);
    setFormValues({
      name: product.name,
      description: product.description || "",
      price: product.price,
      quantity: product.quantity,
      sku: product.sku || "",
      imageUrl: product.imageUrl || "",
      categoryId: product.categoryId || "",
      isActive: product.isActive,
    });
    setShowEditModal(true);
  };

  // Form değerlerini güncelle
  const handleFormChange = (name: string, value: string | number | boolean) => {
    setFormValues({
      ...formValues,
      [name]: value,
    });
  };

  // Arama filtresini güncelle
  const handleSearchChange = (value: string) => {
    setFilters({
      ...filters,
      search: value,
      page: 1,
    });
  };

  // Sıralama filtresini güncelle
  const handleSortChange = (field: string) => {
    const newDir = filters.orderDir === "asc" ? "desc" : "asc";
    setFilters({
      ...filters,
      orderBy: field,
      orderDir: newDir,
    });
  };

  // Kategori filtresini güncelle
  const handleCategoryChange = (value: string) => {
    setFilters({
      ...filters,
      category: value,
      page: 1,
    });
  };

  // Aktiflik durumu filtresini güncelle
  const handleStatusChange = (value: string) => {
    setFilters({
      ...filters,
      isActive: value,
      page: 1,
    });
  };

  // Sayfa değişimi
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    setFilters({
      ...filters,
      page: newPage,
    });
  };

  return (
    <BusinessLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Ürün Yönetimi</h1>
            
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Ürün Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Yeni Ürün Ekle</DialogTitle>
                  <DialogDescription>
                    Ürün bilgilerini girerek envantere yeni bir ürün ekleyin.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Ürün Adı
                    </Label>
                    <Input
                      id="name"
                      value={formValues.name}
                      onChange={(e) => handleFormChange("name", e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Açıklama
                    </Label>
                    <Textarea
                      id="description"
                      value={formValues.description}
                      onChange={(e) => handleFormChange("description", e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">
                      Fiyat
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      value={formValues.price}
                      onChange={(e) => handleFormChange("price", parseFloat(e.target.value))}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quantity" className="text-right">
                      Stok Adedi
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formValues.quantity}
                      onChange={(e) => handleFormChange("quantity", parseInt(e.target.value))}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sku" className="text-right">
                      SKU
                    </Label>
                    <Input
                      id="sku"
                      value={formValues.sku}
                      onChange={(e) => handleFormChange("sku", e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="imageUrl" className="text-right">
                      Görsel URL
                    </Label>
                    <Input
                      id="imageUrl"
                      value={formValues.imageUrl}
                      onChange={(e) => handleFormChange("imageUrl", e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">
                      Kategori
                    </Label>
                    <Select
                      value={formValues.categoryId}
                      onValueChange={(value) => handleFormChange("categoryId", value)}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Kategori seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Kategorisiz</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="isActive" className="text-right">
                      Aktif
                    </Label>
                    <div className="flex items-center space-x-2 col-span-3">
                      <Switch
                        id="isActive"
                        checked={formValues.isActive}
                        onCheckedChange={(checked) => handleFormChange("isActive", checked)}
                      />
                      <Label htmlFor="isActive">
                        {formValues.isActive ? "Aktif" : "Pasif"}
                      </Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                    İptal
                  </Button>
                  <Button type="button" onClick={handleAddProduct}>
                    Ekle
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          {/* Filtreleme ve Arama */}
          <div className="mb-6 flex flex-col md:flex-row justify-between gap-4">
            <div className="flex md:w-1/2 space-x-2">
              <div className="flex items-center w-full md:w-64 relative">
                <Search className="absolute left-2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Ürün ara..."
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <Select
                value={filters.category}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tüm Kategoriler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tüm Kategoriler</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-2">
              <Select
                value={filters.isActive}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="true">Aktif</SelectItem>
                  <SelectItem value="false">Pasif</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                onClick={() => handleSortChange(filters.orderBy)}
                className="flex items-center"
              >
                <span className="mr-1">{filters.orderBy === "name" ? "İsim" : filters.orderBy === "price" ? "Fiyat" : "Stok"}</span>
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Ürün Kartları */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Ürün bulunamadı</h3>
              <p className="mt-1 text-sm text-gray-500">
                Henüz hiç ürün eklenmemiş veya filtrelere uygun ürün yok.
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center mx-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Ürün Ekle
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={() => showEditProductModal(product)}
                    onDelete={() => handleDeleteProduct(product.id)}
                  />
                ))}
              </div>
              
              {/* Sayfalama */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      disabled={filters.page === 1}
                      onClick={() => handlePageChange(filters.page - 1)}
                    >
                      Önceki
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={page === filters.page ? "default" : "outline"}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      disabled={filters.page === totalPages}
                      onClick={() => handlePageChange(filters.page + 1)}
                    >
                      Sonraki
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Ürün Düzenleme Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Ürünü Düzenle</DialogTitle>
              <DialogDescription>
                Ürün bilgilerini güncelleyin.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Ürün Adı
                </Label>
                <Input
                  id="edit-name"
                  value={formValues.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Açıklama
                </Label>
                <Textarea
                  id="edit-description"
                  value={formValues.description}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-price" className="text-right">
                  Fiyat
                </Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={formValues.price}
                  onChange={(e) => handleFormChange("price", parseFloat(e.target.value))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-quantity" className="text-right">
                  Stok Adedi
                </Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  value={formValues.quantity}
                  onChange={(e) => handleFormChange("quantity", parseInt(e.target.value))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-sku" className="text-right">
                  SKU
                </Label>
                <Input
                  id="edit-sku"
                  value={formValues.sku}
                  onChange={(e) => handleFormChange("sku", e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-imageUrl" className="text-right">
                  Görsel URL
                </Label>
                <Input
                  id="edit-imageUrl"
                  value={formValues.imageUrl}
                  onChange={(e) => handleFormChange("imageUrl", e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-category" className="text-right">
                  Kategori
                </Label>
                <Select
                  value={formValues.categoryId}
                  onValueChange={(value) => handleFormChange("categoryId", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Kategorisiz</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-isActive" className="text-right">
                  Aktif
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="edit-isActive"
                    checked={formValues.isActive}
                    onCheckedChange={(checked) => handleFormChange("isActive", checked)}
                  />
                  <Label htmlFor="edit-isActive">
                    {formValues.isActive ? "Aktif" : "Pasif"}
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                İptal
              </Button>
              <Button type="button" onClick={handleEditProduct}>
                Güncelle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </BusinessLayout>
  );
} 