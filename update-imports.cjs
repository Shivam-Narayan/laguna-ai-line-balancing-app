const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  // API
  { from: /\/API\/api/g, to: '/api/api' },
  { from: /['"]API\/api['"]/g, to: "'./api/api'" },
  
  // Context
  { from: /\/Context\/UserContext/g, to: '/context/UserContext' },
  { from: /['"]Context\/UserContext['"]/g, to: "'./context/UserContext'" },

  // Routes
  { from: /\/Routes\/AppRoutes/g, to: '/routes/AppRoutes' },
  { from: /['"]Routes\/AppRoutes['"]/g, to: "'./routes/AppRoutes'" },

  // Shared Components
  { from: /\/Shared_Components\/Header/g, to: '/components/shared/Header' },
  { from: /\/Shared_Components\/Footer/g, to: '/components/shared/Footer' },
  { from: /\/Shared_Components\/Sidenav/g, to: '/components/shared/Sidenav' },
  { from: /\/Shared_Components\/LoadingOverlay/g, to: '/components/shared/LoadingOverlay' },
  { from: /\/Shared_Components\/Login_Header/g, to: '/components/shared/LoginHeader' },
  { from: /\/Shared_Components\/Login_Footer/g, to: '/components/shared/LoginFooter' },
  
  // Pages
  { from: /\/Components\/Admin_Dashboard/g, to: '/pages/AdminDashboard' },
  { from: /\/Components\/User_Dashboard/g, to: '/pages/UserDashboard' },
  { from: /\/Components\/Planning_Sheet/g, to: '/pages/PlanningSheet' },
  { from: /\/Components\/Planning/g, to: '/pages/Planning' },
  { from: /\/Components\/Operators/g, to: '/pages/Operators' },
  { from: /\/Components\/forecast/g, to: '/pages/Forecast' },
  { from: /\/Components\/Login/g, to: '/pages/Login' },
  { from: /\/Components\/Forgot_Password/g, to: '/pages/ForgotPassword' },
  { from: /\/Components\/Email_Recovery/g, to: '/pages/EmailRecovery' },
  { from: /\/Components\/Change_Password/g, to: '/pages/ChangePassword' },
  { from: /\/Components\/TermsAndConditions/g, to: '/pages/TermsAndConditions' },
  { from: /\/Components\/Application_Testing/g, to: '/pages/ApplicationTesting' },
  
  // Components
  { from: /\/Components\/DragDropEmployees/g, to: '/components/DragDropEmployees' },
  { from: /\/Components\/PlanningSheetDragDrop/g, to: '/components/PlanningSheetDragDrop' }
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(srcDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  replacements.forEach(r => {
    newContent = newContent.replace(r.from, r.to);
  });

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
  }
});
