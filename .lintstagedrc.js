module.exports = {
  // TypeScript ve JavaScript dosyaları için lint ve format kontrolü
  "**/*.{ts,tsx,js,jsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  // Diğer dosyalar için sadece format kontrolü (JSON, CSS, MD vb.)
  "**/*.{json,css,scss,md}": [
    "prettier --write"
  ]
}; 