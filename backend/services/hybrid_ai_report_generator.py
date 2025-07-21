"""
Hybrid AI Report Generator

This service combines AI-            }
        }
        
        generation_end = datetime.utcnow()
        
        # Add metadata
        complete_report.update({
            "report_generation": {
                "method": "Hybrid AI + Local Processing",
                "ai_component": "OpenAI GPT-4 for medical insights (HIPAA de-identified data only)",
                "local_component": "Local processing for personal data integration",
                "total_generation_time": (generation_end - generation_start).total_seconds(),
                "generated_at": generation_end.isoformat(),
                "hipaa_compliant": True,
                "contains_phi": True,
                "safe_for_healthcare_sharing": True
            }
        })
        
        return complete_reportsights with local data processing
to create comprehensive reports that include personal data while maintaining
HIPAA compliance. 

The approach:
1. AI generates medical analysis using de-identified data
2. Local code merges AI insights with original personal data
3. Final report includes both AI analysis AND personal identifiers
"""

import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI

from services.hipaa_deidentification import HIPAADeIdentificationService


class HybridAIReportGenerator:
    """
    Hybrid approach: AI for medical insights, local code for personal data.
    
    This allows us to:
    - Get sophisticated AI medical analysis
    - Keep all personal data (names, dates, locations) in the report
    - Maintain HIPAA compliance (no PHI sent to OpenAI)
    - Provide complete, useful reports for healthcare providers
    """
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key or self.api_key == "your_openai_api_key_here":
            raise ValueError("OpenAI API key not configured")
        
        self.client = AsyncOpenAI(api_key=self.api_key)
        self.model = "o4-mini"
        self.hipaa_service = HIPAADeIdentificationService()
    
    async def generate_hybrid_report(
        self,
        child,
        parent, 
        daily_logs,
        photos,
        request
    ) -> Dict[str, Any]:
        """
        Generate a hybrid report combining AI insights with original personal data.
        """
        generation_start = datetime.utcnow()
        
        # Step 1: Generate AI medical insights using de-identified data
        ai_insights = await self._generate_ai_medical_insights(child, parent, daily_logs, photos, request)
        
        # Step 2: Create comprehensive report with original personal data
        complete_report = await self._create_complete_report_with_personal_data(
            child, parent, daily_logs, photos, request, ai_insights
        )
        
        generation_end = datetime.utcnow()
        
        # Add metadata
        complete_report.update({
            "report_generation": {
                "method": "Hybrid AI + Local Processing",
                "ai_component": "OpenAI o4-mini for medical insights (HIPAA de-identified data only)",
                "local_component": "Local processing for personal data integration",
                "total_generation_time": (generation_end - generation_start).total_seconds(),
                "generated_at": generation_end.isoformat(),
                "hipaa_compliant": True,
                "contains_phi": True,
                "safe_for_healthcare_sharing": True
            }
        })
        
        return complete_report
    
    async def _generate_ai_medical_insights(
        self,
        child,
        parent,
        daily_logs, 
        photos,
        request
    ) -> Dict[str, Any]:
        """
        Generate AI medical insights using only de-identified data.
        """
        ai_start = datetime.utcnow()
        
        print("🤖 Generating AI medical insights with de-identified data...")
        
        # De-identify all data before sending to AI
        child_data = {
            "age_years": self._calculate_age(child.date_of_birth),
            "gender": child.gender if hasattr(child, 'gender') else 'unknown',
            "known_allergies": self._parse_json_field(child.known_allergies),
            "medications": self._parse_json_field(child.medications),
            "medical_conditions": self._parse_json_field(child.medical_conditions)
        }
        
        # De-identify daily logs
        deidentified_logs = []
        for i, log in enumerate(daily_logs):
            relative_date = f"Day_{i+1}"  # Remove actual dates
            
            log_data = {
                "relative_date": relative_date,
                "symptoms": log.symptoms if hasattr(log, 'symptoms') else [],
                "symptom_severity": log.symptom_severity if hasattr(log, 'symptom_severity') else {},
                "triggers": log.triggers if hasattr(log, 'triggers') else [],
                "mood": log.mood if hasattr(log, 'mood') else 'unknown',
                "mood_scale": log.mood_scale if hasattr(log, 'mood_scale') else 5,
                "general_notes": "Symptoms and observations noted",  # Generic description
                "eczema_severity": getattr(log, 'eczema_severity', 'mild'),
                "asthma_severity": getattr(log, 'asthma_severity', 'mild'),
                "allergic_reaction_severity": getattr(log, 'allergic_reaction_severity', 'mild')
            }
            deidentified_logs.append(log_data)
        
        # Create AI prompt for medical analysis
        prompt = self._create_medical_analysis_prompt(child_data, deidentified_logs)
        
        # Get AI insights
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a pediatric allergist and immunologist. Provide detailed medical analysis and recommendations based on allergy tracking data. Focus on medical insights, patterns, and recommendations. Do not include personal identifiers."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        ai_end = datetime.utcnow()
        
        ai_content = response.choices[0].message.content if response.choices else ""
        
        return {
            "ai_medical_analysis": ai_content,
            "ai_processing_time": (ai_end - ai_start).total_seconds(),
            "model_used": self.model,
            "analysis_type": "Medical insights and recommendations",
            "data_sent_to_ai": "De-identified symptom patterns, age, gender, general medical history only"
        }
    
    async def _create_complete_report_with_personal_data(
        self,
        child,
        parent,
        daily_logs,
        photos, 
        request,
        ai_insights: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create the complete report including all personal data + AI insights.
        """
        print("📋 Creating complete report with personal data...")
        
        # Patient Information (with real personal data)
        patient_info = {
            "patient_name": child.name,
            "date_of_birth": child.date_of_birth.strftime("%Y-%m-%d"),
            "age": self._calculate_age(child.date_of_birth),
            "gender": getattr(child, 'gender', 'Not specified'),
            "parent_guardian": parent.full_name,
            "parent_email": parent.email,
            "report_period": {
                "start_date": (request.start_date or (datetime.utcnow() - timedelta(days=90))).strftime("%Y-%m-%d"),
                "end_date": (request.end_date or datetime.utcnow()).strftime("%Y-%m-%d"),
                "duration_days": len(daily_logs)
            }
        }
        
        # Medical History (with real data)
        medical_history = {
            "known_allergies": self._parse_json_field(child.known_allergies),
            "current_medications": self._parse_json_field(child.medications),
            "medical_conditions": self._parse_json_field(child.medical_conditions),
            "total_tracking_days": len(daily_logs)
        }
        
        # Detailed Daily Logs (with real dates and data)
        detailed_logs = []
        for log in daily_logs:
            log_entry = {
                "date": log.date.strftime("%Y-%m-%d"),
                "day_of_week": log.date.strftime("%A"),
                "symptoms": log.symptoms if hasattr(log, 'symptoms') else [],
                "symptom_severity": log.symptom_severity if hasattr(log, 'symptom_severity') else {},
                "triggers": log.triggers if hasattr(log, 'triggers') else [],
                "mood": getattr(log, 'mood', 'Not recorded'),
                "mood_scale": getattr(log, 'mood_scale', None),
                "parent_observations": getattr(log, 'parent_observations', ''),
                "general_notes": getattr(log, 'general_notes', ''),
                "severity_levels": {
                    "eczema": getattr(log, 'eczema_severity', 'Not recorded'),
                    "asthma": getattr(log, 'asthma_severity', 'Not recorded'), 
                    "allergic_reactions": getattr(log, 'allergic_reaction_severity', 'Not recorded')
                }
            }
            detailed_logs.append(log_entry)
        
        # Statistical Analysis (using real data)
        statistics = self._generate_statistics(daily_logs)
        
        # Symptom Timeline (with real dates)
        timeline = self._create_symptom_timeline(daily_logs)
        
        # Create formatted medical report text
        formatted_report_text = self._create_formatted_medical_report(
            child, parent, daily_logs, ai_insights, statistics, request
        )
        
        # Combine with AI insights
        complete_report = {
            "report_text": formatted_report_text,  # This is what will be displayed
            "report_header": {
                "title": f"Comprehensive Allergy Report for {child.name}",
                "generated_on": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
                "report_type": "Hybrid AI-Enhanced Medical Report",
                "confidentiality": "CONFIDENTIAL - Contains Protected Health Information (PHI)"
            },
            "patient_information": patient_info,
            "medical_history": medical_history,
            "ai_medical_insights": {
                "analysis": ai_insights["ai_medical_analysis"],
                "disclaimer": "AI analysis based on symptom patterns and medical guidelines. Not a substitute for professional medical judgment.",
                "processing_details": {
                    "ai_model": ai_insights["model_used"],
                    "processing_time": ai_insights["ai_processing_time"],
                    "data_privacy": ai_insights["data_sent_to_ai"]
                }
            },
            "detailed_daily_logs": detailed_logs,
            "statistical_analysis": statistics,
            "symptom_timeline": timeline,
            "photos_summary": {
                "total_photos": len(photos),
                "note": "Photo analysis available upon request"
            },
            "recommendations": {
                "ai_recommendations": "See AI Medical Insights section above",
                "next_steps": [
                    "Share this report with your healthcare provider",
                    "Continue daily symptom tracking", 
                    "Follow up on any concerning patterns identified",
                    "Update medication logs as prescribed"
                ]
            }
        }
        
        return complete_report
    
    def _create_medical_analysis_prompt(self, child_data: Dict, logs: List[Dict]) -> str:
        """Create prompt for AI medical analysis using de-identified data."""
        prompt = f"""
Analyze this pediatric allergy tracking data and provide medical insights:

PATIENT PROFILE (De-identified):
- Age: {child_data['age_years']} years
- Gender: {child_data['gender']}
- Known Allergies: {child_data['known_allergies']}
- Current Medications: {child_data['medications']}
- Medical Conditions: {child_data['medical_conditions']}

SYMPTOM TRACKING DATA ({len(logs)} days):
"""
        
        for log in logs[:10]:  # Limit to recent entries
            prompt += f"""
{log['relative_date']}:
- Symptoms: {log['symptoms']}
- Severity: {log['symptom_severity']}
- Triggers: {log['triggers']}
- Mood: {log['mood']} (scale: {log['mood_scale']}/10)
- Eczema: {log['eczema_severity']}, Asthma: {log['asthma_severity']}, Reactions: {log['allergic_reaction_severity']}
"""

        prompt += """
Please provide:
1. Pattern Analysis: What patterns do you see in symptoms and triggers?
2. Severity Assessment: How would you characterize the current management?
3. Risk Factors: What concerning trends should be monitored?
4. Medical Recommendations: What management strategies would you suggest?
5. Follow-up: What should be discussed with the healthcare provider?

Focus on medical insights and clinical recommendations. Do not include personal identifiers.
"""
        return prompt
    
    def _calculate_age(self, birth_date) -> int:
        """Calculate age from birth date."""
        if not birth_date:
            return 0
        today = datetime.utcnow().date()
        return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    
    def _parse_json_field(self, field) -> List[str]:
        """Parse JSON field safely."""
        if not field:
            return []
        if isinstance(field, str):
            try:
                return json.loads(field)
            except:
                return [field]
        return field if isinstance(field, list) else []
    
    def _generate_statistics(self, daily_logs) -> Dict[str, Any]:
        """Generate statistics from daily logs."""
        print(f"Generating statistics for {len(daily_logs)} daily logs...")
        
        if not daily_logs:
            return {"note": "No tracking data available"}
        
        # Count symptoms
        all_symptoms = []
        all_triggers = []
        mood_scores = []
        
        for i, log in enumerate(daily_logs):
            try:
                print(f"Processing log {i+1}: {type(log)}")
                
                if hasattr(log, 'symptoms') and log.symptoms:
                    symptoms = log.symptoms if isinstance(log.symptoms, list) else []
                    print(f"  Symptoms: {symptoms} ({type(symptoms)})")
                    all_symptoms.extend(symptoms)
                
                if hasattr(log, 'triggers') and log.triggers:
                    triggers = log.triggers if isinstance(log.triggers, list) else []
                    print(f"  Triggers: {triggers} ({type(triggers)})")
                    all_triggers.extend(triggers)
                
                if hasattr(log, 'mood_scale') and log.mood_scale and isinstance(log.mood_scale, (int, float)):
                    mood_score = float(log.mood_scale)
                    print(f"  Mood scale: {mood_score} ({type(mood_score)})")
                    mood_scores.append(mood_score)
                    
            except Exception as e:
                print(f"Error processing log {i+1}: {e}")
                continue
        
        print(f"Total symptoms collected: {len(all_symptoms)}")
        print(f"Total triggers collected: {len(all_triggers)}")
        print(f"Total mood scores collected: {len(mood_scores)}")
        
        try:
            most_common_symptoms = self._count_frequency(all_symptoms)
            print(f"Most common symptoms calculated: {most_common_symptoms}")
        except Exception as e:
            print(f"Error calculating most common symptoms: {e}")
            most_common_symptoms = {}
        
        try:
            most_common_triggers = self._count_frequency(all_triggers)
            print(f"Most common triggers calculated: {most_common_triggers}")
        except Exception as e:
            print(f"Error calculating most common triggers: {e}")
            most_common_triggers = {}
        
        return {
            "tracking_period_days": len(daily_logs),
            "most_common_symptoms": most_common_symptoms,
            "most_common_triggers": most_common_triggers,
            "average_mood_score": sum(mood_scores) / len(mood_scores) if mood_scores else 0,
            "symptom_frequency": len(all_symptoms) / len(daily_logs) if daily_logs else 0
        }
    
    def _count_frequency(self, items) -> Dict[str, int]:
        """Count frequency of items."""
        # Add validation
        if not isinstance(items, (list, tuple)):
            print(f"Warning: Expected list/tuple for frequency counting, got {type(items)}: {items}")
            return {}
        
        frequency = {}
        for item in items:
            if not isinstance(item, (str, int)):
                print(f"Warning: Invalid item type in frequency counting: {type(item)} - {item}")
                continue
            frequency[str(item)] = frequency.get(str(item), 0) + 1
        
        if not frequency:
            return {}
            
        return dict(sorted(frequency.items(), key=lambda x: x[1], reverse=True)[:5])
    
    def _create_symptom_timeline(self, daily_logs) -> List[Dict]:
        """Create timeline of symptoms with real dates."""
        timeline = []
        for log in daily_logs[-14:]:  # Last 14 days
            timeline.append({
                "date": log.date.strftime("%Y-%m-%d"),
                "symptoms": log.symptoms if hasattr(log, 'symptoms') else [],
                "severity": {
                    "eczema": getattr(log, 'eczema_severity', 'none'),
                    "asthma": getattr(log, 'asthma_severity', 'none'),
                    "reactions": getattr(log, 'allergic_reaction_severity', 'none')
                },
                "triggers": log.triggers if hasattr(log, 'triggers') else []
            })
        return timeline
    
    def _create_formatted_medical_report(
        self,
        child,
        parent,
        daily_logs,
        ai_insights: Dict[str, Any],
        statistics: Dict[str, Any],
        request
    ) -> str:
        """
        Create a properly formatted medical report that doctors can actually use.
        """
        report_date = datetime.utcnow().strftime("%B %d, %Y")
        patient_age = self._calculate_age(child.date_of_birth)
        
        # Calculate date range
        start_date = (request.start_date or (datetime.utcnow() - timedelta(days=90))).strftime("%B %d, %Y")
        end_date = (request.end_date or datetime.utcnow()).strftime("%B %d, %Y")
        
        formatted_report = f"""
═══════════════════════════════════════════════════════════════════════════════════
                              ALLERGY MANAGEMENT REPORT
═══════════════════════════════════════════════════════════════════════════════════

PATIENT INFORMATION:
    Name:                 {child.name}
    Date of Birth:        {child.date_of_birth.strftime("%B %d, %Y")} (Age: {patient_age} years)
    Gender:               {getattr(child, 'gender', 'Not specified')}
    Parent/Guardian:      {parent.full_name}
    Contact Email:        {parent.email}
    Report Period:        {start_date} - {end_date}
    Report Generated:     {report_date}

═══════════════════════════════════════════════════════════════════════════════════
                                MEDICAL HISTORY
═══════════════════════════════════════════════════════════════════════════════════

KNOWN ALLERGIES:
{self._format_list(self._parse_json_field(child.known_allergies), "    • ")}

CURRENT MEDICATIONS:
{self._format_list(self._parse_json_field(child.medications), "    • ")}

MEDICAL CONDITIONS:
{self._format_list(self._parse_json_field(child.medical_conditions), "    • ")}

═══════════════════════════════════════════════════════════════════════════════════
                            AI MEDICAL ANALYSIS & INSIGHTS
═══════════════════════════════════════════════════════════════════════════════════

{ai_insights.get("ai_medical_analysis", "No AI analysis available")}

AI PROCESSING DETAILS:
    Model Used:           {ai_insights.get("model_used", "Unknown")}
    Processing Time:      {ai_insights.get("ai_processing_time", 0):.2f} seconds
    Data Sent to AI:      {ai_insights.get("data_sent_to_ai", "Unknown")}
    
IMPORTANT DISCLAIMER:
    This AI analysis is based on symptom patterns and medical guidelines. 
    It is not a substitute for professional medical judgment and should be 
    reviewed by a qualified healthcare provider.

═══════════════════════════════════════════════════════════════════════════════════
                              SYMPTOM SUMMARY
═══════════════════════════════════════════════════════════════════════════════════

TRACKING PERIOD: {len(daily_logs)} days of symptom data

MOST COMMON SYMPTOMS:
{self._format_symptom_frequency(statistics.get("most_common_symptoms", {}))}

MOST FREQUENT TRIGGERS:
{self._format_trigger_frequency(statistics.get("most_common_triggers", {}))}

SEVERITY TRENDS:
{self._format_severity_trends(daily_logs)}

═══════════════════════════════════════════════════════════════════════════════════
                            DETAILED DAILY LOGS
═══════════════════════════════════════════════════════════════════════════════════

{self._format_daily_logs(daily_logs[:10])}  {f'(Showing most recent 10 days of {len(daily_logs)} total entries)' if len(daily_logs) > 10 else ''}

═══════════════════════════════════════════════════════════════════════════════════
                           RECOMMENDATIONS & NEXT STEPS
═══════════════════════════════════════════════════════════════════════════════════

IMMEDIATE RECOMMENDATIONS:
    • Share this report with your child's healthcare provider
    • Continue daily symptom and trigger tracking
    • Review medication effectiveness with doctor
    • Monitor any concerning patterns identified in AI analysis

FOR HEALTHCARE PROVIDER:
    • Review AI-identified symptom patterns and correlations
    • Consider medication adjustments based on severity trends
    • Evaluate trigger avoidance strategies
    • Assess need for additional allergy testing or specialist referral

NEXT APPOINTMENT CONSIDERATIONS:
    • Discuss symptom frequency and severity changes
    • Review effectiveness of current management plan
    • Address any new triggers or symptoms identified
    • Update emergency action plan if needed

═══════════════════════════════════════════════════════════════════════════════════
                              REPORT METADATA
═══════════════════════════════════════════════════════════════════════════════════

Generation Method:        Hybrid AI + Local Processing
HIPAA Compliance:         ✓ Compliant (PHI de-identified for AI processing)
Contains PHI:             ✓ Yes (Complete patient information included)
Suitable for Sharing:     ✓ Yes (Healthcare providers)
Report ID:                HYBRID-{child.name.replace(' ', '')}-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}

═══════════════════════════════════════════════════════════════════════════════════
                            END OF MEDICAL REPORT
═══════════════════════════════════════════════════════════════════════════════════
"""
        return formatted_report
    
    def _format_list(self, items: List[str], prefix: str = "    • ") -> str:
        """Format a list of items with prefixes."""
        if not items:
            return "    None recorded"
        return "\n".join([f"{prefix}{item}" for item in items])
    
    def _format_symptom_frequency(self, symptom_freq: Dict[str, int]) -> str:
        """Format symptom frequency data."""
        if not symptom_freq or not isinstance(symptom_freq, dict):
            return "    No symptom data available"
        
        try:
            sorted_symptoms = sorted(symptom_freq.items(), key=lambda x: x[1], reverse=True)[:5]
            result = ""
            for symptom, count in sorted_symptoms:
                result += f"    • {symptom}: {count} days\n"
            return result.strip()
        except Exception as e:
            print(f"Error formatting symptom frequency: {e}")
            return "    Error processing symptom data"
    
    def _format_trigger_frequency(self, trigger_freq: Dict[str, int]) -> str:
        """Format trigger frequency data."""
        if not trigger_freq or not isinstance(trigger_freq, dict):
            return "    No trigger data available"
        
        try:
            sorted_triggers = sorted(trigger_freq.items(), key=lambda x: x[1], reverse=True)[:5]
            result = ""
            for trigger, count in sorted_triggers:
                result += f"    • {trigger}: {count} days\n"
            return result.strip()
        except Exception as e:
            print(f"Error formatting trigger frequency: {e}")
            return "    Error processing trigger data"
    
    def _format_severity_trends(self, daily_logs) -> str:
        """Format severity trend information."""
        if not daily_logs:
            return "    No severity data available"
        
        # Calculate average severities
        eczema_levels = [getattr(log, 'eczema_severity', 'mild') for log in daily_logs]
        asthma_levels = [getattr(log, 'asthma_severity', 'mild') for log in daily_logs]
        reaction_levels = [getattr(log, 'allergic_reaction_severity', 'mild') for log in daily_logs]
        
        # Count severity levels
        eczema_severe = sum(1 for level in eczema_levels if level in ['severe', 'very_severe'])
        asthma_severe = sum(1 for level in asthma_levels if level in ['severe', 'very_severe'])
        reaction_severe = sum(1 for level in reaction_levels if level in ['severe', 'very_severe'])
        
        total_days = len(daily_logs)
        
        return f"""    • Eczema: {eczema_severe}/{total_days} days severe
    • Asthma: {asthma_severe}/{total_days} days severe  
    • Allergic Reactions: {reaction_severe}/{total_days} days severe"""
    
    def _format_daily_logs(self, logs) -> str:
        """Format daily logs for the report."""
        if not logs:
            return "    No daily logs available"
        
        formatted_logs = ""
        for log in logs:
            date_str = log.date.strftime("%B %d, %Y (%A)")
            symptoms = log.symptoms if hasattr(log, 'symptoms') else []
            triggers = log.triggers if hasattr(log, 'triggers') else []
            
            formatted_logs += f"""
{date_str}:
    Symptoms: {', '.join(symptoms) if symptoms else 'None reported'}
    Triggers: {', '.join(triggers) if triggers else 'None identified'}
    Mood: {getattr(log, 'mood', 'Not recorded')} ({getattr(log, 'mood_scale', 'N/A')}/10)
    Parent Notes: {getattr(log, 'parent_observations', 'None')}
    Severity: Eczema-{getattr(log, 'eczema_severity', 'unknown')}, Asthma-{getattr(log, 'asthma_severity', 'unknown')}, Reactions-{getattr(log, 'allergic_reaction_severity', 'unknown')}
    ───────────────────────────────────────────────────────────────────────────
"""
        return formatted_logs.strip()
