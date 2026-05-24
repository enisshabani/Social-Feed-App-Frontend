import pathlib

def replace_in_file(path, old, new):
    file = pathlib.Path(path)
    text = file.read_text(encoding='utf-8')
    if old in text:
        text = text.replace(old, new)
        file.write_text(text, encoding='utf-8')
    else:
        print(f"Failed to find target in {path}")

base = 'c:/Users/Pia/Desktop/SSH/Social-Feed-App-Frontend/src/modules/notifications/components/NotificationList.tsx'
replace_in_file(base, "import { NotificationItem } from './NotificationItem';", "import { NotificationItem } from './NotificationItem';\nimport { useLanguage } from '../../../context/LanguageContext';")
replace_in_file(base, "  const { notifications", "  const { t } = useLanguage();\n  const { notifications")
replace_in_file(base, "Notifications</h3>", "{t('nav_notifications')}</h3>")
replace_in_file(base, "No notifications yet", "{t('feed_empty_title')}")
