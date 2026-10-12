const express = require('express');
const router = express.Router();

const demoUsers = [
  {
    id: 'user-sdma',
    email: 'admin@sdma.gov.in',
    name: 'Officer P. Sangma',
    role: 'Disaster Management Officer',
    badge: 'SDMA / State Control',
    district: 'Meghalaya State Authority',
    avatar: 'PS'
  },
  {
    id: 'user-research',
    email: 'palak.research@jecrc.ac.in',
    name: 'Palak Kumari (23BCON1858)',
    role: 'Research Scientist',
    badge: 'JECRC / NASA Science',
    district: 'NER Geospatial Lab',
    avatar: 'PK'
  },
  {
    id: 'user-ranger',
    email: 'ranger.ekh@forest.gov.in',
    name: 'K. Lyngdoh (Field Lead)',
    role: 'Field Ranger',
    badge: 'East Khasi Hills Quick Response',
    district: 'East Khasi Hills',
    avatar: 'KL'
  },
  {
    id: 'user-citizen',
    email: 'citizen@resilience.in',
    name: 'Public Citizen Observer',
    role: 'Citizen Observer',
    badge: 'Public Early Warning',
    district: 'All districts',
    avatar: 'CO'
  }
];

router.post('/login', (req, res) => {
  const { email, password, role } = req.body || {};
  
  if (!email && !role) {
    return res.status(400).json({ ok: false, message: 'Email or role required for login.' });
  }

  // Find user by role or email
  let matched = demoUsers.find(
    (u) => (role && u.role === role) || (email && u.email.toLowerCase() === email.toLowerCase())
  );

  if (!matched) {
    // Dynamic fallback user
    matched = {
      id: `user-${Date.now()}`,
      email: email || 'user@regionalrisk.gov.in',
      name: email ? email.split('@')[0].toUpperCase() : 'Authenticated User',
      role: role || 'Disaster Management Officer',
      badge: 'NER Resilience Grid',
      district: 'Meghalaya',
      avatar: 'AR'
    };
  }

  return res.json({
    ok: true,
    token: `token-ner-${Date.now()}`,
    user: matched,
    message: 'Welcome to our Regional Risk Calculator!'
  });
});

router.get('/me', (req, res) => {
  return res.json({ ok: true, users: demoUsers });
});

module.exports = router;
