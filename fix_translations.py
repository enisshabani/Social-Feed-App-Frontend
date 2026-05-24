import json
import re

with open('c:/Users/Pia/Desktop/SSH/Social-Feed-App-Frontend/src/utils/translations.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix encoding
content = content.replace('Ã«', 'ë')
content = content.replace('Ã§', 'ç')
content = content.replace('Ã‡', 'Ç')
content = content.replace('Ã‹', 'Ë')

en_append = '''    nav_profile: "Profile",
    nav_notifications: "Notifications",
    create_post_placeholder: "What are you thinking?",
    create_post_publish: "Post",
    create_post_reply: "Reply",
    create_post_warning: "Write a content warning here...",
    create_post_media_image: "Image",
    create_post_media_video: "Video",
    create_post_media_upload: "Upload from PC",
    create_post_media_paste: "or paste a link above",
    create_post_visibility_public: "Public",
    create_post_visibility_private: "Followers only",
    create_post_visibility_unlisted: "Unlisted",
    create_post_alert_error: "Error creating post.",
    create_post_alert_invalid_url: "Please paste a valid http or https media URL.",
    create_post_alert_upload_error: "Could not upload that media file.",
    create_post_uploading: "Uploading...",
    sidebar_search: "Search posts...",
    sidebar_trending_title: "What\\'s happening",
    sidebar_trending_empty: "No trending hashtags at the moment.",
    sidebar_trend_meta: "Trending this week",
    sidebar_trend_count: "posts in the last 7 days",
    error_fetch_trends: "Error fetching trending hashtags:",
'''

sq_append = '''    nav_profile: "Profili",
    nav_notifications: "Njoftime",
    create_post_placeholder: "Çfarë po mendoni?",
    create_post_publish: "Publiko",
    create_post_reply: "Përgjigju",
    create_post_warning: "Shkruaj paralajmërimin këtu...",
    create_post_media_image: "Imazh",
    create_post_media_video: "Video",
    create_post_media_upload: "Ngarko nga PC",
    create_post_media_paste: "ose ngjit një link më lart",
    create_post_visibility_public: "Publik",
    create_post_visibility_private: "Vetëm Ndjekësit",
    create_post_visibility_unlisted: "Jo-publik",
    create_post_alert_error: "Gabim gjatë krijimit të postimit.",
    create_post_alert_invalid_url: "Ju lutem ngjitni një URL të vlefshme medieje (http ose https).",
    create_post_alert_upload_error: "Nuk mund të ngarkohej ky skedar medie.",
    create_post_uploading: "Duke ngarkuar...",
    sidebar_search: "Kërko postime...",
    sidebar_trending_title: "Çfarë po ndodh",
    sidebar_trending_empty: "Nuk ka asnjë hashtag trending momentalisht.",
    sidebar_trend_meta: "Më të përdorur këtë javë",
    sidebar_trend_count: "postime në 7 ditët e fundit",
    error_fetch_trends: "Gabim gjatë marrjes së hashtags trending:",
'''

content = content.replace('  sq: {', en_append + '\n  sq: {', 1)

# Find the very last brace before "};" and put sq_append there
idx = content.rfind('  }')
if idx != -1:
    content = content[:idx] + sq_append + content[idx:]

with open('c:/Users/Pia/Desktop/SSH/Social-Feed-App-Frontend/src/utils/translations.ts', 'w', encoding='utf-8') as f:
    f.write(content)
