# Contributing to SecureTextEditor

Thank you for your interest in contributing to SecureTextEditor!

## Important Legal Notice

By contributing to this project, you acknowledge and agree to the following:

1. **No Warranty**: All contributions are provided "AS IS" without warranty of any kind
2. **License Agreement**: Your contributions will be licensed under the MIT License
3. **No Liability**: You accept that neither you nor the project maintainers are liable for any issues arising from contributions
4. **Disclaimer Acceptance**: You have read and agree to the terms in [DISCLAIMER.md](DISCLAIMER.md)

## Contribution Guidelines

### Before Contributing

1. **Read the documentation**:
   - [README.md](README.md) - Project overview
   - [DISCLAIMER.md](DISCLAIMER.md) - Legal terms
   - [LICENSE](LICENSE) - MIT License terms

2. **Understand the risks**:
   - This is a personal project dealing with encryption
   - Security vulnerabilities in contributions could lead to data loss
   - Contributors are not liable, but should exercise caution

### How to Contribute

#### Reporting Issues

When reporting bugs or security issues:

- **For security vulnerabilities**: See [SECURITY.md](SECURITY.md)
- **For bugs**: Open an issue with:
  - Clear description of the problem
  - Steps to reproduce
  - Expected vs actual behavior
  - Your environment (OS, version, etc.)

#### Suggesting Features

Feature requests are welcome! Please:

- Check if the feature is already planned in [tasks.md](tasks.md)
- Explain the use case and benefits
- Consider backward compatibility
- Understand that implementation is not guaranteed

#### Code Contributions

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Follow the code style**:
   - Use TypeScript strict mode
   - Follow existing code conventions
   - Add comments for complex logic
   - Include proper error handling
4. **Test your changes**:
   - Test on both Android and Windows (if applicable)
   - Verify encryption/decryption still works
   - Check for console errors
   - Test edge cases
5. **Commit with clear messages**:
   ```
   feat(component): add new feature
   fix(bug): resolve issue with...
   docs(readme): update documentation
   ```
6. **Submit a Pull Request**:
   - Describe what your changes do
   - Reference any related issues
   - List what you've tested

### Code Review Process

- The maintainer will review PRs when possible
- **No guaranteed timeline** for reviews or merges
- PRs may be rejected without detailed explanation
- Maintainer has final say on all contributions

### What We're Looking For

Contributions that:

- ✅ Fix bugs or security issues
- ✅ Improve documentation
- ✅ Add requested features (see [tasks.md](tasks.md))
- ✅ Improve code quality or performance
- ✅ Add tests

Contributions that may be rejected:

- ❌ Break existing functionality
- ❌ Don't follow code style
- ❌ Lack proper testing
- ❌ Introduce security vulnerabilities
- ❌ Add unnecessary dependencies
- ❌ Over-engineer simple solutions

## Security Considerations

When contributing code that touches:

- **Encryption/Decryption**: Be extremely careful, test thoroughly
- **Password handling**: Never log or store passwords
- **File operations**: Validate paths, handle errors properly
- **External services**: Validate all inputs, handle failures gracefully

## Development Setup

See [README.md](README.md) for detailed setup instructions.

Quick start:
```bash
npm install
npm run dev
```

## Testing

Currently, the project is in active development. When submitting contributions:

- Test manually on target platforms
- Verify no TypeScript errors: `npm run build`
- Run linter: `npm run lint`
- Check for console errors

## Communication

- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Pull Requests**: Use PR comments for code-specific discussions

**Note**: Response times are not guaranteed. This is a personal project maintained on a best-effort basis.

## License

By contributing, you agree that your contributions will be licensed under the MIT License, the same license covering this project.

You retain copyright to your contributions but grant the project an irrevocable, worldwide license to use, modify, and distribute your code.

## Disclaimer for Contributors

**IMPORTANT**: By contributing to this project, you acknowledge:

1. You are contributing code at your own risk
2. Your contributions may be modified or removed at any time
3. You are not guaranteed attribution (though we try to credit contributors)
4. You accept all terms in [DISCLAIMER.md](DISCLAIMER.md)
5. You understand this software deals with encryption and data storage
6. You accept no liability for issues arising from your contributions or their use
7. You have the right to contribute the code (not copied from elsewhere)
8. Your code does not violate any licenses, patents, or copyrights

## Code of Conduct

### Expected Behavior

- Be respectful and professional
- Focus on constructive feedback
- Accept that maintainers have final decision authority
- Understand that "no" is a valid response

### Unacceptable Behavior

- Harassment or discrimination
- Spam or self-promotion
- Demanding features or fixes
- Threatening legal action

Violations may result in contribution rejection or blocking.

## Questions?

Before asking questions:

1. Read the documentation thoroughly
2. Search existing issues
3. Check the specification: [SecureTextEditor_Specification.md](SecureTextEditor_Specification.md)

If still unclear, open a GitHub Issue with your question.

## Final Notes

This is a **personal project** shared publicly. Contributions are appreciated but:

- No obligation to accept any contribution
- No guaranteed support or maintenance
- Project direction is at maintainer's discretion
- Project may be abandoned at any time

Thank you for understanding and for any contributions you make!

---

**Last Updated**: January 4, 2026
