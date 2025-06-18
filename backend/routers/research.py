from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database.database import get_db
from schemas.schemas import ResearchArticleResponse
from crud.crud import get_research_articles
from utils.auth import get_current_user
from models.models import User

router = APIRouter()

# Mock research data for demo purposes
MOCK_RESEARCH_ARTICLES = [
    {
        "id": 1,
        "title": "New Insights into Childhood Eczema Management",
        "summary": "Recent studies show that early intervention with moisturizing routines can significantly reduce eczema flare-ups in children. This comprehensive review examines the latest evidence-based approaches to managing atopic dermatitis.",
        "source": "Journal of Pediatric Dermatology",
        "publication_date": datetime(2024, 1, 15),
        "url": "https://example.com/research/eczema-management-2024",
        "tags": ["eczema", "children", "treatment", "dermatitis"],
        "created_at": datetime.utcnow()
    },
    {
        "id": 2,
        "title": "Food Allergies in Toddlers: Prevention and Early Detection",
        "summary": "A landmark study involving 10,000 children reveals new guidelines for introducing allergenic foods to reduce the risk of developing food allergies. The research emphasizes the importance of timing and gradual exposure.",
        "source": "Allergy and Immunology Research",
        "publication_date": datetime(2024, 1, 20),
        "url": "https://example.com/research/food-allergies-prevention",
        "tags": ["food allergies", "toddlers", "prevention", "immunology"],
        "created_at": datetime.utcnow()
    },
    {
        "id": 3,
        "title": "Environmental Triggers and Asthma in Urban Children",
        "summary": "This longitudinal study examines how air quality, pollen levels, and urban pollutants affect asthma symptoms in children aged 2-12. The research provides actionable insights for parents living in metropolitan areas.",
        "source": "Environmental Health Perspectives",
        "publication_date": datetime(2024, 1, 25),
        "url": "https://example.com/research/asthma-environmental-triggers",
        "tags": ["asthma", "environment", "air quality", "children"],
        "created_at": datetime.utcnow()
    },
    {
        "id": 4,
        "title": "The Role of Gut Microbiome in Allergic Diseases",
        "summary": "Emerging research suggests that the gut microbiome plays a crucial role in the development and management of allergic diseases. This review explores probiotics and dietary interventions for children with allergies.",
        "source": "Microbiome and Health Journal",
        "publication_date": datetime(2024, 2, 1),
        "url": "https://example.com/research/gut-microbiome-allergies",
        "tags": ["microbiome", "allergies", "probiotics", "diet"],
        "created_at": datetime.utcnow()
    },
    {
        "id": 5,
        "title": "Digital Health Tools for Allergy Management",
        "summary": "A systematic review of mobile apps and digital platforms used for tracking and managing childhood allergies. The study evaluates effectiveness and provides recommendations for parents and healthcare providers.",
        "source": "Digital Health Innovation",
        "publication_date": datetime(2024, 2, 5),
        "url": "https://example.com/research/digital-allergy-management",
        "tags": ["digital health", "mobile apps", "allergy tracking", "technology"],
        "created_at": datetime.utcnow()
    }
]

@router.get("/feed", response_model=List[ResearchArticleResponse])
def get_research_feed(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # For demo purposes, return mock data
    # In production, this would query the database and potentially integrate with medical research APIs
    
    start_idx = skip
    end_idx = skip + limit
    
    return [
        ResearchArticleResponse(**article) 
        for article in MOCK_RESEARCH_ARTICLES[start_idx:end_idx]
    ]

# In production, you might want to add endpoints for:
# - Searching articles by keywords
# - Filtering by tags or publication date
# - Saving favorite articles
# - Getting personalized recommendations based on child's conditions
