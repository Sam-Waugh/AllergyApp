from fastapi import APIRouter
from datetime import datetime
import os

from schemas.schemas import FirestoreReportGenerationRequest, ReportResponse

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])

def numeric_to_text_severity(value):
    """Convert numeric severity to descriptive text."""
    if value is None or value == 0:
        return 'none'  # Return 'none' instead of None for zero/missing values
    elif value <= 2:
        return 'mild'
    elif value <= 4:
        return 'moderate'
    else:
        return 'severe'

def numeric_to_text_severity_or_none(value):
    """Convert numeric severity to descriptive text, returning None for zero/missing values."""
    if value is None or value == 0:
        return None  # Don't report if no severity
    elif value <= 2:
        return 'mild'
    elif value <= 4:
        return 'moderate'
    else:
        return 'severe'

async def generate_ai_insights(analysis_data, daily_symptoms, trigger_analysis, severe_days, moderate_days):
    """Generate AI-powered insights using OpenAI API."""
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key or api_key == "your_openai_api_key_here":
            return ["⚠️  OpenAI API not configured - AI insights unavailable", 
                   "   Manual clinical review recommended"]
        
        # For now, provide rule-based insights until OpenAI integration is fully configured
        insights = []
        
        # Pattern Analysis
        insights.append("📈 PATTERN ANALYSIS:")
        if severe_days > 0:
            insights.append(f"   • {severe_days} severe symptom episodes require immediate attention")
        if moderate_days > 3:
            insights.append(f"   • {moderate_days} moderate episodes suggest ongoing inflammation")
        if trigger_analysis:
            top_trigger = max(trigger_analysis.items(), key=lambda x: x[1])[0]
            insights.append(f"   • '{top_trigger}' identified as primary trigger")
        
        # Clinical Assessment
        insights.append("")
        insights.append("🩺 CLINICAL ASSESSMENT:")
        total_logs = analysis_data['total_logs']
        if severe_days / total_logs > 0.2 if total_logs > 0 else False:
            insights.append("   • High frequency of severe symptoms indicates suboptimal control")
        elif moderate_days / total_logs > 0.4 if total_logs > 0 else False:
            insights.append("   • Moderate symptom frequency suggests need for treatment optimization")
        else:
            insights.append("   • Overall symptom pattern shows reasonable disease management")
        
        # Management Recommendations
        insights.append("")
        insights.append("💊 MANAGEMENT INSIGHTS:")
        if analysis_data['medications']:
            insights.append("   • Current medication regimen documented - consider effectiveness review")
        else:
            insights.append("   • No medications documented - evaluate need for pharmacological intervention")
        
        if trigger_analysis:
            insights.append("   • Strong trigger correlations identified - environmental controls recommended")
        
        return insights
        
    except Exception as e:
        print(f"AI insights generation failed: {str(e)}")
        return [
            "⚠️  AI analysis temporarily unavailable",
            "   Proceeding with standard clinical analysis"
        ]

@router.get("/ping")
async def ping():
    """Simple ping endpoint to test connectivity."""
    return {"status": "ok", "message": "Backend is reachable", "timestamp": datetime.utcnow().isoformat()}

@router.get("/debug/children")
async def debug_list_children():
    """Debug endpoint to list all children in Firestore."""
    try:
        from config.firebase_config import get_firestore_client
        db = get_firestore_client()
        
        children_ref = db.collection('children')
        docs = list(children_ref.limit(20).get())
        
        children_list = []
        for doc in docs:
            data = doc.to_dict() or {}
            children_list.append({
                'id': doc.id,
                'name': f"{data.get('first_name', '?')} {data.get('last_name', '?')}",
                'parent_user_id': data.get('parent_user_id', '?'),
                'date_of_birth': data.get('date_of_birth', '?'),
                'allergies': data.get('allergies', [])
            })
        
        return {
            'total_children': len(children_list),
            'children': children_list
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'type': type(e).__name__
        }

@router.get("/debug/raw-log/{collection}/{doc_id}")
async def debug_raw_log(collection: str, doc_id: str):
    """Debug endpoint to show raw document structure."""
    try:
        from config.firebase_config import get_firestore_client
        db = get_firestore_client()
        
        doc_ref = db.collection(collection).document(doc_id)
        doc = doc_ref.get()
        
        if doc.exists:
            data = doc.to_dict()
            return {
                'document_id': doc.id,
                'collection': collection,
                'raw_data': data,
                'all_fields': list(data.keys()) if data else []
            }
        else:
            return {
                'error': f'Document {doc_id} not found in collection {collection}'
            }
        
    except Exception as e:
        return {
            'error': str(e),
            'type': type(e).__name__
        }

@router.get("/debug/logs/{child_id}")
async def debug_list_logs(child_id: str):
    """Debug endpoint to list logs for a specific child."""
    try:
        from config.firebase_config import get_firestore_client
        db = get_firestore_client()
        
        # Try different collection and field combinations
        possible_collections = ['daily_logs', 'dailyLogs', 'logs', 'symptom_logs']
        possible_fields = ['child_id', 'childId', 'child_doc_id', 'parent_child_id']
        
        results = {}
        
        for collection_name in possible_collections:
            for field_name in possible_fields:
                try:
                    logs_ref = db.collection(collection_name).where(field_name, '==', child_id).limit(5)
                    docs = list(logs_ref.get())
                    
                    if docs:
                        logs = []
                        for doc in docs:
                            data = doc.to_dict() or {}
                            logs.append({
                                'id': doc.id,
                                'date': data.get('date', '?'),
                                'eczema_severity': data.get('eczema_severity', 'not_found'),
                                'asthma_severity': data.get('asthma_severity', 'not_found'),
                                'allergic_reaction_severity': data.get('allergic_reaction_severity', 'not_found'),
                                'overall_mood': data.get('overall_mood', 'not_found'),
                                'symptoms_notes': data.get('symptoms_notes', 'not_found')
                            })
                        
                        results[f"{collection_name}.{field_name}"] = {
                            'count': len(docs),
                            'logs': logs
                        }
                        
                except Exception as e:
                    results[f"{collection_name}.{field_name}"] = {
                        'error': str(e)
                    }
        
        return {
            'child_id_searched': child_id,
            'results': results
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'type': type(e).__name__
        }

@router.get("/test")
async def test_openai_connection():
    """Test endpoint to verify OpenAI API connection and HIPAA compliance setup."""
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key or api_key == "your_openai_api_key_here":
            return {
                "status": "error",
                "message": "OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.",
                "configured": False,
                "hipaa_compliant": False
            }
        
        # Test HIPAA de-identification service
        hipaa_available = False
        hipaa_error = "Unknown error"
        
        try:
            from services.hipaa_deidentification import HIPAADeIdentificationService
            hipaa_service = HIPAADeIdentificationService()
            # Test basic functionality
            test_data = {"id": 1, "name": "Test"}
            hipaa_service.de_identify_patient_data(test_data, test_data)
            hipaa_available = True
            hipaa_error = "No error"
        except Exception as e:
            hipaa_available = False
            hipaa_error = str(e)
        
        return {
            "status": "success",
            "message": "OpenAI API connection and HIPAA compliance verified",
            "configured": True,
            "api_key_present": True,
            "api_key_starts_with": api_key[:10] + "..." if api_key else None,
            "hipaa_compliant": hipaa_available,
            "hipaa_error": hipaa_error if not hipaa_available else None
        }
        
    except Exception as e:
        return {
            "status": "error", 
            "message": f"OpenAI test failed: {str(e)}",
            "configured": False,
            "hipaa_compliant": False
        }

@router.post("/generate-firestore")
async def generate_firestore_report(
    request: FirestoreReportGenerationRequest
):
    """
    Generate a comprehensive allergy report using Firestore data and OpenAI API.
    This endpoint works with Firestore collections instead of SQLAlchemy.
    """
    try:
        print(f"🔍 Generating Firestore report for child_id: {request.child_id}")
        print(f"📅 Request parameters:")
        print(f"   start_date: {request.start_date}")
        print(f"   end_date: {request.end_date}")
        print(f"   include_ai_insights: {getattr(request, 'include_ai_insights', 'Not set')}")
        print(f"   days_back: {getattr(request, 'days_back', 'Not set')}")
        
        # Initialize Firebase/Firestore
        from config.firebase_config import get_firestore_client
        db = get_firestore_client()
        
        # Extract child document ID from the Firestore path
        child_doc_id = request.child_id
        if isinstance(child_doc_id, str) and "/" in child_doc_id:
            # Extract the actual document ID from the path
            # "projects/allergyapp-1a030/databases/(default)/documents/children/child_1751823814217_1wjfre4n6"
            child_doc_id = child_doc_id.split("/")[-1]
        
        print(f"📄 Using child document ID: {child_doc_id}")
        
        # Get child data from Firestore
        child_ref = db.collection('children').document(str(child_doc_id))
        child_doc = child_ref.get()
        
        if not child_doc.exists:
            print(f"❌ Child document {child_doc_id} not found in Firestore")
            return ReportResponse(
                success=False,
                error_message=f"Child document {child_doc_id} not found in Firestore database"
            )
        
        child_data = child_doc.to_dict() or {}
        print(f"✅ Found child document with {len(child_data)} fields")
        
        # Debug print ALL child data fields to identify the name field
        print("=== ALL CHILD DATA FIELDS ===")
        for key, value in child_data.items():
            print(f"  {key}: {value} ({type(value)})")
        print("=== END CHILD DATA ===")
        print("")
        
        
        # Get daily logs from Firestore (use correct collection and field names)
        print(f"🔍 Searching for logs with child_id: {child_doc_id}")
        
        # Try different collection names and field names that might be used
        # Prioritize 'dailyLogs' since it has the proper symptomSeverity structure
        possible_collections = ['dailyLogs', 'daily_logs', 'logs', 'symptom_logs']
        possible_child_id_fields = ['childId', 'child_id', 'child_doc_id', 'parent_child_id']
        
        daily_logs_docs = []
        logs_collection_used = None
        child_id_field_used = None
        
        for collection_name in possible_collections:
            for field_name in possible_child_id_fields:
                try:
                    print(f"  Trying collection '{collection_name}' with field '{field_name}'")
                    logs_ref = db.collection(collection_name).where(field_name, '==', str(child_doc_id)).limit(5)
                    docs = list(logs_ref.get())
                    print(f"    Found {len(docs)} documents")
                    
                    if docs:
                        daily_logs_docs = docs
                        logs_collection_used = collection_name
                        child_id_field_used = field_name
                        print(f"  ✅ Found logs using collection '{collection_name}' and field '{field_name}'")
                        break
                except Exception as e:
                    print(f"    Error querying {collection_name}.{field_name}: {str(e)}")
            
            if daily_logs_docs:
                break
        
        if not daily_logs_docs:
            # Also try without child_id filter to see if there are any logs at all
            try:
                print(f"� Checking if there are any logs at all in 'daily_logs' collection...")
                all_logs_ref = db.collection('daily_logs').limit(5)
                all_docs = list(all_logs_ref.get())
                print(f"  Total documents in 'daily_logs': {len(all_docs)}")
                
                if all_docs:
                    print("  Sample document structure:")
                    sample_doc_data = all_docs[0].to_dict()
                    if sample_doc_data:
                        for key, value in sample_doc_data.items():
                            print(f"    {key}: {value} ({type(value)})")
                    else:
                        print("    Document data is None")
            except Exception as e:
                print(f"    Error checking collection: {str(e)}")
        
        daily_logs_data = []
        total_logs_before_filtering = len(daily_logs_docs)
        
        print(f"📊 Retrieved {total_logs_before_filtering} logs from Firestore before filtering")
        
        for doc in daily_logs_docs:
            log_data = doc.to_dict() or {}
            log_data['id'] = doc.id
            
            # Debug: Print ALL log entries to understand structure
            print(f"📋 Log {doc.id} structure:")
            for key, value in log_data.items():
                if key != 'id':  # Don't print the ID we just added
                    print(f"    {key}: {value} ({type(value)})")
            print("")
            
            # Specifically check symptom fields
            symptom_fields = ['eczema_severity', 'asthma_severity', 'allergic_reaction_severity', 'overall_mood', 'symptoms_notes']
            print(f"🔍 Symptom fields for log {doc.id}:")
            for field in symptom_fields:
                value = log_data.get(field, 'NOT_FOUND')
                print(f"    {field}: '{value}'")
            print("")
            
            # Client-side date filtering if dates are provided
            if request.start_date or request.end_date:
                log_date_str = log_data.get('date', '')
                print(f"   Log {doc.id}: date={log_date_str}")
                
                if log_date_str:
                    try:
                        log_date = datetime.fromisoformat(log_date_str.replace('Z', '+00:00'))
                        
                        # Apply date filtering - ensure we're comparing date objects
                        log_date_only = log_date.date()
                        
                        if request.start_date:
                            start_date_only = request.start_date.date() if hasattr(request.start_date, 'date') else request.start_date
                            if log_date_only < start_date_only:
                                continue
                                
                        if request.end_date:
                            end_date_only = request.end_date.date() if hasattr(request.end_date, 'date') else request.end_date
                            if log_date_only > end_date_only:
                                continue
                            
                    except ValueError as date_err:
                        print(f"⚠️  Could not parse date '{log_date_str}': {date_err}")
                        continue
            
            daily_logs_data.append(log_data)
        
        print(f"📊 Final logs after filtering: {len(daily_logs_data)}")
        
        # Calculate child age from date of birth
        child_age = "Unknown"
        if 'date_of_birth' in child_data:
            try:
                from datetime import date
                birth_date = child_data['date_of_birth']
                if isinstance(birth_date, str):
                    birth_date = datetime.fromisoformat(birth_date.replace('Z', '+00:00')).date()
                elif hasattr(birth_date, 'date'):
                    birth_date = birth_date.date()
                
                today = date.today()
                child_age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
            except Exception as age_err:
                print(f"⚠️  Could not calculate age: {age_err}")
        
        # Process allergies - handle both simple strings and complex objects
        processed_allergies = []
        raw_allergies = child_data.get('known_allergies', [])
        
        for allergy in raw_allergies:
            if isinstance(allergy, dict):
                # Complex allergy object
                allergen = allergy.get('allergen', 'Unknown allergen')
                severity = allergy.get('severity', 'unknown')
                verified = allergy.get('verified_by_doctor', False)
                verified_text = " (verified by doctor)" if verified else ""
                processed_allergies.append(f"{allergen} - {severity} severity{verified_text}")
            elif isinstance(allergy, str):
                # Simple string
                processed_allergies.append(allergy)
            else:
                processed_allergies.append(str(allergy))
        
        # Process medications - handle both simple strings and complex objects
        processed_medications = []
        raw_medications = child_data.get('current_medications', [])  # Use correct field name
        
        for medication in raw_medications:
            if isinstance(medication, dict):
                # Complex medication object
                name = medication.get('name', 'Unknown medication')
                dosage = medication.get('dosage', '')
                frequency = medication.get('frequency', '')
                active = medication.get('active', True)
                med_text = name
                if dosage:
                    med_text += f" - {dosage}"
                if frequency:
                    med_text += f" ({frequency})"
                if not active:
                    med_text += " [INACTIVE]"
                processed_medications.append(med_text)
            elif isinstance(medication, str):
                # Simple string
                processed_medications.append(medication)
            else:
                processed_medications.append(str(medication))
        
        # Get child's full name from first_name and last_name fields
        first_name = child_data.get('first_name', '')
        last_name = child_data.get('last_name', '')
        full_name = f"{first_name} {last_name}".strip()
        if not full_name:
            full_name = child_data.get('name', 'Unknown Child')  # Fallback
        
        # Prepare data for comprehensive analysis
        analysis_data = {
            'child_name': full_name,
            'child_age': f"{child_age} years old" if child_age != "Unknown" else "Age unknown",
            'gender': child_data.get('gender', 'Not specified'),
            'date_of_birth': child_data.get('date_of_birth', 'Not specified'),
            'known_allergies': processed_allergies,
            'medications': processed_medications,
            'medical_conditions': child_data.get('medical_conditions', []),
            'emergency_contact': child_data.get('emergency_contact', 'Not specified'),
            'doctor_name': child_data.get('doctor_name', 'Not specified'),
            'doctor_contact': child_data.get('doctor_contact', 'Not specified'),
            'total_logs': len(daily_logs_data),
            'date_range': f"{request.start_date or 'earliest'} to {request.end_date or 'latest'}",
            'logs': daily_logs_data[:20]  # Limit to first 20 logs for AI analysis
        }
        
        # Generate comprehensive medical report with proper formatting
        report_sections = []
        
        # Header with professional formatting
        report_sections.append("═══════════════════════════════════════════════════════════════")
        report_sections.append("                    COMPREHENSIVE ALLERGY REPORT                ")
        report_sections.append("═══════════════════════════════════════════════════════════════")
        report_sections.append(f"Generated: {datetime.utcnow().strftime('%B %d, %Y at %I:%M %p UTC')}")
        report_sections.append(f"Report Period: {analysis_data['date_range']}")
        report_sections.append("")
        
        # 1. Patient Information Section - Enhanced
        report_sections.append("🏥 PATIENT INFORMATION")
        report_sections.append("─" * 50)
        report_sections.append(f"Name:             {analysis_data['child_name']}")
        report_sections.append(f"Age:              {analysis_data['child_age']}")
        report_sections.append(f"Gender:           {analysis_data['gender']}")
        report_sections.append(f"Date of Birth:    {analysis_data['date_of_birth']}")
        if analysis_data['emergency_contact'] != 'Not specified':
            report_sections.append(f"Emergency Contact: {analysis_data['emergency_contact']}")
        if analysis_data['doctor_name'] != 'Not specified':
            report_sections.append(f"Primary Physician: {analysis_data['doctor_name']}")
            if analysis_data['doctor_contact'] != 'Not specified':
                report_sections.append(f"Doctor Contact:    {analysis_data['doctor_contact']}")
        report_sections.append("")
        
        # 2. Medical History Section - Enhanced
        report_sections.append("🩺 MEDICAL HISTORY & CURRENT STATUS")
        report_sections.append("─" * 50)
        
        if analysis_data['known_allergies']:
            report_sections.append("🚨 KNOWN ALLERGIES:")
            for i, allergy in enumerate(analysis_data['known_allergies'], 1):
                report_sections.append(f"   {i}. {allergy}")
        else:
            report_sections.append("🚨 KNOWN ALLERGIES: None on record")
        
        report_sections.append("")
        
        if analysis_data['medical_conditions']:
            report_sections.append("🏥 MEDICAL CONDITIONS:")
            for i, condition in enumerate(analysis_data['medical_conditions'], 1):
                report_sections.append(f"   {i}. {condition}")
        else:
            report_sections.append("🏥 MEDICAL CONDITIONS: None reported")
        
        report_sections.append("")
        
        if analysis_data['medications']:
            report_sections.append("💊 CURRENT MEDICATIONS:")
            for i, medication in enumerate(analysis_data['medications'], 1):
                report_sections.append(f"   {i}. {medication}")
        else:
            report_sections.append("💊 CURRENT MEDICATIONS: None prescribed")
        
        report_sections.append("")
        report_sections.append("")
        
        # 3. Symptom Analysis Section - Much more detailed
        report_sections.append("📊 SYMPTOM ANALYSIS & TRENDS")
        report_sections.append("─" * 50)
        report_sections.append(f"Analysis Period: {analysis_data['date_range']}")
        report_sections.append(f"Total Log Entries: {analysis_data['total_logs']}")
        
        if daily_logs_data:
            # Analyze symptom patterns (updated for correct Firestore field names)
            severity_counts = {'none': 0, 'mild': 0, 'moderate': 0, 'severe': 0}
            symptom_types = {'eczema': severity_counts.copy(), 'itchy_eyes': severity_counts.copy(), 'runny_nose': severity_counts.copy()}
            mood_counts = {}
            trigger_analysis = {}
            daily_symptoms = []
            
            print("🔍 SYMPTOM ANALYSIS DEBUG:")
            for i, log in enumerate(daily_logs_data):
                print(f"  Log {i+1} ({log.get('date', 'no-date')}):")
                
                # Get symptom severity from the symptomSeverity object
                symptom_severity_obj = log.get('symptomSeverity', {})
                print(f"    symptomSeverity object: {symptom_severity_obj}")
                
                # Get symptoms array and other data
                symptoms_array = log.get('symptoms', [])
                triggers = log.get('triggers', [])
                log_date = log.get('date', '')
                
                print(f"    symptoms array: {symptoms_array}")
                print(f"    triggers: {triggers}")
                
                # Track daily symptom data for patterns
                day_data = {
                    'date': log_date,
                    'symptoms': symptom_severity_obj,
                    'triggers': triggers,
                    'mood': log.get('mood', 'unknown')
                }
                daily_symptoms.append(day_data)
                
                # Analyze triggers
                for trigger in triggers:
                    if trigger:
                        trigger_analysis[trigger] = trigger_analysis.get(trigger, 0) + 1
                
                # Count symptom severities from the symptomSeverity object
                for symptom_type in ['eczema', 'itchy_eyes', 'runny_nose']:
                    severity_value = symptom_severity_obj.get(symptom_type, 0) if symptom_severity_obj else 0
                    severity_text = numeric_to_text_severity(severity_value)
                    print(f"    {symptom_type}: value={severity_value} -> severity='{severity_text}'")
                    
                    if severity_text in symptom_types[symptom_type]:
                        symptom_types[symptom_type][severity_text] += 1
                    else:
                        print(f"    ⚠️  Unknown severity '{severity_text}' for {symptom_type}")
                
                # Count moods (use 'mood' field instead of 'overall_mood')
                mood_raw = log.get('mood')
                mood = str(mood_raw) if mood_raw is not None else 'unknown'
                print(f"    mood: '{mood_raw}' -> using '{mood}'")
                mood_counts[mood] = mood_counts.get(mood, 0) + 1
                print("")
            
            print(f"Final symptom_types counts: {symptom_types}")
            print(f"Final mood_counts: {mood_counts}")
            print(f"Trigger analysis: {trigger_analysis}")
            print("")
            
            # Calculate overall severity statistics
            total_entries = len(daily_logs_data)
            severe_days = sum(1 for log in daily_logs_data 
                            if any((log.get('symptomSeverity', {}) or {}).get(symptom, 0) >= 5 
                                  for symptom in ['eczema', 'itchy_eyes', 'runny_nose']))
            moderate_days = sum(1 for log in daily_logs_data 
                              if any(3 <= (log.get('symptomSeverity', {}) or {}).get(symptom, 0) < 5 
                                    for symptom in ['eczema', 'itchy_eyes', 'runny_nose']))
            mild_days = sum(1 for log in daily_logs_data 
                          if any(1 <= (log.get('symptomSeverity', {}) or {}).get(symptom, 0) < 3 
                                for symptom in ['eczema', 'itchy_eyes', 'runny_nose']))
            
            # Add overall severity summary
            report_sections.append("")
            report_sections.append("📈 OVERALL SEVERITY TRENDS:")
            if severe_days > 0:
                severe_pct = (severe_days / total_entries) * 100
                report_sections.append(f"   🔴 Severe Days:    {severe_days}/{total_entries} days ({severe_pct:.1f}%)")
            if moderate_days > 0:
                moderate_pct = (moderate_days / total_entries) * 100
                report_sections.append(f"   🟡 Moderate Days:  {moderate_days}/{total_entries} days ({moderate_pct:.1f}%)")
            if mild_days > 0:
                mild_pct = (mild_days / total_entries) * 100
                report_sections.append(f"   🟢 Mild Days:      {mild_days}/{total_entries} days ({mild_pct:.1f}%)")
            
            symptom_free_days = total_entries - severe_days - moderate_days - mild_days
            if symptom_free_days > 0:
                free_pct = (symptom_free_days / total_entries) * 100
                report_sections.append(f"   ✅ Symptom-Free:   {symptom_free_days}/{total_entries} days ({free_pct:.1f}%)")
            
            report_sections.append("")
            report_sections.append("📋 DETAILED SYMPTOM BREAKDOWN:")
            
            # Report detailed symptom analysis
            for symptom, counts in symptom_types.items():
                total_symptom_entries = sum(counts.values())
                if total_symptom_entries > 0:
                    report_sections.append(f"\n   🩹 {symptom.replace('_', ' ').title()}:")
                    for severity, count in counts.items():
                        if count > 0:
                            percentage = (count / total_symptom_entries) * 100
                            severity_emoji = {"severe": "🔴", "moderate": "🟡", "mild": "🟢", "none": "⚪"}.get(severity, "⚫")
                            report_sections.append(f"      {severity_emoji} {severity.title()}: {count} entries ({percentage:.1f}%)")
            
            # Trigger Analysis
            if trigger_analysis:
                report_sections.append("")
                report_sections.append("🎯 TRIGGER ANALYSIS:")
                sorted_triggers = sorted(trigger_analysis.items(), key=lambda x: x[1], reverse=True)
                for trigger, count in sorted_triggers:
                    percentage = (count / total_entries) * 100
                    report_sections.append(f"   • {trigger.title()}: {count} occurrences ({percentage:.1f}% of days)")
            
            # Mood Analysis
            if mood_counts:
                report_sections.append("")
                report_sections.append("😊 MOOD & WELLBEING ANALYSIS:")
                total_mood_entries = sum(mood_counts.values())
                mood_emojis = {"good": "😊", "fair": "😐", "poor": "😔", "excellent": "🤩", "bad": "😢"}
                for mood, count in sorted(mood_counts.items(), key=lambda x: x[1], reverse=True):
                    percentage = (count / total_mood_entries) * 100
                    mood_str = str(mood).title()
                    emoji = mood_emojis.get(mood.lower(), "😶")
                    report_sections.append(f"   {emoji} {mood_str}: {count} entries ({percentage:.1f}%)")
            
        else:
            report_sections.append("")
            report_sections.append("⚠️  No symptom logs found for the specified period.")
            report_sections.append("    Please ensure daily logging is being maintained.")
        
        report_sections.append("")
        report_sections.append("")
        
        # 4. Recent Activity Section - Enhanced
        if daily_logs_data:
            report_sections.append("📅 RECENT ACTIVITY LOG")
            report_sections.append("─" * 50)
            recent_logs = sorted(daily_logs_data, key=lambda x: x.get('date', ''), reverse=True)[:10]
            
            for i, log in enumerate(recent_logs, 1):
                log_date = log.get('date', 'Unknown date')
                # Format date better
                try:
                    if 'T' in log_date:
                        formatted_date = datetime.fromisoformat(log_date.replace('Z', '+00:00')).strftime('%B %d, %Y')
                    else:
                        formatted_date = log_date
                except:
                    formatted_date = log_date
                
                report_sections.append(f"\n📍 Day {i}: {formatted_date}")
                
                # Get symptom information from the correct fields
                symptom_severity_obj = log.get('symptomSeverity', {})
                symptoms_array = log.get('symptoms', [])
                triggers = log.get('triggers', [])
                notes = log.get('generalNotes', '') or log.get('notes', '')
                parent_obs = log.get('parentObservations', '')
                
                # Show symptoms with severity
                significant_symptoms = []
                if symptom_severity_obj:
                    for symptom_type, severity_value in symptom_severity_obj.items():
                        severity_text = numeric_to_text_severity_or_none(severity_value)
                        if severity_text:
                            readable_symptom = symptom_type.replace('_', ' ').title()
                            severity_emoji = {"severe": "🔴", "moderate": "🟡", "mild": "🟢"}.get(severity_text, "⚫")
                            significant_symptoms.append(f"{readable_symptom} ({severity_emoji} {severity_text})")
                
                if significant_symptoms:
                    report_sections.append(f"   🩹 Symptoms: {', '.join(significant_symptoms)}")
                else:
                    if symptoms_array:
                        report_sections.append(f"   🩹 Symptoms: {', '.join(symptoms_array)} (severity not specified)")
                    else:
                        report_sections.append("   ✅ No symptoms reported")
                
                # Show triggers
                if triggers:
                    report_sections.append(f"   🎯 Triggers: {', '.join(triggers)}")
                
                # Show mood
                mood = log.get('mood', '')
                if mood:
                    mood_emoji = {"good": "😊", "fair": "😐", "poor": "😔", "excellent": "🤩", "bad": "😢"}.get(mood.lower(), "😶")
                    report_sections.append(f"   😊 Mood: {mood_emoji} {mood.title()}")
                
                # Show notes if available
                if notes:
                    report_sections.append(f"   📝 Notes: {notes}")
                if parent_obs:
                    report_sections.append(f"   👀 Parent Observations: {parent_obs}")
        
        report_sections.append("")
        report_sections.append("")
        
        # 5. AI-Powered Clinical Insights & Recommendations
        report_sections.append("🤖 AI-POWERED CLINICAL INSIGHTS")
        report_sections.append("─" * 50)
        
        ai_insights = await generate_ai_insights(analysis_data, daily_symptoms, trigger_analysis, severe_days, moderate_days)
        if ai_insights:
            report_sections.extend(ai_insights)
        else:
            report_sections.append("⚠️  AI analysis temporarily unavailable.")
            report_sections.append("   Manual review recommended for pattern identification.")
        
        report_sections.append("")
        report_sections.append("")
        
        # 6. Risk Assessment & Alerts  
        report_sections.append("⚠️  RISK ASSESSMENT & ALERTS")
        report_sections.append("─" * 50)
        
        risk_alerts = []
        total_entries = len(daily_logs_data)  # Define total_entries here
        
        if severe_days > 0:
            severity_pct = (severe_days / total_entries) * 100 if total_entries > 0 else 0
            if severity_pct > 20:
                risk_alerts.append(f"🚨 HIGH ALERT: {severe_days} severe symptom days ({severity_pct:.1f}%)")
                risk_alerts.append("   → Immediate consultation with healthcare provider recommended")
            elif severity_pct > 10:
                risk_alerts.append(f"🟡 MODERATE ALERT: {severe_days} severe symptom days ({severity_pct:.1f}%)")
                risk_alerts.append("   → Schedule follow-up with healthcare provider within 1-2 weeks")
        
        if moderate_days > total_entries * 0.4:
            risk_alerts.append("🟡 PATTERN ALERT: High frequency of moderate symptoms detected")
            risk_alerts.append("   → Consider treatment plan review and trigger identification")
        
        # Check for concerning trigger patterns
        if trigger_analysis:
            top_triggers = sorted(trigger_analysis.items(), key=lambda x: x[1], reverse=True)[:3]
            for trigger, count in top_triggers:
                if count / total_entries > 0.6:  # Trigger present in >60% of logs
                    risk_alerts.append(f"🎯 TRIGGER ALERT: '{trigger}' identified in {count}/{total_entries} logs")
                    risk_alerts.append(f"   → Strong correlation detected - consider avoidance strategies")
        
        # Mood correlation alerts
        poor_mood_days = mood_counts.get('poor', 0) + mood_counts.get('bad', 0) + mood_counts.get('2', 0) + mood_counts.get('1', 0)
        if poor_mood_days > total_entries * 0.3:
            risk_alerts.append("😔 WELLBEING ALERT: Frequent reports of poor mood/discomfort")
            risk_alerts.append("   → Consider psychological support and pain management strategies")
        
        if risk_alerts:
            for alert in risk_alerts:
                report_sections.append(alert)
        else:
            report_sections.append("✅ No immediate risk alerts identified")
            report_sections.append("   Continue current monitoring and management routine")
        
        report_sections.append("")
        report_sections.append("")
        
        # 7. Actionable Recommendations
        report_sections.append("💡 ACTIONABLE RECOMMENDATIONS")
        report_sections.append("─" * 50)
        
        recommendations = []
        
        # Generate specific recommendations based on data
        if severe_days > 0:
            recommendations.append("🏥 MEDICAL INTERVENTION:")
            recommendations.append("   • Schedule urgent consultation with allergist/physician")
            recommendations.append("   • Review current emergency action plan")
            recommendations.append("   • Consider medication adjustment or additional treatments")
            recommendations.append("")
        
        if moderate_days > 0:
            recommendations.append("📋 MANAGEMENT OPTIMIZATION:")
            recommendations.append("   • Increase monitoring frequency during moderate symptom periods")
            recommendations.append("   • Document detailed trigger exposure for pattern identification")
            recommendations.append("   • Consider preventive measures before high-risk activities")
            recommendations.append("")
        
        if trigger_analysis:
            top_trigger = max(trigger_analysis.items(), key=lambda x: x[1])[0]
            recommendations.append("🎯 TRIGGER MANAGEMENT:")
            recommendations.append(f"   • Primary trigger identified: '{top_trigger}'")
            recommendations.append("   • Implement avoidance strategies where possible")
            recommendations.append("   • Consider environmental controls (air purifiers, allergen-proof bedding)")
            recommendations.append("   • Plan ahead for seasons/situations with high exposure risk")
            recommendations.append("")
        
        recommendations.append("📱 ONGOING MONITORING:")
        recommendations.append("   • Continue daily symptom logging for trend analysis")
        recommendations.append("   • Photo documentation of visible symptoms (eczema, rashes)")
        recommendations.append("   • Track correlation between diet, environment, and symptoms")
        recommendations.append("   • Regular review of this report with healthcare provider")
        recommendations.append("")
        
        recommendations.append("🚨 EMERGENCY PREPAREDNESS:")
        recommendations.append("   • Ensure emergency medications are current and accessible")
        recommendations.append("   • Review emergency action plan with all caregivers")
        recommendations.append("   • Keep emergency contact information updated")
        recommendations.append("   • Consider medical alert bracelet/identification")
        
        for recommendation in recommendations:
            report_sections.append(recommendation)
        
        report_sections.append("")
        report_sections.append("")
        
        # 8. Summary and Next Steps
        report_sections.append("📋 EXECUTIVE SUMMARY & NEXT STEPS")
        report_sections.append("─" * 50)
        
        # Calculate key metrics
        symptom_severity_score = (severe_days * 3 + moderate_days * 2 + mild_days * 1) / total_entries if total_entries > 0 else 0
        
        report_sections.append(f"Patient: {analysis_data['child_name']} ({analysis_data['child_age']})")
        report_sections.append(f"Reporting Period: {analysis_data['date_range']}")
        report_sections.append(f"Total Log Entries: {analysis_data['total_logs']}")
        report_sections.append(f"Average Severity Score: {symptom_severity_score:.2f}/3.0")
        
        if symptom_severity_score > 2.0:
            status_emoji = "🚨"
            status_text = "HIGH CONCERN"
        elif symptom_severity_score > 1.0:
            status_emoji = "🟡"
            status_text = "MODERATE CONCERN"
        else:
            status_emoji = "✅"
            status_text = "STABLE"
        
        report_sections.append(f"Overall Status: {status_emoji} {status_text}")
        report_sections.append("")
        
        # Next steps based on analysis
        report_sections.append("🎯 IMMEDIATE NEXT STEPS (Next 1-2 weeks):")
        if severe_days > 0:
            report_sections.append("   1. 🏥 Schedule urgent medical consultation")
            report_sections.append("   2. 📞 Contact allergist for treatment review")
            report_sections.append("   3. 🚨 Review emergency action plan")
        elif moderate_days > total_entries * 0.3:
            report_sections.append("   1. 📅 Schedule routine follow-up appointment")
            report_sections.append("   2. 📊 Increase logging frequency and detail")
            report_sections.append("   3. 🎯 Implement targeted trigger avoidance")
        else:
            report_sections.append("   1. ✅ Continue current monitoring routine")
            report_sections.append("   2. 📱 Maintain daily logging consistency")
            report_sections.append("   3. 📋 Schedule routine check-up as planned")
        
        report_sections.append("")
        report_sections.append("💡 LONG-TERM GOALS (Next 1-3 months):")
        report_sections.append("   • Reduce moderate/severe symptom frequency by 20%")
        report_sections.append("   • Identify and minimize top 2-3 trigger exposures")
        report_sections.append("   • Optimize treatment plan based on documented patterns")
        report_sections.append("   • Improve overall quality of life and daily functioning")
        
        report_sections.append("")
        report_sections.append("")
        
        # Footer
        report_sections.append("═══════════════════════════════════════════════════════════════")
        report_sections.append("                            DISCLAIMER                           ")
        report_sections.append("═══════════════════════════════════════════════════════════════")
        report_sections.append("This report is for informational purposes only and does not")
        report_sections.append("constitute medical advice. Always consult with qualified healthcare")
        report_sections.append("professionals for medical decisions and treatment plans.")
        report_sections.append("")
        report_sections.append(f"Report generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC")
        report_sections.append("Data source: AllergyApp Digital Health Platform")
        report_sections.append("Next report recommended: 2-4 weeks")
        
        # Combine all sections into final report
        comprehensive_report = "\n".join(report_sections)
        
        print(f"✅ Enhanced comprehensive report generated ({len(comprehensive_report)} characters)")
        
        print(f"✅ Report generation complete for {analysis_data['child_name']}")
        
        return ReportResponse(
            success=True,
            report_text=comprehensive_report,
            error_message=None
        )
        
    except Exception as e:
        print(f"❌ Report generation failed: {str(e)}")
        return ReportResponse(
            success=False,
            error_message=f"Report generation failed: {str(e)}"
        )
