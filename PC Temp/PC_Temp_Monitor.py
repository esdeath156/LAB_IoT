import requests
import time
import os
from dotenv import load_dotenv

load_dotenv()

LHM_URL = "http://localhost:8085/data.json"
THINGSPEAK_URL = "https://api.thingspeak.com/update"

THINGSPEAK_API_KEY = os.getenv("THINGSPEAK_API_KEY")

INTERVAL = 10  # Mittausväli sekunteina


# TARKISTETAAN API-AVAIN
if not THINGSPEAK_API_KEY:
    print("Virhe: THINGSPEAK_API_KEY puuttuu .env-tiedostosta.")
    exit()


# LÄMPÖTILAN MUUTTAMINEN NUMEROKSI
def clean_temperature(value):
    """
    Muuttaa esimerkiksi:
        '48.0 °C'
    muotoon:
        48.0

    Jos arvoa ei voida lukea, palautetaan None.
    """

    if value is None or value == "-":
        return None

    try:
        value = value.replace("°C", "").strip()
        return float(value)

    except (ValueError, AttributeError):
        return None


# LHM SENSORIEN ETSIMINEN

def find_temperatures(node):
    temperatures = {}

    for child in node.get("Children", []):

        sensor_type = child.get("Type")
        name = child.get("Text")
        value = child.get("Value")

        # Tarkistetaan, onko kyseessä lämpötilasensori
        if sensor_type == "Temperature" and value not in ("-", None):

            # CPU
            if name in (
                "CPU Package",
                "CPU Total",
                "CPU",
            ):
                temperatures["CPU"] = value

            # GPU
            elif name in (
                "GPU Core",
                "GPU Temperature",
                "GPU Hot Spot",
            ):
                temperatures["GPU"] = value


        # Etsitään myös tämän noden Children-kohdista
        temperatures.update(find_temperatures(child))

    return temperatures


# OHJELMA
print(" LHM -> ThingSpeak")
print("Ohjelma käynnistetty.")
print(f"Mittausväli: {INTERVAL} sekuntia")
print()


while True:
    try:
        # Haetaan data LHM:ltä
        response = requests.get(
            LHM_URL,
            timeout=5
        )

        response.raise_for_status()

        data = response.json()

        # Etsitään lämpötila datasta
        temperatures = find_temperatures(data)

        cpu_temp = clean_temperature(
            temperatures.get("CPU")
        )

        gpu_temp = clean_temperature(
            temperatures.get("GPU")
        )

        # Tulostetaan mittaukset
        print(
            f"CPU: {cpu_temp} °C | "
            f"GPU: {gpu_temp} °C"
        )

        # LÄHETETÄÄN THINGSPEAKIIN
        payload = {
            "api_key": THINGSPEAK_API_KEY,
            "field1": cpu_temp,
            "field3": gpu_temp
        }

        result = requests.get(
            THINGSPEAK_URL,
            params=payload,
            timeout=5
        )

        result.raise_for_status()


        # THINGSPEAKIN VASTAUS
        print(
            f"ThingSpeak OK - Entry ID: {result.text}"
        )

        print()

    except requests.RequestException as e:

        print(f"Verkkovirhe: {e}")
        print()


    except Exception as e:

        print(f"Muu virhe: {e}")
        print()

    # ODOTETAAN ENNEN SEURAAVAA MITTAUSTA
    time.sleep(INTERVAL)