# SecureTextEditor - Instructions for Claude Code

## 📋 Project Overview

You are building **SecureTextEditor**, a cross-platform encrypted text editor for personal use on Android and Windows devices. This document provides the roadmap and critical reminders for successful implementation.

---

## 🗂️ Essential Documentation Files

### 1. Design Specification

**File**: `SecureTextEditor_Specification.md`

This is your comprehensive blueprint containing:

- Complete technical architecture
- Security specifications (AES-256-GCM encryption)
- Feature requirements and workflows
- UI/UX design specifications
- Implementation phases (7 phases)
- Testing requirements
- Code examples and TypeScript interfaces
- Configuration files
- Everything you need to build the application

**Action**: Read this file thoroughly before starting each session and phase.

### 2. Task Checklist

**File**: `tasks.md`

This is your progress tracker containing:

- Over 300 detailed tasks organized by phase
- Empty checkboxes for completion tracking
- Project metrics section
- Time tracking for each phase
- Quality metrics tracking

**Action**: Refer to this constantly and update it as you work.

---

## ⚡ Critical Reminders

### 🔄 Update Tasks File Regularly

**IMPORTANT**: As you complete tasks, you MUST update the `tasks.md` file:

```bash
# After completing a task, change:
- [ ] Task description

# To:
- [x] Task description
```

**Update Frequency**: 

- Update after completing each significant task
- At minimum, update at the end of each work session
- Update project metrics when switching phases

**How to Update**:

1. Open `tasks.md`
2. Find the completed task
3. Change `- [ ]` to `- [x]`
4. Update the Project Metrics section as needed
5. Save the file
6. Commit to GitHub (see below)

### 📤 GitHub Updates

**IMPORTANT**: Commit and push to GitHub regularly to prevent data loss and track progress.

**GitHub Credentials**: 

- Your GitHub credentials are stored in the `.env` file
- Load them at the start of your session
- Never commit the `.env` file to the repository (add to `.gitignore`)

**Commit Frequency**:

- After completing each major task or feature
- At the end of each work session
- Before switching between phases
- After fixing critical bugs
- Minimum: Daily commits

**Commit Message Format**:

```
<type>(<scope>): <subject>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code formatting
- refactor: Code refactoring
- test: Adding tests
- chore: Maintenance tasks

Examples:
feat(encryption): implement AES-256-GCM encryption service
fix(tabs): resolve tab switching bug on mobile
docs(readme): update installation instructions
chore(tasks): update completed tasks in tasks.md
```

**Git Workflow**:

```bash
# 1. Check status
git status

# 2. Stage changes
git add .

# 3. Commit with descriptive message
git commit -m "feat(editor): implement basic text editor component"

# 4. Push to GitHub
git push origin main

# 5. Update tasks.md and commit again
git add tasks.md
git commit -m "chore(tasks): mark Phase 1 editor tasks as complete"
git push origin main
```

**Branch Strategy** (Recommended):

```bash
# Main development on develop branch
git checkout -b develop

# Feature branches for major features
git checkout -b feature/encryption
# ... work on feature ...
git checkout develop
git merge feature/encryption

# Push both branches
git push origin develop
git push origin main  # after merging develop into main
```

---

## 🚀 Getting Started

### Step 1: Environment Setup

1. Load GitHub credentials from `.env` file
2. Verify you can commit and push to the repository
3. Create initial `.gitignore` file (include `.env`, `node_modules`, `dist`, etc.)

### Step 2: Review Documentation

1. **Read** `SecureTextEditor_Specification.md` completely
2. **Review** `tasks.md` to understand the full scope
3. **Understand** the 7-phase implementation plan

### Step 3: Initialize Project

1. Follow "Pre-Development Setup" tasks in `tasks.md`
2. Create the project structure
3. Install dependencies
4. Configure build tools
5. **Commit** initial setup to GitHub
6. **Update** tasks.md with completed setup tasks

### Step 4: Begin Phase 1 (MVP)

1. Reference Phase 1 section in the specification
2. Work through Phase 1 tasks in `tasks.md`
3. Commit frequently
4. Update tasks.md regularly
5. Test thoroughly before moving to Phase 2

---

## 📂 Project Structure Reference

```
SecureTextEditor/
├── .env                          # GitHub credentials (DO NOT COMMIT)
├── .gitignore                    # Git ignore rules
├── README.md                     # Project readme
├── SecureTextEditor_Specification.md  # Your main reference
├── tasks.md                      # Your progress tracker
├── CLAUDE.md                     # This file
│
├── src/
│   ├── components/               # React components
│   │   ├── Editor/
│   │   ├── Menus/
│   │   └── Dialogs/
│   ├── services/                 # Business logic
│   │   ├── encryption.service.ts
│   │   ├── storage.service.ts
│   │   ├── googleDrive.service.ts
│   │   └── session.service.ts
│   ├── stores/                   # State management
│   │   ├── documentStore.ts
│   │   ├── settingsStore.ts
│   │   └── uiStore.ts
│   ├── types/                    # TypeScript types
│   ├── utils/                    # Utility functions
│   └── App.tsx                   # Main app component
│
├── android/                      # Android platform (Capacitor)
├── windows/                      # Windows platform (Electron)
│
├── capacitor.config.ts           # Capacitor configuration
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite build configuration
├── package.json                  # Dependencies and scripts
└── package-lock.json             # Locked dependencies
```

---

## 🔐 Security Reminders

### Critical Security Requirements

1. **Encryption**: Use AES-256-GCM exclusively (see specification Section 3)
2. **Key Derivation**: PBKDF2 with 600,000 iterations (see specification Section 3.2)
3. **No Password Storage**: Passwords must never be saved anywhere
4. **Memory Clearing**: Clear sensitive data from memory after use
5. **Secure Random**: Use `crypto.getRandomValues()` for IV and salt generation

### Security Testing Checklist

Before marking Phase 3 complete, verify:

- [ ] Encryption produces different output each time (unique IV)
- [ ] Decryption with wrong password fails gracefully
- [ ] No passwords stored in memory after dialog closes
- [ ] Salt is unique per document
- [ ] Authentication tag prevents tampering
- [ ] No sensitive data in console.log statements

---

## 🎯 Phase-by-Phase Workflow

### For Each Phase:

1. **Review Specification**
   
   - Read the relevant phase section in `SecureTextEditor_Specification.md`
   - Understand all requirements for that phase
   - Note any dependencies or prerequisites

2. **Plan Work**
   
   - Review tasks in `tasks.md` for the current phase
   - Identify critical path items
   - Plan order of implementation

3. **Implement**
   
   - Work through tasks systematically
   - Test each feature as you build it
   - Write clean, documented code
   - Follow TypeScript best practices

4. **Test**
   
   - Complete all testing tasks for the phase
   - Fix bugs before moving forward
   - Verify on both Android and Windows (starting Phase 6)

5. **Update & Commit**
   
   - Update `tasks.md` with completed tasks
   - Update project metrics
   - Commit all changes to GitHub
   - Write clear commit messages

6. **Phase Review**
   
   - Verify phase deliverable is complete
   - Ensure all tests pass
   - Document any issues or technical debt
   - Get ready for next phase

---

## 📊 Progress Tracking

### Daily Workflow

**Start of Day**:

1. Pull latest from GitHub: `git pull origin main`
2. Review `tasks.md` to see where you left off
3. Review current phase in specification
4. Plan tasks for the day

**During Work**:

1. Work on tasks in order of priority
2. Commit after each significant accomplishment
3. Update `tasks.md` as you complete items
4. Test your code regularly

**End of Day**:

1. Update `tasks.md` with all completed tasks
2. Update project metrics
3. Commit and push all changes to GitHub
4. Note any blockers in the Notes section of `tasks.md`

### Weekly Milestones

At the end of each week:

1. Review overall progress in `tasks.md`
2. Update time tracking metrics
3. Assess if you're on track for phase completion
4. Document any decisions or challenges
5. Plan for the next week
6. Commit a "weekly checkpoint" with summary

---

## 🐛 Debugging & Problem Solving

### When You Encounter Issues

1. **Document the Issue**
   
   - Add to "Known Issues" section in `tasks.md`
   - Include steps to reproduce
   - Note any error messages

2. **Research Solutions**
   
   - Check the specification for guidance
   - Review TypeScript/React documentation
   - Search for similar issues

3. **Test Fixes**
   
   - Verify fix resolves the issue
   - Ensure no regression
   - Add test case if needed

4. **Update Documentation**
   
   - Remove from "Known Issues" when fixed
   - Update tasks.md
   - Commit fix with clear message

---

## 📱 Platform-Specific Notes

### Android Development

- Test on both emulator and physical device
- Test on different screen sizes (phone and tablet)
- Verify touch interactions work smoothly
- Test Google Drive integration on mobile
- Check battery usage and performance

### Windows Development

- Test on Windows 10 and 11
- Verify all keyboard shortcuts work
- Test file system permissions
- Check desktop shortcut creation
- Verify installer works correctly

---

## ✅ Quality Checklist

Before considering any phase "complete":

- [ ] All phase tasks in `tasks.md` are checked off
- [ ] All features work as specified
- [ ] All tests pass
- [ ] No console errors or warnings
- [ ] Code is clean and well-commented
- [ ] TypeScript has no type errors
- [ ] Performance is acceptable
- [ ] UI is responsive and works on mobile
- [ ] `tasks.md` is updated
- [ ] All changes committed to GitHub

---

## 🚨 Common Pitfalls to Avoid

1. **Don't skip testing** - Test as you build, not just at the end
2. **Don't commit sensitive data** - Keep `.env` out of Git
3. **Don't forget to update tasks.md** - Track progress continuously
4. **Don't move to next phase prematurely** - Complete current phase fully
5. **Don't ignore errors** - Fix issues as they arise
6. **Don't skip documentation** - Comment complex code
7. **Don't over-engineer** - Follow the specification
8. **Don't neglect mobile UI** - This is a mobile-first design

---

## 📞 Key Reference Points

### Encryption Implementation

See: `SecureTextEditor_Specification.md` Section 3 (Security Specifications)

### UI Layout

See: `SecureTextEditor_Specification.md` Section 5 (User Interface Design)

### Google Drive Integration

See: `SecureTextEditor_Specification.md` Section 6 (Google Drive Integration)

### Testing Requirements

See: `SecureTextEditor_Specification.md` Section 8 (Testing Requirements)

### All Tasks

See: `tasks.md` (all phases)

---

## 🎓 Best Practices

### Code Quality

- Use TypeScript strict mode
- Write self-documenting code
- Add comments for complex logic
- Follow consistent naming conventions
- Keep functions small and focused
- Use proper error handling

### Git Hygiene

- Write clear commit messages
- Commit logical units of work
- Don't commit commented-out code
- Keep commits focused (one feature/fix per commit)
- Push regularly to prevent data loss

### Development Process

- Read before coding
- Plan before implementing
- Test before committing
- Document before moving on
- Review before deploying

---

## 📈 Success Metrics

Your implementation is successful when:

✅ All 7 phases are complete  
✅ All tasks in `tasks.md` are checked off  
✅ Application runs on Android (APK installed and tested)  
✅ Application runs on Windows (installer tested)  
✅ Encryption/decryption works securely  
✅ Google Drive integration functions  
✅ All tests pass (80%+ coverage)  
✅ UI is polished and responsive  
✅ Documentation is complete  
✅ Code is committed to GitHub  

---

## 🎯 Final Reminder

**Three Critical Actions**:

1. **📖 READ** the specification before each phase
2. **✅ UPDATE** tasks.md as you complete work
3. **💾 COMMIT** to GitHub regularly

Following these three actions will ensure smooth development and prevent lost work.

Append a brief **Session Summary** at the end of each session to the sessions.md file.

- **IMPORTANT**: Use date/time format (YYYY-MM-DD HH:MM:SS TZ) instead of session numbers
- **Do NOT read** sessions.md before appending - it's large and unnecessary
- Always **append** directly to the end of the file
- Example: `## Session: 2025-11-24 20:05:04 PST`

---

## 🆘 Quick Reference Commands

```bash
# Load environment variables
source .env  # or however you load .env in your setup

# Git commands
git status
git add .
git commit -m "feat(component): description"
git push origin main

# Check tasks
cat tasks.md | grep "Phase 1" -A 50

# Development
npm install
npm run dev
npm run build

# Platform builds
npx cap add android
npx cap add electron
npx cap sync
npx cap open android
```

---

## 📝 Notes Section

Use this section for your own notes as you develop:

### Technical Decisions

[Document important technical choices you make]

### Challenges Encountered

[Note any difficult problems and how you solved them]

### Future Improvements

[Ideas for features beyond the specification]

---

**Good luck with the implementation! Remember: Read, Update, Commit. You've got this! 🚀**

---

**Last Updated**: [Date]  
**Current Status**: Ready to Begin  
**Next Action**: Review specification and start Phase 1
