import React from 'react';
import TopBar from '../common/TopBar';
import BottomNavigation from '../common/BottomNavigation';

const ResearchFeedScreen = () => {
  const topBarActions = [
    { icon: '🔍', label: 'Search', onClick: () => {} },
    { icon: '⚙️', label: 'Settings', onClick: () => {} }
  ];

  const articles = [
    {
      icon: '📰',
      title: 'Understanding Allergies in Children',
      subtitle: 'A deep dive into childhood allergies',
      source: 'Allergy Journal',
      date: 'October 2, 2024'
    },
    {
      icon: '📖',
      title: 'New Developments in Oral Immunotherapy',
      subtitle: 'The latest research on Oral Immunotherapy',
      source: 'Allergy Insights',
      date: 'October 1, 2024'
    },
    {
      icon: '🌿',
      title: 'Climate Change and Environmental Allergies',
      subtitle: 'What the latest studies reveal',
      source: 'Research Today',
      date: 'September 28, 2024'
    }
  ];

  const popularTopics = [
    {
      title: 'Food Allergies',
      subtitle: 'Exploring various food allergies and their management.',
      imageUrl: 'https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-07-21/tsgjnrVYCE.png'
    },
    {
      title: 'Seasonal Allergies',
      subtitle: 'Understanding and managing pollen allergies during the seasons.',
      imageUrl: 'https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-07-21/LAqiijMNMK.png'
    },
    {
      title: 'Treatment and Medications',
      subtitle: 'Latest treatments and medication updates for allergy management.',
      imageUrl: 'https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-07-21/H3fGx0t4wX.png'
    }
  ];

  return (
    <div className="mobile-container">
      <div className="screen">
        <TopBar title="Research Feed" showBack={true} actions={topBarActions} />
        
        <main className="screen-content">
          <section style={{ padding: '0px 12px', marginTop: '16px' }}>
            <div className="section-header">
              <h2 className="section-title">Latest Articles</h2>
            </div>
            
            {articles.map((article, index) => (
              <div key={index}>
                <div className="list-item" style={{ padding: '12px 0px', alignItems: 'flex-start' }}>
                  <div className="list-item-icon">
                    {article.icon}
                  </div>
                  <div style={{ flex: 1, display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 className="list-item-title" style={{ marginBottom: '4px' }}>
                        {article.title}
                      </h3>
                      <p className="list-item-subtitle">
                        {article.subtitle}
                      </p>
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#000000',
                      textAlign: 'right',
                      minWidth: '100px'
                    }}>
                      <div>Source: {article.source},</div>
                      <div>{article.date}</div>
                    </div>
                  </div>
                </div>
                {index < articles.length - 1 && (
                  <div style={{ height: '1px', background: 'rgba(0, 0, 0, 0.1)', margin: '0px' }} />
                )}
              </div>
            ))}
          </section>

          <section style={{ padding: '0px 12px', marginTop: '16px' }}>
            <div className="section-header">
              <h2 className="section-title">Popular Research Topics</h2>
            </div>
            
            {popularTopics.map((topic, index) => (
              <div key={index}>
                <div className="list-item" style={{ padding: '8px 0px' }}>
                  <div style={{ width: '80px', height: '80px', marginRight: '12px' }}>
                    <img 
                      src={topic.imageUrl}
                      alt={topic.title}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                  <div className="list-item-content">
                    <h3 style={{ 
                      fontFamily: 'Roboto',
                      fontWeight: '500',
                      fontSize: '16px',
                      lineHeight: '20px',
                      color: '#000000',
                      marginBottom: '4px'
                    }}>
                      {topic.title}
                    </h3>
                    <p style={{ 
                      fontFamily: 'Roboto',
                      fontSize: '12px',
                      lineHeight: '20px',
                      color: '#000000'
                    }}>
                      {topic.subtitle}
                    </p>
                  </div>
                </div>
                {index < popularTopics.length - 1 && (
                  <div style={{ height: '1px', background: 'rgba(0, 0, 0, 0.1)', margin: '0px' }} />
                )}
              </div>
            ))}
          </section>

          <section style={{ padding: '0px 12px', marginTop: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-secondary">
                Share
              </button>
              <button className="btn btn-secondary">
                Save
              </button>
              <button className="btn btn-primary">
                Load More Articles
              </button>
            </div>
          </section>
        </main>

        <BottomNavigation />
      </div>
    </div>
  );
};

export default ResearchFeedScreen;
