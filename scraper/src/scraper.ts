import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import { VideoModel } from './video.model';
import {SearchTaskModel} from "./search-task.model";
import {calculateViralScore} from "./utils/viralCalculate";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Instagram cookies из .env
let COOKIES = {
    sessionid: process.env.INSTAGRAM_SESSIONID || '',
    mid: process.env.INSTAGRAM_MID || '',
    ig_did: process.env.INSTAGRAM_IG_DID || '',
    datr: process.env.INSTAGRAM_DATR || '',
    ds_user_id: process.env.INSTAGRAM_DS_USER_ID || '',
    csrftoken: process.env.INSTAGRAM_CSRFTOKEN || '',
    rur: process.env.INSTAGRAM_RUR || '',
    dpr: process.env.INSTAGRAM_DPR || '1',
    ig_nrcb: '1',
    ps_l: '1',
    ps_n: '1'
};

// Константы для мобильного API
const INSTAGRAM_MOBILE_UA = process.env.INSTAGRAM_MOBILE_USER_AGENT ||
    'Instagram 297.0.0.0.51 Android (33/13; 420dpi; 1080x2400; Google; Pixel 6; oriole; google; ru_RU; 461519910)';
const INSTAGRAM_MOBILE_APP_ID = '567067343352427';
const INSTAGRAM_MOBILE_API_BASE = 'https://i.instagram.com';
const INSTAGRAM_WEB_API_BASE = 'https://www.instagram.com';
const INSTAGRAM_WEB_APP_ID = '936619743392459';
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// WWW Claim кэширование
let cachedWWWClaim: string | null = null;
let lastWWWClaimFetch = 0;
const WWW_CLAIM_TTL = 5 * 60 * 1000; // 5 минут

// Получение cookie строки
function getCookieString(): string {
    return Object.entries(COOKIES)
        .filter(([_, value]) => value)
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
}

// Получение WWW Claim
async function ensureWWWClaim(force = false): Promise<string> {
    const now = Date.now();
    if (!force && cachedWWWClaim && (now - lastWWWClaimFetch) < WWW_CLAIM_TTL) {
        return cachedWWWClaim;
    }

    try {
        const claimUrl = `${INSTAGRAM_WEB_API_BASE}/api/v1/web/fxcal/ig_sso_users/`;

        const response = await axios.post(
            claimUrl,
            null,
            {
                headers: {
                    'User-Agent': DESKTOP_UA,
                    'Accept': '*/*',
                    'Cookie': getCookieString(),
                    'X-CSRFToken': COOKIES.csrftoken,
                    'X-IG-App-ID': INSTAGRAM_WEB_APP_ID,
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                timeout: 15000,
                validateStatus: (status) => status < 500
            }
        );

        const claim = response.headers['x-ig-set-www-claim'] || response.headers['x-ig-www-claim'];
        if (claim) {
            cachedWWWClaim = claim;
            lastWWWClaimFetch = Date.now();
            console.log(`   ✅ WWW claim obtained: ${claim.substring(0, 20)}...`);
            return claim;
        }
    } catch (error: any) {
        console.log(`   ⚠️  Could not get WWW claim: ${error.message}`);
    }

    return cachedWWWClaim || '0';
}

// Заголовки для Web API
function buildWebHeaders(refererPath: string = '/', wwwClaimOverride?: string) {
    return {
        'User-Agent': DESKTOP_UA,
        'Accept': '*/*',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'X-IG-App-ID': INSTAGRAM_WEB_APP_ID,
        'X-ASBD-ID': '359341',
        'X-CSRFToken': COOKIES.csrftoken,
        'X-IG-WWW-Claim': wwwClaimOverride ?? cachedWWWClaim ?? '0',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': `https://www.instagram.com${refererPath}`,
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Origin': 'https://www.instagram.com',
        'Cookie': getCookieString()
    };
}

// Заголовки для мобильного API
function buildMobileHeaders(refererTag?: string) {
    return {
        'User-Agent': INSTAGRAM_MOBILE_UA,
        'Accept': '*/*',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'X-IG-App-ID': INSTAGRAM_MOBILE_APP_ID,
        'X-ASBD-ID': '359341',
        'X-IG-Device-ID': COOKIES.ig_did || COOKIES.mid || '',
        'X-IG-Android-ID': COOKIES.mid || '',
        'X-IG-App-Locale': 'ru_RU',
        'X-IG-Device-Locale': 'ru_RU',
        'X-IG-Mapped-Locale': 'ru_RU',
        'X-IG-Timezone-Offset': '18000',
        'X-IG-Connection-Type': 'WIFI',
        'X-IG-Capabilities': '3brTvw==',
        'X-FB-HTTP-Engine': 'Liger',
        'X-CSRFToken': COOKIES.csrftoken,
        'X-IG-WWW-Claim': cachedWWWClaim || '0',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': refererTag
            ? `https://www.instagram.com/explore/tags/${encodeURIComponent(refererTag)}/`
            : 'https://www.instagram.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Origin': 'https://www.instagram.com',
        'Cookie': getCookieString()
    };
}

// Поиск по хештегу через Web API
async function searchReelsByHashtag(hashtag: string, maxId: string | null = null) {
    const cleanHashtag = hashtag.startsWith('#') ? hashtag.substring(1) : hashtag;
    console.log(`   🔍 Searching hashtag: "${cleanHashtag}"`);

    const body = new URLSearchParams({
        tab: 'clips',
        surface: 'grid'
    });
    if (maxId) {
        body.append('max_id', maxId);
    }

    const encodedHashtag = encodeURIComponent(cleanHashtag);
    const wwwClaim = await ensureWWWClaim();

    // Пробуем Web API
    try {
        const tagUrl = `${INSTAGRAM_WEB_API_BASE}/api/v1/tags/${encodedHashtag}/sections/`;
        console.log(`   📡 Web API: ${tagUrl}`);

        const response = await axios.post(
            tagUrl,
            body.toString(),
            {
                headers: {
                    ...buildWebHeaders(`/explore/tags/${encodeURIComponent(cleanHashtag)}/`, wwwClaim),
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                timeout: 30000,
                validateStatus: (status) => status < 500
            }
        );

        console.log(`   ✅ Web API response: ${response.status}`);

        if (response.status === 404 ||
            (response.data?.sections && response.data.sections.length === 0)) {
            console.log(`   ⚠️  Hashtag not found or empty`);
            throw new Error(`Hashtag not found: ${cleanHashtag}`);
        }

        return response.data;
    } catch (webError: any) {
        console.log(`   ⚠️  Web API failed: ${webError.message}, trying mobile API...`);
    }

    // Fallback на Mobile API
    try {
        const mobileUrl = `${INSTAGRAM_MOBILE_API_BASE}/api/v1/tags/${encodedHashtag}/sections/`;
        console.log(`   📡 Mobile API: ${mobileUrl}`);

        const response = await axios.post(
            mobileUrl,
            body.toString(),
            {
                headers: {
                    ...buildMobileHeaders(cleanHashtag),
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                timeout: 30000,
                validateStatus: (status) => status < 500
            }
        );

        console.log(`   ✅ Mobile API response: ${response.status}`);
        return response.data;
    } catch (mobileError: any) {
        console.log(`   ❌ Mobile API failed: ${mobileError.message}`);
        throw mobileError;
    }
}

// Общий поиск через Web API
async function searchHashtag(keyword: string, maxId: string | null = null, rankToken: string | null = null) {
    const cleanKeyword = keyword.startsWith('#') ? keyword.substring(1) : keyword;
    console.log(`   🔍 General search: "${cleanKeyword}"`);

    if (!rankToken) {
        rankToken = `${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
    }

    const params = new URLSearchParams({
        enable_metadata: 'true',
        query: cleanKeyword,
        search_session_id: '',
        rank_token: rankToken
    });

    if (maxId) {
        params.append('next_max_id', maxId);
    }

    const url = `${INSTAGRAM_WEB_API_BASE}/api/v1/fbsearch/web/top_serp/?${params.toString()}`;
    const wwwClaim = await ensureWWWClaim();

    const response = await axios.get(url, {
        headers: {
            ...buildWebHeaders(`/explore/search/keyword/?q=${encodeURIComponent(cleanKeyword)}`, wwwClaim),
            'X-Web-Session-ID': '',
            'Priority': 'u=1, i'
        },
        timeout: 30000
    });

    return response.data;
}

// Обработка Reel
function processReel(reel: any, searchQuery: string) {
    try {
        let media = reel.media || reel;

        if (reel.user && reel.media) {
            media = reel.media;
        }

        if (media?.media) {
            media = media.media;
        }

        if (!media || typeof media !== 'object') {
            return null;
        }

        // Проверка что это видео/Reels
        const isVideo = media.media_type === 2 ||
            media.product_type === 'clips' ||
            media.type === 2 ||
            reel.type === 'media' ||
            reel.result_type === 'media' ||
            (media.video_versions && media.video_versions.length > 0) ||
            media.video_url ||
            media.video_duration > 0;

        if (!isVideo && !media.image_versions2 && !media.carousel_media) {
            if (reel.type !== 'media' && reel.result_type !== 'media' && !media.id && !media.pk) {
                return null;
            }
        }

        // Метрики
        const timestamp = media.taken_at || media.created_time || Date.now() / 1000;
        const createdAt = new Date(timestamp * 1000).toISOString();
        const caption = media.caption?.text || media.caption_text || '';
        const likeCount = media.like_count || media.likes?.count || 0;
        const commentCount = media.comment_count || media.comments?.count || 0;
        const viewCount = media.play_count || media.view_count || media.reel_view_count ||
            media.video_view_count || media.views_count || media.video_play_count || 0;

        const location = media.location?.name || media.location?.city || media.location?.address || null;
        const videoUrl = media.video_versions?.[0]?.url || media.video_url || null;
        const shortcode = media.code || media.shortcode || '';

        const postUrl = shortcode
            ? `https://www.instagram.com/reel/${shortcode}/`
            : null;

        const user = media.user || reel.user || {};

        // Расчёт вирусности
        // const viralScore = viewCount > 0
        //     ? Math.round(((likeCount + commentCount * 10) / viewCount) * 1000)
        //     : likeCount > 0
        //         ? Math.round((commentCount * 10 / likeCount) * 100)
        //         : 0;

        console.log(
            'viralScore', {
                viewCount,
                likeCount,
                commentCount,
                date: createdAt,
            }
        )

        const viralScore = calculateViralScore(viewCount, likeCount, commentCount, createdAt )

        return {
            id: media.id || media.pk || shortcode || `reel_${Date.now()}_${Math.random()}`,
            videoId: media.id || media.pk || shortcode,
            shortcode,
            url: postUrl,
            videoUrl,
            previewUrl: media.image_versions2?.candidates?.[0]?.url ||
                media.thumbnail_src ||
                media.display_url,
            owner: {
                id: user.id || user.pk || user.user_id,
                username: user.username || 'unknown',
                full_name: user.full_name || '',
                profile_pic_url: user.profile_pic_url || user.profile_picture_url || '',
                is_verified: user.is_verified || false
            },
            caption,
            views: viewCount,
            likes: likeCount,
            comments: commentCount,
            location,
            is_video: true,
            product_type: media.product_type || 'clips',
            created_at: createdAt,
            viral_score: viralScore,
            is_viral: viralScore > 1000,
            keyword: searchQuery,
            scraped_at: new Date().toISOString()
        };
    } catch (error: any) {
        console.error(`   ❌ Error processing reel: ${error.message}`);
        return null;
    }
}

function shouldSaveVideo(reels: any): boolean {
    const now = Date.now();
    const publishedDate = new Date(reels.created_at).getTime();
    const ageInMonths = (now - publishedDate) / (1000 * 60 * 60 * 24 * 30);

    // Проверка 1: Если старше 6 месяцев — не сохраняем
    if (ageInMonths > 6) {
        console.log(`      ⏭️  Skipping: ${ageInMonths.toFixed(1)} months old (max 6 months)`);
        return false;
    }

    // Проверка 2: Если не вирусное — не сохраняем
    if (!reels.is_viral) {
        console.log(`      ⏭️  Skipping: not viral (score: ${reels.viral_score})`);
        return false;
    }

    return true;
}

// Детекция рекламы
function detectAd(post: any): { isAd: boolean; adScore: number } {
    let adScore = 0;
    const caption = post.caption?.toLowerCase() || '';

    const adKeywords = ['sponsored', 'ad', 'partnership', 'collab', '#ad', '#sponsored', 'реклама', 'партнёрство'];
    if (adKeywords.some(keyword => caption.includes(keyword))) {
        adScore += 40;
    }

    const hashtagCount = (caption.match(/#/g) || []).length;
    if (hashtagCount > 15) adScore += 20;

    const emojiCount = (caption.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu) || []).length;
    if (emojiCount > 10) adScore += 10;

    if (caption.length < 50 && post.likes > 10000) adScore += 15;

    if (post.owner?.is_verified && (caption.includes('link') || caption.includes('bio'))) {
        adScore += 15;
    }

    return {
        isAd: adScore >= 40,
        adScore: Math.min(adScore, 100)
    };
}

// ОСНОВНАЯ ФУНКЦИЯ СКРАПИНГА
export async function scrapeInstagram(hotWord: string, searchTaskId: string) {
    console.log(`\n🎬 Starting Instagram REELS scraper (Mobile API)`);
    console.log(`📝 Keyword: "${hotWord}"`);
    console.log(`🆔 Task ID: ${searchTaskId}`);

    try {
        // Устанавливаем статус "connect" - подключение к Instagram
        await SearchTaskModel.findByIdAndUpdate(searchTaskId, {
            status: 'connect',
            progress: 0
        });
        console.log(`📡 Status: connect`);

        // Проверка cookies
        if (!COOKIES.sessionid || !COOKIES.csrftoken) {
            await SearchTaskModel.findByIdAndUpdate(searchTaskId, { status: 'failed' });
            throw new Error('❌ Instagram cookies not configured');
        }

        const cleanKeyword = hotWord.replace(/^#/, '').trim();
        console.log(`✨ Clean keyword: "${cleanKeyword}"`);

        let allReels: any[] = [];
        let savedCount = 0;
        const maxPages = 20;
        const maxReelsTotal = 100;
        let currentPage = 1;
        let maxId: string | null = null;
        let rankToken: string | null = null;
        let hasNextPage = true;
        let methodUsed = '';

        const hasCyrillic = /[А-Яа-яЁё]/.test(cleanKeyword);
        if (hasCyrillic) {
            console.log(`🌐 Cyrillic detected in keyword`);
        }

        console.log(`\n🔄 Starting pagination (max ${maxPages} pages)...`);

        while (hasNextPage && currentPage <= maxPages && allReels.length < maxReelsTotal) {
            console.log(`\n📄 Page ${currentPage}/${maxPages}`);

            let pageReels: any[] = [];
            let data: any = null;

            // Попытка 1: Поиск по хештегу
            if (currentPage === 1 || methodUsed === 'hashtag') {
                try {
                    data = await searchReelsByHashtag(cleanKeyword, maxId);
                    console.log(`   ✅ Hashtag search succeeded`);

                    const hasSections = data?.sections && Array.isArray(data.sections) && data.sections.length > 0;
                    const hasMediaGrid = data?.media_grid?.sections &&
                        Array.isArray(data.media_grid.sections) &&
                        data.media_grid.sections.length > 0;

                    if (!hasSections && !hasMediaGrid) {
                        console.log(`   ⚠️  Empty results from hashtag`);
                        data = null;
                    } else {
                        methodUsed = 'hashtag';
                    }
                } catch (error: any) {
                    console.log(`   ⚠️  Hashtag search failed: ${error.message}`);
                    data = null;
                }
            }

            // Попытка 2: Общий поиск (fallback)
            if (!data && currentPage === 1) {
                try {
                    data = await searchHashtag(cleanKeyword, maxId, rankToken);
                    console.log(`   ✅ General search succeeded`);

                    if (data?.rank_token) {
                        rankToken = data.rank_token;
                    }

                    methodUsed = 'general';
                } catch (error: any) {
                    console.log(`   ⚠️  General search failed: ${error.message}`);
                }
            }

            if (!data) {
                console.log(`   ⚠️  No data on page ${currentPage}, stopping`);
                break;
            }

            // Извлечение Reels
            if (data.sections && Array.isArray(data.sections)) {
                console.log(`   📋 Processing ${data.sections.length} sections`);

                for (const section of data.sections) {
                    if (section.layout_content?.medias) {
                        const medias = section.layout_content.medias.map((item: any) => item.media || item).filter((m: any) => m);
                        pageReels.push(...medias);
                    } else if (section.layout_content?.two_by_two_item?.media) {
                        pageReels.push(section.layout_content.two_by_two_item.media);
                    } else if (section.media) {
                        pageReels.push(section.media);
                    } else if (section.items) {
                        pageReels.push(...section.items);
                    }
                }
            }

            if (data.media_grid) {
                if (Array.isArray(data.media_grid)) {
                    pageReels.push(...data.media_grid);
                } else if (data.media_grid.sections) {
                    for (const section of data.media_grid.sections) {
                        if (section.layout_content?.medias) {
                            const medias = section.layout_content.medias.map((item: any) => item.media || item).filter((m: any) => m);
                            pageReels.push(...medias);
                        }
                    }
                }
            }

            if (pageReels.length === 0 && data.items) {
                pageReels = data.items;
            }

            // Извлекаем видео из каруселей
            const expandedReels = [];
            for (const reel of pageReels) {
                let media = reel.media || reel;
                if (media?.media) media = media.media;

                const isCarousel = media && (media.media_type === 8 || media.product_type === 'carousel_container');

                if (isCarousel && media.carousel_media && Array.isArray(media.carousel_media)) {
                    for (const carouselItem of media.carousel_media) {
                        if (carouselItem.media_type === 2 ||
                            carouselItem.product_type === 'clips' ||
                            carouselItem.video_versions) {
                            expandedReels.push({
                                ...reel,
                                media: {
                                    ...media,
                                    media_type: carouselItem.media_type,
                                    video_versions: carouselItem.video_versions,
                                    video_url: carouselItem.video_url,
                                    code: carouselItem.code || media.code,
                                    pk: carouselItem.pk || media.pk
                                }
                            });
                        }
                    }
                } else {
                    expandedReels.push(reel);
                }
            }

            // Фильтр только видео
            const reelsOnly = expandedReels.filter((reel: any) => {
                let media = reel.media || reel;
                if (media?.media) media = media.media;

                if (!media || typeof media !== 'object') return false;

                const isPhoto = media.media_type === 1;
                const isCarousel = media.media_type === 8 || media.product_type === 'carousel_container';

                if (isPhoto || isCarousel) return false;

                return media.media_type === 2 ||
                    media.product_type === 'clips' ||
                    media.video_versions ||
                    media.video_url ||
                    media.video_duration > 0;
            });

            console.log(`   🎬 Filtered to ${reelsOnly.length} Reels from ${expandedReels.length} items`);
            allReels.push(...reelsOnly);
            console.log(`   📊 Total Reels: ${allReels.length}`);

            // Пагинация
            maxId = data.next_max_id || data.media_grid?.next_max_id || null;
            hasNextPage = !!(data.has_more || data.media_grid?.has_more || maxId);

            currentPage++;

            if (hasNextPage && currentPage <= maxPages) {
                await delay(2000);
            }
        }

        console.log(`\n✅ Pagination completed!`);
        console.log(`   Total Reels found: ${allReels.length}`);
        console.log(`   Method used: ${methodUsed}`);

        // Устанавливаем статус "analyze" - анализ видео
        const totalVideos = Math.min(allReels.length, maxReelsTotal);
        await SearchTaskModel.findByIdAndUpdate(searchTaskId, {
            status: 'analyze',
            totalVideos,
            processedVideos: 0,
            progress: 0
        });
        console.log(`🔍 Status: analyze`);

        // Обработка и сохранение
        console.log(`\n💾 Processing and saving Reels...`);

        // Устанавливаем статус "process" - обработка данных
        await SearchTaskModel.findByIdAndUpdate(searchTaskId, {
            status: 'process'
        });
        console.log(`⚙️ Status: process`);

        for (let i = 0; i < Math.min(allReels.length, maxReelsTotal); i++) {
            const node = allReels[i];

            try {
                const reels = processReel(node, cleanKeyword);

                if (!reels || !reels.owner.username || reels.owner.username === 'unknown') {
                    console.log(`   ⚠️  [${i + 1}/${allReels.length}] Skipping - no author`);

                    // Обновляем прогресс даже для пропущенных
                    const processedVideos = i + 1;
                    const progress = Math.round((processedVideos / totalVideos) * 100);
                    await SearchTaskModel.findByIdAndUpdate(searchTaskId, {
                        processedVideos,
                        progress
                    });
                    continue;
                }

                console.log(`\n   🎬 [${i + 1}/${allReels.length}] ${reels.shortcode}`);
                console.log(`      Author: @${reels.owner.username}`);
                console.log(`      Metrics: ${reels.views} views, ${reels.likes} likes, ${reels.comments} comments`);
                console.log(`      Published: ${reels.created_at}`);
                console.log(`      Viral Score: ${reels.viral_score}`);

                // НОВАЯ ПРОВЕРКА: фильтруем старые невирусные видео
                if (!shouldSaveVideo(reels)) {
                    // Обновляем прогресс для пропущенных
                    const processedVideos = i + 1;
                    const progress = Math.round((processedVideos / totalVideos) * 100);
                    await SearchTaskModel.findByIdAndUpdate(searchTaskId, {
                        processedVideos,
                        progress
                    });
                    continue;
                }

                const viralScore = reels.viral_score;
                const adDetection = detectAd(reels);

                const videoData = {
                    searchTaskId,
                    platform: 'instagram' as const,
                    videoId: reels.videoId,
                    url: reels.url,
                    videoUrl: reels.videoUrl,
                    previewUrl: reels.previewUrl,
                    author: reels.owner.username,
                    description: reels.caption,
                    publishedAt: new Date(reels.created_at),
                    views: reels.views,
                    likes: reels.likes,
                    comments: reels.comments,
                    growthPercent: 0,
                    viralScore,
                    isViral: viralScore > 50,
                    isAd: adDetection.isAd,
                    adScore: adDetection.adScore,
                    metricsHistory: [{
                        views: reels.views,
                        likes: reels.likes,
                        comments: reels.comments,
                        timestamp: new Date()
                    }]
                };

                await VideoModel.create(videoData);
                savedCount++;

                // Обновляем прогресс
                const processedVideos = i + 1;
                const progress = Math.round((processedVideos / totalVideos) * 100);
                await SearchTaskModel.findByIdAndUpdate(searchTaskId, {
                    processedVideos,
                    progress
                });

                console.log(`      ✅ Saved! Viral: ${viralScore}, Ad: ${adDetection.isAd} [${progress}%]`);

            } catch (error: any) {
                console.error(`      ❌ Error: ${error.message}`);

                // Обновляем прогресс даже при ошибке
                const processedVideos = i + 1;
                const progress = Math.round((processedVideos / totalVideos) * 100);
                await SearchTaskModel.findByIdAndUpdate(searchTaskId, {
                    processedVideos,
                    progress
                });
            }

            await delay(500);
        }

        // Устанавливаем статус "completed" - завершено
        await SearchTaskModel.findByIdAndUpdate(searchTaskId, {
            status: 'completed',
            progress: 100
        });
        console.log(`✅ Status: completed`);

        console.log(`\n🎉 Scraping completed!`);
        console.log(`   📊 Statistics:`);
        console.log(`      Total Reels found: ${allReels.length}`);
        console.log(`      Successfully saved: ${savedCount}`);
        console.log(`      Success rate: ${((savedCount / allReels.length) * 100).toFixed(1)}%`);

        const dbCount = await VideoModel.countDocuments({ searchTaskId });
        console.log(`   💾 Database: ${dbCount} Reels for this task`);

        return {
            status: 'success',
            savedCount,
            totalFetched: allReels.length,
            taskId: searchTaskId
        };

    } catch (error: any) {
        console.error('\n❌ Scraper error:', error.message);

        // Устанавливаем статус "failed" при ошибке
        await SearchTaskModel.findByIdAndUpdate(searchTaskId, {
            status: 'failed'
        });
        console.log(`❌ Status: failed`);

        throw error;
    }
}

// Функция обновления метрик
export async function updatePostMetrics(videoId: string) {
    try {
        const video = await VideoModel.findOne({ videoId });
        if (!video) {
            console.log(`⚠️  Video ${videoId} not found`);
            return null;
        }

        console.log(`🔄 Updating metrics for ${video.url}`);

        return {
            videoId,
            views: video.views,
            likes: video.likes,
            comments: video.comments,
            viralScore: video.viralScore
        };

    } catch (error: any) {
        console.error(`❌ Error updating metrics: ${error.message}`);
        return null;
    }
}