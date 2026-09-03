const fs = require('fs');
const path = require('path');
const root = 'c:/Users/kevin/Desktop/PROYECTOS/minuta/frontend/src/components';
['LoginScreen.jsx', 'ForgotPasswordScreen.jsx', 'RegisterView.jsx', 'TwoFactorScreen.jsx'].forEach(f => {
  const p = path.join(root, f);
  if (fs.existsSync(p)) {
    let c = fs.readFileSync(p, 'utf8');
    c = c.replace(/import HotelTitle from ['"].\/HotelTitle['"];/g, "import BrandTitle from './BrandTitle';");
    c = c.replace(/<HotelTitle\s*\/>/g, '<BrandTitle />');
    c = c.replace(/<HotelTitle\s+([^>]*)\/>/g, '<BrandTitle $1/>');
    fs.writeFileSync(p, c);
    console.log('Updated:', f);
  }
});