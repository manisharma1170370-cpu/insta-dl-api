const axios = require("axios");

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.instagram.com/",
  "X-IG-App-ID": "936619743392459",
};

function buildCookies(sessionId) {
  if (!sessionId) return "";
  return `sessionid=${sessionId}; ds_user_id=0; csrftoken=token;`;
}

function urlToShortcode(url) {
  const match = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return match ? match[2] : null;
}

async function fetchViaGraphQL(shortcode, sessionId) {
  try {
    const graphUrl = `https://www.instagram.com/graphql/query/?query_hash=2efa04f61586458cef44441f474eee7a&variables={"shortcode":"${shortcode}"}`;
    const headers = { ...HEADERS };
    if (sessionId) headers["Cookie"] = buildCookies(sessionId);
    const res = await axios.get(graphUrl, { headers, timeout: 10000 });
    const media = res.data?.data?.shortcode_media;
    if (!media) return { success: false, error: "Media not found" };
    return parseGraphQLMedia(media);
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function fetchViaAPIv1(shortcode, sessionId) {
  try {
    const url = `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`;
    const headers = { ...HEADERS };
    if (sessionId) headers["Cookie"] = buildCookies(sessionId);
    const res = await axios.get(url, { headers, timeout: 10000 });
    const items = res.data?.items;
    if (!items || !items.length) return { success: false, error: "No items found" };
    return parseAPIv1Media(items[0]);
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function parseGraphQLMedia(media) {
  const result = {
    success: true,
    method: "graphql",
    type: media.__typename,
    shortcode: media.shortcode,
    caption: media.edge_media_to_caption?.edges?.[0]?.node?.text || "No caption",
    author: media.owner?.username || "unknown",
    likes: media.edge_media_preview_like?.count || 0,
    media: [],
  };

  if (media.__typename === "GraphImage") {
    result.media.push({ type: "photo", url: media.display_url });
  } else if (media.__typename === "GraphVideo") {
    result.media.push({ type: "video", url: media.video_url, thumbnail: media.display_url });
  } else if (media.__typename === "GraphSidecar") {
    const edges = media.edge_sidecar_to_children?.edges || [];
    edges.forEach((edge) => {
      const node = edge.node;
      if (node.__typename === "GraphVideo") {
        result.media.push({ type: "video", url: node.video_url, thumbnail: node.display_url });
      } else {
        result.media.push({ type: "photo", url: node.display_url });
      }
    });
  }
  return result;
}

function parseAPIv1Media(item) {
  const result = {
    success: true,
    method: "api_v1",
    type: item.media_type === 2 ? "video" : item.media_type === 8 ? "carousel" : "photo",
    caption: item.caption?.text || "No caption",
    author: item.user?.username || "unknown",
    media: [],
  };

  if (item.media_type === 1) {
    const best = item.image_versions2?.candidates?.[0];
    result.media.push({ type: "photo", url: best?.url });
  } else if (item.media_type === 2) {
    result.media.push({ type: "video", url: item.video_versions?.[0]?.url, thumbnail: item.image_versions2?.candidates?.[0]?.url });
  } else if (item.media_type === 8) {
    (item.carousel_media || []).forEach((m) => {
      if (m.media_type === 2) {
        result.media.push({ type: "video", url: m.video_versions?.[0]?.url });
      } else {
        result.media.push({ type: "photo", url: m.image_versions2?.candidates?.[0]?.url });
      }
    });
  }
  return result;
}

async function fetchStory(username, sessionId) {
  if (!sessionId) return { success: false, error: "Story ke liye sessionId zaroori hai" };
  try {
    const userRes = await axios.get(`https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
      headers: { ...HEADERS, Cookie: buildCookies(sessionId), "X-IG-App-ID": "936619743392459" },
      timeout: 10000,
    });
    const userId = userRes.data?.data?.user?.id;
    if (!userId) return { success: false, error: "User not found" };

    const storyRes = await axios.get(`https://i.instagram.com/api/v1/feed/reels_media/?reel_ids=${userId}`, {
      headers: { ...HEADERS, Cookie: buildCookies(sessionId), "X-IG-App-ID": "936619743392459" },
      timeout: 10000,
    });
    const reel = storyRes.data?.reels_media?.[0];
    if (!reel || !reel.items?.length) return { success: false, error: "No active stories found" };

    const stories = reel.items.map((item) => {
      if (item.media_type === 2) return { type: "video", url: item.video_versions?.[0]?.url, thumbnail: item.image_versions2?.candidates?.[0]?.url };
      return { type: "photo", url: item.image_versions2?.candidates?.[0]?.url };
    });
    return { success: true, username, count: stories.length, stories };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function fetchHighlights(username, sessionId) {
  if (!sessionId) return { success: false, error: "Highlights ke liye sessionId zaroori hai" };
  try {
    const userRes = await axios.get(`https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
      headers: { ...HEADERS, Cookie: buildCookies(sessionId), "X-IG-App-ID": "936619743392459" },
      timeout: 10000,
    });
    const userId = userRes.data?.data?.user?.id;
    if (!userId) return { success: false, error: "User not found" };

    const hlRes = await axios.get(`https://i.instagram.com/api/v1/highlights/${userId}/highlights_tray/`, {
      headers: { ...HEADERS, Cookie: buildCookies(sessionId), "X-IG-App-ID": "936619743392459" },
      timeout: 10000,
    });
    const tray = hlRes.data?.tray || [];
    const highlights = tray.map((h) => ({ id: h.id, title: h.title, cover: h.cover_media?.cropped_image_version?.url, media_count: h.media_count }));
    return { success: true, username, count: highlights.length, highlights };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function fetchHighlightMedia(highlightId, sessionId) {
  if (!sessionId) return { success: false, error: "sessionId zaroori hai" };
  try {
    const res = await axios.get(`https://i.instagram.com/api/v1/feed/reels_media/?reel_ids=highlight:${highlightId}`, {
      headers: { ...HEADERS, Cookie: buildCookies(sessionId), "X-IG-App-ID": "936619743392459" },
      timeout: 10000,
    });
    const reel = res.data?.reels_media?.[0];
    if (!reel) return { success: false, error: "Highlight not found" };
    const media = (reel.items || []).map((item) => {
      if (item.media_type === 2) return { type: "video", url: item.video_versions?.[0]?.url };
      return { type: "photo", url: item.image_versions2?.candidates?.[0]?.url };
    });
    return { success: true, title: reel.title, count: media.length, media };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function fetchProfile(username, sessionId) {
  try {
    const headers = { ...HEADERS, "X-IG-App-ID": "936619743392459" };
    if (sessionId) headers["Cookie"] = buildCookies(sessionId);
    const res = await axios.get(`https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`, { headers, timeout: 10000 });
    const user = res.data?.data?.user;
    if (!user) return { success: false, error: "User not found" };
    return {
      success: true,
      profile: {
        id: user.id, username: user.username, full_name: user.full_name,
        bio: user.biography, followers: user.edge_followed_by?.count,
        following: user.edge_follow?.count, posts: user.edge_owner_to_timeline_media?.count,
        is_private: user.is_private, is_verified: user.is_verified,
        profile_pic: user.profile_pic_url_hd || user.profile_pic_url,
      },
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function downloadMedia(url, sessionId) {
  const shortcode = urlToShortcode(url);
  if (!shortcode) return { success: false, error: "Invalid Instagram URL" };

  let result = await fetchViaGraphQL(shortcode, sessionId);
  if (result.success && result.media?.length > 0) return result;

  result = await fetchViaAPIv1(shortcode, sessionId);
  if (result.success && result.media?.length > 0) return result;

  return { success: false, error: "Sabhi methods fail ho gaye. Session ID add karo." };
}

module.exports = { downloadMedia, fetchStory, fetchHighlights, fetchHighlightMedia, fetchProfile, urlToShortcode };
