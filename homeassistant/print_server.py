from flask import Flask, request
import requests
from escpos.printer import Usb
from datetime import datetime
import locale
import pytz

# Configure local to display date in French
locale.setlocale(locale.LC_TIME, 'fr_FR.UTF-8')


# Configure printer with the USB port of your printer
p = Usb(0x2730, 0x200f, 0, 0x81, 0x02)
app = Flask(__name__)

# URL de l'API et le token
# Configure Home Assitant URL and Long-Lived Access Token
api_url = "https://<YOUR HOME ASSISTANT URL>/api/shopping_list"
headers = {
    "Authorization": "Bearer <YOUR HOME ASSISTANT LONG-LIVE TOKEN>",
    "Content-Type": "application/json"
}

def fetch_shopping_list():
    response = requests.get(api_url, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print("Liste de course vide ou erreur lors de la récupération.")
        return []

def format_shopping_list(shopping_list):
    local_tz = pytz.timezone('Europe/Paris')
    now = datetime.now(local_tz)  

    today = now.strftime("%A %d %B %Y")
    current_time = now.strftime("%H:%M")  

    # Header with larger (A) and centered characters
    p.set(align='center', text_type='A', width=2, height=2)
    formatted_list = f"Liste de Course\n=== {today} à {current_time} ===\n\n"
    
    # Normal characters (B) for the list body
    p.set(text_type='B', width=1, height=1)
    for idx, item in enumerate(shopping_list, start=1):
        status = "[ ]" if not item["complete"] else "[X]"
        formatted_list += f"{idx}- {item['name']:<40} {status}\n"

    # Footer
    p.set(align='center', text_type='C')
    formatted_list += "\n=== Bon shopping ! ===\n"

    return formatted_list

def print_shopping_list():

    p.codepage = 'CP850'

    shopping_list = fetch_shopping_list()
    
    if shopping_list:
        
        formatted_list = format_shopping_list(shopping_list)
        
        try:
            encoded_text = formatted_list.encode('cp850', errors='replace').decode('cp850')
        except UnicodeEncodeError:
            encoded_text = formatted_list.encode('utf-8', errors='replace').decode('utf-8')
        
        p.text(encoded_text)
        p.cut()
        return "Printed successfully", 200
    else:
        p.text("Liste Vide")
        p.cut()
        return "Failed to fetch shopping list", 500

@app.route('/')
def index():
    return 'Your Flask server is working!'

@app.route('/print', methods=['GET'])
def handle_print():
    return print_shopping_list()

@app.route('/list', methods=['GET'])
def display_list():
    shopping_list = fetch_shopping_list()
    if shopping_list:
        formatted_list = format_shopping_list(shopping_list)
        return f"<pre>{formatted_list}</pre>", 200
    else:
        return "Liste vide ou erreur lors de la récupération de la liste.", 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')