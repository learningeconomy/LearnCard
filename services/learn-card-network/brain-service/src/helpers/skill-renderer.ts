
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
    
    // Deep link to the scouts app
    const appUrl = `https://scoutnetwork.org/frameworks/${framework.id}/skills/${skill.id}`;

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
            --bg-color: #0c122b;
            --card-bg: rgba(255, 255, 255, 0.05);
            --primary: #20c397;
            --secondary: #41cef2;
            --text: #ffffff;
            --text-muted: #8b91a7;
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
            background: radial-gradient(circle at top right, #1a2b5a, transparent),
                        radial-gradient(circle at bottom left, #0a4633, transparent);
        }

        .container {
            position: relative;
            z-index: 1;
            padding: 20px;
            width: 100%;
            max-width: 500px;
        }

        .glass-card {
            background: var(--card-bg);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            text-align: center;
            animation: fadeIn 0.8s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .logo {
            font-weight: 800;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: var(--primary);
            margin-bottom: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .logo span {
            color: var(--text);
        }

        .skill-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            border-radius: 20px;
            margin: 0 auto 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            box-shadow: 0 10px 20px rgba(32, 195, 151, 0.3);
        }

        h1 {
            font-size: 32px;
            font-weight: 800;
            margin: 0 0 16px;
            background: linear-gradient(to right, #fff, #a8acbd);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .description {
            font-size: 16px;
            line-height: 1.6;
            color: var(--text-muted);
            margin-bottom: 32px;
        }

        .framework-tag {
            display: inline-block;
            padding: 6px 14px;
            background: rgba(65, 206, 242, 0.1);
            color: var(--secondary);
            border-radius: 100px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 40px;
        }

        .cta-button {
            display: block;
            background: var(--primary);
            color: var(--bg-color);
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 14px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 14px 0 rgba(32, 195, 151, 0.39);
        }

        .cta-button:hover {
            transform: scale(1.02);
            box-shadow: 0 6px 20px rgba(32, 195, 151, 0.45);
            background: #2de3af;
        }

        .background-blobs {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 0;
            pointer-events: none;
        }

        .blob {
            position: absolute;
            width: 400px;
            height: 400px;
            background: var(--primary);
            filter: blur(100px);
            opacity: 0.1;
            border-radius: 50%;
        }

        .blob-1 { top: -100px; right: -100px; background: var(--secondary); }
        .blob-2 { bottom: -100px; left: -100px; }
    </style>
</head>
<body>
    <div class="background-blobs">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
    </div>

    <div class="container">
        <div class="glass-card">
            <div class="logo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                SCOUT <span>NETWORK</span>
            </div>

            <div class="skill-icon">
                ${skill.icon || '🧠'}
            </div>

            <div class="framework-tag">${framework.name}</div>

            <h1>${skill.statement}</h1>
            
            <p class="description">${description}</p>

            <a href="${appUrl}" class="cta-button">Open in Scouts App</a>
        </div>
    </div>
</body>
</html>`;
};
