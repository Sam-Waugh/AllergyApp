"""
HIPAA-Compliant OpenAI Report Generation Service

This service integrates with the HIPAA de-identification service to ensure
that no Protected Health Information (PHI) is sent to OpenAI. All data is
de-identified according to HIPAA Safe Harbor guidelines before being processed.
"""

import os
import json
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from openai import AsyncOpenAI

from models.models import User, Child, DailyLog, PhotoEntry
from schemas.schemas import (
    ReportGenerationRequest,
    GeneratedReport,
    PatientDetails,
    MedicalHistory,
    ReactionSummary,
    AllergyInfo,
    ManagementPlan,
    PlannedAppointment
)
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
        child: Child,
        parent: User,
        daily_logs: List[DailyLog],
        photos: List[PhotoEntry],
        request: ReportGenerationRequest
    ) -> GeneratedReport:
        """
        Generate a comprehensive structured allergy report using de-identified data.
        
        All PHI is removed before sending to OpenAI to ensure HIPAA compliance.
        """
        try:
            # Step 1: Convert SQLAlchemy objects to dictionaries for de-identification
            child_data = self._convert_child_to_dict(child)
            parent_data = self._convert_user_to_dict(parent)
            logs_data = [self._convert_log_to_dict(log) for log in daily_logs]
            
            # Step 2: De-identify all data according to HIPAA Safe Harbor
            de_identified_patient = self.hipaa_service.de_identify_patient_data(child_data, parent_data)
            de_identified_logs = self.hipaa_service.de_identify_medical_logs(logs_data)
            
            # Step 3: Create HIPAA-compliant prompt
            prompt = self._create_hipaa_compliant_comprehensive_prompt(
                de_identified_patient, 
                de_identified_logs, 
                request.report_type
            )
            
            # Step 4: Call OpenAI with de-identified data only
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a medical AI assistant. The data provided has been de-identified according to HIPAA Safe Harbor guidelines. No PHI is present."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=3000
            )
            
            # Step 5: Parse response and create structured report
            if not response.choices or not response.choices[0].message.content:
                raise ValueError("Empty response from OpenAI")
            
            report_content = response.choices[0].message.content
            
            # Step 6: Create structured report object (using de-identified data)
            structured_report = self._create_structured_report_from_ai_response(
                report_content, 
                de_identified_patient,
                de_identified_logs
            )
            
            return structured_report
            
        except Exception as e:
            raise Exception(f"Failed to generate HIPAA-compliant report: {str(e)}")
    
    async def generate_text_report(
        self,
        child: Child,
        parent: User,
        daily_logs: List[DailyLog],
        request: ReportGenerationRequest
    ) -> str:
        """Generate a text-based report using de-identified data."""
        try:
            # Convert and de-identify data
            child_data = self._convert_child_to_dict(child)
            parent_data = self._convert_user_to_dict(parent)
            logs_data = [self._convert_log_to_dict(log) for log in daily_logs]
            
            de_identified_patient = self.hipaa_service.de_identify_patient_data(child_data, parent_data)
            de_identified_logs = self.hipaa_service.de_identify_medical_logs(logs_data)
            
            # Create text-focused prompt
            prompt = self._create_hipaa_compliant_text_prompt(de_identified_patient, de_identified_logs)
            
            # Call OpenAI
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a medical AI assistant creating text reports from de-identified patient data. No PHI is present in the data."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=2500
            )
            
            if not response.choices or not response.choices[0].message.content:
                raise ValueError("Empty response from OpenAI")
            
            return response.choices[0].message.content
            
        except Exception as e:
            raise Exception(f"Failed to generate HIPAA-compliant text report: {str(e)}")
    
    def _convert_child_to_dict(self, child: Child) -> Dict[str, Any]:
        """Convert Child SQLAlchemy object to dictionary for de-identification."""
        # Access the actual values from SQLAlchemy columns
        return {
            "id": child.id,
            "name": child.name,
            "date_of_birth": child.date_of_birth,
            "gender": child.gender,
            "known_allergies": json.loads(child.known_allergies or "[]"),
            "medications": json.loads(child.medications or "[]"),
            "medical_conditions": json.loads(child.medical_conditions or "[]"),
            "emergency_contact": child.emergency_contact,
            "doctor_name": child.doctor_name,
            "doctor_phone": getattr(child, 'doctor_phone', None) or getattr(child, 'doctor_contact', None)
        }
    
    def _convert_user_to_dict(self, user: User) -> Dict[str, Any]:
        """Convert User SQLAlchemy object to dictionary for de-identification."""
        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone
        }
    
    def _convert_log_to_dict(self, log: DailyLog) -> Dict[str, Any]:
        """Convert DailyLog SQLAlchemy object to dictionary for de-identification."""
        return {
            "id": log.id,
            "date": log.date,
            "symptoms": json.loads(log.symptoms) if log.symptoms else [],
            "triggers": json.loads(log.triggers) if log.triggers else [],
            "medications_taken": json.loads(log.medications_taken) if log.medications_taken else [],
            "eczema_severity": log.eczema_severity,
            "asthma_severity": log.asthma_severity,
            "allergic_reaction_severity": log.allergic_reaction_severity,
            "mood_scale": log.mood_scale,
            "sleep_quality": log.sleep_quality,
            "activities": json.loads(log.activities) if log.activities else [],
            "symptoms_notes": log.symptoms_notes,
            "general_notes": log.general_notes,
            "weather_temperature": log.weather_temperature,
            "weather_humidity": log.weather_humidity,
            "pollen_count": log.pollen_count
        }
    
    def _create_hipaa_compliant_comprehensive_prompt(
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
    
    def _create_hipaa_compliant_text_prompt(
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
    
    def _create_structured_report_from_ai_response(
        self, 
        ai_response: str, 
        de_identified_patient: Dict[str, Any],
        de_identified_logs: List[Dict[str, Any]]
    ) -> GeneratedReport:
        """Create a structured GeneratedReport object from AI response and de-identified data."""
        
        # Create patient details using de-identified data
        patient_details = PatientDetails(
            patient_id=de_identified_patient.get('patient_id', 'Unknown'),
            age_category=de_identified_patient.get('age_category', 'Unknown'),
            gender=de_identified_patient.get('gender', 'Not specified'),
            report_date=datetime.utcnow().strftime('%Y-%m-%d'),
            reporting_period=f"{len(de_identified_logs)} days of tracking data"
        )
        
        # Create basic medical history from de-identified data
        medical_history = MedicalHistory(
            known_allergies=de_identified_patient.get('known_allergies', []),
            current_medications=de_identified_patient.get('medications', []),
            medical_conditions=de_identified_patient.get('medical_conditions', []),
            family_history=["De-identified - family history patterns noted in analysis"]
        )
        
        # Create basic reaction summary
        reaction_summary = ReactionSummary(
            total_reactions=len([log for log in de_identified_logs if log.get('has_reaction', False)]),
            severe_reactions=len([log for log in de_identified_logs 
                                if log.get('allergic_reaction_severity') in ['severe', 'very_severe']]),
            most_recent_reaction=f"Within tracking period (de-identified timeline)",
            common_triggers=list(set([trigger for log in de_identified_logs 
                                    for trigger in log.get('triggers', [])]))[:5]
        )
        
        # Create basic allergy info
        allergy_info = AllergyInfo(
            diagnosed_allergies=de_identified_patient.get('known_allergies', []),
            suspected_allergies=["Additional triggers identified in tracking period"],
            testing_results=["De-identified - testing history available in full medical record"],
            allergies_in_treatment=de_identified_patient.get('medications', [])
        )
        
        # Create basic management plan
        management_plan = ManagementPlan(
            current_treatments=de_identified_patient.get('medications', []),
            avoidance_strategies=["Based on identified trigger patterns"],
            emergency_plan=["Standard allergy emergency protocols"],
            lifestyle_modifications=["Recommendations based on tracking data patterns"]
        )
        
        # Create basic planned appointments
        planned_appointments = [
            PlannedAppointment(
                appointment_type="Follow-up consultation",
                purpose="Review tracking data and adjust treatment plan",
                timeframe="As recommended by healthcare provider",
                priority="routine"
            )
        ]
        
        return GeneratedReport(
            report_id=str(uuid.uuid4()),
            generated_at=datetime.utcnow(),
            patient_details=patient_details,
            medical_history=medical_history,
            reaction_summary=reaction_summary,
            allergy_info=allergy_info,
            management_plan=management_plan,
            planned_appointments=planned_appointments,
            ai_analysis=ai_response,
            data_sources=f"De-identified tracking data from {len(de_identified_logs)} daily logs",
            disclaimer="This report was generated using de-identified data according to HIPAA Safe Harbor guidelines. No PHI was transmitted to external AI services."
        )
