import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8 text-center">Hakkımızda</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>SepetTakip Nedir?</CardTitle>
            <CardDescription>Teslimat süreçlerinizi kolaylaştıran dijital çözüm</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              SepetTakip, işletmelerin teslimat süreçlerini etkin bir şekilde yönetmelerini sağlayan
              modern bir paket takip ve kurye yönetim platformudur. Sistemimiz, siparişlerin
              oluşturulmasından teslimatına kadar tüm süreçleri tek bir platformda yönetmenize
              olanak tanır.
            </p>
            <p className="text-gray-700">
              Gelişmiş rota optimizasyonu, gerçek zamanlı teslimat takibi ve otomatik bildirim
              özellikleriyle müşteri memnuniyetini artırırken, operasyonel maliyetlerinizi düşürür.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/services">
              <Button>Hizmetlerimiz</Button>
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Vizyonumuz</CardTitle>
            <CardDescription>Teslimat süreçlerinde devrim yaratmak</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              SepetTakip olarak vizyonumuz, teslimat süreçlerini daha verimli, şeffaf ve 
              sürdürülebilir hale getirerek e-ticaret ve yerel işletmelerin büyümesine 
              katkıda bulunmaktır.
            </p>
            <p className="text-gray-700">
              Teknoloji odaklı yaklaşımımızla, geleneksel teslimat yöntemlerinin karşılaştığı
              zorlukları aşarak, hem işletmeler hem de tüketiciler için daha iyi bir deneyim
              sunmayı hedefliyoruz.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/contact">
              <Button variant="outline">Bize Ulaşın</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
      
      <div className="bg-gray-100 p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Neden SepetTakip?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-lg mb-2">Verimlilik</h3>
            <p className="text-gray-700">
              Teslimat rotalarınızı optimize ederek zaman ve yakıt tasarrufu sağlar.
            </p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-lg mb-2">Şeffaflık</h3>
            <p className="text-gray-700">
              Müşterilerinize gerçek zamanlı teslimat bilgisi ve tahmini varış süreleri sunar.
            </p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-lg mb-2">Ölçeklenebilirlik</h3>
            <p className="text-gray-700">
              İşletmeniz büyüdükçe, teslimat ağınızı kolayca genişletmenize olanak tanır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 