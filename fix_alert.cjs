const fs = require('fs');
let code = fs.readFileSync('src/screens/AuthScreen.tsx', 'utf8');

code = code.replace(
  "const [error, setError] = useState('');",
  "const [error, setError] = useState('');\n  const [mockOtp, setMockOtp] = useState<string | null>(null);"
);

code = code.replace(
  'alert("Development Mode: Your OTP is " + data.mockCode);',
  'setMockOtp(data.mockCode);'
);

code = code.replace(
  '</form>\n          </motion.div>\n        )}\n      </AnimatePresence>',
  `</form>
            {mockOtp && (
              <div className="mt-6 p-4 bg-brand-blue/10 border border-brand-blue/30 rounded-xl text-center animate-in fade-in slide-in-from-bottom-2">
                <p className="text-xs text-brand-blue mb-1 font-medium">Development Mode OTP</p>
                <p className="text-2xl text-white font-mono font-bold tracking-widest">{mockOtp}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>`
);

fs.writeFileSync('src/screens/AuthScreen.tsx', code);
