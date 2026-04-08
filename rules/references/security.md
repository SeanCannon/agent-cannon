# Security Reference Guide

Comprehensive security guidelines for Agent Cannon-verified code.

---

## OWASP Top 10 Coverage

| Vulnerability | Detection | Prevention |
|---------------|-----------|------------|
| A01:2021 - Broken Access Control | Path traversal, IDOR checks | Role-based authorization |
| A02:2021 - Cryptographic Failures | Hardcoded secrets, weak crypto | Env vars, TLS 1.2+ |
| A03:2021 - Injection | SQL, Command, LDAP injection | Parameterized queries, escaping |
| A04:2021 - Insecure Design | Missing auth, no rate limiting | Threat modeling |
| A05:2021 - Security Misconfiguration | Default creds, verbose errors | Hardening, minimal info |
| A06:2021 - Vulnerable Components | Outdated dependencies | Dependency scanning |
| A07:2021 - Auth Failures | Weak passwords, session handling | MFA, secure sessions |
| A08:2021 - Data Integrity Failures | Missing serialization checks | Signed serialization |
| A09:2021 - Logging Failures | No audit trail, plain creds in logs | Structured logging |
| A10:2021 - SSRF | Unrestricted URL fetching | Allowlists, protocol restrictions |

---

## SQL Injection (SQLi)

### Threat
Attacker injects malicious SQL to read/modify database, bypass auth, or delete data.

### Patterns to Flag
```
// CRITICAL - Direct string concatenation
`SELECT * FROM users WHERE id = '` + userId + `'`

// CRITICAL - Template literals with user input
`SELECT * FROM users WHERE name = ${name}`

// DANGEROUS - f-strings with SQL
f"SELECT * FROM users WHERE id = {user_id}"
```

### Safe Patterns
```js
// Parameterized queries
db.query('SELECT * FROM users WHERE id = ?', [userId])

// ORM (Sequelize, Prisma, SQLAlchemy)
User.findById(userId)
```

### Detection Regex
```regex
(execute|query|exec|cursor\.execute)\s*\(\s*[`"'].*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE).*\+|%\s*\(|format\s*\(
```

---

## Cross-Site Scripting (XSS)

### Threat
Attacker injects malicious JS to steal cookies, session tokens, or deface pages.

### Patterns to Flag
```js
// CRITICAL - InnerHTML with user input
element.innerHTML = userInput

// CRITICAL - React dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{__html: content}} />

// DANGEROUS - document.write
document.write(userInput)
```

### Safe Patterns
```js
// Text content (auto-escaped)
element.textContent = userInput

// React
<div>{userInput}</div>

// DOMPurify
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(dirty)
```

### Detection Regex
```regex
(innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval)\s*\(|dangerouslySetInnerHTML
```

---

## Server-Side Request Forgery (SSRF)

### Threat
Attacker forces server to make requests to internal services, cloud metadata, or private networks.

### Patterns to Flag
```js
// CRITICAL - User-controlled URL
fetch(userProvidedUrl)

// CRITICAL - No protocol restrictions
new URL(userUrl)  // allows file://, ftp://

// DANGEROUS - No allowlist
axios.get(url)
```

### Safe Patterns
```js
// Allowlist + protocol validation
const ALLOWED_DOMAINS = ['api.example.com'];
const url = new URL(userUrl);
if (!ALLOWED_DOMAINS.includes(url.hostname)) throw Error();
if (url.protocol !== 'https:') throw Error();
```

### Detection Regex
```regex
(fetch|axios|http\.request|requests\.(get|post)|urllib|urlopen)\s*\(\s*[^)]*user|req\.query|req\.body
```

---

## Command Injection

### Threat
Attacker executes arbitrary shell commands on the server.

### Patterns to Flag
```js
// CRITICAL - Shell exec with user input
exec('ls ' + userInput)

// CRITICAL - Spawn with shell: true
spawn('ls', [userInput], { shell: true })

// DANGEROUS - Template literals in commands
`ls ${userInput}`
```

### Safe Patterns
```js
// argv array (no shell interpretation)
execFile('ls', [userInput], callback)

// Whitelist only
const ALLOWED_COMMANDS = ['ls', 'cat'];
if (!ALLOWED_COMMANDS.includes(cmd)) throw Error();
```

### Detection Regex
```regex
(exec|spawn|execSync|system|popen|child_process)\s*\(.*[\`"\$]
```

---

## Path Traversal

### Threat
Attacker accesses files outside intended directory (`../../etc/passwd`).

### Patterns to Flag
```js
// CRITICAL - Unsanitized path from user
fs.readFile(req.query.filename)

// CRITICAL - Path join without validation
path.join('/uploads', userFilename)
```

### Safe Patterns
```js
// Resolve + check it's within base
const base = '/uploads';
const resolved = path.resolve(base, userFilename);
if (!resolved.startsWith(base)) throw Error();
```

### Detection Regex
```regex
(fs\.(readFile|writeFile|readdir|access|createReadStream)|open|openSync)\s*\(\s*[^)]*(req\.|user|query|body|params)
```

---

## Hardcoded Secrets

### Threat
Exposed credentials in source control, logs, or error messages.

### Patterns to Flag
```js
// CRITICAL
const apiKey = 'sk-1234567890abcdef'

// CRITICAL
const password = "admin123"

// DANGEROUS
connectionString = 'postgres://user:pass@localhost/db'
```

### Safe Patterns
```js
// Environment variables only
const apiKey = process.env.API_KEY
const password = process.env.DB_PASSWORD
```

### Detection Regex
```regex
(password|secret|api[_-]?key|token|credential|private[_-]?key)\s*[:=]\s*['"][^'"]+['"]
sk-[a-zA-Z0-9]{20,}
ghp_[a-zA-Z0-9]{36}
```

---

## XML External Entity (XXE)

### Threat
Attacker exploits XML parser to read local files or perform SSRF.

### Patterns to Flag
```xml
<!-- CRITICAL -->
<!ENTITY xxe SYSTEM "file:///etc/passwd">
```

### Safe Patterns
```js
// Disable external entities
const parser = new DOMParser();
parser.parseFromString(xml, 'text/xml', { parserError: { forbidDTD: true } })
```

---

## Insecure Deserialization

### Threat
Attacker deserializes malicious payload to execute code.

### Patterns to Flag
```js
// CRITICAL
const obj = JSON.parse(untrusted)

// CRITICAL (Python)
data = pickle.loads(untrusted)

# CRITICAL (Python)
data = yaml.unsafe_load(untrusted)
```

### Safe Patterns
```js
// Type checks + schema validation
const schema = Joi.object({ id: Joi.number() });
const obj = schema.validate(untrusted);

// JSON.parse with reviver
JSON.parse(str, (key, val) => { /* validate */ })
```

---

## CSRF Protection

### Requirements for State-Changing Operations

1. **Token-based**: Generate CSRF token per session, include in forms/headers
2. **SameSite cookies**: `Set-Cookie: session=xxx; SameSite=Strict`
3. **Origin/Referer check**: Verify request origin matches expected
4. **Custom headers**: Require custom header (e.g., `X-Requested-With`)

### Detection
```
// MISSING - Forms without CSRF token
<form action="/delete">
  <!-- Should have: <input type="hidden" name="csrf" value="..." /> -->

// MISSING - Fetch without credentials
fetch('/api/data', { credentials: 'same-origin' })
```

---

## Proving Coverage

### Unit Tests Required

1. **SQLi**: Test query builder with `' OR '1'='1` input
2. **XSS**: Test with `<script>alert(1)</script>` - should be escaped
3. **SSRF**: Test with `http://169.254.169.254/` - should be blocked
4. **Path traversal**: Test with `../../../etc/passwd` - should be normalized/blocked

### Integration Tests

- Run OWASP ZAP or Burp Suite against running application
- Automated dependency scanning (npm audit, snyk)

### Code Review Checklist

- [ ] No raw SQL strings
- [ ] User input always sanitized/escaped
- [ ] URLs validated against allowlist
- [ ] File operations use safe path resolution
- [ ] No hardcoded credentials
- [ ] CSRF tokens on all state-changing forms
- [ ] SameSite cookies for sessions
- [ ] XXE protection enabled