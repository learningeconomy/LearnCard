import { test, expect } from '@playwright/test';

const MOCK_SCOUT_NEWS_DATA = {
    data: [
        {
            author: 'Africa Scout Region',
            last_update_date:
                '<time datetime="2025-03-10T08:32:46+01:00">2025-03-10T08:32:46</time>\n',
            node_id: '5563',
            path: '/founders-day-Nyeri-2025',
            preview_image: '/sites/default/files/2025-03/nyeri_founders_day_20251.jpg',
            preview_text:
                '<p>Under the theme <em>“Inspiring Climate Change Solutions,”</em> celebrations kicked off with a procession from Paxtu, Baden-Powell’s former residence at the Outspan Hotel. Scouts and officials then headed to the Baden-Powell Historical Gardens, where a solemn wreath-laying ceremony paid tribute to the founder.&nbsp;</p>\n',
            publish_date: '<time datetime="2025-03-10T08:32:46+01:00">2025-03-10T08:32:46</time>\n',
            tags: 'Regional Events',
            title: '10,000 Scouts gather in Nyeri, Kenya to commemorate Founders Day',
        },
        {
            author: 'Interamerican Scout Region',
            last_update_date:
                '<time datetime="2025-02-27T00:38:34+01:00">2025-02-27T00:38:34</time>\n',
            node_id: '5560',
            path: '/ScoutsGuatemalaEarthTribeInternational',
            preview_image: '/sites/default/files/2025-02/baplo2t0.png',
            preview_text:
                '<p>La iniciativa Earth Tribe ha sido reconocida en el concurso Mentes en Verde, destacándose como un modelo de educación ambiental y acción juvenil. Con más de 350,000 jóvenes involucrados en América Latina, este programa está transformando comunidades y promoviendo el desarrollo sostenible.</p>\n',
            publish_date: '<time datetime="2025-02-27T00:38:34+01:00">2025-02-27T00:38:34</time>\n',
            tags: 'Environment',
            title: 'World Scouting receives international recognition for its environmental impact in Interamerica ',
        },
    ],
    pager: {
        pages: 1,
        current_page: 0,
    },
};

test('Renders news feed items', async ({ page }) => {
    let intercepted = false;
    await page.route('**/corsproxy.io/**', route => {
        intercepted = true;

        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(MOCK_SCOUT_NEWS_DATA),
        });
    });

    await page.goto('https://localhost:3000/campfire');
    await page.reload();

    await page.waitForTimeout(1000);

    if (intercepted) {
        await expect(
            page.getByRole('heading', { name: '10,000 Scouts gather in Nyeri' })
        ).toBeVisible();
        await expect(page.getByRole('heading', { name: 'World Scouting receives' })).toBeVisible();
    }
});
