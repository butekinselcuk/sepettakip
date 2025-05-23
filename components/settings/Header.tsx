import React from 'react';

interface HeaderProps {
  businessName?: string;
}

export default function Header({ businessName }: HeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900">
        {businessName ? `${businessName} - İşletme Ayarları` : 'İşletme Ayarları'}
      </h1>
      <p className="mt-2 text-gray-600 max-w-4xl">
        İşletme bilgilerinizi, çalışma saatlerinizi, teslimat ayarlarınızı ve görsellerinizi bu sayfadan yönetebilirsiniz. 
        Yapacağınız tüm değişiklikler, müşterilerinize sunulan profil sayfanızda anında görünür olacaktır.
      </p>
      
      <div className="mt-5 border-t border-gray-200 pt-5">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Ayarlarınızı güncellerken, değişiklikleri her sekme için ayrı ayrı kaydetmeyi unutmayın. 
                Her ayar grubu, ilgili sekmenin altındaki "Kaydet" düğmesi ile kaydedilir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 