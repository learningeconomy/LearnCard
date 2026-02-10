
export type SkillRenderData = {
    skill: {
        id: string;
        statement: string;
        description?: string;
        code?: string;
        icon?: string;
    };
    framework: {
        id: string;
        name: string;
    };
};

export const renderSkillPage = (data: SkillRenderData): string => {
    const { skill, framework } = data;
    const title = `${skill.statement} | ${framework.name}`;
    const description = skill.description || `Explore the ${skill.statement} skill in the ${framework.name} framework.`;
    
    const brand = process.env.APP_BRAND || 'scouts';
    const appUrl = brand === 'lca' 
        ? `https://learncard.com/frameworks/${framework.id}/skills/${skill.id}`
        : `https://scoutnetwork.org/frameworks/${framework.id}/skills/${skill.id}`;

    let theme = {
        bgColor: '#5b2994',
        cardBg: '#ffffff',
        primary: '#5b2994',
        text: '#000000',
        textMuted: '#666666',
        logoUrl: 'https://cdn.filestackcontent.com/bVO0X4JITFypGBTNSOjE', // Scouts Logo
        logoAlt: 'ScoutPass'
    };

    if (brand === 'lca') {
        theme = {
            bgColor: '#00ba88',
            cardBg: '#ffffff',
            primary: '#00ba88',
            text: '#000000',
            textMuted: '#666666',
            logoUrl: 'https://cdn.filestackcontent.com/S2N8iyiaQNaRPiqijnq7', // LCA Logo
            logoAlt: 'LearnCard'
        };
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    
    <!-- OpenGraph / Social Media -->
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${appUrl}">
    <meta property="og:image" content="https://network.learncard.com/assets/icon/icon.png">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --bg-color: ${theme.bgColor};
            --card-bg: ${theme.cardBg};
            --primary: ${theme.primary};
            --text: ${theme.text};
            --text-muted: ${theme.textMuted};
        }

        body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
            background-color: var(--bg-color);
            color: var(--text);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            overflow: hidden;
        }

        .container {
            position: relative;
            z-index: 1;
            padding: 20px;
            width: 100%;
            max-width: 400px;
        }

        .card {
            background: var(--card-bg);
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            text-align: center;
            animation: fadeIn 0.8s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .logo {
            margin-bottom: 30px;
            display: flex;
            justify-content: center;
        }

        .logo img {
            max-height: 60px;
            max-width: 100%;
        }

        .skill-icon {
            width: 80px;
            height: 80px;
            background: #f0f0f5;
            border-radius: 20px;
            margin: 0 auto 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
        }

        h1 {
            font-size: 24px;
            font-weight: 800;
            margin: 0 0 12px;
            color: var(--text);
        }

        .description {
            font-size: 15px;
            line-height: 1.5;
            color: var(--text-muted);
            margin-bottom: 24px;
        }

        .framework-tag {
            display: inline-block;
            padding: 4px 12px;
            background: rgba(255, 255, 255, 0.9);
            color: var(--primary);
            border: 1px solid var(--primary);
            border-radius: 100px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 24px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="logo">
                <img src="${theme.logoUrl}" alt="${theme.logoAlt}" onerror="this.onerror=null; this.parentElement.innerHTML='<span style=\'font-weight:800; color:${theme.primary}; font-size: 20px;\'>${theme.logoAlt}</span>'">
            </div>

            <div class="skill-icon">
                ${skill.icon || '🧠'}
            </div>

            <div class="framework-tag">${framework.name}</div>

            <h1>${skill.statement}</h1>
            
            <p class="description">${description}</p>
        </div>
    </div>
</body>
</html>`;
};
