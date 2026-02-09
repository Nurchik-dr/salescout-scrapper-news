export function calculateViralScore(
    views: number,
    likes: number,
    comments: number,
    createdAt: string
) {
    if (views <= 0) return 0;

    const now = Date.now();
    const published = new Date(createdAt).getTime();
    const hoursAge = Math.max((now - published) / 3600000, 0.5);

    // 1. Engagement Rate (ключевая метрика для Instagram)
    const engagementRate = (likes + comments * 3) / views;

    // 2. Скорость набора просмотров (views per hour)
    const viewVelocity = views / hoursAge;

    // 3. Time decay (мягкий, актуальность падает за 7 дней)
    const agePenalty = 1 / (1 + hoursAge / 168); // 168h = 7 days

    // 4. Абсолютная популярность (логарифм для сглаживания)
    const popularityBonus = Math.log10(views + 1);

    // Итоговая формула
    const score = (
        engagementRate * 10000 +           // вовлеченность (вес 50%)
        Math.log10(viewVelocity + 1) * 3000 + // скорость (вес 30%)
        agePenalty * 2000 +                 // свежесть (вес 10%)
        popularityBonus * 200               // масштаб (вес 10%)
    );

    return Math.round(score);
}