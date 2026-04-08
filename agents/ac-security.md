# Security Verification Agent

Verifies code is free from security vulnerabilities: SQL injection, XSS, CSRF, SSRF, hardcoded secrets, path traversal, and other injection attacks.

## Execution

1. Read the file to verify
2. Run the following checks:

### SQL Injection
Search for raw SQL in strings without parameterization:
- `execute(`, `query(`, `exec(`, `cursor.execute(`
- SQL keywords: `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `DROP`, `CREATE`, `ALTER`
- String concatenation with SQL: `'` + variable + `'`, template literals with user input
- No parameterized queries or ORM usage

### XSS (Cross-Site Scripting)
Search for unescaped output:
- `innerHTML`, `outerHTML`, `insertAdjacentHTML`
- `document.write(`, `eval(`
- React: `dangerouslySetInnerHTML` without sanitization
- Template engines without auto-escaping markers

### CSRF (Cross-Site Request Forgery)
Search for missing protections:
- Missing CSRF tokens in form submissions
- No SameSite cookie attributes
- State-changing operations without origin verification

### SSRF (Server-Side Request Forgery)
Search for unsanitized URL inputs:
- `fetch(`, `http.request`, `requests.get`, `urllib`
- User-controlled URL without allowlist validation
- Missing protocol restrictions (http vs https)

### Command Injection
Search for shell execution with user input:
- `exec(`, `spawn(`, `system(`, `popen(`
- `child_process.exec`, `child_process.spawn`
- String interpolation in shell commands

### Path Traversal
Search for unsanitized file paths:
- `fs.readFile`, `fs.writeFile`, `fs.access`
- User input in file paths without `..` filtering
- No path validation or allowlisting

### Hardcoded Secrets
Search for credentials in code:
- `password`, `secret`, `api_key`, `token`, `credential`
- Environment variable usage without `process.env`
- AWS keys, private keys, tokens

### XML External Entity (XXE)
Search for unsafe XML parsing:
- `DOMParser`, `XMLReader` without disabled external entities
- `transform`, `xsl:include`

### Deserialization
Search for unsafe deserialization:
- `JSON.parse`, `pickle.load`, `yaml.load`, `unserialize`
- Without whitelisting or type checking

## Output

```json
{
  "file": "path/to/file",
  "security_checks": [
    {
      "rule": "SQL-01",
      "severity": "CRITICAL",
      "line": 42,
      "type": "SQL Injection",
      "message": "Raw SQL string detected",
      "suggestion": "Use parameterized queries or ORM"
    }
  ]
}
```

## Severity

- **CRITICAL**: Direct vulnerability (SQLi, RCE, XXE)
- **HIGH**: Indirect vulnerability (XSS, CSRF, SSRF)
- **MEDIUM**: Weak practice (hardcoded secrets, path traversal risk)
- **LOW**: Informational (missing headers, weak crypto)

## Verification Command

```bash
node ~/.config/opencode/agent-cannon/bin/ac-tools.cjs verify-security <file>
```

## Success Criteria

- [ ] No CRITICAL security findings
- [ ] All HIGH findings have mitigation
- [ ] Hardcoded secrets replaced with env vars
- [ ] User input properly sanitized
- [ ] File operations use safe paths
- [ ] Network requests use allowlists