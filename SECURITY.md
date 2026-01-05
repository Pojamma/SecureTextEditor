# Security Policy

## Important Security Disclaimer

**SecureTextEditor is a personal project and has NOT been professionally audited for security.** While it implements industry-standard encryption (AES-256-GCM), it should not be relied upon for:

- Protecting highly sensitive data
- Mission-critical security applications
- Compliance with security regulations (HIPAA, PCI-DSS, etc.)
- Professional or commercial use requiring certified security

**USE AT YOUR OWN RISK.** See [DISCLAIMER.md](DISCLAIMER.md) for complete terms.

## Encryption Details

### Current Implementation

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with SHA-256
- **Iterations**: 600,000 (PBKDF2)
- **IV**: 12 bytes, randomly generated per encryption
- **Salt**: 16 bytes, randomly generated per document
- **Authentication Tag**: 128 bits (GCM)

### Security Properties

✅ **What this provides**:
- Strong encryption for text data at rest
- Authentication tag prevents tampering
- Unique IV for each encryption operation
- Memory clearing of sensitive data after use

❌ **What this does NOT provide**:
- Professional security audit or certification
- Protection against sophisticated attackers
- Guaranteed security for all use cases
- Key recovery if password is lost
- Protection against keyloggers or malware on the device
- Secure communication channels (this is local encryption only)

## Supported Versions

This is a personal project under active development. Security updates will be provided on a best-effort basis.

| Version | Status | Notes |
| ------- | ------ | ----- |
| 0.2.x   | Active Development | Current version |
| 0.1.x   | No longer supported | Migrate to 0.2.x |
| < 0.1.0 | Unsupported | Alpha/development versions |

**No guarantees** are made regarding security updates, patches, or ongoing support.

## Known Security Limitations

### By Design

1. **Password Recovery**: Impossible by design - lost passwords = lost data
2. **No Cloud Backup**: Encrypted files must be backed up manually
3. **Device Security**: App cannot protect against compromised devices
4. **Password Strength**: Security depends entirely on user-chosen passwords
5. **No Multi-Factor Auth**: Single password protection only

### Current Limitations

1. **No Security Audit**: Code has not been professionally audited
2. **Personal Project**: Maintained by single developer on best-effort basis
3. **Platform Security**: Relies on platform security (Android, Windows)
4. **Dependency Security**: Third-party libraries may have vulnerabilities
5. **No Penetration Testing**: Has not undergone security testing

## Reporting a Vulnerability

### What to Report

Please report security issues if you discover:

- Encryption implementation flaws
- Password/key exposure in logs or memory
- Authentication bypass vulnerabilities
- Data leakage issues
- Injection vulnerabilities (XSS, code injection, etc.)
- Unauthorized file access
- Cryptographic weaknesses

### How to Report

**DO NOT** open public GitHub issues for security vulnerabilities.

Instead:

1. **Email**: Send details to the repository owner privately
   - Find email in GitHub profile or commit history
   - Use subject line: "SecureTextEditor Security Issue"

2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if you have one)
   - Your contact information (optional, for credit)

3. **Allow time for response**:
   - This is a personal project
   - Response may take days or weeks
   - No guaranteed response time

### What to Expect

After reporting:

1. **Acknowledgment**: You may receive confirmation of receipt (no guarantee)
2. **Investigation**: The issue will be investigated when possible
3. **Fix**: If valid and feasible, a fix will be developed
4. **Disclosure**:
   - Coordinated disclosure preferred
   - Allow reasonable time for fix before public disclosure
   - Credit will be given to reporter (if desired)

### What NOT to Expect

- Immediate response
- Bug bounty or payment
- Guaranteed fix timeline
- Legal agreements or NDAs
- Professional vulnerability management process

## Security Best Practices for Users

To maximize security when using SecureTextEditor:

### Password Security

1. **Use strong passwords**:
   - Minimum 16 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Don't reuse passwords from other services
   - Consider using a password manager

2. **Store passwords safely**:
   - Use a password manager
   - Keep paper backup in secure location
   - Never email passwords to yourself
   - Don't store passwords in plain text files

### Data Protection

1. **Maintain backups**:
   - Keep multiple backups of encrypted files
   - Store backups in different locations
   - Test backup restoration regularly
   - Back up both encrypted files AND passwords (separately!)

2. **Device security**:
   - Keep your device OS updated
   - Use device encryption (Android: full disk encryption)
   - Use screen lock/PIN on mobile devices
   - Install security updates promptly
   - Avoid jailbroken/rooted devices

3. **Network security**:
   - Don't sync sensitive encrypted files over public WiFi
   - Use VPN when syncing to cloud services
   - Be cautious with cloud storage permissions

### Operational Security

1. **Verify software source**:
   - Download only from official GitHub repository
   - Verify checksums if provided
   - Build from source for maximum trust

2. **Be aware of limitations**:
   - This is not enterprise security software
   - Not audited by security professionals
   - Use at your own risk

3. **Have a recovery plan**:
   - Know what you'll do if you lose a password
   - Keep critical data in multiple forms
   - Don't rely solely on this app for important data

## Dependency Security

This project uses third-party libraries. Security of dependencies is managed through:

- Regular `npm audit` checks (best effort)
- Updating dependencies when feasible
- Monitoring security advisories

**However**:
- No guarantee of immediate updates
- Some vulnerabilities may be accepted if low risk
- Breaking changes may delay security updates

Users concerned about dependency security should:
- Run `npm audit` before building
- Review dependency licenses and advisories
- Consider auditing dependencies themselves
- Build from source rather than using pre-built binaries

## Cryptographic Implementation

### Algorithm Choices

**Why AES-256-GCM?**
- Industry standard symmetric encryption
- Authenticated encryption (prevents tampering)
- Supported by Web Crypto API
- Well-studied and trusted

**Why PBKDF2?**
- Widely supported
- Standardized (RFC 2898)
- Configurable iteration count
- Available in Web Crypto API

**Alternative**: Argon2 would be better for password-based key derivation but isn't available in Web Crypto API. Users requiring maximum security should consider this limitation.

### Implementation Details

The encryption implementation:
- Uses browser's Web Crypto API (not custom crypto)
- Generates random IV for each encryption
- Uses unique salt per document
- Clears sensitive data from memory after use
- Never stores passwords

**Code location**: `src/services/encryption.service.ts`

Users are encouraged to review this code.

## Threat Model

### What We Protect Against

✅ Unauthorized access to files stored on device
✅ File tampering (via GCM authentication)
✅ Data exposure if device is lost/stolen (if powered off)
✅ Casual snooping by others with device access

### What We DON'T Protect Against

❌ Malware on the device
❌ Keyloggers capturing passwords
❌ Sophisticated attackers with device access
❌ Compromised operating system
❌ Physical attacks on running device
❌ Side-channel attacks
❌ Quantum computing (in the future)
❌ Weak user-chosen passwords
❌ Users sharing passwords

## Incident Response

In case of security incident:

1. **Assessment**: Determine scope and severity
2. **Fix Development**: Create patch if possible
3. **Release**: Push fix to repository
4. **Notification**:
   - Update SECURITY.md with details
   - Post notice in README.md
   - Create GitHub issue (after fix is available)
   - Note affected versions

**No guarantee** of coordinated disclosure or formal security advisory process.

## Compliance and Regulations

**This software makes NO claims of compliance** with any security standards or regulations including but not limited to:

- HIPAA (Healthcare)
- PCI-DSS (Payment Cards)
- GDPR (Data Protection)
- SOC 2
- ISO 27001
- NIST frameworks
- Export control regulations

**Users are solely responsible** for ensuring their use complies with applicable laws and regulations.

## Disclaimer

This security policy is provided for informational purposes only and creates no obligations or warranties. See [DISCLAIMER.md](DISCLAIMER.md) and [LICENSE](LICENSE) for complete terms.

**By using this software, you acknowledge:**
- You've read and understood this security policy
- You accept the security limitations
- You use the software at your own risk
- You're responsible for your own security practices

---

**Last Updated**: January 4, 2026

**Note**: This policy may be updated at any time. Check back regularly for changes.
