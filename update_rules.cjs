const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');
const eventRules = `
    match /vit_events/{eventId} {
      allow read, write: if true;
    }
  }
}
`;
rules = rules.replace("  }\n}", eventRules);
fs.writeFileSync('firestore.rules', rules);
