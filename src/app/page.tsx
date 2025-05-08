import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          SepetTakip
        </h1>
        <p className="text-center mb-8 text-lg">
          Modern ve entegre sipariş yönetim platformu
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/auth/login"
            className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Giriş Yap
          </Link>
          <Link
            href="/auth/register"
            className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Kayıt Ol
          </Link>
        </div>
      </div>
    </div>
  )
}
