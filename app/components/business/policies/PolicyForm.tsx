"use client";

import React, { useState, useEffect } from 'react';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Trash, Plus, AlertTriangle, Info, ChevronDown } from 'lucide-react';
// Accordion bileşenleri geçici olarak kaldırıldı
// import { 
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger
// } from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Basit Accordion bileşenleri
const Accordion = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div {...props}>{children}</div>;
};

const AccordionItem = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className="border-b mb-2" {...props}>{children}</div>;
};

const AccordionTrigger = ({ children, ...props }: React.HTMLAttributes<HTMLButtonElement>) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className="flex w-full items-center justify-between py-4 font-medium transition-all hover:underline"
      {...props}
    >
      {children}
      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  );
};

const AccordionContent = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className="pb-4 pt-0" {...props}>{children}</div>;
};

// Form doğrulama şeması
const policyFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Politika adı en az 2 karakter olmalıdır',
  }),
  description: z.string().optional(),
  autoApproveTimeline: z.coerce.number().int().gte(0).nullable().optional(),
  timeLimit: z.coerce.number().int().gte(0).nullable().optional(),
  orderStatusRules: z.any().optional(),
  productRules: z.any().optional(),
  cancellationFees: z.any().optional(),
  isActive: z.boolean().default(true),
});

// Sipariş durum türleri
const orderStatuses = [
  { value: 'PENDING', label: 'Beklemede' },
  { value: 'PROCESSING', label: 'İşleniyor' },
  { value: 'PREPARING', label: 'Hazırlanıyor' },
  { value: 'READY', label: 'Hazır' },
  { value: 'IN_TRANSIT', label: 'Yolda' },
  { value: 'DELIVERED', label: 'Teslim Edildi' },
];

// İptal nedenleri
const cancellationReasons = [
  { value: 'CUSTOMER_CHANGED_MIND', label: 'Müşteri fikir değiştirdi' },
  { value: 'DUPLICATE_ORDER', label: 'Çift sipariş' },
  { value: 'DELIVERY_TOO_LONG', label: 'Teslimat süresi çok uzun' },
  { value: 'PRICE_ISSUES', label: 'Fiyat sorunları' },
  { value: 'RESTAURANT_CLOSED', label: 'İşletme kapalı' },
  { value: 'OUT_OF_STOCK', label: 'Stokta yok' },
  { value: 'OTHER', label: 'Diğer' },
];

// İade nedenleri
const refundReasons = [
  { value: 'DAMAGED_PRODUCT', label: 'Hasarlı ürün' },
  { value: 'WRONG_PRODUCT', label: 'Yanlış ürün' },
  { value: 'PRODUCT_NOT_AS_DESCRIBED', label: 'Ürün açıklandığı gibi değil' },
  { value: 'MISSING_ITEMS', label: 'Eksik ürünler' },
  { value: 'LATE_DELIVERY', label: 'Geç teslimat' },
  { value: 'QUALITY_ISSUES', label: 'Kalite sorunları' },
  { value: 'OTHER', label: 'Diğer' },
];

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
  createdAt?: string;
  updatedAt?: string;
}

interface PolicyFormProps {
  policy: Policy | null;
  onSubmit: (data: Partial<Policy>) => void;
  isEditMode: boolean;
}

interface StatusRule {
  status: string;
  allowCancellation: boolean;
  cancellationFeePercentage: number;
}

interface TimeBasedFee {
  id: string;
  minMinutes: number;
  maxMinutes: number | null;
  feePercentage: number;
  description: string;
}

const PolicyForm: React.FC<PolicyFormProps> = ({ policy, onSubmit, isEditMode }) => {
  // Durum bazlı kurallar için state
  const [statusRules, setStatusRules] = useState<StatusRule[]>(
    policy?.orderStatusRules ? 
    Object.entries(policy.orderStatusRules).map(([status, rule]: [string, any]) => ({
      status,
      allowCancellation: rule.allowCancellation,
      cancellationFeePercentage: rule.cancellationFeePercentage || 0
    })) : []
  );

  // Zaman bazlı ücretler için state
  const [timeBasedFees, setTimeBasedFees] = useState<TimeBasedFee[]>(
    policy?.cancellationFees ? 
    policy.cancellationFees.map((fee: any, index: number) => ({
      ...fee,
      id: `fee-${index}`
    })) : []
  );

  const [productCategories, setProductCategories] = useState<{id: string, name: string}[]>([
    { id: 'cat1', name: 'Yemekler' },
    { id: 'cat2', name: 'İçecekler' },
    { id: 'cat3', name: 'Tatlılar' },
    { id: 'cat4', name: 'Yan Ürünler' }
  ]);

  // Ürün kategorisi bazlı kurallar
  const [categoryRules, setCategoryRules] = useState<{[key: string]: {refundable: boolean, refundTimeLimit?: number}}>(
    policy?.productRules || {}
  );

  const form = useForm<z.infer<typeof policyFormSchema>>({
    resolver: zodResolver(policyFormSchema),
    defaultValues: {
      name: policy?.name || '',
      description: policy?.description || '',
      autoApproveTimeline: policy?.autoApproveTimeline || null,
      timeLimit: policy?.timeLimit || null,
      isActive: policy?.isActive !== undefined ? policy.isActive : true,
    },
  });

  // Durum kuralı ekle
  const addStatusRule = () => {
    const newStatusRules = [...statusRules];
    newStatusRules.push({
      status: 'PENDING',
      allowCancellation: true,
      cancellationFeePercentage: 0
    });
    setStatusRules(newStatusRules);
  };

  // Durum kuralı sil
  const removeStatusRule = (index: number) => {
    const newStatusRules = [...statusRules];
    newStatusRules.splice(index, 1);
    setStatusRules(newStatusRules);
  };

  // Durum kuralı güncelle
  const updateStatusRule = (index: number, field: string, value: any) => {
    const newStatusRules = [...statusRules];
    (newStatusRules[index] as any)[field] = value;
    setStatusRules(newStatusRules);
  };

  // Zaman bazlı ücret ekle
  const addTimeBasedFee = () => {
    const newFees = [...timeBasedFees];
    newFees.push({
      id: `fee-${Date.now()}`,
      minMinutes: 0,
      maxMinutes: 30,
      feePercentage: 0,
      description: '30 dakikaya kadar ücretsiz iptal'
    });
    setTimeBasedFees(newFees);
  };

  // Zaman bazlı ücret sil
  const removeTimeBasedFee = (id: string) => {
    const newFees = timeBasedFees.filter(fee => fee.id !== id);
    setTimeBasedFees(newFees);
  };

  // Zaman bazlı ücret güncelle
  const updateTimeBasedFee = (id: string, field: string, value: any) => {
    const newFees = [...timeBasedFees];
    const feeIndex = newFees.findIndex(fee => fee.id === id);
    if (feeIndex !== -1) {
      (newFees[feeIndex] as any)[field] = value;
      setTimeBasedFees(newFees);
    }
  };

  // Kategori kuralı güncelle
  const updateCategoryRule = (categoryId: string, field: string, value: any) => {
    const newCategoryRules = { ...categoryRules };
    if (!newCategoryRules[categoryId]) {
      newCategoryRules[categoryId] = { refundable: true };
    }
    (newCategoryRules[categoryId] as any)[field] = value;
    setCategoryRules(newCategoryRules);
  };

  // Formdan veri gönderme
  const handleSubmit = (formData: z.infer<typeof policyFormSchema>) => {
    // Durum kurallarını obje formatına dönüştür
    const orderStatusRulesObj: {[key: string]: any} = {};
    statusRules.forEach(rule => {
      orderStatusRulesObj[rule.status] = {
        allowCancellation: rule.allowCancellation,
        cancellationFeePercentage: rule.cancellationFeePercentage
      };
    });

    // Tüm veriyi birleştir
    const data = {
      ...formData,
      orderStatusRules: orderStatusRulesObj,
      cancellationFees: timeBasedFees,
      productRules: categoryRules
    };
    
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Politika Adı */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Politika Adı</FormLabel>
                <FormControl>
                  <Input placeholder="Örn: Standart İade Politikası" {...field} />
                </FormControl>
                <FormDescription>
                  Politikanızı tanımlayıcı bir isim verin
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Durum Göstergesi */}
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Aktif</FormLabel>
                  <FormDescription>
                    Bu politikayı aktif olarak kullanılsın mı?
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Açıklama */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Açıklama</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Bu politikanın amacını ve kapsamını açıklayın" 
                  className="min-h-[100px]" 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Detaylı Ayarlar Accordion */}
        <Accordion type="single" collapsible className="w-full" defaultValue="time-settings">
          {/* Zaman Ayarları */}
          <AccordionItem value="time-settings">
            <AccordionTrigger>Zaman Ayarları</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Otomatik Onay Süresi */}
                <FormField
                  control={form.control}
                  name="autoApproveTimeline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Otomatik Onay Süresi (Dakika)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Örn: 30"
                          {...field}
                          value={field.value === null ? '' : field.value}
                          onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                        />
                      </FormControl>
                      <FormDescription>
                        Boş bırakırsanız manuel onay gerektirir
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* İade/İptal Zaman Sınırı */}
                <FormField
                  control={form.control}
                  name="timeLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zaman Sınırı (Gün)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="Örn: 14" 
                          {...field}
                          value={field.value === null ? '' : field.value}
                          onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                        />
                      </FormControl>
                      <FormDescription>
                        Siparişten sonra kaç gün içinde iade/iptal yapılabilir
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Durum Bazlı Kurallar */}
          <AccordionItem value="status-rules">
            <AccordionTrigger>Sipariş Durumuna Göre Kurallar</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <FormDescription>
                  Her sipariş durumu için izinleri ve ceza bedellerini ayarlayın
                </FormDescription>
                
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Sipariş Durumu</TableHead>
                        <TableHead>İptal İzni</TableHead>
                        <TableHead className="w-[200px]">İptal Ücreti (%)</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statusRules.map((rule, index) => (
                        <TableRow key={`status-rule-${index}`}>
                          <TableCell>
                            <Select 
                              value={rule.status}
                              onValueChange={(value) => updateStatusRule(index, 'status', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Durum seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                {orderStatuses.map(status => (
                                  <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={rule.allowCancellation}
                              onCheckedChange={(checked) => updateStatusRule(index, 'allowCancellation', checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder="Ücret yüzdesi"
                              value={rule.cancellationFeePercentage}
                              min={0}
                              max={100}
                              disabled={!rule.allowCancellation}
                              onChange={(e) => updateStatusRule(index, 'cancellationFeePercentage', parseInt(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => removeStatusRule(index)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addStatusRule}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Durum Kuralı Ekle
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Ürün Kategorisine Göre Kurallar */}
          <AccordionItem value="product-rules">
            <AccordionTrigger>Ürün Kategorisine Göre Kurallar</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <FormDescription>
                  Belirli ürün kategorilerine özel iade kuralları tanımlayın
                </FormDescription>
                
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Kategori</TableHead>
                        <TableHead>İade Edilebilir</TableHead>
                        <TableHead className="w-[200px]">İade Süresi (Gün)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productCategories.map((category) => (
                        <TableRow key={`category-${category.id}`}>
                          <TableCell>
                            {category.name}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={categoryRules[category.id]?.refundable !== false}
                              onCheckedChange={(checked) => updateCategoryRule(category.id, 'refundable', checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder="Varsayılan"
                              disabled={categoryRules[category.id]?.refundable === false}
                              value={categoryRules[category.id]?.refundTimeLimit || ''}
                              onChange={(e) => updateCategoryRule(
                                category.id, 
                                'refundTimeLimit', 
                                e.target.value === '' ? undefined : parseInt(e.target.value)
                              )}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="flex items-center p-2 rounded-md bg-blue-50 text-blue-700">
                    <Info className="h-4 w-4 mr-2" />
                    <p className="text-sm">Boş bırakılan iade süreleri için genel süre limiti geçerli olacaktır.</p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* İptal Ücretleri */}
          <AccordionItem value="cancellation-fees">
            <AccordionTrigger>Zaman Bazlı İptal Ücretleri</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <FormDescription>
                  Sipariş oluşturulduktan sonra geçen zamana göre iptal ücretlerini tanımlayın
                </FormDescription>
                
                <div className="space-y-4">
                  {timeBasedFees.map((fee) => (
                    <Card key={fee.id}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">
                            {fee.description || 'Zaman Dilimi'}
                          </CardTitle>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeTimeBasedFee(fee.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <FormLabel>Minimum Süre (Dakika)</FormLabel>
                            <Input
                              type="number"
                              value={fee.minMinutes}
                              min={0}
                              onChange={(e) => updateTimeBasedFee(fee.id, 'minMinutes', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-2">
                            <FormLabel>Maksimum Süre (Dakika)</FormLabel>
                            <Input
                              type="number"
                              value={fee.maxMinutes === null ? '' : fee.maxMinutes}
                              min={fee.minMinutes || 0}
                              placeholder="Sınırsız"
                              onChange={(e) => updateTimeBasedFee(
                                fee.id, 
                                'maxMinutes', 
                                e.target.value === '' ? null : parseInt(e.target.value)
                              )}
                            />
                          </div>
                          <div className="space-y-2">
                            <FormLabel>İptal Ücreti (%)</FormLabel>
                            <Input
                              type="number"
                              value={fee.feePercentage}
                              min={0}
                              max={100}
                              onChange={(e) => updateTimeBasedFee(fee.id, 'feePercentage', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <FormLabel>Açıklama</FormLabel>
                          <Input
                            value={fee.description || ''}
                            placeholder="Örn: 30 dakikaya kadar ücretsiz iptal"
                            onChange={(e) => updateTimeBasedFee(fee.id, 'description', e.target.value)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addTimeBasedFee}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Zaman Bazlı Kural Ekle
                  </Button>
                  
                  {timeBasedFees.length === 0 && (
                    <div className="text-center p-4 border border-dashed rounded-md">
                      <p className="text-muted-foreground">Henüz zaman bazlı kural eklenmedi</p>
                    </div>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex justify-end space-x-4 pt-4">
          <Button type="submit" className="w-full md:w-auto">
            {isEditMode ? 'Güncelle' : 'Oluştur'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PolicyForm; 