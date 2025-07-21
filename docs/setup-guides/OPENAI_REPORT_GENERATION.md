# 🏥 HIPAA-Compliant OpenAI Allergy Report Generation

This feature uses OpenAI's GPT-4 API to generate comprehensive, structured medical reports for allergy management with full HIPAA compliance through de-identification. The reports are designed to be clear, professional, and suitable for sharing with healthcare providers while ensuring no Protected Health Information (PHI) is transmitted to external AI services.

## 🔒 HIPAA Compliance

**IMPORTANT**: This implementation ensures HIPAA compliance by de-identifying all patient data according to HIPAA Safe Harbor guidelines before sending to OpenAI.

### How HIPAA Compliance is Achieved

1. **De-identification Before External Processing**: All patient data is de-identified according to HIPAA Safe Harbor guidelines (45 CFR 164.514(b)(2)) before being sent to OpenAI.

2. **18 HIPAA Identifiers Removed**: The system removes or transforms all 18 HIPAA identifiers including:
   - Names (replaced with anonymous patient IDs)
   - Dates (converted to relative timeframes)
   - Geographic information (state-level only)
   - Contact information (phone, email, addresses)  
   - Medical record numbers
   - Any other unique identifying characteristics

3. **Alternative Compliance Options**: For organizations requiring a Business Associate Agreement (BAA), consider:
   - **BastionGPT**: HIPAA-compliant GPT service with BAA
   - **CompliantGPT**: Healthcare-focused AI with HIPAA compliance
   - **Azure OpenAI Service**: Microsoft's HIPAA-compliant version

## 🚀 Features

### Report Structure
The generated reports include the following sections, prioritizing serious reactions:

1. **Patient Details**
   - Name, age, date of birth, gender
   - Parent/guardian contact information
   - Emergency contacts

2. **Medical History**
   - Known allergies and medical conditions
   - Current medications
   - Healthcare provider information

3. **Reaction History** ⚠️ *Serious reactions prioritized*
   - Documented allergic reactions with dates
   - Severity levels (mild, moderate, severe)
   - Triggers and treatments given
   - Detailed observations and notes

4. **Allergy Testing**
   - Completed tests and results
   - Recommended testing

5. **Diagnosed Allergies**
   - Confirmed allergic conditions
   - Severity assessments
   - Management status

6. **Suspected Allergies**
   - Potential allergies based on symptom patterns
   - Evidence and reasoning

7. **Allergies in Treatment**
   - Current treatment plans
   - Treatment effectiveness

8. **Current Management Plan**
   - Emergency action procedures
   - Daily and rescue medications
   - Environmental controls
   - Dietary restrictions

9. **Planned Appointments**
   - Recommended follow-up care
   - Specialist referrals

10. **Summary & Recommendations**
    - Key findings and priority concerns
    - Actionable next steps

## 📋 API Endpoints

**All endpoints automatically de-identify PHI before external AI processing to ensure HIPAA compliance.**

### 1. Test HIPAA-Compliant OpenAI Connection
```http
GET /api/v1/reports/test
```

**Response:**
```json
{
  "status": "success",
  "message": "OpenAI API key is configured with HIPAA de-identification",
  "configured": true,
  "hipaa_compliant": true,
  "hipaa_service": "HIPAA Safe Harbor de-identification active",
  "api_key_preview": "sk-1234567...",
  "compliance_note": "All PHI is de-identified before sending to OpenAI according to HIPAA Safe Harbor guidelines"
}
```

### 2. Generate Comprehensive Report
```http
POST /api/v1/reports/generate
```

**Request Body:**
```json
{
  "child_id": 1,
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-07-18T00:00:00Z",
  "include_photos": false,
  "report_type": "comprehensive"
}
```

**Response:**
```json
{
  "success": true,
}
```

### 3. Generate Text Report
```http
POST /api/v1/reports/generate-text
```

**Request Body:**
```json
{
  "child_id": 1,
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-07-18T00:00:00Z",
  "report_type": "text"
}
```

**Response:**
```json
{
  "success": true,
  "report_text": "PEDIATRIC ALLERGY SUMMARY\n\nPatient ID: PATIENT_12345678\nAge Category: Preschool (3-5 years)\n\n[AI-generated text analysis using de-identified data]\n\n--- HIPAA COMPLIANCE NOTE ---\nThis report was generated using de-identified data according to HIPAA Safe Harbor guidelines."
}
```

### 4. Get Child Summary
```http
GET /api/v1/reports/child/{child_id}/summary?days=30
```
Returns a quick summary of recent allergy data for preview.

## 🔧 Setup Instructions

## 🔧 Setup Instructions

### 1. Install Dependencies

The OpenAI package is already added to `requirements.txt`:
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure OpenAI API Key

1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add it to your `backend/.env` file:

```env
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

⚠️ **Important:** 
- Never commit your API key to version control
- Keep your API key secure and private
- Monitor usage to avoid unexpected charges

### 3. Restart Backend Server

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8090 --reload
```

## 🧪 Testing

### Test Page
Open `allergy_report_test.html` in your browser to test the implementation:
```
file:///path/to/your/project/allergy_report_test.html
```

### Manual Testing
```bash
# Test API availability
curl http://localhost:8090/api/v1/reports/test

# Test with authentication (replace with actual token)
curl -X POST http://localhost:8090/api/v1/reports/generate-text \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"child_id": 1, "report_type": "comprehensive"}'
```

## 💡 Usage Examples

### Frontend Integration (React Native)

```typescript
import { apiService } from '../services/apiService';

const generateReport = async (childId: number) => {
  try {
    const response = await apiService.post('/reports/generate', {
      child_id: childId,
      start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
      end_date: new Date(),
      include_photos: false,
      report_type: 'comprehensive'
    });
    
    return response.data.report;
  } catch (error) {
    console.error('Report generation failed:', error);
    throw error;
  }
};
```

### Displaying Reports

```typescript
const ReportComponent = ({ report }) => (
  <ScrollView>
    <Text style={styles.title}>Allergy Report</Text>
    
    {/* Priority Concerns - Always show first */}
    {report.priority_concerns.length > 0 && (
      <View style={styles.prioritySection}>
        <Text style={styles.priorityTitle}>⚠️ Priority Concerns</Text>
        {report.priority_concerns.map((concern, index) => (
          <Text key={index} style={styles.priorityText}>{concern}</Text>
        ))}
      </View>
    )}
    
    {/* Patient Details */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Patient Details</Text>
      <Text>Name: {report.patient_details.name}</Text>
      <Text>Age: {Math.floor(report.patient_details.age_months / 12)} years</Text>
    </View>
    
    {/* Reaction History - Serious reactions first */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Reaction History</Text>
      {report.reaction_history
        .sort((a, b) => a.severity_level === 'severe' ? -1 : 1)
        .map((reaction, index) => (
          <ReactionCard key={index} reaction={reaction} />
        ))}
    </View>
    
    {/* Other sections... */}
  </ScrollView>
);
```

## 🔒 Security & Privacy

### Data Protection
- All medical data is processed securely
- OpenAI API calls use encrypted connections
- No patient data is stored by OpenAI (per their data usage policies)
- Generated reports are returned to your application only

### API Key Security
- Store API keys in environment variables only
- Use different keys for development and production
- Monitor API usage regularly
- Rotate keys periodically

### HIPAA Considerations
- Review OpenAI's data processing agreement
- Ensure compliance with local privacy regulations
- Consider data anonymization for non-essential fields
- Implement proper access controls

## 💰 Cost Management

### OpenAI Pricing (as of 2024)
- GPT-4: ~$0.03 per 1K input tokens, ~$0.06 per 1K output tokens
- Typical report: ~3,000-4,000 tokens total
- Estimated cost per report: ~$0.15-$0.25

### Cost Optimization
- Cache reports to avoid regeneration
- Use shorter date ranges for routine reports
- Implement rate limiting
- Consider GPT-3.5-turbo for less complex reports

## 🚀 Advanced Features

### Custom Prompts
Modify prompts in `services/openai_service.py` to customize:
- Report format and structure
- Medical terminology level
- Specific focus areas
- Language and tone

### Report Formats
- **Comprehensive**: Full structured report with all sections
- **Summary**: Condensed version highlighting key points
- **Medical History**: Focus on historical data and patterns

### Integration Options
- **PDF Export**: Add PDF generation using reportlab
- **Email Reports**: Integrate with email services
- **Scheduling**: Automatic periodic report generation
- **Multi-language**: Support for different languages

## 🐛 Troubleshooting

### Common Issues

1. **"OpenAI API key not configured"**
   - Check `.env` file exists and has correct variable name
   - Restart backend server after changing `.env`
   - Verify no extra spaces around the API key

2. **"Rate limit exceeded"**
   - Check OpenAI usage dashboard
   - Implement request throttling
   - Consider upgrading OpenAI plan

3. **"Invalid API key"**
   - Verify key format (starts with `sk-`)
   - Check key hasn't been revoked
   - Ensure billing is set up on OpenAI account

4. **"Model not found"**
   - Verify model name in `openai_service.py`
   - Check if you have access to GPT-4
   - Fallback to `gpt-3.5-turbo` if needed

### Debug Mode
Enable detailed logging by setting:
```env
OPENAI_DEBUG=true
```

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [GPT-4 Model Information](https://platform.openai.com/docs/models/gpt-4)
- [OpenAI Usage Policies](https://openai.com/policies/usage-policies)
- [HIPAA Compliance Guide](https://www.hhs.gov/hipaa/index.html)

## 🔄 Updates & Maintenance

### Model Updates
- Monitor OpenAI model releases
- Test new models with sample data
- Update model names in configuration

### Prompt Engineering
- Regularly review generated reports for quality
- Refine prompts based on healthcare provider feedback
- A/B test different prompt variations

### Performance Monitoring
- Track API response times
- Monitor error rates
- Set up alerts for API failures

---

## 🎯 Next Steps

1. **Set up your OpenAI API key**
2. **Test the endpoints using the provided test page**
3. **Integrate report generation into your frontend**
4. **Customize prompts for your specific needs**
5. **Add PDF export functionality**
6. **Implement cost monitoring and alerts**

The OpenAI integration is now ready to generate professional, comprehensive allergy reports that prioritize serious reactions and provide clear, actionable information for both parents and healthcare providers! 🎉
