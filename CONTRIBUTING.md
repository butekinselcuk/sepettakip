# Katkıda Bulunma Rehberi

SepetTakip projesine katkıda bulunmak istediğiniz için teşekkür ederiz! Bu döküman, projeye nasıl katkı sağlayabileceğiniz konusunda rehberlik edecektir.

## Geliştirme İş Akışı

1. Projeyi forklayın ve klonlayın
2. Yeni bir branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi yapın ve test edin
4. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
5. Branch'inizi uzak sunucuya push edin (`git push origin feature/amazing-feature`)
6. Pull Request oluşturun

## Branching Stratejisi

- `main`: Kararlı sürüm, production için hazır kod
- `develop`: Geliştirme kodu, bir sonraki sürüm için hazırlanan özellikler
- `feature/*`: Yeni özellikler için
- `bugfix/*`: Hata düzeltmeleri için
- `hotfix/*`: Acil production düzeltmeleri için
- `release/*`: Sürüm hazırlığı için

## Kodlama Standartları

### Genel Kurallar

- Kodunuzu düzenli ve okunaklı tutun
- Kodlarınızı açıklayan yorumlar ekleyin
- Her bir fonksiyon/bileşen için tek bir sorumluluk ilkesini izleyin
- Tekrar eden kodlardan kaçının, gerekirse yardımcı fonksiyonlar oluşturun

### JavaScript/TypeScript Standartları

- ES6+ özellikleri kullanın
- TypeScript tiplerini doğru bir şekilde belirtin
- Değişkenler için camelCase kullanın
- Sınıflar ve bileşenler için PascalCase kullanın
- Sabitler için UPPERCASE_WITH_UNDERSCORES kullanın
- Her dosya sonunda boş bir satır bırakın

### React Bileşenleri

- Fonksiyonel bileşenler ve React hooks kullanın
- Her bileşen için ayrı bir dosya oluşturun
- Prop'lar için TypeScript ile tip tanımları yapın
- Büyük bileşenleri daha küçük alt bileşenlere ayırın
- Gereksiz yeniden render'lamalardan kaçınmak için React.memo, useMemo ve useCallback kullanın

### CSS/Styling

- Tailwind CSS sınıflarını kullanarak stil verin
- Karmaşık stillendirmeler için Tailwind'in @apply direktifini kullanın
- Shadcn UI bileşenlerini kullanırken stil rehberine uyun
- Sayfa düzeni için grid ve flex kullanın
- Responsive tasarım için Tailwind'in breakpoint sistemini kullanın

## Pull Request Süreci

1. PR başlığında değişikliğinizi açıklayıcı bir tanım kullanın
2. PR açıklamasında değişikliğinizin amacını ve ne gibi değişiklikler yaptığınızı açıklayın
3. Yapılan değişikliklerin gerekli testlerden geçtiğinden emin olun
4. PR'ın mevcut bir issue'yu çözüyorsa, ilgili issue numarasını yazın
5. Bir maintainer, PR'ınızı inceleyecek ve geri bildirimde bulunacaktır
6. İstenilen değişiklikleri yaptıktan sonra, PR birleştirilmeye hazır olacaktır

## Test Rehberi

- Her özellik için en az bir birim testi yazın
- UI bileşenleri için bileşen testleri yazın
- Kritik iş akışları için entegrasyon testleri ekleyin
- Yüksek karmaşıklığa sahip fonksiyonları iyi test edin
- `npm test` ile tüm testleri çalıştırın

## Belgelendirme

- Yeni özellikler eklerken ilgili belgelendirmeyi güncelleyin
- API endpoint'leri için JSDoc stil yorumlar ekleyin
- Kompleks algoritmaları açıklayan yorumlar ekleyin
- README.md ve diğer belgelendirme dosyalarını güncel tutun

## Commit Mesajları

Commit mesajlarınızı anlaşılır ve açıklayıcı tutun. Aşağıdaki formatı kullanmanızı öneririz:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Tipler:
- feat: Yeni bir özellik
- fix: Bir hatanın düzeltilmesi
- docs: Yalnızca dokümantasyon değişiklikleri
- style: Kodun anlamını değiştirmeyen değişiklikler (boşluk, biçimlendirme, noktalama vb.)
- refactor: Hata düzeltmeyen ve yeni özellik eklemeyen kod değişikliği
- perf: Performansı artıran bir kod değişikliği
- test: Eksik testlerin eklenmesi veya mevcut testlerin düzeltilmesi
- chore: Derleme süreci veya yardımcı araçlardaki değişiklikler

Örnek:
```
feat(auth): implement JWT token refresh mechanism
```

## İletişim

Herhangi bir sorunuz veya öneriniz varsa, aşağıdaki kanallardan bizimle iletişime geçebilirsiniz:

- GitHub Issues: [https://github.com/kullaniciadi/sepettakip/issues](https://github.com/kullaniciadi/sepettakip/issues)
- E-posta: development@example.com 