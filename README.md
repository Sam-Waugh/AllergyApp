# Allergy App

A comprehensive allergy tracking and management application built with React Native (Expo) frontend and FastAPI backend, featuring **HIPAA-compliant Hybrid AI-powered medical report generation**.

## 🤖 Hybrid AI Report Generation

The Allergy App now features a **Hybrid AI approach** that provides the best of both worlds:

- **AI Medical Insights**: OpenAI GPT-4 analyzes de-identified symptom patterns for sophisticated medical analysis
- **Complete Personal Data**: Local processing ensures all personal health information remains in the final report
- **HIPAA Compliant**: No PHI sent to external AI services
- **Maximally Useful**: Reports include real patient names, dates, and complete medical details

### Key Benefits
- ✅ Advanced AI pattern analysis without privacy risks
- ✅ Complete patient information for healthcare providers  
- ✅ HIPAA Safe Harbor compliant throughout
- ✅ Clear indicators of AI-generated vs. personal content

## 🔒 HIPAA Compliance

This application implements **HIPAA Safe Harbor de-identification** for AI-powered features:
- ✅ All PHI removed before external AI processing
- ✅ Names replaced with anonymous patient IDs  
- ✅ Dates converted to relative timeframes
- ✅ All 18 HIPAA identifiers addressed
- ✅ Full audit trail maintained

## 📋 Documentation

📖 **[Complete Documentation](docs/INDEX.md)** - Setup guides, reports, and all project documentation

## 🚀 Quick Start

1. **[Read the Documentation](docs/README.md)** - Main project overview
2. **[Setup API Keys](docs/setup-guides/API_KEY_SETUP_GUIDE.md)** - Required before running
3. **[HIPAA-Compliant Reports](docs/setup-guides/OPENAI_REPORT_GENERATION.md)** - AI report generation setup
4. **[Android Setup](docs/setup-guides/COMPLETE_ANDROID_SETUP.md)** - For mobile testing
5. **[View Latest Status](docs/reports/)** - Current project status

## 🏗️ Project Structure

```
AllergyApp/
├── docs/                    # 📋 All documentation and guides
├── frontend/                # React Native Expo app
├── backend/                 # FastAPI Python backend with HIPAA compliance
├── archive/                 # Historical files and tests
└── [config files]
```

## 🔒 Security & Compliance

- **HIPAA Safe Harbor Compliant**: All PHI de-identified before external AI processing
- **API Security**: All API keys and secrets stored in `.env` files (excluded from git)
- **Audit Trail**: De-identification mapping maintained for compliance documentation

---

**Start here:** [docs/INDEX.md](docs/INDEX.md)
