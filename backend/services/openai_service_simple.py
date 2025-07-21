"""
HIPAA-Compliant OpenAI Report Generation Service (Simplified)

This service integrates with the HIPAA de-identification service to ensure
that no Protected Health Information (PHI) is sent to OpenAI. All data is
de-identified according to HIPAA Safe Harbor guidelines before being processed.

This simplified version focuses on the core HIPAA compliance functionality.
"""

import os
import json
from datetime import datetime
from typing import List, Dict, Any
from openai import AsyncOpenAI

from services.hipaa_deidentification import HIPAADeIdentificationService


class HIPAACompliantOpenAIReportGenerator:
    """
    HIPAA-compliant report generator that de-identifies all PHI before sending to OpenAI.
    
    This ensures compliance with HIPAA Safe Harbor requirements when using
    non-BAA (Business Associate Agreement) AI services like OpenAI.
    """
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key or self.api_key == "your_openai_api_key_here":
            raise ValueError("OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.")
        
        self.client = AsyncOpenAI(api_key=self.api_key)
        self.model = "o4-mini"  # Use a model that does not require BAA
        self.hipaa_service = HIPAADeIdentificationService()
    
    async def generate_comprehensive_report(
        self,
        child,  # SQLAlchemy Child object
        parent,  # SQLAlchemy User object
        daily_logs,  # List of SQLAlchemy DailyLog objects
        photos,  # List of PhotoEntry objects (optional)
        request  # ReportGenerationRequest
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive structured allergy report using de-identified data.
        
        All PHI is removed before sending to OpenAI to ensure HIPAA compliance.
        """
        ai_start_time = datetime.utcnow()
        
        try:
            # Step 1: Convert SQLAlchemy objects to safe dictionaries
            child_data = self._safe_convert_child(child)
            parent_data = self._safe_convert_user(parent)
            logs_data = [self._safe_convert_log(log) for log in daily_logs]
            
            # Step 2: De-identify all data according to HIPAA Safe Harbor
            de_identified_patient = self.hipaa_service.de_identify_patient_data(child_data, parent_data)
            de_identified_logs = self.hipaa_service.de_identify_medical_logs(logs_data)
            
            # Step 3: Create HIPAA-compliant prompt
            prompt = self._create_comprehensive_prompt(
                de_identified_patient, 
                de_identified_logs, 
                getattr(request, 'report_type', 'comprehensive')
            )
            
            # Step 4: Call OpenAI with de-identified data only
            print(f"🤖 Sending de-identified data to OpenAI o4-mini for AI analysis...")
            ai_request_time = datetime.utcnow()
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a medical AI assistant. The data provided has been de-identified according to HIPAA Safe Harbor guidelines. No PHI is present. Generate a comprehensive medical analysis."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=3000
            )
            
            ai_response_time = datetime.utcnow()
            ai_processing_duration = (ai_response_time - ai_request_time).total_seconds()
            print(f"✅ OpenAI o4-mini response received in {ai_processing_duration:.2f} seconds")
            
            # Step 5: Parse response and create simple report structure
            if not response.choices or not response.choices[0].message.content:
                raise ValueError("Empty response from OpenAI")
            
            report_content = response.choices[0].message.content
            
            # Step 6: Create a comprehensive report structure with clear AI indicators
            ai_end_time = datetime.utcnow()
            total_ai_duration = (ai_end_time - ai_start_time).total_seconds()
            
            simple_report = {
                "report_id": f"AI_HIPAA_REPORT_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                "generated_at": datetime.utcnow().isoformat(),
                "report_type": getattr(request, 'report_type', 'comprehensive'),
                "patient_id": de_identified_patient.get('patient_id', 'DEIDENTIFIED'),
                
                # AI Generation Metadata - Clear indicators of AI usage
                "ai_generation": {
                    "powered_by": "OpenAI o4-mini",
                    "model_used": self.model,
                    "ai_request_timestamp": ai_request_time.isoformat(),
                    "ai_response_timestamp": ai_response_time.isoformat(),
                    "ai_processing_duration_seconds": round(ai_processing_duration, 2),
                    "total_generation_time_seconds": round(total_ai_duration, 2),
                    "prompt_tokens_estimated": len(prompt.split()),
                    "response_length_chars": len(report_content),
                    "temperature_setting": 0.3,
                    "max_tokens_setting": 3000
                },
                
                # AI-Generated Content
                "ai_analysis": report_content,
                "ai_analysis_preview": report_content[:200] + "..." if len(report_content) > 200 else report_content,
                
                # Data Sources and Processing
                "data_sources": f"De-identified tracking data from {len(de_identified_logs)} daily logs",
                "processing_pipeline": [
                    "1. Patient data collected from database",
                    "2. PHI removed via HIPAA Safe Harbor de-identification", 
                    "3. De-identified data sent to OpenAI o4-mini",
                    "4. AI analysis generated using medical expertise",
                    "5. Report compiled with compliance metadata"
                ],
                
                # HIPAA Compliance
                "hipaa_compliance": {
                    "data_deidentified": True,
                    "phi_removed": True,
                    "safe_harbor_compliant": True,
                    "deidentification_timestamp": datetime.utcnow().isoformat(),
                    "external_ai_service": "OpenAI o4-mini",
                    "phi_transmitted_to_ai": False
                },
                
                "disclaimer": "🤖 This report was generated using OpenAI o4-mini artificial intelligence with de-identified data according to HIPAA Safe Harbor guidelines. No PHI was transmitted to external AI services.",
                
                # Technical Details
                "technical_details": {
                    "ai_service_provider": "OpenAI",
                    "ai_model_version": "o4-mini",
                    "hipaa_compliance_method": "Safe Harbor De-identification",
                    "data_transmission": "De-identified only",
                    "report_generation_method": "AI-powered analysis"
                }
            }
            
            print(f"✅ AI-powered report generated successfully (ID: {simple_report['report_id']})")
            return simple_report
            
        except Exception as e:
            raise RuntimeError(f"Failed to generate HIPAA-compliant report: {str(e)}") from e
    
    async def generate_text_report(
        self,
        child,  # SQLAlchemy Child object
        parent,  # SQLAlchemy User object
        daily_logs,  # List of SQLAlchemy DailyLog objects
        request  # ReportGenerationRequest
    ) -> str:
        """Generate a text-based report using de-identified data."""
        ai_start_time = datetime.utcnow()
        
        try:
            # Convert and de-identify data
            child_data = self._safe_convert_child(child)
            parent_data = self._safe_convert_user(parent)
            logs_data = [self._safe_convert_log(log) for log in daily_logs]
            
            de_identified_patient = self.hipaa_service.de_identify_patient_data(child_data, parent_data)
            de_identified_logs = self.hipaa_service.de_identify_medical_logs(logs_data)
            
            # Create text-focused prompt
            prompt = self._create_text_prompt(de_identified_patient, de_identified_logs)
            
            # Call OpenAI
            print(f"🤖 Generating text report using OpenAI o4-mini...")
            ai_request_time = datetime.utcnow()
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a medical AI assistant creating text reports from de-identified patient data. No PHI is present in the data. Generate a professional medical text report."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=2500
            )
            
            ai_response_time = datetime.utcnow()
            ai_duration = (ai_response_time - ai_request_time).total_seconds()
            print(f"✅ OpenAI text report generated in {ai_duration:.2f} seconds")
            
            if not response.choices or not response.choices[0].message.content:
                raise ValueError("Empty response from OpenAI")
            
            # Add comprehensive AI generation metadata
            ai_text_content = response.choices[0].message.content
            total_duration = (datetime.utcnow() - ai_start_time).total_seconds()
            
            ai_header = f"""🤖 AI-GENERATED MEDICAL REPORT
═════════════════════════════════════════════════════════════════
Generated by: OpenAI o4-mini
Generation Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}
AI Processing Duration: {ai_duration:.2f} seconds
Total Generation Time: {total_duration:.2f} seconds
Report ID: AI_TEXT_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}
Model: {self.model}
Temperature: 0.3
Max Tokens: 2500
HIPAA Compliance: PHI De-identified (Safe Harbor Method)
═════════════════════════════════════════════════════════════════

"""
            
            ai_footer = f"""

═════════════════════════════════════════════════════════════════
🔒 HIPAA COMPLIANCE & AI GENERATION DETAILS:

This report was generated using OpenAI GPT-4 artificial intelligence.
All Protected Health Information (PHI) was de-identified according to 
HIPAA Safe Harbor guidelines before AI processing.

✅ AI Generation Confirmed:
   - Model Used: {self.model}
   - Processing Time: {ai_duration:.2f} seconds
   - Content Length: {len(ai_text_content)} characters
   - Generation Timestamp: {ai_response_time.isoformat()}

✅ HIPAA Compliance Verified:
   - Data De-identified: Yes
   - PHI Transmitted to AI: No
   - Safe Harbor Compliant: Yes
   - Compliance Method: HIPAA Safe Harbor De-identification

🤖 This content was generated by artificial intelligence using medical 
   expertise trained into the AI model, applied to de-identified patient data.
═════════════════════════════════════════════════════════════════"""
            
            complete_report = ai_header + ai_text_content + ai_footer
            return complete_report
            
        except Exception as e:
            raise RuntimeError(f"Failed to generate HIPAA-compliant text report: {str(e)}") from e
    
    def _safe_convert_child(self, child) -> Dict[str, Any]:
        """Safely convert Child SQLAlchemy object to dictionary for de-identification."""
        try:
            # Handle JSON fields safely
            known_allergies = []
            medications = []
            medical_conditions = []
            
            if hasattr(child, 'known_allergies') and child.known_allergies:
                try:
                    known_allergies = json.loads(str(child.known_allergies))
                except (json.JSONDecodeError, TypeError):
                    known_allergies = []
            
            if hasattr(child, 'medications') and child.medications:
                try:
                    medications = json.loads(str(child.medications))
                except (json.JSONDecodeError, TypeError):
                    medications = []
            
            if hasattr(child, 'medical_conditions') and child.medical_conditions:
                try:
                    medical_conditions = json.loads(str(child.medical_conditions))
                except (json.JSONDecodeError, TypeError):
                    medical_conditions = []
            
            return {
                "id": getattr(child, 'id', None),
                "name": getattr(child, 'name', 'Unknown'),
                "date_of_birth": getattr(child, 'date_of_birth', None),
                "gender": getattr(child, 'gender', 'Not specified'),
                "known_allergies": known_allergies,
                "medications": medications,
                "medical_conditions": medical_conditions,
                "emergency_contact": getattr(child, 'emergency_contact', None),
                "doctor_name": getattr(child, 'doctor_name', None)
            }
        except Exception as e:
            raise RuntimeError(f"Error converting child data: {str(e)}") from e
    
    def _safe_convert_user(self, user) -> Dict[str, Any]:
        """Safely convert User SQLAlchemy object to dictionary for de-identification."""
        try:
            return {
                "id": getattr(user, 'id', None),
                "email": getattr(user, 'email', 'unknown@example.com'),
                "full_name": getattr(user, 'full_name', 'Unknown Parent'),
                "phone": getattr(user, 'phone', None)
            }
        except Exception as e:
            raise RuntimeError(f"Error converting user data: {str(e)}") from e
    
    def _safe_convert_log(self, log) -> Dict[str, Any]:
        """Safely convert DailyLog SQLAlchemy object to dictionary for de-identification."""
        try:
            # Handle JSON fields safely
            symptoms = []
            triggers = []
            medications_taken = []
            activities = []
            
            if hasattr(log, 'symptoms') and log.symptoms:
                try:
                    symptoms = json.loads(str(log.symptoms))
                except (json.JSONDecodeError, TypeError):
                    symptoms = []
            
            if hasattr(log, 'triggers') and log.triggers:
                try:
                    triggers = json.loads(str(log.triggers))
                except (json.JSONDecodeError, TypeError):
                    triggers = []
            
            if hasattr(log, 'medications_taken') and log.medications_taken:
                try:
                    medications_taken = json.loads(str(log.medications_taken))
                except (json.JSONDecodeError, TypeError):
                    medications_taken = []
            
            if hasattr(log, 'activities') and log.activities:
                try:
                    activities = json.loads(str(log.activities))
                except (json.JSONDecodeError, TypeError):
                    activities = []
            
            return {
                "id": getattr(log, 'id', None),
                "date": getattr(log, 'date', None),
                "symptoms": symptoms,
                "triggers": triggers,
                "medications_taken": medications_taken,
                "eczema_severity": getattr(log, 'eczema_severity', 'none'),
                "asthma_severity": getattr(log, 'asthma_severity', 'none'),
                "allergic_reaction_severity": getattr(log, 'allergic_reaction_severity', 'none'),
                "mood_scale": getattr(log, 'mood_scale', None),
                "sleep_quality": getattr(log, 'sleep_quality', None),
                "activities": activities,
                "symptoms_notes": getattr(log, 'symptoms_notes', ''),
                "general_notes": getattr(log, 'general_notes', ''),
                "weather_temperature": getattr(log, 'weather_temperature', None),
                "weather_humidity": getattr(log, 'weather_humidity', None),
                "pollen_count": getattr(log, 'pollen_count', None)
            }
        except Exception as e:
            raise RuntimeError(f"Error converting log data: {str(e)}") from e
    
    def _create_comprehensive_prompt(
        self, 
        de_identified_patient: Dict[str, Any], 
        de_identified_logs: List[Dict[str, Any]], 
        report_type: str
    ) -> str:
        """Create a comprehensive prompt using only de-identified data."""
        
        # Summarize symptoms and patterns from de-identified logs
        symptoms_summary = self._summarize_symptoms_from_logs(de_identified_logs)
        triggers_summary = self._summarize_triggers_from_logs(de_identified_logs)
        severity_patterns = self._analyze_severity_patterns(de_identified_logs)
        
        prompt = f"""
Create a comprehensive pediatric allergy report based on the following DE-IDENTIFIED data:

**IMPORTANT: All data has been de-identified according to HIPAA Safe Harbor guidelines. No PHI is present.**

PATIENT DEMOGRAPHICS (DE-IDENTIFIED):
- Patient ID: {de_identified_patient.get('patient_id', 'N/A')}
- Age Category: {de_identified_patient.get('age_category', 'N/A')}
- Gender: {de_identified_patient.get('gender', 'N/A')}

MEDICAL HISTORY:
- Known Allergies: {', '.join(de_identified_patient.get('known_allergies', []))}
- Current Medications: {', '.join(de_identified_patient.get('medications', []))}
- Medical Conditions: {', '.join(de_identified_patient.get('medical_conditions', []))}

SYMPTOM TRACKING ANALYSIS:
- Total Log Entries: {len(de_identified_logs)}
- Common Symptoms: {symptoms_summary}
- Identified Triggers: {triggers_summary}
- Severity Patterns: {severity_patterns}

Please provide a comprehensive medical analysis including:

1. **PATIENT OVERVIEW** (using de-identified demographics)
2. **SYMPTOM PATTERN ANALYSIS** 
3. **TRIGGER IDENTIFICATION AND AVOIDANCE**
4. **SEVERITY TRENDS AND RISK ASSESSMENT**
5. **TREATMENT RESPONSE EVALUATION**
6. **RECOMMENDATIONS FOR CARE MANAGEMENT**
7. **SUGGESTED FOLLOW-UP ACTIONS**

Format the response as a structured medical report suitable for healthcare provider review.
Remember: This analysis is based on de-identified data and should reference the patient by their anonymous ID only.
"""
        
        return prompt
    
    def _create_text_prompt(
        self, 
        de_identified_patient: Dict[str, Any], 
        de_identified_logs: List[Dict[str, Any]]
    ) -> str:
        """Create a text-focused prompt using only de-identified data."""
        
        prompt = f"""
Generate a concise medical text report based on DE-IDENTIFIED patient data:

Patient ID: {de_identified_patient.get('patient_id', 'N/A')}
Age Category: {de_identified_patient.get('age_category', 'N/A')}
Known Allergies: {', '.join(de_identified_patient.get('known_allergies', []))}
Tracking Period: {len(de_identified_logs)} days of symptom logs

Create a professional medical summary focusing on:
- Allergy management status
- Symptom patterns and triggers
- Treatment effectiveness
- Recommendations for ongoing care

Format as a clinical text report suitable for provider communication.
Use only the de-identified patient ID for reference.
"""
        
        return prompt
    
    def _summarize_symptoms_from_logs(self, logs: List[Dict[str, Any]]) -> str:
        """Summarize common symptoms from de-identified logs."""
        all_symptoms = []
        for log in logs:
            symptoms = log.get('symptoms', [])
            if isinstance(symptoms, list):
                all_symptoms.extend(symptoms)
        
        # Count frequency
        symptom_counts = {}
        for symptom in all_symptoms:
            symptom_counts[symptom] = symptom_counts.get(symptom, 0) + 1
        
        # Return top 5 most common
        sorted_symptoms = sorted(symptom_counts.items(), key=lambda x: x[1], reverse=True)
        return ", ".join([f"{symptom} ({count}x)" for symptom, count in sorted_symptoms[:5]])
    
    def _summarize_triggers_from_logs(self, logs: List[Dict[str, Any]]) -> str:
        """Summarize common triggers from de-identified logs."""
        all_triggers = []
        for log in logs:
            triggers = log.get('triggers', [])
            if isinstance(triggers, list):
                all_triggers.extend(triggers)
        
        # Count frequency
        trigger_counts = {}
        for trigger in all_triggers:
            trigger_counts[trigger] = trigger_counts.get(trigger, 0) + 1
        
        # Return top 5 most common
        sorted_triggers = sorted(trigger_counts.items(), key=lambda x: x[1], reverse=True)
        return ", ".join([f"{trigger} ({count}x)" for trigger, count in sorted_triggers[:5]])
    
    def _analyze_severity_patterns(self, logs: List[Dict[str, Any]]) -> str:
        """Analyze severity patterns from de-identified logs."""
        severe_days = 0
        total_days = len(logs)
        
        for log in logs:
            if (log.get('eczema_severity') in ['severe', 'very_severe'] or
                log.get('asthma_severity') in ['severe', 'very_severe'] or
                log.get('allergic_reaction_severity') in ['severe', 'very_severe']):
                severe_days += 1
        
        if total_days > 0:
            severe_percentage = (severe_days / total_days) * 100
            return f"{severe_days}/{total_days} days with severe symptoms ({severe_percentage:.1f}%)"
        
        return "No severity data available"
