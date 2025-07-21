import os
import json
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import openai
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

class OpenAIReportGenerator:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key or self.api_key == "your_openai_api_key_here":
            raise ValueError("OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.")
        
        self.client = AsyncOpenAI(api_key=self.api_key)
        self.model = "o4-mini"  # Use GPT-4 for better medical report generation
        self.hipaa_service = HIPAADeIdentificationService()  # Initialize HIPAA de-identification service
    
    async def generate_comprehensive_report(
        self,
        child: Child,
        parent: User,
        daily_logs: List[DailyLog],
        photos: List[PhotoEntry],
        request: ReportGenerationRequest
    ) -> GeneratedReport:
        """Generate a comprehensive structured allergy report."""
        
        # Prepare data for analysis
        patient_data = self._prepare_patient_data(child, parent)
        medical_data = self._prepare_medical_data(daily_logs)
        
        # Create OpenAI prompt
        prompt = self._create_comprehensive_prompt(patient_data, medical_data, request.report_type)
        
        try:
            # Call OpenAI API
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """You are a medical AI assistant specializing in pediatric allergy and immunology. 
                        Generate comprehensive, accurate, and well-structured allergy reports for healthcare providers. 
                        Prioritize serious reactions and provide clear, actionable information. 
                        Use medical terminology appropriately while ensuring clarity."""
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=4000,
                temperature=0.3,  # Lower temperature for more consistent medical reports
                response_format={"type": "json_object"}
            )
            
            # Parse the response
            report_data = json.loads(response.choices[0].message.content)
            
            # Convert to structured format
            return self._convert_to_structured_report(report_data, child, parent)
            
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")
    
    async def generate_text_report(
        self,
        child: Child,
        parent: User,
        daily_logs: List[DailyLog],
        request: ReportGenerationRequest
    ) -> str:
        """Generate a text-based allergy report."""
        
        # Prepare data for analysis
        patient_data = self._prepare_patient_data(child, parent)
        medical_data = self._prepare_medical_data(daily_logs)
        
        # Create text report prompt
        prompt = self._create_text_report_prompt(patient_data, medical_data)
        
        try:
            # Call OpenAI API
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """You are a medical AI assistant specializing in pediatric allergy reports. 
                        Generate clear, structured text reports that healthcare providers can easily read and understand. 
                        Prioritize serious reactions and provide actionable recommendations."""
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=3000,
                temperature=0.3
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")
    
    def _prepare_patient_data(self, child: Child, parent: User) -> Dict[str, Any]:
        """Prepare patient information for the report."""
        birth_date = child.date_of_birth
        today = datetime.now()
        age_months = (today.year - birth_date.year) * 12 + today.month - birth_date.month
        
        return {
            "name": child.name,
            "date_of_birth": birth_date.strftime("%Y-%m-%d"),
            "age_months": age_months,
            "age_display": f"{age_months // 12} years, {age_months % 12} months" if age_months >= 12 else f"{age_months} months",
            "gender": child.gender,
            "parent_name": parent.full_name,
            "parent_email": parent.email,
            "emergency_contact": child.emergency_contact,
            "doctor_name": child.doctor_name,
            "doctor_contact": child.doctor_contact,
            "known_allergies": json.loads(child.known_allergies) if child.known_allergies else [],
            "medications": json.loads(child.medications) if child.medications else [],
            "medical_conditions": json.loads(child.medical_conditions) if child.medical_conditions else []
        }
    
    def _prepare_medical_data(self, daily_logs: List[DailyLog]) -> Dict[str, Any]:
        """Prepare medical history and symptom data for analysis."""
        reactions = []
        all_symptoms = []
        all_triggers = []
        medications_taken = []
        
        for log in daily_logs:
            # Parse symptoms
            symptoms = []
            if log.symptoms:
                if isinstance(log.symptoms, str):
                    symptoms = json.loads(log.symptoms) if log.symptoms else []
                else:
                    symptoms = log.symptoms or []
            
            # Parse triggers
            triggers = []
            if log.triggers:
                if isinstance(log.triggers, str):
                    triggers = json.loads(log.triggers) if log.triggers else []
                else:
                    triggers = log.triggers or []
            
            # Parse medications
            medications = []
            if log.medications_taken:
                if isinstance(log.medications_taken, str):
                    medications = json.loads(log.medications_taken) if log.medications_taken else []
                else:
                    medications = log.medications_taken or []
            
            # Determine severity level
            severity_indicators = [
                log.eczema_severity or "none",
                log.asthma_severity or "none", 
                log.allergic_reaction_severity or "none"
            ]
            
            max_severity = "mild"
            if any(s in ["severe", "very_severe"] for s in severity_indicators):
                max_severity = "severe"
            elif any(s == "moderate" for s in severity_indicators):
                max_severity = "moderate"
            
            if symptoms or triggers or max_severity != "mild":
                reactions.append({
                    "date": log.date.strftime("%Y-%m-%d"),
                    "symptoms": symptoms,
                    "severity": max_severity,
                    "triggers": triggers,
                    "medications_given": medications,
                    "notes": (log.symptoms_notes or "") + " " + (log.trigger_notes or "") + " " + (log.general_notes or ""),
                    "mood": log.overall_mood,
                    "weather_conditions": log.weather_conditions,
                    "pollen_count": log.pollen_count
                })
            
            all_symptoms.extend(symptoms)
            all_triggers.extend(triggers)
            medications_taken.extend(medications)
        
        return {
            "total_log_entries": len(daily_logs),
            "date_range": {
                "start": daily_logs[-1].date.strftime("%Y-%m-%d") if daily_logs else None,
                "end": daily_logs[0].date.strftime("%Y-%m-%d") if daily_logs else None
            },
            "reactions": reactions,
            "unique_symptoms": list(set(all_symptoms)),
            "unique_triggers": list(set(all_triggers)),
            "medications_used": list(set(medications_taken)),
            "severe_reactions": [r for r in reactions if r["severity"] == "severe"]
        }
    
    def _create_comprehensive_prompt(self, patient_data: Dict, medical_data: Dict, report_type: str) -> str:
        """Create a comprehensive prompt for OpenAI to generate structured report."""
        
        return f"""
Generate a comprehensive pediatric allergy report based on the following patient data. Return the response as a JSON object with the specified structure.

PATIENT INFORMATION:
- Name: {patient_data['name']}
- Age: {patient_data['age_display']}
- Date of Birth: {patient_data['date_of_birth']}
- Gender: {patient_data['gender']}
- Parent: {patient_data['parent_name']} ({patient_data['parent_email']})
- Emergency Contact: {patient_data.get('emergency_contact', 'Not provided')}
- Primary Doctor: {patient_data.get('doctor_name', 'Not provided')}

KNOWN MEDICAL HISTORY:
- Known Allergies: {', '.join(patient_data['known_allergies']) if patient_data['known_allergies'] else 'None documented'}
- Current Medications: {', '.join(patient_data['medications']) if patient_data['medications'] else 'None'}
- Medical Conditions: {', '.join(patient_data['medical_conditions']) if patient_data['medical_conditions'] else 'None documented'}

SYMPTOM TRACKING DATA ({medical_data['total_log_entries']} entries from {medical_data['date_range']['start']} to {medical_data['date_range']['end']}):

SEVERE REACTIONS (PRIORITY):
{json.dumps(medical_data['severe_reactions'], indent=2) if medical_data['severe_reactions'] else 'No severe reactions documented'}

ALL DOCUMENTED REACTIONS:
{json.dumps(medical_data['reactions'][:10], indent=2) if medical_data['reactions'] else 'No reactions documented'}

SYMPTOM PATTERNS:
- All documented symptoms: {', '.join(medical_data['unique_symptoms']) if medical_data['unique_symptoms'] else 'None'}
- All documented triggers: {', '.join(medical_data['unique_triggers']) if medical_data['unique_triggers'] else 'None'}
- Medications used: {', '.join(medical_data['medications_used']) if medical_data['medications_used'] else 'None'}

INSTRUCTIONS:
Generate a comprehensive medical report as a JSON object with this exact structure:

{{
  "summary": "A concise 2-3 sentence summary prioritizing serious reactions and key findings",
  "priority_concerns": ["List of immediate concerns requiring medical attention"],
  "reaction_history": [
    {{
      "date": "YYYY-MM-DD",
      "symptoms": ["list of symptoms"],
      "severity_level": "mild/moderate/severe",
      "triggers": ["list of triggers"],
      "treatments_given": ["medications or treatments"],
      "notes": "Additional observations"
    }}
  ],
  "allergy_testing": ["List any allergy testing mentioned or needed"],
  "diagnosed_allergies": [
    {{
      "allergen": "name of allergen",
      "status": "diagnosed",
      "severity": "mild/moderate/severe",
      "last_reaction_date": "YYYY-MM-DD or null",
      "in_treatment": true/false,
      "avoidance_measures": ["specific measures being taken"]
    }}
  ],
  "suspected_allergies": [
    {{
      "allergen": "suspected allergen based on patterns",
      "status": "suspected",
      "severity": "estimated severity",
      "evidence": "reasoning for suspicion"
    }}
  ],
  "allergies_in_treatment": [
    {{
      "allergen": "allergen being treated",
      "treatment_type": "type of treatment",
      "effectiveness": "assessment of current treatment"
    }}
  ],
  "current_management_plan": {{
    "emergency_action_plan": "Current emergency procedures if any",
    "daily_medications": ["regular medications"],
    "rescue_medications": ["emergency medications"],
    "environmental_controls": ["environmental modifications"],
    "dietary_restrictions": ["food restrictions if any"],
    "follow_up_recommendations": ["recommended follow-up care"]
  }},
  "planned_appointments": [
    {{
      "appointment_type": "type of appointment",
      "provider": "healthcare provider type",
      "purpose": "reason for appointment",
      "urgency": "routine/urgent/emergency",
      "notes": "additional notes"
    }}
  ],
  "recommendations": ["Specific actionable recommendations for parents and healthcare providers"]
}}

Focus on:
1. Prioritizing serious reactions and safety concerns
2. Identifying patterns in symptoms and triggers  
3. Clear, actionable recommendations
4. Professional medical language appropriate for healthcare providers
5. Evidence-based conclusions from the tracking data
"""
    
    def _create_text_report_prompt(self, patient_data: Dict, medical_data: Dict) -> str:
        """Create a prompt for generating a text-based report."""
        
        return f"""
Generate a clear, structured pediatric allergy report for healthcare providers based on the following data:

PATIENT: {patient_data['name']}, {patient_data['age_display']}, {patient_data['gender']}
PARENT: {patient_data['parent_name']} ({patient_data['parent_email']})
TRACKING PERIOD: {medical_data['date_range']['start']} to {medical_data['date_range']['end']} ({medical_data['total_log_entries']} entries)

MEDICAL HISTORY:
- Known Allergies: {', '.join(patient_data['known_allergies']) if patient_data['known_allergies'] else 'None documented'}
- Current Medications: {', '.join(patient_data['medications']) if patient_data['medications'] else 'None'}
- Conditions: {', '.join(patient_data['medical_conditions']) if patient_data['medical_conditions'] else 'None'}

SEVERE REACTIONS: {len(medical_data['severe_reactions'])} documented
{json.dumps(medical_data['severe_reactions'], indent=2) if medical_data['severe_reactions'] else 'None'}

SYMPTOM PATTERNS:
- Symptoms: {', '.join(medical_data['unique_symptoms']) if medical_data['unique_symptoms'] else 'None'}
- Triggers: {', '.join(medical_data['unique_triggers']) if medical_data['unique_triggers'] else 'None'}

Generate a report with these sections:
1. PATIENT DETAILS
2. MEDICAL HISTORY  
3. REACTION HISTORY (prioritize serious reactions)
4. ALLERGY TESTING (recommended or completed)
5. DIAGNOSED ALLERGIES
6. SUSPECTED ALLERGIES  
7. ALLERGIES IN TREATMENT
8. CURRENT MANAGEMENT PLAN
9. PLANNED APPOINTMENTS
10. SUMMARY & RECOMMENDATIONS

Make it clear, concise, and actionable for healthcare providers.
"""
    
    def _convert_to_structured_report(self, report_data: Dict, child: Child, parent: User) -> GeneratedReport:
        """Convert OpenAI response to structured report format."""
        
        # Calculate age
        birth_date = child.date_of_birth
        today = datetime.now()
        age_months = (today.year - birth_date.year) * 12 + today.month - birth_date.month
        
        # Create patient details
        patient_details = PatientDetails(
            name=child.name,
            date_of_birth=child.date_of_birth,
            age_months=age_months,
            gender=child.gender,
            emergency_contact=child.emergency_contact,
            parent_name=parent.full_name,
            parent_email=parent.email
        )
        
        # Create medical history
        medical_history = MedicalHistory(
            known_allergies=json.loads(child.known_allergies) if child.known_allergies else [],
            medications=json.loads(child.medications) if child.medications else [],
            medical_conditions=json.loads(child.medical_conditions) if child.medical_conditions else [],
            doctor_name=child.doctor_name,
            doctor_contact=child.doctor_contact
        )
        
        # Convert reaction history
        reaction_history = []
        for reaction in report_data.get("reaction_history", []):
            reaction_history.append(ReactionSummary(
                date=datetime.strptime(reaction["date"], "%Y-%m-%d"),
                symptoms=reaction.get("symptoms", []),
                severity_level=reaction.get("severity_level", "mild"),
                triggers=reaction.get("triggers", []),
                treatments_given=reaction.get("treatments_given", []),
                notes=reaction.get("notes", "")
            ))
        
        # Convert allergy info
        diagnosed_allergies = []
        for allergy in report_data.get("diagnosed_allergies", []):
            diagnosed_allergies.append(AllergyInfo(
                allergen=allergy["allergen"],
                status="diagnosed",
                severity=allergy.get("severity", "unknown"),
                last_reaction_date=datetime.strptime(allergy["last_reaction_date"], "%Y-%m-%d") if allergy.get("last_reaction_date") else None,
                in_treatment=allergy.get("in_treatment", False),
                avoidance_measures=allergy.get("avoidance_measures", [])
            ))
        
        suspected_allergies = []
        for allergy in report_data.get("suspected_allergies", []):
            suspected_allergies.append(AllergyInfo(
                allergen=allergy["allergen"],
                status="suspected",
                severity=allergy.get("severity", "unknown"),
                avoidance_measures=allergy.get("avoidance_measures", [])
            ))
        
        allergies_in_treatment = []
        for allergy in report_data.get("allergies_in_treatment", []):
            allergies_in_treatment.append(AllergyInfo(
                allergen=allergy["allergen"],
                status="in_treatment",
                severity=allergy.get("severity", "unknown"),
                in_treatment=True,
                avoidance_measures=allergy.get("avoidance_measures", [])
            ))
        
        # Create management plan
        mgmt_plan_data = report_data.get("current_management_plan", {})
        management_plan = ManagementPlan(
            emergency_action_plan=mgmt_plan_data.get("emergency_action_plan", ""),
            daily_medications=mgmt_plan_data.get("daily_medications", []),
            rescue_medications=mgmt_plan_data.get("rescue_medications", []),
            environmental_controls=mgmt_plan_data.get("environmental_controls", []),
            dietary_restrictions=mgmt_plan_data.get("dietary_restrictions", []),
            follow_up_recommendations=mgmt_plan_data.get("follow_up_recommendations", [])
        )
        
        # Create planned appointments
        planned_appointments = []
        for appt in report_data.get("planned_appointments", []):
            planned_appointments.append(PlannedAppointment(
                appointment_type=appt.get("appointment_type", ""),
                provider=appt.get("provider", ""),
                purpose=appt.get("purpose", ""),
                notes=appt.get("notes", "")
            ))
        
        # Create the final report
        return GeneratedReport(
            report_id=str(uuid.uuid4()),
            generated_at=datetime.utcnow(),
            report_type="comprehensive",
            patient_details=patient_details,
            medical_history=medical_history,
            reaction_history=reaction_history,
            allergy_testing=report_data.get("allergy_testing", []),
            diagnosed_allergies=diagnosed_allergies,
            suspected_allergies=suspected_allergies,
            allergies_in_treatment=allergies_in_treatment,
            current_management_plan=management_plan,
            planned_appointments=planned_appointments,
            summary=report_data.get("summary", ""),
            recommendations=report_data.get("recommendations", []),
            priority_concerns=report_data.get("priority_concerns", [])
        )
