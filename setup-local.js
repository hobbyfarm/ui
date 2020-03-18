const fs = require('fs')

if (!fs.existsSync('src/environments/environment.local.ts')) {
  fs.copyFileSync('src/environments/environment.local.example.ts',
    'src/environments/environment.local.ts')
}
