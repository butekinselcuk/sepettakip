"use client";

import Link from 'next/link';
import React from 'react';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-blue-600">SepetTakip</span>
              </div>
            </div>
            <div className="flex items-center">
              <Link href="/auth/login" className="ml-4 px-4 py-2 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors duration-200">
                Giriş Yap
              </Link>
              <Link href="/auth/register" className="ml-4 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200">
                Kayıt Ol
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Teslimat Yönetimi</span>
                <span className="block text-blue-600">Artık Daha Kolay</span>
              </h1>
              <p className="mt-6 text-base text-gray-500 sm:text-lg md:text-xl">
                SepetTakip, teslimat ve kurye yönetimi için kapsamlı, kullanımı kolay ve verimli bir çözümdür. Siparişlerinizi takip edin, kuryelerinizi yönetin ve işletmenizi büyütün.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-2 justify-center lg:justify-start">
                  <Link href="/auth/register" className="px-6 py-3 rounded-lg text-center bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-colors duration-200">
                    Hemen Başla
                  </Link>
                  <Link href="#features" className="px-6 py-3 rounded-lg text-center bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 transition-colors duration-200">
                    Daha Fazla Bilgi
                  </Link>
                </div>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 lg:col-span-6">
              <div className="bg-white shadow-xl rounded-lg overflow-hidden">
                <div className="h-96 relative">
                  <div className="absolute inset-0 bg-blue-600 rounded-t-lg">
                    <svg className="h-full w-full" fill="none" viewBox="0 0 1097 845">
                      <defs>
                        <pattern id="pattern" patternUnits="userSpaceOnUse" width="10" height="10" x="0" y="0">
                          <path d="M0 10V0h10" fill="none" stroke="rgba(255, 255, 255, 0.1)"></path>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#pattern)"></rect>
                    </svg>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-64 w-64 text-white opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <h3 className="ml-3 text-lg font-medium text-gray-900">Sipariş Takibi</h3>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Tüm siparişlerinizi tek bir panelden takip edin ve yönetin.</p>

                  <div className="mt-4 flex items-center">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="ml-3 text-lg font-medium text-gray-900">Konum İzleme</h3>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Kuryelerinizin konumunu gerçek zamanlı olarak takip edin.</p>

                  <div className="mt-4 flex items-center">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="ml-3 text-lg font-medium text-gray-900">Analitik ve Raporlama</h3>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Detaylı raporlar ve analizlerle işletmenizi daha iyi yönetin.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Neden SepetTakip?
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Teslimat ve kurye yönetiminde ihtiyacınız olan tüm özellikler
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="text-center mt-4 text-lg font-medium text-gray-900">Sipariş Yönetimi</h3>
                <p className="mt-2 text-center text-base text-gray-500">
                  Siparişleri kolayca oluşturun, düzenleyin ve takip edin. Tüm süreçleri tek bir panelden yönetin.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-center mt-4 text-lg font-medium text-gray-900">Konum Takibi</h3>
                <p className="mt-2 text-center text-base text-gray-500">
                  Kuryelerinizin konumunu gerçek zamanlı izleyin ve teslimat rotalarını optimize edin.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-center mt-4 text-lg font-medium text-gray-900">Kurye Yönetimi</h3>
                <p className="mt-2 text-center text-base text-gray-500">
                  Kurye performansını izleyin, vardiyaları planlayın ve teslimat süreçlerini optimize edin.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-center mt-4 text-lg font-medium text-gray-900">Raporlama ve Analitik</h3>
                <p className="mt-2 text-center text-base text-gray-500">
                  Detaylı raporlar ve analizlerle işletmenizin performansını takip edin ve stratejiler geliştirin.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-center mt-4 text-lg font-medium text-gray-900">Bildirim Yönetimi</h3>
                <p className="mt-2 text-center text-base text-gray-500">
                  Otomatik bildirimlerle müşterilerinizi ve kuryelerinizi sürekli bilgilendirin.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-center mt-4 text-lg font-medium text-gray-900">Entegrasyon</h3>
                <p className="mt-2 text-center text-base text-gray-500">
                  Populer e-ticaret ve yemek teslimat platformlarıyla kusursuz entegrasyon imkanı.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Teslimat yönetiminizi bugün geliştirin
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-blue-100 mx-auto">
              SepetTakip ile işletmenizi bir sonraki seviyeye taşıyın
            </p>
          </div>
          <div className="mt-8 flex justify-center">
            <div className="inline-flex rounded-md shadow">
              <Link href="/auth/register" className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 md:py-4 md:text-lg md:px-10">
                Ücretsiz Deneme
              </Link>
            </div>
            <div className="ml-3 inline-flex">
              <Link href="/auth/login" className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-700 hover:bg-blue-800 md:py-4 md:text-lg md:px-10">
                Giriş Yap
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
          <div className="flex justify-center space-x-6 md:order-2">
            <span className="text-gray-400 hover:text-gray-500">
              © 2023 SepetTakip. Tüm hakları saklıdır.
            </span>
          </div>
          <div className="mt-8 md:mt-0 md:order-1 flex flex-col sm:flex-row sm:space-x-6">
            <a href="#" className="text-base text-gray-500 hover:text-gray-900">Hakkımızda</a>
            <a href="#" className="text-base text-gray-500 hover:text-gray-900 mt-2 sm:mt-0">Gizlilik Politikası</a>
            <a href="#" className="text-base text-gray-500 hover:text-gray-900 mt-2 sm:mt-0">Kullanım Koşulları</a>
            <a href="#" className="text-base text-gray-500 hover:text-gray-900 mt-2 sm:mt-0">İletişim</a>
          </div>
        </div>
      </footer>
    </div>
  );
} 