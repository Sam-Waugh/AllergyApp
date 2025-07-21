"""
HIPAA De-identification Service

This service implements HIPAA Safe Harbor de-identification methods to remove
Protected Health Information (PHI) before sending data to OpenAI or other 
non-HIPAA compliant services.

Reference: https://www.hipaajournal.com/de-identification-protected-health-information/
HIPAA Safe Harbor Method: 45 CFR 164.514(b)(2)
"""

import re
import hashlib
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import json
from dataclasses import dataclass

@dataclass
class DeIdentificationMapping:
    """Stores mappings between original and de-identified values for potential re-identification"""
    original_id: str
    deidentified_id: str
    field_type: str
    created_at: datetime

class HIPAADeIdentificationService:
    """
    De-identifies PHI according to HIPAA Safe Harbor guidelines.
    
    HIPAA Safe Harbor requires removal of 18 identifiers:
    1. Names
    2. Geographic subdivisions smaller than state
    3. Dates (except year) related to individual
    4. Telephone numbers
    5. Vehicle identifiers and serial numbers
    6. Fax numbers
    7. Device identifiers and serial numbers
    8. Email addresses
    9. Web URLs
    10. Social security numbers
    11. IP address numbers
    12. Medical record numbers
    13. Biometric identifiers
    14. Health plan beneficiary numbers
    15. Full-face photographs
    16. Account numbers
    17. Certificate/license numbers
    18. Any other unique identifying characteristic
    """
    
    def __init__(self):
        self.mapping_store: Dict[str, DeIdentificationMapping] = {}
        
        # Common first names for replacement (gender-neutral)
        self.replacement_names = [
            "Alex", "Jordan", "Casey", "Taylor", "Morgan", "Riley", "Quinn", 
            "Avery", "Parker", "Sage", "River", "Sky", "Drew", "Emery"
        ]
        
        # Geographic replacements (state level only)
        self.state_replacements = {
            "NY": "Northeast State", "CA": "West Coast State", "TX": "Southern State",
            "FL": "Southeast State", "IL": "Midwest State", "PA": "Northeast State"
        }
    
    def de_identify_patient_data(self, child_data: Dict, parent_data: Dict) -> Dict[str, Any]:
        """
        De-identify patient and parent information according to HIPAA Safe Harbor.
        
        Args:
            child_data: Original child information
            parent_data: Original parent information
            
        Returns:
            De-identified data suitable for external AI processing
        """
        
        # Generate consistent anonymous IDs
        child_hash = self._generate_consistent_hash(str(child_data.get('id', '')))
        parent_hash = self._generate_consistent_hash(str(parent_data.get('id', '')))
        
        # Calculate age in general terms (HIPAA allows ages, but be careful with dates)
        birth_date = child_data.get('date_of_birth')
        age_category = self._categorize_age(birth_date) if birth_date else "Unknown"
        
        de_identified = {
            "patient_id": f"PATIENT_{child_hash[:8]}",
            "parent_id": f"PARENT_{parent_hash[:8]}",
            
            # Demographics (general categories only)
            "age_category": age_category,  # e.g., "Toddler (1-3 years)", "Preschool (3-5 years)"
            "gender": child_data.get('gender', 'Not specified'),  # Gender is generally allowable
            
            # Remove all names, contacts, and identifying information
            "patient_name": self._get_replacement_name(child_hash),
            "parent_name": self._get_replacement_name(parent_hash),
            
            # Medical history (conditions only, no identifying details)
            "known_allergies": self._sanitize_medical_list(child_data.get('known_allergies', [])),
            "medications": self._sanitize_medical_list(child_data.get('medications', [])),
            "medical_conditions": self._sanitize_medical_list(child_data.get('medical_conditions', [])),
            
            # Geographic information (state level only)
            "general_location": "United States",  # No city/zip codes
            
            # Temporal information (relative dates only, no specific dates)
            "data_collection_period": "Recent 3-month period",
            "report_generated": "Current timeframe"
        }
        
        # Store mapping for audit trail (if needed for re-identification)
        self._store_mapping(child_data.get('id'), de_identified['patient_id'], 'patient_id')
        self._store_mapping(parent_data.get('id'), de_identified['parent_id'], 'parent_id')
        
        return de_identified
    
    def de_identify_medical_logs(self, daily_logs: List[Dict]) -> List[Dict]:
        """
        De-identify daily medical logs, removing dates and other identifiers.
        
        Args:
            daily_logs: List of daily log entries
            
        Returns:
            De-identified log entries with relative timing and sanitized content
        """
        
        if not daily_logs:
            return []
        
        # Sort logs by date for relative timing
        sorted_logs = sorted(daily_logs, key=lambda x: x.get('date', datetime.min))
        
        de_identified_logs = []
        
        for i, log in enumerate(sorted_logs):
            # Convert absolute dates to relative timing
            relative_day = f"Day {i + 1}"  # Day 1, Day 2, etc.
            
            # Remove specific dates, keep only patterns
            de_identified_log = {
                "log_id": f"LOG_{self._generate_consistent_hash(str(log.get('id', i)))[:8]}",
                "relative_timepoint": relative_day,
                "time_period": self._get_time_period(log.get('date')),  # "Morning", "Afternoon", etc.
                
                # Symptoms (medical terms are generally OK)
                "symptoms": self._sanitize_symptoms(log.get('symptoms', [])),
                "symptom_severity": self._sanitize_severity_data(log.get('symptom_severity', {})),
                
                # Environmental triggers (remove location-specific data)
                "triggers": self._sanitize_triggers(log.get('triggers', [])),
                "environmental_factors": self._sanitize_environmental_data(log),
                
                # Treatments and medications (generic names only)
                "treatments": self._sanitize_medical_list(log.get('medications_taken', [])),
                
                # General wellness indicators
                "mood_scale": log.get('mood_scale'),
                "sleep_quality": log.get('sleep_quality'),
                "activity_level": self._categorize_activity_level(log.get('activities', [])),
                
                # Remove specific notes, keep only categorical information
                "has_detailed_notes": bool(log.get('symptoms_notes') or log.get('general_notes')),
                "note_sentiment": self._analyze_note_sentiment(
                    str(log.get('symptoms_notes', '')) + ' ' + str(log.get('general_notes', ''))
                )
            }
            
            de_identified_logs.append(de_identified_log)
        
        return de_identified_logs
    
    def create_hipaa_compliant_prompt(self, de_identified_data: Dict) -> str:
        """
        Create a prompt for OpenAI using only de-identified data.
        
        Args:
            de_identified_data: Fully de-identified patient data
            
        Returns:
            HIPAA-compliant prompt for AI analysis
        """
        
        prompt = f"""
You are a medical AI assistant. Analyze the following DE-IDENTIFIED pediatric allergy data and provide insights. 
NO PROTECTED HEALTH INFORMATION (PHI) is included in this data.

PATIENT PROFILE (DE-IDENTIFIED):
- Patient ID: {de_identified_data['patient_id']}
- Age Category: {de_identified_data['age_category']}
- Gender: {de_identified_data['gender']}

MEDICAL HISTORY:
- Known Allergies: {', '.join(de_identified_data['known_allergies']) if de_identified_data['known_allergies'] else 'None documented'}
- Current Medications: {', '.join(de_identified_data['medications']) if de_identified_data['medications'] else 'None'}
- Medical Conditions: {', '.join(de_identified_data['medical_conditions']) if de_identified_data['medical_conditions'] else 'None'}

SYMPTOM TRACKING DATA:
{json.dumps(de_identified_data.get('medical_logs', []), indent=2)}

ANALYSIS REQUEST:
Provide a clinical analysis in the following JSON format:

{{
  "clinical_summary": "Professional summary of patterns and concerns",
  "priority_patterns": ["List significant clinical patterns requiring attention"],
  "symptom_analysis": {{
    "common_symptoms": ["Most frequent symptoms"],
    "severity_trends": "Analysis of severity patterns",
    "trigger_patterns": "Identified trigger relationships"
  }},
  "allergy_assessment": {{
    "confirmed_allergies": ["Based on documented history"],
    "suspected_allergies": ["Based on symptom patterns"],
    "recommended_testing": ["Suggested allergy tests"]
  }},
  "treatment_assessment": {{
    "current_management": "Assessment of current treatment approach",
    "effectiveness_indicators": "Signs of treatment success/failure",
    "optimization_opportunities": ["Potential improvements"]
  }},
  "clinical_recommendations": {{
    "immediate_actions": ["Urgent recommendations"],
    "routine_follow_up": ["Standard follow-up care"],
    "specialist_referrals": ["Recommended specialist consultations"],
    "lifestyle_modifications": ["Environmental and lifestyle recommendations"]
  }},
  "monitoring_plan": {{
    "key_metrics": ["Important factors to track"],
    "warning_signs": ["Symptoms requiring immediate attention"],
    "follow_up_timeline": "Recommended monitoring schedule"
  }}
}}

Focus on:
1. Clinical patterns and medical significance
2. Evidence-based recommendations
3. Safety considerations and serious reaction patterns
4. Professional medical language appropriate for healthcare providers

Note: This analysis is based on de-identified data only and should be used as clinical decision support, not as a substitute for professional medical judgment.
"""
        
        return prompt
    
    def _generate_consistent_hash(self, value: str) -> str:
        """Generate consistent hash for the same input value"""
        return hashlib.sha256(value.encode()).hexdigest()
    
    def _categorize_age(self, birth_date: datetime) -> str:
        """Convert specific birth date to age category"""
        if not birth_date:
            return "Age not specified"
        
        today = datetime.now()
        age_months = (today.year - birth_date.year) * 12 + today.month - birth_date.month
        
        if age_months < 12:
            return "Infant (0-12 months)"
        elif age_months < 36:
            return "Toddler (1-3 years)"
        elif age_months < 72:
            return "Preschool (3-6 years)"
        elif age_months < 144:
            return "School age (6-12 years)"
        else:
            return "Adolescent (12+ years)"
    
    def _get_replacement_name(self, hash_value: str) -> str:
        """Get consistent replacement name based on hash"""
        index = int(hash_value[:2], 16) % len(self.replacement_names)
        return self.replacement_names[index]
    
    def _sanitize_medical_list(self, items: List[str]) -> List[str]:
        """Remove any potentially identifying information from medical lists"""
        if not items:
            return []
        
        sanitized = []
        for item in items:
            if isinstance(item, str):
                # Remove brand names that might be identifying, keep generic terms
                sanitized_item = re.sub(r'\b[A-Z][a-z]*brand\b', 'generic medication', item)
                sanitized_item = re.sub(r'\bDr\.\s*\w+', 'healthcare provider', sanitized_item)
                sanitized.append(sanitized_item)
        
        return sanitized
    
    def _sanitize_symptoms(self, symptoms: List[str]) -> List[str]:
        """Sanitize symptom descriptions"""
        if not symptoms:
            return []
        
        # Symptoms are generally safe medical terms, but remove any personal details
        sanitized = []
        for symptom in symptoms:
            if isinstance(symptom, str):
                # Remove location-specific or personal details
                cleaned = re.sub(r'\bat\s+\w+\s+(school|daycare|home)', 'at location', symptom)
                cleaned = re.sub(r'\bafter\s+eating\s+at\s+\w+', 'after eating at restaurant', cleaned)
                sanitized.append(cleaned)
        
        return sanitized
    
    def _sanitize_triggers(self, triggers: List[str]) -> List[str]:
        """Remove location-specific trigger information"""
        if not triggers:
            return []
        
        sanitized = []
        for trigger in triggers:
            if isinstance(trigger, str):
                # Replace specific locations with general terms
                cleaned = re.sub(r'\b\w+\s+(park|school|daycare)', 'outdoor location', trigger)
                cleaned = re.sub(r'\b\w+\s+restaurant', 'food establishment', cleaned)
                sanitized.append(cleaned)
        
        return sanitized
    
    def _sanitize_environmental_data(self, log: Dict) -> Dict[str, Any]:
        """Extract environmental data without location identifiers"""
        return {
            "general_weather": log.get('weather_conditions'),
            "temperature_range": self._categorize_temperature(log.get('temperature')),
            "humidity_level": self._categorize_humidity(log.get('humidity')),
            "air_quality": self._categorize_air_quality(log.get('air_quality_index')),
            "pollen_level": log.get('pollen_count')
        }
    
    def _categorize_temperature(self, temp: Optional[float]) -> str:
        """Categorize temperature without specific values"""
        if temp is None:
            return "Not recorded"
        elif temp < 50:
            return "Cold"
        elif temp < 70:
            return "Mild"
        elif temp < 85:
            return "Warm"
        else:
            return "Hot"
    
    def _categorize_humidity(self, humidity: Optional[float]) -> str:
        """Categorize humidity levels"""
        if humidity is None:
            return "Not recorded"
        elif humidity < 30:
            return "Low humidity"
        elif humidity < 60:
            return "Moderate humidity"
        else:
            return "High humidity"
    
    def _categorize_air_quality(self, aqi: Optional[int]) -> str:
        """Categorize air quality index"""
        if aqi is None:
            return "Not recorded"
        elif aqi <= 50:
            return "Good air quality"
        elif aqi <= 100:
            return "Moderate air quality"
        elif aqi <= 150:
            return "Unhealthy for sensitive groups"
        else:
            return "Poor air quality"
    
    def _categorize_activity_level(self, activities: List[str]) -> str:
        """Categorize activity level without specific details"""
        if not activities:
            return "Minimal activity"
        elif len(activities) <= 2:
            return "Light activity"
        elif len(activities) <= 4:
            return "Moderate activity"
        else:
            return "High activity"
    
    def _get_time_period(self, date: Optional[datetime]) -> str:
        """Convert specific time to general time period"""
        if not date:
            return "Unknown time"
        
        hour = date.hour
        if 5 <= hour < 12:
            return "Morning"
        elif 12 <= hour < 17:
            return "Afternoon"
        elif 17 <= hour < 21:
            return "Evening"
        else:
            return "Night"
    
    def _sanitize_severity_data(self, severity_data: Dict) -> Dict[str, Any]:
        """Sanitize severity information"""
        if not severity_data:
            return {}
        
        # Severity scales are medical data and generally safe
        return {k: v for k, v in severity_data.items() if isinstance(v, (int, float, str))}
    
    def _analyze_note_sentiment(self, notes: str) -> str:
        """Analyze general sentiment of notes without exposing content"""
        if not notes or len(notes.strip()) < 10:
            return "No significant notes"
        
        # Simple keyword-based sentiment analysis
        concern_words = ['worse', 'severe', 'emergency', 'hospital', 'urgent']
        positive_words = ['better', 'improved', 'good', 'normal', 'stable']
        
        notes_lower = notes.lower()
        concern_count = sum(1 for word in concern_words if word in notes_lower)
        positive_count = sum(1 for word in positive_words if word in notes_lower)
        
        if concern_count > positive_count:
            return "Concerning observations noted"
        elif positive_count > concern_count:
            return "Positive observations noted"
        else:
            return "Neutral observations noted"
    
    def _store_mapping(self, original_id: Any, deidentified_id: str, field_type: str):
        """Store de-identification mapping for audit purposes"""
        mapping = DeIdentificationMapping(
            original_id=str(original_id),
            deidentified_id=deidentified_id,
            field_type=field_type,
            created_at=datetime.utcnow()
        )
        self.mapping_store[deidentified_id] = mapping
    
    def get_audit_info(self) -> Dict[str, Any]:
        """Get audit information about de-identification process"""
        return {
            "total_mappings": len(self.mapping_store),
            "field_types": list(set(m.field_type for m in self.mapping_store.values())),
            "created_at": datetime.utcnow().isoformat(),
            "compliance_standard": "HIPAA Safe Harbor Method 45 CFR 164.514(b)(2)"
        }
    
    def clear_mappings(self):
        """Clear all stored mappings (for security)"""
        self.mapping_store.clear()
