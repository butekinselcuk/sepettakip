"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { Trash2, Edit, Plus, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import PolicyForm from './PolicyForm';

// Politika tipi
interface Policy {
  id: string;
  name: string;
  description?: string;
  autoApproveTimeline?: number | null;
  timeLimit?: number | null;
  orderStatusRules?: any;
  productRules?: any;
  cancellationFees?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const PolicyManagement = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    autoApproveTimeline: '',
    timeLimit: '',
    isActive: true
  });

  // Politikaları getir
  const fetchPolicies = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/business/policies');
      setPolicies(response.data.policies);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Politikalar yüklenirken bir hata oluştu');
      toast.error('Politikalar yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Component yüklendiğinde politikaları getir
  useEffect(() => {
    fetchPolicies();
  }, []);

  // Form değişikliği
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Switch değişikliği
  const handleSwitchChange = (checked: boolean) => {
    setFormData({ ...formData, isActive: checked });
  };

  // Yeni politika oluştur
  const handleCreatePolicy = async () => {
    try {
      const policyData = {
        name: formData.name,
        description: formData.description || undefined,
        autoApproveTimeline: formData.autoApproveTimeline ? parseInt(formData.autoApproveTimeline) : null,
        timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : null,
        isActive: formData.isActive
      };

      await axios.post('/api/business/policies', policyData);
      toast.success('Politika başarıyla oluşturuldu');
      setIsFormOpen(false);
      fetchPolicies();
      resetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Politika oluşturulurken bir hata oluştu');
    }
  };

  // Politika güncelle
  const handleUpdatePolicy = async () => {
    if (!selectedPolicy) return;

    try {
      const policyData = {
        name: formData.name,
        description: formData.description || undefined,
        autoApproveTimeline: formData.autoApproveTimeline ? parseInt(formData.autoApproveTimeline) : null,
        timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : null,
        isActive: formData.isActive
      };

      await axios.patch(`/api/business/policies/${selectedPolicy.id}`, policyData);
      toast.success('Politika başarıyla güncellendi');
      setIsFormOpen(false);
      fetchPolicies();
      resetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Politika güncellenirken bir hata oluştu');
    }
  };

  // Politika sil
  const handleDeletePolicy = async () => {
    if (!selectedPolicy) return;

    try {
      await axios.delete(`/api/business/policies/${selectedPolicy.id}`);
      toast.success('Politika başarıyla silindi');
      setIsDeleteDialogOpen(false);
      fetchPolicies();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Politika silinirken bir hata oluştu');
    }
  };

  // Form reset
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      autoApproveTimeline: '',
      timeLimit: '',
      isActive: true
    });
  };

  // Düzenleme modunu aç
  const openEditMode = (policy: Policy) => {
    setSelectedPolicy(policy);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  // Silme dialogunu aç
  const openDeleteDialog = (policy: Policy) => {
    setSelectedPolicy(policy);
    setIsDeleteDialogOpen(true);
  };

  // Yeni politika oluşturma modunu aç
  const openCreateMode = () => {
    setSelectedPolicy(null);
    setIsEditMode(false);
    resetForm();
    setIsFormOpen(true);
  };

  // PolicyForm onSubmit handler
  const handlePolicyFormSubmit = async (policyData: Partial<Policy>) => {
    try {
      if (isEditMode && selectedPolicy) {
        // Politikayı güncelle
        await axios.patch(`/api/business/policies/${selectedPolicy.id}`, policyData);
        toast.success('Politika başarıyla güncellendi');
      } else {
        // Yeni politika oluştur
        await axios.post('/api/business/policies', policyData);
        toast.success('Politika başarıyla oluşturuldu');
      }
      setIsFormOpen(false);
      fetchPolicies();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'İşlem sırasında bir hata oluştu');
    }
  };

  // Yüklenirken gösterilecek içerik
  if (isLoading && policies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>İade ve İptal Politikaları</CardTitle>
          <CardDescription>Yükleniyor...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Hata durumunda gösterilecek içerik
  if (error && policies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>İade ve İptal Politikaları</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchPolicies}>Yeniden Dene</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {isFormOpen ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{isEditMode ? 'Politika Düzenle' : 'Yeni Politika Oluştur'}</CardTitle>
              <CardDescription>
                {isEditMode
                  ? 'Mevcut politikayı güncelleyin'
                  : 'İade ve iptal için yeni bir politika oluşturun'}
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={() => setIsFormOpen(false)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri Dön
            </Button>
          </CardHeader>
          <CardContent>
            <PolicyForm 
              policy={selectedPolicy}
              onSubmit={handlePolicyFormSubmit}
              isEditMode={isEditMode}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">İade ve İptal Politikaları</h2>
            <Button onClick={openCreateMode}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Politika
            </Button>
          </div>

          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">Aktif Politikalar</TabsTrigger>
              <TabsTrigger value="all">Tüm Politikalar</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <Card>
                <CardContent className="pt-6">
                  {policies.filter(p => p.isActive).length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">Henüz aktif politika bulunmuyor</p>
                      <Button variant="outline" className="mt-4" onClick={openCreateMode}>
                        İlk Politikanı Oluştur
                      </Button>
                    </div>
                  ) : (
                    <PolicyTable
                      policies={policies.filter(p => p.isActive)}
                      onEdit={openEditMode}
                      onDelete={openDeleteDialog}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="all">
              <Card>
                <CardContent className="pt-6">
                  {policies.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">Henüz politika bulunmuyor</p>
                      <Button variant="outline" className="mt-4" onClick={openCreateMode}>
                        İlk Politikanı Oluştur
                      </Button>
                    </div>
                  ) : (
                    <PolicyTable
                      policies={policies}
                      onEdit={openEditMode}
                      onDelete={openDeleteDialog}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Silme onay dialogu */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Politikayı Sil</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>
                  <strong>{selectedPolicy?.name}</strong> politikasını silmek istediğinize emin misiniz?
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Bu işlem geri alınamaz ve bu politikaya bağlı otomatik işlemleri durdurur.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  İptal
                </Button>
                <Button variant="destructive" onClick={handleDeletePolicy}>
                  Sil
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

interface PolicyTableProps {
  policies: Policy[];
  onEdit: (policy: Policy) => void;
  onDelete: (policy: Policy) => void;
}

const PolicyTable = ({ policies, onEdit, onDelete }: PolicyTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Politika Adı</TableHead>
          <TableHead>Otomatik Onay</TableHead>
          <TableHead>Zaman Sınırı</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>Güncelleme</TableHead>
          <TableHead className="text-right">İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {policies.map((policy) => (
          <TableRow key={policy.id}>
            <TableCell className="font-medium">{policy.name}</TableCell>
            <TableCell>
              {policy.autoApproveTimeline ? `${policy.autoApproveTimeline} dakika` : 'Manuel'}
            </TableCell>
            <TableCell>
              {policy.timeLimit ? `${policy.timeLimit} gün` : 'Sınırsız'}
            </TableCell>
            <TableCell>
              <Badge variant={policy.isActive ? "default" : "secondary"}>
                {policy.isActive ? 'Aktif' : 'Pasif'}
              </Badge>
            </TableCell>
            <TableCell>
              {formatDistanceToNow(new Date(policy.updatedAt), { addSuffix: true, locale: tr })}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="icon" onClick={() => onEdit(policy)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(policy)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default PolicyManagement; 