import os
import sys
import json
import urllib.request
import urllib.error

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')


def load_env():
    env_vars = {}
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    env_vars[k.strip()] = v.strip()
    return env_vars

def main():
    env = load_env()
    token = env.get('LINE_CHANNEL_ACCESS_TOKEN')
    liff_url = env.get('LINE_LIFF_URL', 'https://liff.line.me/2011201138-KcIxX5q1')
    fastwork_url = env.get('FASTWORK_PROFILE_URL', 'https://fastwork.co/user/toddev/shop-and-page-admin-25924850')

    if not token:
        print("❌ Error: LINE_CHANNEL_ACCESS_TOKEN is missing in .env")
        return

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    # 1. Clean up old rich menus if any
    print("🔍 1. Checking existing rich menus...")
    try:
        req = urllib.request.Request('https://api.line.me/v2/bot/richmenu/list', headers=headers, method='GET')
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode('utf-8'))
            menus = data.get('richmenus', [])
            print(f"   Found {len(menus)} existing menus.")
            for m in menus:
                mid = m['richMenuId']
                print(f"   🗑️ Deleting old rich menu: {mid} ({m.get('name')})")
                del_req = urllib.request.Request(f'https://api.line.me/v2/bot/richmenu/{mid}', headers=headers, method='DELETE')
                with urllib.request.urlopen(del_req) as del_res:
                    pass
    except Exception as e:
        print(f"   ⚠️ Cleanup warning: {e}")

    # 2. Define Rich Menu structure (Hero Layout: 1 Top Banner + 3 Bottom Buttons)
    # Total canvas: 2500 x 1686
    rich_menu_data = {
        "size": {
            "width": 2500,
            "height": 1686
        },
        "selected": True,
        "name": "ZynCoder_Main_Menu_v3",
        "chatBarText": "เมนูหลัก 🚀",
        "areas": [
            # โซน A: ครึ่งบน (แบนเนอร์ใหญ่) -> ปรึกษาและประเมินราคาระบบฟรี
            {
                "bounds": {
                    "x": 0,
                    "y": 0,
                    "width": 2500,
                    "height": 843
                },
                "action": {
                    "type": "message",
                    "text": "ประเมินราคาระบบ"
                }
            },
            # โซน B: ครึ่งล่างซ้าย -> บริการทั้งหมด
            {
                "bounds": {
                    "x": 0,
                    "y": 843,
                    "width": 833,
                    "height": 843
                },
                "action": {
                    "type": "message",
                    "text": "ดูบริการทั้งหมด"
                }
            },
            # โซน C: ครึ่งล่างกลาง -> ทดลอง Demo & LIFF
            {
                "bounds": {
                    "x": 833,
                    "y": 843,
                    "width": 834,
                    "height": 843
                },
                "action": {
                    "type": "uri",
                    "uri": liff_url
                }
            },
            # โซน D: ครึ่งล่างขวา -> ติดต่อทีมงาน / Fastwork
            {
                "bounds": {
                    "x": 1667,
                    "y": 843,
                    "width": 833,
                    "height": 843
                },
                "action": {
                    "type": "uri",
                    "uri": fastwork_url
                }
            }
        ]
    }

    # 3. Create Rich Menu Object
    print("\n🚀 2. Creating new Rich Menu object on LINE API...")
    req = urllib.request.Request(
        'https://api.line.me/v2/bot/richmenu',
        data=json.dumps(rich_menu_data).encode('utf-8'),
        headers=headers,
        method='POST'
    )
    with urllib.request.urlopen(req) as res:
        res_data = json.loads(res.read().decode('utf-8'))
        rich_menu_id = res_data['richMenuId']
        print(f"   ✅ Created Rich Menu ID: {rich_menu_id}")

    # 4. Upload Image
    img_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'zyncoder_richmenu_2500x1686.jpg')
    print(f"\n🖼️ 3. Uploading Rich Menu image ({img_path})...")
    with open(img_path, 'rb') as f:
        img_bytes = f.read()

    upload_headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'image/jpeg'
    }
    upload_req = urllib.request.Request(
        f'https://api-data.line.me/v2/bot/richmenu/{rich_menu_id}/content',
        data=img_bytes,
        headers=upload_headers,
        method='POST'
    )
    with urllib.request.urlopen(upload_req) as res:
        print("   ✅ Image uploaded successfully!")

    # 5. Set as Default Rich Menu for all users
    print(f"\n⭐ 4. Setting Rich Menu as default for all users...")
    set_default_req = urllib.request.Request(
        f'https://api.line.me/v2/bot/user/all/richmenu/{rich_menu_id}',
        headers={'Authorization': f'Bearer {token}'},
        method='POST'
    )
    with urllib.request.urlopen(set_default_req) as res:
        print("   ✅ Set as Default Rich Menu successfully 100%!")

    print("\n🎉 SUCCESS! Rich Menu is now LIVE on your LINE OA (@295mqpfk)!")

if __name__ == '__main__':
    main()
